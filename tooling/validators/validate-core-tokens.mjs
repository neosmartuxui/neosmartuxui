import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const catalog = JSON.parse(await readFile(resolve(root, 'spec/core/token-contracts.json'), 'utf8'));
const fail = (message) => { throw new Error(`[core-tokens] ${message}`); };

if (catalog.schema !== 'neosmartui/token-contracts@1') fail('unexpected catalog schema');
if (catalog.schemaVersion !== 1) fail('schemaVersion must be 1');
if (catalog.interopTarget?.format !== 'DTCG' || catalog.interopTarget?.version !== '2025.10') fail('DTCG 2025.10 must remain the resolved-bundle interoperability target');
if (!Array.isArray(catalog.contracts) || catalog.contracts.length < 40) fail('Core token contract surface is unexpectedly small');

const allowedTypes = new Set(['color', 'dimension', 'duration', 'cubicBezier', 'number', 'fontFamily', 'fontWeight']);
const allowedResolution = new Set(['theme', 'flavor-theme']);
const forbiddenDomainTerms = /(^|\.)(commerce|saas|cart|product|checkout|plan|seat)(\.|$)/;
const ids = new Set();
for (const contract of catalog.contracts) {
  if (!/^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*){1,4}$/.test(contract.id)) fail(`invalid token id ${contract.id}`);
  if (forbiddenDomainTerms.test(contract.id)) fail(`business-domain token leaked into Core: ${contract.id}`);
  if (ids.has(contract.id)) fail(`duplicate token id ${contract.id}`);
  ids.add(contract.id);
  if (!allowedTypes.has(contract.type)) fail(`unsupported token type ${contract.type}`);
  if (!allowedResolution.has(contract.resolution)) fail(`unsupported resolution owner ${contract.resolution}`);
  if (!contract.description || contract.description.length < 8) fail(`missing token description ${contract.id}`);
  for (const forbiddenField of ['$value', 'value', 'defaultValue', 'fallback']) {
    if (Object.hasOwn(contract, forbiddenField)) fail(`${contract.id} must not contain concrete value field ${forbiddenField}`);
  }
}

const tactileRequired = [
  'depth.rest.x', 'depth.rest.y', 'depth.hover.x', 'depth.hover.y', 'depth.active.x', 'depth.active.y',
  'press.hover.x', 'press.hover.y', 'press.active.x', 'press.active.y',
  'motion.press.duration', 'motion.press.easing', 'motion.release.duration', 'motion.release.easing',
  'focus.ring.width', 'focus.ring.offset', 'color.focus.ring'
];
for (const id of tactileRequired) if (!ids.has(id)) fail(`missing permanent tactile contract ${id}`);

const docs = await readFile(resolve(root, 'spec/core/TOKENS.md'), 'utf8');
for (const marker of ['Core owns **token meaning**', 'Core token contracts MUST NOT contain concrete values.', 'Design Tokens Community Group Format Module 2025.10', 'Ordinary controls compress; they do not gain apparent elevation on hover.']) {
  if (!docs.includes(marker)) fail(`TOKENS.md missing marker: ${marker}`);
}

console.log(`[core-tokens] validated ${catalog.contracts.length} value-free semantic contracts`);
