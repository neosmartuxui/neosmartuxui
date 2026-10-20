import {readFile,access} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=resolve(import.meta.dirname,'../..');
const json=async(path)=>JSON.parse(await readFile(resolve(root,path),'utf8'));
const fail=(s)=>{throw new Error('[commerce] '+s)};
const reg=await json('packages/verticals/commerce/component-registry.json');
const core=await json('packages/core/component-registry.json');
const admission=await json('packages/verticals/commerce/source-admission.json');
const tokens=await json('spec/core/token-contracts.json');
if(reg.schema!=='neosmartuxui/commerce-component-registry@1'||reg.vertical!=='commerce')fail('Commerce registry identity');
if(reg.components.length!==24||reg.maturity!=='implemented-local'||reg.noPublicProofClaim!==true)fail('False local maturity claim');
if(core.components.length!==50||core.components.filter(x=>x.maturity==='public-proof').length!==49)fail('Core singleton changed');
if(reg.themes.length!==10||new Set(reg.themes).size!==10)fail('Expected original 10 Theme instances');
const coreIds=new Set(core.components.map(x=>x.id));
const modules=await import(pathToFileURL(resolve(root,'packages/verticals/commerce/components.mjs')).href);
const wave2=await import(pathToFileURL(resolve(root,'packages/verticals/commerce/wave2.mjs')).href);
const wave3=await import(pathToFileURL(resolve(root,'packages/verticals/commerce/wave3.mjs')).href);
const expected=new Set(['commerce.product-price','commerce.product-card','commerce.product-gallery','commerce.cart-line','commerce.order-summary','commerce.license-status','commerce.seat-usage','commerce.download-entitlement','commerce.product-detail','commerce.product-media','commerce.review-summary','commerce.license-selector','commerce.renewal-note','commerce.pricing-tier','commerce.coupon','commerce.checkout-field','commerce.invoice-details','commerce.checkout-steps','commerce.payment-method','commerce.payment-failure','commerce.payment-recovery','commerce.processing-state','commerce.order-confirmation','commerce.receipt']);
for(const c of reg.components){
  if(!expected.delete(c.id))fail('Duplicate, unexpected, or missing registry ID '+c.id);
  if(coreIds.has(c.id)||!c.id.startsWith('commerce.'))fail('Component collision with Core');
  if(typeof (c.modulePath==='wave3.mjs'?wave3:c.modulePath==='wave2.mjs'?wave2:modules)[c.module]!=='function')fail('Renderer missing for '+c.id);
  if(c.status!=='implemented-local'||!c.composesCore.every(x=>coreIds.has(x)))fail('Invalid Core usage or maturity '+c.id);
  if(!c.states.length)fail('Missing states '+c.id);
}
if(expected.size)fail('Missing '+[...expected].join(','));
if(admission.entries.length!==47||admission.counts.implementedLocal!==24||admission.counts.reusedCore!==1)fail('Original Commerce admission count drift');
const recorded=new Set();
for(const entry of admission.entries){
  if(recorded.has(entry.sourceId))fail('Duplicate source contract '+entry.sourceId);
  recorded.add(entry.sourceId);
  if(entry.state==='implemented-local'&&!reg.components.some(x=>x.sourceId===entry.sourceId&&x.id===entry.target))fail('Source admission implementation mismatch '+entry.sourceId);
  if(entry.decision==='REUSE_CORE'&&!coreIds.has(entry.target))fail('Invalid Core reuse '+entry.sourceId);
}
if(admission.entries.filter(x=>x.state==='implemented-local').length!==reg.components.length)fail('False migration count');
await access(resolve(root,'packages/verticals/commerce/index.d.ts'));
await access(resolve(root,'packages/verticals/commerce/index.mjs'));
const css=await readFile(resolve(root,'packages/verticals/commerce/commerce.css'),'utf8');
const tokenIds=new Set(tokens.contracts.map(x=>'--ns-'+x.id.replaceAll('.','-')));
for(const [,variable] of css.matchAll(/var\((--ns-[a-z0-9-]+)/g)){
  if(!tokenIds.has(variable))fail('Unknown Theme token '+variable);
}
for(const theme of reg.themes){
  const bundle=await json('packages/themes/'+theme+'/tokens.json');
  if(!bundle.values.length||bundle.values.length!==55)fail('Missing or incomplete saved Theme: '+theme);
  for(const key of ['core.button','core.card','core.badge'])if(!bundle.scope.includes(key))fail('Theme missing Core '+key);
}
await access(resolve(root,'packages/verticals/commerce/README.md'));
console.log('[commerce] 24 isolated Commerce renderers / unchanged 50 Core / 10 saved Themes / existing token names PASS');
