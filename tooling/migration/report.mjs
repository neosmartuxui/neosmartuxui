import fs from 'node:fs';

const inventory = JSON.parse(fs.readFileSync('migration/inventory.json', 'utf8'));

console.log('# NeoSmartUI migration inventory');
console.log('');
console.log(`Captured: ${inventory.capturedAt}`);
console.log(`Authority: ${inventory.authority}`);
console.log(`Principle: ${inventory.principle}`);
console.log('');
console.log('## Pinned sources');
console.log('');
for (const source of inventory.sources) {
  console.log(`- ${source.repository}@${source.sha} — ${source.legacyRole}; targets: ${source.targetLayers.join(', ')}; license: ${source.licenseEvidence.status}`);
}
console.log('');
console.log('## Selected migration evidence');
console.log('');
for (const artifact of inventory.artifacts) {
  console.log(`- ${artifact.id}: ${artifact.decision} ${artifact.sourceRepository}/${artifact.sourcePath} -> ${artifact.targetLayer}`);
}
