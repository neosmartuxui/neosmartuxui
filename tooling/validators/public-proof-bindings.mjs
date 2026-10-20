import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';

const componentPattern = /^(?!flavor\.|vertical\.)[a-z][a-z0-9-]*\.(?!block\.|page\.)[a-z][a-z0-9-]*$/;
const flavorPattern = /^flavor\.[a-z][a-z0-9-]*$/;
const shaPattern = /^[0-9a-f]{40}$/;
const issuePattern = /^https:\/\/github\.com\/neosmartui\/neosmartui\/issues\/[1-9][0-9]*$/;
const proofPathPattern = /^evidence\/public\/(?:core\.[a-z][a-z0-9-]*|flavor\.[a-z][a-z0-9-]*)\.json$/;

export const gitBlobSha = (bytes) => createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');

const exactKeys = (value, expected, fail, label) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${label} must be an object`);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.join('|') !== wanted.join('|')) fail(`${label} has unexpected shape: ${actual.join(', ')}`);
};

const safeRepoPath = (root, path, fail, label) => {
  if (typeof path !== 'string' || path.length === 0 || isAbsolute(path) || path.includes('\\') || path.includes('\0')) fail(`${label} must be a repository-relative POSIX path`);
  const segments = path.split('/');
  if (segments.some((segment) => segment === '' || segment === '.' || segment === '..')) fail(`${label} escapes or ambiguously addresses the repository`);
  const absolute = resolve(root, path);
  const rel = relative(root, absolute);
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) fail(`${label} escapes the repository`);
  return absolute;
};

const validateRecordShape = (record, fileName, fail) => {
  if (!record || typeof record !== 'object' || Array.isArray(record)) fail(`${fileName} must contain an object`);
  const hasComponent = Object.prototype.hasOwnProperty.call(record, 'component');
  const hasFlavor = Object.prototype.hasOwnProperty.call(record, 'flavor');
  if (hasComponent === hasFlavor) fail(`${fileName} must declare exactly one component or flavor subject`);
  const subject = hasComponent ? record.component : record.flavor;
  if (hasComponent && !componentPattern.test(subject)) fail(`${fileName} has invalid component subject`);
  if (hasFlavor && !flavorPattern.test(subject)) fail(`${fileName} has invalid flavor subject`);
  exactKeys(record, ['$schema', 'schema', hasComponent ? 'component' : 'flavor', 'trackingIssue', 'proofRecord', 'implementationFiles'], fail, fileName);
  if (record.$schema !== '../../spec/schemas/public-proof-maintenance.schema.json') fail(`${fileName} has unexpected $schema`);
  if (record.schema !== 'neosmartui/public-proof-maintenance@1') fail(`${fileName} has unexpected schema identity`);
  if (!issuePattern.test(record.trackingIssue)) fail(`${fileName} has invalid trackingIssue`);
  exactKeys(record.proofRecord, ['path', 'blobSha'], fail, `${fileName}.proofRecord`);
  if (!proofPathPattern.test(record.proofRecord.path) || !shaPattern.test(record.proofRecord.blobSha)) fail(`${fileName} has invalid proofRecord binding`);
  if (!Array.isArray(record.implementationFiles) || record.implementationFiles.length === 0) fail(`${fileName} must declare at least one implementation file`);
  const declared = new Set();
  for (const [index, entry] of record.implementationFiles.entries()) {
    exactKeys(entry, ['path', 'provenBlobSha'], fail, `${fileName}.implementationFiles[${index}]`);
    if (!shaPattern.test(entry.provenBlobSha)) fail(`${fileName} has invalid provenBlobSha for ${entry.path}`);
    if (declared.has(entry.path)) fail(`${fileName} duplicates implementation path ${entry.path}`);
    declared.add(entry.path);
  }
  if (fileName !== `${subject}.json`) fail(`${fileName} must be named ${subject}.json`);
  if (record.proofRecord.path !== `evidence/public/${subject}.json`) fail(`${fileName} proofRecord path must bind its own public proof record`);
  return subject;
};

export async function loadPublicProofMaintenance({ root, fail }) {
  const directory = resolve(root, 'evidence/maintenance');
  let names;
  try {
    names = await readdir(directory);
  } catch (error) {
    if (error?.code === 'ENOENT') return new Map();
    throw error;
  }
  const records = new Map();
  for (const name of names.sort()) {
    if (!name.endsWith('.json')) fail(`unexpected maintenance evidence entry ${name}`);
    const record = JSON.parse(await readFile(resolve(directory, name), 'utf8'));
    const subject = validateRecordShape(record, name, fail);
    if (records.has(subject)) fail(`duplicate maintenance record for ${subject}`);
    records.set(subject, record);
  }
  return records;
}

export async function validatePublicProofBindings({ root, subject, proofPath, proof, maintenanceRecords, fail }) {
  const proofAbsolute = safeRepoPath(root, proofPath, fail, `${subject} proof path`);
  const proofBytes = await readFile(proofAbsolute);
  const proofRecordBlobSha = gitBlobSha(proofBytes);
  if (!Array.isArray(proof.implementationFiles) || proof.implementationFiles.length === 0) fail(`${subject} proof must bind implementation files`);
  const proofByPath = new Map();
  for (const entry of proof.implementationFiles) {
    if (!entry || typeof entry.path !== 'string' || !shaPattern.test(entry.blobSha)) fail(`${subject} proof has invalid implementation binding`);
    safeRepoPath(root, entry.path, fail, `${subject} proof implementation path`);
    if (proofByPath.has(entry.path)) fail(`${subject} proof duplicates implementation path ${entry.path}`);
    proofByPath.set(entry.path, entry.blobSha);
  }

  const actualMismatches = new Map();
  for (const [path, provenBlobSha] of proofByPath) {
    const actualBlobSha = gitBlobSha(await readFile(safeRepoPath(root, path, fail, `${subject} implementation path`)));
    if (actualBlobSha !== provenBlobSha) actualMismatches.set(path, { provenBlobSha, actualBlobSha });
  }

  const maintenance = maintenanceRecords.get(subject);
  if (!maintenance) {
    if (actualMismatches.size) {
      const [path, mismatch] = actualMismatches.entries().next().value;
      fail(`${subject} proof is stale for ${path}: expected ${mismatch.provenBlobSha}, got ${mismatch.actualBlobSha}`);
    }
    return { maintenanceActive: false, mismatchPaths: [] };
  }

  if (maintenance.proofRecord.path !== proofPath) fail(`${subject} maintenance binds the wrong proof path`);
  if (maintenance.proofRecord.blobSha !== proofRecordBlobSha) fail(`${subject} maintenance proof-record anchor is stale: expected ${maintenance.proofRecord.blobSha}, got ${proofRecordBlobSha}`);

  const declared = new Map();
  for (const entry of maintenance.implementationFiles) {
    safeRepoPath(root, entry.path, fail, `${subject} maintenance implementation path`);
    const proven = proofByPath.get(entry.path);
    if (!proven) fail(`${subject} maintenance declares non-proof implementation path ${entry.path}`);
    if (proven !== entry.provenBlobSha) fail(`${subject} maintenance prior blob for ${entry.path} does not match active public proof`);
    declared.set(entry.path, entry.provenBlobSha);
  }

  if (actualMismatches.size === 0) fail(`${subject} maintenance exists but no proof-bound implementation byte currently differs`);
  const actualPaths = [...actualMismatches.keys()].sort();
  const declaredPaths = [...declared.keys()].sort();
  if (actualPaths.join('|') !== declaredPaths.join('|')) fail(`${subject} maintenance mismatch set must equal actual proof-bound drift exactly; declared [${declaredPaths.join(', ')}], actual [${actualPaths.join(', ')}]`);
  return { maintenanceActive: true, mismatchPaths: actualPaths, trackingIssue: maintenance.trackingIssue };
}

export function assertNoUnclaimedMaintenance({ maintenanceRecords, claimedSubjects, fail }) {
  for (const subject of maintenanceRecords.keys()) if (!claimedSubjects.has(subject)) fail(`maintenance record exists for inactive or unknown public-proof subject ${subject}`);
}
