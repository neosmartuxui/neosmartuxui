import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadPublicProofMaintenance, validatePublicProofBindings } from './public-proof-bindings.mjs';

const root = resolve(import.meta.dirname, '../..');
const fail = (message) => { throw new Error(`[rivet-dark-contract] ${message}`); };
const json = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));

const canonical = await readFile(resolve(root, 'docs/CANONICAL-PRD.md'), 'utf8');
if (!canonical.includes('Hardline\n\nSoft\n\nRivet\n\nMono\n\nlight/dark')) fail('Canonical v0.3 Flavor Engine no longer requires the official Flavor set followed by light/dark completion');

const inventory = await json('migration/inventory.json');
const source = inventory.sources.find((entry) => entry.repository === 'NeoBrutalRivet/NeoBrutal-Rivet');
if (!source || source.sha !== 'bb4b641d35bc77c958b7345a3b7c0a134c7d802d' || source.status !== 'snapshot-pinned') fail('Rivet source pin drifted');
if (source.copyPolicy !== 'knowledge-only-until-reviewed' || source.licenseEvidence?.status !== 'not-declared-in-repository-metadata') fail('Rivet source licensing/copy policy drifted');
const artifact = inventory.artifacts.find((entry) => entry.id === 'legacy.rivet.flavor-system');
if (!artifact || artifact.sourceRepository !== source.repository || artifact.decision !== 'ADAPT' || artifact.targetLayer !== 'flavor') fail('legacy.rivet.flavor-system must remain ADAPT → flavor knowledge evidence');

const flavor = await json('packages/flavors/rivet/flavor.json');
const dark = await json('packages/themes/rivet-dark/theme.json');
const resolution = await json('packages/themes/rivet-dark/resolution.json');
const bundle = await json('packages/themes/rivet-dark/tokens.json');
if (flavor.schema !== 'neosmartui/flavor@1' || flavor.id !== 'flavor.rivet' || flavor.interactionModel !== 'pressure-not-levitation') fail('Rivet Flavor identity is invalid');
if (dark.schema !== 'neosmartui/theme@1' || dark.name !== 'Rivet Dark' || dark.category !== 'rivet' || dark.color?.mode !== 'dark') fail('Rivet Dark Theme identity is invalid');
if (resolution.schema !== 'neosmartui/theme-resolution@1' || resolution.flavor !== 'flavor.rivet' || resolution.theme !== 'Rivet Dark') fail('Rivet Dark resolution identity is invalid');
if (bundle.schema !== 'neosmartui/resolved-token-bundle@1' || bundle.flavor !== 'flavor.rivet' || bundle.theme !== 'Rivet Dark') fail('Rivet Dark bundle identity is invalid');
if (resolution.scope.length !== 50 || bundle.scope.length !== 50 || bundle.values.length !== 55 || new Set(bundle.values.map((entry) => entry.id)).size !== 55) fail('maintained Rivet Dark must preserve the exact local 50-Core/55-token Theme boundary');

for (const path of ['apps/foundry/fragments/rivet-dark.html','tests/browser/foundry-rivet-dark.spec.mjs','tooling/validators/validate-rivet-dark-theme.mjs','tooling/foundry/assemble-rivet-dark.mjs']) await access(resolve(root, path));

const proofPath = 'evidence/public/flavor.rivet.json';
const proof = await json(proofPath);
if (proof.flavor !== 'flavor.rivet') fail('Rivet public-proof subject drifted');
const requiredProofPaths = [
  'packages/themes/rivet-light/theme.json',
  'packages/themes/rivet-light/resolution.json',
  'packages/themes/rivet-light/tokens.json',
  'apps/foundry/src/flavors/rivet/index.html',
  'packages/themes/rivet-dark/theme.json',
  'packages/themes/rivet-dark/resolution.json',
  'packages/themes/rivet-dark/tokens.json',
  'apps/foundry/fragments/rivet-dark.html',
  'tooling/foundry/assemble-rivet-dark.mjs'
];
const proofByPath = new Map(proof.implementationFiles.map((entry) => [entry.path, entry.blobSha]));
if (proofByPath.size !== requiredProofPaths.length) fail('Rivet public proof must bind exactly the Light source inputs, Dark source inputs, and deterministic Rivet Dark assembler');
for (const path of requiredProofPaths) if (!proofByPath.has(path)) fail(`Rivet public proof missing implementation binding: ${path}`);
const maintenanceRecords = await loadPublicProofMaintenance({ root, fail });
await validatePublicProofBindings({ root, subject: 'flavor.rivet', proofPath, proof, maintenanceRecords, fail });
if (proof.live.pageUrl !== 'https://neosmartui.github.io/flavors/rivet/') fail('Rivet public proof must retain the canonical Flavor route');
for (const assetUrl of ['https://neosmartui.github.io/rivet-theme.css', 'https://neosmartui.github.io/rivet-dark-theme.css']) {
  if (!(proof.live.assetUrls ?? []).includes(assetUrl)) fail(`Rivet public proof missing live Theme asset: ${assetUrl}`);
}

try { await access(resolve(root, 'packages/flavors/rivet-dark')); fail('Rivet Dark must remain a Theme of flavor.rivet, not a new Flavor'); } catch (error) { if (error?.message?.startsWith('[rivet-dark-contract]')) throw error; if (error?.code !== 'ENOENT') throw error; }
try { await access(resolve(root, 'apps/foundry/src/flavors/rivet-dark')); fail('Rivet Dark must extend the canonical Rivet route, not create a route fork'); } catch (error) { if (error?.message?.startsWith('[rivet-dark-contract]')) throw error; if (error?.code !== 'ENOENT') throw error; }

const packageJson = await json('package.json');
const expectedBuild = 'node tooling/foundry/build.mjs && node tooling/foundry/assemble-component-previews.mjs && node tooling/foundry/assemble-soft-dark.mjs && node tooling/foundry/assemble-rivet-dark.mjs && node tooling/foundry/assemble-mono-dark.mjs && node tooling/foundry/assemble-pulse-dark.mjs';
if (packageJson.scripts['build:foundry'] !== expectedBuild) fail('Rivet Dark must remain the second proof-bound Flavor-dark assembler after shared Component-preview + Soft assembly and before Mono/Pulse Dark');
if (packageJson.scripts['validate:rivet-dark'] !== 'node tooling/validators/validate-rivet-dark-theme.mjs') fail('Rivet Dark implementation validator must be wired explicitly');
const builder = await readFile(resolve(root, 'tooling/foundry/build.mjs'), 'utf8');
const softAssembler = await readFile(resolve(root, 'tooling/foundry/assemble-soft-dark.mjs'), 'utf8');
const rivetAssembler = await readFile(resolve(root, 'tooling/foundry/assemble-rivet-dark.mjs'), 'utf8');
if (builder.includes('rivet-dark')) fail('Rivet Dark must not mutate the shared proven builder');
if (softAssembler.includes('rivet-dark')) fail('Rivet Dark must not mutate or overload the proven Soft Dark assembler');
if (rivetAssembler.includes('mono-dark')) fail('Mono Dark must not mutate or overload the proven Rivet Dark assembler');

const docs = await readFile(resolve(root, 'spec/flavors/RIVET.md'), 'utf8');
for (const marker of [
  'Rivet Dark contract maturity: `contract-only`',
  'Rivet Dark implementation maturity: `public-proof`',
  'Rivet Dark public-proof status: **public-proof**',
  '`packages/themes/rivet-dark/tokens.json`',
  '`packages/themes/rivet-dark/resolution.json`',
  '`tooling/foundry/assemble-rivet-dark.mjs`',
  '`rivet-dark-theme.css`',
  '`5px → 3px → 0px` structural depth',
  '`0px → 2px → 5px` inward travel',
  '`80ms / 140ms / 160ms` pressure timings',
  'Rivet Dark is `public-proof`',
  'Chromium: `136/136`',
  'Public-proof promotion does not redeploy Pages',
  'Rivet Dark is complete through public proof',
  'NeoBrutalRivet/NeoBrutal-Rivet@bb4b641d35bc77c958b7345a3b7c0a134c7d802d',
  '`knowledge-only-until-reviewed`'
]) if (!docs.includes(marker)) fail(`Rivet Dark public-proof docs missing marker: ${marker}`);

console.log('[rivet-dark-contract] validated public-proof Rivet Dark ownership, provenance, exact public-proof 49/55 boundary, exact singleton implementation bindings, additive assembly, and live Theme assets');
