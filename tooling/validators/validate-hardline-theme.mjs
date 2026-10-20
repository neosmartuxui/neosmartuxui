import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { renderResolvedTokenCss } from '../../packages/adapters/css/resolve-theme.mjs';

const root = resolve(import.meta.dirname, '../..');
const fail = (message) => { throw new Error(`[hardline-theme] ${message}`); };
const json = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const sameSet = (actual, expected) => actual.length === expected.size && actual.every((value) => expected.has(value));
const px = (value) => {
  const match = /^(-?\d+(?:\.\d+)?)px$/.exec(value);
  if (!match) fail(`expected px dimension, got ${value}`);
  return Number(match[1]);
};

const contracts = await json('spec/core/token-contracts.json');
const registry = await json('packages/core/component-registry.json');
const flavor = await json('packages/flavors/hardline/flavor.json');
const theme = await json('packages/themes/hardline-light/theme.json');
const resolution = await json('packages/themes/hardline-light/resolution.json');
const bundle = await json('packages/themes/hardline-light/tokens.json');

if (flavor.schema !== 'neosmartui/flavor@1' || flavor.id !== 'flavor.hardline' || flavor.interactionModel !== 'pressure-not-levitation') fail('Hardline Flavor identity is invalid');
if (theme.schema !== 'neosmartui/theme@1' || theme.name !== 'Hardline Light' || theme.category !== 'hardline' || theme.color?.mode !== 'light') fail('Hardline Light Theme identity is invalid');
if (resolution.schema !== 'neosmartui/theme-resolution@1' || resolution.flavor !== flavor.id || resolution.theme !== theme.name || resolution.bundle !== 'tokens.json') fail('Hardline resolution binding is invalid');
if (bundle.schema !== 'neosmartui/resolved-token-bundle@1' || bundle.flavor !== flavor.id || bundle.theme !== theme.name) fail('Hardline bundle identity is invalid');

const resolvedEntries = registry.components.filter((entry) => entry.maturity !== 'contract-only');
const expectedScope = new Set(resolvedEntries.map((entry) => entry.id));
if (!sameSet(resolution.scope, expectedScope) || !sameSet(bundle.scope, expectedScope)) fail('Hardline scope must exactly match implemented/public-proof Core components');
if (expectedScope.size !== 50) fail(`Hardline implementation expects exactly 50 resolved Core components, got ${expectedScope.size}`);

const requiredDependencies = new Set();
for (const entry of resolvedEntries) {
  const contract = await json(`packages/core/${entry.contract}`);
  for (const dependency of contract.dependencies) requiredDependencies.add(dependency);
  if (!entry.evidence.implementation) fail(`${entry.id} lacks canonical implementation evidence`);
  await access(resolve(root, entry.evidence.implementation));
}
if (requiredDependencies.size !== 55) fail(`Hardline must preserve exact shipping dependency union=55, got ${requiredDependencies.size}`);

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
if (values.size !== requiredDependencies.size) fail('Hardline bundle must be the exact union of shipping Core dependencies');

for (const axis of ['x', 'y']) {
  const rest = px(values.get(`depth.rest.${axis}`));
  const hover = px(values.get(`depth.hover.${axis}`));
  const active = px(values.get(`depth.active.${axis}`));
  const hoverPress = px(values.get(`press.hover.${axis}`));
  const activePress = px(values.get(`press.active.${axis}`));
  if (rest !== 4 || hover !== 2 || active !== 0 || hoverPress !== 2 || activePress !== 4) fail(`Hardline ${axis}-axis must preserve pinned 4→2→0 depth / 0→2→4 travel`);
  if (rest !== hover + hoverPress || rest !== active + activePress) fail(`Hardline ${axis}-axis depth/travel must remain one coherent pressure model`);
}
for (const id of ['radius.control', 'radius.surface', 'radius.annotation']) if (values.get(id) !== '0px') fail(`${id} must be 0px for Hardline Light`);
if (values.get('motion.press.duration') !== '70ms' || values.get('motion.release.duration') !== '110ms' || values.get('motion.standard.duration') !== '170ms') fail('Hardline semantic timing must be 70/110/170ms');
if (values.get('size.control.minimum') !== '44px') fail('Hardline must preserve 44px minimum target size');
if (values.get('focus.ring.width') !== '3px' || values.get('focus.ring.offset') !== '3px') fail('Hardline focus keyline must preserve 3px width/offset');
if (values.get('color.action.primary.surface') !== '#ffd84d' || values.get('color.action.primary.content') !== '#111111') fail('Hardline primary action pairing must be yellow/ink');

const css = renderResolvedTokenCss(contracts, bundle, { selector: '.ns-theme-hardline-light' });
for (const dependency of requiredDependencies) if (!css.includes(`--ns-${dependency.replaceAll('.', '-')}:`)) fail(`Hardline CSS omitted ${dependency}`);
for (const marker of [
  '.ns-theme-hardline-light {',
  '--ns-radius-control: 0px;',
  '--ns-radius-surface: 0px;',
  '--ns-radius-annotation: 0px;',
  '--ns-depth-rest-y: 4px;',
  '--ns-depth-hover-y: 2px;',
  '--ns-press-active-y: 4px;',
  '--ns-motion-press-duration: 70ms;',
  '--ns-motion-release-duration: 110ms;',
  '--ns-motion-standard-duration: 170ms;'
]) if (!css.includes(marker)) fail(`Hardline generated CSS missing marker ${marker}`);
if (css.includes(':root {')) fail('scoped Hardline CSS must not replace the Rivet Foundry root Theme');

console.log('[hardline-theme] validated exact 55-token Hardline Light resolution for 50 implemented/public-proof Core components');
