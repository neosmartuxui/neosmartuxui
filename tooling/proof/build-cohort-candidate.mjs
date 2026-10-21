import { execFileSync } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve, relative, isAbsolute, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { coverageFor, verifyEntireCohortCoverage, FLAVORS } from './cohort-coverage.mjs';
import { gitBlobSha, reconcileBinding, validateFlavorMaintenance } from './flavor-reconciliation.mjs';
import { SOURCE_REPOSITORY, sha256, checkPlaywrightReport } from './current-host-contract.mjs';

const root = resolve(import.meta.dirname, '../..');
const git = (...args) => execFileSync('git', ['-C', root, ...args],
  { encoding: 'utf8', timeout: 20000 }).trim();
const readJson = async rel => JSON.parse(await readFile(resolve(root, rel), 'utf8'));
const safePath = rel => {
  if (!rel || typeof rel !== 'string' || isAbsolute(rel) ||
      rel.includes('\\') || rel.split('/').some(part => !part || part === '..' || part === '.')) {
    throw new Error('Refusing unsafe proof path: ' + rel);
  }
  const absolute = resolve(root, rel);
  const back = relative(root, absolute);
  if (back === '..' || back.startsWith('..' + sep) || isAbsolute(back)) {
    throw new Error('Proof path escapes repository: ' + rel);
  }
  return absolute;
};
const sha = git('rev-parse', 'HEAD');
const dirty = !!git('status', '--porcelain');
const registry = await readJson('packages/core/component-registry.json');
const admitted = registry.components.filter(x => x.maturity === 'public-proof');
if (admitted.length !== 49 ||
    registry.components.length !== 50 ||
    registry.components.find(x => x.id === 'core.description-list')?.maturity !== 'implemented') {
  throw new Error('Core membership drift; 49 historic public-proof and implemented Description List required');
}
const browserBytes = await readFile(resolve(root, 'artifacts/browser/report.json')).catch(() => null);
const report = browserBytes ? JSON.parse(browserBytes.toString('utf8')) : null;
const browserReasons = checkPlaywrightReport(report, {label:'foundry', minTests:415,
  requiredFile:'foundry-core-description-list.spec.mjs', requiredTests:8});
const subjects = [];
const flavorReconciliations = [];
const expectedSubjects = [...admitted.map(x => x.id), ...FLAVORS.map(x => 'flavor.' + x)];
for (const id of expectedSubjects) {
  const legacyPath = `evidence/public/${id}.json`;
  const legacyBytes = await readFile(safePath(legacyPath));
  const previous = JSON.parse(legacyBytes.toString('utf8'));
  if ((previous.component || previous.flavor) !== id ||
      previous.schema !== 'neosmartui/public-proof@1' ||
      previous.deployedSource?.repository !== 'neosmartui/neosmartui') {
    throw new Error(`${id} historical proof record is not source-authentic`);
  }
  const isFlavor = id.startsWith('flavor.');
  const maintenance = isFlavor ? await readJson(`evidence/maintenance/${id}.json`) : null;
  const bindings = [];
  for (const entry of previous.implementationFiles) {
    const current = await readFile(safePath(entry.path));
    let oldBlob = null;
    if (gitBlobSha(current) !== entry.blobSha) {
      try { oldBlob = execFileSync('git', ['-C', root, 'cat-file', 'blob', entry.blobSha],
        { timeout: 10000, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 20000000 }); }
      catch { /* historical Theme bytes are not present in the restored Git object store */ }
    }
    bindings.push(reconcileBinding({ subject:id, entry, current, previous:oldBlob, maintenance }));
  }
  const evidence = coverageFor(report, id);
  subjects.push({ id, kind: isFlavor ? 'flavor' : 'core',
    historical: { recordPath: legacyPath, recordBlobSha: gitBlobSha(legacyBytes),
      sourceSha: previous.deployedSource.sha,
      oldDeploymentSha: previous.deployment?.commitSha },
    bindings, browserCoverage: evidence });
  if (isFlavor) flavorReconciliations.push(validateFlavorMaintenance({
    subject: id, record:previous, maintenance, bindings,
    proofRecordBlobSha:gitBlobSha(legacyBytes) }));
}
const summary = verifyEntireCohortCoverage(report, subjects);
const classifications = {};
for (const s of subjects) for (const b of s.bindings) {
  classifications[b.classification] = (classifications[b.classification] || 0) + 1;
}
const digest = createHash('sha256').update(JSON.stringify(subjects)).digest('hex');
const candidate = {
  schema: 'neosmartuxui/proof-cohort-candidate@1',
  status: 'UNVERIFIED-CANDIDATE-NOT-PUBLIC-PROOF',
  source: { repository:SOURCE_REPOSITORY, sha, originMain:git('rev-parse','origin/main'),
    mergedAndClean:!dirty && sha === git('rev-parse','origin/main') },
  oldHost: 'https://neosmartui.github.io/',
  proposedHost: 'https://neosmartuxui.github.io/foundry/',
  evidence: { historicProofRecords:54, browserReportSha256:browserBytes ? sha256(browserBytes) : null,
    browserReportSourceShaVerified:false, browserReportReasons:browserReasons,
    cohortBrowserCoverageComplete:summary.passed,
    cohortDigest:'sha256:' + digest },
  counts: { core:admitted.length, flavors:FLAVORS.length,
    total:subjects.length, classifications },
  subjects, flavorReconciliations,
  readyForPublicProof: false,
  nextGate: 'Require exact-SHA merged-main local Chromium attestation, source-identical deployed Foundry, 54-subject live contract, and proof-only promotion.'
};
if (subjects.length !== 54 || new Set(subjects.map(s => s.id)).size !== 54 ||
    flavorReconciliations.length !== 5 || browserReasons.length || !summary.passed) {
  throw new Error('Current-host cohort candidate incomplete or lacks required subject-level browser coverage');
}
const out = resolve(root, 'artifacts/proof/current-host-cohort-candidate.json');
await mkdir(dirname(out), { recursive:true });
await writeFile(out, JSON.stringify(candidate,null,2)+'\n');
console.log('[cohort] EXACT 49 Core + 5 Flavors; all 54 subject browser coverage mappings present');
console.log('[cohort] bindings '+JSON.stringify(classifications));
console.log('[cohort] original-blob anchored rebrand paths 10; maintenance-declared Theme paths 20');
console.log('[cohort] candidate SOURCE='+sha+'; mergedAndClean='+candidate.source.mergedAndClean);
console.log('[cohort] browser report does not carry source SHA; candidate is NOT current-host public proof');
console.log('[cohort] saved '+out);
