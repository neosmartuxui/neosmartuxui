import test from 'node:test';
import assert from 'node:assert/strict';
import { checkPlaywrightReport, evaluateCurrentHost } from './current-host-contract.mjs';

const passedReport = (n, file = 'foundry-core-description-list.spec.mjs') => ({
  stats: { expected: n, unexpected: 0, skipped: 0, flaky: 0 },
  suites: [{ file, specs: Array.from({ length: n }, (_, i) => ({
    file, title: `test ${i + 1}`, ok: true,
    tests: [{ status: 'expected', results: [{ status: 'passed' }] }]
  })) }]
});
const SHA = 'a'.repeat(40);
const PAGES_SHA = 'b'.repeat(40);
const deployment = () => ({
  schema: 'neosmartuxui/deployment-record@1', artifact: 'foundry',
  sourceRepository: 'neosmartuxui/neosmartuxui', sourceSha: SHA
});
const validSnapshot = () => ({
  source: { repository: 'neosmartuxui/neosmartuxui', sha: SHA, originMain: SHA, clean: true },
  pages: { repository: 'neosmartuxui/neosmartuxui.github.io', sha: PAGES_SHA, originMain: PAGES_SHA, clean: true },
  actions: { source: false, pages: false },
  deployment: { local: deployment(), pages: deployment(), live: deployment() },
  qa: { foundry: { ok: true }, studio: { ok: true }, attestation: { ok: true } },
  assets: ['foundry/index.html', 'foundry/deployment.json', 'description-list.css'].map((publishedPath) => ({
    publishedPath, localSha256: 'f'.repeat(64), pagesSha256: 'f'.repeat(64),
    liveSha256: 'f'.repeat(64), liveStatus: 200
  })),
  subject: { id: 'core.description-list', contractExists: true, adapterExists: true }
});

test('accepts complete, passing, subject-specific Chromium results', () => {
  assert.deepEqual(checkPlaywrightReport(passedReport(8),
    { label: 'Foundry', minTests: 8, requiredFile: 'foundry-core-description-list.spec.mjs', requiredTests: 8 }), []);
});
test('rejects absent tests, skipped results, and fabricated subject coverage', () => {
  const report = passedReport(8);
  report.stats.skipped = 1;
  report.suites[0].specs[0].tests[0].results[0].status = 'failed';
  const errors = checkPlaywrightReport(report,
    { label: 'Foundry', minTests: 8, requiredFile: 'not-the-tested-file.spec.mjs', requiredTests: 8 });
  assert.ok(errors.some((error) => error.includes('zero skipped')));
  assert.ok(errors.some((error) => error.includes('non-passing')));
  assert.ok(errors.some((error) => error.includes('lacks 8')));
});
test('valid snapshot can only be a candidate, never proof admission', () => {
  assert.deepEqual(evaluateCurrentHost(validSnapshot()),
    { readyForCandidate: true, readyForPromotion: false, problems: [] });
});
test('rejects historical host source and an unmerged or dirty checkout', () => {
  const snapshot = validSnapshot();
  snapshot.source.repository = 'neosmartui/neosmartui';
  snapshot.source.clean = false;
  snapshot.source.originMain = PAGES_SHA;
  const verdict = evaluateCurrentHost(snapshot);
  assert.equal(verdict.readyForCandidate, false);
  assert.ok(verdict.problems.some((problem) => problem.includes('source repository')));
  assert.ok(verdict.problems.some((problem) => problem.includes('clean')));
  assert.ok(verdict.problems.some((problem) => problem.includes('merged origin/main')));
});
test('rejects fabricated Actions authorization and a stale live Foundry source SHA', () => {
  const snapshot = validSnapshot();
  snapshot.actions.pages = true;
  snapshot.deployment.live.sourceSha = PAGES_SHA;
  const problems = evaluateCurrentHost(snapshot).problems.join(' / ');
  assert.match(problems, /Actions must be disabled/);
  assert.match(problems, /live Foundry deployment/);
});
test('rejects edited, absent, or mismatched Pages/live asset bytes', () => {
  const snapshot = validSnapshot();
  snapshot.assets[0].pagesSha256 = 'e'.repeat(64);
  snapshot.assets[1].liveStatus = 404;
  snapshot.assets.pop();
  const problems = evaluateCurrentHost(snapshot).problems.join(' / ');
  assert.match(problems, /asset set is incomplete/);
  assert.match(problems, /bytes must match exactly/);
  assert.match(problems, /HTTP 200/);
});
test('rejects a passing-looking report without actual Studio and subject evidence', () => {
  const snapshot = validSnapshot();
  snapshot.qa.studio.ok = false;
  snapshot.subject.adapterExists = false;
  const problems = evaluateCurrentHost(snapshot).problems.join(' / ');
  assert.match(problems, /Chromium test reports must pass/);
  assert.match(problems, /shipping adapter must exist/);
});

test('rejects missing, stale, or altered local QA attestations', async () => {
  const { checkQaAttestation } = await import('./current-host-contract.mjs');
  const expected = {
    sourceSha: SHA, foundryReportSha256: '1'.repeat(64),
    studioReportSha256: '2'.repeat(64),
    foundryDeploymentSha256: '3'.repeat(64),
    studioDeploymentSha256: '4'.repeat(64)
  };
  assert.ok(checkQaAttestation(null, expected).length >= 5);
  const record = {
    schema: 'neosmartuxui/local-proof-qa@1',
    sourceRepository: 'neosmartuxui/neosmartuxui', sourceSha: SHA,
    commands: ['build:foundry', 'test:browser', 'build:studio', 'test:studio'],
    ...Object.fromEntries(Object.entries(expected).filter(([name]) => name !== 'sourceSha'))
  };
  assert.deepEqual(checkQaAttestation(record, expected), []);
  record.sourceSha = PAGES_SHA;
  record.foundryReportSha256 = '0'.repeat(64);
  record.commands = ['test:browser'];
  const problems = checkQaAttestation(record, expected).join(' / ');
  assert.match(problems, /another source SHA/);
  assert.match(problems, /complete Foundry\/Studio/);
  assert.match(problems, /Foundry browser report differs/);
});
