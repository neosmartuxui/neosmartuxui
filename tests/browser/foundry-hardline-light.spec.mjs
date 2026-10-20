import { test, expect } from '@playwright/test';

const route = '/flavors/hardline/';

const state = async (locator) => locator.evaluate((element) => {
  const styles = getComputedStyle(element);
  const transform = styles.transform === 'none' ? null : new DOMMatrixReadOnly(styles.transform);
  const rect = element.getBoundingClientRect();
  return {
    x: transform?.m41 ?? 0,
    y: transform?.m42 ?? 0,
    borderRadius: styles.borderRadius,
    borderWidth: styles.borderWidth,
    boxShadow: styles.boxShadow,
    outlineWidth: styles.outlineWidth,
    transitionDuration: styles.transitionDuration,
    minHeight: Number.parseFloat(styles.minHeight),
    width: rect.width,
    height: rect.height,
    role: element.getAttribute('role'),
    tabIndex: element.tabIndex
  };
});

const documentBox = async (locator) => locator.evaluate((element) => {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.x + window.scrollX,
    y: rect.y + window.scrollY,
    width: rect.width,
    height: rect.height
  };
});

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(route);
  await expect(page.locator('h1')).toHaveText('Hardline Light');
  await expect(page.locator('#hardline-foundry')).toHaveClass(/ns-theme-hardline-light/);
  expect(errors).toEqual([]);
});

test('Hardline Light resolves zero-radius flagship geometry through the same Core adapter classes', async ({ page, request }) => {
  const cssResponse = await request.get('/hardline-theme.css');
  expect(cssResponse.ok()).toBeTruthy();
  const css = await cssResponse.text();
  expect(css).toContain('.ns-theme-hardline-light {');
  expect(css).toContain('--ns-radius-control: 0px;');
  expect(css).toContain('--ns-radius-surface: 0px;');
  expect(css).toContain('--ns-radius-annotation: 0px;');

  const button = page.locator('#hardline-button');
  const input = page.locator('#hardline-input');
  const card = page.locator('#hardline-card');
  const badge = page.locator('#hardline-badge-info');
  await expect(button).toHaveClass('ns-button');
  await expect(input).toHaveClass('ns-input');
  await expect(card).toHaveClass('ns-card');
  await expect(badge).toHaveClass('ns-badge');
  for (const locator of [button, input, card, badge]) expect((await state(locator)).borderRadius).toBe('0px');
  expect((await state(button)).minHeight).toBeGreaterThanOrEqual(44);
});

test('Hardline button preserves coherent 4→2→0 depth with 0→2→4 inward travel', async ({ page }) => {
  const button = page.locator('#hardline-button');
  const rest = await state(button);
  expect(rest.x).toBeCloseTo(0, 1);
  expect(rest.y).toBeCloseTo(0, 1);
  expect(rest.boxShadow).toContain('4px 4px');

  await button.hover();
  await page.waitForTimeout(140);
  const hover = await state(button);
  expect(hover.x).toBeCloseTo(2, 1);
  expect(hover.y).toBeCloseTo(2, 1);
  expect(hover.boxShadow).toContain('2px 2px');

  const box = await button.boundingBox();
  if (!box) throw new Error('Hardline button has no bounding box');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(90);
  const pressed = await state(button);
  expect(pressed.x).toBeCloseTo(4, 1);
  expect(pressed.y).toBeCloseTo(4, 1);
  expect(pressed.boxShadow).not.toContain('2px 2px');
  await page.mouse.up();
});

test('Hardline changes expression without inventing interaction on input, card, or badge', async ({ page }) => {
  const input = page.locator('#hardline-input');
  const card = page.locator('#hardline-card');
  const badge = page.locator('#hardline-badge-info');
  expect((await state(card)).role).toBeNull();
  expect((await state(card)).tabIndex).toBe(-1);
  expect((await state(badge)).tabIndex).toBe(-1);

  const inputBefore = await documentBox(input);
  const cardBefore = await documentBox(card);
  await input.hover();
  await card.hover();
  await page.waitForTimeout(150);
  const inputAfter = await documentBox(input);
  const cardAfter = await documentBox(card);
  expect(inputAfter.x).toBeCloseTo(inputBefore.x, 1);
  expect(inputAfter.y).toBeCloseTo(inputBefore.y, 1);
  expect(cardAfter.x).toBeCloseTo(cardBefore.x, 1);
  expect(cardAfter.y).toBeCloseTo(cardBefore.y, 1);
});

test('Hardline reduced motion keeps immediate pressure feedback without losing state', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(route);
  const button = page.locator('#hardline-button');
  expect(Number.parseFloat((await state(button)).transitionDuration)).toBeLessThanOrEqual(0.002);
  await button.hover();
  await expect.poll(async () => {
    const current = await state(button);
    return [Number(current.x.toFixed(3)), Number(current.y.toFixed(3))];
  }, { timeout: 500 }).toEqual([2, 2]);
});

test('Hardline forced colors preserves real focus, readable boundaries, and normal Tab order', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto(route);
  const button = page.locator('#hardline-button');
  const input = page.locator('#hardline-input');
  const card = page.locator('#hardline-card');
  await page.keyboard.press('Tab');
  await expect(button).toBeFocused();
  expect(Number.parseFloat((await state(button)).outlineWidth)).toBeGreaterThanOrEqual(3);
  await page.keyboard.press('Tab');
  await expect(input).toBeFocused();
  expect(Number.parseFloat((await state(input)).borderWidth)).toBeGreaterThanOrEqual(1);
  expect(Number.parseFloat((await state(card)).borderWidth)).toBeGreaterThanOrEqual(1);
});
