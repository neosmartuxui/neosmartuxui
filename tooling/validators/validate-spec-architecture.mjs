import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const files = [
  'spec/architecture/FOUNDATIONS.md',
  'spec/architecture/TAXONOMY.md',
  'spec/architecture/DEPENDENCIES.md',
  'spec/architecture/PUBLIC-PROOF.md',
  'docs/PUBLIC-PROOF-GATE.md',
  'docs/CI-INCIDENT-RECOVERY.md',
  'spec/studio/STUDIO.md'
];
for (const file of files) await access(resolve(root, file));

const taxonomy = await readFile(resolve(root, 'spec/architecture/TAXONOMY.md'), 'utf8');
for (const marker of [
  'Commerce is a Vertical, not a Flavor.',
  'SaaS is a Vertical, not a Flavor.',
  'Hardline, Soft, Rivet, Mono, and Pulse',
  '`REGISTRY GAP`'
]) if (!taxonomy.includes(marker)) throw new Error(`Taxonomy missing: ${marker}`);

const foundations = await readFile(resolve(root, 'spec/architecture/FOUNDATIONS.md'), 'utf8');
for (const marker of ['SPEC', 'CORE', 'COMPONENTS', 'BLOCKS', 'PAGES', 'APPLICATIONS', 'Core + Vertical + Flavor + Theme + Framework Adapter = Application UI']) {
  if (!foundations.includes(marker)) throw new Error(`Foundation architecture missing: ${marker}`);
}

const deps = await readFile(resolve(root, 'spec/architecture/DEPENDENCIES.md'), 'utf8');
if (!deps.includes('Core MUST NOT import a Vertical.')) throw new Error('Core/Vertical dependency boundary missing.');

const proof = await readFile(resolve(root, 'spec/architecture/PUBLIC-PROOF.md'), 'utf8');
for (const marker of [
  'SOURCE ONCE. DEMONSTRATE EVERYWHERE.',
  'Proof-bound maintenance',
  'neosmartui/public-proof-maintenance@1',
  'declare exactly the complete set',
  'proof-only promotion',
  'CI scheduler incident recovery',
  'byte-identical Quality workflow',
  'closed unmerged'
]) if (!proof.includes(marker)) throw new Error(`Public proof law missing: ${marker}`);

const studio = await readFile(resolve(root, 'spec/studio/STUDIO.md'), 'utf8');
for (const marker of [
  'ONE LOGICAL THEME, THREE CANONICAL FILES.',
  'Theme is data, not forked components.',
  'CAPABILITY ABSENCE IS NOT A PREVIEW.',
  'neosmartui/component-preview@1',
  'SOURCE ONCE. DEMONSTRATE EVERYWHERE.',
  'REGISTRY GAP'
]) if (!studio.includes(marker)) throw new Error(`Studio architecture missing: ${marker}`);

const proofGate = await readFile(resolve(root, 'docs/PUBLIC-PROOF-GATE.md'), 'utf8');
for (const marker of [
  'evidence/maintenance/<subject>.json',
  'declared path set MUST equal the actual proof-bound mismatch set exactly',
  'Do not redeploy after proof promotion.'
]) if (!proofGate.includes(marker)) throw new Error(`Public proof gate missing maintenance rule: ${marker}`);

const recovery = await readFile(resolve(root, 'docs/CI-INCIDENT-RECOVERY.md'), 'utf8');
for (const marker of [
  'Canonical SHA is fixed',
  'Workflow-byte continuity',
  'Same mandatory gates',
  'Artifact provenance',
  'No merge of recovery PR',
  'No false history',
  'excluding provenance-only deployment metadata'
]) if (!recovery.includes(marker)) throw new Error(`CI incident recovery contract missing: ${marker}`);

console.log('Spec architecture validation passed. Taxonomy, dependency direction, Studio one-source/capability laws, public-proof maintenance, and exact-SHA CI incident recovery are explicit.');
