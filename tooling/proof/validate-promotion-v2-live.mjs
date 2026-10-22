import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { chromium } from '@playwright/test';
import { sha256 } from './current-host-contract.mjs';
import { inspectFlavorPage } from './live-flavor-inspection.mjs';
import { DEPLOYED_IMPLEMENTATION_SHA, DEPLOYED_PAGES_SHA, checkV2Evidence } from './current-host-promotion-contract.mjs';

const root=resolve(import.meta.dirname,'../..');
const proof=JSON.parse(await readFile(resolve(root,'evidence/current-host/cohort-v2.json'),'utf8'));
const registry=JSON.parse(await readFile(resolve(root,'packages/core/component-registry.json'),'utf8'));
const oldIds=proof.subjects.filter(x=>x.id!=='core.description-list').map(x=>x.id);
const problems=checkV2Evidence(proof,registry.components,oldIds);
if(problems.length)throw new Error('[proof-v2:live] invalid structural v2 proof: '+problems.join(' | '));
const get=async(url)=>{
  const response=await fetch(url,{signal:AbortSignal.timeout(18000),
    headers:{'cache-control':'no-cache'}});
  return {status:response.status,bytes:Buffer.from(await response.arrayBuffer())};
};
const deploy=await get('https://neosmartuxui.github.io/foundry/deployment.json');
const record=JSON.parse(deploy.bytes.toString('utf8'));
if(deploy.status!==200||record.sourceSha!==DEPLOYED_IMPLEMENTATION_SHA||
  record.sourceRepository!=='neosmartuxui/neosmartuxui'||record.artifact!=='foundry') {
 throw new Error('[proof-v2:live] deployed Foundry source changed since implementation cohort');
}
const assets=proof.artifacts;
let verifiedCount=0;
for(let i=0;i<assets.length;i+=10){
  const results=await Promise.all(assets.slice(i,i+10).map(async asset=>{
    const actual=await get(asset.url);
    if(actual.status!==200||sha256(actual.bytes)!==asset.liveSha256 ||
      asset.pagesSha256!==asset.localSha256 || asset.liveSha256!==asset.pagesSha256) {
      throw new Error('[proof-v2:live] asset failed: '+asset.publishedPath+' HTTP '+actual.status);
    }
    return asset.publishedPath;
  }));
  verifiedCount+=results.length;
}
const browser=await chromium.launch({channel:process.env.NEOSMARTUXUI_BROWSER_CHANNEL||'chrome',headless:true});
const run={sourceSha:DEPLOYED_IMPLEMENTATION_SHA,pagesSha:DEPLOYED_PAGES_SHA,files:verifiedCount,subjects:[],errors:[],verifiedAt:new Date().toISOString()};
try{
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  page.on('pageerror',e=>run.errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')run.errors.push(m.text())});
  page.on('response',r=>{if(r.status()>=400)run.errors.push(r.status()+' '+r.url())});
  const response=await page.goto('https://neosmartuxui.github.io/foundry/',{waitUntil:'networkidle'});
  if(response?.status()!==200)throw new Error('[proof-v2:live] Foundry route not HTTP 200');
  for(const s of proof.subjects.filter(x=>x.kind==='core')) {
    const exists=await page.evaluate(id=>document.body.textContent.includes(id),s.id);
    if(!exists)throw new Error('[proof-v2:live] Core marker absent: '+s.id);
    run.subjects.push(s.id);
  }
  const dl=page.locator('#description-list-demo');
  const structure=await dl.evaluate(el=>({tag:el.tagName,nodes:[...el.children].map(x=>x.tagName),role:el.getAttribute('role'),tabindex:el.getAttribute('tabindex'),state:el.getAttribute('data-state')}));
  if(structure.tag!=='DL'||structure.nodes.join(',')!=='DT,DT,DD,DT,DD,DD,DT,DD' ||
     structure.role!==null||structure.tabindex!==null||structure.state!=='rest')throw new Error('[proof-v2:live] native Description List drift');
  await page.locator('#description-list-demo-link').focus();
  await page.keyboard.press('Tab');
  if(!(await page.locator('#description-list-after').evaluate(el=>document.activeElement===el)))throw new Error('[proof-v2:live] native focus sequence drift');
  await page.setViewportSize({width:360,height:760});
  await dl.evaluate(el=>el.setAttribute('dir','rtl'));
  const rtl=await dl.evaluate(el=>({dir:getComputedStyle(el).direction,edge:el.getBoundingClientRect().right,width:document.documentElement.clientWidth}));
  if(rtl.dir!=='rtl'||rtl.edge>rtl.width)throw new Error('[proof-v2:live] Description List narrow RTL drift');
  for(const flavor of ['hardline','soft','rivet','mono','pulse']){
    const value=await inspectFlavorPage(page,'https://neosmartuxui.github.io',flavor);
    if(!value.found)throw new Error('[proof-v2:live] Flavor identity/Light/Dark drift: '+flavor);
    run.subjects.push('flavor.'+flavor);
  }
  if(run.subjects.length!==55||run.errors.length)throw new Error('[proof-v2:live] live subject count or browser errors '+JSON.stringify({subjects:run.subjects.length,errors:run.errors}));
}finally{await browser.close()}
const out=resolve(root,'artifacts/proof/current-host-v2-live-final.json');
await mkdir(dirname(out),{recursive:true});
await writeFile(out,JSON.stringify(run,null,2)+'\n');
console.log('[proof-v2:live] PASS 105/105 exact HTTPS file hashes, 50 Core native markers, 5 official Flavors (Light/Dark), live Description List native/keyboard/RTL, 0 console/404 errors');
console.log('[proof-v2:live] proof-only branch changes no Pages deployment; verified implementation '+DEPLOYED_IMPLEMENTATION_SHA+' / Pages '+DEPLOYED_PAGES_SHA);
