import { test, expect } from '@playwright/test';

const route = '/';

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(route);
  await expect(page.locator('#button-group-slice')).toContainText('core.button-group');
  await expect(page.locator('#input-group-slice')).toContainText('core.input-group');
  expect(errors).toEqual([]);
});

test('grouped-control batch ships renderer assets', async ({ request }) => {
  for (const asset of ['button-group.css', 'input-group.css']) {
    const response = await request.get('/' + asset);
    expect(response.ok(), asset).toBeTruthy();
    expect((await response.text()).length, asset).toBeGreaterThan(100);
  }
});

test('ButtonGroup preserves real buttons, ordinary Tab order, and no selection semantics', async ({ page }) => {
  const group = page.locator('#button-group-demo');
  await expect(group).toHaveAttribute('role', 'group');
  await expect(group).toHaveAttribute('aria-label', 'Document actions');
  const buttons = group.locator('button');
  await expect(buttons).toHaveCount(3);
  for (let index = 0; index < 3; index += 1) {
    expect(await buttons.nth(index).evaluate((el) => el.tagName)).toBe('BUTTON');
    expect(await buttons.nth(index).getAttribute('aria-pressed')).toBeNull();
    expect(await buttons.nth(index).evaluate((el) => el.tabIndex)).toBe(0);
  }
  await buttons.nth(0).focus();
  await page.keyboard.press('Tab');
  await expect(buttons.nth(1)).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(buttons.nth(2)).toBeFocused();
});

test('InputGroup leaves value, focus, and validation authority on the native input', async ({ page }) => {
  const group = page.locator('#input-group-rest');
  const input = page.locator('#input-group-handle');
  expect(await input.evaluate((el) => el.tagName)).toBe('INPUT');
  await expect(input).toHaveAttribute('aria-label', 'Workspace handle');
  expect(await group.getAttribute('role')).toBeNull();
  for (const addon of await group.locator('.ns-input-group-addon').all()) await expect(addon).toHaveAttribute('aria-hidden', 'true');

  await input.focus();
  await expect(input).toBeFocused();
  const focus = await group.evaluate((el) => {
    const style = getComputedStyle(el);
    return { outlineWidth: style.outlineWidth, transform: style.transform };
  });
  expect(parseFloat(focus.outlineWidth)).toBeGreaterThan(0);
  expect(focus.transform).toBe('none');

  const invalid = page.locator('#input-group-code');
  await expect(invalid).toHaveAttribute('aria-invalid', 'true');
  await expect(invalid).toHaveAttribute('aria-describedby', 'input-group-error');
  await expect(page.locator('#input-group-error')).toContainText('unsupported characters');

  const disabled = page.locator('#input-group-locked');
  await expect(disabled).toBeDisabled();
  expect(await page.locator('#input-group-disabled').getAttribute('aria-disabled')).toBeNull();
});

test('InputGroup editing surface stays physically stable through pointer contact', async ({ page }) => {
  const input = page.locator('#input-group-handle');
  const before = await input.evaluate((el) => getComputedStyle(el).transform);
  const box = await input.boundingBox();
  if (!box) throw new Error('InputGroup input has no pointer box');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  const hover = await input.evaluate((el) => getComputedStyle(el).transform);
  await page.mouse.down();
  const active = await input.evaluate((el) => getComputedStyle(el).transform);
  await page.mouse.up();
  expect(before).toBe('none');
  expect(hover).toBe('none');
  expect(active).toBe('none');
});

test('reduced motion collapses InputGroup transition timing without removing focus state', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(route);
  const input = page.locator('#input-group-handle');
  await input.focus();
  const metrics = await page.locator('#input-group-rest').evaluate((el) => {
    const style = getComputedStyle(el);
    return { duration: style.transitionDuration, outlineWidth: style.outlineWidth };
  });
  expect(metrics.duration).toBe('0.001s');
  expect(parseFloat(metrics.outlineWidth)).toBeGreaterThan(0);
});

test('forced colors retains grouped-control boundaries and focus', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto(route);
  await page.locator('#input-group-handle').focus();
  for (const selector of ['#button-group-demo', '#input-group-rest']) {
    const metrics = await page.locator(selector).evaluate((el) => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return { width: rect.width, height: rect.height, forcedColorAdjust: style.forcedColorAdjust };
    });
    expect(metrics.width).toBeGreaterThan(0);
    expect(metrics.height).toBeGreaterThan(0);
    expect(metrics.forcedColorAdjust).toBe('auto');
  }
});

test('RTL and narrow layouts keep grouped controls contained', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 1200 });
  await page.goto(route);
  await page.evaluate(() => { document.documentElement.dir = 'rtl'; });
  await page.locator('#button-group-duplicate').evaluate((el) => { el.textContent = 'إجراء ثانوي طويل للتحقق من الالتفاف'; });
  await page.locator('#input-group-handle').fill('اسم-مساحة-عمل-طويل-جداً-للتحقق');
  const metrics = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  expect(await page.locator('#button-group-demo').evaluate((el) => getComputedStyle(el).direction)).toBe('rtl');
  expect(await page.locator('#input-group-rest').evaluate((el) => getComputedStyle(el).direction)).toBe('rtl');
});
