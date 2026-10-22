import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { checkV2Evidence, checkProofOnlyPaths, DEPLOYED_IMPLEMENTATION_SHA, DEPLOYED_PAGES_SHA } from './current-host-promotion-contract.mjs';

const root=resolve(import.meta.dirname,'../..');
const readJson=p=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
const originals=()=>({
 record:readJson('evidence/current-host/cohort-v2.json'),
 registry:readJson('packages/core/component-registry.json').components,
 oldIds:readFileSync(resolve(root,'artifacts/proof/current-host-cohort-verified.json'),'utf8') &&
  readJson('artifacts/proof/current-host-cohort-verified.json').subjects.map(s=>s.id)
});
const messages=sample=>checkV2Evidence(sample.record,sample.registry,sample.oldIds).join(' | ');

test('complete v2 cohort binds exact 50 Core and 5 Flavor subjects',()=>{
  const s=originals();
  assert.deepEqual(checkV2Evidence(s.record,s.registry,s.oldIds),[]);
});
test('proof-only diff allowlist forbids shipping CSS, JS, templates, and historical proof edits',()=>{
  assert.deepEqual(checkProofOnlyPaths(['packages/adapters/web/components/description-list.css','evidence/public/core.list.json','evidence/maintenance/flavor.mono.json']),
    ['unapproved proof-only change: packages/adapters/web/components/description-list.css','unapproved proof-only change: evidence/public/core.list.json','unapproved proof-only change: evidence/maintenance/flavor.mono.json']);
  assert.deepEqual(checkProofOnlyPaths(['evidence/current-host/cohort-v2.json','packages/core/component-registry.json']),[]);
});
test('rejects a forged source or different Pages commit',()=>{
  const s=originals();s.record.source.sha='a'.repeat(40);s.record.pages.sha='b'.repeat(40);
  const msg=messages(s);assert.match(msg,/deployment source/);assert.match(msg,/Pages deployment/);
});
test('rejects missing subject, invented Core, duplicate, and new ID inside old cohort',()=>{
  const s=originals();s.record.subjects.pop();assert.match(messages(s),/exactly 55 distinct/);
  const t=originals();t.record.subjects[0].id='core.invented';assert.match(messages(t),/subject IDs/);
  const u=originals();u.record.subjects[0].id=u.record.subjects[1].id;assert.match(messages(u),/distinct/);
  const v=originals();v.oldIds[0]='core.description-list';assert.match(messages(v),/legacy 54 cohort/);
});
test('rejects untested Description List or wrong implementation binding',()=>{
  const s=originals();let desc=s.record.subjects.find(x=>x.id==='core.description-list');
  desc.browserCoverage.behaviorCount=7;desc.files[0].sha='f'.repeat(40);
  assert.match(messages(s),/eight passing direct tests/);
});
test('rejects a cosmetic DL in place of native hierarchy, focus, or RTL verification',()=>{
  const s=originals();const dl=s.record.subjects.find(x=>x.id==='core.description-list');
  dl.live.structure.tag='DIV';dl.live.tabPass=false;dl.live.rtl.direction='ltr';
  assert.match(messages(s),/native\/keyboard\/RTL/);
});
test('rejects one missing Theme maintenance reconciliation or wrong count',()=>{
  const s=originals();s.record.flavorReconciliations.pop();s.record.historical.decisions['verified-brand-host-migration']=9;
  assert.match(messages(s),/five Flavor/);assert.match(messages(s),/classification/);
});
test('rejects missing or tampered live asset SHA and missing exact file',()=>{
  const s=originals();s.record.artifacts[0].liveSha256='f'.repeat(64);s.record.artifacts.pop();
  assert.match(messages(s),/105-file exact live asset parity/);
});
test('rejects invented GitHub Actions provenance or incomplete QA',()=>{
  const s=originals();s.record.verification.noGitHubActions=false;s.record.browserEvidence.foundryTests=10;
  assert.match(messages(s),/incomplete current-host v2/);assert.match(messages(s),/QA runner sequence/);
});
test('requires registry to promote only after new-host evidence admission',()=>{
  const s=originals();s.registry.find(x=>x.id==='core.description-list').maturity='implemented';
  assert.match(messages(s),/registry must contain 50 public-proof/);
});
test('deployment constants remain the exact independently verified implementation and Pages pair',()=>{
  assert.equal(DEPLOYED_IMPLEMENTATION_SHA,'ec0a720813565270bceee1191d1d6a9c77cede36');
  assert.equal(DEPLOYED_PAGES_SHA,'6ecd5e21b8d7817d9b73526a14d17e790d2ea6cb');
});
