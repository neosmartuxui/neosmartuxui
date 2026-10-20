import { readFile, access, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  assertNoUnclaimedMaintenance,
  loadPublicProofMaintenance,
  validatePublicProofBindings
} from './public-proof-bindings.mjs';

const root = resolve(import.meta.dirname, '../..');
const fail = (message) => { throw new Error(`[public-proof] ${message}`); };
const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));

const registry = await readJson(resolve(root, 'packages/core/component-registry.json'));
const componentClaims = registry.components
  .filter((entry) => entry.maturity === 'public-proof')
  .map((entry) => ({ id: entry.id, kind: 'component', proofPath: entry.evidence.publicProof }));

const publicDir = resolve(root, 'evidence/public');
const flavorProofNames = (await readdir(publicDir)).filter((name) => /^flavor\.[a-z][a-z0-9-]*\.json$/.test(name)).sort();
const flavorClaims = [];
for (const name of flavorProofNames) {
  const proofPath = `evidence/public/${name}`;
  const proof = await readJson(resolve(root, proofPath));
  if (!proof.flavor) fail(`${proofPath} must declare a flavor subject`);
  flavorClaims.push({ id: proof.flavor, kind: 'flavor', proofPath });
}

const claims = [...componentClaims, ...flavorClaims];
if (claims.length === 0) {
  console.log('[public-proof] no public-proof claims to validate');
  process.exit(0);
}

const maintenanceRecords = await loadPublicProofMaintenance({ root, fail });
const claimedSubjects = new Set(claims.map((claim) => claim.id));
assertNoUnclaimedMaintenance({ maintenanceRecords, claimedSubjects, fail });

let singletonCohort = null;
let maintenanceCount = 0;
for (const claim of claims) {
  if (!claim.proofPath) fail(`${claim.id} is public-proof without an evidence record`);
  const proofPath = resolve(root, claim.proofPath);
  await access(proofPath);
  const proof = await readJson(proofPath);
  if (proof.schema !== 'neosmartui/public-proof@1') fail(`${claim.id} has unexpected proof schema`);
  if (claim.kind === 'component' && proof.component !== claim.id) fail(`${claim.id} proof component mismatch`);
  if (claim.kind === 'flavor') {
    if (proof.flavor !== claim.id) fail(`${claim.id} proof flavor mismatch`);
    const slug = claim.id.slice('flavor.'.length);
    const manifest = await readJson(resolve(root, `packages/flavors/${slug}/flavor.json`));
    if (manifest.id !== claim.id) fail(`${claim.id} proof has no matching Flavor manifest`);
    if (proof.live.pageUrl !== `https://neosmartui.github.io/flavors/${slug}/`) fail(`${claim.id} must use its dedicated GitHub Pages Flavor proof route`);
  }
  if (proof.deployedSource.repository !== 'neosmartui/neosmartui' || !/^[0-9a-f]{40}$/.test(proof.deployedSource.sha)) fail(`${claim.id} has invalid deployed source`);
  if (proof.deployment.repository !== 'neosmartui/neosmartui.github.io') fail(`${claim.id} proof points to an unexpected deployment repository`);
  for (const field of ['commitSha', 'treeSha']) if (!/^[0-9a-f]{40}$/.test(proof.deployment[field])) fail(`${claim.id} has invalid deployment ${field}`);
  for (const field of ['runId', 'artifactId']) if (!Number.isInteger(proof.browserEvidence[field]) || proof.browserEvidence[field] < 1) fail(`${claim.id} has invalid browser evidence ${field}`);
  if (!/^sha256:[0-9a-f]{64}$/.test(proof.browserEvidence.artifactDigest)) fail(`${claim.id} has invalid browser evidence artifactDigest`);
  if (!Number.isInteger(proof.deployment.pagesRunId) || proof.deployment.pagesRunId < 1) fail(`${claim.id} has invalid Pages run id`);
  if (proof.live.deploymentRecordUrl !== 'https://neosmartui.github.io/deployment.json') fail(`${claim.id} must use the canonical GitHub Pages deployment record during development`);
  if (claim.kind === 'component' && proof.live.pageUrl !== 'https://neosmartui.github.io/') fail(`${claim.id} must use the Core Foundry proof route during development`);

  const cohort = JSON.stringify({
    deployedSource: proof.deployedSource,
    browserEvidence: proof.browserEvidence,
    deployment: proof.deployment,
    deploymentRecordUrl: proof.live.deploymentRecordUrl
  });
  if (singletonCohort === null) singletonCohort = cohort;
  else if (cohort !== singletonCohort) fail(`${claim.id} proof is not bound to the singleton public-proof deployment cohort`);

  const binding = await validatePublicProofBindings({
    root,
    subject: claim.id,
    proofPath: claim.proofPath,
    proof,
    maintenanceRecords,
    fail
  });
  if (binding.maintenanceActive) maintenanceCount += 1;
}

console.log(`[public-proof] validated ${componentClaims.length} Core and ${flavorClaims.length} Flavor structural proof records on one singleton deployment cohort with implementation blob binding${maintenanceCount ? ` and ${maintenanceCount} exact-set maintenance record(s)` : ''}`);
