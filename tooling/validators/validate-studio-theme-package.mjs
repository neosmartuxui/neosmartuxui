import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { compileJsonSchemaSubset } from '../../packages/contracts/json-schema-subset.mjs';
import { createThemePackageValidators, exportThemePackage, importThemePackage } from '../../packages/contracts/theme-package-io.mjs';
import { validateThemePackageSemantic } from '../../packages/contracts/theme-package-semantic.mjs';
import { createThemeWorkspace, putThemePackage, removeThemePackage, selectThemeMode } from '../../packages/contracts/theme-workspace.mjs';
import { renderResolvedTokenCss } from '../../packages/adapters/css/resolve-theme.mjs';

const root = resolve(import.meta.dirname, '../..');
const json = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const text = async (path) => readFile(resolve(root, path), 'utf8');
const clone = (value) => JSON.parse(JSON.stringify(value));

const [themeSchema, resolutionSchema, bundleSchema, tokenContracts, componentRegistry] = await Promise.all([
  json('spec/schemas/theme.schema.json'),
  json('spec/schemas/theme-resolution.schema.json'),
  json('spec/schemas/resolved-token-bundle.schema.json'),
  json('spec/core/token-contracts.json'),
  json('packages/core/component-registry.json')
]);

const componentContracts = {};
for (const entry of componentRegistry.components) componentContracts[entry.id] = await json('packages/core/' + entry.contract);
const flavors = {};
for (const entry of (await readdir(resolve(root, 'packages/flavors'), { withFileTypes: true })).filter((item) => item.isDirectory())) {
  const flavor = await json('packages/flavors/' + entry.name + '/flavor.json');
  flavors[flavor.id] = flavor;
}
const authorities = { tokenContracts, componentRegistry, componentContracts, flavors };
const validators = createThemePackageValidators({ themeSchema, resolutionSchema, bundleSchema });

const rawThemeFiles = async (slug) => ({
  'theme.json': await text('packages/themes/' + slug + '/theme.json'),
  'resolution.json': await text('packages/themes/' + slug + '/resolution.json'),
  'tokens.json': await text('packages/themes/' + slug + '/tokens.json')
});
const mutate = (files, filename, change) => {
  const next = { ...files };
  const value = JSON.parse(next[filename]);
  change(value);
  next[filename] = JSON.stringify(value);
  return next;
};
const expectFailure = (result, code) => {
  assert.equal(result.ok, false, 'expected failure ' + code);
  assert.ok(result.errors.some((entry) => entry.code === code), 'missing failure code ' + code + ': ' + JSON.stringify(result.errors));
};

assert.throws(() => compileJsonSchemaSubset({ ...themeSchema, unevaluatedProperties: false }), /unsupported keyword unevaluatedProperties/);

const rivetFiles = await rawThemeFiles('rivet-light');
const imported = importThemePackage(rivetFiles, { validators, authorities });
assert.equal(imported.ok, true, JSON.stringify(imported.errors));
assert.ok(Object.isFrozen(imported.value));
assert.ok(Object.isFrozen(imported.value.bundle.values));
assert.ok(Object.isFrozen(imported.value.bundle.values[0]));
assert.equal(validateThemePackageSemantic(imported.value, authorities).valid, true);

expectFailure(importThemePackage({ ...rivetFiles, 'extra.json': '{}' }, { validators, authorities }), 'package.files');
const missing = { ...rivetFiles };
delete missing['tokens.json'];
expectFailure(importThemePackage(missing, { validators, authorities }), 'package.files');
expectFailure(importThemePackage({ ...rivetFiles, 'theme.json': '{not-json' }, { validators, authorities }), 'json.parse');

const throwingValidators = { ...validators, theme: () => { throw new Error('schema exploded'); } };
expectFailure(importThemePackage(rivetFiles, { validators: throwingValidators, authorities }), 'schema.exception');
const mutatingValidators = { ...validators, theme: (value) => { value.schema = 'mutated'; return { valid: true, errors: [] }; } };
expectFailure(importThemePackage(rivetFiles, { validators: mutatingValidators, authorities }), 'schema.mutation');

expectFailure(importThemePackage(mutate(rivetFiles, 'theme.json', (value) => { value.extra = true; }), { validators, authorities }), 'schema.invalid');
expectFailure(importThemePackage(mutate(rivetFiles, 'resolution.json', (value) => { value.flavor = 'RIVET'; }), { validators, authorities }), 'schema.invalid');
expectFailure(importThemePackage(mutate(rivetFiles, 'resolution.json', (value) => { value.scope.push(value.scope[0]); }), { validators, authorities }), 'schema.invalid');
expectFailure(importThemePackage(mutate(rivetFiles, 'tokens.json', (value) => { value.values[0].extra = true; }), { validators, authorities }), 'schema.invalid');
expectFailure(importThemePackage(mutate(rivetFiles, 'tokens.json', (value) => { value.theme = 'Other Theme'; }), { validators, authorities }), 'identity.theme');

expectFailure(importThemePackage(mutate(rivetFiles, 'tokens.json', (value) => {
  value.values.find((entry) => entry.id === 'font.family.body').value = 'Inter, url(https://example.com/font.woff2)';
}), { validators, authorities }), 'token.value');
expectFailure(importThemePackage(mutate(rivetFiles, 'tokens.json', (value) => {
  value.values.find((entry) => entry.id === 'color.action.primary.surface').value = '#fff; background:url(https://example.com)';
}), { validators, authorities }), 'token.value');
expectFailure(importThemePackage(mutate(rivetFiles, 'tokens.json', (value) => {
  value.values.find((entry) => entry.id === 'motion.press.duration').value = '-1ms';
}), { validators, authorities }), 'token.value');
expectFailure(importThemePackage(mutate(rivetFiles, 'tokens.json', (value) => {
  value.values.find((entry) => entry.id === 'color.action.primary.surface').value = '#B9A1ED';
}), { validators, authorities }), 'token.value');
expectFailure(importThemePackage(mutate(rivetFiles, 'tokens.json', (value) => {
  value.values.find((entry) => entry.id === 'depth.hover.x').value = '1px';
}), { validators, authorities }), 'pressure.coherence');
expectFailure(importThemePackage(mutate(rivetFiles, 'tokens.json', (value) => {
  value.values.find((entry) => entry.id === 'size.control.minimum').value = '43px';
}), { validators, authorities }), 'accessibility.target');

const exported = exportThemePackage(imported.value, { authorities });
assert.equal(exported.ok, true, JSON.stringify(exported.errors));
for (const filename of ['theme.json', 'resolution.json', 'tokens.json']) {
  assert.ok(exported.value.files[filename].endsWith('\n'));
  assert.equal(typeof exported.value.files[filename], 'string');
}
const roundTrip = importThemePackage(exported.value.files, { validators, authorities });
assert.equal(roundTrip.ok, true, JSON.stringify(roundTrip.errors));
assert.deepEqual(roundTrip.value, exported.value.package);

const shuffled = clone(imported.value);
shuffled.resolution.scope.reverse();
shuffled.bundle.scope.reverse();
shuffled.bundle.values.reverse();
const beforeShuffled = JSON.stringify(shuffled);
const shuffledExport = exportThemePackage(shuffled, { authorities });
assert.equal(shuffledExport.ok, true, JSON.stringify(shuffledExport.errors));
assert.deepEqual(shuffledExport.value.files, exported.value.files);
assert.equal(JSON.stringify(shuffled), beforeShuffled);

const shippingThemes = ['hardline-light','hardline-dark','soft-light','soft-dark','rivet-light','rivet-dark','mono-light','mono-dark','pulse-light','pulse-dark'];
for (const slug of shippingThemes) {
  const result = importThemePackage(await rawThemeFiles(slug), { validators, authorities });
  assert.equal(result.ok, true, slug + ': ' + JSON.stringify(result.errors));
  const css = renderResolvedTokenCss(tokenContracts, result.value.bundle, { selector: '.ns-theme-test' });
  assert.ok(css.startsWith('.ns-theme-test {\n'));
  assert.ok(css.endsWith('}\n'));
}

const unsafeBundle = clone(imported.value.bundle);
unsafeBundle.values.find((entry) => entry.id === 'color.action.primary.surface').value = '#fff; background:red';
assert.throws(() => renderResolvedTokenCss(tokenContracts, unsafeBundle), /resolved-token-value/);

const dark = importThemePackage(await rawThemeFiles('rivet-dark'), { validators, authorities });
assert.equal(dark.ok, true, JSON.stringify(dark.errors));
let workspace = createThemeWorkspace();
let result = putThemePackage(workspace, imported.value);
assert.equal(result.ok, true);
workspace = result.value;
assert.equal(workspace.currentMode, 'light');
result = putThemePackage(workspace, dark.value);
assert.equal(result.ok, true);
workspace = result.value;
assert.equal(workspace.currentMode, 'dark');
assert.ok(workspace.light && workspace.dark);
result = selectThemeMode(workspace, 'light');
assert.equal(result.ok, true);
workspace = result.value;
assert.equal(workspace.currentMode, 'light');

const incompatible = clone(dark.value);
incompatible.theme.category = 'soft';
incompatible.resolution.flavor = 'flavor.soft';
incompatible.bundle.flavor = 'flavor.soft';
const beforeWorkspace = JSON.stringify(workspace);
result = putThemePackage(workspace, incompatible);
expectFailure(result, 'workspace.compatibility');
assert.equal(JSON.stringify(workspace), beforeWorkspace);
result = removeThemePackage(workspace, 'light');
assert.equal(result.ok, true);
assert.equal(result.value.light, null);
assert.equal(result.value.currentMode, 'dark');
result = removeThemePackage(result.value, 'dark');
assert.equal(result.ok, true);
assert.equal(result.value.currentMode, null);

for (const path of [
  'packages/contracts/json-schema-subset.mjs',
  'packages/contracts/resolved-token-value.mjs',
  'packages/contracts/theme-package-semantic.mjs',
  'packages/contracts/theme-package-io.mjs',
  'packages/contracts/theme-workspace.mjs'
]) {
  const source = await text(path);
  assert.doesNotMatch(source, /from\s+['"]node:/, path + ' must remain browser-safe');
}

console.log('[studio-theme-package] validated 10 shipping Themes including the Pulse Light/Dark pair plus fail-closed schema/value semantics, deterministic import/export, resolver safety, and ephemeral Light/Dark workspace');
