import { test, expect } from '@playwright/test';

const route = '/flavors/hardline/';

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
  await expect(page.locator('h1')).toHaveText('Hardline Light');
  await expect(page.locator('#hardline-dark-title')).toHaveText('Hardline Dark');
  await expect(page.locator('#hardline-dark-foundry')).toHaveClass(/ns-theme-hardline-dark/);
  expect(errors).toEqual([]);
});

test('Hardline Dark is an authored semantic Theme on the same shared Core adapters', async ({ page, request }) => {
  const cssResponse = await request.get('/hardline-dark-theme.css');
  expect(cssResponse.ok()).toBeTruthy();
  const css = await cssResponse.text();
  for (const marker of [
    '.ns-theme-hardline-dark {',
    '--ns-color-surface-interactive: #141414;',
    '--ns-color-surface-panel: #1d1d1d;',
    '--ns-color-content-primary: #f5f5f5;',
    '--ns-color-action-primary-surface: #ffd84d;',
    '--ns-color-focus-ring: #8fb3ff;',
    '--ns-radius-control: 0px;'
  ]) expect(css).toContain(marker);

  const button = page.locator('#hardline-dark-button');
  const input = page.locator('#hardline-dark-input');
  const card = page.locator('#hardline-dark-card');
  const badge = page.locator('#hardline-dark-badge-info');
  await expect(button).toHaveClass('ns-button');
  await expect(input).toHaveClass('ns-input');
  await expect(card).toHaveClass('ns-card');
  await expect(badge).toHaveClass('ns-badge');
  for (const locator of [button, input, card, badge]) expect((await state(locator)).borderRadius).toBe('0px');
  expect((await state(button)).minHeight).toBeGreaterThanOrEqual(44);
  expect((await state(input)).backgroundColor).toBe('rgb(20, 20, 20)');
  expect((await state(input)).color).toBe('rgb(245, 245, 245)');
});

test('Hardline Dark preserves coherent 4→2→0 depth with 0→2→4 inward travel', async ({ page }) => {
  const button = page.locator('#hardline-dark-button');
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
  if (!box) throw new Error('Hardline Dark button has no bounding box');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(90);
  const pressed = await state(button);
  expect(pressed.x).toBeCloseTo(4, 1);
  expect(pressed.y).toBeCloseTo(4, 1);
  expect(pressed.boxShadow).not.toContain('2px 2px');
  await page.mouse.up();
});

test('Hardline Dark keeps editing and informational surfaces stable while written state labels remain explicit', async ({ page }) => {
  const input = page.locator('#hardline-dark-input');
  const card = page.locator('#hardline-dark-card');
  const badges = page.locator('#hardline-dark-foundry .ns-badge');
  await expect(badges).toHaveCount(4);
  await expect(page.locator('#hardline-dark-badge-info')).toContainText('Info');
  await expect(page.locator('#hardline-dark-badge-success')).toContainText('Success');
  await expect(page.locator('#hardline-dark-badge-warning')).toContainText('Warning');
  await expect(page.locator('#hardline-dark-badge-error')).toContainText('Error');

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

test('Hardline Dark reduced motion preserves immediate pressure state without decorative travel animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(route);
  const button = page.locator('#hardline-dark-button');
  expect(Number.parseFloat((await state(button)).transitionDuration)).toBeLessThanOrEqual(0.002);
  await button.hover();
  await expect.poll(async () => {
    const current = await state(button);
    return [Number(current.x.toFixed(3)), Number(current.y.toFixed(3))];
  }, { timeout: 500 }).toEqual([2, 2]);
});

test('Hardline Dark forced colors preserves focus, boundaries, and normal document Tab order', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto(route);
  const lightButton = page.locator('#hardline-button');
  const lightInput = page.locator('#hardline-input');
  const darkButton = page.locator('#hardline-dark-button');
  const darkInput = page.locator('#hardline-dark-input');
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

test('Hardline Dark preserves RTL and long localized content in a narrow viewport without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.locator('html').evaluate((element) => element.setAttribute('dir', 'rtl'));
  await page.locator('#hardline-dark-localized-copy').evaluate((element) => {
    element.textContent = 'واجهة تحرير طويلة للغاية يجب أن تلتف داخل السطح الداكن من دون أي تجاوز أفقي حتى مع اتجاه القراءة من اليمين إلى اليسار وتسميات مطولة للاختبار.';
  });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  const card = await documentBox(page.locator('#hardline-dark-card'));
  expect(card.width).toBeLessThanOrEqual(320);
});
