import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { reconcileBinding, validateFlavorMaintenance, gitBlobSha } from './flavor-reconciliation.mjs';
import { coverageFor, verifyEntireCohortCoverage, coveragePlanFor } from './cohort-coverage.mjs';
import { publishedFoundryPath, checkWholeFoundryParity } from './foundry-asset-map.mjs';

const bytes=s=>Buffer.from(s,'utf8');
test('Core inherited byte parity accepts only unchanged source implementations',()=>{
  const current=bytes('core CSS stays identical');
  const entry={path:'packages/adapters/web/components/button.css',blobSha:gitBlobSha(current)};
  assert.equal(reconcileBinding({subject:'core.button',entry,current}).classification,'unchanged');
  assert.throws(()=>reconcileBinding({subject:'core.button',entry,current:bytes('mutated CSS')}),
    /changed historical Core implementation bytes/);
});
test('original Git-anchored rebrand-only Flavor page can be adapted, but no other changes',()=>{
  const before=bytes('<title>NeoSmartUI Foundry</title>');
  const entry={path:'apps/foundry/src/flavors/soft/index.html',blobSha:gitBlobSha(before)};
  const changed=bytes('<title>NeoSmartUXUI Foundry</title>');
  const recognized=reconcileBinding({subject:'flavor.soft',entry,current:changed,previous:before});
  assert.equal(recognized.classification,'verified-brand-host-migration');
  assert.equal(recognized.admission,'ADAPT');
  assert.throws(()=>reconcileBinding({subject:'flavor.soft',entry,current:bytes('<script>bad()</script>'),previous:before}),/unrecognized rebrand/);
  assert.throws(()=>reconcileBinding({subject:'flavor.soft',entry,current:changed,previous:null}),/lacks verified original bytes/);
});
test('Theme maintenance can describe original-blob absence but cannot claim historic byte equivalence',()=>{
  const original=bytes('old Theme token boundary');
  const path='packages/themes/pulse-dark/tokens.json';
  const entry={path,blobSha:gitBlobSha(original)};
  const reconciled=reconcileBinding({subject:'flavor.pulse',entry,current:bytes('new 50-Core boundary'),
    maintenance:{implementationFiles:[{path,provenBlobSha:entry.blobSha}]}});
  assert.equal(reconciled.classification,'maintenance-declared-theme-expansion');
  assert.equal(reconciled.priorBlobContentAvailable,false);
  assert.match(reconciled.assurance,/current-theme-qa-required/);
  assert.throws(()=>reconcileBinding({subject:'flavor.pulse',entry,current:bytes('new 50-Core boundary'),
    maintenance:{implementationFiles:[{path,provenBlobSha:'x'.repeat(40)}]}}),/lacks verified original bytes/);
});
test('Flavor reconciliation requires four protected Theme paths, two independently verified identity changes, and anchored record',()=>{
  const subject='flavor.mono', proofBlob='a'.repeat(40);
  const themePaths=['light/resolution.json','light/tokens.json','dark/resolution.json','dark/tokens.json']
    .map(x=>'packages/themes/mono-'+x);
  const records=themePaths.map(path=>({path,blobSha:'b'.repeat(40)}));
  const maintenance={schema:'neosmartui/public-proof-maintenance@1',flavor:subject,
    proofRecord:{path:'evidence/public/flavor.mono.json',blobSha:proofBlob},
    implementationFiles:records.map(x=>({path:x.path,provenBlobSha:x.blobSha}))};
  const bindings=[...records.map(x=>({path:x.path,classification:'maintenance-declared-theme-expansion'})),
    {path:'apps/foundry/src/flavors/mono/index.html',classification:'verified-brand-host-migration'},
    {path:'tooling/foundry/assemble-mono-dark.mjs',classification:'verified-brand-host-migration'}];
  const result=validateFlavorMaintenance({subject,record:{implementationFiles:records},
    maintenance,bindings,proofRecordBlobSha:proofBlob});
  assert.equal(result.verificationRequired.length,4);
  assert.equal(result.decision,'ADAPT');
  const tampered={...maintenance,proofRecord:{...maintenance.proofRecord,blobSha:'d'.repeat(40)}};
  assert.throws(()=>validateFlavorMaintenance({subject,record:{implementationFiles:records},
    maintenance:tampered,bindings,proofRecordBlobSha:proofBlob}),/anchor mismatch/);
  assert.throws(()=>validateFlavorMaintenance({subject,record:{implementationFiles:records},
    maintenance,bindings:bindings.slice(1),proofRecordBlobSha:proofBlob}),/four protected Theme paths/);
});
function reportWith(...fixtures) {
  return {suites:fixtures.map(({file,titles})=>({file,specs:titles.map(title=>({
    file,title,ok:true,tests:[{status:'expected',results:[{status:'passed'}]}]
  }))}))};
}
test('each Core subject needs its exact canonical preview plus behavior test, not a generic passing file',()=>{
  const plan=coveragePlanFor('core.button-group');
  const good=reportWith({file:plan.previewFile,titles:[plan.previewTitle]},
    {file:plan.behaviorFile,titles:[plan.behaviorTitlePrefix+' and ordinary Tab order']});
  assert.equal(coverageFor(good,'core.button-group').passed,true);
  assert.equal(coverageFor(reportWith({file:plan.behaviorFile,titles:['unrelated test passed']}),'core.button-group').passed,false);
  assert.equal(coverageFor(reportWith({file:plan.previewFile,titles:[plan.previewTitle]}),'core.button-group').passed,false);
});
test('each official Flavor needs at least four real passing Light and four Dark checks',()=>{
  const plan=coveragePlanFor('flavor.rivet');
  const passing=reportWith(...plan.flavorFiles.map(file=>({file,titles:['case 1','case 2','case 3','case 4']})));
  assert.equal(coverageFor(passing,'flavor.rivet').passed,true);
  const incomplete=reportWith({file:plan.flavorFiles[0],titles:['case 1','case 2','case 3','case 4']});
  assert.equal(coverageFor(incomplete,'flavor.rivet').passed,false);
  assert.equal(verifyEntireCohortCoverage(passing,[{id:'flavor.rivet'}]).passed,false);
});
test('generated-to-Pages Foundry mapping is exact and refuses traversal',()=>{
  assert.equal(publishedFoundryPath('index.html'),'foundry/index.html');
  assert.equal(publishedFoundryPath('deployment.json'),'foundry/deployment.json');
  assert.equal(publishedFoundryPath('flavors/mono/index.html'),'flavors/mono/index.html');
  assert.throws(()=>publishedFoundryPath('../secrets'),/Unsafe generated/);
  assert.throws(()=>publishedFoundryPath('a\\b'),/Unsafe generated/);
});
test('entire Foundry artifact set fails closed on mismatch, missing HTTP content, or missing files',()=>{
  const source=[{publishedPath:'foundry/index.html',localSha256:'a',pagesSha256:'a',liveSha256:'a',liveStatus:200}];
  assert.deepEqual(checkWholeFoundryParity(source,[{publishedPath:'foundry/index.html'}]),[]);
  assert.ok(checkWholeFoundryParity([{...source[0],liveSha256:'b'}],[{publishedPath:'foundry/index.html'}]).length);
  assert.ok(checkWholeFoundryParity(source,[{publishedPath:'something-else'}]).length);
  assert.ok(checkWholeFoundryParity([{...source[0],liveStatus:404}],[{publishedPath:'foundry/index.html'}]).length);
});
