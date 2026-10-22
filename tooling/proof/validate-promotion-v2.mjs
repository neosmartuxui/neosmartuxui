import { readFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve, dirname, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';
import { checkPlaywrightReport, sha256 } from './current-host-contract.mjs';
import { coverageFor } from './cohort-coverage.mjs';
import { gitBlobSha, reconcileBinding, validateFlavorMaintenance } from './flavor-reconciliation.mjs';
import { checkV2Evidence, checkProofOnlyPaths, DEPLOYED_IMPLEMENTATION_SHA, DEPLOYED_PAGES_SHA, PROOF_PROMOTION_SHA } from './current-host-promotion-contract.mjs';

const root=resolve(import.meta.dirname,'../..');
const pages=process.env.NEOSMARTUXUI_PAGES_CHECKOUT || resolve(dirname(root),'neosmartuxui.github.io');
const git=(dir,...args)=>execFileSync('git',['-C',dir,...args],{encoding:'utf8',timeout:30000}).trim();
const command=(program,args,opts={})=>execFileSync(program,args,{cwd:root,encoding:opts.encoding||'utf8',timeout:30000,stdio:['ignore','pipe','ignore']});
const json=async p=>JSON.parse(await readFile(resolve(root,p),'utf8'));
const fail=message=>{throw new Error('[current-host-v2] '+message)};
const record=await json('evidence/current-host/cohort-v2.json');
const registry=await json('packages/core/component-registry.json');
const previousFiles=(await readdir(resolve(root,'evidence/public'))).filter(f=>f.endsWith('.json')).sort();
const previousIds=previousFiles.map(f=>f.slice(0,-5));
const problems=checkV2Evidence(record,registry.components,previousIds);
if(problems.length)fail(problems.join(' | '));
if(record.source.treeSha!==git(root,'rev-parse',DEPLOYED_IMPLEMENTATION_SHA+'^{tree}'))fail('deployed source tree SHA mismatch');
if(git(root,'merge-base',PROOF_PROMOTION_SHA,'HEAD')!==PROOF_PROMOTION_SHA)fail('active v2 proof promotion SHA must remain an ancestor of current source');
if(git(root,'merge-base',DEPLOYED_IMPLEMENTATION_SHA,PROOF_PROMOTION_SHA)!==DEPLOYED_IMPLEMENTATION_SHA)fail('original proof commit must descend from deployed implementation SHA');
// The one-time v2 proof-only promotion is frozen at its exact merge. Subsequent contract-only
// admissions may add registry/contracts without retroactively changing the proven 55-subject cohort.
const originalPromotionPaths=git(root,'diff','--name-only',DEPLOYED_IMPLEMENTATION_SHA,PROOF_PROMOTION_SHA).split(/\r?\n/).filter(Boolean);
const badPaths=checkProofOnlyPaths(originalPromotionPaths);
if(badPaths.length)fail('original proof-only promotion integrity: '+badPaths.join(' | '));
const originalProofBlob=git(root,'rev-parse',PROOF_PROMOTION_SHA+':evidence/current-host/cohort-v2.json');
const activeProofBlob=git(root,'rev-parse',':evidence/current-host/cohort-v2.json');
const proofWorkingDrift=git(root,'status','--porcelain','--','evidence/current-host/cohort-v2.json');
if(activeProofBlob!==originalProofBlob || proofWorkingDrift)fail('v2 active cohort record must remain identical to original proof-only admission');
if(git(pages,'rev-parse','HEAD')!==DEPLOYED_PAGES_SHA ||
   git(pages,'rev-parse',DEPLOYED_PAGES_SHA+'^{tree}')!==record.pages.treeSha ||
   git(pages,'status','--porcelain'))fail('Pages must remain the original clean exact published deployment; no proof-only Pages redeploy');
const deployment=await json('../neosmartuxui.github.io/foundry/deployment.json');
if(deployment.schema!=='neosmartuxui/deployment-record@1'||deployment.sourceSha!==DEPLOYED_IMPLEMENTATION_SHA ||
  deployment.artifact!=='foundry')fail('published Pages deployment points at a different implementation source');
const reportBytes=await readFile(resolve(root,'artifacts/browser/report.json')).catch(()=>null);
const studioBytes=await readFile(resolve(root,'artifacts/studio/report.json')).catch(()=>null);
if(!reportBytes||!studioBytes||sha256(reportBytes)!==record.browserEvidence.foundryReportSha256 ||
 sha256(studioBytes)!==record.browserEvidence.studioReportSha256)fail('pinned QA report bytes unavailable or changed since deployed cohort');
const report=JSON.parse(reportBytes.toString('utf8'));
const studio=JSON.parse(studioBytes.toString('utf8'));
const browserErrors=checkPlaywrightReport(report,{label:'Foundry',minTests:424,requiredFile:'foundry-core-description-list.spec.mjs',requiredTests:8});
browserErrors.push(...checkPlaywrightReport(studio,{label:'Studio',minTests:8}));
if(browserErrors.length)fail(browserErrors.join(' | '));
const coverage=coverageFor(report,'core.description-list');
if(!coverage.passed||coverage.behaviorCount!==8||!coverage.previewPassed)fail('eight direct Description List browser tests are not source-backed');
const classification={unchanged:0,'maintenance-declared-theme-expansion':0,'verified-brand-host-migration':0};
for(const subject of record.subjects) {
  if(subject.id==='core.description-list') {
    if(subject.files.length!==1 || subject.files[0].sha!==git(root,'hash-object',subject.files[0].path))fail('Description List current Git implementation blob changed');
    continue;
  }
  const oldPath='evidence/public/'+subject.id+'.json';
  const bytes=await readFile(resolve(root,oldPath));
  const frozen=command('git',['-C',root,'show',DEPLOYED_IMPLEMENTATION_SHA+':'+oldPath],{encoding:'buffer'});
  if(!Buffer.from(bytes).equals(Buffer.from(frozen)))fail('historical proof record was rewritten: '+subject.id);
  if(gitBlobSha(bytes)!==subject.recordSha)fail('historical proof record blob differs from v2 anchor: '+subject.id);
  const old=JSON.parse(bytes.toString('utf8'));
  if((old.component||old.flavor)!==subject.id || old.implementationFiles.length!==subject.files.length)fail('historical proof membership mismatch for '+subject.id);
  const flavor=subject.kind==='flavor';
  const maintenance=flavor ? await json('evidence/maintenance/'+subject.id+'.json') : null;
  if(flavor) {
    const maintenancePath='evidence/maintenance/'+subject.id+'.json';
    const current=await readFile(resolve(root,maintenancePath));
    const oldFrozen=command('git',['-C',root,'show',DEPLOYED_IMPLEMENTATION_SHA+':'+maintenancePath],{encoding:'buffer'});
    if(!current.equals(Buffer.from(oldFrozen)))fail('historical Flavor maintenance was rewritten: '+subject.id);
  }
  const bindings=[];
  for(const previous of old.implementationFiles) {
    if(isAbsolute(previous.path)||previous.path.includes('..')||previous.path.includes('\\'))fail('unsafe source binding: '+previous.path);
    const b=subject.files.find(x=>x.path===previous.path);
    if(!b || b.sha!==git(root,'hash-object',previous.path))fail('current proof-bound implementation differs from verified record: '+subject.id+' '+previous.path);
    const current=await readFile(resolve(root,previous.path));
    let oldBytes=null;
    if(gitBlobSha(current)!==previous.blobSha) {
      try {oldBytes=command('git',['-C',root,'cat-file','blob',previous.blobSha],{encoding:'buffer'});}
      catch { /* historical Theme blobs may not exist: exact maintenance authority still required */ }
    }
    const item=reconcileBinding({subject:subject.id,entry:previous,current,previous:oldBytes&&Buffer.from(oldBytes),maintenance});
    if(item.classification!==b.classification || item.currentBlobSha!==b.sha)fail('Flavor/Core migration classification changed for '+subject.id+' '+previous.path);
    classification[item.classification]++;
    bindings.push(item);
  }
  if(flavor) {
    const oldR=record.flavorReconciliations.find(x=>x.subject===subject.id);
    const recalculated=validateFlavorMaintenance({subject:subject.id,record:old,maintenance,bindings,proofRecordBlobSha:gitBlobSha(bytes)});
    if(JSON.stringify(oldR)!==JSON.stringify(recalculated))fail('Flavor migration reconciliation drift: '+subject.id);
  }
}
if(JSON.stringify(classification)!==JSON.stringify(record.historical.decisions))fail('exact legacy binding decisions drifted');
for(const a of record.artifacts) {
  if(a.publishedPath.includes('..')||a.publishedPath.includes('\\')||isAbsolute(a.publishedPath))fail('unsafe published asset path');
  const path=resolve(pages,a.publishedPath);
  const bytes=await readFile(path).catch(()=>null);
  if(!bytes || sha256(bytes)!==a.pagesSha256 || a.pagesSha256!==a.liveSha256 ||
    a.liveStatus!==200)fail('published asset differs from committed 105-file live cohort: '+a.publishedPath);
}
console.log('[current-host-v2] PASS structural proof-only admission: 50 Core + five Flavors, 105 live-hash anchors, historical 54 preserved, 131 exact old bindings, eight Description List cases');
console.log('[current-host-v2] implementation='+DEPLOYED_IMPLEMENTATION_SHA+' Pages='+DEPLOYED_PAGES_SHA+' proof-only HEAD='+git(root,'rev-parse','HEAD'));
console.log('[current-host-v2] This is structural proof; use validate:proof:v2:live for fresh HTTPS byte checks.');
