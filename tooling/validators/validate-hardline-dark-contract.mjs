import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadPublicProofMaintenance, validatePublicProofBindings } from './public-proof-bindings.mjs';

const root = resolve(import.meta.dirname, '../..');
const fail = (message) => { throw new Error(`[hardline-dark-contract] ${message}`); };
const json = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const expectAbsent = async (path, message) => {
  try {
    await access(resolve(root, path));
    fail(message);
  } catch (error) {
    if (error?.message?.startsWith('[hardline-dark-contract]')) throw error;
    if (error?.code !== 'ENOENT') throw error;
  }
};

const canonical = await readFile(resolve(root, 'docs/CANONICAL-PRD.md'), 'utf8');
if (!canonical.includes('Hardline becomes the default NeoSmartUXUI personality.')) fail('Canonical PRD no longer identifies Hardline as the flagship/default Flavor');
if (!canonical.includes('Hardline\n\nSoft\n\nRivet\n\nMono\n\nlight/dark')) fail('Canonical v0.3 Flavor Engine no longer requires the official Flavor set followed by light/dark completion');

const flavor = await json('packages/flavors/hardline/flavor.json');
if (flavor.schema !== 'neosmartui/flavor@1' || flavor.id !== 'flavor.hardline' || flavor.name !== 'Hardline') fail('Hardline Flavor identity is invalid');
if (flavor.interactionModel !== 'pressure-not-levitation') fail('Hardline Dark must preserve pressure-not-levitation');

const light = await json('packages/themes/hardline-light/theme.json');
const dark = await json('packages/themes/hardline-dark/theme.json');
if (light.schema !== 'neosmartui/theme@1' || light.name !== 'Hardline Light' || light.category !== 'hardline' || light.color?.mode !== 'light') fail('Hardline Light baseline identity drifted');
if (dark.schema !== 'neosmartui/theme@1' || dark.name !== 'Hardline Dark' || dark.family !== 'neosmartui' || dark.category !== 'hardline') fail('Hardline Dark Theme identity is invalid');
if (dark.color?.mode !== 'dark' || dark.color?.strategy !== 'high-reaction-dark') fail('Hardline Dark must declare an explicit dark high-reaction color strategy');
if (dark.typography?.strategy !== 'sharp-system-first') fail('Hardline Dark must preserve Hardline typography strategy');
if (dark.geometry?.profile !== 'square-zero-radius-default' || dark.border?.profile !== 'hard' || dark.shadow?.model !== 'strong-structural-depth') fail('Hardline Dark structural expression must preserve the flagship Hardline profile');
if (dark.spacing?.density !== 'compact' || dark.density?.control !== 'compact') fail('Hardline Dark must preserve compact Hardline density');
if (dark.motion?.model !== 'pressure-not-levitation' || dark.motion?.intensity !== 'restrained') fail('Hardline Dark must preserve restrained pressure motion');
if (dark.interaction?.model !== 'pressure-not-levitation' || dark.interaction?.selection !== 'seated') fail('Hardline Dark must preserve pressure and seated selection');
if (dark.icons?.strategy !== 'adapter-owned' || dark.icons?.treatment !== 'sharp') fail('Hardline Dark must preserve adapter-owned sharp icon treatment');

for (const path of [
  'packages/themes/hardline-dark/resolution.json',
  'packages/themes/hardline-dark/tokens.json',
  'apps/foundry/fragments/hardline-dark.html',
  'tests/browser/foundry-hardline-dark.spec.mjs',
  'tooling/validators/validate-hardline-dark-theme.mjs'
]) await access(resolve(root, path));
await expectAbsent('apps/foundry/src/flavors/hardline-dark', 'Hardline Dark must extend the canonical Hardline Flavor route rather than creating a route fork');

const builder = await readFile(resolve(root, 'tooling/foundry/build.mjs'), 'utf8');
for (const marker of [
  'apps/foundry/fragments/hardline-dark.html',
  'hardline-dark-theme.css',
  'flavors/hardline/index.html',
  'Hardline route is missing the Light Theme stylesheet marker required for Dark assembly',
  'Hardline route is missing the canonical return-link insertion marker required for Dark assembly'
]) if (!builder.includes(marker)) fail(`Hardline Dark builder missing proof-safe assembly marker: ${marker}`);

const proofPath = 'evidence/public/flavor.hardline.json';
const proof = await json(proofPath);
if (proof.flavor !== 'flavor.hardline') fail('Hardline public-proof subject drifted');
const requiredProofPaths = [
  'packages/themes/hardline-light/theme.json',
  'packages/themes/hardline-light/resolution.json',
  'packages/themes/hardline-light/tokens.json',
  'apps/foundry/src/flavors/hardline/index.html',
  'packages/themes/hardline-dark/theme.json',
  'packages/themes/hardline-dark/resolution.json',
  'packages/themes/hardline-dark/tokens.json',
  'apps/foundry/fragments/hardline-dark.html',
  'tooling/foundry/build.mjs'
];
const proofByPath = new Map(proof.implementationFiles.map((entry) => [entry.path, entry.blobSha]));
if (proofByPath.size !== requiredProofPaths.length) fail('Hardline public proof must bind exactly the Light source inputs, Dark source inputs, and deterministic builder');
for (const path of requiredProofPaths) if (!proofByPath.has(path)) fail(`Hardline public proof missing implementation binding: ${path}`);
const maintenanceRecords = await loadPublicProofMaintenance({ root, fail });
await validatePublicProofBindings({ root, subject: 'flavor.hardline', proofPath, proof, maintenanceRecords, fail });
if (proof.live.pageUrl !== 'https://neosmartuxui.github.io/flavors/hardline/') fail('Hardline public proof must retain the canonical Flavor route');
for (const assetUrl of ['https://neosmartuxui.github.io/hardline-theme.css', 'https://neosmartuxui.github.io/hardline-dark-theme.css']) {
  if (!(proof.live.assetUrls ?? []).includes(assetUrl)) fail(`Hardline public proof missing live Theme asset: ${assetUrl}`);
}

const docs = await readFile(resolve(root, 'spec/flavors/HARDLINE.md'), 'utf8');
for (const marker of [
  'Implemented dark Theme: `packages/themes/hardline-dark/theme.json`',
  'Hardline Dark maturity: `public-proof`',
  'second concrete Theme instance of `flavor.hardline`',
  'not implemented as CSS inversion, filter-based dark mode, or hidden conditional values inside Hardline Light',
  'exact shipping **49-Core / 55-token** semantic dependency boundary',
  'exact shipping **49-Core / 55-token** semantic dependency boundary',
  '`4px → 2px → 0px` structural depth',
  '`0px → 2px → 4px` inward travel',
  '`70ms / 110ms / 170ms` pressure timings',
  'existing `/flavors/hardline/` proof surface',
  'Light and Dark together',
  '`apps/foundry/fragments/hardline-dark.html`',
  'proven Light source route remains byte-identical',
  'Hardline Dark is `public-proof`',
  'Public-proof promotion does not redeploy Pages'
]) if (!docs.includes(marker)) fail(`Hardline Dark public-proof docs missing marker: ${marker}`);

console.log('[hardline-dark-contract] validated public-proof Hardline Dark, proof-safe route assembly, exact singleton implementation bindings, shared adapters, and singleton live assets');
