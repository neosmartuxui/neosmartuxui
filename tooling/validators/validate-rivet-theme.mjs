import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { renderResolvedTokenCss } from '../../packages/adapters/css/resolve-theme.mjs';

const root = resolve(import.meta.dirname, '../..');
const fail = (message) => { throw new Error(`[rivet-theme] ${message}`); };
const json = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const sameSet = (actual, expected) => actual.length === expected.size && actual.every((value) => expected.has(value));
const px = (value) => {
  const match = /^(-?\d+(?:\.\d+)?)px$/.exec(value);
  if (!match) fail(`expected px dimension, got ${value}`);
  return Number(match[1]);
};

const contracts = await json('spec/core/token-contracts.json');
const registry = await json('packages/core/component-registry.json');
const flavor = await json('packages/flavors/rivet/flavor.json');
const theme = await json('packages/themes/rivet-light/theme.json');
const resolution = await json('packages/themes/rivet-light/resolution.json');
const bundle = await json('packages/themes/rivet-light/tokens.json');

if (flavor.schema !== 'neosmartui/flavor@1' || flavor.id !== 'flavor.rivet' || flavor.interactionModel !== 'pressure-not-levitation') fail('Rivet Flavor identity is invalid');
if (theme.schema !== 'neosmartui/theme@1' || theme.name !== 'Rivet Light' || theme.category !== 'rivet' || theme.color?.mode !== 'light') fail('Rivet Light Theme identity is invalid');
if (theme.color?.strategy !== 'industrial-lavender-lime' || theme.typography?.strategy !== 'sturdy-system-first') fail('Rivet Light identity strategy drifted');
if (theme.geometry?.profile !== 'mechanical' || theme.border?.profile !== 'strong' || theme.shadow?.model !== 'coherent-depth') fail('Rivet Light mechanical structure drifted');
if (theme.motion?.model !== 'pressure-not-levitation' || theme.interaction?.model !== 'pressure-not-levitation' || theme.icons?.strategy !== 'adapter-owned') fail('Rivet Light interaction/adapter ownership drifted');
if (resolution.schema !== 'neosmartui/theme-resolution@1' || resolution.flavor !== flavor.id || resolution.theme !== theme.name || resolution.bundle !== 'tokens.json') fail('Rivet resolution binding is invalid');
if (bundle.schema !== 'neosmartui/resolved-token-bundle@1' || bundle.flavor !== flavor.id || bundle.theme !== theme.name) fail('Rivet bundle identity is invalid');

const resolvedEntries = registry.components.filter((entry) => entry.maturity !== 'contract-only');
const expectedScope = new Set(resolvedEntries.map((entry) => entry.id));
if (!sameSet(resolution.scope, expectedScope) || !sameSet(bundle.scope, expectedScope)) fail('Rivet scope must exactly match implemented/public-proof Core components');
if (expectedScope.size !== 50) fail(`Rivet implementation expects exactly 50 resolved Core components, got ${expectedScope.size}`);

const requiredDependencies = new Set();
for (const entry of resolvedEntries) {
  const contract = await json(`packages/core/${entry.contract}`);
  for (const dependency of contract.dependencies) requiredDependencies.add(dependency);
  if (!entry.evidence.implementation) fail(`${entry.id} lacks canonical implementation evidence`);
  await access(resolve(root, entry.evidence.implementation));
}
if (requiredDependencies.size !== 55) fail(`Rivet must preserve exact shipping dependency union=55, got ${requiredDependencies.size}`);

const contractById = new Map(contracts.contracts.map((entry) => [entry.id, entry]));
const values = new Map();
for (const entry of bundle.values) {
  if (values.has(entry.id)) fail(`duplicate token ${entry.id}`);
  const contract = contractById.get(entry.id);
  if (!contract) fail(`unknown token ${entry.id}`);
  if (contract.type !== entry.type) fail(`type mismatch for ${entry.id}: expected ${contract.type}, got ${entry.type}`);
  values.set(entry.id, entry.value);
}
for (const dependency of requiredDependencies) if (!values.has(dependency)) fail(`unresolved token dependency ${dependency}`);
if (values.size !== requiredDependencies.size) fail('Rivet bundle must be the exact union of shipping Core dependencies');

for (const axis of ['x', 'y']) {
  const rest = px(values.get(`depth.rest.${axis}`));
  const hover = px(values.get(`depth.hover.${axis}`));
  const active = px(values.get(`depth.active.${axis}`));
  const hoverPress = px(values.get(`press.hover.${axis}`));
  const activePress = px(values.get(`press.active.${axis}`));
  if (rest !== 5 || hover !== 3 || active !== 0 || hoverPress !== 2 || activePress !== 5) fail(`Rivet ${axis}-axis must preserve ratified 5→3→0 depth / 0→2→5 travel`);
  if (rest !== hover + hoverPress || rest !== active + activePress) fail(`Rivet ${axis}-axis depth/travel must remain one coherent pressure model`);
}
if (values.get('border.control.width') !== '3px' || values.get('border.surface.width') !== '3px' || values.get('border.annotation.width') !== '2px') fail('Rivet must preserve ratified 3/3/2px structural boundaries');
if (values.get('radius.control') !== '6px' || values.get('radius.surface') !== '6px' || values.get('radius.annotation') !== '999px') fail('Rivet must preserve ratified 6/6/pill mechanical geometry');
if (values.get('motion.press.duration') !== '80ms' || values.get('motion.release.duration') !== '140ms' || values.get('motion.standard.duration') !== '160ms') fail('Rivet semantic timing must be 80/140/160ms');
if (values.get('size.control.minimum') !== '44px') fail('Rivet must preserve 44px minimum target size');
if (values.get('focus.ring.width') !== '3px' || values.get('focus.ring.offset') !== '3px') fail('Rivet focus keyline must preserve 3px width/offset');
if (values.get('color.surface.interactive') !== '#fffefb' || values.get('color.surface.panel') !== '#f8f6f1') fail('Rivet Light must preserve adapted paper surfaces');
if (values.get('color.content.primary') !== '#222126' || values.get('color.border.strong') !== '#25232b') fail('Rivet Light must preserve adapted ink structure');
if (values.get('color.action.primary.surface') !== '#b9a1ed' || values.get('color.action.primary.content') !== '#211c2b') fail('Rivet Light primary action must preserve lavender/ink pairing');
if (values.get('color.focus.ring') !== '#7550ac') fail('Rivet Light focus ring must preserve deep lavender identity');
if (values.get('color.state.success') !== '#2fa371' || values.get('color.state.warning') !== '#c98017' || values.get('color.state.error') !== '#b83a31' || values.get('color.state.info') !== '#5397c7') fail('Rivet semantic state palette drifted');

const css = renderResolvedTokenCss(contracts, bundle, { selector: '.ns-theme-rivet-light' });
for (const dependency of requiredDependencies) if (!css.includes(`--ns-${dependency.replaceAll('.', '-')}:`)) fail(`Rivet CSS omitted ${dependency}`);
for (const marker of [
  '.ns-theme-rivet-light {',
  '--ns-border-control-width: 3px;',
  '--ns-radius-control: 6px;',
  '--ns-depth-rest-y: 5px;',
  '--ns-depth-hover-y: 3px;',
  '--ns-press-active-y: 5px;',
  '--ns-motion-press-duration: 80ms;',
  '--ns-motion-release-duration: 140ms;',
  '--ns-motion-standard-duration: 160ms;',
  '--ns-color-surface-interactive: #fffefb;',
  '--ns-color-action-primary-surface: #b9a1ed;',
  '--ns-color-state-info: #5397c7;',
  '--ns-color-state-success: #2fa371;',
  '--ns-color-state-warning: #c98017;',
  '--ns-color-focus-ring: #7550ac;'
]) if (!css.includes(marker)) fail(`Rivet generated CSS missing marker ${marker}`);
if (css.includes(':root {')) fail('scoped Rivet CSS must not replace the root Theme');

console.log('[rivet-theme] validated exact 55-token Rivet Light resolution for 50 implemented/public-proof Core components');
