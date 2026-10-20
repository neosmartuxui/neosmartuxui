import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const tokens=JSON.parse(await readFile('packages/themes/hardline-light/tokens.json','utf8')).values;
const value=id=>tokens.find(t=>t.id===id)?.value;
const physical=async locator=>locator.evaluate(el=>{
 const cs=getComputedStyle(el),r=el.getBoundingClientRect();
 return {transform:cs.transform,shadow:cs.boxShadow,duration:cs.transitionDuration,easing:cs.transitionTimingFunction,
  x:r.x,y:r.y,outline:cs.outlineWidth,border:cs.borderRadius,bg:cs.backgroundColor};
});
const px=(s)=>Number.parseFloat(s);
const expectedDepth=(state)=>Number.parseFloat(value('depth.'+state+'.x'));
const time=async page=>page.waitForTimeout(155);
test('Hardline portal pressure values are derived from the canonical Theme, not arbitrary CSS',async({page})=>{
 await page.goto('/');
 const values=await page.evaluate(()=>Object.fromEntries(['depth-rest-x','depth-hover-x','depth-active-x','press-hover-x','press-active-x',
  'motion-press-duration','motion-release-duration','focus-width','focus-offset','pressure-radius','control-minimum']
  .map(k=>[k,getComputedStyle(document.documentElement).getPropertyValue('--portal-'+k).trim()])));
 for(const [key,role] of [
  ['depth-rest-x','depth.rest.x'],['depth-hover-x','depth.hover.x'],['depth-active-x','depth.active.x'],
  ['press-hover-x','press.hover.x'],['press-active-x','press.active.x'],['motion-press-duration','motion.press.duration'],
  ['motion-release-duration','motion.release.duration'],['focus-width','focus.ring.width'],
  ['focus-offset','focus.ring.offset'],['pressure-radius','radius.control'],['control-minimum','size.control.minimum']
 ])expect(values[key],key).toBe(value(role));
 await expect(page.locator('body')).toHaveAttribute('data-portal-ready','true');
});
test('Hero button compresses 4→2→0 shadow and travels 0→2→4 on press, then releases',async({page})=>{
 await page.goto('/');
 const button=page.getByRole('link',{name:/Explore components/}).first();
 const rest=await physical(button);
 expect(rest.shadow).toContain('4px 4px');
 expect(rest.transform).toBe('matrix(1, 0, 0, 1, 0, 0)');
 const center=await button.boundingBox();
 await page.mouse.move(center.x+center.width/2,center.y+center.height/2);await time(page);
 const hover=await physical(button);
 expect(Math.round(hover.x-rest.x)).toBe(2);
 expect(Math.round(hover.y-rest.y)).toBe(2);
 expect(hover.shadow).toContain('2px 2px');
 await page.evaluate(()=>document.querySelector('.hero-actions .btn-primary').addEventListener('click',e=>e.preventDefault(),{once:true}));
 await page.mouse.down();await time(page);
 const pressed=await physical(button);
 expect(Math.round(pressed.x-rest.x)).toBe(4);
 expect(Math.round(pressed.y-rest.y)).toBe(4);
 expect(pressed.shadow==='none'||pressed.shadow.includes('0px 0px 0px')).toBe(true);
 await page.mouse.up();await time(page);
 const releasedHover=await physical(button);
 expect(Math.round(releasedHover.x-rest.x)).toBe(2);
 await page.mouse.move(0,0);await time(page);
 const reset=await physical(button);
 expect(Math.round(reset.x-rest.x)).toBe(0);
 expect(reset.shadow).toContain('4px 4px');
});
test('Whole interactive category tiles press inward, never elevate, and retain real link destinations',async({page})=>{
 await page.goto('/');
 const tile=page.locator('a.tile').first();
 await tile.scrollIntoViewIfNeeded();await page.mouse.move(0,0);await time(page);
 const rest=await physical(tile);expect(rest.shadow).toContain('4px 4px');
 await tile.hover();await time(page);
 const hover=await physical(tile);
 expect(Math.round(hover.y-rest.y)).toBe(2);
 expect(hover.shadow).toContain('2px 2px');
 await page.evaluate(()=>document.querySelector('a.tile').addEventListener('click',e=>e.preventDefault(),{once:true}));
 await page.mouse.down();await time(page);
 const pressed=await physical(tile);
 expect(Math.round(pressed.y-rest.y)).toBe(4);
 expect(pressed.shadow==='none'||pressed.shadow.includes('0px 0px 0px')).toBe(true);
 await page.mouse.up();
 expect(await tile.getAttribute('href')).toBe('/components/?type=Core');
});
test('Workspace route cards themselves are links and have a real pressure state',async({page})=>{
 await page.goto('/');
 const routes=page.locator('.route-card');
 await expect(routes).toHaveCount(6);
 const first=routes.first();
 await expect(first).toHaveAttribute('href','/components/');
 const rest=await physical(first);
 await first.hover();await time(page);
 const hover=await physical(first);
 expect(Math.round(hover.x-rest.x)).toBe(2);
 expect(hover.shadow).toContain('2px 2px');
 await first.click();
 await expect(page).toHaveURL(/\/components\/$/);
});
test('Static illustrations and informational catalog cards never pretend to be pressable',async({page})=>{
 await page.goto('/');
 const illustration=page.locator('.preview-shell');
 const initial=await physical(illustration);
 await illustration.hover();await time(page);
 const hovered=await physical(illustration);
 expect(hovered.transform).toBe(initial.transform);
 expect(hovered.shadow).toBe(initial.shadow);
 await page.goto('/components/');
 const entry=page.locator('.entry').first();
 const stable=await physical(entry);
 await entry.hover();await time(page);
 const hoveredEntry=await physical(entry);
 expect(hoveredEntry.transform).toBe(stable.transform);
 expect(hoveredEntry.shadow).toBe(stable.shadow);
 const actualLink=entry.locator('a');
 const rest=await physical(actualLink);expect(rest.shadow).toContain('4px 4px');
 await actualLink.hover();await time(page);
 expect(Math.round((await physical(actualLink)).y-rest.y)).toBe(2);
});
test('Keyboard provides separate focus keyline and native pressed feedback on menu button',async({page})=>{
 await page.setViewportSize({width:390,height:812});await page.goto('/');
 const menu=page.locator('#menu-toggle');
 await menu.focus();
 const focus=await physical(menu);
 expect(focus.outline).toBe(value('focus.ring.width'));
 const rest=await physical(menu);
 await page.keyboard.down('Space');await time(page);
 const pressed=await physical(menu);
 expect(Math.round(pressed.y-rest.y)).toBe(4);
 expect(pressed.shadow==='none'||pressed.shadow.includes('0px 0px 0px')).toBe(true);
 await page.keyboard.up('Space');
 await expect(menu).toHaveAttribute('aria-expanded','true');
 await page.keyboard.press('Escape');
 await expect(menu).toHaveAttribute('aria-expanded','false');
});
test('Touch activates the entire tactile tile; no hover required',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:812},isMobile:true,hasTouch:true});
 const page=await context.newPage();
 await page.goto('/');
 const tile=page.locator('a.tile').first();
 await tile.tap();
 await expect(page).toHaveURL(/\/components\/\?type=Core$/);
 await context.close();
});
test('Reduced motion retains immediate pressed state and forced-colors preserves focus semantics',async({page})=>{
 await page.setViewportSize({width:390,height:812});
 await page.emulateMedia({reducedMotion:'reduce',forcedColors:'active'});
 await page.goto('/');
 const menu=page.locator('#menu-toggle');
 await menu.focus();
 const cs=await physical(menu);
 expect(cs.outline).toBe('3px');
 expect(cs.duration).toContain('0.001s');
 await page.keyboard.down('Space');
 const pressed=await physical(menu);
 expect(pressed.transform).not.toBe('none');
 expect(pressed.shadow==='none'||pressed.shadow.includes('0px 0px 0px')).toBe(true);
 await page.keyboard.up('Space');
});
