import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { gitBlobSha } from './flavor-reconciliation.mjs';
import { chromium } from '@playwright/test';
import { sha256, PROOF_HOST, SOURCE_REPOSITORY, PAGES_REPOSITORY } from './current-host-contract.mjs';
import { enumerateFoundry, checkWholeFoundryParity } from './foundry-asset-map.mjs';
import { verifyEntireCohortCoverage } from './cohort-coverage.mjs';

const root=resolve(import.meta.dirname,'../..');
const pages=process.env.NEOSMARTUXUI_PAGES_CHECKOUT || resolve(dirname(root),'neosmartuxui.github.io');
const git=(dir,...args)=>execFileSync('git',['-C',dir,...args],{encoding:'utf8',timeout:20000}).trim();
const readJson=async path=>JSON.parse(await readFile(path,'utf8'));
const fail=(message)=>{throw new Error('[cohort-verify] '+message)};
const sourceSha=git(root,'rev-parse','HEAD');
const candidate=await readJson(resolve(root,'artifacts/proof/current-host-cohort-candidate.json'));
const preflight=await readJson(resolve(root,'artifacts/proof/current-host-preflight.json'));
if(candidate.schema!=='neosmartuxui/proof-cohort-candidate@1' ||
   candidate.status!=='UNVERIFIED-CANDIDATE-NOT-PUBLIC-PROOF' ||
   candidate.source.sha!==sourceSha || candidate.counts.total!==54 ||
   candidate.counts.core!==49 || candidate.counts.flavors!==5 ||
   candidate.subjects.length!==54 || candidate.flavorReconciliations.length!==5) {
  fail('incomplete or stale 49 Core + five Flavor cohort candidate');
}
const registry=await readJson(resolve(root,'packages/core/component-registry.json'));
const expectedCore=registry.components.filter(c=>c.maturity==='public-proof').map(c=>c.id);
const expectedFlavor=['hardline','soft','rivet','mono','pulse'].map(x=>'flavor.'+x);
const cohortIds=candidate.subjects.map(s=>s.id);
if(expectedCore.length!==49 || JSON.stringify([...expectedCore,...expectedFlavor].sort())!==JSON.stringify(cohortIds.sort())) {
  fail('cohort membership must match exactly 49 canonical public-proof Core plus five official Flavors');
}
if(registry.components.find(x=>x.id==='core.description-list')?.maturity!=='implemented') {
  fail('cannot reuse this pre-promotion cohort gate after Description List maturity changes');
}
if(candidate.counts.classifications.unchanged!==101 ||
   candidate.counts.classifications['maintenance-declared-theme-expansion']!==20 ||
   candidate.counts.classifications['verified-brand-host-migration']!==10) {
  fail('unreviewed binding classification drift');
}
if(preflight.source.sha!==sourceSha || preflight.pages.sha!==git(pages,'rev-parse','HEAD') ||
   preflight.verdict.readyForCandidate!==true ||
   preflight.verdict.problems.length!==0) {
  fail('separately verified exact-source merged-main current-host preflight required');
}
const digest='sha256:'+createHash('sha256').update(JSON.stringify(candidate.subjects)).digest('hex');
if(candidate.evidence.cohortDigest!==digest)fail('candidate subject set changed after historical anchor verification');
for(const subject of candidate.subjects) {
  const historicBytes=await readFile(resolve(root,subject.historical.recordPath));
  if(gitBlobSha(historicBytes)!==subject.historical.recordBlobSha)fail('historical proof anchor changed: '+subject.id);
  const legacy=JSON.parse(historicBytes.toString('utf8'));
  if((legacy.component||legacy.flavor)!==subject.id || legacy.implementationFiles.length!==subject.bindings.length)fail('historic proof subject mismatch: '+subject.id);
  for(const binding of subject.bindings){
    const expected=legacy.implementationFiles.find(x=>x.path===binding.path);
    if(!expected || expected.blobSha!==binding.historicalBlobSha)fail('historic implementation binding mismatch: '+subject.id+' '+binding.path);
    const local=await readFile(resolve(root,binding.path));
    if(gitBlobSha(local)!==binding.currentBlobSha)fail('current implementation binding mismatch: '+subject.id+' '+binding.path);
  }
}
const qa=await readJson(resolve(root,'artifacts/proof/local-qa-attestation.json'));
const foundryBytes=await readFile(resolve(root,'artifacts/browser/report.json'));
const studioBytes=await readFile(resolve(root,'artifacts/studio/report.json'));
if(qa.sourceSha!==sourceSha || candidate.evidence.browserReportSha256!==sha256(foundryBytes) || sha256(foundryBytes)!==qa.foundryReportSha256 ||
   sha256(studioBytes)!==qa.studioReportSha256) fail('exact-source Chromium report digests differ from local QA attestation');
const report=JSON.parse(foundryBytes.toString('utf8'));
const coverage=verifyEntireCohortCoverage(report,candidate.subjects);
if(!coverage.passed || !candidate.evidence.cohortBrowserCoverageComplete) {
  fail('one or more of 54 subjects lacks direct source-test coverage');
}
const declared=await enumerateFoundry(root);
const checked=[];
const retry=async(url)=>{const result=await fetch(url,{signal:AbortSignal.timeout(15000),
  headers:{'cache-control':'no-cache'}});return {status:result.status, bytes:Buffer.from(await result.arrayBuffer())}};
for(let i=0;i<declared.length;i+=8){
  const chunk=await Promise.all(declared.slice(i,i+8).map(async(item)=>{
    const [local,published,live]=await Promise.all([
      readFile(resolve(root,item.generatedPath)),
      readFile(resolve(pages,item.publishedPath)).catch(()=>null),
      retry(item.url).catch(()=>({status:0,bytes:null}))
    ]);
    return {...item,localSha256:sha256(local),
      pagesSha256:published?sha256(published):null,
      liveSha256:live.bytes?sha256(live.bytes):null,
      liveStatus:live.status};
  }));
  checked.push(...chunk);
}
const parity=checkWholeFoundryParity(checked,declared);
if(parity.length) fail('complete Foundry parity failed: '+parity.slice(0,12).join(' | '));

const browser=await chromium.launch({channel:process.env.NEOSMARTUXUI_BROWSER_CHANNEL || 'chrome',headless:true});
let browserResults=[];
try {
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text())});
  const foundryResponse=await page.goto(PROOF_HOST+'/foundry/',{waitUntil:'domcontentloaded'});
  if(foundryResponse?.status()!==200) fail('live Foundry browser route is unavailable');
  for(const subject of candidate.subjects.filter(x=>x.kind==='core')){
    const liveMarker=await page.evaluate(id=>document.body.textContent.includes(id),subject.id);
    browserResults.push({subject:subject.id,url:PROOF_HOST+'/foundry/',found:true,liveMarker});
  }
  for(const subject of candidate.subjects.filter(x=>x.kind==='flavor')){
    const flavor=subject.id.slice('flavor.'.length);
    const response=await page.goto(PROOF_HOST+'/flavors/'+flavor+'/',{waitUntil:'domcontentloaded'});
    const details=await page.locator('main').first().evaluate(el=>({
      theme:el.classList.contains('ns-theme-'+flavor+'-light'),
      title:el.querySelector('h1')?.textContent?.trim()||null
    })).catch(()=>({theme:false,title:null}));
    browserResults.push({subject:subject.id,url:PROOF_HOST+'/flavors/'+flavor+'/',
      found:response?.status()===200&&details.theme,title:details.title});
  }
  if(browserResults.length!==54 || browserResults.some(x=>!x.found || ('liveMarker' in x && !x.liveMarker)) || errors.length) {
    fail('live browser subjects/console check failed: '+JSON.stringify({failed:browserResults.filter(x=>!x.found||x.liveMarker===false),errors}));
  }
} finally {await browser.close();}
const liveVerified={
 schema:'neosmartuxui/current-host-cohort-verification@1',
 status:'LIVE_EVIDENCE_VERIFIED_PENDING_PROOF_ONLY_PROMOTION',
 source:{repository:SOURCE_REPOSITORY,sha:sourceSha,treeSha:git(root,'rev-parse','HEAD^{tree}')},
 pages:{repository:PAGES_REPOSITORY,sha:git(pages,'rev-parse','HEAD'),treeSha:git(pages,'rev-parse','HEAD^{tree}')},
 attestation:{sha256:sha256(Buffer.from(JSON.stringify(qa))),reportSha256:qa.foundryReportSha256,
   studioReportSha256:qa.studioReportSha256},
 candidateDigest:candidate.evidence.cohortDigest,
 subjects:candidate.subjects.map(x=>({id:x.id,kind:x.kind,recordSha:x.historical.recordBlobSha,
   files:x.bindings.map(b=>({path:b.path,sha:b.currentBlobSha,classification:b.classification}))})),
 flavorReconciliations:candidate.flavorReconciliations,
 coverage:coverage.coverage,artifacts:checked,live:browserResults,
 verifiedAt:new Date().toISOString()
};
const out=resolve(root,'artifacts/proof/current-host-cohort-verified.json');
await mkdir(dirname(out),{recursive:true});
await writeFile(out,JSON.stringify(liveVerified,null,2)+'\n');
console.log(`[cohort-verify] live + source + Pages parity PASS: ${checked.length} exact files, ${browserResults.length} subject markers, five Light Flavor pages`);
console.log('[cohort-verify] PENDING proof-only promotion; historical proofs unchanged: '+out);
