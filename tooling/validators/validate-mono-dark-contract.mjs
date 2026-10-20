import { access, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const fail = (message) => { throw new Error(`[mono-dark-contract] ${message}`); };
const json = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const expectAbsent = async (path, message) => {
  try { await access(resolve(root, path)); fail(message); }
  catch (error) { if (error?.message?.startsWith('[mono-dark-contract]')) throw error; if (error?.code !== 'ENOENT') throw error; }
};

const canonical = await readFile(resolve(root, 'docs/CANONICAL-PRD.md'), 'utf8');
if (!canonical.includes('Hardline\n\nSoft\n\nRivet\n\nMono\n\nlight/dark')) fail('Canonical v0.3 Flavor Engine no longer requires the official Flavor set followed by light/dark completion');

const inventory = await json('migration/inventory.json');
const family = inventory.sources.find((entry) => entry.repository === 'NeoBrutalism-shop/spec');
if (!family || family.sha !== 'fbf499397f4e9a52d6e25c13921fd5377799c626' || family.status !== 'snapshot-pinned') fail('pinned family-spec authority drifted');
if (family.copyPolicy !== 'knowledge-only-until-reviewed' || !family.evidencePaths?.includes('FLAVORS.md')) fail('family Flavor-law provenance boundary drifted');
if (inventory.sources.some((entry) => /mono/i.test(entry.repository) || /mono/i.test(entry.legacyRole ?? ''))) fail('Mono Dark must not invent a dedicated legacy Mono source');
if (inventory.artifacts.some((entry) => /^legacy\.mono\./.test(entry.id))) fail('Mono Dark must not invent legacy Mono artifacts');

const flavor = await json('packages/flavors/mono/flavor.json');
const light = await json('packages/themes/mono-light/theme.json');
const dark = await json('packages/themes/mono-dark/theme.json');
const lightResolution = await json('packages/themes/mono-light/resolution.json');
const lightBundle = await json('packages/themes/mono-light/tokens.json');
const resolution = await json('packages/themes/mono-dark/resolution.json');
const bundle = await json('packages/themes/mono-dark/tokens.json');
if (flavor.schema !== 'neosmartui/flavor@1' || flavor.id !== 'flavor.mono' || flavor.name !== 'Mono' || flavor.interactionModel !== 'pressure-not-levitation') fail('Mono Flavor identity is invalid');
if (light.schema !== 'neosmartui/theme@1' || light.name !== 'Mono Light' || light.category !== 'mono' || light.color?.mode !== 'light') fail('Mono Light baseline identity drifted');
if (dark.schema !== 'neosmartui/theme@1' || dark.name !== 'Mono Dark' || dark.family !== 'neosmartui' || dark.category !== 'mono') fail('Mono Dark Theme identity is invalid');
if (dark.color?.mode !== 'dark' || dark.color?.strategy !== 'editorial-monochrome-dark') fail('Mono Dark must declare authored editorial monochrome dark intent');
for (const key of ['typography','geometry','border','shadow','spacing','density','motion','interaction','icons']) if (JSON.stringify(dark[key]) !== JSON.stringify(light[key])) fail(`Mono Dark must preserve Mono Light non-color descriptor structure at ${key}`);
if (resolution.schema !== 'neosmartui/theme-resolution@1' || resolution.flavor !== 'flavor.mono' || resolution.theme !== 'Mono Dark' || resolution.bundle !== 'tokens.json') fail('Mono Dark resolution identity is invalid');
if (bundle.schema !== 'neosmartui/resolved-token-bundle@1' || bundle.flavor !== 'flavor.mono' || bundle.theme !== 'Mono Dark') fail('Mono Dark bundle identity is invalid');
if (resolution.scope.length !== 50 || bundle.scope.length !== 50 || bundle.values.length !== 55 || new Set(bundle.values.map((entry) => entry.id)).size !== 55) fail('maintained Mono Dark must preserve the exact local 50-Core/55-token Theme boundary');
if ([...resolution.scope].sort().join('|') !== [...lightResolution.scope].sort().join('|')) fail('Mono Dark must preserve Mono Light Core scope');
if ([...new Set(bundle.values.map((entry) => entry.id))].sort().join('|') !== [...new Set(lightBundle.values.map((entry) => entry.id))].sort().join('|')) fail('Mono Dark must preserve the exact Mono Light semantic dependency set');

for (const path of ['apps/foundry/fragments/mono-dark.html','tests/browser/foundry-mono-dark.spec.mjs','tooling/validators/validate-mono-dark-theme.mjs','tooling/foundry/assemble-mono-dark.mjs']) await access(resolve(root, path));
await expectAbsent('packages/flavors/mono-dark', 'Mono Dark must remain a Theme of flavor.mono, not a new Flavor');
await expectAbsent('apps/foundry/src/flavors/mono-dark', 'Mono Dark must extend the canonical Mono route, not create a route fork');

const proof = await json('evidence/public/flavor.mono.json');
if (proof.flavor !== 'flavor.mono') fail('existing Mono public-proof subject drifted');
const expectedProofPaths = [
  'packages/themes/mono-light/theme.json',
  'packages/themes/mono-light/resolution.json',
  'packages/themes/mono-light/tokens.json',
  'apps/foundry/src/flavors/mono/index.html',
  'packages/themes/mono-dark/theme.json',
  'packages/themes/mono-dark/resolution.json',
  'packages/themes/mono-dark/tokens.json',
  'apps/foundry/fragments/mono-dark.html',
  'tooling/foundry/assemble-mono-dark.mjs'
];
if (proof.implementationFiles.map((entry) => entry.path).join('|') !== expectedProofPaths.join('|')) fail('Mono public proof must bind exactly four Light inputs plus five Dark implementation inputs');
if ((proof.live.assetUrls ?? []).join('|') !== ['https://neosmartuxui.github.io/mono-theme.css','https://neosmartuxui.github.io/mono-dark-theme.css'].join('|')) fail('Mono public proof must bind both live Light and Dark Theme assets');
const provenRoute = proof.implementationFiles.find((entry) => entry.path === 'apps/foundry/src/flavors/mono/index.html');
if (!provenRoute) fail('Mono Light public proof must retain the canonical source-route binding');
const routeBytes = await readFile(resolve(root, provenRoute.path));
const routeBlob = createHash('sha1').update(`blob ${routeBytes.length}\0`).update(routeBytes).digest('hex');
if (routeBlob !== provenRoute.blobSha) fail('Mono Dark public proof must keep the proven Mono Light source route byte-identical');

const packageJson = await json('package.json');
const expectedBuild = 'node tooling/foundry/build.mjs && node tooling/foundry/assemble-component-previews.mjs && node tooling/foundry/assemble-soft-dark.mjs && node tooling/foundry/assemble-rivet-dark.mjs && node tooling/foundry/assemble-mono-dark.mjs && node tooling/foundry/assemble-pulse-dark.mjs';
if (packageJson.scripts?.['build:foundry'] !== expectedBuild) fail('Mono Dark must remain the third proof-bound Flavor-dark assembler after the proven builder, shared Component-preview assembly, Soft Dark, and Rivet Dark, with Pulse Dark appended afterward');
if (packageJson.scripts?.['validate:mono-dark'] !== 'node tooling/validators/validate-mono-dark-theme.mjs') fail('Mono Dark implementation validator must be wired explicitly');
const builder = await readFile(resolve(root, 'tooling/foundry/build.mjs'), 'utf8');
const softAssembler = await readFile(resolve(root, 'tooling/foundry/assemble-soft-dark.mjs'), 'utf8');
const rivetAssembler = await readFile(resolve(root, 'tooling/foundry/assemble-rivet-dark.mjs'), 'utf8');
if (builder.includes('mono-dark')) fail('Mono Dark must not mutate the shared proven builder');
if (softAssembler.includes('mono-dark')) fail('Mono Dark must not mutate or overload the proven Soft Dark assembler');
if (rivetAssembler.includes('mono-dark')) fail('Mono Dark must not mutate or overload the proven Rivet Dark assembler');

const docs = await readFile(resolve(root, 'spec/flavors/MONO.md'), 'utf8');
for (const marker of [
  'Mono Dark contract maturity: `contract-only` (superseded contract checkpoint)','Mono Dark implementation maturity: `implemented`','Mono Dark proof maturity: `public-proof`',
  'second concrete Theme instance of the existing `flavor.mono` identity','authored color strategy: `editorial-monochrome-dark`',
  '`packages/themes/mono-dark/tokens.json`','`packages/themes/mono-dark/resolution.json`','`tooling/foundry/assemble-mono-dark.mjs`','`mono-dark-theme.css`',
  '3px → 1px → 0px structural depth','0px → 2px → 3px inward travel','65ms / 100ms / 140ms timings',
  'proven Mono Light source route remains byte-identical','live `mono-dark-theme.css` is bound by the singleton public-proof cohort',
  'Mono Light and Mono Dark are complete through public proof'
]) if (!docs.includes(marker)) fail(`Mono Dark implementation docs missing marker: ${marker}`);
console.log('[mono-dark-contract] validated public-proof Mono Dark ownership, provenance, exact public-proof 49/55 boundary, nine-file binding, live Dark asset, and additive assembly');
