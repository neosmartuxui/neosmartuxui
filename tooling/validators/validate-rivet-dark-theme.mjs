import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { contrastRatio } from '../../packages/contracts/color-contrast.mjs';

const root = resolve(import.meta.dirname, '../..');
const fail = (message) => { throw new Error(`[rivet-dark] ${message}`); };
const json = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const toMap = (values) => new Map(values.map((entry) => [entry.id, entry]));

const resolution = await json('packages/themes/rivet-dark/resolution.json');
const bundle = await json('packages/themes/rivet-dark/tokens.json');
const lightBundle = await json('packages/themes/rivet-light/tokens.json');
if (resolution.schema !== 'neosmartui/theme-resolution@1' || resolution.flavor !== 'flavor.rivet' || resolution.theme !== 'Rivet Dark' || resolution.bundle !== 'tokens.json') fail('Rivet Dark resolution identity is invalid');
if (bundle.schema !== 'neosmartui/resolved-token-bundle@1' || bundle.flavor !== 'flavor.rivet' || bundle.theme !== 'Rivet Dark') fail('Rivet Dark bundle identity is invalid');
if (resolution.scope.length !== 50 || bundle.scope.length !== 50 || [...resolution.scope].sort().join('|') !== [...bundle.scope].sort().join('|')) fail('Rivet Dark must bind the exact maintained 50-component Core scope');
if (bundle.values.length !== 55 || new Set(bundle.values.map((entry) => entry.id)).size !== 55) fail('Rivet Dark must resolve exactly 55 unique semantic dependencies');

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
  if (JSON.stringify(dark.get(id)?.value) !== JSON.stringify(light.get(id)?.value)) fail(`Rivet Dark must preserve Light's non-color invariant ${id}`);
}

const expectedColors = new Map([
  ['color.surface.interactive', '#18171c'],
  ['color.surface.panel', '#232129'],
  ['color.content.primary', '#f6f3fa'],
  ['color.content.secondary', '#c9c3d1'],
  ['color.content.inverse', '#211c2b'],
  ['color.border.default', '#aaa4b2'],
  ['color.border.strong', '#f5f1fa'],
  ['color.action.primary.surface', '#c7b5f2'],
  ['color.action.primary.content', '#211c2b'],
  ['color.state.success', '#2e7644'],
  ['color.state.warning', '#5e7008'],
  ['color.state.error', '#ef8a84'],
  ['color.state.info', '#764dd6'],
  ['color.focus.ring', '#cdbdf7']
]);
for (const [id, value] of expectedColors) if (dark.get(id)?.value !== value) fail(`${id} must preserve the ratified Rivet Dark palette value ${value}`);

for (const [foreground, background, label] of [
  ['#f6f3fa','#18171c','primary content on interactive surface'],
  ['#c9c3d1','#18171c','secondary content on interactive surface'],
  ['#f6f3fa','#232129','primary content on panel surface'],
  ['#211c2b','#c7b5f2','primary action content'],
  ['#f6f3fa','#2e7644','success badge content'],
  ['#f6f3fa','#5e7008','warning badge content'],
  ['#211c2b','#ef8a84','error badge content'],
  ['#f6f3fa','#764dd6','info badge content']
]) if (contrastRatio(foreground, background) < 4.5) fail(`${label} must retain at least 4.5:1 authored contrast`);
for (const [foreground, background, label] of [
  ['#cdbdf7','#18171c','focus ring against interactive surface'],
  ['#aaa4b2','#18171c','default border against interactive surface']
]) if (contrastRatio(foreground, background) < 3) fail(`${label} must retain at least 3:1 non-text contrast`);

console.log('[rivet-dark] validated authored maintained 50/55 Dark resolution, exact Rivet physics, semantic industrial-dark palette, and contrast invariants');
