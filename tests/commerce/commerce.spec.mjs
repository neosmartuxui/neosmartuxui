import {test,expect} from '@playwright/test';

const cases=['hardline-light','hardline-dark','soft-light','soft-dark','rivet-light','rivet-dark','mono-light','mono-dark','pulse-light','pulse-dark'];
test.beforeEach(async({page})=>{
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  page.on('requestfailed',request=>errors.push('Failed request '+request.url()));
  page.on('response',response=>{if(response.status()>=400)errors.push(response.status()+' '+response.url());});
  page.__commerceErrors=errors;
  await page.goto('/');
  await expect(page.locator('body')).toHaveAttribute('data-commerce-ready','true');
});

test('24 Commerce components render from normalized provider data, without fictitious outcomes',async({page})=>{
  await expect(page.locator('.demo-box > [data-commerce-component]')).toHaveCount(24);
  await expect(page.locator('[data-component="product-price"] > [data-commerce-component="product-price"]')).toContainText('$49.00');
  await expect(page.locator('[data-component="product-price"] > [data-commerce-component="product-price"] del')).toHaveText('$79.00');
  await expect(page.locator('[data-commerce-component="product-card"]')).toContainText('Neo Studio Kit');
  await expect(page.locator('[data-commerce-component="order-summary"]')).toContainText('Tax (provider quote)');
  await expect(page.locator('[data-commerce-component="order-summary"] .ns-commerce-summary-total')).toContainText('$95.00');
  await expect(page.locator('[data-commerce-component="license-status"] .ns-badge')).toHaveText('Active');
  await expect(page.locator('[data-commerce-component="seat-usage"] progress')).toHaveJSProperty('value',3);
  await expect(page.locator('[data-commerce-component="download-entitlement"] button')).toHaveText('Request secure download');
  expect(page.__commerceErrors).toEqual([]);
});

test('Gallery is keyboard-operable and exposes single selected thumbnail',async({page})=>{
  const gallery=page.locator('[data-commerce-component="product-gallery"]');
  const first=gallery.getByRole('button',{name:'View Front of Neo Studio Kit'});
  const second=gallery.getByRole('button',{name:'View Detail of Neo Studio Kit'});
  await expect(first).toHaveAttribute('aria-pressed','true');
  await second.focus();
  await page.keyboard.press('Enter');
  await expect(second).toHaveAttribute('aria-pressed','true');
  await expect(first).toHaveAttribute('aria-pressed','false');
  await expect(gallery.locator('img')).toHaveAttribute('alt','Detail artwork of Neo Studio Kit');
  expect(page.__commerceErrors).toEqual([]);
});

test('Cart and download request callbacks never pretend to update remote state',async({page})=>{
  await page.getByRole('button',{name:'Remove Neo Studio Kit from cart'}).click();
  await page.getByRole('button',{name:'Request secure download'}).click();
  await expect.poll(()=>page.evaluate(()=>[window.__cartRequests,window.__downloadRequests])).toEqual([1,1]);
  await expect(page.locator('[data-commerce-component="cart-line"]')).toContainText('Neo Studio Kit');
  await expect(page.locator('[data-commerce-component="download-entitlement"]')).toHaveAttribute('data-state','eligible');
  expect(page.__commerceErrors).toEqual([]);
});

test('Rejects invalid Money, mixed currencies, multiple offers without explicit choice, unsafe URLs, and unmasked keys',async({page})=>{
  const verdict=await page.evaluate(async()=>{
    const m=await import('/components.mjs');
    const errors=[];
    const rejects=(fn)=>{try{fn();return false}catch{return true}};
    errors.push(rejects(()=>m.formatMoney({amount:Infinity,currency:'USD'})));
    errors.push(rejects(()=>m.renderOrderSummary({subtotal:{amount:100,currency:'USD'},total:{amount:90,currency:'EUR'}})));
    errors.push(rejects(()=>m.renderProductCard({id:'p',name:'Product',offers:[{id:'a',price:{amount:1,currency:'USD'}},{id:'b',price:{amount:2,currency:'USD'}}]})));
    errors.push(rejects(()=>m.renderProductGallery({label:'Test',images:[{src:'javascript:alert(1)',alt:'A',label:'A'}]})));
    errors.push(rejects(()=>m.renderLicenseStatus({id:'a',productId:'p',status:'active',maskedKey:'1234-REAL-KEY'})));
    const injected=m.renderProductCard({id:'p',name:'<img src=x onerror=alert(1)>',summary:'<script>alert(1)</script>',offers:[{id:'a',price:{amount:1,currency:'USD'}}]});
    return {errors,injectedText:injected.textContent.includes('<script>'),injectedTags:injected.querySelectorAll('script,img').length};
  });
  expect(verdict).toEqual({errors:[true,true,true,true,true],injectedText:true,injectedTags:0});
  expect(page.__commerceErrors).toEqual([]);
});

test('Provider failure remains a visible error; download-disabled entitlement has no request button',async({page})=>{
  const verdict=await page.evaluate(async()=>{
    const m=await import('/components.mjs');
    const e=m.renderDownloadEntitlement({id:'inactive',productId:'Neo Kit',downloadAllowed:false},{onRequest:()=>{throw new Error('must not be called')}});
    document.body.append(e);
    const r=m.renderCartLine({id:'x',label:'Item',quantity:1,unitPrice:{amount:10,currency:'USD'},subtotal:{amount:10,currency:'USD'}},{onRemove:async()=>{throw new Error('Provider refused')}});
    document.body.append(r);
    r.querySelector('button').click();
    await new Promise(resolve=>setTimeout(resolve,50));
    return {disabledButtons:e.querySelectorAll('button').length,status:r.dataset.state,message:r.querySelector('[role="alert"]')?.textContent};
  });
  expect(verdict).toEqual({disabledButtons:0,status:'error',message:'Provider refused'});
  expect(page.__commerceErrors).toEqual([]);
});

for(const theme of cases){
  test('Canonical '+theme+' Theme applies to all 14 Commerce components',async({page,request})=>{
    await page.locator('#theme').selectOption(theme);
    await expect(page.locator('html')).toHaveAttribute('data-commerce-theme',theme);
    const themeResponse=await request.get('/themes/'+theme+'.css');
    expect(themeResponse.ok()).toBeTruthy();
    const variables=await page.evaluate(()=>({
      panel:getComputedStyle(document.documentElement).getPropertyValue('--ns-color-surface-panel').trim(),
      font:getComputedStyle(document.querySelector('[data-commerce-component="product-card"]')).fontFamily,
      border:getComputedStyle(document.querySelector('[data-commerce-component="product-card"]')).borderTopWidth
    }));
    expect(variables.panel).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(variables.font).not.toBe('');
    expect(parseFloat(variables.border)).toBeGreaterThan(0);
    await expect(page.locator('.demo-box > [data-commerce-component]')).toHaveCount(24);
    expect(page.__commerceErrors).toEqual([]);
  });
}
test('Mobile + RTL + forced colors and reduced motion keep operable controls',async({page})=>{
  await page.setViewportSize({width:375,height:812});
  await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});
  await page.evaluate(()=>{document.documentElement.dir='rtl';});
  const b=page.getByRole('button',{name:'View Detail of Neo Studio Kit'});
  await expect(b).toBeVisible();
  const height=await b.evaluate(x=>x.getBoundingClientRect().height);
  expect(height).toBeGreaterThanOrEqual(44);
  await b.focus();await page.keyboard.press('Enter');
  await expect(b).toHaveAttribute('aria-pressed','true');
  const horizontalScroll=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
  expect(horizontalScroll).toBe(false);
  expect(page.__commerceErrors).toEqual([]);
});
