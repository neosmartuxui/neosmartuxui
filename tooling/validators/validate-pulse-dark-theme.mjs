import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { renderResolvedTokenCss } from '../../packages/adapters/css/resolve-theme.mjs';
import { contrastRatio } from '../../packages/contracts/color-contrast.mjs';

const root = resolve(import.meta.dirname, '../..');
const fail = (message) => { throw new Error(`[pulse-dark] ${message}`); };
const json = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const toMap = (values) => new Map(values.map((entry) => [entry.id, entry]));

const contracts = await json('spec/core/token-contracts.json');
const theme = await json('packages/themes/pulse-dark/theme.json');
const resolution = await json('packages/themes/pulse-dark/resolution.json');
const bundle = await json('packages/themes/pulse-dark/tokens.json');
const lightResolution = await json('packages/themes/pulse-light/resolution.json');
const lightBundle = await json('packages/themes/pulse-light/tokens.json');

if (theme.schema !== 'neosmartui/theme@1' || theme.name !== 'Pulse Dark' || theme.category !== 'pulse' || theme.color?.mode !== 'dark') fail('Pulse Dark Theme identity is invalid');
if (theme.color?.strategy !== 'crisp-charcoal-electric-violet' || theme.typography?.strategy !== 'product-system-first') fail('Pulse Dark identity strategy drifted');
if (theme.geometry?.profile !== 'sharp-micro' || theme.border?.profile !== 'visible-compact' || theme.shadow?.model !== 'medium-hard-depth') fail('Pulse Dark structure must match Pulse Light');
if (theme.spacing?.density !== 'compact' || theme.density?.control !== 'compact-accessible') fail('Pulse Dark must preserve compact-but-accessible density');
if (theme.motion?.model !== 'pressure-not-levitation' || theme.motion?.intensity !== 'restrained') fail('Pulse Dark must preserve restrained pressure motion');
if (theme.interaction?.model !== 'pressure-not-levitation' || theme.interaction?.selection !== 'seated') fail('Pulse Dark must preserve pressure and seated selection');
if (theme.icons?.strategy !== 'adapter-owned') fail('Pulse Dark must preserve adapter-owned icons');

if (resolution.schema !== 'neosmartui/theme-resolution@1' || resolution.flavor !== 'flavor.pulse' || resolution.theme !== 'Pulse Dark' || resolution.bundle !== 'tokens.json') fail('Pulse Dark resolution identity is invalid');
if (bundle.schema !== 'neosmartui/resolved-token-bundle@1' || bundle.flavor !== 'flavor.pulse' || bundle.theme !== 'Pulse Dark') fail('Pulse Dark bundle identity is invalid');
if (resolution.scope.length !== 50 || bundle.scope.length !== 50 || [...resolution.scope].sort().join('|') !== [...bundle.scope].sort().join('|')) fail('Pulse Dark must bind the exact maintained 50-component Core scope');
if ([...resolution.scope].sort().join('|') !== [...lightResolution.scope].sort().join('|')) fail('Pulse Dark and Pulse Light must resolve the same Core scope');
if (bundle.values.length !== 55 || new Set(bundle.values.map((entry) => entry.id)).size !== 55) fail('Pulse Dark must resolve exactly 55 unique semantic dependencies');
if (new Set(lightBundle.values.map((entry) => entry.id)).size !== 55) fail('Pulse Light dependency baseline drifted');

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
for (const id of invariantIds) if (JSON.stringify(dark.get(id)?.value) !== JSON.stringify(light.get(id)?.value)) fail(`Pulse Dark must preserve Light's non-color invariant ${id}`);

const expectedColors = new Map([
  ['color.surface.interactive','#171821'],['color.surface.panel','#20222d'],['color.content.primary','#f7f7fb'],
  ['color.content.secondary','#b8bcc8'],['color.content.inverse','#15161a'],['color.border.default','#7d8392'],
  ['color.border.strong','#f7f7fb'],['color.action.primary.surface','#9b8cff'],['color.action.primary.content','#15161a'],
  ['color.state.success','#216b4a'],['color.state.warning','#6f5500'],['color.state.error','#ff8a80'],['color.state.info','#315c8a'],
  ['color.focus.ring','#b8a8ff']
]);
for (const [id,value] of expectedColors) if (dark.get(id)?.value !== value) fail(`${id} must preserve the ratified Pulse Dark value ${value}`);

for (const [foreground,background,label] of [
  ['#f7f7fb','#171821','primary content on interactive surface'],
  ['#b8bcc8','#171821','secondary content on interactive surface'],
  ['#f7f7fb','#20222d','primary content on panel surface'],
  ['#15161a','#9b8cff','primary action content'],
  ['#f7f7fb','#216b4a','success badge content'],
  ['#f7f7fb','#6f5500','warning badge content'],
  ['#15161a','#ff8a80','error badge content'],
  ['#f7f7fb','#315c8a','info badge content']
]) if (contrastRatio(foreground,background) < 4.5) fail(`${label} must retain at least 4.5:1 authored contrast`);
for (const [foreground,background,label] of [
  ['#b8a8ff','#171821','focus ring against interactive surface'],
  ['#7d8392','#171821','default border against interactive surface']
]) if (contrastRatio(foreground,background) < 3) fail(`${label} must retain at least 3:1 non-text contrast`);

const css = renderResolvedTokenCss(contracts,bundle,{ selector: '.ns-theme-pulse-dark' });
for (const marker of [
  '.ns-theme-pulse-dark {','--ns-border-control-width: 2px;','--ns-radius-control: 4px;','--ns-radius-surface: 6px;',
  '--ns-depth-rest-y: 4px;','--ns-depth-hover-y: 2px;','--ns-press-active-y: 4px;',
  '--ns-motion-press-duration: 65ms;','--ns-motion-release-duration: 105ms;','--ns-motion-standard-duration: 145ms;',
  '--ns-color-surface-interactive: #171821;','--ns-color-surface-panel: #20222d;',
  '--ns-color-action-primary-surface: #9b8cff;','--ns-color-focus-ring: #b8a8ff;'
]) if (!css.includes(marker)) fail(`Pulse Dark generated CSS missing marker ${marker}`);
if (css.includes(':root {')) fail('scoped Pulse Dark CSS must not replace the root Theme');

console.log('[pulse-dark] validated authored maintained 50/55 Dark resolution, exact Pulse physics/density, direct dark palette, and contrast invariants');
