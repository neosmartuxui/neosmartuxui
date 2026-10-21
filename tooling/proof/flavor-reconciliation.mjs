import { createHash } from 'node:crypto';
import { FLAVORS } from './cohort-coverage.mjs';

export const shaPattern = /^[a-f0-9]{40}$/;
export const gitBlobSha = bytes => createHash('sha1')
  .update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
const rebrand = old => old.replaceAll('NeoSmartUI', 'NeoSmartUXUI');
export function reconcileBinding({ subject, entry, current, previous, maintenance }) {
  if (!entry || !shaPattern.test(entry.blobSha) || !Buffer.isBuffer(current)) {
    throw new Error(`${subject} invalid or unreadable proof-bound implementation file`);
  }
  const now = gitBlobSha(current);
  if (now === entry.blobSha) {
    return { path: entry.path, historicalBlobSha: entry.blobSha,
      currentBlobSha: now, admission: 'REFERENCE', classification: 'unchanged' };
  }
  const flavor = subject.replace(/^flavor\./,'');
  if (subject !== 'flavor.' + flavor || !FLAVORS.includes(flavor)) {
    throw new Error(`${subject} changed historical Core implementation bytes: ${entry.path}`);
  }
  const maintenanceEntries = maintenance?.implementationFiles || [];
  const authorizedMaintenance = maintenanceEntries.some(x =>
    x.path === entry.path && x.provenBlobSha === entry.blobSha);
  const themePath = new RegExp(`^packages/themes/${flavor}-(light|dark)/(resolution|tokens)\\.json$`);
  if (authorizedMaintenance && themePath.test(entry.path)) {
    return { path: entry.path, historicalBlobSha: entry.blobSha,
      currentBlobSha: now, admission: 'ADAPT',
      classification: 'maintenance-declared-theme-expansion',
      priorBlobContentAvailable: !!previous,
      assurance: 'current-theme-qa-required; historical prior bytes not inferred' };
  }
  if (authorizedMaintenance) throw new Error(`${subject} maintenance declares unrecognized path ${entry.path}`);
  if (!Buffer.isBuffer(previous) || gitBlobSha(previous) !== entry.blobSha) {
    throw new Error(`${subject} undocumented historical drift lacks verified original bytes at ${entry.path}`);
  }
  const oldText = previous.toString('utf8');
  const newText = current.toString('utf8');
  const flavorPage = entry.path === `apps/foundry/src/flavors/${flavor}/index.html`;
  const builder = entry.path === (flavor === 'hardline'
    ? 'tooling/foundry/build.mjs' : `tooling/foundry/assemble-${flavor}-dark.mjs`);
  if (!flavorPage && !builder) throw new Error(`${subject} unexpected proof-bound path ${entry.path}`);
  if (flavorPage || (builder && flavor !== 'hardline')) {
    if (oldText === rebrand(oldText) || rebrand(oldText) !== newText) {
      throw new Error(`${subject} unrecognized rebrand diff in ${entry.path}`);
    }
  } else {
    const translated = rebrand(oldText)
      .replace("process.env.NEOSMARTUI_SOURCE_SHA || process.env.GITHUB_SHA || 'local-unpinned'",
        "(process.env.NEOSMARTUXUI_SOURCE_SHA || process.env.NEOSMARTUI_SOURCE_SHA) || process.env.GITHUB_SHA || 'local-unpinned'")
      .replace("schema: 'neosmartui/deployment-record@1'", "schema: 'neosmartuxui/deployment-record@1'")
      .replace("sourceRepository: 'neosmartui/neosmartui'", "sourceRepository: 'neosmartuxui/neosmartuxui'");
    if (translated !== newText) throw new Error(`${subject} non-identity change in Foundry builder`);
  }
  return { path: entry.path, historicalBlobSha: entry.blobSha, currentBlobSha: now,
    admission: 'ADAPT', classification: 'verified-brand-host-migration',
    priorBlobContentAvailable: true, assurance: 'verified-original_blob-and-exact_transform' };
}
export function validateFlavorMaintenance({subject, record, maintenance, bindings, proofRecordBlobSha}) {
  if (!subject.startsWith('flavor.')) throw new Error('Not a Flavor');
  if (!maintenance || maintenance.flavor !== subject ||
      maintenance.schema !== 'neosmartui/public-proof-maintenance@1') {
    throw new Error(`${subject} missing historic exact-set Flavor maintenance anchor`);
  }
  if (maintenance.proofRecord?.path !== `evidence/public/${subject}.json` ||
      maintenance.proofRecord.blobSha !== proofRecordBlobSha) {
    throw new Error(`${subject} historical maintenance record anchor mismatch`);
  }
  const old = new Map(record.implementationFiles.map(x => [x.path, x.blobSha]));
  const declared = maintenance.implementationFiles.map(x => x.path).sort();
  const actual = bindings.filter(x => x.classification === 'maintenance-declared-theme-expansion')
    .map(x => x.path).sort();
  if (declared.length !== 4 || JSON.stringify(actual) !== JSON.stringify(declared) ||
      maintenance.implementationFiles.some(x => old.get(x.path) !== x.provenBlobSha)) {
    throw new Error(`${subject} historical Theme maintenance does not match exact four protected Theme paths`);
  }
  const rebrandFiles = bindings.filter(x => x.classification === 'verified-brand-host-migration');
  if (rebrandFiles.length !== 2) throw new Error(`${subject} must account for exact two verified rebrand paths`);
  if (bindings.some(x => !['unchanged','maintenance-declared-theme-expansion','verified-brand-host-migration']
    .includes(x.classification))) throw new Error(`${subject} has unrecognized current binding provenance`);
  return { subject, historicalAnchor: proofRecordBlobSha, declaredMaintenance: declared,
    verifiedRebrandPaths: rebrandFiles.map(x => x.path).sort(),
    priorThemeBytesUnverified: actual, decision: 'ADAPT',
    verificationRequired: ['50-Core/55-token Theme resolution','5-Flavor Light/Dark Chromium',
      'exact-current-host-assets','single-deployment-cohort'] };
}
