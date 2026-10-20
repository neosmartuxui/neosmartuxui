import { test, expect } from '@playwright/test';

const route = '/flavors/mono/';

const state = async (locator) => locator.evaluate((element) => {
  const styles = getComputedStyle(element);
  const transform = styles.transform === 'none' ? null : new DOMMatrixReadOnly(styles.transform);
  return {
    x: transform?.m41 ?? 0,
    y: transform?.m42 ?? 0,
    borderRadius: styles.borderRadius,
    borderWidth: styles.borderWidth,
    boxShadow: styles.boxShadow,
    backgroundColor: styles.backgroundColor,
    color: styles.color,
    fontFamily: styles.fontFamily,
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
  return { x: rect.x + window.scrollX, y: rect.y + window.scrollY, width: rect.width, height: rect.height };
});

const rgbChannels = (value) => {
  const match = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(value);
  if (!match) throw new Error(`Expected rgb color, got ${value}`);
  return match.slice(1, 4).map(Number);
};

const expectGray = (value) => {
  const [r, g, b] = rgbChannels(value);
  expect(r).toBe(g);
  expect(g).toBe(b);
};

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(route);
  await expect(page.locator('h1')).toHaveText('Mono Light');
  await expect(page.locator('#mono-foundry')).toHaveClass(/ns-theme-mono-light/);
  expect(errors).toEqual([]);
});

test('Mono Light resolves editorial monochrome keylines and type-led identity through shared Core adapters', async ({ page, request }) => {
  const cssResponse = await request.get('/mono-theme.css');
  expect(cssResponse.ok()).toBeTruthy();
  const css = await cssResponse.text();
  for (const marker of [
    '.ns-theme-mono-light {',
    '--ns-border-control-width: 2px;',
    '--ns-radius-control: 0px;',
    '--ns-color-surface-interactive: #ffffff;',
    '--ns-color-surface-panel: #f2f2f2;',
    '--ns-color-action-primary-surface: #111111;',
    '--ns-color-focus-ring: #000000;',
    '--ns-font-family-body: ui-serif, Georgia, serif;'
  ]) expect(css).toContain(marker);

  const button = page.locator('#mono-button');
  const input = page.locator('#mono-input');
  const card = page.locator('#mono-card');
  const badge = page.locator('#mono-badge-info');
  await expect(button).toHaveClass('ns-button');
  await expect(input).toHaveClass('ns-input');
  await expect(card).toHaveClass('ns-card');
  await expect(badge).toHaveClass('ns-badge');
  for (const locator of [button, input, card, badge]) expect((await state(locator)).borderRadius).toBe('0px');
  expect((await state(button)).borderWidth).toBe('2px');
  expect((await state(button)).minHeight).toBeGreaterThanOrEqual(44);
  expect((await state(badge)).fontFamily.toLowerCase()).toContain('serif');
});

test('Mono button preserves coherent 3→1→0 depth with 0→2→3 inward travel', async ({ page }) => {
  const button = page.locator('#mono-button');
  const rest = await state(button);
  expect(rest.x).toBeCloseTo(0, 1);
  expect(rest.y).toBeCloseTo(0, 1);
  expect(rest.boxShadow).toContain('3px 3px');

  await button.hover();
  await page.waitForTimeout(120);
  const hover = await state(button);
  expect(hover.x).toBeCloseTo(2, 1);
  expect(hover.y).toBeCloseTo(2, 1);
  expect(hover.boxShadow).toContain('1px 1px');

  const box = await button.boundingBox();
  if (!box) throw new Error('Mono button has no bounding box');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(80);
  const pressed = await state(button);
  expect(pressed.x).toBeCloseTo(3, 1);
  expect(pressed.y).toBeCloseTo(3, 1);
  expect(pressed.boxShadow).not.toContain('1px 1px');
  await page.mouse.up();
});

test('Mono changes expression without inventing interaction on input, card, or badge', async ({ page }) => {
  const input = page.locator('#mono-input');
  const card = page.locator('#mono-card');
  const badge = page.locator('#mono-badge-info');
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

test('Mono state surfaces stay grayscale while written labels preserve semantic meaning', async ({ page }) => {
  const cases = [
    ['#mono-badge-info', /^Info ·/],
    ['#mono-badge-success', /^Success ·/],
    ['#mono-badge-warning', /^Warning ·/],
    ['#mono-badge-error', /^Error ·/]
  ];
  const backgrounds = [];
  for (const [selector, label] of cases) {
    const badge = page.locator(selector);
    await expect(badge).toHaveText(label);
    const current = await state(badge);
    expectGray(current.backgroundColor);
    backgrounds.push(current.backgroundColor);
  }
  expect(new Set(backgrounds).size).toBe(4);
  expectGray((await state(page.locator('#mono-button'))).backgroundColor);
});

test('Mono reduced motion keeps pressure feedback immediate without losing state', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(route);
  const button = page.locator('#mono-button');
  expect(Number.parseFloat((await state(button)).transitionDuration)).toBeLessThanOrEqual(0.002);
  await button.hover();
  await expect.poll(async () => {
    const current = await state(button);
    return [Number(current.x.toFixed(3)), Number(current.y.toFixed(3))];
  }, { timeout: 500 }).toEqual([2, 2]);
});

test('Mono forced colors preserves real focus, readable boundaries, and normal Tab order', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto(route);
  const button = page.locator('#mono-button');
  const input = page.locator('#mono-input');
  const card = page.locator('#mono-card');
  await page.keyboard.press('Tab');
  await expect(button).toBeFocused();
  expect(Number.parseFloat((await state(button)).outlineWidth)).toBeGreaterThanOrEqual(3);
  await page.keyboard.press('Tab');
  await expect(input).toBeFocused();
  expect(Number.parseFloat((await state(input)).borderWidth)).toBeGreaterThanOrEqual(1);
  expect(Number.parseFloat((await state(card)).borderWidth)).toBeGreaterThanOrEqual(1);
});

test('Mono preserves RTL and long localized content in a narrow viewport without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto(route);
  await page.evaluate(() => { document.documentElement.dir = 'rtl'; });
  const button = page.locator('#mono-button');
  const input = page.locator('#mono-input');
  const copy = page.locator('#mono-localized-copy');
  expect((await state(button)).direction).toBe('rtl');
  expect((await state(input)).direction).toBe('rtl');
  await expect(copy).toContainText('localized-content example');
  const metrics = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
});
