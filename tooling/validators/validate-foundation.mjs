import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const required = [
  'docs/CANONICAL-PRD.md',
  'docs/DEVELOPMENT-ROADMAP.md',
  'docs/FOUNDRY-DEPLOYMENT.md',
  'AGENTS.md',
  'LLMS.md',
  'README.md',
  'research/competitors/README.md',
  'research/competitors/index.json',
  'research/competitors/neobrutalism-com/snapshot-2026-09-20.json',
  'research/competitors/neobrutalism-dev/components-2026-09-20.json',
  'research/competitors/riddle-ui/snapshot-2026-09-20.json',
  'migration/inventory.json',
  'migration/inventory.schema.json',
  'apps/foundry/src/index.html'
];
for (const file of required) await access(resolve(root, file));

const prd = await readFile(resolve(root, 'docs/CANONICAL-PRD.md'), 'utf8');
const requiredPrdMarkers = [
  '# NeoSmartUXUI',
  '## Canonical PRD, Architecture, Migration, Competitive Strategy & Execution Plan',
  '**Document version:** 0.4',
  '# 1. Executive decision',
  '# 40. Canonical monorepo',
  '# 69. Development roadmap',
  '# 99.1 Permanent GitHub and deployment rule',
  '# 101. Product promise',
  'Restart the architecture, not the knowledge.',
  'Source once. Demonstrate everywhere.'
];
for (const marker of requiredPrdMarkers) if (!prd.includes(marker)) throw new Error(`Canonical PRD is incomplete: missing marker ${marker}`);
if (prd.length < 50_000) throw new Error(`Canonical PRD appears truncated: ${prd.length} characters`);

const competitorIndex = JSON.parse(await readFile(resolve(root, 'research/competitors/index.json'), 'utf8'));
if (competitorIndex.schema !== 'neosmartui/competitor-index@1') throw new Error('Competitive research index schema drifted.');
if (competitorIndex.coreExpansionTarget?.minimumPublicProofCount !== 90) throw new Error('Core expansion target must remain at least 90 public-proof components.');
if (competitorIndex.coreExpansionTarget?.automaticCompetitorCountFormula !== false) throw new Error('Competitor counts must remain benchmarks, not an automatic Core target formula.');
const competitorIds = new Set((competitorIndex.competitors ?? []).map((competitor) => competitor.id));
for (const id of ['neobrutalism-com', 'neobrutalism-dev', 'riddle-ui']) {
  if (!competitorIds.has(id)) throw new Error(`Competitive research index missing tracked competitor: ${id}`);
}
if (!prd.includes('90+ distinct public-proof Core components')) throw new Error('Canonical PRD must preserve the 90+ Core component target.');
const roadmap = await readFile(resolve(root, 'docs/DEVELOPMENT-ROADMAP.md'), 'utf8');
if (!roadmap.includes('90+ distinct public-proof Core components')) throw new Error('Development roadmap must preserve the 90+ Core component target.');

const inventory = JSON.parse(await readFile(resolve(root, 'migration/inventory.json'), 'utf8'));
const expectedSources = new Map([
  ['NeoBrutalism-shop/spec', 'fbf499397f4e9a52d6e25c13921fd5377799c626'],
  ['NeoBrutalism-shop/NeoBrutal-Soft', 'dfed77bd159ac5c38081f7a4ca5c2229b61ffb8a'],
  ['NeoBrutalism-shop/NeoBrutal-Commerce', '24563484a9993c6c994f24114dc7956d3b93f694'],
  ['NeoBrutalRivet/NeoBrutal-Rivet', 'bb4b641d35bc77c958b7345a3b7c0a134c7d802d']
]);
if (!Array.isArray(inventory.sources) || inventory.sources.length !== expectedSources.size) throw new Error('Migration inventory must pin exactly the four initial legacy sources.');
for (const source of inventory.sources) {
  if (source.branch !== 'main' || source.sha !== expectedSources.get(source.repository)) throw new Error(`Unexpected legacy source pin: ${source.repository}@${source.sha}`);
}
if (!Array.isArray(inventory.artifacts)) throw new Error('Migration inventory artifacts must be an array.');

const deploymentDoc = await readFile(resolve(root, 'docs/FOUNDRY-DEPLOYMENT.md'), 'utf8');
if (!deploymentDoc.includes('https://neosmartuxui.github.io/')) throw new Error('Foundry deployment contract must name the GitHub Pages host.');
if (!deploymentDoc.includes('Custom domain is deferred')) throw new Error('Foundry deployment contract must explicitly defer custom-domain hosting.');

console.log('Foundation validation passed. Canonical PRD authority, legacy source pins, and GitHub-first Foundry baseline are present.');
