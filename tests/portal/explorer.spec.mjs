import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{
 page.__errors=[];
 page.on('pageerror',e=>page.__errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)page.__errors.push(r.status()+' '+r.url())});
});
test('Explorer has 106 stable pages, unique routes and canonical source references',async({page})=>{
 const response=await page.request.get('/components/details.json');
 expect(response.ok()).toBe(true);
 const data=await response.json();
 expect(data.schema).toBe('neosmartuxui/component-details@1');
 expect(data.items).toHaveLength(106);
 expect(new Set(data.items.map(x=>x.route)).size).toBe(106);
 const tally={Core:50,Commerce:35,Operations:12,Block:7,Template:2};
 for(const [kind,n] of Object.entries(tally))expect(data.items.filter(x=>x.kind===kind)).toHaveLength(n);
 for(const item of data.items){
  expect(item.sourceUrl).toContain('https://github.com/neosmartuxui/neosmartuxui/blob/');
  expect(item.sourceUrl).toContain('/'+data.sourceSha+'/');
  expect(item.code.length).toBeGreaterThan(10);
  expect(item.states.length).toBeGreaterThan(0);
  expect(item.route).toMatch(/^\/components\/(core|commerce|operations|block|template)\/[a-z0-9-]+\/$/);
  expect((await page.request.get(item.route)).status(),item.route).toBe(200);
 }
});
test('Search results point to individual detail pages, not generic labs',async({page})=>{
 await page.goto('/components/');
 await expect(page.locator('.entry')).toHaveCount(106);
 const core=page.locator('.entry').filter({has:page.getByRole('heading',{name:'core.button',exact:true})});
 await expect(core.locator('a')).toHaveAttribute('href','/components/core/button/');
 const commerce=page.locator('.entry').filter({has:page.getByRole('heading',{name:'commerce.plan-change',exact:true})});
 await expect(commerce.locator('a')).toHaveAttribute('href','/components/commerce/plan-change/');
 const operations=page.locator('.entry').filter({has:page.getByRole('heading',{name:'operations.agent-approval-plan',exact:true})});
 await expect(operations.locator('a')).toHaveAttribute('href','/components/operations/agent-approval-plan/');
 await core.locator('a').click();
 await expect(page).toHaveURL(/\/components\/core\/button\/$/);
 await expect(page.locator('body')).toHaveAttribute('data-explorer-ready','true');
 expect(page.__errors).toEqual([]);
});
test('Core button detail is derived from actual contract, adapter and Foundry proof',async({page})=>{
 await page.goto('/components/core/button/');
 await expect(page.getByRole('heading',{level:1})).toHaveText('core.button');
 await expect(page.locator('.detail-head')).toContainText('Public proof');
 await expect(page.locator('.detail-intent')).toContainText('Trigger an immediate user action.');
 await expect(page.locator('.detail-chips').first()).toContainText('pressed');
 await expect(page.locator('.detail-chips').first()).toContainText('focus-visible');
 await expect(page.locator('#source-code')).toContainText('bindAsyncButton');
 await expect(page.locator('.detail-theme-note')).toContainText('Studio');
 const iframe=page.frameLocator('#actual-demo');
 await expect(iframe.locator('#button-slice')).toHaveCount(1);
 await expect(iframe.locator('.ns-button').first()).toBeVisible();
 const source=page.locator('.detail-head-actions .btn-primary');
 await expect(source).toHaveAttribute('href',/packages\/adapters\/web\/components\/button\.mjs/);
 expect(page.__errors).toEqual([]);
});
test('Core DescriptionList maturity is not promoted through documentation',async({page})=>{
 await page.goto('/components/core/description-list/');
 await expect(page.locator('.detail-head')).toContainText('Implemented');
 await expect(page.locator('.detail-head')).not.toContainText('Public proof');
 await expect(page.locator('.detail-chips').first()).toHaveText('rest');
 const contract=page.getByRole('link',{name:'Canonical JSON'});
 await expect(contract).toHaveCount(1);
});
test('Experimental Commerce plan-change detail displays actual preview and remains simulated',async({page})=>{
 await page.goto('/components/commerce/plan-change/');
 await expect(page.locator('.detail-head')).toContainText('Experimental');
 await expect(page.locator('.detail-context').first()).toContainText('synthetic records');
 const frame=page.frameLocator('#actual-demo');
 await expect(frame.locator('body')).toHaveAttribute('data-commerce-ready','true');
 await expect(frame.locator('[data-component="plan-change"]')).toHaveCount(1);
 await expect(page.locator('#source-code')).toContainText('renderPlanChange');
 await page.locator('#preview-theme').selectOption('soft-dark');
 await expect(page.locator('#actual-demo')).toHaveAttribute('src','/labs/experimental/commerce/?theme=soft-dark');
 await expect(frame.locator('html')).toHaveAttribute('data-commerce-theme','soft-dark');
 expect(page.__errors).toEqual([]);
});
test('Operations agent approval embeds the actual demo and does not perform agent execution',async({page})=>{
 await page.goto('/components/operations/agent-approval-plan/');
 const frame=page.frameLocator('#actual-demo');
 await expect(frame.locator('body')).toHaveAttribute('data-ops-ready','true');
 await expect(frame.locator('[data-example="agent-approval-plan"]')).toHaveCount(1);
 await expect(frame.locator('[data-example="agent-approval-plan"]')).toContainText('Approve plan');
 await expect(page.locator('#source-code')).toContainText('renderAgentApprovalPlan');
 await expect(page.locator('.detail-head')).toContainText('Experimental');
});
test('Blocks and Templates use the real Blocks lab and toggle to template view',async({page})=>{
 await page.goto('/components/block/trust-strip/');
 let frame=page.frameLocator('#actual-demo');
 await expect(frame.locator('[data-example="trust-strip"]')).toHaveCount(1);
 await page.goto('/components/template/license-ops-dashboard/');
 frame=page.frameLocator('#actual-demo');
 await expect(frame.locator('[data-example="license-ops-dashboard"]')).toBeVisible();
 await expect(frame.locator('#templates-gallery')).toBeVisible();
});
test('Viewport controls use tactile buttons and preserve the live component frame',async({page})=>{
 await page.goto('/components/operations/stat-card/');
 await page.locator('[data-width="mobile"]').click();
 await expect(page.locator('.detail-viewport')).toHaveAttribute('data-width','mobile');
 await expect(page.locator('button[data-width="mobile"]')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('button[data-width="desktop"]')).toHaveAttribute('aria-pressed','false');
 const width=await page.locator('#actual-demo').evaluate(el=>el.getBoundingClientRect().width);
 expect(width).toBeLessThanOrEqual(376);
 await page.locator('[data-width="desktop"]').click();
 await expect(page.locator('.detail-viewport')).toHaveAttribute('data-width','desktop');
});
test('Source excerpt is literal escaped text; related navigation is populated',async({page})=>{
 await page.goto('/components/core/button/');
 await expect(page.locator('#source-code')).toContainText('export function');
 await expect(page.locator('#related-links a').first()).toHaveAttribute('href',/^\/components\/core\//);
 await expect(page.locator('code[id="source-code"] script')).toHaveCount(0);
});
test('Explorer is responsive and keyboard accessible under reduced motion and forced colors',async({page})=>{
 await page.setViewportSize({width:390,height:850});
 await page.emulateMedia({reducedMotion:'reduce',forcedColors:'active'});
 await page.goto('/components/core/button/');
 await expect(page.locator('body')).toHaveAttribute('data-explorer-ready','true');
 await page.locator('button[data-width="mobile"]').focus();
 await page.keyboard.press('Enter');
 await expect(page.locator('button[data-width="mobile"]')).toHaveAttribute('aria-pressed','true');
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
 expect(overflow).toBe(false);
 expect(page.__errors).toEqual([]);
});
