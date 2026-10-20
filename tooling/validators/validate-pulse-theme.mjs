import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { renderResolvedTokenCss } from '../../packages/adapters/css/resolve-theme.mjs';

const root = resolve(import.meta.dirname, '../..');
const fail = (message) => { throw new Error(`[pulse-theme] ${message}`); };
const json = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const sameSet = (actual, expected) => actual.length === expected.size && actual.every((value) => expected.has(value));
const px = (value) => {
  const match = /^(-?\d+(?:\.\d+)?)px$/.exec(value);
  if (!match) fail(`expected px dimension, got ${value}`);
  return Number(match[1]);
};

const contracts = await json('spec/core/token-contracts.json');
const registry = await json('packages/core/component-registry.json');
const flavor = await json('packages/flavors/pulse/flavor.json');
const theme = await json('packages/themes/pulse-light/theme.json');
const resolution = await json('packages/themes/pulse-light/resolution.json');
const bundle = await json('packages/themes/pulse-light/tokens.json');

if (flavor.schema !== 'neosmartui/flavor@1' || flavor.id !== 'flavor.pulse' || flavor.interactionModel !== 'pressure-not-levitation') fail('Pulse Flavor identity is invalid');
if (theme.schema !== 'neosmartui/theme@1' || theme.name !== 'Pulse Light' || theme.category !== 'pulse' || theme.color?.mode !== 'light') fail('Pulse Light Theme identity is invalid');
if (theme.color?.strategy !== 'crisp-neutral-electric-violet' || theme.typography?.strategy !== 'product-system-first') fail('Pulse Light identity strategy drifted');
if (theme.geometry?.profile !== 'sharp-micro' || theme.border?.profile !== 'visible-compact' || theme.shadow?.model !== 'medium-hard-depth') fail('Pulse Light structural descriptor drifted');
if (theme.spacing?.density !== 'compact' || theme.density?.control !== 'compact-accessible') fail('Pulse Light must preserve compact-but-accessible density');
if (theme.motion?.model !== 'pressure-not-levitation' || theme.motion?.intensity !== 'restrained') fail('Pulse Light motion must preserve restrained pressure interaction');
if (theme.interaction?.model !== 'pressure-not-levitation' || theme.interaction?.selection !== 'seated') fail('Pulse Light interaction must preserve pressure and seated selection');
if (theme.icons?.strategy !== 'adapter-owned') fail('Pulse Light must preserve adapter-owned icons');
if (resolution.schema !== 'neosmartui/theme-resolution@1' || resolution.flavor !== flavor.id || resolution.theme !== theme.name || resolution.bundle !== 'tokens.json') fail('Pulse resolution binding is invalid');
if (bundle.schema !== 'neosmartui/resolved-token-bundle@1' || bundle.flavor !== flavor.id || bundle.theme !== theme.name) fail('Pulse bundle identity is invalid');

const resolvedEntries = registry.components.filter((entry) => entry.maturity !== 'contract-only');
const expectedScope = new Set(resolvedEntries.map((entry) => entry.id));
if (!sameSet(resolution.scope, expectedScope) || !sameSet(bundle.scope, expectedScope)) fail('Pulse scope must exactly match implemented/public-proof Core components');
if (expectedScope.size !== 50) fail(`Pulse Light expects exactly 50 resolved Core components, got ${expectedScope.size}`);

const requiredDependencies = new Set();
for (const entry of resolvedEntries) {
  const contract = await json(`packages/core/${entry.contract}`);
  for (const dependency of contract.dependencies) requiredDependencies.add(dependency);
  if (!entry.evidence.implementation) fail(`${entry.id} lacks canonical implementation evidence`);
  await access(resolve(root, entry.evidence.implementation));
}
if (requiredDependencies.size !== 55) fail(`Pulse Light must preserve exact shipping dependency union=55, got ${requiredDependencies.size}`);

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
if (values.size !== requiredDependencies.size) fail('Pulse bundle must be the exact union of shipping Core dependencies');

for (const axis of ['x', 'y']) {
  const rest = px(values.get(`depth.rest.${axis}`));
  const hover = px(values.get(`depth.hover.${axis}`));
  const active = px(values.get(`depth.active.${axis}`));
  const hoverPress = px(values.get(`press.hover.${axis}`));
  const activePress = px(values.get(`press.active.${axis}`));
  if (rest !== 4 || hover !== 2 || active !== 0 || hoverPress !== 2 || activePress !== 4) fail(`Pulse ${axis}-axis must preserve 4→2→0 depth / 0→2→4 travel`);
  if (rest !== hover + hoverPress || rest !== active + activePress) fail(`Pulse ${axis}-axis depth/travel must remain one coherent pressure model`);
}

if (values.get('border.control.width') !== '2px' || values.get('border.surface.width') !== '2px' || values.get('border.annotation.width') !== '2px') fail('Pulse must preserve compact visible 2px structure');
if (values.get('radius.control') !== '4px' || values.get('radius.surface') !== '6px' || values.get('radius.annotation') !== '999px') fail('Pulse must preserve 4/6/pill geometry');
if (values.get('motion.press.duration') !== '65ms' || values.get('motion.release.duration') !== '105ms' || values.get('motion.standard.duration') !== '145ms') fail('Pulse semantic timing must be 65/105/145ms');
if (values.get('size.control.minimum') !== '44px') fail('Pulse must preserve 44px minimum target size');
if (values.get('focus.ring.width') !== '3px' || values.get('focus.ring.offset') !== '3px') fail('Pulse focus keyline must preserve 3px width/offset');
if (values.get('color.surface.interactive') !== '#fffefc' || values.get('color.surface.panel') !== '#f4f6fa') fail('Pulse Light must preserve crisp neutral surfaces');
if (values.get('color.content.primary') !== '#15161a' || values.get('color.border.strong') !== '#15161a') fail('Pulse Light must preserve dark structural ink');
if (values.get('color.action.primary.surface') !== '#6c5ce7' || values.get('color.action.primary.content') !== '#ffffff') fail('Pulse Light primary action must preserve electric-violet/white pairing');
if (values.get('color.focus.ring') !== '#4e3ccf') fail('Pulse Light focus ring must preserve independent deep-violet identity');
if (values.get('color.state.success') !== '#a7e9c5' || values.get('color.state.warning') !== '#ffd979' || values.get('color.state.error') !== '#b3261e' || values.get('color.state.info') !== '#a7d8ff') fail('Pulse semantic state palette drifted');
if (values.get('space.control.inline') !== '0.875rem' || values.get('space.control.block') !== '0.625rem') fail('Pulse controls must preserve compact application spacing');
if (values.get('space.surface.inline') !== '0.875rem' || values.get('space.surface.block') !== '0.875rem') fail('Pulse surfaces must preserve compact application spacing');

const css = renderResolvedTokenCss(contracts, bundle, { selector: '.ns-theme-pulse-light' });
for (const dependency of requiredDependencies) if (!css.includes(`--ns-${dependency.replaceAll('.', '-') }:`)) fail(`Pulse CSS omitted ${dependency}`);
for (const marker of [
  '.ns-theme-pulse-light {',
  '--ns-border-control-width: 2px;',
  '--ns-radius-control: 4px;',
  '--ns-radius-surface: 6px;',
  '--ns-depth-rest-y: 4px;',
  '--ns-depth-hover-y: 2px;',
  '--ns-press-active-y: 4px;',
  '--ns-motion-press-duration: 65ms;',
  '--ns-motion-release-duration: 105ms;',
  '--ns-motion-standard-duration: 145ms;',
  '--ns-color-surface-panel: #f4f6fa;',
  '--ns-color-action-primary-surface: #6c5ce7;',
  '--ns-color-focus-ring: #4e3ccf;'
]) if (!css.includes(marker)) fail(`Pulse generated CSS missing marker ${marker}`);
if (css.includes(':root {')) fail('scoped Pulse CSS must not replace the root Theme');

console.log('[pulse-theme] validated exact 55-token Pulse Light resolution for 50 implemented/public-proof Core components');
