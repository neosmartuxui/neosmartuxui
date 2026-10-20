import { access, readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const fail = (message) => { throw new Error(`[flavors] ${message}`); };
const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const sameKeys = (object, expected) => {
  const actual = Object.keys(object).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
};
const expectAbsent = async (path, message) => {
  try {
    await access(resolve(root, path));
    fail(message);
  } catch (error) {
    if (error?.message?.startsWith('[flavors]')) throw error;
    if (error?.code !== 'ENOENT') throw error;
  }
};
const toMap = (values) => new Map(values.map((entry) => [entry.id, entry]));

const flavorSchema = await readJson('spec/schemas/flavor.schema.json');
const themeSchema = await readJson('spec/schemas/theme.schema.json');
if (flavorSchema.properties?.schema?.const !== 'neosmartui/flavor@1') fail('Flavor schema identity drifted');
if (themeSchema.properties?.schema?.const !== 'neosmartui/theme@1') fail('Theme schema identity drifted');

const flavorDirs = (await readdir(resolve(root, 'packages/flavors'), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
if (flavorDirs.join(',') !== 'hardline,mono,pulse,rivet,soft') fail(`Official Flavor manifest set expects exactly hardline,mono,pulse,rivet,soft; got ${flavorDirs.join(',')}`);

const flavorKeys = ['$schema', 'schema', 'id', 'name', 'intent', 'interactionModel'];
const hardline = await readJson('packages/flavors/hardline/flavor.json');
const mono = await readJson('packages/flavors/mono/flavor.json');
const pulse = await readJson('packages/flavors/pulse/flavor.json');
const rivet = await readJson('packages/flavors/rivet/flavor.json');
const soft = await readJson('packages/flavors/soft/flavor.json');
for (const [label, flavor, expectedId, expectedName] of [
  ['Hardline', hardline, 'flavor.hardline', 'Hardline'],
  ['Mono', mono, 'flavor.mono', 'Mono'],
  ['Pulse', pulse, 'flavor.pulse', 'Pulse'],
  ['Rivet', rivet, 'flavor.rivet', 'Rivet'],
  ['Soft', soft, 'flavor.soft', 'Soft']
]) {
  if (!sameKeys(flavor, flavorKeys)) fail(`${label} Flavor manifest must expose only the canonical Flavor fields`);
  if (flavor.schema !== 'neosmartui/flavor@1' || flavor.id !== expectedId || flavor.name !== expectedName) fail(`${label} Flavor identity is invalid`);
  if (!/^flavor\.[a-z][a-z0-9-]*$/.test(flavor.id)) fail(`${label} Flavor stable ID is invalid`);
  if (!flavor.intent || typeof flavor.intent !== 'string') fail(`${label} Flavor intent is required`);
  if (flavor.interactionModel !== 'pressure-not-levitation') fail(`${label} must preserve pressure-not-levitation`);
}
if (!hardline.intent.includes('Flagship sharp neo-brutalist expression')) fail('Hardline must identify itself as the flagship sharp expression');
if (!hardline.intent.includes('square geometry') || !hardline.intent.includes('seated selection')) fail('Hardline intent must encode sharp geometry and seated selection');
if (!soft.intent.includes('Calm application-oriented neo-brutalist expression')) fail('Soft must identify itself as the calm application-oriented expression');
for (const marker of ['moderate rounding', 'shallow hard depth', 'warm neutral surfaces', 'softened blue accents', 'seated selection']) {
  if (!soft.intent.includes(marker)) fail(`Soft intent must encode ${marker}`);
}
if (!pulse.intent.includes('SaaS-forward high-energy neo-brutalist expression')) fail('Pulse must identify itself as the SaaS-forward high-energy expression');
for (const marker of ['sharp geometry', 'compact application density', 'crisp neutral surfaces', 'saturated accent reactions', 'data-heavy clarity', 'seated selection']) {
  if (!pulse.intent.includes(marker)) fail(`Pulse intent must encode ${marker}`);
}

if (!mono.intent.includes('Editorial black/white/gray neo-brutalist expression')) fail('Mono must identify itself as the editorial monochrome expression');
for (const marker of ['type-led hierarchy', 'restrained monochrome surfaces', 'crisp print-like structural depth', 'seated selection']) {
  if (!mono.intent.includes(marker)) fail(`Mono intent must encode ${marker}`);
}

const themeKeys = ['$schema', 'schema', 'name', 'family', 'category', 'color', 'typography', 'geometry', 'border', 'shadow', 'spacing', 'density', 'motion', 'interaction', 'icons'];
const hardlineLight = await readJson('packages/themes/hardline-light/theme.json');
if (!sameKeys(hardlineLight, themeKeys)) fail('Hardline Light must expose exactly the canonical neosmartui/theme@1 fields');
if (hardlineLight.schema !== 'neosmartui/theme@1' || hardlineLight.name !== 'Hardline Light' || hardlineLight.family !== 'neosmartui' || hardlineLight.category !== 'hardline') fail('Hardline Light Theme identity is invalid');
if (hardlineLight.color?.mode !== 'light' || hardlineLight.color?.strategy !== 'high-reaction') fail('Hardline Light must declare light/high-reaction color intent');
if (hardlineLight.geometry?.profile !== 'square-zero-radius-default') fail('Hardline Light must make square/zero-radius its default geometry profile');
if (hardlineLight.border?.profile !== 'hard') fail('Hardline Light must declare hard boundaries');
if (hardlineLight.shadow?.model !== 'strong-structural-depth') fail('Hardline Light must declare strong structural depth');
if (hardlineLight.motion?.model !== 'pressure-not-levitation' || hardlineLight.motion?.intensity !== 'restrained') fail('Hardline Light motion must preserve pressure with restrained decoration');
if (hardlineLight.interaction?.model !== 'pressure-not-levitation' || hardlineLight.interaction?.selection !== 'seated') fail('Hardline Light interaction must preserve pressure and seated selection');
if (hardlineLight.icons?.strategy !== 'adapter-owned') fail('Hardline Theme must not take renderer ownership of icons');

const hardlineResolution = await readJson('packages/themes/hardline-light/resolution.json');
const hardlineBundle = await readJson('packages/themes/hardline-light/tokens.json');
if (hardlineResolution.schema !== 'neosmartui/theme-resolution@1' || hardlineResolution.flavor !== 'flavor.hardline' || hardlineResolution.theme !== 'Hardline Light' || hardlineResolution.bundle !== 'tokens.json') fail('Hardline Light resolution identity is invalid');
if (hardlineBundle.schema !== 'neosmartui/resolved-token-bundle@1' || hardlineBundle.flavor !== 'flavor.hardline' || hardlineBundle.theme !== 'Hardline Light') fail('Hardline Light resolved bundle identity is invalid');
if (hardlineResolution.scope.length !== 50 || hardlineBundle.scope.length !== 50 || [...hardlineResolution.scope].sort().join('|') !== [...hardlineBundle.scope].sort().join('|')) fail('Hardline Light resolution and bundle must share the exact maintained local 50-component Core scope');
if (hardlineBundle.values.length !== 55) fail(`Hardline Light must resolve the exact shipping dependency union of 55 tokens; got ${hardlineBundle.values.length}`);
const hardlineValues = toMap(hardlineBundle.values);
if (hardlineValues.size !== 55) fail('Hardline Light resolved token IDs must be unique');
for (const id of ['radius.control', 'radius.surface', 'radius.annotation']) if (hardlineValues.get(id)?.value !== '0px') fail(`${id} must implement Hardline zero-radius geometry`);
for (const axis of ['x', 'y']) {
  if (hardlineValues.get(`depth.rest.${axis}`)?.value !== '4px' || hardlineValues.get(`depth.hover.${axis}`)?.value !== '2px' || hardlineValues.get(`depth.active.${axis}`)?.value !== '0px') fail(`Hardline ${axis}-axis depth must implement pinned 4→2→0 pressure physics`);
  if (hardlineValues.get(`press.hover.${axis}`)?.value !== '2px' || hardlineValues.get(`press.active.${axis}`)?.value !== '4px') fail(`Hardline ${axis}-axis travel must implement pinned 0→2→4 pressure physics`);
}
if (hardlineValues.get('motion.press.duration')?.value !== '70ms' || hardlineValues.get('motion.release.duration')?.value !== '110ms' || hardlineValues.get('motion.standard.duration')?.value !== '170ms') fail('Hardline timings must preserve the pinned family 70/110/170ms semantic reference');
if (hardlineValues.get('focus.ring.width')?.value !== '3px' || hardlineValues.get('focus.ring.offset')?.value !== '3px') fail('Hardline focus keyline must remain independently visible');
if (hardlineValues.get('size.control.minimum')?.value !== '44px') fail('Hardline must preserve the 44px minimum target');
if (hardlineValues.get('color.action.primary.surface')?.value !== '#ffd84d' || hardlineValues.get('color.action.primary.content')?.value !== '#111111') fail('Hardline primary action must preserve the canonical yellow/ink flagship pairing');

const softLight = await readJson('packages/themes/soft-light/theme.json');
if (!sameKeys(softLight, themeKeys)) fail('Soft Light must expose exactly the canonical neosmartui/theme@1 fields');
if (softLight.schema !== 'neosmartui/theme@1' || softLight.name !== 'Soft Light' || softLight.family !== 'neosmartui' || softLight.category !== 'soft') fail('Soft Light Theme identity is invalid');
if (softLight.color?.mode !== 'light' || softLight.color?.strategy !== 'warm-neutral-softened-blue') fail('Soft Light must declare light warm-neutral/softened-blue color intent');
if (softLight.typography?.strategy !== 'readable-system-first') fail('Soft Light must prioritize long-session readable system typography');
if (softLight.geometry?.profile !== 'moderate-rounded') fail('Soft Light must declare moderate rounding rather than Hardline geometry');
if (softLight.border?.profile !== 'visible-moderate') fail('Soft Light must retain visible moderate structural boundaries');
if (softLight.shadow?.model !== 'shallow-hard-depth') fail('Soft Light must declare shallow hard structural depth');
if (softLight.spacing?.density !== 'comfortable' || softLight.density?.control !== 'comfortable') fail('Soft Light must declare comfortable application density');
if (softLight.motion?.model !== 'pressure-not-levitation' || softLight.motion?.intensity !== 'restrained') fail('Soft Light motion must preserve pressure with restrained movement');
if (softLight.interaction?.model !== 'pressure-not-levitation' || softLight.interaction?.selection !== 'seated') fail('Soft Light interaction must preserve pressure and seated selection');
if (softLight.icons?.strategy !== 'adapter-owned') fail('Soft Theme must not take renderer ownership of icons');

const softResolution = await readJson('packages/themes/soft-light/resolution.json');
const softBundle = await readJson('packages/themes/soft-light/tokens.json');
if (softResolution.schema !== 'neosmartui/theme-resolution@1' || softResolution.flavor !== 'flavor.soft' || softResolution.theme !== 'Soft Light' || softResolution.bundle !== 'tokens.json') fail('Soft Light resolution identity is invalid');
if (softBundle.schema !== 'neosmartui/resolved-token-bundle@1' || softBundle.flavor !== 'flavor.soft' || softBundle.theme !== 'Soft Light') fail('Soft Light resolved bundle identity is invalid');
if (softResolution.scope.length !== 50 || softBundle.scope.length !== 50 || [...softResolution.scope].sort().join('|') !== [...softBundle.scope].sort().join('|')) fail('Soft Light resolution and bundle must share the exact maintained local 50-component Core scope');
if (softBundle.values.length !== 55) fail(`Soft Light must resolve the exact shipping dependency union of 55 tokens; got ${softBundle.values.length}`);
const softValues = toMap(softBundle.values);
if (softValues.size !== 55) fail('Soft Light resolved token IDs must be unique');
if (softValues.get('border.control.width')?.value !== '2px' || softValues.get('border.surface.width')?.value !== '2px' || softValues.get('border.annotation.width')?.value !== '2px') fail('Soft Light must implement visible 2px boundaries');
if (softValues.get('radius.control')?.value !== '8px' || softValues.get('radius.surface')?.value !== '12px' || softValues.get('radius.annotation')?.value !== '999px') fail('Soft Light must implement moderate 8/12/pill geometry');
for (const axis of ['x', 'y']) {
  if (softValues.get(`depth.rest.${axis}`)?.value !== '3px' || softValues.get(`depth.hover.${axis}`)?.value !== '1.5px' || softValues.get(`depth.active.${axis}`)?.value !== '0px') fail(`Soft ${axis}-axis depth must implement pinned 3→1.5→0 pressure physics`);
  if (softValues.get(`press.hover.${axis}`)?.value !== '1.5px' || softValues.get(`press.active.${axis}`)?.value !== '3px') fail(`Soft ${axis}-axis travel must implement pinned 0→1.5→3 pressure physics`);
}
if (softValues.get('motion.press.duration')?.value !== '70ms' || softValues.get('motion.release.duration')?.value !== '105ms' || softValues.get('motion.standard.duration')?.value !== '165ms') fail('Soft Light timings must preserve restrained 70/105/165ms semantic timing');
if (softValues.get('focus.ring.width')?.value !== '3px' || softValues.get('focus.ring.offset')?.value !== '3px') fail('Soft Light focus keyline must remain independently visible');
if (softValues.get('size.control.minimum')?.value !== '44px') fail('Soft Light must preserve the 44px minimum target');
if (softValues.get('color.surface.interactive')?.value !== '#fffaf2' || softValues.get('color.surface.panel')?.value !== '#f7f1e7') fail('Soft Light must preserve warm neutral surfaces');
if (softValues.get('color.action.primary.surface')?.value !== '#8bb8f8' || softValues.get('color.action.primary.content')?.value !== '#171717') fail('Soft Light primary action must preserve softened-blue/ink pairing');

const pulseLight = await readJson('packages/themes/pulse-light/theme.json');
if (!sameKeys(pulseLight, themeKeys)) fail('Pulse Light must expose exactly the canonical neosmartui/theme@1 fields');
if (pulseLight.schema !== 'neosmartui/theme@1' || pulseLight.name !== 'Pulse Light' || pulseLight.family !== 'neosmartui' || pulseLight.category !== 'pulse') fail('Pulse Light Theme identity is invalid');
if (pulseLight.color?.mode !== 'light' || pulseLight.color?.strategy !== 'crisp-neutral-electric-violet') fail('Pulse Light must declare crisp-neutral/electric-violet light intent');
if (pulseLight.typography?.strategy !== 'product-system-first') fail('Pulse Light must declare product-oriented system typography');
if (pulseLight.geometry?.profile !== 'sharp-micro' || pulseLight.border?.profile !== 'visible-compact' || pulseLight.shadow?.model !== 'medium-hard-depth') fail('Pulse Light structural descriptor drifted');
if (pulseLight.spacing?.density !== 'compact' || pulseLight.density?.control !== 'compact-accessible') fail('Pulse Light must preserve compact-but-accessible density');
if (pulseLight.motion?.model !== 'pressure-not-levitation' || pulseLight.motion?.intensity !== 'restrained') fail('Pulse Light motion must preserve restrained pressure');
if (pulseLight.interaction?.model !== 'pressure-not-levitation' || pulseLight.interaction?.selection !== 'seated') fail('Pulse Light interaction must preserve pressure and seated selection');
if (pulseLight.icons?.strategy !== 'adapter-owned') fail('Pulse Light must preserve adapter-owned icons');

const pulseResolution = await readJson('packages/themes/pulse-light/resolution.json');
const pulseBundle = await readJson('packages/themes/pulse-light/tokens.json');
if (pulseResolution.schema !== 'neosmartui/theme-resolution@1' || pulseResolution.flavor !== 'flavor.pulse' || pulseResolution.theme !== 'Pulse Light' || pulseResolution.bundle !== 'tokens.json') fail('Pulse Light resolution identity is invalid');
if (pulseBundle.schema !== 'neosmartui/resolved-token-bundle@1' || pulseBundle.flavor !== 'flavor.pulse' || pulseBundle.theme !== 'Pulse Light') fail('Pulse Light bundle identity is invalid');
if (pulseResolution.scope.length !== 50 || pulseBundle.scope.length !== 50 || pulseBundle.values.length !== 55 || new Set(pulseBundle.values.map((entry) => entry.id)).size !== 55) fail('Pulse Light must preserve exact maintained local 50/55 resolution');
if ([...pulseResolution.scope].sort().join('|') !== [...pulseBundle.scope].sort().join('|')) fail('Pulse Light resolution and bundle scope must match');
const pulseValues = toMap(pulseBundle.values);
if (pulseValues.get('border.control.width')?.value !== '2px' || pulseValues.get('radius.control')?.value !== '4px' || pulseValues.get('radius.surface')?.value !== '6px') fail('Pulse Light compact structure drifted');
for (const axis of ['x', 'y']) {
  if (pulseValues.get(`depth.rest.${axis}`)?.value !== '4px' || pulseValues.get(`depth.hover.${axis}`)?.value !== '2px' || pulseValues.get(`depth.active.${axis}`)?.value !== '0px') fail(`Pulse ${axis}-axis depth must preserve 4→2→0 pressure physics`);
  if (pulseValues.get(`press.hover.${axis}`)?.value !== '2px' || pulseValues.get(`press.active.${axis}`)?.value !== '4px') fail(`Pulse ${axis}-axis travel must preserve 0→2→4 pressure physics`);
}
if (pulseValues.get('size.control.minimum')?.value !== '44px' || pulseValues.get('focus.ring.width')?.value !== '3px' || pulseValues.get('focus.ring.offset')?.value !== '3px') fail('Pulse Light accessibility geometry drifted');
if (pulseValues.get('color.action.primary.surface')?.value !== '#6c5ce7' || pulseValues.get('color.action.primary.content')?.value !== '#ffffff') fail('Pulse Light primary action identity drifted');

const pulseDark = await readJson('packages/themes/pulse-dark/theme.json');
if (!sameKeys(pulseDark, themeKeys)) fail('Pulse Dark must expose exactly the canonical neosmartui/theme@1 fields');
if (pulseDark.schema !== 'neosmartui/theme@1' || pulseDark.name !== 'Pulse Dark' || pulseDark.family !== 'neosmartui' || pulseDark.category !== 'pulse') fail('Pulse Dark Theme identity is invalid');
if (pulseDark.color?.mode !== 'dark' || pulseDark.color?.strategy !== 'crisp-charcoal-electric-violet') fail('Pulse Dark must declare authored charcoal/electric-violet dark intent');
if (pulseDark.typography?.strategy !== pulseLight.typography?.strategy) fail('Pulse Dark must preserve Pulse Light typography strategy');
if (pulseDark.geometry?.profile !== pulseLight.geometry?.profile || pulseDark.border?.profile !== pulseLight.border?.profile || pulseDark.shadow?.model !== pulseLight.shadow?.model) fail('Pulse Dark must preserve Pulse Light structural descriptors');
if (pulseDark.spacing?.density !== pulseLight.spacing?.density || pulseDark.density?.control !== pulseLight.density?.control) fail('Pulse Dark must preserve Pulse Light compact-accessible density');
if (pulseDark.motion?.model !== pulseLight.motion?.model || pulseDark.motion?.intensity !== pulseLight.motion?.intensity) fail('Pulse Dark must preserve Pulse Light restrained pressure motion');
if (pulseDark.interaction?.model !== pulseLight.interaction?.model || pulseDark.interaction?.selection !== pulseLight.interaction?.selection) fail('Pulse Dark must preserve Pulse Light pressure and seated selection');
if (pulseDark.icons?.strategy !== pulseLight.icons?.strategy) fail('Pulse Dark must preserve adapter-owned icons');
const pulseDarkResolution = await readJson('packages/themes/pulse-dark/resolution.json');
const pulseDarkBundle = await readJson('packages/themes/pulse-dark/tokens.json');
if (pulseDarkResolution.schema !== 'neosmartui/theme-resolution@1' || pulseDarkResolution.flavor !== 'flavor.pulse' || pulseDarkResolution.theme !== 'Pulse Dark' || pulseDarkResolution.bundle !== 'tokens.json') fail('Pulse Dark resolution identity is invalid');
if (pulseDarkBundle.schema !== 'neosmartui/resolved-token-bundle@1' || pulseDarkBundle.flavor !== 'flavor.pulse' || pulseDarkBundle.theme !== 'Pulse Dark') fail('Pulse Dark bundle identity is invalid');
if (pulseDarkResolution.scope.length !== 50 || pulseDarkBundle.scope.length !== 50 || pulseDarkBundle.values.length !== 55 || new Set(pulseDarkBundle.values.map((entry) => entry.id)).size !== 55) fail('Pulse Dark must preserve exact maintained local 50/55 resolution');
if ([...pulseDarkResolution.scope].sort().join('|') !== [...pulseResolution.scope].sort().join('|')) fail('Pulse Dark must preserve Pulse Light Core scope');
const pulseDarkValues = toMap(pulseDarkBundle.values);
for (const [id,lightEntry] of pulseValues) if (!id.startsWith('color.') && JSON.stringify(pulseDarkValues.get(id)?.value) !== JSON.stringify(lightEntry.value)) fail(`Pulse Dark must preserve Pulse Light non-color invariant ${id}`);
if (pulseDarkValues.get('color.surface.interactive')?.value !== '#171821' || pulseDarkValues.get('color.surface.panel')?.value !== '#20222d') fail('Pulse Dark surface identity drifted');
if (pulseDarkValues.get('color.action.primary.surface')?.value !== '#9b8cff' || pulseDarkValues.get('color.action.primary.content')?.value !== '#15161a') fail('Pulse Dark primary action identity drifted');
if (pulseDarkValues.get('color.focus.ring')?.value !== '#b8a8ff') fail('Pulse Dark focus identity drifted');
for (const path of ['apps/foundry/fragments/pulse-dark.html','tests/browser/foundry-pulse-dark.spec.mjs','tooling/validators/validate-pulse-dark-theme.mjs','tooling/foundry/assemble-pulse-dark.mjs']) await access(resolve(root, path));
await expectAbsent('packages/flavors/pulse-dark', 'Pulse Dark must remain a Theme of flavor.pulse');
await expectAbsent('apps/foundry/src/flavors/pulse-dark', 'Pulse Dark must extend the canonical Pulse route rather than create a route fork');

const monoLight = await readJson('packages/themes/mono-light/theme.json');
if (!sameKeys(monoLight, themeKeys)) fail('Mono Light must expose exactly the canonical neosmartui/theme@1 fields');
if (monoLight.schema !== 'neosmartui/theme@1' || monoLight.name !== 'Mono Light' || monoLight.family !== 'neosmartui' || monoLight.category !== 'mono') fail('Mono Light Theme identity is invalid');
if (monoLight.color?.mode !== 'light' || monoLight.color?.strategy !== 'editorial-monochrome') fail('Mono Light must declare editorial monochrome light intent');
if (monoLight.typography?.strategy !== 'editorial-type-led') fail('Mono Light must declare type-led editorial typography');
if (monoLight.geometry?.profile !== 'editorial-structured') fail('Mono Light must declare structured editorial geometry');
if (monoLight.border?.profile !== 'print-keyline' || monoLight.shadow?.model !== 'crisp-monochrome-depth') fail('Mono Light must declare print-like keylines and crisp monochrome depth');
if (monoLight.motion?.model !== 'pressure-not-levitation' || monoLight.motion?.intensity !== 'restrained') fail('Mono Light motion must preserve pressure with restrained movement');
if (monoLight.interaction?.model !== 'pressure-not-levitation' || monoLight.interaction?.selection !== 'seated') fail('Mono Light interaction must preserve pressure and seated selection');
if (monoLight.icons?.strategy !== 'adapter-owned') fail('Mono Theme must not take renderer ownership of icons');

const monoResolution = await readJson('packages/themes/mono-light/resolution.json');
const monoBundle = await readJson('packages/themes/mono-light/tokens.json');
if (monoResolution.schema !== 'neosmartui/theme-resolution@1' || monoResolution.flavor !== 'flavor.mono' || monoResolution.theme !== 'Mono Light' || monoResolution.bundle !== 'tokens.json') fail('Mono Light resolution identity is invalid');
if (monoBundle.schema !== 'neosmartui/resolved-token-bundle@1' || monoBundle.flavor !== 'flavor.mono' || monoBundle.theme !== 'Mono Light') fail('Mono Light resolved bundle identity is invalid');
if (monoResolution.scope.length !== 50 || monoBundle.scope.length !== 50 || [...monoResolution.scope].sort().join('|') !== [...monoBundle.scope].sort().join('|')) fail('Mono Light resolution and bundle must share the exact maintained local 50-component Core scope');
if (monoBundle.values.length !== 55) fail(`Mono Light must resolve the exact shipping dependency union of 55 tokens; got ${monoBundle.values.length}`);
const monoValues = toMap(monoBundle.values);
if (monoValues.size !== 55) fail('Mono Light resolved token IDs must be unique');
if (monoValues.get('border.control.width')?.value !== '2px' || monoValues.get('border.surface.width')?.value !== '2px' || monoValues.get('border.annotation.width')?.value !== '2px') fail('Mono Light must implement 2px print-like keylines');
for (const id of ['radius.control', 'radius.surface', 'radius.annotation']) if (monoValues.get(id)?.value !== '0px') fail(`${id} must implement Mono square editorial geometry`);
for (const axis of ['x', 'y']) {
  if (monoValues.get(`depth.rest.${axis}`)?.value !== '3px' || monoValues.get(`depth.hover.${axis}`)?.value !== '1px' || monoValues.get(`depth.active.${axis}`)?.value !== '0px') fail(`Mono ${axis}-axis depth must implement ratified 3→1→0 pressure physics`);
  if (monoValues.get(`press.hover.${axis}`)?.value !== '2px' || monoValues.get(`press.active.${axis}`)?.value !== '3px') fail(`Mono ${axis}-axis travel must implement ratified 0→2→3 pressure physics`);
}
if (monoValues.get('motion.press.duration')?.value !== '65ms' || monoValues.get('motion.release.duration')?.value !== '100ms' || monoValues.get('motion.standard.duration')?.value !== '140ms') fail('Mono Light timings must preserve restrained 65/100/140ms semantic timing');
if (monoValues.get('focus.ring.width')?.value !== '3px' || monoValues.get('focus.ring.offset')?.value !== '3px') fail('Mono Light focus keyline must remain independently visible');
if (monoValues.get('size.control.minimum')?.value !== '44px') fail('Mono Light must preserve the 44px minimum target');
if (monoValues.get('color.surface.interactive')?.value !== '#ffffff' || monoValues.get('color.surface.panel')?.value !== '#f2f2f2') fail('Mono Light must preserve white/light-gray editorial surfaces');
if (monoValues.get('color.action.primary.surface')?.value !== '#111111' || monoValues.get('color.action.primary.content')?.value !== '#ffffff') fail('Mono Light primary action must preserve black/white inverse pairing');
if (monoValues.get('font.family.body')?.value !== 'ui-serif, Georgia, serif') fail('Mono Light must preserve serif-led editorial typography');

for (const extension of ['css', 'mjs', 'js', 'tsx', 'jsx']) {
  await expectAbsent(`packages/flavors/hardline/index.${extension}`, `Hardline implementation must not introduce renderer override index.${extension}`);
  await expectAbsent(`packages/flavors/soft/index.${extension}`, `Soft implementation must not introduce renderer override index.${extension}`);
  await expectAbsent(`packages/flavors/mono/index.${extension}`, `Mono public proof must not introduce renderer override index.${extension}`);
  await expectAbsent(`packages/flavors/pulse/index.${extension}`, `Pulse contract must not introduce renderer override index.${extension}`);
}

const softDark = await readJson('packages/themes/soft-dark/theme.json');
if (!sameKeys(softDark, themeKeys)) fail('Soft Dark must expose exactly the canonical neosmartui/theme@1 fields');
if (softDark.schema !== 'neosmartui/theme@1' || softDark.name !== 'Soft Dark' || softDark.family !== 'neosmartui' || softDark.category !== 'soft') fail('Soft Dark Theme contract identity is invalid');
if (softDark.color?.mode !== 'dark' || softDark.color?.strategy !== 'warm-neutral-softened-blue-dark') fail('Soft Dark must declare authored dark warm-neutral/softened-blue color intent');
if (softDark.typography?.strategy !== 'readable-system-first') fail('Soft Dark must preserve readable system-first typography');
if (softDark.geometry?.profile !== 'moderate-rounded') fail('Soft Dark must preserve moderate rounded geometry');
if (softDark.border?.profile !== 'visible-moderate' || softDark.shadow?.model !== 'shallow-hard-depth') fail('Soft Dark must preserve visible moderate boundaries and shallow hard depth');
if (softDark.spacing?.density !== 'comfortable' || softDark.density?.control !== 'comfortable') fail('Soft Dark must preserve comfortable density');
if (softDark.motion?.model !== 'pressure-not-levitation' || softDark.motion?.intensity !== 'restrained') fail('Soft Dark must preserve restrained pressure motion');
if (softDark.interaction?.model !== 'pressure-not-levitation' || softDark.interaction?.selection !== 'seated') fail('Soft Dark must preserve pressure and seated selection');
if (softDark.icons?.strategy !== 'adapter-owned') fail('Soft Dark must preserve adapter-owned icons');
const monoDark = await readJson('packages/themes/mono-dark/theme.json');
if (!sameKeys(monoDark, themeKeys)) fail('Mono Dark must expose exactly the canonical neosmartui/theme@1 fields');
if (monoDark.schema !== 'neosmartui/theme@1' || monoDark.name !== 'Mono Dark' || monoDark.family !== 'neosmartui' || monoDark.category !== 'mono') fail('Mono Dark Theme contract identity is invalid');
if (monoDark.color?.mode !== 'dark' || monoDark.color?.strategy !== 'editorial-monochrome-dark') fail('Mono Dark must declare authored editorial monochrome dark intent');
if (monoDark.typography?.strategy !== monoLight.typography?.strategy) fail('Mono Dark must preserve Mono Light editorial typography strategy');
if (monoDark.geometry?.profile !== monoLight.geometry?.profile || monoDark.border?.profile !== monoLight.border?.profile || monoDark.shadow?.model !== monoLight.shadow?.model) fail('Mono Dark must preserve Mono Light structural descriptor profile');
if (monoDark.spacing?.density !== monoLight.spacing?.density || monoDark.density?.control !== monoLight.density?.control) fail('Mono Dark must preserve Mono Light editorial density');
if (monoDark.motion?.model !== monoLight.motion?.model || monoDark.motion?.intensity !== monoLight.motion?.intensity) fail('Mono Dark must preserve Mono Light restrained pressure motion');
if (monoDark.interaction?.model !== monoLight.interaction?.model || monoDark.interaction?.selection !== monoLight.interaction?.selection) fail('Mono Dark must preserve Mono Light pressure and seated selection');
if (monoDark.icons?.strategy !== monoLight.icons?.strategy) fail('Mono Dark must preserve adapter-owned icons');
const monoDarkResolution = await readJson('packages/themes/mono-dark/resolution.json');
const monoDarkBundle = await readJson('packages/themes/mono-dark/tokens.json');
if (monoDarkResolution.schema !== 'neosmartui/theme-resolution@1' || monoDarkResolution.flavor !== 'flavor.mono' || monoDarkResolution.theme !== 'Mono Dark' || monoDarkResolution.bundle !== 'tokens.json') fail('Mono Dark resolution identity is invalid');
if (monoDarkBundle.schema !== 'neosmartui/resolved-token-bundle@1' || monoDarkBundle.flavor !== 'flavor.mono' || monoDarkBundle.theme !== 'Mono Dark') fail('Mono Dark bundle identity is invalid');
if (monoDarkResolution.scope.length !== 50 || monoDarkBundle.scope.length !== 50 || monoDarkBundle.values.length !== 55 || new Set(monoDarkBundle.values.map((entry) => entry.id)).size !== 55) fail('maintained Mono Dark must preserve exact local 50/55 resolution');
if ([...monoDarkResolution.scope].sort().join('|') !== [...monoResolution.scope].sort().join('|')) fail('Mono Dark must preserve Mono Light Core scope');
const monoDarkValues = toMap(monoDarkBundle.values);
for (const [id,lightEntry] of monoValues) if (!id.startsWith('color.') && JSON.stringify(monoDarkValues.get(id)?.value) !== JSON.stringify(lightEntry.value)) fail(`Mono Dark must preserve Mono Light non-color invariant ${id}`);
for (const entry of monoDarkBundle.values) {
  if (!entry.id.startsWith('color.')) continue;
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(entry.value);
  if (!match || match[1].toLowerCase() !== match[2].toLowerCase() || match[2].toLowerCase() !== match[3].toLowerCase()) fail(`Mono Dark color ${entry.id} must remain grayscale`);
}
for (const path of ['apps/foundry/fragments/mono-dark.html','tests/browser/foundry-mono-dark.spec.mjs','tooling/validators/validate-mono-dark-theme.mjs','tooling/foundry/assemble-mono-dark.mjs']) await access(resolve(root, path));
await expectAbsent('packages/flavors/mono-dark', 'Mono Dark must remain a Theme of flavor.mono');
await expectAbsent('apps/foundry/src/flavors/mono-dark', 'Mono Dark must extend the canonical Mono route rather than create a route fork');

const hardlineDocs = await readFile(resolve(root, 'spec/flavors/HARDLINE.md'), 'utf8');
for (const marker of ['flagship/default NeoSmartUI flavor', '`flavor.hardline`', 'square or zero-radius geometry', 'MUST NOT introduce hover lift', 'MUST NOT own Button/Dialog/Product/Checkout/Billing behavior', 'Maturity: `public-proof`', '`packages/themes/hardline-light/tokens.json`', '`packages/themes/hardline-light/resolution.json`', 'Dark mode follows as its own concrete Theme instance', 'exact shipping **49-Core / 55-token** semantic dependency boundary']) {
  if (!hardlineDocs.includes(marker)) fail(`Hardline implementation docs missing marker: ${marker}`);
}
const softDocs = await readFile(resolve(root, 'spec/flavors/SOFT.md'), 'utf8');
for (const marker of ['calm application-oriented NeoSmartUI flavor', '`flavor.soft`', 'Flavor maturity: `public-proof`', 'Soft Light maturity: `public-proof`', 'Soft Dark contract maturity: `contract-only`', 'moderate rounding', 'MUST NOT introduce generic hover lift', 'SaaS remains a Vertical', '`packages/themes/soft-light/tokens.json`', '`packages/themes/soft-light/resolution.json`', 'exact resolved semantic dependency union: 55 token IDs', '`3px → 1.5px → 0px`', 'second concrete Theme instance of `flavor.soft`', 'Concrete Dark palette values are intentionally deferred', 'NeoBrutalism-shop/NeoBrutal-Soft@dfed77bd159ac5c38081f7a4ca5c2229b61ffb8a', '`knowledge-only-until-reviewed`', 'exact shipping **49-Core / 55-token** semantic dependency boundary']) {
  if (!softDocs.includes(marker)) fail(`Soft Dark contract docs missing marker: ${marker}`);
}
const pulseDocs = await readFile(resolve(root, 'spec/flavors/PULSE.md'), 'utf8');
for (const marker of ['SaaS-forward, high-energy NeoSmartUI flavor', '`flavor.pulse`', 'Flavor maturity: `public-proof`', 'Pulse Light maturity: `implemented`', 'Pulse Dark maturity: `implemented`', 'Public-proof maturity: `public-proof`', 'Public-proof record: `evidence/public/flavor.pulse.json`', 'SaaS remains a Vertical', 'MUST NOT copy or redistribute Riddle', '`packages/themes/pulse-light/tokens.json`', '`packages/themes/pulse-dark/tokens.json`', '`crisp-charcoal-electric-violet`', '`4px → 2px → 0px`', '`65ms / 105ms / 145ms`', '`44px` minimum interactive target', 'Pulse Light and Pulse Dark are complete through public proof', 'Proof-only promotion does not redeploy Pages', 'exact **49-component / 55-token singleton cohort**', 'exact shipping **49-Core / 55-token** semantic dependency boundary']) {
  if (!pulseDocs.includes(marker)) fail(`Pulse contract docs missing marker: ${marker}`);
}

const monoDocs = await readFile(resolve(root, 'spec/flavors/MONO.md'), 'utf8');
for (const marker of ['editorial black/white/gray NeoSmartUI flavor', '`flavor.mono`', 'Official migration maturity: `public-proof`', 'Public-proof record: `evidence/public/flavor.mono.json`', 'no dedicated legacy Mono repository or Mono implementation artifact', '`packages/themes/mono-light/tokens.json`', '`packages/themes/mono-light/resolution.json`', 'exact resolved semantic dependency union: **55 token IDs**', '`3px → 1px → 0`', 'MUST NOT introduce generic hover lift', 'Public-proof promotion does not redeploy Pages', 'Mono Dark follows as its own concrete Theme instance', 'Mono Dark contract maturity: `contract-only` (superseded contract checkpoint)', 'Mono Dark implementation maturity: `implemented`', 'Mono Dark proof maturity: `public-proof`', 'authored color strategy: `editorial-monochrome-dark`', '`packages/themes/mono-dark/tokens.json`', '`tooling/foundry/assemble-mono-dark.mjs`', 'Mono Light and Mono Dark are complete through public proof', 'exact Core scope: **49 public-proof components**', 'exact shipping **49-Core / 55-token** semantic dependency boundary']) {
  if (!monoDocs.includes(marker)) fail(`Mono public-proof docs missing marker: ${marker}`);
}

console.log('[flavors] validated five official public-proof Flavors over the deployed 49/55 singleton with maintenance-protected local 50/55 Theme scopes for DescriptionList');
