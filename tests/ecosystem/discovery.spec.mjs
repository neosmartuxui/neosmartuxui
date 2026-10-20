import {test,expect} from '@playwright/test';
const foundry='http://127.0.0.1:4173';
const studio='http://127.0.0.1:4174';
test('Foundry has a local catalog entry while original 50-Core proof section remains',async({page})=>{
 await page.goto(foundry+'/');
 await expect(page.locator('[data-local-ecosystem="true"]')).toBeVisible();
 await expect(page.locator('[data-local-ecosystem="true"]')).toContainText('Not public proof');
 await expect(page.getByRole('link',{name:'Browse the local unified catalog and themed previews'})).toHaveAttribute('href','./ecosystem/index.html');
 await expect(page.getByRole('heading',{name:/Built for humans/})).toBeVisible();
});
test('Studio discovers the unified catalog without replacing its shipping Core editor',async({page})=>{
 await page.goto(studio+'/');
 await expect(page.locator('[data-local-ecosystem="true"]')).toBeVisible();
 await expect(page.getByRole('combobox',{name:'Shipping Core component'})).toBeVisible();
 await expect(page.getByRole('combobox',{name:'Official Theme'})).toBeVisible();
 await expect(page.locator('[data-local-ecosystem="true"] a')).toHaveAttribute('href','./ecosystem/index.html');
});
for(const [name,host] of [['Foundry',foundry],['Studio',studio]]){
 test(name+' unified catalog searches all 106 registrations and differentiates maturity',async({page})=>{
  await page.goto(host+'/ecosystem/');
  await expect(page.locator('body')).toHaveAttribute('data-ecosystem-ready','true');
  await expect(page.locator('#count')).toContainText('106 matching catalog entries');
  await expect(page.locator('.item')).toHaveCount(106);
  await expect(page.getByText('97 implemented component entries',{exact:false})).toHaveCount(1);
  await expect(page.locator('.item').filter({hasText:'operations.agent-approval-plan'})).toContainText('implemented-local');
  const entry=page.locator('.item').filter({has:page.getByRole('heading',{name:'core.button',exact:true})});
  await expect(entry).toContainText('Core component');
  await page.getByRole('searchbox',{name:'Search'}).fill('license');
  const after=await page.locator('.item').count();
  expect(after).toBeGreaterThan(0);
  expect(after).toBeLessThan(106);
  await page.getByRole('searchbox',{name:'Search'}).fill('');
  await page.getByRole('combobox',{name:'Category'}).selectOption('Commerce block');
  await expect(page.locator('.item')).toHaveCount(7);
 });
 test(name+' displays ten canonical themes and opens each lab with selected theme',async({page})=>{
  await page.goto(host+'/ecosystem/');
  await expect(page.locator('#theme option')).toHaveCount(10);
  await page.getByRole('combobox',{name:'Saved theme'}).selectOption('soft-dark');
  await page.getByRole('button',{name:'Show themed labs'}).click();
  const nav=page.getByRole('navigation',{name:'Local theme preview routes'});
  await expect(nav.getByRole('link')).toHaveCount(3);
  await expect(nav.getByRole('link',{name:/Open operations lab/})).toHaveAttribute('href','./operations/index.html?theme=soft-dark');
  await nav.getByRole('link',{name:/Open operations lab/}).click();
  await expect(page.locator('body')).toHaveAttribute('data-ops-ready','true');
  await expect(page.locator('html')).toHaveAttribute('data-ops-theme','soft-dark');
 });
}
test('Browsing a Commerce catalog entry resolves to a working local Commerce lab',async({page})=>{
 await page.goto(foundry+'/ecosystem/');
 const item=page.locator('.item').filter({hasText:'commerce.license-card'});
 await expect(item).toHaveCount(1);
 await item.getByRole('link',{name:'Open local preview'}).click();
 await expect(page.locator('body')).toHaveAttribute('data-commerce-ready','true');
 await expect(page.locator('[data-component="license-card"] > [data-commerce-component="license-card"]')).toHaveCount(1);
});
test('Blocks and templates are separately discoverable and interactive',async({page})=>{
 await page.goto(foundry+'/ecosystem/');
 await page.getByRole('combobox',{name:'Category'}).selectOption('Operations template');
 await expect(page.locator('.item')).toHaveCount(2);
 await page.locator('.item').first().getByRole('link',{name:'Open local preview'}).click();
 await expect(page.locator('body')).toHaveAttribute('data-blocks-ready','true');
 await page.getByRole('button',{name:'Templates'}).click();
 await expect(page.locator('#templates-gallery [data-template]')).toHaveCount(2);
});
test('Mobile and RTL retain readable search and navigation',async({page})=>{
 await page.setViewportSize({width:375,height:812});
 await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});
 await page.goto(studio+'/ecosystem/');
 await page.evaluate(()=>document.documentElement.dir='rtl');
 await page.getByRole('searchbox',{name:'Search'}).fill('webhook');
 await expect(page.locator('.item')).toHaveCount(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
});
