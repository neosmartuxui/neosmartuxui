import { execFileSync, spawnSync } from 'node:child_process';
import { readFile, rm, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { sha256, SOURCE_REPOSITORY, checkPlaywrightReport } from './current-host-contract.mjs';

const root = resolve(import.meta.dirname, '../..');
const attestationPath = resolve(root, 'artifacts/proof/local-qa-attestation.json');
const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();
const sha = git('rev-parse', 'HEAD');
if (git('status', '--porcelain') || sha !== git('rev-parse', 'origin/main')) {
  throw new Error('Proof QA requires a clean exact origin/main checkout; no feature-branch shortcut');
}
await rm(attestationPath, { force: true });
const env = { ...process.env, NEOSMARTUXUI_SOURCE_SHA: sha,
  NEOSMARTUXUI_BROWSER_CHANNEL: process.env.NEOSMARTUXUI_BROWSER_CHANNEL || 'chrome' };
const commands = ['build:foundry', 'test:browser', 'build:studio', 'test:studio'];
for (const command of commands) {
  console.log(`[proof-qa] ${command} pinned to ${sha}`);
  const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['run', command], { cwd: root, env, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0 || result.error) throw new Error(`proof QA ${command} failed (status: ${result.status}; error: ${result.error || 'none'})`);
}
const file = (path) => readFile(resolve(root, path));
const foundryBytes = await file('artifacts/browser/report.json');
const studioBytes = await file('artifacts/studio/report.json');
const foundry = JSON.parse(foundryBytes.toString('utf8'));
const studio = JSON.parse(studioBytes.toString('utf8'));
const failures = [
  ...checkPlaywrightReport(foundry, { label: 'Foundry Chromium', minTests: 415,
    requiredFile: 'foundry-core-description-list.spec.mjs', requiredTests: 8 }),
  ...checkPlaywrightReport(studio, { label: 'Studio Chromium', minTests: 8 })
];
const foundryDeployment = await file('dist/foundry/deployment.json');
const studioDeployment = await file('dist/studio/deployment.json');
for (const [label, buffer, artifact] of [
  ['Foundry', foundryDeployment, 'foundry'], ['Studio', studioDeployment, 'studio']
]) {
  const deployed = JSON.parse(buffer.toString('utf8'));
  if (deployed.schema !== 'neosmartuxui/deployment-record@1' ||
      deployed.sourceRepository !== SOURCE_REPOSITORY ||
      deployed.sourceSha !== sha || deployed.artifact !== artifact) {
    failures.push(`${label} deployment record is not pinned to ${sha}`);
  }
}
if (failures.length) throw new Error(failures.join('\n'));
const attestation = {
  schema: 'neosmartuxui/local-proof-qa@1',
  sourceRepository: SOURCE_REPOSITORY, sourceSha: sha,
  commands,
  foundryReportSha256: sha256(foundryBytes),
  studioReportSha256: sha256(studioBytes),
  foundryDeploymentSha256: sha256(foundryDeployment),
  studioDeploymentSha256: sha256(studioDeployment),
  foundryTests: foundry.stats.expected, studioTests: studio.stats.expected,
  completedAt: new Date().toISOString()
};
await mkdir(dirname(attestationPath), { recursive: true });
await writeFile(attestationPath, JSON.stringify(attestation, null, 2) + '\n');
console.log(`[proof-qa] PASS ${foundry.stats.expected} Foundry + ${studio.stats.expected} Studio; local attestation ${attestationPath}`);
