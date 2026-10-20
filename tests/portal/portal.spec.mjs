import {test,expect} from '@playwright/test';
const sections=['/','/components/','/themes/','/blocks/','/templates/','/labs/','/flavors/','/docs/'];
const links={'Components':'/components/','Themes':'/themes/','Blocks':'/blocks/','Templates':'/templates/','Labs':'/labs/','Docs':'/docs/'};
test.beforeEach(async({page})=>{
 page.__errors=[];
 page.on('pageerror',e=>page.__errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')page.__errors.push(m.text())});
 page.on('response',r=>{if(r.status()>=400)page.__errors.push(r.status()+' '+r.url())});
});
test('Premium landing page has a clear hierarchy, visual preview and accurate inventory',async({page})=>{
 const response=await page.goto('/');
 expect(response.status()).toBe(200);
 await expect(page.locator('body')).toHaveAttribute('data-portal-ready','true');
 await expect(page.getByRole('heading',{level:1})).toContainText('One system.');
 await expect(page.getByRole('heading',{level:1})).toContainText('Every interface.');
 await expect(page.locator('.hero-art [role=img]')).toBeVisible();
 await expect(page.getByRole('link',{name:/Explore components/}).first()).toHaveAttribute('href','/components/');
 await expect(page.locator('.hero-note')).toContainText('50');
 await expect(page.locator('.hero-note')).toContainText('47');
 await expect(page.locator('.hero-note')).toContainText('10');
 expect(page.__errors).toEqual([]);
});
test('All primary destinations are linked and accessible',async({page})=>{
 await page.goto('/');
 const nav=page.getByRole('navigation',{name:'Main navigation'});
 for(const [label,href] of Object.entries(links))await expect(nav.getByRole('link',{name:label,exact:true})).toHaveAttribute('href',href);
 await expect(page.getByRole('link',{name:/Open Studio/}).first()).toHaveAttribute('href','/studio/');
 await expect(page.locator('footer a[href="/foundry/"]')).toHaveCount(1);
 const unique=new Set(await page.locator('a[href^="/"]').evaluateAll(all=>all.map(a=>a.getAttribute('href').split('?')[0].split('#')[0])));
 for(const href of unique){if(!href)continue;const reply=await page.request.get(href);expect(reply.status(),href).toBe(200);}
 expect(page.__errors).toEqual([]);
});
for(const path of sections){
 test('Portal section '+path+' is a well-formed page with shared navigation',async({page})=>{
  const response=await page.goto(path);expect(response.status()).toBe(200);
  await expect(page.locator('body')).toHaveAttribute('data-portal-ready','true');
  await expect(page.locator('header .brand')).toBeVisible();
  await expect(page.getByRole('navigation',{name:'Main navigation'})).toBeVisible();
  await expect(page.locator('footer')).toBeVisible();
  expect(await page.locator('h1').count()).toBe(1);
  expect(page.__errors).toEqual([]);
 });
}
test('Components directory indexes exactly 106, searches and filters all five families',async({page})=>{
 await page.goto('/components/');
 await expect(page.locator('#catalog-results .entry')).toHaveCount(106);
 await expect(page.locator('#catalog-count')).toContainText('106 / 106');
 const counts={Core:50,Commerce:35,Operations:12,Block:7,Template:2};
 for(const [name,count] of Object.entries(counts)){
  await page.locator('#component-category').selectOption(name);
  await expect(page.locator('#catalog-results .entry')).toHaveCount(count);
 }
 await page.locator('#component-category').selectOption('all');
 await page.getByRole('searchbox',{name:'SEARCH COMPONENTS'}).fill('agent');
 const found=await page.locator('#catalog-results .entry').count();
 expect(found).toBeGreaterThan(0);expect(found).toBeLessThan(106);
 await page.getByRole('searchbox',{name:'SEARCH COMPONENTS'}).fill('<script>alert(1)</script>');
 await expect(page.locator('#catalog-results .entry')).toHaveCount(0);
 expect(await page.locator('script').count()).toBe(1);
 expect(page.__errors).toEqual([]);
});
test('Deep links from the landing page preselect the expected domain',async({page})=>{
 await page.goto('/components/?type=Operations');
 await expect(page.locator('#component-category')).toHaveValue('Operations');
 await expect(page.locator('#catalog-results .entry')).toHaveCount(12);
});
test('Core catalog uses genuine Foundry links, experimental uses safe preview routes',async({page})=>{
 await page.goto('/components/');
 const core=page.locator('.entry').filter({has:page.getByRole('heading',{name:'core.button',exact:true})});
 await expect(core).toContainText('Core');
 await expect(core.locator('a')).toHaveAttribute('href','/foundry/#button-slice');
 const ops=page.locator('.entry').filter({has:page.getByRole('heading',{name:'operations.agent-approval-plan',exact:true})});
 await expect(ops).toContainText('Experimental');
 await expect(ops.locator('a')).toHaveAttribute('href','/labs/experimental/operations/');
 const response=await page.request.get('/foundry/');
 expect(response.status()).toBe(200);
});
test('Theme directory displays ten saved variants linked to five existing flavors',async({page})=>{
 await page.goto('/themes/');
 await expect(page.locator('.theme-card')).toHaveCount(10);
 for(const name of ['hardline','soft','mono','rivet','pulse'])
  await expect(page.locator('.theme-card a[href="/flavors/'+name+'/"]')).toHaveCount(2);
 expect(page.__errors).toEqual([]);
});
test('Existing Foundry, Studio and experimental previews survive relocation',async({page})=>{
 for(const path of ['/foundry/','/studio/','/labs/experimental/','/flavors/hardline/']){
  const response=await page.goto(path,{waitUntil:'domcontentloaded'});
  expect(response.status(),path).toBe(200);
 }
 await page.goto('/foundry/',{waitUntil:'networkidle'});
 await expect(page.locator('#button-slice')).toHaveCount(1);
 await expect(page.locator('base')).toHaveAttribute('href','/');
 const legacy=await page.request.get('/foundry/deployment.json');
 const metadata=await legacy.json();
 expect(metadata.sourceSha).toBe('ff6897eb0db5d86ab28847b91bac76af26416891');
 const portal=(await (await page.request.get('/deployment.json')).json());
 expect(portal.artifact).toBe('portal');
 const manifest=(await (await page.request.get('/portal-manifest.json')).json());
 expect(portal.sourceSha).toBe(manifest.sourceSha);
 expect(portal.sourceSha).toMatch(/^(local-unpinned|[0-9a-f]{40})$/);
 expect(page.__errors).toEqual([]);
});
test('Mobile menu is keyboard operable, closes on escape and keeps links',async({page})=>{
 await page.setViewportSize({width:375,height:812});
 await page.goto('/');
 const toggle=page.locator('#menu-toggle');
 await expect(toggle).toBeVisible();
 await expect(toggle).toHaveAttribute('aria-expanded','false');
 await toggle.focus();await page.keyboard.press('Enter');
 await expect(toggle).toHaveAttribute('aria-expanded','true');
 await expect(page.getByRole('navigation',{name:'Main navigation'})).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(toggle).toHaveAttribute('aria-expanded','false');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
 expect(page.__errors).toEqual([]);
});
test('Accessibility mode, RTL and reduced motion are usable without horizontal overflow',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.emulateMedia({reducedMotion:'reduce',forcedColors:'active'});
 await page.goto('/components/');
 await page.evaluate(()=>document.documentElement.dir='rtl');
 await expect(page.getByRole('link',{name:'Skip to content'})).toHaveAttribute('href','#main');
 await page.getByRole('searchbox',{name:'SEARCH COMPONENTS'}).fill('license');
 expect(await page.locator('.entry').count()).toBeGreaterThan(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
 expect(page.__errors).toEqual([]);
});

test('Historical Foundry fragment links continue resolving after the homepage move',async({page})=>{
 await page.goto('/#button-slice');
 await page.waitForURL('**/foundry/#button-slice');
 await expect(page.locator('#button-slice')).toHaveCount(1);
 await page.goto('/#principles');
 await page.waitForURL('**/foundry/#principles');
 await expect(page.locator('#principles')).toHaveCount(1);
});
