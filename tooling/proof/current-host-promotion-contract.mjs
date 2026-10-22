export const DEPLOYED_IMPLEMENTATION_SHA = 'ec0a720813565270bceee1191d1d6a9c77cede36';
export const DEPLOYED_PAGES_SHA = '6ecd5e21b8d7817d9b73526a14d17e790d2ea6cb';
export const PROOF_PROMOTION_SHA = 'eb363d98f7747b8c963fc8cb8f82e3b856eb5e22';
export const PROOF_ONLY_ALLOWLIST = Object.freeze([
  'docs/CANONICAL-PRD.md',
  'docs/CURRENT-HOST-PROOF-MIGRATION.md',
  'docs/DEVELOPMENT-ROADMAP.md',
  'docs/PUBLIC-PROOF-GATE.md',
  'evidence/current-host/cohort-v2.json',
  'package.json',
  'packages/core/component-registry.json',
  'packages/core/components/description-list.md',
  'spec/schemas/current-host-proof.schema.json',
  'tooling/proof/current-host-promotion-contract.mjs',
  'tooling/proof/current-host-promotion-contract.test.mjs',
  'tooling/proof/validate-promotion-v2.mjs',
  'tooling/proof/validate-promotion-v2-live.mjs',
  'tooling/validators/validate-core-components.mjs',
  'tooling/validators/validate-schemas.mjs'
]);
export function checkProofOnlyPaths(paths) {
  const allowed = new Set(PROOF_ONLY_ALLOWLIST);
  return (paths || []).filter(x => !allowed.has(x)).map(x => 'unapproved proof-only change: ' + x);
}
export function checkV2Evidence(record, registry, oldIds) {
  const errors = [];
  const requireCheck = (pass, message) => { if (!pass) errors.push(message); };
  requireCheck(record?.schema === 'neosmartuxui/public-proof-cohort@2' &&
    record?.status === 'PROOF_ONLY_ADMISSION', 'missing versioned proof-only admission authority');
  requireCheck(record?.source?.repository === 'neosmartuxui/neosmartuxui' &&
    record?.source?.sha === DEPLOYED_IMPLEMENTATION_SHA, 'deployment source must remain the pre-promotion implementation SHA');
  requireCheck(record?.pages?.repository === 'neosmartuxui/neosmartuxui.github.io' &&
    record?.pages?.sha === DEPLOYED_PAGES_SHA, 'Pages deployment identity mismatch');
  requireCheck(record?.verification?.verifiedSourceCommit === DEPLOYED_IMPLEMENTATION_SHA &&
    record?.verification?.verifiedPagesCommit === DEPLOYED_PAGES_SHA &&
    record?.verification?.noGitHubActions === true &&
    record?.verification?.livePublishedSubjects === 55 &&
    record?.verification?.files === 105, 'incomplete current-host v2 verification boundary');
  requireCheck(record?.historical?.records === 54 && record?.historical?.core === 49 &&
    record?.historical?.flavors === 5 && record?.historical?.originalPath === 'evidence/public/' &&
    record?.historical?.maintenancePath === 'evidence/maintenance/' &&
    /^sha256:[a-f0-9]{64}$/.test(record?.historical?.reconciliationDigest || ''), 'historical provenance must preserve all 54 records');
  const decisions = record?.historical?.decisions;
  requireCheck(decisions?.unchanged === 101 &&
    decisions?.['maintenance-declared-theme-expansion'] === 20 &&
    decisions?.['verified-brand-host-migration'] === 10, 'historical binding classification mismatch');
  const commands = ['quality:restore','test:proof:current','test:proof:cohort','build:foundry','test:browser','build:studio','test:studio'];
  requireCheck(JSON.stringify(record?.browserEvidence?.qaCommands) === JSON.stringify(commands) &&
    record?.browserEvidence?.foundryTests >= 424 &&
    record?.browserEvidence?.studioTests >= 8 &&
    /^[a-f0-9]{64}$/.test(record?.browserEvidence?.foundryReportSha256 || '') &&
    /^[a-f0-9]{64}$/.test(record?.browserEvidence?.studioReportSha256 || ''),
  'exact QA runner sequence or report digests missing');
  const subjects = record?.subjects || [];
  const ids = subjects.map(x => x.id);
  requireCheck(ids.length === 55 && new Set(ids).size === 55, 'v2 cohort must contain exactly 55 distinct subjects');
  const publishedCore = registry.filter(x => x.maturity === 'public-proof');
  const unpublished = registry.filter(x => x.maturity !== 'public-proof');
  requireCheck(unpublished.every(x => x.maturity === 'contract-only' &&
    x.evidence?.implementation === null && x.evidence?.publicProof === null &&
    !subjects.some(s => s.id === x.id)), 'unproven Core candidates must stay contract-only, have null evidence and stay outside v2 cohort');
  const known = [...publishedCore.map(x => x.id), ...['hardline','soft','rivet','mono','pulse'].map(x => 'flavor.'+x)];
  requireCheck(known.length === 55 && JSON.stringify([...known].sort()) === JSON.stringify([...ids].sort()),
    'v2 subject IDs must match exact 50 Core + five official Flavors');
  requireCheck(oldIds.length === 54 && oldIds.every(id => ids.includes(id)) &&
    !oldIds.includes('core.description-list'), 'legacy 54 cohort membership mismatch');
  const description = subjects.find(x => x.id === 'core.description-list');
  requireCheck(description?.kind === 'core' && description?.recordSha === null &&
    description?.files?.length === 1 &&
    description.files[0]?.path === 'packages/adapters/web/components/description-list.css' &&
    description.files[0]?.classification === 'new-native-semantic' &&
    /^[a-f0-9]{40}$/.test(description.files[0]?.sha || '') &&
    description?.browserCoverage?.passed === true &&
    description?.browserCoverage?.behaviorCount === 8 &&
    description?.browserCoverage?.previewPassed === true,
    'Description List must retain exact CSS implementation and eight passing direct tests');
  const live = description?.live;
  requireCheck(live?.url === 'https://neosmartuxui.github.io/foundry/' &&
    live?.httpStatus === 200 && live?.deployedSourceSha === DEPLOYED_IMPLEMENTATION_SHA &&
    live?.structure?.tag === 'DL' && live?.structure?.state === 'rest' &&
    live?.structure?.role === null && live?.structure?.tabindex === null &&
    live?.structure?.children?.join(',') === 'DT,DT,DD,DT,DD,DD,DT,DD' &&
    live?.tabPass === true && live?.rtl?.direction === 'rtl' &&
    live?.rtl?.width <= live?.rtl?.viewport &&
    live?.consoleErrors?.length === 0, 'Description List live native/keyboard/RTL evidence is invalid');
  requireCheck(record?.flavorReconciliations?.length === 5 &&
    new Set(record.flavorReconciliations.map(x => x.subject)).size === 5 &&
    record.flavorReconciliations.every(x => x.decision === 'ADAPT' &&
      x.declaredMaintenance.length === 4 && x.verifiedRebrandPaths.length === 2 &&
      x.priorThemeBytesUnverified.length === 4), 'five Flavor maintenance reconciliations incomplete');
  requireCheck(record?.artifacts?.length === 105 &&
    new Set(record.artifacts.map(x => x.publishedPath)).size === 105 &&
    record.artifacts.every(x => x.liveStatus === 200 &&
      /^[a-f0-9]{64}$/.test(x.localSha256) &&
      x.localSha256 === x.pagesSha256 &&
      x.pagesSha256 === x.liveSha256), '105-file exact live asset parity missing');
  requireCheck(publishedCore.length === 50 && new Set(registry.map(x => x.id)).size === registry.length &&
    registry.find(x => x.id === 'core.description-list')?.evidence?.publicProof === 'evidence/current-host/cohort-v2.json',
    'registry must contain 50 public-proof Core components linked to v2 authority');
  return errors;
}
