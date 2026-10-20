import { test, expect } from '@playwright/test';

const route = '/flavors/mono/';

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
const rgbChannels = (value) => {
  const match = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(value);
  if (!match) throw new Error(`Expected rgb color, got ${value}`);
  return match.slice(1,4).map(Number);
};
const expectGray = (value) => {
  const [r,g,b] = rgbChannels(value);
  expect(r).toBe(g); expect(g).toBe(b);
};

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('console',(message)=>{ if (message.type()==='error') errors.push(message.text()); });
  page.on('pageerror',(error)=>errors.push(error.message));
  await page.goto(route);
  await expect(page.locator('h1')).toHaveText('Mono Light');
  await expect(page.locator('#mono-dark-title')).toHaveText('Mono Dark');
  await expect(page.locator('#mono-dark-foundry')).toHaveClass(/ns-theme-mono-dark/);
  expect(errors).toEqual([]);
});

test('Mono Dark is an authored grayscale Theme on the same shared Core adapters', async ({ page, request }) => {
  const response=await request.get('/mono-dark-theme.css');
  expect(response.ok()).toBeTruthy();
  const css=await response.text();
  for(const marker of ['.ns-theme-mono-dark {','--ns-color-surface-interactive: #151515;','--ns-color-surface-panel: #202020;',
    '--ns-color-content-primary: #f2f2f2;','--ns-color-action-primary-surface: #f2f2f2;','--ns-color-focus-ring: #ffffff;',
    '--ns-border-control-width: 2px;','--ns-radius-control: 0px;','--ns-radius-surface: 0px;','--ns-radius-annotation: 0px;',
    '--ns-font-family-body: ui-serif, Georgia, serif;']) expect(css).toContain(marker);
  const button=page.locator('#mono-dark-button'), input=page.locator('#mono-dark-input'), card=page.locator('#mono-dark-card'), badge=page.locator('#mono-dark-badge-info');
  await expect(button).toHaveClass('ns-button'); await expect(input).toHaveClass('ns-input'); await expect(card).toHaveClass('ns-card'); await expect(badge).toHaveClass('ns-badge');
  for(const locator of [button,input,card,badge]) expect((await state(locator)).borderRadius).toBe('0px');
  expect((await state(button)).borderWidth).toBe('2px');
  expect((await state(button)).minHeight).toBeGreaterThanOrEqual(44);
  expect((await state(input)).backgroundColor).toBe('rgb(21, 21, 21)');
  expect((await state(input)).color).toBe('rgb(242, 242, 242)');
});

test('Mono Dark preserves coherent 3→1→0 depth with 0→2→3 inward travel', async ({ page }) => {
  const button=page.locator('#mono-dark-button');
  const rest=await state(button); expect(rest.x).toBeCloseTo(0,1); expect(rest.y).toBeCloseTo(0,1); expect(rest.boxShadow).toContain('3px 3px');
  await button.hover(); await page.waitForTimeout(120);
  const hover=await state(button); expect(hover.x).toBeCloseTo(2,1); expect(hover.y).toBeCloseTo(2,1); expect(hover.boxShadow).toContain('1px 1px');
  const box=await button.boundingBox(); if(!box) throw new Error('Mono Dark button has no bounding box');
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2); await page.mouse.down(); await page.waitForTimeout(80);
  const pressed=await state(button); expect(pressed.x).toBeCloseTo(3,1); expect(pressed.y).toBeCloseTo(3,1); expect(pressed.boxShadow).not.toContain('1px 1px');
  await page.mouse.up();
});

test('Mono Dark keeps editing and informational surfaces stable', async ({ page }) => {
  const input=page.locator('#mono-dark-input'), card=page.locator('#mono-dark-card'), badge=page.locator('#mono-dark-badge-info');
  expect((await state(card)).tabIndex).toBe(-1); expect((await state(badge)).tabIndex).toBe(-1);
  const inputBefore=await documentBox(input), cardBefore=await documentBox(card);
  await input.hover(); await card.hover(); await page.waitForTimeout(150);
  const inputAfter=await documentBox(input), cardAfter=await documentBox(card);
  expect(inputAfter.x).toBeCloseTo(inputBefore.x,1); expect(inputAfter.y).toBeCloseTo(inputBefore.y,1);
  expect(cardAfter.x).toBeCloseTo(cardBefore.x,1); expect(cardAfter.y).toBeCloseTo(cardBefore.y,1);
});

test('Mono Dark status surfaces stay grayscale while written labels preserve semantic meaning', async ({ page }) => {
  const cases=[['#mono-dark-badge-info',/^Info ·/],['#mono-dark-badge-success',/^Success ·/],['#mono-dark-badge-warning',/^Warning ·/],['#mono-dark-badge-error',/^Error ·/]];
  const backgrounds=[];
  for(const [selector,label] of cases){
    const badge=page.locator(selector); await expect(badge).toHaveText(label);
    const current=await state(badge); expectGray(current.backgroundColor); expectGray(current.color); backgrounds.push(current.backgroundColor);
  }
  expect(new Set(backgrounds).size).toBe(4);
  expectGray((await state(page.locator('#mono-dark-button'))).backgroundColor);
  expectGray((await state(page.locator('#mono-dark-input'))).backgroundColor);
});

test('Mono Dark reduced motion keeps pressure feedback immediate without losing state', async ({ page }) => {
  await page.emulateMedia({ reducedMotion:'reduce' }); await page.goto(route);
  const button=page.locator('#mono-dark-button');
  expect(Number.parseFloat((await state(button)).transitionDuration)).toBeLessThanOrEqual(0.002);
  await button.hover();
  await expect.poll(async()=>{ const current=await state(button); return [Number(current.x.toFixed(3)),Number(current.y.toFixed(3))]; },{timeout:500}).toEqual([2,2]);
});

test('Mono Dark forced colors preserves focus, boundaries, and normal document Tab order', async ({ page }) => {
  await page.emulateMedia({ forcedColors:'active' }); await page.goto(route);
  const lightButton=page.locator('#mono-button'), lightInput=page.locator('#mono-input'), darkButton=page.locator('#mono-dark-button'), darkInput=page.locator('#mono-dark-input');
  await page.keyboard.press('Tab'); await expect(lightButton).toBeFocused();
  await page.keyboard.press('Tab'); await expect(lightInput).toBeFocused();
  await page.keyboard.press('Tab'); await expect(darkButton).toBeFocused();
  expect(Number.parseFloat((await state(darkButton)).outlineWidth)).toBeGreaterThanOrEqual(3);
  await page.keyboard.press('Tab'); await expect(darkInput).toBeFocused();
  expect(Number.parseFloat((await state(darkInput)).borderWidth)).toBeGreaterThanOrEqual(1);
});

test('Mono Dark preserves RTL and long localized content in a narrow viewport without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({width:375,height:900}); await page.goto(route);
  await page.evaluate(()=>{ document.documentElement.dir='rtl'; });
  await page.locator('#mono-dark-localized-copy').evaluate((element)=>{ element.textContent='واجهة تحريرية أحادية اللون وطويلة للغاية يجب أن تلتف داخل سطح مونو الداكن من دون أي تجاوز أفقي حتى مع اتجاه القراءة من اليمين إلى اليسار وتسميات مطولة للاختبار.'; });
  expect((await state(page.locator('#mono-dark-button'))).direction).toBe('rtl');
  expect((await state(page.locator('#mono-dark-input'))).direction).toBe('rtl');
  const metrics=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth}));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth+1);
  const card=await documentBox(page.locator('#mono-dark-card')); expect(card.width).toBeLessThanOrEqual(375);
});
