import { test, expect } from '@playwright/test';

const transformState = async (locator) => locator.evaluate((element) => {
  const style = getComputedStyle(element);
  const matrix = style.transform === 'none' ? null : new DOMMatrixReadOnly(style.transform);
  return {
    x: matrix?.m41 ?? 0,
    y: matrix?.m42 ?? 0,
    transitionDuration: style.transitionDuration,
    outlineWidth: style.outlineWidth,
    forcedColorAdjust: style.forcedColorAdjust,
    direction: style.direction
  };
});

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#input-otp-slice')).toContainText('core.input-otp');
  expect(errors).toEqual([]);
});

test('InputOTP deploys its canonical adapter assets and one native logical value authority', async ({ page, request }) => {
  for (const asset of ['input-otp.css', 'input-otp.mjs']) {
    const response = await request.get('/' + asset);
    expect(response.ok(), asset).toBeTruthy();
    expect((await response.text()).length, asset).toBeGreaterThan(100);
  }

  const root = page.locator('#input-otp-demo');
  const input = page.locator('#input-otp-input');
  expect(await root.locator('input').count()).toBe(1);
  expect(await input.evaluate((el) => [
    el.tagName,
    el.type,
    el.autocomplete,
    el.maxLength,
    el.getAttribute('inputmode'),
    el.getAttribute('role'),
    el.getAttribute('tabindex')
  ])).toEqual(['INPUT', 'text', 'one-time-code', 6, 'numeric', null, null]);
  await expect(root).toHaveAttribute('data-state', 'empty');
});

test('InputOTP derives empty partial complete state without auto-submit and accepts consumer-defined strings', async ({ page }) => {
  const root = page.locator('#input-otp-demo');
  const input = page.locator('#input-otp-input');

  await page.evaluate(() => {
    const root = document.querySelector('#input-otp-demo');
    const form = document.createElement('form');
    root.before(form);
    form.append(root);
    window.__otpSubmitCount = 0;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      window.__otpSubmitCount += 1;
    });
  });

  await input.fill('123');
  await expect(root).toHaveAttribute('data-state', 'partial');
  await input.fill('123456');
  await expect(root).toHaveAttribute('data-state', 'complete');
  expect(await page.evaluate(() => window.__otpSubmitCount)).toBe(0);

  await page.evaluate(async () => {
    const module = await import('./input-otp.mjs');
    module.setInputOtpValue(document.querySelector('#input-otp-demo'), 'A1B2C3');
  });
  await expect(input).toHaveValue('A1B2C3');
  await expect(root).toHaveAttribute('data-state', 'complete');
  expect(await page.evaluate(() => window.__otpSubmitCount)).toBe(0);

  await expect(async () => {
    const name = await page.evaluate(async () => {
      const module = await import('./input-otp.mjs');
      try {
        module.setInputOtpValue(document.querySelector('#input-otp-demo'), '1234567');
        return 'none';
      } catch (error) {
        return error?.name;
      }
    });
    expect(name).toBe('RangeError');
  }).toPass();
});

test('InputOTP preserves native editing, ordinary Tab traversal, invalid and disabled states', async ({ page }) => {
  const root = page.locator('#input-otp-demo');
  const input = page.locator('#input-otp-input');

  await input.fill('12AB');
  await input.focus();
  await input.press('Control+A');
  await input.press('Backspace');
  await expect(input).toHaveValue('');
  await expect(root).toHaveAttribute('data-state', 'empty');

  await input.fill('123');
  await input.press('Tab');
  expect(await input.evaluate((el) => document.activeElement === el)).toBe(false);

  await page.evaluate(async () => {
    const module = await import('./input-otp.mjs');
    const root = document.querySelector('#input-otp-demo');
    module.setInputOtpInvalid(root, true);
  });
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(root).toHaveAttribute('data-state', 'invalid');

  await page.evaluate(async () => {
    const module = await import('./input-otp.mjs');
    const root = document.querySelector('#input-otp-demo');
    module.setInputOtpInvalid(root, false);
    module.setInputOtpDisabled(root, true);
  });
  await expect(input).toBeDisabled();
  await expect(root).toHaveAttribute('data-state', 'disabled');
});

test('InputOTP editing surface never borrows button pressure travel', async ({ page }) => {
  const input = page.locator('#input-otp-input');
  await input.hover();
  await page.waitForTimeout(180);
  let state = await transformState(input);
  expect(state.x).toBeCloseTo(0, 2);
  expect(state.y).toBeCloseTo(0, 2);

  const box = await input.boundingBox();
  if (!box) throw new Error('InputOTP input has no pointer box');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(100);
  state = await transformState(input);
  expect(state.x).toBeCloseTo(0, 2);
  expect(state.y).toBeCloseTo(0, 2);
  await page.mouse.up();
});

test('InputOTP retains RTL, reduced-motion, forced-colors and narrow-layout support', async ({ page }) => {
  await page.evaluate(() => { document.documentElement.dir = 'rtl'; });
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  expect((await transformState(page.locator('#input-otp-input'))).direction).toBe('rtl');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const reduced = await page.locator('#input-otp-input').evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(parseFloat(reduced)).toBeLessThanOrEqual(0.001);

  await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'active' });
  await page.goto('/');
  const input = page.locator('#input-otp-input');
  await input.focus();
  const forced = await transformState(input);
  expect(forced.forcedColorAdjust).toBe('auto');
  expect(parseFloat(forced.outlineWidth)).toBeGreaterThan(0);

  await page.emulateMedia({ forcedColors: 'none' });
  await page.setViewportSize({ width: 375, height: 1100 });
  await page.goto('/');
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
});
