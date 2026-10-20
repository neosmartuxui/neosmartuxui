import { access, readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { assembleFoundryPreviewHtml, assembleFoundryPreviewStyles, loadComponentPreviews, renderFoundryPreviewRuntime } from '../foundry/component-preview-assembly.mjs';

const root = resolve(import.meta.dirname, '../..');
const fail = (message) => { throw new Error(`[component-preview-contract] ${message}`); };
const json = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const gitBlob = (text) => {
  const bytes = Buffer.from(text);
  return createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
};

const schema = await json('spec/schemas/component-preview.schema.json');
if (schema.$id !== 'https://neosmartui.com/schemas/component-preview@1.json') fail('schema $id drifted');
if (schema.properties?.schema?.const !== 'neosmartui/component-preview@1') fail('schema identity drifted');
if (schema.additionalProperties !== false) fail('preview manifest must remain closed');

const registry = await json('packages/core/component-registry.json');
if (registry.schema !== 'neosmartui/component-registry@1' || registry.domain !== 'core') fail('Core component registry authority drifted');
const previewableComponents = registry.components.filter((entry) => entry.maturity !== 'contract-only');
const expectedSlugs = previewableComponents.map((entry) => entry.id.split('.')[1]);
const dirs = (await readdir(resolve(root, 'packages/core/previews'), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
if (dirs.join('|') !== [...expectedSlugs].sort().join('|')) fail(`preview directories must exactly match Core registry; got ${dirs.join(',')}`);

const previews = await loadComponentPreviews(root);
const modeCounts = { fixture: 0, 'native-pointer': 0, 'native-keyboard': 0, controller: 0 };
const bannedFixture = [/<script\b/i,/<style\b/i,/<link\b/i,/\sstyle\s*=/i,/\son[a-z]+\s*=/i];
const bannedController = [/\bimport\s/m,/\.style\b/,/\.classList\b/,/\.className\b/,/innerHTML/,/outerHTML/,/insertAdjacentHTML/,/\bfetch\s*\(/,/XMLHttpRequest/,/WebSocket/,/\beval\s*\(/,/new\s+Function\b/];

for (const preview of previews) {
  const { entry, slug, manifest, fixture } = preview;
  if (manifest.schema !== 'neosmartui/component-preview@1' || manifest.component !== entry.id) fail(`${entry.id} preview identity drifted`);
  if (manifest.fixture !== 'fixture.html' || manifest.resetStrategy !== 'remount') fail(`${entry.id} must use deterministic fixture.html/remount`);
  const contract = await json(`packages/core/${entry.contract}`);
  const states = Object.keys(manifest.stateRealization);
  if (states.join('|') !== contract.states.join('|')) fail(`${entry.id} state realization must exactly equal canonical contract order`);
  if (manifest.defaultState !== contract.states[0] || manifest.stateRealization[manifest.defaultState]?.mode !== 'fixture') fail(`${entry.id} default state must be the first canonical fixture-realized state`);

  const fixtureComponents = manifest.fixtureComponents ?? [];
  const expectedStyles = [`packages/adapters/web/components/${slug}.css`, ...fixtureComponents.map((id) => `packages/adapters/web/components/${id.split('.')[1]}.css`)];
  if (manifest.renderers?.web?.styles?.join('|') !== expectedStyles.join('|')) fail(`${entry.id} renderer style closure must be self + declared fixtureComponents only`);
  for (const component of fixtureComponents) if (!registry.components.some((candidate) => candidate.id === component)) fail(`${entry.id} fixture component is not in Core registry: ${component}`);
  for (const pattern of bannedFixture) if (pattern.test(fixture)) fail(`${entry.id} fixture contains executable/visual authority forbidden by ${pattern}`);

  const selectorCount = (selector) => {
    const target = selector.slice(1);
    const attribute = selector.startsWith('#') ? 'id' : 'class';
    let count = 0;
    for (const match of fixture.matchAll(/\b(id|class)="([^"]*)"/g)) {
      if (match[1] !== attribute) continue;
      const values = attribute === 'class' ? match[2].split(/\s+/) : [match[2]];
      if (values.includes(target)) count += 1;
    }
    return count;
  };

  let controllerStates = 0;
  for (const [state, realization] of Object.entries(manifest.stateRealization)) {
    if (!Object.hasOwn(modeCounts, realization.mode)) fail(`${entry.id} uses unsupported realization mode ${realization.mode}`);
    modeCounts[realization.mode] += 1;
    if (selectorCount(realization.target) !== 1) fail(`${entry.id} state ${state} target must resolve exactly once: ${realization.target}`);
    if (realization.mode === 'controller') controllerStates += 1;
  }

  const moduleSources = new Map();
  for (const binding of manifest.renderers.web.bindings) {
    if (selectorCount(binding.selector) !== 1) fail(`${entry.id} binding selector must resolve exactly once: ${binding.selector}`);
    const selfModule = `packages/adapters/web/components/${slug}.mjs`;
    if (binding.module !== selfModule) fail(`${entry.id} binding must use its shipping Web adapter module`);
    let source = moduleSources.get(binding.module);
    if (!source) {
      source = await readFile(resolve(root, binding.module), 'utf8');
      moduleSources.set(binding.module, source);
    }
    const allowedAdapterImports = new Set([...fixtureComponents.map((id) => `./${id.split('.')[1]}.mjs`), './menu-items.mjs']);
    const adapterImports = [...source.matchAll(/from\s+['"](\.\/[A-Za-z0-9_-]+\.mjs)['"]/g)].map((match) => match[1]);
    for (const specifier of adapterImports) if (!allowedAdapterImports.has(specifier)) fail(`${entry.id} adapter import must be a declared fixture component or the audited internal menu-items module: ${specifier}`);
    if (!new RegExp(`export\\s+function\\s+${binding.export}\\b`).test(source)) fail(`${entry.id} binding export not found: ${binding.export}`);
  }

  const controllerPath = resolve(root, 'packages/core/previews', slug, 'controller.mjs');
  if (controllerStates) {
    if (manifest.controller !== 'controller.mjs') fail(`${entry.id} controller states require controller.mjs`);
    const source = await readFile(controllerPath, 'utf8');
    if (!/export\s+function\s+applyPreviewState\b/.test(source)) fail(`${entry.id} controller must export applyPreviewState`);
    for (const pattern of bannedController) if (pattern.test(source)) fail(`${entry.id} controller contains forbidden authority: ${pattern}`);
    const helperNames = [...source.matchAll(/helpers\.([A-Za-z_$][A-Za-z0-9_$]*)/g)].map((match) => match[1]);
    const selfModule = `packages/adapters/web/components/${slug}.mjs`;
    let adapter = '';
    try { adapter = await readFile(resolve(root, selfModule), 'utf8'); } catch (error) { if (error?.code !== 'ENOENT') throw error; }
    for (const helper of helperNames) if (!new RegExp(`export\\s+function\\s+${helper}\\b`).test(adapter)) fail(`${entry.id} controller helper is not exported by authorized shipping adapter: ${helper}`);
  } else {
    if (manifest.controller !== null) fail(`${entry.id} without controller states must declare controller:null`);
    try { await access(controllerPath); fail(`${entry.id} must not ship an unused controller`); } catch (error) { if (error?.message?.startsWith('[component-preview-contract]')) throw error; if (error?.code !== 'ENOENT') throw error; }
  }
}

const expectedCounts = { fixture: 111, 'native-pointer': 49, 'native-keyboard': 27, controller: 80 };
if (JSON.stringify(modeCounts) !== JSON.stringify(expectedCounts)) fail(`complete Core preview matrix must contain 267 states (111/49/27/80); got ${JSON.stringify(modeCounts)}`);

const runtime = await readFile(resolve(root, 'packages/core/previews/runtime.mjs'), 'utf8');
for (const marker of ['mountPreviewBindings','applyPreviewController','moduleResolver','normalizeCleanup','deepFreeze']) if (!runtime.includes(marker)) fail(`shared preview runtime missing: ${marker}`);
if (/from\s+['"]node:/.test(runtime)) fail('shared preview runtime must remain browser-safe');

const htmlTemplate = await readFile(resolve(root, 'apps/foundry/src/index.html'), 'utf8');
const cssTemplate = await readFile(resolve(root, 'apps/foundry/src/styles.css'), 'utf8');
const harnessBase = await readFile(resolve(root, 'packages/core/previews/harness.css'), 'utf8');
const harnessResponsive = await readFile(resolve(root, 'packages/core/previews/harness-responsive.css'), 'utf8');
const html = assembleFoundryPreviewHtml(htmlTemplate, previews);
const css = assembleFoundryPreviewStyles(cssTemplate, harnessBase, harnessResponsive);
const foundryHtmlBlob = gitBlob(html);
const foundryCssBlob = gitBlob(css);
const expectedFoundryHtmlBlob = '46829bbe4b6fd4ed4e36142f1edb8d4679550658';
const expectedFoundryCssBlob = '5920961722070dc8ec510f40b43f07bfd324cca6';
if (foundryHtmlBlob !== expectedFoundryHtmlBlob || foundryCssBlob !== expectedFoundryCssBlob) {
  fail(`shared previews must reconstruct canonical Foundry bytes; observed html=${foundryHtmlBlob} css=${foundryCssBlob}`);
}
const renderedRuntime = renderFoundryPreviewRuntime(previews);
if ((renderedRuntime.match(/\bbind[A-Z][A-Za-z]+\(/g) ?? []).length !== 38) fail('Foundry runtime must retain exactly 38 canonical shipping binding calls');

console.log(`[component-preview-contract] validated ${previews.length} shipping Core previews, complete 267-state realization matrix, authorized shipping adapters/controllers, and byte-identical Foundry reconstruction`);
