import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { contrastRatio } from '../../packages/contracts/color-contrast.mjs';

const root = resolve(import.meta.dirname, '../..');
const fail = (message) => { throw new Error(`[hardline-dark] ${message}`); };
const json = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const toMap = (values) => new Map(values.map((entry) => [entry.id, entry]));

const resolution = await json('packages/themes/hardline-dark/resolution.json');
const bundle = await json('packages/themes/hardline-dark/tokens.json');
const lightBundle = await json('packages/themes/hardline-light/tokens.json');
if (resolution.schema !== 'neosmartui/theme-resolution@1' || resolution.flavor !== 'flavor.hardline' || resolution.theme !== 'Hardline Dark' || resolution.bundle !== 'tokens.json') fail('Hardline Dark resolution identity is invalid');
if (bundle.schema !== 'neosmartui/resolved-token-bundle@1' || bundle.flavor !== 'flavor.hardline' || bundle.theme !== 'Hardline Dark') fail('Hardline Dark bundle identity is invalid');
if (resolution.scope.length !== 50 || bundle.scope.length !== 50 || [...resolution.scope].sort().join('|') !== [...bundle.scope].sort().join('|')) fail('Hardline Dark must bind the exact maintained 50-component Core scope');
if (bundle.values.length !== 55 || new Set(bundle.values.map((entry) => entry.id)).size !== 55) fail('Hardline Dark must resolve exactly 55 unique semantic dependencies');

const dark = toMap(bundle.values);
const light = toMap(lightBundle.values);
const invariantIds = [
  'border.control.width','border.surface.width','border.annotation.width',
  'radius.control','radius.surface','radius.annotation',
  'space.control.inline','space.control.block','space.field.gap','space.navigation.gap',
  'space.surface.inline','space.surface.block','space.annotation.inline','space.annotation.block',
  'size.control.minimum',
  'depth.rest.x','depth.rest.y','depth.hover.x','depth.hover.y','depth.active.x','depth.active.y',
  'press.hover.x','press.hover.y','press.active.x','press.active.y',
  'motion.press.duration','motion.press.easing','motion.release.duration','motion.release.easing','motion.standard.duration','motion.standard.easing',
  'focus.ring.width','focus.ring.offset',
  'font.family.body','font.size.body','font.size.label','font.size.navigation','font.weight.regular','font.weight.emphasis','font.weight.strong',
  'opacity.disabled'
];
for (const id of invariantIds) {
  if (JSON.stringify(dark.get(id)?.value) !== JSON.stringify(light.get(id)?.value)) fail(`Hardline Dark must preserve Light's non-color invariant ${id}`);
}

const expectedColors = new Map([
  ['color.surface.interactive', '#141414'],
  ['color.surface.panel', '#1d1d1d'],
  ['color.content.primary', '#f5f5f5'],
  ['color.content.secondary', '#c9c9c9'],
  ['color.content.inverse', '#111111'],
  ['color.border.default', '#d8d8d8'],
  ['color.border.strong', '#ffffff'],
  ['color.action.primary.surface', '#ffd84d'],
  ['color.action.primary.content', '#111111'],
  ['color.state.success', '#19793d'],
  ['color.state.warning', '#826600'],
  ['color.state.error', '#ff737d'],
  ['color.state.info', '#6e3fff'],
  ['color.focus.ring', '#8fb3ff']
]);
for (const [id, value] of expectedColors) if (dark.get(id)?.value !== value) fail(`${id} must preserve the ratified Hardline Dark palette value ${value}`);

for (const [foreground, background, label] of [
  ['#f5f5f5','#141414','primary content on interactive surface'],
  ['#c9c9c9','#141414','secondary content on interactive surface'],
  ['#f5f5f5','#1d1d1d','primary content on panel surface'],
  ['#111111','#ffd84d','primary action content'],
  ['#f5f5f5','#19793d','success badge content'],
  ['#f5f5f5','#826600','warning badge content'],
  ['#f5f5f5','#6e3fff','info badge content'],
  ['#111111','#ff737d','error badge content']
]) if (contrastRatio(foreground, background) < 4.5) fail(`${label} must retain at least 4.5:1 authored contrast`);

console.log('[hardline-dark] validated authored maintained 50/55 Dark resolution, exact flagship physics, semantic palette, and contrast invariants');
