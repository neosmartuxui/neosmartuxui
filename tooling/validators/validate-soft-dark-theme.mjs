import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { contrastRatio } from '../../packages/contracts/color-contrast.mjs';

const root = resolve(import.meta.dirname, '../..');
const fail = (message) => { throw new Error(`[soft-dark] ${message}`); };
const json = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const toMap = (values) => new Map(values.map((entry) => [entry.id, entry]));

const resolution = await json('packages/themes/soft-dark/resolution.json');
const bundle = await json('packages/themes/soft-dark/tokens.json');
const lightBundle = await json('packages/themes/soft-light/tokens.json');
if (resolution.schema !== 'neosmartui/theme-resolution@1' || resolution.flavor !== 'flavor.soft' || resolution.theme !== 'Soft Dark' || resolution.bundle !== 'tokens.json') fail('Soft Dark resolution identity is invalid');
if (bundle.schema !== 'neosmartui/resolved-token-bundle@1' || bundle.flavor !== 'flavor.soft' || bundle.theme !== 'Soft Dark') fail('Soft Dark bundle identity is invalid');
if (resolution.scope.length !== 50 || bundle.scope.length !== 50 || [...resolution.scope].sort().join('|') !== [...bundle.scope].sort().join('|')) fail('Soft Dark must bind the exact maintained 50-component Core scope');
if (bundle.values.length !== 55 || new Set(bundle.values.map((entry) => entry.id)).size !== 55) fail('Soft Dark must resolve exactly 55 unique semantic dependencies');

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
  if (JSON.stringify(dark.get(id)?.value) !== JSON.stringify(light.get(id)?.value)) fail(`Soft Dark must preserve Light's non-color invariant ${id}`);
}

const expectedColors = new Map([
  ['color.surface.interactive', '#1e1b19'],
  ['color.surface.panel', '#292522'],
  ['color.content.primary', '#f7f1e8'],
  ['color.content.secondary', '#c7bfb5'],
  ['color.content.inverse', '#171513'],
  ['color.border.default', '#b8afa5'],
  ['color.border.strong', '#f3ebe2'],
  ['color.action.primary.surface', '#8fb8f4'],
  ['color.action.primary.content', '#171513'],
  ['color.state.success', '#30744d'],
  ['color.state.warning', '#806315'],
  ['color.state.error', '#e88983'],
  ['color.state.info', '#734ecd'],
  ['color.focus.ring', '#9ec4ff']
]);
for (const [id, value] of expectedColors) if (dark.get(id)?.value !== value) fail(`${id} must preserve the ratified Soft Dark palette value ${value}`);

for (const [foreground, background, label] of [
  ['#f7f1e8','#1e1b19','primary content on interactive surface'],
  ['#c7bfb5','#1e1b19','secondary content on interactive surface'],
  ['#f7f1e8','#292522','primary content on panel surface'],
  ['#171513','#8fb8f4','primary action content'],
  ['#f7f1e8','#30744d','success badge content'],
  ['#f7f1e8','#806315','warning badge content'],
  ['#171513','#e88983','error badge content'],
  ['#f7f1e8','#734ecd','info badge content']
]) if (contrastRatio(foreground, background) < 4.5) fail(`${label} must retain at least 4.5:1 authored contrast`);
for (const [foreground, background, label] of [
  ['#9ec4ff','#1e1b19','focus ring against interactive surface'],
  ['#b8afa5','#1e1b19','default border against interactive surface']
]) if (contrastRatio(foreground, background) < 3) fail(`${label} must retain at least 3:1 non-text contrast`);

console.log('[soft-dark] validated authored maintained 50/55 Dark resolution, exact Soft physics, semantic warm-dark palette, and contrast invariants');
