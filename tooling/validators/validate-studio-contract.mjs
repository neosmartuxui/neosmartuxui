import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const fail = (message) => { throw new Error(`[studio-contract] ${message}`); };
const json = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const expectAbsent = async (path, message) => {
  try {
    await access(resolve(root, path));
    fail(message);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
};

const prd = await readFile(resolve(root, 'docs/CANONICAL-PRD.md'), 'utf8');
for (const marker of ['# 28. Theme architecture', '# 29. NeoSmartUXUI Studio', '# 30. Studio theme workflow', '# 37. Studio preview matrix']) {
  if (!prd.includes(marker)) fail(`Canonical PRD missing Studio authority: ${marker}`);
}

const roadmap = await readFile(resolve(root, 'docs/DEVELOPMENT-ROADMAP.md'), 'utf8');
const studioIndex = roadmap.indexOf('**v0.4 NeoSmartUXUI Studio**');
const blocksIndex = roadmap.indexOf('**v0.5 Core Blocks**');
if (studioIndex < 0 || blocksIndex < 0 || studioIndex >= blocksIndex) fail('roadmap must keep v0.4 Studio before v0.5 Core Blocks');
for (const marker of [
  '**Component Lab** ✅',
  '**Dedicated Theme Gallery/Lab** ⏳',
  '**Blocks Lab** ⏳',
  '**Pages Lab** ⏳',
  '**Vertical/SaaS/Commerce previews** ⏳'
]) {
  if (!roadmap.includes(marker)) fail(`roadmap Lab status drifted: ${marker}`);
}

const identities = new Map([
  ['spec/schemas/theme.schema.json', 'neosmartui/theme@1'],
  ['spec/schemas/theme-resolution.schema.json', 'neosmartui/theme-resolution@1'],
  ['spec/schemas/resolved-token-bundle.schema.json', 'neosmartui/resolved-token-bundle@1'],
  ['spec/schemas/component-preview.schema.json', 'neosmartui/component-preview@1']
]);
for (const [path, identity] of identities) {
  const schema = await json(path);
  if (schema.properties?.schema?.const !== identity) fail(`${path} identity drifted; Studio must consume canonical authority`);
}

const tokenContracts = await json('spec/core/token-contracts.json');
if (tokenContracts.schema !== 'neosmartui/token-contracts@1') fail('Core token authority drifted');

const registry = await json('packages/core/component-registry.json');
if (registry.schema !== 'neosmartui/component-registry@1' || registry.domain !== 'core') fail('Core component registry authority drifted');
for (const component of registry.components ?? []) {
  const contract = await json(`packages/core/${component.contract}`);
  if (contract.id !== component.id || contract.schema !== 'neosmartui/component@1') fail(`registry/contract identity drift for ${component.id}`);
}

const docs = await readFile(resolve(root, 'spec/studio/STUDIO.md'), 'utf8');
for (const marker of [
  '**Contract checkpoint:** contract-only',
  'ONE LOGICAL THEME, THREE CANONICAL FILES.',
  '`theme.json` — `neosmartui/theme@1`',
  '`resolution.json` — `neosmartui/theme-resolution@1`',
  '`tokens.json` — `neosmartui/resolved-token-bundle@1`',
  'Theme is data, not forked components.',
  'CAPABILITY ABSENCE IS NOT A PREVIEW.',
  'Component preview is available',
  'Block preview is unavailable',
  'Page preview is unavailable',
  'Commerce, SaaS, and other Vertical previews are unavailable',
  '`REGISTRY GAP`',
  'Pressure, not levitation',
  'ephemeral workspace with optional `light` and `dark` slots',
  'Studio import is untrusted **data only**.',
  'Import → export without edits must remain semantically lossless and deterministically stable.',
  'Forced Colors / system High Contrast',
  'SOURCE ONCE. DEMONSTRATE EVERYWHERE.',
  'It MUST NOT create:'
]) if (!docs.includes(marker)) fail(`Studio docs missing contract marker: ${marker}`);

const agents = await readFile(resolve(root, 'AGENTS.md'), 'utf8');
for (const marker of [
  '## Studio discipline',
  'Studio consumes canonical Theme and registry authority.',
  'DISCOVER PREVIEW CAPABILITY before rendering.',
  'Component state controls are derived only from the selected component contract.',
  'surface it as unavailable or `REGISTRY GAP`',
  'Studio import is untrusted data.'
]) if (!agents.includes(marker)) fail(`AGENTS Studio law missing: ${marker}`);

const packageJson = await json('package.json');
if (packageJson.scripts?.['validate:component-preview-contract'] !== 'node tooling/validators/validate-component-preview-contract.mjs') fail('component-preview contract validator is not wired');
if (packageJson.scripts?.['validate:studio-contract'] !== 'node tooling/validators/validate-studio-contract.mjs') fail('Studio contract validator is not wired');
if (packageJson.scripts?.['validate:studio-theme-package'] !== 'node tooling/validators/validate-studio-theme-package.mjs') fail('Studio Theme-package validator is not wired');
if (packageJson.scripts?.['validate:studio-runtime'] !== 'node tooling/validators/validate-studio-runtime.mjs') fail('Studio runtime validator is not wired');
const quality = packageJson.scripts?.quality ?? '';
const previewPos = quality.indexOf('npm run validate:component-preview-contract');
const studioPos = quality.indexOf('npm run validate:studio-contract');
const themePackagePos = quality.indexOf('npm run validate:studio-theme-package');
const runtimePos = quality.indexOf('npm run validate:studio-runtime');
const migrationPos = quality.indexOf('npm run validate:migration');
if (previewPos < 0 || studioPos < 0 || themePackagePos < 0 || runtimePos < 0 || migrationPos < 0 || previewPos >= studioPos || studioPos >= themePackagePos || themePackagePos >= runtimePos || runtimePos >= migrationPos) fail('normal quality chain must run preview + Studio contract + Theme-package + runtime validation before migration');

const expectedFoundryBuild = 'node tooling/foundry/build.mjs && node tooling/foundry/assemble-component-previews.mjs && node tooling/foundry/assemble-soft-dark.mjs && node tooling/foundry/assemble-rivet-dark.mjs && node tooling/foundry/assemble-mono-dark.mjs && node tooling/foundry/assemble-pulse-dark.mjs';
if (packageJson.scripts?.['build:foundry'] !== expectedFoundryBuild) fail('Studio preview substrate must assemble after the proof-bound Foundry builder and before Flavor-dark assemblers');

await access(resolve(root, 'packages/core/previews/runtime.mjs'));
await access(resolve(root, 'tooling/foundry/assemble-component-previews.mjs'));
for (const path of ['packages/contracts/json-schema-subset.mjs','packages/contracts/resolved-token-value.mjs','packages/contracts/theme-package-semantic.mjs','packages/contracts/theme-package-io.mjs','packages/contracts/theme-workspace.mjs']) await access(resolve(root, path));
for (const path of ['apps/studio/src/index.html','apps/studio/src/app.mjs','apps/studio/src/preview-kernel.mjs','tooling/studio/build.mjs','tests/studio/studio-runtime.spec.mjs']) await access(resolve(root, path));
await expectAbsent('spec/schemas/studio-theme.schema.json', 'Studio must not create a competing Theme schema');
await expectAbsent('packages/studio', 'contract checkpoint must not create a Studio runtime/package authority');
await expectAbsent('packages/studio-token-registry.json', 'Studio must not create a duplicate token registry');

console.log('[studio-contract] validated canonical Studio authority, shared preview/Theme-package contracts, initial isolated Studio runtime, capability-aware gating, and proof-bound Foundry preservation');
