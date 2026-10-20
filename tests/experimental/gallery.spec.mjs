import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{
 page.__errors=[];
 page.on('pageerror',e=>page.__errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')page.__errors.push(m.text())});
 page.on('response',r=>{if(r.status()>=400)page.__errors.push(r.status()+' '+r.url())});
});
test('Experimental landing page is distinct from production and loads 56 entries',async({page})=>{
 await page.goto('/');
 await expect(page.locator('body')).toHaveAttribute('data-experimental-ready','true');
 await expect(page.getByRole('heading',{name:/UI components/})).toBeVisible();
 await expect(page.locator('#results article')).toHaveCount(56);
 await expect(page.locator('#result-count')).toContainText('56 of 56');
 await expect(page.locator('.masthead')).toContainText('Not production-admitted');
 await expect(page.locator('.lede')).toContainText('synthetic fixture data');
 expect(page.__errors).toEqual([]);
});
test('Categories are correct and only one maturity is listed',async({page})=>{
 await page.goto('/');
 const cases={'Commerce components':35,'Operations components':12,'Commerce blocks':7,'Operational templates':2};
 for(const [category,total] of Object.entries(cases)){
  await page.locator('#category').selectOption(category);
  await expect(page.locator('#results article')).toHaveCount(total);
 }
 await page.locator('#category').selectOption('all');
 await expect(page.locator('.item-state')).toHaveCount(56);
 const labels=await page.locator('.item-state').allTextContents();
 expect(new Set(labels)).toEqual(new Set(['EXPERIMENTAL']));
});
test('Search narrows results without HTML injection',async({page})=>{
 await page.goto('/');
 await page.getByRole('searchbox',{name:'Search components'}).fill('subscription');
 const count=await page.locator('#results article').count();
 expect(count).toBeGreaterThan(0);
 expect(count).toBeLessThan(56);
 await page.getByRole('searchbox',{name:'Search components'}).fill('<script>alert(1)</script>');
 await expect(page.locator('#results article')).toHaveCount(0);
 expect(await page.locator('script').count()).toBe(1);
 expect(page.__errors).toEqual([]);
});
test('Ten canonical themes are propagated to all three demos',async({page})=>{
 await page.goto('/');
 await expect(page.locator('#theme option')).toHaveCount(10);
 await page.locator('#theme').selectOption('soft-dark');
 for(const id of ['commerce','operations','blocks'])await expect(page.locator('#'+id+'-link')).toHaveAttribute('href','./'+id+'/?theme=soft-dark');
 const target=page.locator('.result-card').filter({has:page.getByRole('heading',{name:'operations.usage-chart',exact:true})});
 await expect(target.getByRole('link')).toHaveAttribute('href','./operations/?theme=soft-dark');
 await target.getByRole('link').click();
 await expect(page.locator('body')).toHaveAttribute('data-ops-ready','true');
 await expect(page.locator('html')).toHaveAttribute('data-ops-theme','soft-dark');
 await expect(page.getByRole('note')).toContainText('No real payments');
 expect(page.__errors).toEqual([]);
});
test('Commerce preview uses mock data and cannot execute a real payment',async({page})=>{
 await page.goto('/commerce/');
 await expect(page.getByRole('note')).toContainText('simulated callbacks');
 await expect(page.getByRole('note')).toContainText('No real payments');
 await expect(page.locator('body')).toHaveAttribute('data-commerce-ready','true');
 await expect(page.locator('.demo-box > [data-commerce-component]')).toHaveCount(35);
 await expect(page.locator('[data-component="plan-change"] button').first()).toBeVisible();
 expect(page.__errors).toEqual([]);
});
test('Operations preview shows agent approval is fixture-only',async({page})=>{
 await page.goto('/operations/');
 const panel=page.locator('[data-example="agent-approval-plan"]');
 await panel.getByRole('button',{name:'Approve plan'}).click();
 await expect(panel.locator('[data-operations-component="agent-approval-plan"]')).toHaveAttribute('data-state','approved');
 await expect(page.getByRole('note')).toContainText('No real payments');
 await expect(panel).toContainText('No execution implied');
 expect(page.__errors).toEqual([]);
});
test('Blocks and templates remain separate categories in experimental demo',async({page})=>{
 await page.goto('/blocks/');
 await expect(page.getByRole('note')).toContainText('Synthetic');
 await expect(page.locator('#blocks-gallery [data-block]')).toHaveCount(7);
 await page.getByRole('button',{name:'Templates'}).click();
 await expect(page.locator('#templates-gallery [data-template]')).toHaveCount(2);
 expect(page.__errors).toEqual([]);
});
test('Artifact manifest is pinned and records only static experimental files',async({page})=>{
 await page.goto('/');
 const man=await page.request.get('/artifact-manifest.json');
 expect(man.ok()).toBe(true);
 const j=await man.json();
 expect(j.scope).toBe('public-experimental-demo-only');
 expect(j.productionReady).toBe(false);
 expect(j.privatePackageIncluded).toBe(false);
 expect(j.files.length).toBe(63);
 expect(j.counts.total).toBe(56);
 const cat=await page.request.get('/catalog.json');
 const data=await cat.json();
 expect(data.providerIntegrations).toBe(false);
 expect(data.fixtureData).toBe(true);
 expect(j.sourceSha).toBe(data.sourceSha);
});
test('Keyboard mobile RTL forced colors and reduced motion remain usable',async({page})=>{
 await page.setViewportSize({width:375,height:812});
 await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});
 await page.goto('/');
 await page.evaluate(()=>document.documentElement.dir='rtl');
 await page.getByRole('searchbox',{name:'Search components'}).fill('webhook');
 await expect(page.locator('#results article')).toHaveCount(1);
 await page.getByRole('searchbox',{name:'Search components'}).focus();
 await expect(page.getByRole('searchbox',{name:'Search components'})).toBeFocused();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
 expect(page.__errors).toEqual([]);
});
