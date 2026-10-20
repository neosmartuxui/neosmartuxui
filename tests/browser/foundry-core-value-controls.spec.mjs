import { test, expect } from '@playwright/test';

const transform = async (locator) => locator.evaluate((element) => {
  const style = getComputedStyle(element);
  const matrix = style.transform === 'none' ? null : new DOMMatrixReadOnly(style.transform);
  return {
    x: matrix?.m41 ?? 0,
    y: matrix?.m42 ?? 0,
    transitionDuration: style.transitionDuration,
    outlineWidth: style.outlineWidth,
    forcedColorAdjust: style.forcedColorAdjust,
    direction: style.direction,
    writingMode: style.writingMode
  };
});

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#number-field-slice')).toContainText('core.number-field');
  await expect(page.locator('#slider-slice')).toContainText('core.slider');
  expect(errors).toEqual([]);
});

test('value-control renderer assets are deployable', async ({ request }) => {
  for (const asset of ['number-field.css','number-field.mjs','slider.css','slider.mjs']) {
    const response = await request.get('/' + asset);
    expect(response.ok(), asset).toBeTruthy();
    expect((await response.text()).length, asset).toBeGreaterThan(100);
  }
});

test('NumberField preserves native numeric editing and uses native step algorithms', async ({ page }) => {
  const root = page.locator('#number-field-demo');
  const input = page.locator('#number-field-input');
  const decrement = page.locator('#number-field-decrement');
  const increment = page.locator('#number-field-increment');

  expect(await input.evaluate((el) => [el.tagName, el.type])).toEqual(['INPUT','number']);
  await expect(input).toHaveAttribute('min','0');
  await expect(input).toHaveAttribute('max','12');
  await expect(input).toHaveAttribute('step','1');
  await expect(root).toHaveAttribute('data-state','empty');

  await input.fill('3');
  await expect(root).toHaveAttribute('data-state','filled');
  await input.focus();
  await input.press('ArrowUp');
  await expect(input).toHaveValue('4');
  await increment.click();
  await expect(input).toHaveValue('5');
  await decrement.click();
  await expect(input).toHaveValue('4');

  await input.fill('12');
  await expect(increment).toBeDisabled();
  await expect(decrement).toBeEnabled();
  await decrement.click();
  await expect(input).toHaveValue('11');
});

test('NumberField keeps editable surface non-pressable while step actions carry pressure', async ({ page }) => {
  const input = page.locator('#number-field-input');
  const increment = page.locator('#number-field-increment');

  await input.hover();
  await page.waitForTimeout(180);
  let state = await transform(input);
  expect(state.x).toBeCloseTo(0, 2);
  expect(state.y).toBeCloseTo(0, 2);

  const inputBox = await input.boundingBox();
  if (!inputBox) throw new Error('NumberField input has no pointer box');
  await page.mouse.move(inputBox.x + inputBox.width / 2, inputBox.y + inputBox.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(100);
  state = await transform(input);
  expect(state.x).toBeCloseTo(0, 2);
  expect(state.y).toBeCloseTo(0, 2);
  await page.mouse.up();

  const stepBox = await increment.boundingBox();
  if (!stepBox) throw new Error('NumberField increment action has no pointer box');
  await page.mouse.move(stepBox.x + stepBox.width / 2, stepBox.y + stepBox.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(100);
  state = await transform(increment);
  expect(state.x).toBeGreaterThan(3);
  expect(state.y).toBeGreaterThan(3);
  await page.mouse.up();
});

test('NumberField invalid, read-only and disabled states stay semantically distinct', async ({ page }) => {
  const root = page.locator('#number-field-demo');
  const input = page.locator('#number-field-input');
  const decrement = page.locator('#number-field-decrement');
  const increment = page.locator('#number-field-increment');

  await input.fill('14');
  await expect(root).toHaveAttribute('data-state','invalid');
  expect(await input.evaluate((el) => el.validity.rangeOverflow)).toBe(true);

  await page.evaluate(async () => {
    const module = await import('./number-field.mjs');
    module.setNumberFieldValue(document.querySelector('#number-field-demo'), 4);
    module.setNumberFieldReadOnly(document.querySelector('#number-field-demo'), true);
  });
  await expect(root).toHaveAttribute('data-state','read-only');
  expect(await input.evaluate((el) => el.readOnly)).toBe(true);
  await expect(input).not.toBeDisabled();
  await expect(decrement).toBeDisabled();
  await expect(increment).toBeDisabled();

  await page.evaluate(async () => {
    const module = await import('./number-field.mjs');
    const root = document.querySelector('#number-field-demo');
    module.setNumberFieldReadOnly(root, false);
    module.setNumberFieldDisabled(root, true);
  });
  await expect(root).toHaveAttribute('data-state','disabled');
  await expect(input).toBeDisabled();
});

test('Slider scalar mode keeps native range value and keyboard semantics', async ({ page }) => {
  const root = page.locator('#slider-demo');
  const input = page.locator('#slider-input');
  expect(await input.evaluate((el) => [el.tagName, el.type, el.getAttribute('role')])).toEqual(['INPUT','range',null]);
  await expect(input).toHaveAttribute('min','0');
  await expect(input).toHaveAttribute('max','100');
  await expect(input).toHaveAttribute('step','5');
  await expect(input).toHaveValue('40');

  await input.focus();
  await input.press('ArrowRight');
  await expect(input).toHaveValue('45');
  await expect(root.locator('[data-slider-output="value"]')).toHaveText('45');
  await input.press('Home');
  await expect(input).toHaveValue('0');
  await input.press('End');
  await expect(input).toHaveValue('100');

  const box = await input.boundingBox();
  expect(box).not.toBeNull();
  expect(box.height).toBeGreaterThanOrEqual(44);
});

test('Slider range mode exposes two native thumbs and enforces a no-cross policy', async ({ page }) => {
  const root = page.locator('#slider-range-demo');
  const lower = page.locator('#slider-lower');
  const upper = page.locator('#slider-upper');
  for (const input of [lower, upper]) expect(await input.evaluate((el) => [el.tagName, el.type])).toEqual(['INPUT','range']);
  await expect(lower).toHaveAttribute('aria-label','Minimum budget');
  await expect(upper).toHaveAttribute('aria-label','Maximum budget');
  await expect(lower).toHaveAttribute('max','75');
  await expect(upper).toHaveAttribute('min','25');

  await lower.focus();
  await lower.press('End');
  await expect(lower).toHaveValue('75');
  await expect(upper).toHaveAttribute('min','75');
  await upper.focus();
  await upper.press('Home');
  await expect(upper).toHaveValue('75');
  await expect(lower).toHaveAttribute('max','75');

  await expect(root.locator('[data-slider-output="lower"]')).toHaveText('75');
  await expect(root.locator('[data-slider-output="upper"]')).toHaveText('75');
});

test('Slider RTL, vertical, reduced-motion, forced-colors and disabled invariants hold', async ({ page }) => {
  const input = page.locator('#slider-input');
  await page.evaluate(() => { document.documentElement.dir = 'rtl'; });
  expect((await transform(input)).direction).toBe('rtl');

  await page.evaluate(() => { document.querySelector('#slider-demo').dataset.orientation = 'vertical'; });
  expect((await transform(input)).writingMode).toBe('vertical-lr');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('#slider-input')).toHaveCSS('cursor','pointer');

  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'no-preference' });
  await page.goto('/');
  const forcedInput = page.locator('#slider-input');
  await forcedInput.focus();
  const forced = await transform(forcedInput);
  expect(forced.forcedColorAdjust).toBe('auto');
  expect(parseFloat(forced.outlineWidth)).toBeGreaterThan(0);

  await page.emulateMedia({ forcedColors: 'none' });
  await page.goto('/');
  await page.evaluate(async () => {
    const module = await import('./slider.mjs');
    module.setSliderDisabled(document.querySelector('#slider-demo'), true);
  });
  await expect(page.locator('#slider-demo')).toHaveAttribute('data-state','disabled');
  await expect(page.locator('#slider-input')).toBeDisabled();

  await page.setViewportSize({ width: 375, height: 1200 });
  await page.goto('/');
  const metrics = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
});
