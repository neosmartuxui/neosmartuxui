import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { renderResolvedTokenCss } from '../../packages/adapters/css/resolve-theme.mjs';

const root = resolve(import.meta.dirname, '../..');
const fail = (message) => { throw new Error(`[mono-theme] ${message}`); };
const json = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const sameSet = (actual, expected) => actual.length === expected.size && actual.every((value) => expected.has(value));
const px = (value) => {
  const match = /^(-?\d+(?:\.\d+)?)px$/.exec(value);
  if (!match) fail(`expected px dimension, got ${value}`);
  return Number(match[1]);
};
const isGrayHex = (value) => {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(value);
  return Boolean(match && match[1].toLowerCase() === match[2].toLowerCase() && match[2].toLowerCase() === match[3].toLowerCase());
};

const contracts = await json('spec/core/token-contracts.json');
const registry = await json('packages/core/component-registry.json');
const flavor = await json('packages/flavors/mono/flavor.json');
const theme = await json('packages/themes/mono-light/theme.json');
const resolution = await json('packages/themes/mono-light/resolution.json');
const bundle = await json('packages/themes/mono-light/tokens.json');

if (flavor.schema !== 'neosmartui/flavor@1' || flavor.id !== 'flavor.mono' || flavor.interactionModel !== 'pressure-not-levitation') fail('Mono Flavor identity is invalid');
if (theme.schema !== 'neosmartui/theme@1' || theme.name !== 'Mono Light' || theme.category !== 'mono' || theme.color?.mode !== 'light') fail('Mono Light Theme identity is invalid');
if (theme.color?.strategy !== 'editorial-monochrome' || theme.typography?.strategy !== 'editorial-type-led') fail('Mono Light editorial identity strategy drifted');
if (theme.geometry?.profile !== 'editorial-structured' || theme.border?.profile !== 'print-keyline' || theme.shadow?.model !== 'crisp-monochrome-depth') fail('Mono Light editorial structure drifted');
if (theme.motion?.model !== 'pressure-not-levitation' || theme.interaction?.model !== 'pressure-not-levitation' || theme.interaction?.selection !== 'seated' || theme.icons?.strategy !== 'adapter-owned') fail('Mono Light interaction/adapter ownership drifted');
if (resolution.schema !== 'neosmartui/theme-resolution@1' || resolution.flavor !== flavor.id || resolution.theme !== theme.name || resolution.bundle !== 'tokens.json') fail('Mono resolution binding is invalid');
if (bundle.schema !== 'neosmartui/resolved-token-bundle@1' || bundle.flavor !== flavor.id || bundle.theme !== theme.name) fail('Mono bundle identity is invalid');

const resolvedEntries = registry.components.filter((entry) => entry.maturity !== 'contract-only');
const expectedScope = new Set(resolvedEntries.map((entry) => entry.id));
if (!sameSet(resolution.scope, expectedScope) || !sameSet(bundle.scope, expectedScope)) fail('Mono scope must exactly match implemented/public-proof Core components');
if (expectedScope.size !== 50) fail(`Mono implementation expects exactly 50 resolved Core components, got ${expectedScope.size}`);

const requiredDependencies = new Set();
for (const entry of resolvedEntries) {
  const contract = await json(`packages/core/${entry.contract}`);
  for (const dependency of contract.dependencies) requiredDependencies.add(dependency);
  if (!entry.evidence.implementation) fail(`${entry.id} lacks canonical implementation evidence`);
  await access(resolve(root, entry.evidence.implementation));
}
if (requiredDependencies.size !== 55) fail(`Mono must preserve exact shipping dependency union=55, got ${requiredDependencies.size}`);

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
if (values.size !== requiredDependencies.size) fail('Mono bundle must be the exact union of shipping Core dependencies');

for (const [id, value] of values) {
  if (id.startsWith('color.') && !isGrayHex(value)) fail(`${id} must remain grayscale in Mono Light; got ${value}`);
}
for (const axis of ['x', 'y']) {
  const rest = px(values.get(`depth.rest.${axis}`));
  const hover = px(values.get(`depth.hover.${axis}`));
  const active = px(values.get(`depth.active.${axis}`));
  const hoverPress = px(values.get(`press.hover.${axis}`));
  const activePress = px(values.get(`press.active.${axis}`));
  if (rest !== 3 || hover !== 1 || active !== 0 || hoverPress !== 2 || activePress !== 3) fail(`Mono ${axis}-axis must preserve ratified 3→1→0 depth / 0→2→3 travel`);
  if (rest !== hover + hoverPress || rest !== active + activePress) fail(`Mono ${axis}-axis depth/travel must remain one coherent pressure model`);
}
if (values.get('border.control.width') !== '2px' || values.get('border.surface.width') !== '2px' || values.get('border.annotation.width') !== '2px') fail('Mono must preserve 2px print-like structural keylines');
if (values.get('radius.control') !== '0px' || values.get('radius.surface') !== '0px' || values.get('radius.annotation') !== '0px') fail('Mono must preserve square editorial geometry');
if (values.get('motion.press.duration') !== '65ms' || values.get('motion.release.duration') !== '100ms' || values.get('motion.standard.duration') !== '140ms') fail('Mono semantic timing must be 65/100/140ms');
if (values.get('size.control.minimum') !== '44px') fail('Mono must preserve 44px minimum target size');
if (values.get('focus.ring.width') !== '3px' || values.get('focus.ring.offset') !== '3px') fail('Mono focus keyline must preserve 3px width/offset');
if (values.get('color.surface.interactive') !== '#ffffff' || values.get('color.surface.panel') !== '#f2f2f2') fail('Mono Light must preserve white/light-gray editorial surfaces');
if (values.get('color.content.primary') !== '#111111' || values.get('color.border.strong') !== '#111111') fail('Mono Light must preserve near-black editorial ink structure');
if (values.get('color.action.primary.surface') !== '#111111' || values.get('color.action.primary.content') !== '#ffffff') fail('Mono Light primary action must preserve black/white inverse pairing');
if (values.get('color.focus.ring') !== '#000000') fail('Mono Light focus ring must remain an independent black keyline');
if (values.get('color.state.success') !== '#d9d9d9' || values.get('color.state.warning') !== '#bdbdbd' || values.get('color.state.error') !== '#1f1f1f' || values.get('color.state.info') !== '#e5e5e5') fail('Mono semantic state grayscale drifted');
if (values.get('font.family.body') !== 'ui-serif, Georgia, serif') fail('Mono Light must preserve serif-led editorial typography');
if (values.get('font.weight.regular') !== 400 || values.get('font.weight.emphasis') !== 700 || values.get('font.weight.strong') !== 800) fail('Mono editorial type hierarchy weights drifted');

const css = renderResolvedTokenCss(contracts, bundle, { selector: '.ns-theme-mono-light' });
for (const dependency of requiredDependencies) if (!css.includes(`--ns-${dependency.replaceAll('.', '-')}:`)) fail(`Mono CSS omitted ${dependency}`);
for (const marker of [
  '.ns-theme-mono-light {',
  '--ns-border-control-width: 2px;',
  '--ns-radius-control: 0px;',
  '--ns-radius-annotation: 0px;',
  '--ns-depth-rest-y: 3px;',
  '--ns-depth-hover-y: 1px;',
  '--ns-press-active-y: 3px;',
  '--ns-motion-press-duration: 65ms;',
  '--ns-motion-release-duration: 100ms;',
  '--ns-motion-standard-duration: 140ms;',
  '--ns-color-surface-interactive: #ffffff;',
  '--ns-color-action-primary-surface: #111111;',
  '--ns-color-focus-ring: #000000;',
  '--ns-font-family-body: ui-serif, Georgia, serif;'
]) if (!css.includes(marker)) fail(`Mono generated CSS missing marker ${marker}`);
if (css.includes(':root {')) fail('scoped Mono CSS must not replace the root Theme');

console.log('[mono-theme] validated exact 55-token Mono Light resolution for 50 implemented/public-proof Core components with grayscale-only expression');
