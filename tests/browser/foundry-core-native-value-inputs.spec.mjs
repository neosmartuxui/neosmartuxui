import { test, expect } from '@playwright/test';

const transform = async (locator) => locator.evaluate((element) => {
  const style = getComputedStyle(element);
  const matrix = style.transform === 'none' ? null : new DOMMatrixReadOnly(style.transform);
  return {
    x: matrix?.m41 ?? 0,
    y: matrix?.m42 ?? 0,
    outlineWidth: style.outlineWidth,
    forcedColorAdjust: style.forcedColorAdjust,
    transitionDuration: style.transitionDuration
  };
});

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#color-picker-slice')).toContainText('core.color-picker');
  await expect(page.locator('#time-picker-slice')).toContainText('core.time-picker');
  expect(errors).toEqual([]);
});

test('native value-input renderer assets are deployable', async ({ request }) => {
  for (const asset of ['color-picker.css','color-picker.mjs','time-picker.css','time-picker.mjs']) {
    const response = await request.get('/' + asset);
    expect(response.ok(), asset).toBeTruthy();
    expect((await response.text()).length, asset).toBeGreaterThan(100);
  }
});

test('ColorPicker preserves a real native color value authority and textual value', async ({ page }) => {
  const root = page.locator('#color-picker-demo');
  const input = page.locator('#color-picker-input');
  const output = page.locator('#color-picker-value');
  expect(await input.evaluate((el) => [el.tagName, el.type, el.getAttribute('role'), el.hasAttribute('aria-expanded')])).toEqual(['INPUT','color',null,false]);
  await expect(input).toHaveValue('#5a1832');
  await expect(output).toHaveText('#5A1832');

  await page.evaluate(async () => {
    const module = await import('./color-picker.mjs');
    module.setColorPickerValue(document.querySelector('#color-picker-demo'), '#2e6e50');
  });
  await expect(input).toHaveValue('#2e6e50');
  await expect(output).toHaveText('#2E6E50');
  await expect(root).toHaveAttribute('data-state','selected');
});

test('ColorPicker pressure contract survives native picker handoff while invalid and disabled stay semantic', async ({ page }) => {
  const input = page.locator('#color-picker-input');
  const root = page.locator('#color-picker-demo');

  await input.hover();
  await page.waitForTimeout(180);
  const hover = await transform(input);
  expect(hover.x).toBeGreaterThan(1);
  expect(hover.y).toBeGreaterThan(1);

  const css = await page.evaluate(() => fetch('./color-picker.css').then((response) => response.text()));
  expect(css).toContain('.ns-color-picker__input:active:not(:disabled)');
  expect(css).toContain('transform: translate(var(--ns-press-active-x), var(--ns-press-active-y))');

  const box = await input.boundingBox();
  if (!box) throw new Error('ColorPicker has no pointer box');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  expect(await input.evaluate((element) => element.matches(':active'))).toBe(true);
  await page.mouse.up();

  await page.evaluate(async () => {
    const module = await import('./color-picker.mjs');
    module.setColorPickerInvalid(document.querySelector('#color-picker-demo'), true);
  });
  await expect(input).toHaveAttribute('aria-invalid','true');
  await expect(root).toHaveAttribute('data-state','invalid');

  await page.evaluate(async () => {
    const module = await import('./color-picker.mjs');
    const root = document.querySelector('#color-picker-demo');
    module.setColorPickerInvalid(root, false);
    module.setColorPickerDisabled(root, true);
  });
  await expect(input).toBeDisabled();
  await expect(root).toHaveAttribute('data-state','disabled');
  const target = await input.boundingBox();
  expect(target.height).toBeGreaterThanOrEqual(44);
});

test('TimePicker preserves native time min/max/step and never becomes pressable', async ({ page }) => {
  const root = page.locator('#time-picker-demo');
  const input = page.locator('#time-picker-input');
  expect(await input.evaluate((el) => [el.tagName, el.type, el.getAttribute('role'), el.hasAttribute('aria-expanded')])).toEqual(['INPUT','time',null,false]);
  await expect(input).toHaveAttribute('min','09:00');
  await expect(input).toHaveAttribute('max','17:00');
  await expect(input).toHaveAttribute('step','900');

  await page.evaluate(() => {
    const input = document.querySelector('#time-picker-input');
    input.value = '10:30';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(input).toHaveValue('10:30');
  await expect(root).toHaveAttribute('data-state','filled');

  await input.hover();
  await page.waitForTimeout(180);
  let state = await transform(input);
  expect(state.x).toBeCloseTo(0,2);
  expect(state.y).toBeCloseTo(0,2);
  const box = await input.boundingBox();
  if (!box) throw new Error('TimePicker has no pointer box');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(100);
  state = await transform(input);
  expect(state.x).toBeCloseTo(0,2);
  expect(state.y).toBeCloseTo(0,2);
  await page.mouse.up();
});

test('TimePicker platform validity plus read-only and disabled states remain distinct', async ({ page }) => {
  const root = page.locator('#time-picker-demo');
  const input = page.locator('#time-picker-input');

  await page.evaluate(() => {
    const input = document.querySelector('#time-picker-input');
    input.value = '18:00';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  expect(await input.evaluate((el) => el.validity.rangeOverflow)).toBe(true);
  await expect(root).toHaveAttribute('data-state','invalid');

  await page.evaluate(async () => {
    const module = await import('./time-picker.mjs');
    const root = document.querySelector('#time-picker-demo');
    module.setTimePickerValue(root, '10:30');
    module.setTimePickerReadOnly(root, true);
  });
  await expect(input).toHaveJSProperty('readOnly',true);
  await expect(input).not.toBeDisabled();
  await expect(root).toHaveAttribute('data-state','read-only');

  await page.evaluate(async () => {
    const module = await import('./time-picker.mjs');
    const root = document.querySelector('#time-picker-demo');
    module.setTimePickerReadOnly(root, false);
    module.setTimePickerDisabled(root, true);
  });
  await expect(input).toBeDisabled();
  await expect(root).toHaveAttribute('data-state','disabled');
});

test('native value inputs retain responsive, RTL, reduced-motion and forced-colors resilience', async ({ page }) => {
  await page.evaluate(() => { document.documentElement.dir = 'rtl'; });
  await expect(page.locator('#color-picker-demo')).toHaveCSS('direction','rtl');
  await expect(page.locator('#time-picker-demo')).toHaveCSS('direction','rtl');

  await page.emulateMedia({ reducedMotion:'reduce' });
  await page.goto('/');
  expect((await transform(page.locator('#color-picker-input'))).transitionDuration).toContain('0.001');
  expect((await transform(page.locator('#time-picker-input'))).transitionDuration).toContain('0.001');

  await page.emulateMedia({ forcedColors:'active', reducedMotion:'no-preference' });
  await page.goto('/');
  await page.locator('#time-picker-input').focus();
  const timeForced=await transform(page.locator('#time-picker-input'));
  expect(timeForced.forcedColorAdjust).toBe('auto');
  expect(parseFloat(timeForced.outlineWidth)).toBeGreaterThan(0);

  await page.emulateMedia({ forcedColors:'none' });
  await page.setViewportSize({width:375,height:1200});
  await page.goto('/');
  const metrics=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth}));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth+1);
});
