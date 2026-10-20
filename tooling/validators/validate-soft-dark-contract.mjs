import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadPublicProofMaintenance, validatePublicProofBindings } from './public-proof-bindings.mjs';

const root = resolve(import.meta.dirname, '../..');
const fail = (message) => { throw new Error(`[soft-dark-contract] ${message}`); };
const json = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const expectAbsent = async (path, message) => {
  try { await access(resolve(root, path)); fail(message); }
  catch (error) { if (error?.message?.startsWith('[soft-dark-contract]')) throw error; if (error?.code !== 'ENOENT') throw error; }
};

const canonical = await readFile(resolve(root, 'docs/CANONICAL-PRD.md'), 'utf8');
if (!canonical.includes('Hardline\n\nSoft\n\nRivet\n\nMono\n\nlight/dark')) fail('Canonical v0.3 Flavor Engine no longer requires the official Flavor set followed by light/dark completion');

const migration = await json('migration/inventory.json');
const softSource = migration.sources.find((entry) => entry.repository === 'NeoBrutalism-shop/NeoBrutal-Soft');
if (!softSource) fail('pinned Soft migration source is missing');
if (softSource.sha !== 'dfed77bd159ac5c38081f7a4ca5c2229b61ffb8a') fail('Soft migration source SHA drifted');
if (softSource.status !== 'snapshot-pinned' || softSource.copyPolicy !== 'knowledge-only-until-reviewed') fail('Soft migration source must remain snapshot-pinned and knowledge-only-until-reviewed');
if (softSource.licenseEvidence?.status !== 'not-declared-in-repository-metadata') fail('Soft migration license-evidence boundary drifted');
const designDecision = migration.artifacts.find((entry) => entry.id === 'legacy.soft.design-language');
if (!designDecision || designDecision.sourceRepository !== 'NeoBrutalism-shop/NeoBrutal-Soft' || designDecision.sourcePath !== 'DESIGN.md' || designDecision.decision !== 'ADAPT' || designDecision.targetLayer !== 'flavor') fail('legacy.soft.design-language must remain ADAPT → flavor knowledge evidence');

const flavor = await json('packages/flavors/soft/flavor.json');
if (flavor.schema !== 'neosmartui/flavor@1' || flavor.id !== 'flavor.soft' || flavor.name !== 'Soft') fail('Soft Flavor identity is invalid');
if (flavor.interactionModel !== 'pressure-not-levitation') fail('Soft Dark must preserve pressure-not-levitation');

const light = await json('packages/themes/soft-light/theme.json');
const dark = await json('packages/themes/soft-dark/theme.json');
if (light.schema !== 'neosmartui/theme@1' || light.name !== 'Soft Light' || light.category !== 'soft' || light.color?.mode !== 'light') fail('Soft Light baseline identity drifted');
if (dark.schema !== 'neosmartui/theme@1' || dark.name !== 'Soft Dark' || dark.family !== 'neosmartui' || dark.category !== 'soft') fail('Soft Dark Theme identity is invalid');
if (dark.color?.mode !== 'dark' || dark.color?.strategy !== 'warm-neutral-softened-blue-dark') fail('Soft Dark must declare an authored dark warm-neutral/softened-blue color strategy');
if (dark.typography?.strategy !== 'readable-system-first') fail('Soft Dark must preserve long-session readable system typography');
if (dark.geometry?.profile !== 'moderate-rounded' || dark.border?.profile !== 'visible-moderate' || dark.shadow?.model !== 'shallow-hard-depth') fail('Soft Dark structural expression must preserve the Soft profile');
if (dark.spacing?.density !== 'comfortable' || dark.density?.control !== 'comfortable') fail('Soft Dark must preserve comfortable application density');
if (dark.motion?.model !== 'pressure-not-levitation' || dark.motion?.intensity !== 'restrained') fail('Soft Dark must preserve restrained pressure motion');
if (dark.interaction?.model !== 'pressure-not-levitation' || dark.interaction?.selection !== 'seated') fail('Soft Dark must preserve pressure and seated selection');
if (dark.icons?.strategy !== 'adapter-owned') fail('Soft Dark must preserve adapter-owned icon ownership');

for (const path of ['packages/themes/soft-dark/resolution.json','packages/themes/soft-dark/tokens.json','apps/foundry/fragments/soft-dark.html','tests/browser/foundry-soft-dark.spec.mjs','tooling/validators/validate-soft-dark-theme.mjs','tooling/foundry/assemble-soft-dark.mjs']) await access(resolve(root, path));
await expectAbsent('packages/flavors/soft-dark', 'Soft Dark is a Theme of flavor.soft, not a new Flavor identity');
await expectAbsent('apps/foundry/src/flavors/soft-dark', 'Soft Dark must extend the canonical Soft Flavor route rather than create a route fork');

const resolution = await json('packages/themes/soft-dark/resolution.json');
const bundle = await json('packages/themes/soft-dark/tokens.json');
const lightResolution = await json('packages/themes/soft-light/resolution.json');
const lightBundle = await json('packages/themes/soft-light/tokens.json');
if (resolution.scope.length !== 50 || bundle.scope.length !== 50 || [...resolution.scope].sort().join('|') !== [...bundle.scope].sort().join('|')) fail('Soft Dark must retain the exact maintained local 50-component Core scope');
if (bundle.values.length !== 55 || new Set(bundle.values.map((entry) => entry.id)).size !== 55) fail('Soft Dark must resolve exactly 55 unique semantic dependencies');
if ([...resolution.scope].sort().join('|') !== [...lightResolution.scope].sort().join('|')) fail('Soft Dark and Soft Light must resolve the same Core scope');
if (new Set(lightBundle.values.map((entry) => entry.id)).size !== 55) fail('Soft Light dependency baseline drifted');

const packageJson = await json('package.json');
const expectedBuild = 'node tooling/foundry/build.mjs && node tooling/foundry/assemble-component-previews.mjs && node tooling/foundry/assemble-soft-dark.mjs && node tooling/foundry/assemble-rivet-dark.mjs && node tooling/foundry/assemble-mono-dark.mjs && node tooling/foundry/assemble-pulse-dark.mjs';
if (packageJson.scripts?.['build:foundry'] !== expectedBuild) fail('Soft Dark must remain the first proof-bound Flavor-dark assembler after shared Component-preview assembly and before Rivet/Mono/Pulse Dark');
const assembler = await readFile(resolve(root, 'tooling/foundry/assemble-soft-dark.mjs'), 'utf8');
for (const marker of ['packages/themes/soft-dark/tokens.json','soft-dark-theme.css','apps/foundry/fragments/soft-dark.html','flavors/soft/index.html','Soft route is missing the Light Theme stylesheet marker required for Dark assembly','Soft route is missing the canonical return-link insertion marker required for Dark assembly']) if (!assembler.includes(marker)) fail(`Soft Dark assembler missing proof-safe assembly marker: ${marker}`);

const proofPath = 'evidence/public/flavor.soft.json';
const proof = await json(proofPath);
if (proof.flavor !== 'flavor.soft') fail('Soft public-proof subject drifted');
const requiredProofPaths = ['packages/themes/soft-light/theme.json','packages/themes/soft-light/resolution.json','packages/themes/soft-light/tokens.json','apps/foundry/src/flavors/soft/index.html','packages/themes/soft-dark/theme.json','packages/themes/soft-dark/resolution.json','packages/themes/soft-dark/tokens.json','apps/foundry/fragments/soft-dark.html','tooling/foundry/assemble-soft-dark.mjs'];
const proofByPath = new Map(proof.implementationFiles.map((entry) => [entry.path, entry.blobSha]));
if (proofByPath.size !== requiredProofPaths.length) fail('Soft public proof must bind exactly the Light source inputs, Dark source inputs, and deterministic Soft Dark assembler');
for (const path of requiredProofPaths) if (!proofByPath.has(path)) fail(`Soft public proof missing implementation binding: ${path}`);
const maintenanceRecords = await loadPublicProofMaintenance({ root, fail });
await validatePublicProofBindings({ root, subject: 'flavor.soft', proofPath, proof, maintenanceRecords, fail });
if (proof.live.pageUrl !== 'https://neosmartui.github.io/flavors/soft/') fail('Soft public proof must retain the canonical Flavor route');
for (const assetUrl of ['https://neosmartui.github.io/soft-theme.css', 'https://neosmartui.github.io/soft-dark-theme.css']) if (!(proof.live.assetUrls ?? []).includes(assetUrl)) fail(`Soft public proof missing live Theme asset: ${assetUrl}`);

const docs = await readFile(resolve(root, 'spec/flavors/SOFT.md'), 'utf8');
for (const marker of ['Implemented dark Theme: `packages/themes/soft-dark/theme.json`','Soft Dark maturity: `public-proof`','Soft Dark public-proof status: **public-proof**','second concrete Theme instance of `flavor.soft`','not CSS inversion, filter-based dark mode, or hidden conditional values inside Soft Light','exact shipping **49-Core / 55-token** semantic dependency boundary','exact shipping **49-Core / 55-token** semantic dependency boundary','`3px → 1.5px → 0px` structural depth','`0px → 1.5px → 3px` inward travel','`70ms / 105ms / 165ms` pressure timings','`apps/foundry/fragments/soft-dark.html`','`tooling/foundry/assemble-soft-dark.mjs`','proven Light source route remains byte-identical','Soft Dark is `public-proof`','Chromium `130/130`','Public-proof promotion does not redeploy Pages','Soft Dark is complete through public proof']) if (!docs.includes(marker)) fail(`Soft Dark public-proof docs missing marker: ${marker}`);

console.log('[soft-dark-contract] validated public-proof Soft Dark, pinned provenance, exact public-proof 49/55 boundary, proof-safe assembly, exact implementation bindings, live Theme assets, and ordered downstream Rivet assembly');
