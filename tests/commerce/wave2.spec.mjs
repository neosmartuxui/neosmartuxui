import {test,expect} from '@playwright/test';

test.beforeEach(async({page})=>{
  page.__errors=[];
  page.on('pageerror',e=>page.__errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')page.__errors.push(m.text())});
  page.on('response',res=>{if(res.status()>=400)page.__errors.push(String(res.status())+' '+res.url())});
  await page.goto('/');
  await expect(page.locator('body')).toHaveAttribute('data-commerce-ready','true');
});

test('Wave 2 renders six separate catalog and offer components',async({page})=>{
  for(const id of ['product-detail','product-media','review-summary','license-selector','renewal-note','pricing-tier'])
    await expect(page.locator('[data-component="'+id+'"] > [data-commerce-component="'+id+'"]')).toHaveCount(1);
  await expect(page.locator('[data-component="product-detail"]')).toContainText('Neo Studio Kit');
  await expect(page.locator('[data-component="review-summary"]')).toContainText('129 reviews');
  await expect(page.locator('[data-component="renewal-note"]')).toContainText('provider terms');
  await expect(page.locator('[data-component="pricing-tier"]')).toContainText('$129.00');
  expect(page.__errors).toEqual([]);
});

test('Product media switches code/files/preview using correct ARIA semantics',async({page})=>{
  const group=page.locator('[data-component="product-media"]');
  const preview=group.getByRole('tab',{name:'Preview'});
  const code=group.getByRole('tab',{name:'Code'});
  const files=group.getByRole('tab',{name:'Files'});
  await expect(preview).toHaveAttribute('aria-selected','true');
  await preview.focus();
  await page.keyboard.press('ArrowRight');
  await expect(code).toHaveAttribute('aria-selected','true');
  await expect(code).toBeFocused();
  await expect(group.getByRole('tabpanel')).toContainText('renderProductCard');
  await page.keyboard.press('End');
  await expect(files).toHaveAttribute('aria-selected','true');
  await expect(group.getByRole('tabpanel')).toContainText('manifest.json');
  await page.keyboard.press('Home');
  await expect(preview).toHaveAttribute('aria-selected','true');
  await expect(group.getByRole('tabpanel').locator('img')).toHaveAttribute('alt','Neo Studio Kit artwork');
  expect(page.__errors).toEqual([]);
});

test('License option selection remains explicit and emits caller callback',async({page})=>{
  const component=page.locator('[data-component="license-selector"]');
  const team=component.getByRole('radio',{name:/Team/});
  const solo=component.getByRole('radio',{name:/Individual/});
  await expect(team).not.toBeChecked();
  await team.check();
  await expect(team).toBeChecked();
  await expect.poll(()=>page.evaluate(()=>window.__selectedLicense)).toBe('team');
  await solo.check();
  await expect.poll(()=>page.evaluate(()=>window.__selectedLicense)).toBe('solo');
  expect(page.__errors).toEqual([]);
});

test('Tier callback runs without claiming a checkout succeeded',async({page})=>{
  const tier=page.locator('[data-component="pricing-tier"]');
  await tier.getByRole('button',{name:'Select Team plan'}).click();
  await expect.poll(()=>page.evaluate(()=>window.__requestedTier)).toBe('team');
  await expect(tier.locator('[data-commerce-component="pricing-tier"]')).toHaveAttribute('data-state','rest');
  await expect(tier).not.toContainText('Payment complete');
  expect(page.__errors).toEqual([]);
});

test('Rejects malicious URLs, ambiguous offers, missing reviews and invalid product input',async({page})=>{
  const result=await page.evaluate(async()=>{
    const m=await import('/wave2.mjs');
    const rejects=fn=>{try{fn();return false}catch{return true}};
    const money={amount:5,currency:'USD'};
    const offers=[{id:'a',label:'A',price:money},{id:'b',label:'B',price:money}];
    const checks=[
      rejects(()=>m.renderProductDetail({id:'x',name:'X',offers})),
      rejects(()=>m.renderProductDetail({id:'x',name:'X',offers:[{id:'a',label:'A',price:money}],image:{src:'javascript:alert(1)',alt:'x'}})),
      rejects(()=>m.renderProductMedia({label:'X',code:'',files:[]})),
      rejects(()=>m.renderReviewSummary({rating:6,count:10})),
      rejects(()=>m.renderReviewSummary({rating:4,count:-1})),
      rejects(()=>m.renderLicenseSelector({offers:[...offers,offers[0]]})),
      rejects(()=>m.renderRenewalNote({message:'ok',policyUrl:'data:text/html,hack'})),
      rejects(()=>m.renderPricingTier({id:'a',label:'A',price:money,features:['', 'Safe']}))
    ];
    const card=m.renderProductDetail({id:'x',name:'<script>alert(1)</script>',description:'<img src=x onerror=alert(1)>',offers:[offers[0]]});
    return {checks,hasInjected:card.querySelector('script,img')!==null,text:card.textContent.includes('<script>')};
  });
  expect(result.checks).toEqual([true,true,true,true,true,true,true,true]);
  expect(result.hasInjected).toBe(false);
  expect(result.text).toBe(true);
  expect(page.__errors).toEqual([]);
});

test('Provider failures expose errors, and buttons without providers cannot act',async({page})=>{
  const result=await page.evaluate(async()=>{
    const m=await import('/wave2.mjs');
    const money={amount:19,currency:'USD'};
    const p=m.renderPricingTier({id:'pro',label:'Pro',price:money},{onSelect:async()=>{throw new Error('Provider unavailable')}});
    document.body.append(p);
    p.querySelector('button').click();
    await new Promise(resolve=>setTimeout(resolve,40));
    const disabled=m.renderPricingTier({id:'pro',label:'Pro',price:money});
    return {state:p.dataset.state,alert:p.querySelector('[role=alert]')?.textContent,disabled:disabled.querySelector('button').disabled};
  });
  expect(result).toEqual({state:'error',alert:'Provider unavailable',disabled:true});
  expect(page.__errors).toEqual([]);
});

for(const theme of ['hardline-light','hardline-dark','soft-light','soft-dark','rivet-light','rivet-dark','mono-light','mono-dark','pulse-light','pulse-dark']){
 test('Wave 2 six components retain token styling under '+theme,async({page})=>{
   await page.locator('#theme').selectOption(theme);
   await expect(page.locator('html')).toHaveAttribute('data-commerce-theme',theme);
   for(const id of ['product-detail','product-media','review-summary','license-selector','renewal-note','pricing-tier']){
     const e=page.locator('[data-component="'+id+'"] > [data-commerce-component="'+id+'"]');
     await expect(e).toBeVisible();
     const border=await e.evaluate(x=>parseFloat(getComputedStyle(x).borderTopWidth));
     expect(border).toBeGreaterThan(0);
   }
   expect(page.__errors).toEqual([]);
 });
}


test('Wave 2 controls remain operable on narrow RTL, high-contrast, reduced-motion display',async({page})=>{
  await page.setViewportSize({width:375,height:812});
  await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});
  await page.evaluate(()=>{document.documentElement.dir='rtl';});
  const tabs=page.locator('[data-component="product-media"] [role=tab]');
  await tabs.nth(0).focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected','true');
  const radio=page.locator('[data-component="license-selector"] input[type=radio]').nth(1);
  await radio.check();
  await expect.poll(()=>page.evaluate(()=>window.__selectedLicense)).toBe('team');
  await expect(page.locator('[data-component="pricing-tier"] button')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
  expect(page.__errors).toEqual([]);
});
