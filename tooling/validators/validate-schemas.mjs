import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const schemaFiles = [
  'stable-id.schema.json',
  'component.schema.json',
  'component-registry.schema.json',
  'component-preview.schema.json',
  'block.schema.json',
  'page.schema.json',
  'theme.schema.json',
  'flavor.schema.json',
  'vertical.schema.json',
  'token-contracts.schema.json',
  'resolved-token-bundle.schema.json',
  'theme-resolution.schema.json',
  'deployment-record.schema.json',
  'public-proof.schema.json',
  'public-proof-maintenance.schema.json'
];

const parsed = new Map();
for (const file of schemaFiles) {
  const path = resolve(root, 'spec/schemas', file);
  await access(path);
  parsed.set(file, JSON.parse(await readFile(path, 'utf8')));
}

const expectedIds = new Map([
  ['component.schema.json', 'https://neosmartui.com/schemas/component@1.json'],
  ['component-registry.schema.json', 'https://neosmartui.com/schemas/component-registry@1.json'],
  ['component-preview.schema.json', 'https://neosmartui.com/schemas/component-preview@1.json'],
  ['block.schema.json', 'https://neosmartui.com/schemas/block@1.json'],
  ['page.schema.json', 'https://neosmartui.com/schemas/page@1.json'],
  ['theme.schema.json', 'https://neosmartui.com/schemas/theme@1.json'],
  ['flavor.schema.json', 'https://neosmartui.com/schemas/flavor@1.json'],
  ['vertical.schema.json', 'https://neosmartui.com/schemas/vertical@1.json'],
  ['token-contracts.schema.json', 'https://neosmartui.com/schemas/token-contracts@1.json'],
  ['resolved-token-bundle.schema.json', 'https://neosmartui.com/schemas/resolved-token-bundle@1.json'],
  ['theme-resolution.schema.json', 'https://neosmartui.com/schemas/theme-resolution@1.json'],
  ['deployment-record.schema.json', 'https://neosmartui.com/schemas/deployment-record@1.json'],
  ['public-proof.schema.json', 'https://neosmartui.com/schemas/public-proof@1.json'],
  ['public-proof-maintenance.schema.json', 'https://neosmartui.com/schemas/public-proof-maintenance@1.json']
]);
for (const [file, id] of expectedIds) if (parsed.get(file).$id !== id) throw new Error(`${file} has unexpected $id`);
for (const file of ['theme.schema.json', 'flavor.schema.json']) {
  const schema = parsed.get(file);
  if (!schema.required.includes('schema') || !schema.properties.schema) throw new Error(`${file} requires schema but does not permit it`);
}

const componentPreview = parsed.get('component-preview.schema.json');
if (componentPreview.properties.schema?.const !== 'neosmartui/component-preview@1') throw new Error('component preview schema identity drifted');
for (const field of ['schema','component','fixture','controller','fixtureComponents','defaultState','resetStrategy','stateRealization','renderers']) {
  if (!componentPreview.required.includes(field)) throw new Error(`component preview schema must require ${field}`);
}
if (componentPreview.properties.resetStrategy?.const !== 'remount') throw new Error('component preview reset strategy must remain deterministic remount');

const deploymentRecord = parsed.get('deployment-record.schema.json');
if (JSON.stringify(deploymentRecord.properties.artifact?.enum) !== JSON.stringify(['foundry','studio'])) throw new Error('deployment record artifact authority must permit exactly Foundry and Studio');

const maintenance = parsed.get('public-proof-maintenance.schema.json');
if (maintenance.properties.schema?.const !== 'neosmartui/public-proof-maintenance@1') throw new Error('public-proof maintenance schema identity drifted');
if (maintenance.additionalProperties !== false || maintenance.oneOf?.length !== 2) throw new Error('public-proof maintenance records must remain closed and subject-exclusive');
for (const field of ['trackingIssue', 'proofRecord', 'implementationFiles']) if (!maintenance.required.includes(field)) throw new Error(`public-proof maintenance schema must require ${field}`);

const patterns = {
  component: /^(?!flavor\.|vertical\.)[a-z][a-z0-9-]*\.(?!block\.|page\.)[a-z][a-z0-9-]*$/,
  block: /^[a-z][a-z0-9-]*\.block\.[a-z][a-z0-9-]*$/,
  page: /^[a-z][a-z0-9-]*\.page\.[a-z][a-z0-9-]*$/,
  flavor: /^flavor\.[a-z][a-z0-9-]*$/,
  vertical: /^vertical\.[a-z][a-z0-9-]*$/
};
const valid = [
  ['component', 'core.button'],
  ['component', 'commerce.product-price'],
  ['component', 'saas.plan-usage'],
  ['block', 'core.block.hero'],
  ['block', 'commerce.block.product-grid'],
  ['page', 'commerce.page.checkout'],
  ['flavor', 'flavor.rivet'],
  ['vertical', 'vertical.commerce']
];
for (const [kind, id] of valid) if (!patterns[kind].test(id)) throw new Error(`Expected valid ${kind} ID: ${id}`);

const invalid = ['neosmartui.core.component.button', 'Commerce.product', 'core.block.hero.card', 'commerce.page.checkout.step', 'flavor.Commerce'];
for (const id of invalid) if (Object.values(patterns).some((pattern) => pattern.test(id))) throw new Error(`Expected invalid stable ID: ${id}`);

const taxonomy = await readFile(resolve(root, 'spec/architecture/TAXONOMY.md'), 'utf8');
if (!taxonomy.includes('Commerce is a Vertical, not a Flavor.')) throw new Error('Schemas must remain aligned with corrected taxonomy.');

console.log('Schema validation passed. Versioned schema identities including component-preview@1, deployment/public-proof/maintenance provenance, satisfiable Flavor/Theme contracts, and stable semantic-ID rules are coherent.');
