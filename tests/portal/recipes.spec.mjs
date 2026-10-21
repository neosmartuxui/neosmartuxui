import {test,expect} from '@playwright/test';
const core='/components/core/';
const goto=async(page,id)=>{await page.goto(core+id+'/');await expect(page.locator('body')).toHaveAttribute('data-explorer-ready','true');};
const click=async(page,id)=>page.locator('#recipe-controls button[data-recipe-id="'+id+'"]').click();
test.beforeEach(async({page})=>{
 page.__errors=[];
 page.on('pageerror',e=>page.__errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)page.__errors.push('HTTP '+r.status()+' '+r.url())});
});
test('Agent contract lists 106 source-bound capabilities without inventing production status',async({page})=>{
 const api=await (await page.request.get('/components/agent-index.json')).json();
 const details=await (await page.request.get('/components/details.json')).json();
 expect(api.schema).toBe('neosmartuxui/agent-capabilities@1');
 expect(api.sourceSha).toBe(details.sourceSha);
 expect(api.productionPackageReleased).toBe(false);
 expect(api.items).toHaveLength(106);
 expect(new Set(api.items.map(x=>x.id)).size).toBe(106);
 expect(api.items.filter(x=>x.controlAvailability==='source-verified')).toHaveLength(14);
 for(const item of api.items){
  expect(item.documentationOnly).toBe(true);
  expect(item.productionIntegration).toBe(false);
  expect(item.route).toBe(details.items.find(x=>x.id===item.id).route);
  expect(item.states.length).toBeGreaterThan(0);
  expect(item.sourceUrl).toContain(api.sourceSha);
  expect(item.controlAvailability==='source-verified'||item.controls.length===0).toBe(true);
  if(item.kind==='Core'){expect(item.contractUrl).toContain('components/');expect(item.dependencies.length).toBeGreaterThan(0);}
  else{expect(item.maturity).toBe('Experimental');}
 }
});
test('No invented controls for unsupported Core or any experimental entry',async({page})=>{
 for(const path of ['/components/core/description-list/','/components/commerce/plan-change/','/components/operations/agent-approval-plan/','/components/block/trust-strip/']){
  await page.goto(path);
  await expect(page.locator('#recipe-controls')).toHaveCount(0);
  await expect(page.locator('.detail-primary .detail-context').filter({hasText:'not exposed'})).toContainText('not exposed');
 }
 await expect(page.locator('.detail-head')).toContainText('Experimental');
});
test('Core Button uses the native disabled flag and canonical aria-disabled style',async({page})=>{
 await goto(page,'button');
 const button=page.frameLocator('#actual-demo').locator('section[aria-labelledby="button-slice"] .ns-button');
 await expect(button).toBeVisible();
 await expect(page.locator('.recipe-markup')).toContainText('ns-button');
 await click(page,'disabled');
 await expect(button).toBeDisabled();
 await expect(button).toHaveAttribute('aria-disabled','true');
 await click(page,'enabled');
 await expect(button).toBeEnabled();
 await expect(button).not.toHaveAttribute('aria-disabled','true');
 expect(page.__errors).toEqual([]);
});
test('Checkbox checked, mixed and unchecked states use real native input and adapter sync',async({page})=>{
 await goto(page,'checkbox');
 const checkbox=page.frameLocator('#actual-demo').locator('#checkbox-demo');
 await click(page,'checked');
 await expect(checkbox).toBeChecked();
 await expect(checkbox).toHaveAttribute('data-state','checked');
 await click(page,'mixed');
 await expect(checkbox).toHaveAttribute('data-state','indeterminate');
 expect(await checkbox.evaluate(e=>e.indeterminate)).toBe(true);
 await click(page,'unchecked');
 await expect(checkbox).not.toBeChecked();
 await expect(checkbox).toHaveAttribute('data-state','unchecked');
 expect(await checkbox.evaluate(e=>e.indeterminate)).toBe(false);
 expect(page.__errors).toEqual([]);
});
test('Switch uses actual native role and adapter authority, never invents indeterminate',async({page})=>{
 await goto(page,'switch');
 const sw=page.frameLocator('#actual-demo').locator('#switch-demo');
 await expect(page.locator('#recipe-controls button')).toHaveCount(2);
 await click(page,'on');
 await expect(sw).toHaveAttribute('data-state','on');
 await expect(sw).toBeChecked();
 await click(page,'off');
 await expect(sw).toHaveAttribute('data-state','off');
 await expect(sw).not.toBeChecked();
 expect(page.__errors).toEqual([]);
});
for(const [name,selector,payload] of [
 ['input','#input-demo','Keyboard-authored text'],
 ['textarea','#textarea-demo','Line one\nLine two']
]){
 test('Native '+name+' property editor updates actual Foundry element, clear restores empty',async({page})=>{
  await goto(page,name);
  await page.locator('[data-recipe-field="value"]').fill(payload);
  await click(page,'value');
  const target=page.frameLocator('#actual-demo').locator(selector);
  await expect(target).toHaveValue(payload);
  await click(page,'clear');
  await expect(target).toHaveValue('');
  expect(page.__errors).toEqual([]);
 });
}
test('Native Select invokes real change option instead of mimicking popup',async({page})=>{
 await goto(page,'select');
 const select=page.frameLocator('#actual-demo').locator('#select-demo');
 await click(page,'gamma');
 await expect(select).toHaveValue('gamma');
 await click(page,'beta');
 await expect(select).toHaveValue('beta');
 expect(page.__errors).toEqual([]);
});
test('Badge controller presents existing tone-labelled fixture, no fake alert',async({page})=>{
 await goto(page,'badge');
 await click(page,'success');
 await expect(page.locator('#recipe-feedback')).toContainText('real success badge specimen');
 const badge=page.frameLocator('#actual-demo').locator('#badge-success');
 await expect(badge).toHaveAttribute('data-tone','success');
 await expect(badge).toContainText('Success');
 expect(page.__errors).toEqual([]);
});
test('Slider uses native input events and updates the real adapter output',async({page})=>{
 await goto(page,'slider');
 const input=page.frameLocator('#actual-demo').locator('#slider-input');
 const output=page.frameLocator('#actual-demo').locator('[data-slider-output="value"]');
 await click(page,'high');
 await expect(input).toHaveValue('75');
 await expect(output).toHaveText('75');
 await click(page,'low');
 await expect(input).toHaveValue('25');
 await expect(output).toHaveText('25');
 expect(page.__errors).toEqual([]);
});
test('Tabs controls click actual tab and invoke its real panel controller',async({page})=>{
 await goto(page,'tabs');
 const frame=page.frameLocator('#actual-demo');
 const details=frame.locator('#tab-auto-details');
 const overview=frame.locator('#tab-auto-overview');
 await click(page,'details');
 await expect(details).toHaveAttribute('aria-selected','true');
 await expect(overview).toHaveAttribute('aria-selected','false');
 await expect(frame.locator('#panel-auto-details')).toBeVisible();
 await click(page,'overview');
 await expect(overview).toHaveAttribute('aria-selected','true');
 expect(page.__errors).toEqual([]);
});
test('Recipes, source snippets and agent index are accessible without page overflow on mobile RTL',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.emulateMedia({reducedMotion:'reduce',forcedColors:'active'});
 await goto(page,'checkbox');
 await page.evaluate(()=>document.documentElement.dir='rtl');
 await page.locator('button[data-recipe-id="mixed"]').focus();
 await page.keyboard.press('Enter');
 await expect(page.frameLocator('#actual-demo').locator('#checkbox-demo')).toHaveAttribute('data-state','indeterminate');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
 await expect(page.getByRole('link',{name:/Agent capability index/})).toHaveAttribute('href','/components/agent-index.json');
 expect(page.__errors).toEqual([]);
});
