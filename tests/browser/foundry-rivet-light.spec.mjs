import { test, expect } from '@playwright/test';

const route = '/flavors/rivet/';

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
    backgroundColor: styles.backgroundColor,
    outlineWidth: styles.outlineWidth,
    transitionDuration: styles.transitionDuration,
    minHeight: Number.parseFloat(styles.minHeight),
    role: element.getAttribute('role'),
    tabIndex: element.tabIndex,
    direction: styles.direction
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
  await expect(page.locator('h1')).toHaveText('Rivet Light');
  await expect(page.locator('#rivet-foundry')).toHaveClass(/ns-theme-rivet-light/);
  expect(errors).toEqual([]);
});

test('Rivet Light resolves mechanical geometry and adapted paper/ink/lavender identity through shared Core adapters', async ({ page, request }) => {
  const cssResponse = await request.get('/rivet-theme.css');
  expect(cssResponse.ok()).toBeTruthy();
  const css = await cssResponse.text();
  expect(css).toContain('.ns-theme-rivet-light {');
  expect(css).toContain('--ns-border-control-width: 3px;');
  expect(css).toContain('--ns-radius-control: 6px;');
  expect(css).toContain('--ns-color-surface-interactive: #fffefb;');
  expect(css).toContain('--ns-color-surface-panel: #f8f6f1;');
  expect(css).toContain('--ns-color-action-primary-surface: #b9a1ed;');
  expect(css).toContain('--ns-color-focus-ring: #7550ac;');

  const button = page.locator('#rivet-button');
  const input = page.locator('#rivet-input');
  const card = page.locator('#rivet-card');
  const badge = page.locator('#rivet-badge-info');
  await expect(button).toHaveClass('ns-button');
  await expect(input).toHaveClass('ns-input');
  await expect(card).toHaveClass('ns-card');
  await expect(badge).toHaveClass('ns-badge');
  expect((await state(button)).borderRadius).toBe('6px');
  expect((await state(input)).borderRadius).toBe('6px');
  expect((await state(card)).borderRadius).toBe('6px');
  expect((await state(badge)).borderRadius).toBe('999px');
  expect((await state(button)).borderWidth).toBe('3px');
  expect((await state(button)).minHeight).toBeGreaterThanOrEqual(44);
});

test('Rivet button preserves coherent 5→3→0 depth with 0→2→5 inward travel', async ({ page }) => {
  const button = page.locator('#rivet-button');
  const rest = await state(button);
  expect(rest.x).toBeCloseTo(0, 1);
  expect(rest.y).toBeCloseTo(0, 1);
  expect(rest.boxShadow).toContain('5px 5px');

  await button.hover();
  await page.waitForTimeout(170);
  const hover = await state(button);
  expect(hover.x).toBeCloseTo(2, 1);
  expect(hover.y).toBeCloseTo(2, 1);
  expect(hover.boxShadow).toContain('3px 3px');

  const box = await button.boundingBox();
  if (!box) throw new Error('Rivet button has no bounding box');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(95);
  const pressed = await state(button);
  expect(pressed.x).toBeCloseTo(5, 1);
  expect(pressed.y).toBeCloseTo(5, 1);
  expect(pressed.boxShadow).not.toContain('3px 3px');
  await page.mouse.up();
});

test('Rivet changes expression without inventing interaction on input, card, or badge', async ({ page }) => {
  const input = page.locator('#rivet-input');
  const card = page.locator('#rivet-card');
  const badge = page.locator('#rivet-badge-info');
  expect((await state(card)).role).toBeNull();
  expect((await state(card)).tabIndex).toBe(-1);
  expect((await state(badge)).tabIndex).toBe(-1);

  const inputBefore = await documentBox(input);
  const cardBefore = await documentBox(card);
  await input.hover();
  await card.hover();
  await page.waitForTimeout(170);
  const inputAfter = await documentBox(input);
  const cardAfter = await documentBox(card);
  expect(inputAfter.x).toBeCloseTo(inputBefore.x, 1);
  expect(inputAfter.y).toBeCloseTo(inputBefore.y, 1);
  expect(cardAfter.x).toBeCloseTo(cardBefore.x, 1);
  expect(cardAfter.y).toBeCloseTo(cardBefore.y, 1);
});

test('Rivet reduced motion keeps pressure feedback immediate without losing state', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(route);
  const button = page.locator('#rivet-button');
  expect(Number.parseFloat((await state(button)).transitionDuration)).toBeLessThanOrEqual(0.002);
  await button.hover();
  await expect.poll(async () => {
    const current = await state(button);
    return [Number(current.x.toFixed(3)), Number(current.y.toFixed(3))];
  }, { timeout: 500 }).toEqual([2, 2]);
});

test('Rivet forced colors preserves real focus, readable boundaries, and normal Tab order', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto(route);
  const button = page.locator('#rivet-button');
  const input = page.locator('#rivet-input');
  const card = page.locator('#rivet-card');
  await page.keyboard.press('Tab');
  await expect(button).toBeFocused();
  expect(Number.parseFloat((await state(button)).outlineWidth)).toBeGreaterThanOrEqual(3);
  await page.keyboard.press('Tab');
  await expect(input).toBeFocused();
  expect(Number.parseFloat((await state(input)).borderWidth)).toBeGreaterThanOrEqual(1);
  expect(Number.parseFloat((await state(card)).borderWidth)).toBeGreaterThanOrEqual(1);
});

test('Rivet preserves RTL direction and narrow responsive containment without horizontal page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto(route);
  await page.evaluate(() => { document.documentElement.dir = 'rtl'; });
  const button = page.locator('#rivet-button');
  const input = page.locator('#rivet-input');
  expect((await state(button)).direction).toBe('rtl');
  expect((await state(input)).direction).toBe('rtl');
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
});
