import {test,expect} from '@playwright/test';
const blocks=['trust-strip','promo-band','testimonials','guarantee','plan-comparison','bundle-builder','account-nav'];
const templates=['license-ops-dashboard','release-operations-console'];
test.beforeEach(async({page})=>{
 page.__errors=[];
 page.on('pageerror',e=>page.__errors.push(e.message));
 page.on('console',e=>{if(e.type()==='error')page.__errors.push(e.text());});
 page.on('response',r=>{if(r.status()>=400)page.__errors.push(r.status()+' '+r.url());});
 await page.goto('/');await expect(page.locator('body')).toHaveAttribute('data-blocks-ready','true');
});
test('7 independently registered Commerce Blocks render',async({page})=>{
 await expect(page.locator('#blocks-gallery > .sample')).toHaveCount(7);
 for(const id of blocks)await expect(page.locator('[data-example="'+id+'"] > [data-block="'+id+'"]')).toHaveCount(1);
 await expect(page.locator('[data-example="trust-strip"]')).toContainText('Documented provenance');
 await expect(page.locator('[data-example="testimonials"] blockquote')).toHaveCount(2);
 await expect(page.locator('[data-example="account-nav"] [aria-current="page"]')).toHaveText('Licenses');
 expect(page.__errors).toEqual([]);
});
test('2 operational templates render on explicit Templates tab',async({page})=>{
 const tab=page.getByRole('button',{name:'Templates'});
 await tab.click();
 await expect(tab).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#blocks-gallery')).toBeHidden();
 await expect(page.locator('#templates-gallery')).toBeVisible();
 for(const id of templates)await expect(page.locator('[data-example="'+id+'"] > [data-template="'+id+'"]')).toHaveCount(1);
 const first=page.locator('[data-example="license-ops-dashboard"]');
 await expect(first).toContainText('Active licenses');
 const second=page.locator('[data-example="release-operations-console"]');
 await expect(second).toContainText('Verified artifact');
 expect(page.__errors).toEqual([]);
});
test('NeoLicenser operations template approval requires explicit callback and means no execution',async({page})=>{
 await page.getByRole('button',{name:'Templates'}).click();
 const console=page.locator('[data-example="release-operations-console"]');
 await console.getByRole('button',{name:'Approve plan'}).click();
 await expect(console.locator('[data-operations-component="agent-approval-plan"]')).toHaveAttribute('data-state','approved');
 expect(await page.evaluate(()=>window.__templateApproval)).toEqual({planId:'p',decision:'approve'});
 await expect(console).toContainText('No execution implied');
});
test('Provider offer request is not a checkout confirmation',async({page})=>{
 const promo=page.locator('[data-example="promo-band"] [data-block="promo-band"]');
 await promo.getByRole('button',{name:'Request offer'}).click();
 await expect(promo).toHaveAttribute('data-state','offer-requested');
 await expect(promo).toContainText('Checkout totals are not yet confirmed');
 expect(await page.evaluate(()=>window.__promo)).toBe(true);
});
test('Plan comparison fires selection only, no payment',async({page})=>{
 const comparison=page.locator('[data-example="plan-comparison"]');
 await comparison.getByRole('button',{name:'Choose Team'}).click();
 expect(await page.evaluate(()=>window.__planSelection)).toBe('team');
 await expect(comparison).toContainText('$129.00');
 await expect(comparison).not.toContainText('Payment completed');
});
test('Bundle builder requires provider quote and exact item selection',async({page})=>{
 const e=page.locator('[data-example="bundle-builder"] [data-block="bundle-builder"]');
 await e.getByRole('button',{name:'Request bundle quote'}).click();
 await expect(e).toHaveAttribute('data-state','quoted');
 await expect(e).toContainText('$49.00');
 expect(await page.evaluate(()=>window.__bundleRequest)).toEqual(['studio']);
 await e.getByRole('checkbox',{name:'Commerce Plugin'}).check();
 await e.getByRole('button',{name:'Request bundle quote'}).click();
 await expect(e).toContainText('$89.00');
 expect(await page.evaluate(()=>window.__bundleRequest)).toEqual(['commerce','studio']);
});
test('Forged bundle price for wrong item selection is rejected',async({page})=>{
 const rejected=await page.evaluate(async()=>{
  const m=await import('/blocks/commerce/index.mjs');
  const x=m.renderBundleBuilder({heading:'Kit',items:[{id:'a',label:'A'},{id:'b',label:'B'}],selection:['a']},{onQuote:async()=>({status:'quoted',itemIds:['b'],total:{amount:1,currency:'USD'}})});
  document.body.append(x);x.querySelector('button').click();await new Promise(ok=>setTimeout(ok,40));
  return {state:x.dataset.state,note:x.textContent.includes('No price was assumed.')};
 });
 expect(rejected).toEqual({state:'error',note:true});
});
test('Untrusted testimonial and policy content remains literal text, not HTML',async({page})=>{
 const verdict=await page.evaluate(async()=>{
  const m=await import('/blocks/commerce/index.mjs');
  const t=m.renderTestimonials({heading:'Reviews',items:[{author:'<script>alert(1)</script>',quote:'<img src=x onerror=alert(1)>'}]});
  const g=m.renderGuarantee({heading:'Policy',terms:'<svg onload=alert(1)>'});
  const bad=fn=>{try{fn();return false}catch{return true}};
  return {injected:!!t.querySelector('script,img')||!!g.querySelector('svg'),literal:t.textContent.includes('<img src=')&&g.textContent.includes('<svg '),forbidden:bad(()=>m.renderGuarantee({heading:'Policy',terms:'Some terms',policyUrl:'javascript:alert(1)'}))};
 });
 expect(verdict).toEqual({injected:false,literal:true,forbidden:true});
 expect(page.__errors).toEqual([]);
});
test('Blocks reject duplicate plans, duplicate navigation and empty trust statements',async({page})=>{
 const verdict=await page.evaluate(async()=>{
  const m=await import('/blocks/commerce/index.mjs');
  const bad=fn=>{try{fn();return false}catch{return true}};
  return [
   bad(()=>m.renderTrustStrip({items:[]})),
   bad(()=>m.renderAccountNav({items:[{id:'a',label:'A',href:'./'},{id:'a',label:'B',href:'./'}]})),
   bad(()=>m.renderPlanComparison({heading:'Compare',plans:[{id:'a',name:'A',price:{amount:1,currency:'USD'},features:[]},{id:'a',name:'B',price:{amount:2,currency:'USD'},features:[]}]})),
   bad(()=>m.renderBundleBuilder({heading:'B',items:[{id:'a',label:'A'}],selection:['missing']}))
  ];
 });
 expect(verdict).toEqual([true,true,true,true]);
});
for(const theme of ['hardline-light','hardline-dark','soft-light','soft-dark','rivet-light','rivet-dark','mono-light','mono-dark','pulse-light','pulse-dark']){
 test('7 Blocks and 2 Templates share '+theme+' canonical Theme',async({page})=>{
   await page.locator('#theme').selectOption(theme);
   await expect(page.locator('html')).toHaveAttribute('data-blocks-theme',theme);
   for(const id of blocks){
     const item=page.locator('[data-example="'+id+'"] > [data-block="'+id+'"]');
     await expect(item).toHaveCount(1);
     expect(await item.evaluate(x=>parseFloat(getComputedStyle(x).borderTopWidth))).toBeGreaterThan(0);
   }
   await page.getByRole('button',{name:'Templates'}).click();
   for(const id of templates){
     const item=page.locator('[data-example="'+id+'"] > [data-template="'+id+'"]');
     await expect(item).toBeVisible();
   }
   expect(page.__errors).toEqual([]);
 });
}
test('Small-screen RTL, forced-colors, reduced-motion and switching between tabs remain usable',async({page})=>{
 await page.setViewportSize({width:375,height:812});
 await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});
 await page.evaluate(()=>document.documentElement.dir='rtl');
 const tabs=page.getByRole('button',{name:'Templates'});
 await tabs.focus();await page.keyboard.press('Enter');
 await expect(page.locator('#templates-gallery')).toBeVisible();
 await page.getByRole('button',{name:'Blocks',exact:true}).click();
 await expect(page.locator('#blocks-gallery')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
 expect(page.__errors).toEqual([]);
});
