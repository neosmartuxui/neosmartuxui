import { test, expect } from '@playwright/test';

const route = '/flavors/rivet/';

const state = async (locator) => locator.evaluate((element) => {
  const styles = getComputedStyle(element);
  const transform = styles.transform === 'none' ? null : new DOMMatrixReadOnly(styles.transform);
  const rect = element.getBoundingClientRect();
  return {
    x: transform?.m41 ?? 0,
    y: transform?.m42 ?? 0,
    color: styles.color,
    backgroundColor: styles.backgroundColor,
    borderRadius: styles.borderRadius,
    borderWidth: styles.borderWidth,
    boxShadow: styles.boxShadow,
    outlineWidth: styles.outlineWidth,
    transitionDuration: styles.transitionDuration,
    minHeight: Number.parseFloat(styles.minHeight),
    width: rect.width,
    height: rect.height,
    tabIndex: element.tabIndex
  };
});

const documentBox = async (locator) => locator.evaluate((element) => {
  const rect = element.getBoundingClientRect();
  return { x: rect.x + window.scrollX, y: rect.y + window.scrollY, width: rect.width, height: rect.height };
});

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(route);
  await expect(page.locator('h1')).toHaveText('Rivet Light');
  await expect(page.locator('#rivet-dark-title')).toHaveText('Rivet Dark');
  await expect(page.locator('#rivet-dark-foundry')).toHaveClass(/ns-theme-rivet-dark/);
  expect(errors).toEqual([]);
});

test('Rivet Dark is an authored semantic Theme on the same shared Core adapters', async ({ page, request }) => {
  const cssResponse = await request.get('/rivet-dark-theme.css');
  expect(cssResponse.ok()).toBeTruthy();
  const css = await cssResponse.text();
  for (const marker of [
    '.ns-theme-rivet-dark {',
    '--ns-color-surface-interactive: #18171c;',
    '--ns-color-surface-panel: #232129;',
    '--ns-color-content-primary: #f6f3fa;',
    '--ns-color-action-primary-surface: #c7b5f2;',
    '--ns-color-focus-ring: #cdbdf7;',
    '--ns-radius-control: 6px;',
    '--ns-radius-surface: 6px;',
    '--ns-radius-annotation: 999px;'
  ]) expect(css).toContain(marker);

  const button = page.locator('#rivet-dark-button');
  const input = page.locator('#rivet-dark-input');
  const card = page.locator('#rivet-dark-card');
  const badge = page.locator('#rivet-dark-badge-info');
  await expect(button).toHaveClass('ns-button');
  await expect(input).toHaveClass('ns-input');
  await expect(card).toHaveClass('ns-card');
  await expect(badge).toHaveClass('ns-badge');
  expect((await state(button)).borderRadius).toBe('6px');
  expect((await state(input)).borderRadius).toBe('6px');
  expect((await state(card)).borderRadius).toBe('6px');
  expect(Number.parseFloat((await state(badge)).borderRadius)).toBeGreaterThanOrEqual(100);
  expect((await state(button)).minHeight).toBeGreaterThanOrEqual(44);
  expect((await state(input)).backgroundColor).toBe('rgb(24, 23, 28)');
  expect((await state(input)).color).toBe('rgb(246, 243, 250)');
});

test('Rivet Dark preserves coherent 5→3→0 depth with 0→2→5 inward travel', async ({ page }) => {
  const button = page.locator('#rivet-dark-button');
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
  if (!box) throw new Error('Rivet Dark button has no bounding box');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(100);
  const pressed = await state(button);
  expect(pressed.x).toBeCloseTo(5, 1);
  expect(pressed.y).toBeCloseTo(5, 1);
  expect(pressed.boxShadow).not.toContain('3px 3px');
  await page.mouse.up();
});

test('Rivet Dark keeps editing and informational surfaces stable while written state labels remain explicit', async ({ page }) => {
  const input = page.locator('#rivet-dark-input');
  const card = page.locator('#rivet-dark-card');
  const badges = page.locator('#rivet-dark-foundry .ns-badge');
  await expect(badges).toHaveCount(4);
  await expect(page.locator('#rivet-dark-badge-info')).toContainText('Info');
  await expect(page.locator('#rivet-dark-badge-success')).toContainText('Success');
  await expect(page.locator('#rivet-dark-badge-warning')).toContainText('Warning');
  await expect(page.locator('#rivet-dark-badge-error')).toContainText('Error');

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

test('Rivet Dark reduced motion preserves immediate pressure state without decorative travel animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(route);
  const button = page.locator('#rivet-dark-button');
  expect(Number.parseFloat((await state(button)).transitionDuration)).toBeLessThanOrEqual(0.002);
  await button.hover();
  await expect.poll(async () => {
    const current = await state(button);
    return [Number(current.x.toFixed(3)), Number(current.y.toFixed(3))];
  }, { timeout: 500 }).toEqual([2, 2]);
});

test('Rivet Dark forced colors preserves focus, boundaries, and normal document Tab order', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto(route);
  const lightButton = page.locator('#rivet-button');
  const lightInput = page.locator('#rivet-input');
  const darkButton = page.locator('#rivet-dark-button');
  const darkInput = page.locator('#rivet-dark-input');
  await page.keyboard.press('Tab');
  await expect(lightButton).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(lightInput).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(darkButton).toBeFocused();
  expect(Number.parseFloat((await state(darkButton)).outlineWidth)).toBeGreaterThanOrEqual(3);
  await page.keyboard.press('Tab');
  await expect(darkInput).toBeFocused();
  expect(Number.parseFloat((await state(darkInput)).borderWidth)).toBeGreaterThanOrEqual(1);
});

test('Rivet Dark preserves RTL and long localized content in a narrow viewport without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.locator('html').evaluate((element) => element.setAttribute('dir', 'rtl'));
  await page.locator('#rivet-dark-localized-copy').evaluate((element) => {
    element.textContent = 'واجهة ميكانيكية طويلة للغاية يجب أن تلتف داخل سطح ريفت الداكن من دون أي تجاوز أفقي حتى مع اتجاه القراءة من اليمين إلى اليسار وتسميات مطولة للاختبار.';
  });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  const card = await documentBox(page.locator('#rivet-dark-card'));
  expect(card.width).toBeLessThanOrEqual(320);
});
