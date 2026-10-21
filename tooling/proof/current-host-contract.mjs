import { createHash } from 'node:crypto';

export const SOURCE_REPOSITORY = 'neosmartuxui/neosmartuxui';
export const PAGES_REPOSITORY = 'neosmartuxui/neosmartuxui.github.io';
export const PROOF_HOST = 'https://neosmartuxui.github.io';
export const SHA_PATTERN = /^[a-f0-9]{40}$/;
export const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');

export function checkPlaywrightReport(report, { label, minTests, requiredFile, requiredTests = 0 }) {
  const reasons = [];
  const stats = report?.stats;
  if (!stats || !Number.isInteger(stats.expected) || stats.expected < minTests ||
      stats.skipped !== 0 || stats.unexpected !== 0 || stats.flaky !== 0) {
    reasons.push(`${label} requires >=${minTests} expected tests with zero skipped, unexpected, or flaky`);
  }
  const specs = [];
  const visit = (suite) => {
    for (const spec of suite?.specs || []) specs.push(spec);
    for (const nested of suite?.suites || []) visit(nested);
  };
  for (const suite of report?.suites || []) visit(suite);
  if (specs.length < minTests) reasons.push(`${label} report contains only ${specs.length} test specifications`);
  for (const spec of specs) {
    if (!spec.ok || !spec.tests?.length ||
        spec.tests.some((test) => test.status !== 'expected' ||
          !test.results?.length || test.results.at(-1)?.status !== 'passed')) {
      reasons.push(`${label} report has non-passing spec: ${spec.file || 'unknown'}: ${spec.title || 'unnamed'}`);
    }
  }
  if (requiredFile) {
    const matches = specs.filter((spec) => spec.file === requiredFile);
    if (matches.length < requiredTests) {
      reasons.push(`${label} lacks ${requiredTests} passing subject tests in ${requiredFile}`);
    }
  }
  return reasons;
}

export function evaluateCurrentHost(snapshot) {
  const problems = [];
  const check = (condition, problem) => { if (!condition) problems.push(problem); };
  check(snapshot?.source?.repository === SOURCE_REPOSITORY, 'source repository identity mismatch');
  check(SHA_PATTERN.test(snapshot?.source?.sha || ''), 'source SHA must be a complete Git commit');
  check(snapshot?.source?.clean === true, 'source checkout must be clean for proof capture');
  check(snapshot?.source?.originMain === snapshot?.source?.sha, 'source must be exact merged origin/main');
  check(snapshot?.pages?.repository === PAGES_REPOSITORY, 'Pages repository identity mismatch');
  check(SHA_PATTERN.test(snapshot?.pages?.sha || ''), 'Pages SHA must be a complete Git commit');
  check(snapshot?.pages?.clean === true, 'Pages checkout must be clean');
  check(snapshot?.pages?.originMain === snapshot?.pages?.sha, 'Pages must match origin/main');
  check(snapshot?.actions?.source === false && snapshot?.actions?.pages === false,
    'GitHub Actions must be disabled in both repositories');
  const pinnedSha = snapshot?.source?.sha;
  for (const [label, record] of [['local', snapshot?.deployment?.local],
                                 ['Pages checkout', snapshot?.deployment?.pages],
                                 ['live', snapshot?.deployment?.live]]) {
    check(record?.schema === 'neosmartuxui/deployment-record@1' &&
      record?.sourceRepository === SOURCE_REPOSITORY &&
      record?.artifact === 'foundry' &&
      record?.sourceSha === pinnedSha, `${label} Foundry deployment record does not bind the tested source SHA`);
  }
  check(snapshot?.qa?.foundry?.ok === true && snapshot?.qa?.studio?.ok === true && snapshot?.qa?.attestation?.ok === true,
    'full local Foundry and Studio Chromium test reports must pass');
  const assets = snapshot?.assets || [];
  const expectedNames = ['foundry/index.html', 'foundry/deployment.json', 'description-list.css'];
  check(assets.length === expectedNames.length &&
    expectedNames.every((name) => assets.some((asset) => asset.publishedPath === name)),
    'required Foundry proof asset set is incomplete');
  for (const asset of assets) {
    check(asset.liveStatus === 200, `${asset.publishedPath} must return HTTP 200`);
    check(asset.localSha256 && asset.localSha256 === asset.pagesSha256 &&
      asset.pagesSha256 === asset.liveSha256,
      `${asset.publishedPath} local, Pages and live bytes must match exactly`);
  }
  check(snapshot?.subject?.id === 'core.description-list' &&
    snapshot?.subject?.contractExists === true &&
    snapshot?.subject?.adapterExists === true,
    'Description List contract and shipping adapter must exist');
  return { readyForCandidate: problems.length === 0, readyForPromotion: false, problems };
}

export function checkQaAttestation(attestation, {
  sourceSha, foundryReportSha256, studioReportSha256,
  foundryDeploymentSha256, studioDeploymentSha256
}) {
  const problems = [];
  const expectedCommands = ['build:foundry', 'test:browser', 'build:studio', 'test:studio'];
  if (attestation?.schema !== 'neosmartuxui/local-proof-qa@1' ||
      attestation?.sourceRepository !== SOURCE_REPOSITORY ||
      attestation?.sourceSha !== sourceSha) {
    problems.push('local QA attestation is missing or bound to another source SHA');
  }
  if (JSON.stringify(attestation?.commands) !== JSON.stringify(expectedCommands)) {
    problems.push('local QA must run the complete Foundry/Studio build and Chromium sequence');
  }
  for (const [name, actual, expected] of [
    ['Foundry browser report', attestation?.foundryReportSha256, foundryReportSha256],
    ['Studio browser report', attestation?.studioReportSha256, studioReportSha256],
    ['Foundry deployment record', attestation?.foundryDeploymentSha256, foundryDeploymentSha256],
    ['Studio deployment record', attestation?.studioDeploymentSha256, studioDeploymentSha256]
  ]) {
    if (!actual || !expected || actual !== expected) {
      problems.push(`${name} differs from pinned local QA evidence`);
    }
  }
  return problems;
}
