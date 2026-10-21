import { execFileSync } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import {
  SOURCE_REPOSITORY, PAGES_REPOSITORY, PROOF_HOST, sha256,
  checkPlaywrightReport, checkQaAttestation, evaluateCurrentHost
} from './current-host-contract.mjs';

const root = resolve(import.meta.dirname, '../..');
const pages = process.env.NEOSMARTUXUI_PAGES_CHECKOUT ||
  resolve(dirname(root), 'neosmartuxui.github.io');
const argv = process.argv.slice(2);
if (argv.some((arg) => !['--preflight'].includes(arg))) {
  console.error('Usage: node tooling/proof/current-host-gate.mjs --preflight');
  process.exit(2);
}
const exec = (program, args) => execFileSync(program, args, {
  encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 20000
}).trim();
const git = (dir, ...args) => exec('git', ['-C', dir, ...args]);
const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const safe = async (action, fallback) => {
  try { return await action(); } catch (error) { return typeof fallback === 'function' ? fallback(error) : fallback; }
};
const report = async (path, label, minTests, requiredFile, requiredTests) => {
  const bytes = await safe(() => readFile(path), null);
  if (!bytes) return { ok: false, reason: `${label} test report missing` };
  const parsed = await safe(async () => JSON.parse(bytes.toString('utf8')), null);
  if (!parsed) return { ok: false, reason: `${label} test report invalid JSON` };
  const reasons = checkPlaywrightReport(parsed, { label, minTests, requiredFile, requiredTests });
  return { ok: reasons.length === 0, tests: parsed.stats?.expected ?? 0,
    startedAt: parsed.stats?.startTime ?? null, sha256: sha256(bytes), reasons };
};
const localFile = async (path) => safe(() => readFile(path), null);
const liveFile = async (url) => safe(async () => {
  const response = await fetch(url, { signal: AbortSignal.timeout(15000),
    headers: { 'cache-control': 'no-cache' } });
  return { status: response.status, bytes: Buffer.from(await response.arrayBuffer()) };
}, { status: 0, bytes: null });
const asset = async (local, publishedPath, urlPath) => {
  const localBytes = await localFile(resolve(root, local));
  const pagesBytes = await localFile(resolve(pages, publishedPath));
  const live = await liveFile(`${PROOF_HOST}${urlPath}`);
  return { localPath: local, publishedPath, url: `${PROOF_HOST}${urlPath}`,
    localSha256: localBytes ? sha256(localBytes) : null,
    pagesSha256: pagesBytes ? sha256(pagesBytes) : null,
    liveSha256: live.bytes ? sha256(live.bytes) : null,
    liveStatus: live.status };
};
const sourceSha = git(root, 'rev-parse', 'HEAD');
const pagesSha = git(pages, 'rev-parse', 'HEAD');
const browserQA = await report(resolve(root, 'artifacts/browser/report.json'),
  'Foundry Chromium', 415, 'foundry-core-description-list.spec.mjs', 8);
const studioQA = await report(resolve(root, 'artifacts/studio/report.json'),
  'Studio Chromium', 8);
const liveDeploymentBytes = await liveFile(PROOF_HOST + '/foundry/deployment.json');
const attestation = await safe(() => readJson(resolve(root, 'artifacts/proof/local-qa-attestation.json')), null);
const attestationReasons = checkQaAttestation(attestation, {
  sourceSha, foundryReportSha256: browserQA.sha256,
  studioReportSha256: studioQA.sha256,
  foundryDeploymentSha256: await localFile(resolve(root, 'dist/foundry/deployment.json')).then((b) => b && sha256(b)),
  studioDeploymentSha256: await localFile(resolve(root, 'dist/studio/deployment.json')).then((b) => b && sha256(b))
});
const snapshot = {
  schema: 'neosmartuxui/current-host-preflight@1',
  status: 'preflight-only-not-public-proof',
  source: { repository: SOURCE_REPOSITORY, sha: sourceSha,
    originMain: git(root, 'rev-parse', 'origin/main'),
    clean: git(root, 'status', '--porcelain') === '' },
  pages: { repository: PAGES_REPOSITORY, sha: pagesSha,
    originMain: git(pages, 'rev-parse', 'origin/main'),
    clean: git(pages, 'status', '--porcelain') === '' },
  actions: {
    source: await safe(() => exec('gh', ['api',
      'repos/neosmartuxui/neosmartuxui/actions/permissions', '--jq', '.enabled']) === 'true', null),
    pages: await safe(() => exec('gh', ['api',
      'repos/neosmartuxui/neosmartuxui.github.io/actions/permissions', '--jq', '.enabled']) === 'true', null)
  },
  deployment: {
    local: await safe(() => readJson(resolve(root, 'dist/foundry/deployment.json')), null),
    pages: await safe(() => readJson(resolve(pages, 'foundry/deployment.json')), null),
    live: await safe(() => JSON.parse(liveDeploymentBytes.bytes.toString('utf8')), null)
  },
  qa: { foundry: browserQA, studio: studioQA, attestation: { ok: attestationReasons.length === 0, reasons: attestationReasons } },
  assets: await Promise.all([
    asset('dist/foundry/index.html', 'foundry/index.html', '/foundry/'),
    asset('dist/foundry/deployment.json', 'foundry/deployment.json', '/foundry/deployment.json'),
    asset('dist/foundry/description-list.css', 'description-list.css', '/description-list.css')
  ]),
  subject: { id: 'core.description-list',
    contractExists: !!(await localFile(resolve(root, 'packages/core/components/description-list.json'))),
    adapterExists: !!(await localFile(resolve(root, 'packages/adapters/web/components/description-list.css'))) }
};
const verdict = evaluateCurrentHost(snapshot);
for (const qa of Object.values(snapshot.qa)) if (!qa.ok) {
  verdict.problems.push(...(qa.reasons || [qa.reason || 'test report unavailable']));
}
const output = { ...snapshot, verdict, checkedAt: new Date().toISOString(),
  notes: 'This is read-only preflight evidence. It cannot promote a Core component or replace the 54 historical public-proof records.' };
const dest = resolve(root, 'artifacts/proof/current-host-preflight.json');
await mkdir(dirname(dest), { recursive: true });
await writeFile(dest, JSON.stringify(output, null, 2) + '\n');
console.log(`[current-host-proof] ${verdict.readyForCandidate && verdict.problems.length === 0 ? 'CANDIDATE READY' : 'BLOCKED'}; public-proof promotion DISABLED`);
console.log(`[current-host-proof] report: ${dest}`);
for (const problem of verdict.problems) console.log(`  BLOCKER: ${problem}`);
if (!verdict.readyForCandidate || verdict.problems.length) process.exitCode = 1;
