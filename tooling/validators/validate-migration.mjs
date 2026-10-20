import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const inventoryPath = path.join(root, 'migration', 'inventory.json');
const schemaPath = path.join(root, 'migration', 'inventory.schema.json');
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const fail = (message) => { throw new Error(`[migration] ${message}`); };

const inventory = readJson(inventoryPath);
const schema = readJson(schemaPath);

if (inventory.schemaVersion !== 2) fail('schemaVersion must be 2');
if (!schema.$id?.endsWith('migration-inventory@2.json')) fail('schema id must be migration-inventory@2');
if (inventory.authority !== 'docs/CANONICAL-PRD.md') fail('canonical PRD must remain authority');
if (inventory.principle !== 'RESTART THE ARCHITECTURE, NOT THE KNOWLEDGE.') fail('migration principle changed');
if (inventory.scope !== 'selected-migration-evidence') fail('inventory scope must stay explicit');

const requiredDecisions = ['ADOPT', 'ADAPT', 'PROMOTE', 'REWRITE', 'RETIRE', 'REFERENCE'];
for (const decision of requiredDecisions) {
  if (!inventory.allowedDecisions.includes(decision)) fail(`missing decision ${decision}`);
}

const expectedSources = new Map([
  ['NeoBrutalism-shop/spec', 'fbf499397f4e9a52d6e25c13921fd5377799c626'],
  ['NeoBrutalism-shop/NeoBrutal-Soft', 'dfed77bd159ac5c38081f7a4ca5c2229b61ffb8a'],
  ['NeoBrutalism-shop/NeoBrutal-Commerce', '24563484a9993c6c994f24114dc7956d3b93f694'],
  ['NeoBrutalRivet/NeoBrutal-Rivet', 'bb4b641d35bc77c958b7345a3b7c0a134c7d802d']
]);

if (inventory.sources.length !== expectedSources.size) fail('expected exactly four pinned legacy sources');
const seenRepositories = new Set();
for (const source of inventory.sources) {
  if (seenRepositories.has(source.repository)) fail(`duplicate source ${source.repository}`);
  seenRepositories.add(source.repository);
  if (!/^[0-9a-f]{40}$/.test(source.sha)) fail(`invalid SHA for ${source.repository}`);
  if (source.sha !== expectedSources.get(source.repository)) fail(`unexpected pin for ${source.repository}`);
  if (source.status !== 'snapshot-pinned') fail(`${source.repository} is not snapshot-pinned`);
  if (!Array.isArray(source.evidencePaths) || source.evidencePaths.length === 0) fail(`${source.repository} has no evidence paths`);
}

const commerce = inventory.sources.find((source) => source.repository === 'NeoBrutalism-shop/NeoBrutal-Commerce');
if (commerce.licenseEvidence.status !== 'declared') fail('Commerce license evidence must be declared');
if (commerce.licenseEvidence.path !== 'LICENSE.md') fail('Commerce license path must remain LICENSE.md');
if (commerce.licenseEvidence.name !== 'PolyForm Noncommercial License 1.0.0') fail('Commerce license name changed');
if (!commerce.targetLayers.includes('vertical')) fail('Commerce must target the vertical layer');
if (commerce.targetLayers.includes('flavor')) fail('Commerce must never target the flavor layer');

const ids = new Set();
for (const artifact of inventory.artifacts) {
  if (ids.has(artifact.id)) fail(`duplicate artifact id ${artifact.id}`);
  ids.add(artifact.id);
  if (!seenRepositories.has(artifact.sourceRepository)) fail(`${artifact.id} references unknown source`);
  if (!requiredDecisions.includes(artifact.decision)) fail(`${artifact.id} has invalid decision`);
}

console.log(`[migration] validated ${inventory.sources.length} pinned sources and ${inventory.artifacts.length} selected artifacts`);
