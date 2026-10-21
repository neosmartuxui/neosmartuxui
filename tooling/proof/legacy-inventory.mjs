import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname, relative, isAbsolute, sep } from 'node:path';
import { gitBlobSha } from '../validators/public-proof-bindings.mjs';

const root = resolve(import.meta.dirname, '../..');
const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const anchoredPath = (rel) => {
  if (typeof rel !== 'string' || !rel || rel.includes('\\') || rel.split('/').some(x => x === '..' || !x) || isAbsolute(rel)) {
    throw new Error('Invalid legacy proof path: ' + rel);
  }
  const absolute = resolve(root, rel);
  if (relative(root, absolute).startsWith('..' + sep)) throw new Error('Legacy proof path escapes source: ' + rel);
  return absolute;
};
const proofDirectory = resolve(root, 'evidence/public');
const maintenanceDirectory = resolve(root, 'evidence/maintenance');
const maintenance = new Map();
for (const filename of (await readdir(maintenanceDirectory)).filter(name => name.endsWith('.json'))) {
  const record = await readJson(resolve(maintenanceDirectory, filename));
  maintenance.set(record.component || record.flavor, { filename, record });
}
const subjects = [];
for (const filename of (await readdir(proofDirectory)).filter(name => name.endsWith('.json')).sort()) {
  const bytes = await readFile(resolve(proofDirectory, filename));
  const proof = JSON.parse(bytes.toString('utf8'));
  const subject = proof.component || proof.flavor;
  const oldBindings = proof.implementationFiles || [];
  const mismatches = [];
  for (const entry of oldBindings) {
    const present = await readFile(anchoredPath(entry.path)).catch(() => null);
    const current = present ? gitBlobSha(present) : null;
    if (current !== entry.blobSha) mismatches.push({ path: entry.path, provenBlobSha: entry.blobSha, currentBlobSha: current });
  }
  const active = maintenance.get(subject)?.record;
  const declared = (active?.implementationFiles || []).map(x => x.path).sort();
  const actual = mismatches.map(x => x.path).sort();
  const proofRecordAnchorValid = !active || active.proofRecord?.blobSha === gitBlobSha(bytes);
  subjects.push({ subject, historicalRecord: 'evidence/public/' + filename,
    historicalRepository: proof.deployedSource?.repository,
    historicalHost: proof.live?.deploymentRecordUrl,
    historicalSourceSha: proof.deployedSource?.sha,
    maintenance: active ? 'evidence/maintenance/' + maintenance.get(subject).filename : null,
    proofRecordAnchorValid,
    mismatches,
    maintenanceExactSetMatches: active ? JSON.stringify(actual) === JSON.stringify(declared) : mismatches.length === 0,
    undeclaredPaths: actual.filter(path => !declared.includes(path)),
    obsoleteDeclaredPaths: declared.filter(path => !actual.includes(path)) });
}
const result = { schema: 'neosmartuxui/legacy-proof-inventory@1',
  status: 'historical-only-do-not-promote',
  oldRecordCount: subjects.length,
  componentCount: subjects.filter(x => x.subject.startsWith('core.')).length,
  flavorCount: subjects.filter(x => x.subject.startsWith('flavor.')).length,
  recordsWithDrift: subjects.filter(x => x.mismatches.length > 0).length,
  maintenanceDiscrepancies: subjects.filter(x => !x.maintenanceExactSetMatches || !x.proofRecordAnchorValid).map(x => x.subject),
  subjects };
const output = resolve(root, 'artifacts/proof/legacy-proof-inventory.json');
await mkdir(dirname(output), { recursive: true });
await writeFile(output, JSON.stringify(result, null, 2) + '\n');
console.log(`[legacy-proof-audit] ${result.oldRecordCount} historical records (${result.componentCount} Core, ${result.flavorCount} Flavors); ${result.recordsWithDrift} implementation-bound drifts; ${result.maintenanceDiscrepancies.length} maintenance/anchor discrepancies`);
for (const s of subjects.filter(x => !x.maintenanceExactSetMatches || !x.proofRecordAnchorValid)) {
  console.log(`  REVIEW ${s.subject}: undeclared=[${s.undeclaredPaths.join(', ')}], obsolete=[${s.obsoleteDeclaredPaths.join(', ')}], anchor=${s.proofRecordAnchorValid}`);
}
console.log(`[legacy-proof-audit] inventory: ${output}`);
