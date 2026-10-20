import { test, expect } from '@playwright/test';

const transformState = async (locator) => locator.evaluate((element) => {
  const style = getComputedStyle(element);
  const matrix = style.transform === 'none' ? null : new DOMMatrixReadOnly(style.transform);
  return {
    x: matrix?.m41 ?? 0,
    y: matrix?.m42 ?? 0,
    borderStyle: style.borderStyle,
    transitionDuration: style.transitionDuration,
    outlineWidth: style.outlineWidth,
    forcedColorAdjust: style.forcedColorAdjust
  };
});

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#toggle-slice')).toContainText('core.toggle');
  await expect(page.locator('#toggle-group-slice')).toContainText('core.toggle-group');
  expect(errors).toEqual([]);
});

test('toggle-control renderer assets are deployable', async ({ request }) => {
  for (const asset of ['toggle.css','toggle.mjs','toggle-group.css','toggle-group.mjs']) {
    const response = await request.get('/' + asset);
    expect(response.ok(), asset).toBeTruthy();
    expect((await response.text()).length, asset).toBeGreaterThan(100);
  }
});

test('Toggle is a native pressed-state button with Space and Enter activation', async ({ page }) => {
  const toggle = page.locator('#toggle-demo');
  expect(await toggle.evaluate((el) => el.tagName)).toBe('BUTTON');
  await expect(toggle).toHaveAttribute('type','button');
  await expect(toggle).toHaveAttribute('aria-pressed','false');
  await toggle.focus();
  await toggle.press('Enter');
  await expect(toggle).toHaveAttribute('aria-pressed','true');
  await expect(toggle).toHaveAttribute('data-state','on');
  await toggle.press('Space');
  await expect(toggle).toHaveAttribute('aria-pressed','false');
  await expect(toggle).toHaveAttribute('data-state','off');
  expect(await toggle.getAttribute('role')).toBeNull();
});

test('Toggle keeps persistent on state distinct from transient active pressure', async ({ page }) => {
  const toggle = page.locator('#toggle-demo');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed','true');
  await page.waitForTimeout(180);
  const selected = await transformState(toggle);
  expect(selected.x).toBeCloseTo(0,1);
  expect(selected.y).toBeCloseTo(0,1);
  expect(selected.borderStyle).toBe('double');

  const box = await toggle.boundingBox();
  if (!box) throw new Error('Toggle has no pointer box');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect.poll(async () => {
    const state = await transformState(toggle);
    return Math.max(Math.abs(state.x - 5), Math.abs(state.y - 5));
  }, { timeout: 1000 }).toBeLessThanOrEqual(0.01);
  const active = await transformState(toggle);
  expect(active.x).toBeCloseTo(5,1);
  expect(active.y).toBeCloseTo(5,1);
  await page.mouse.up();
  await page.waitForTimeout(180);
  const released = await transformState(toggle);
  expect(released.x).toBeCloseTo(2,1);
  expect(released.y).toBeCloseTo(2,1);
  await expect(toggle).toHaveAttribute('aria-pressed','false');
  await page.mouse.move(0, 0);
  await page.waitForTimeout(180);
  const rest = await transformState(toggle);
  expect(rest.x).toBeCloseTo(0,1);
  expect(rest.y).toBeCloseTo(0,1);
});

test('ToggleGroup keeps ordinary Tab traversal and explicit multiple-selection semantics', async ({ page }) => {
  const group = page.locator('#toggle-group-demo');
  await expect(group).toHaveAttribute('role','group');
  await expect(group).toHaveAttribute('aria-label','Text styles');
  await expect(group).toHaveAttribute('data-selection-mode','multiple');
  const bold = page.locator('#toggle-group-bold');
  const italic = page.locator('#toggle-group-italic');
  const underline = page.locator('#toggle-group-underline');
  for (const item of [bold,italic,underline]) {
    expect(await item.evaluate((el) => el.tagName)).toBe('BUTTON');
    expect(await item.evaluate((el) => el.tabIndex)).toBe(0);
  }

  await bold.focus();
  await page.keyboard.press('ArrowRight');
  await expect(bold).toBeFocused();
  await expect(bold).toHaveAttribute('aria-pressed','true');
  await page.keyboard.press('Tab');
  await expect(italic).toBeFocused();
  await italic.press('Space');
  await expect(bold).toHaveAttribute('aria-pressed','true');
  await expect(italic).toHaveAttribute('aria-pressed','true');
  await expect(group).toHaveAttribute('data-selected-count','2');
});

test('ToggleGroup single mode permits zero or one selected Toggle without Radio semantics', async ({ page }) => {
  const group = page.locator('#toggle-group-single');
  const left = page.locator('#toggle-group-left');
  const center = page.locator('#toggle-group-center');
  await expect(group).toHaveAttribute('data-selection-mode','single');
  expect(await group.getAttribute('role')).toBe('group');
  expect(await group.getAttribute('aria-multiselectable')).toBeNull();
  await center.click();
  await expect(left).toHaveAttribute('aria-pressed','false');
  await expect(center).toHaveAttribute('aria-pressed','true');
  await expect(group).toHaveAttribute('data-selected-count','1');
  await center.click();
  await expect(center).toHaveAttribute('aria-pressed','false');
  await expect(group).toHaveAttribute('data-state','none-selected');
  await expect(group).toHaveAttribute('data-selected-count','0');
});

test('Toggle disabled, reduced-motion, forced-colors, RTL and narrow-layout invariants hold', async ({ page }) => {
  await page.evaluate(async () => {
    const module = await import('./toggle-group.mjs');
    module.setToggleGroupDisabled(document.querySelector('#toggle-group-demo'), true);
  });
  await expect(page.locator('#toggle-group-demo')).toHaveAttribute('data-state','disabled');
  await expect(page.locator('#toggle-group-bold')).toBeDisabled();

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const toggle = page.locator('#toggle-demo');
  expect((await transformState(toggle)).transitionDuration).toBe('0.001s');

  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'no-preference' });
  await page.goto('/');
  await toggle.focus();
  const forced = await transformState(toggle);
  expect(forced.forcedColorAdjust).toBe('auto');
  expect(parseFloat(forced.outlineWidth)).toBeGreaterThan(0);

  await page.setViewportSize({ width: 375, height: 1200 });
  await page.goto('/');
  await page.evaluate(() => { document.documentElement.dir = 'rtl'; });
  await page.locator('#toggle-group-underline').evaluate((el) => { el.textContent = 'تنسيق طويل للتحقق من الالتفاف'; });
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  expect(await page.locator('#toggle-group-demo').evaluate((el) => getComputedStyle(el).direction)).toBe('rtl');
});
