import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { renderResolvedTokenCss } from '../../packages/adapters/css/resolve-theme.mjs';
import { contrastRatio } from '../../packages/contracts/color-contrast.mjs';

const root = resolve(import.meta.dirname, '../..');
const fail = (message) => { throw new Error(`[mono-dark] ${message}`); };
const json = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const toMap = (values) => new Map(values.map((entry) => [entry.id, entry]));
const isGrayHex = (value) => {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(value);
  return Boolean(match && match[1].toLowerCase() === match[2].toLowerCase() && match[2].toLowerCase() === match[3].toLowerCase());
};

const contracts = await json('spec/core/token-contracts.json');
const resolution = await json('packages/themes/mono-dark/resolution.json');
const bundle = await json('packages/themes/mono-dark/tokens.json');
const lightResolution = await json('packages/themes/mono-light/resolution.json');
const lightBundle = await json('packages/themes/mono-light/tokens.json');

if (resolution.schema !== 'neosmartui/theme-resolution@1' || resolution.flavor !== 'flavor.mono' || resolution.theme !== 'Mono Dark' || resolution.bundle !== 'tokens.json') fail('Mono Dark resolution identity is invalid');
if (bundle.schema !== 'neosmartui/resolved-token-bundle@1' || bundle.flavor !== 'flavor.mono' || bundle.theme !== 'Mono Dark') fail('Mono Dark bundle identity is invalid');
if (resolution.scope.length !== 50 || bundle.scope.length !== 50 || [...resolution.scope].sort().join('|') !== [...bundle.scope].sort().join('|')) fail('Mono Dark must bind the exact maintained 50-component Core scope');
if ([...resolution.scope].sort().join('|') !== [...lightResolution.scope].sort().join('|')) fail('Mono Dark and Mono Light must resolve the same Core scope');
if (bundle.values.length !== 55 || new Set(bundle.values.map((entry) => entry.id)).size !== 55) fail('Mono Dark must resolve exactly 55 unique semantic dependencies');
if (new Set(lightBundle.values.map((entry) => entry.id)).size !== 55) fail('Mono Light dependency baseline drifted');

const dark = toMap(bundle.values);
const light = toMap(lightBundle.values);
const invariantIds = [
  'border.control.width','border.surface.width','border.annotation.width',
  'radius.control','radius.surface','radius.annotation',
  'space.control.inline','space.control.block','space.field.gap','space.navigation.gap',
  'space.surface.inline','space.surface.block','space.annotation.inline','space.annotation.block',
  'size.control.minimum','depth.rest.x','depth.rest.y','depth.hover.x','depth.hover.y','depth.active.x','depth.active.y',
  'press.hover.x','press.hover.y','press.active.x','press.active.y',
  'motion.press.duration','motion.press.easing','motion.release.duration','motion.release.easing','motion.standard.duration','motion.standard.easing',
  'focus.ring.width','focus.ring.offset','font.family.body','font.size.body','font.size.label','font.size.navigation',
  'font.weight.regular','font.weight.emphasis','font.weight.strong','opacity.disabled'
];
for (const id of invariantIds) if (JSON.stringify(dark.get(id)?.value) !== JSON.stringify(light.get(id)?.value)) fail(`Mono Dark must preserve Light's non-color invariant ${id}`);
for (const entry of bundle.values) if (entry.id.startsWith('color.') && !isGrayHex(entry.value)) fail(`${entry.id} must remain grayscale in Mono Dark; got ${entry.value}`);

const expectedColors = new Map([
  ['color.surface.interactive','#151515'],['color.surface.panel','#202020'],['color.content.primary','#f2f2f2'],
  ['color.content.secondary','#c4c4c4'],['color.content.inverse','#111111'],['color.border.default','#9a9a9a'],
  ['color.border.strong','#f2f2f2'],['color.action.primary.surface','#f2f2f2'],['color.action.primary.content','#111111'],
  ['color.state.success','#606060'],['color.state.warning','#585858'],['color.state.error','#d0d0d0'],['color.state.info','#686868'],
  ['color.focus.ring','#ffffff']
]);
for (const [id,value] of expectedColors) if (dark.get(id)?.value !== value) fail(`${id} must preserve the ratified Mono Dark palette value ${value}`);

for (const [foreground,background,label] of [
  ['#f2f2f2','#151515','primary content on interactive surface'],['#c4c4c4','#151515','secondary content on interactive surface'],
  ['#f2f2f2','#202020','primary content on panel surface'],['#111111','#f2f2f2','primary action content'],
  ['#f2f2f2','#606060','success badge content'],['#f2f2f2','#585858','warning badge content'],
  ['#111111','#d0d0d0','error badge content'],['#f2f2f2','#686868','info badge content']
]) if (contrastRatio(foreground,background) < 4.5) fail(`${label} must retain at least 4.5:1 authored contrast`);
for (const [foreground,background,label] of [
  ['#ffffff','#151515','focus ring against interactive surface'],['#9a9a9a','#151515','default border against interactive surface']
]) if (contrastRatio(foreground,background) < 3) fail(`${label} must retain at least 3:1 non-text contrast`);

const css = renderResolvedTokenCss(contracts,bundle,{ selector: '.ns-theme-mono-dark' });
for (const marker of [
  '.ns-theme-mono-dark {','--ns-border-control-width: 2px;','--ns-radius-control: 0px;','--ns-radius-annotation: 0px;',
  '--ns-depth-rest-y: 3px;','--ns-depth-hover-y: 1px;','--ns-press-active-y: 3px;',
  '--ns-motion-press-duration: 65ms;','--ns-motion-release-duration: 100ms;','--ns-motion-standard-duration: 140ms;',
  '--ns-color-surface-interactive: #151515;','--ns-color-surface-panel: #202020;',
  '--ns-color-action-primary-surface: #f2f2f2;','--ns-color-focus-ring: #ffffff;',
  '--ns-font-family-body: ui-serif, Georgia, serif;'
]) if (!css.includes(marker)) fail(`Mono Dark generated CSS missing marker ${marker}`);
if (css.includes(':root {')) fail('scoped Mono Dark CSS must not replace the root Theme');

console.log('[mono-dark] validated authored maintained 50/55 Dark resolution, exact Mono physics/type, grayscale-only palette, and contrast invariants');
