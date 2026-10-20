import { test, expect } from '@playwright/test';

const route = '/flavors/pulse/';

const state = async (locator) => locator.evaluate((element) => {
  const styles = getComputedStyle(element);
  const transform = styles.transform === 'none' ? null : new DOMMatrixReadOnly(styles.transform);
  const rect = element.getBoundingClientRect();
  return {
    x: transform?.m41 ?? 0, y: transform?.m42 ?? 0, color: styles.color, backgroundColor: styles.backgroundColor,
    borderRadius: styles.borderRadius, borderWidth: styles.borderWidth, boxShadow: styles.boxShadow,
    outlineWidth: styles.outlineWidth, transitionDuration: styles.transitionDuration,
    minHeight: Number.parseFloat(styles.minHeight), width: rect.width, height: rect.height,
    tabIndex: element.tabIndex, direction: styles.direction
  };
});
const documentBox = async (locator) => locator.evaluate((element) => {
  const rect = element.getBoundingClientRect();
  return { x: rect.x + window.scrollX, y: rect.y + window.scrollY, width: rect.width, height: rect.height };
});

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('console',(message)=>{ if (message.type()==='error') errors.push(message.text()); });
  page.on('pageerror',(error)=>errors.push(error.message));
  await page.goto(route);
  await expect(page.locator('h1')).toHaveText('Pulse Light');
  await expect(page.locator('#pulse-dark-title')).toHaveText('Pulse Dark');
  await expect(page.locator('#pulse-dark-foundry')).toHaveClass(/ns-theme-pulse-dark/);
  expect(errors).toEqual([]);
});

test('Pulse Dark is directly authored and preserves Pulse geometry/pressure through shared adapters', async ({ page, request }) => {
  const cssResponse=await request.get('/pulse-dark-theme.css'); expect(cssResponse.ok()).toBeTruthy();
  const css=await cssResponse.text();
  for(const marker of ['.ns-theme-pulse-dark {','--ns-color-surface-interactive: #171821;','--ns-color-surface-panel: #20222d;','--ns-color-action-primary-surface: #9b8cff;','--ns-color-focus-ring: #b8a8ff;','--ns-radius-control: 4px;','--ns-radius-surface: 6px;']) expect(css).toContain(marker);
  const button=page.locator('#pulse-dark-button'), input=page.locator('#pulse-dark-input'), card=page.locator('#pulse-dark-card'), badge=page.locator('#pulse-dark-badge-info');
  await expect(button).toHaveClass('ns-button'); await expect(input).toHaveClass('ns-input'); await expect(card).toHaveClass('ns-card'); await expect(badge).toHaveClass('ns-badge');
  expect((await state(button)).borderRadius).toBe('4px'); expect((await state(card)).borderRadius).toBe('6px'); expect((await state(button)).borderWidth).toBe('2px'); expect((await state(button)).minHeight).toBeGreaterThanOrEqual(44);
  expect((await state(button)).boxShadow).toContain('4px 4px');
});

test('Pulse Dark preserves coherent 4→2→0 depth and 0→2→4 inward travel', async ({ page }) => {
  const button=page.locator('#pulse-dark-button');
  const rest=await state(button); expect(rest.x).toBeCloseTo(0,1); expect(rest.y).toBeCloseTo(0,1); expect(rest.boxShadow).toContain('4px 4px');
  await button.hover(); await page.waitForTimeout(160);
  const hover=await state(button); expect(hover.x).toBeCloseTo(2,1); expect(hover.y).toBeCloseTo(2,1); expect(hover.boxShadow).toContain('2px 2px');
  const box=await button.boundingBox(); if(!box) throw new Error('Pulse Dark button has no bounding box');
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2); await page.mouse.down(); await page.waitForTimeout(80);
  const pressed=await state(button); expect(pressed.x).toBeCloseTo(4,1); expect(pressed.y).toBeCloseTo(4,1); await page.mouse.up();
});

test('Pulse Dark keeps editable/static surfaces stable', async ({ page }) => {
  const input=page.locator('#pulse-dark-input'), card=page.locator('#pulse-dark-card'), badge=page.locator('#pulse-dark-badge-info');
  expect((await state(card)).tabIndex).toBe(-1); expect((await state(badge)).tabIndex).toBe(-1);
  const ib=await documentBox(input), cb=await documentBox(card); await input.hover(); await card.hover(); await page.waitForTimeout(160);
  const ia=await documentBox(input), ca=await documentBox(card);
  expect(ia.x).toBeCloseTo(ib.x,1); expect(ia.y).toBeCloseTo(ib.y,1); expect(ca.x).toBeCloseTo(cb.x,1); expect(ca.y).toBeCloseTo(cb.y,1);
});

test('Pulse Dark reduced motion, forced colors and keyboard order remain accessible', async ({ page }) => {
  await page.emulateMedia({reducedMotion:'reduce'}); await page.goto(route);
  const button=page.locator('#pulse-dark-button'); expect(Number.parseFloat((await state(button)).transitionDuration)).toBeLessThanOrEqual(0.002);
  await button.hover(); await expect.poll(async()=>{const s=await state(button);return [Number(s.x.toFixed(3)),Number(s.y.toFixed(3))];},{timeout:500}).toEqual([2,2]);
  await page.emulateMedia({reducedMotion:'no-preference',forcedColors:'active'}); await page.goto(route);
  await page.keyboard.press('Tab');
  // Light controls precede Dark controls; focus the Dark button directly for forced-color visibility.
  await page.locator('#pulse-dark-button').focus();
  expect(Number.parseFloat((await state(page.locator('#pulse-dark-button'))).outlineWidth)).toBeGreaterThanOrEqual(3);
  await page.locator('#pulse-dark-input').focus();
  expect(Number.parseFloat((await state(page.locator('#pulse-dark-input'))).borderWidth)).toBeGreaterThanOrEqual(1);
});

test('Pulse Dark preserves RTL and long localized content without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({width:375,height:900}); await page.goto(route);
  await page.evaluate(()=>{document.documentElement.dir='rtl';});
  await page.locator('#pulse-dark-localized-copy').evaluate((element)=>{element.textContent='واجهة منتج كثيفة وطويلة للغاية يجب أن تلتف داخل سطح بالس الداكن من دون أي تجاوز أفقي حتى مع اتجاه القراءة من اليمين إلى اليسار وتسميات تشغيلية مطولة للاختبار.';});
  expect((await state(page.locator('#pulse-dark-button'))).direction).toBe('rtl'); expect((await state(page.locator('#pulse-dark-input'))).direction).toBe('rtl');
  const metrics=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth})); expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth+1);
  const card=await documentBox(page.locator('#pulse-dark-card')); expect(card.width).toBeLessThanOrEqual(375);
});
