import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadPublicProofMaintenance, validatePublicProofBindings } from './public-proof-bindings.mjs';

const root = resolve(import.meta.dirname, '../..');
const fail = (message) => { throw new Error(`[pulse-proof] ${message}`); };
const json = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));

for (const path of [
  'evidence/public/flavor.pulse.json',
  'packages/themes/pulse-light/theme.json',
  'packages/themes/pulse-light/resolution.json',
  'packages/themes/pulse-light/tokens.json',
  'apps/foundry/src/flavors/pulse/index.html',
  'packages/themes/pulse-dark/theme.json',
  'packages/themes/pulse-dark/resolution.json',
  'packages/themes/pulse-dark/tokens.json',
  'apps/foundry/fragments/pulse-dark.html',
  'tooling/foundry/assemble-pulse-dark.mjs'
]) await access(resolve(root, path));

const proof = await json('evidence/public/flavor.pulse.json');
if (proof.schema !== 'neosmartui/public-proof@1' || proof.flavor !== 'flavor.pulse') fail('Pulse proof identity is invalid');

const expectedProofPaths = [
  'packages/themes/pulse-light/theme.json',
  'packages/themes/pulse-light/resolution.json',
  'packages/themes/pulse-light/tokens.json',
  'apps/foundry/src/flavors/pulse/index.html',
  'packages/themes/pulse-dark/theme.json',
  'packages/themes/pulse-dark/resolution.json',
  'packages/themes/pulse-dark/tokens.json',
  'apps/foundry/fragments/pulse-dark.html',
  'tooling/foundry/assemble-pulse-dark.mjs'
];
if (proof.implementationFiles.map((entry) => entry.path).join('|') !== expectedProofPaths.join('|')) fail('Pulse public proof must bind exactly four Light inputs plus five Dark implementation inputs');
if ((proof.live.assetUrls ?? []).join('|') !== ['https://neosmartui.github.io/pulse-theme.css','https://neosmartui.github.io/pulse-dark-theme.css'].join('|')) fail('Pulse public proof must bind both live Light and Dark Theme assets');
if (proof.live.pageUrl !== 'https://neosmartui.github.io/flavors/pulse/') fail('Pulse public proof must use the canonical Pulse Foundry route');

const maintenanceRecords = await loadPublicProofMaintenance({ root, fail });
await validatePublicProofBindings({
  root,
  subject: 'flavor.pulse',
  proofPath: 'evidence/public/flavor.pulse.json',
  proof,
  maintenanceRecords,
  fail
});

const light = await json('packages/themes/pulse-light/tokens.json');
const dark = await json('packages/themes/pulse-dark/tokens.json');
if (light.flavor !== 'flavor.pulse' || light.theme !== 'Pulse Light' || dark.flavor !== 'flavor.pulse' || dark.theme !== 'Pulse Dark') fail('Pulse public proof Themes do not bind flavor.pulse');
if (light.scope.length !== 50 || dark.scope.length !== 50 || light.values.length !== 55 || dark.values.length !== 55) fail('Pulse maintained files must preserve the exact local 50-Core/55-token Light/Dark boundary');
if ([...light.scope].sort().join('|') !== [...dark.scope].sort().join('|')) fail('Pulse Light/Dark public proof scope drifted');
const lightValues = new Map(light.values.map((entry) => [entry.id, entry.value]));
for (const entry of dark.values) if (!entry.id.startsWith('color.') && JSON.stringify(entry.value) !== JSON.stringify(lightValues.get(entry.id))) fail(`Pulse Dark public proof must preserve Light non-color invariant ${entry.id}`);

const packageJson = await json('package.json');
const expectedBuild = 'node tooling/foundry/build.mjs && node tooling/foundry/assemble-component-previews.mjs && node tooling/foundry/assemble-soft-dark.mjs && node tooling/foundry/assemble-rivet-dark.mjs && node tooling/foundry/assemble-mono-dark.mjs && node tooling/foundry/assemble-pulse-dark.mjs';
if (packageJson.scripts?.['build:foundry'] !== expectedBuild) fail('Pulse Dark must remain the final additive Flavor-dark assembler after existing proof-bound assembly stages');

const builder = await readFile(resolve(root, 'tooling/foundry/build.mjs'), 'utf8');
const softAssembler = await readFile(resolve(root, 'tooling/foundry/assemble-soft-dark.mjs'), 'utf8');
const rivetAssembler = await readFile(resolve(root, 'tooling/foundry/assemble-rivet-dark.mjs'), 'utf8');
const monoAssembler = await readFile(resolve(root, 'tooling/foundry/assemble-mono-dark.mjs'), 'utf8');
if (builder.includes('pulse-dark')) fail('Pulse Dark must not mutate the shared proven builder');
if (softAssembler.includes('pulse-dark')) fail('Pulse Dark must not mutate the proven Soft Dark assembler');
if (rivetAssembler.includes('pulse-dark')) fail('Pulse Dark must not mutate the proven Rivet Dark assembler');
if (monoAssembler.includes('pulse-dark')) fail('Pulse Dark must not mutate the proven Mono Dark assembler');

const docs = await readFile(resolve(root, 'spec/flavors/PULSE.md'), 'utf8');
for (const marker of [
  'Flavor maturity: `public-proof`',
  'Public-proof maturity: `public-proof`',
  'Public-proof record: `evidence/public/flavor.pulse.json`',
  'public-proof compatibility gate is now Hardline / Soft / Rivet / Mono / Pulse',
  'both live Theme CSS assets',
  'Pulse Light and Pulse Dark are complete through public proof',
  'Proof-only promotion does not redeploy Pages',
  'exact **49-component / 55-token singleton cohort**',
  'exact shipping **49-Core / 55-token** semantic dependency boundary'
]) if (!docs.includes(marker)) fail(`Pulse public-proof docs missing marker: ${marker}`);

console.log('[pulse-proof] validated nine-file Pulse Light/Dark binding, exact public-proof 49/55 parity, additive assembly, and both live Theme assets');
