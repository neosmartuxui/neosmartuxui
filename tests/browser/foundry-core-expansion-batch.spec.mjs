import { test, expect } from '@playwright/test';

const route = '/';

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(route);
  await expect(page.locator('h1')).toContainText('Built for humans');
  await expect(page.locator('#label-slice')).toContainText('core.label');
  await expect(page.locator('#separator-slice')).toContainText('core.separator');
  await expect(page.locator('#progress-slice')).toContainText('core.progress');
  await expect(page.locator('#spinner-slice')).toContainText('core.spinner');
  expect(errors).toEqual([]);
});

test('first Core expansion batch ships its four renderer assets', async ({ request }) => {
  for (const asset of ['label.css', 'separator.css', 'progress.css', 'spinner.css']) {
    const response = await request.get('/' + asset);
    expect(response.ok(), asset).toBeTruthy();
    expect((await response.text()).length, asset).toBeGreaterThan(100);
  }
});

test('Label preserves native association and never becomes a focusable widget', async ({ page }) => {
  const label = page.locator('#label-rest');
  const input = page.locator('#label-input-rest');
  expect(await label.evaluate((el) => el.tagName)).toBe('LABEL');
  expect(await label.getAttribute('for')).toBe('label-input-rest');
  expect(await label.evaluate((el) => el.tabIndex)).toBe(-1);

  await label.click();
  await expect(input).toBeFocused();

  const disabledLabel = page.locator('#label-disabled');
  const disabledInput = page.locator('#label-input-disabled');
  expect(await disabledLabel.evaluate((el) => el.tabIndex)).toBe(-1);
  const disabledBox = await disabledLabel.boundingBox();
  if (!disabledBox) throw new Error('Disabled-associated Label has no pointer box');
  await page.mouse.click(disabledBox.x + disabledBox.width / 2, disabledBox.y + disabledBox.height / 2);
  await expect(disabledInput).not.toBeFocused();
  await expect(disabledInput).toBeDisabled();
});

test('Separator exposes semantic/decorative boundaries without focus or control behavior', async ({ page }) => {
  const horizontal = page.locator('#separator-horizontal');
  expect(await horizontal.evaluate((el) => el.tagName)).toBe('HR');
  expect(await horizontal.evaluate((el) => el.tabIndex)).toBe(-1);

  const vertical = page.locator('.separator-inline-example [role="separator"]');
  await expect(vertical).toHaveAttribute('aria-orientation', 'vertical');
  expect(await vertical.evaluate((el) => el.tabIndex)).toBe(-1);

  const decorative = page.locator('.separator-examples [aria-hidden="true"]');
  await expect(decorative).toHaveAttribute('aria-hidden', 'true');
  expect(await decorative.evaluate((el) => el.tabIndex)).toBe(-1);
});

test('Progress uses native reporting semantics for determinate, indeterminate, and complete state', async ({ page }) => {
  const determinate = page.locator('#progress-determinate');
  expect(await determinate.evaluate((el) => el.tagName)).toBe('PROGRESS');
  await expect(determinate).toHaveAttribute('value', '42');
  await expect(determinate).toHaveAttribute('max', '100');
  expect(await determinate.evaluate((el) => el.tabIndex)).toBe(-1);

  const indeterminate = page.locator('#progress-indeterminate');
  expect(await indeterminate.getAttribute('value')).toBeNull();
  await expect(indeterminate).toHaveAttribute('max', '100');

  const complete = page.locator('#progress-complete');
  await expect(complete).toHaveAttribute('value', '100');
  await expect(complete).toHaveAttribute('data-state', 'complete');
  expect(await complete.evaluate((el) => el.value === el.max)).toBe(true);
});

test('Spinner is visual-only while its named context owns busy semantics', async ({ page }) => {
  const context = page.locator('.spinner-example');
  const spinner = page.locator('.ns-spinner');
  await expect(context).toHaveAttribute('aria-busy', 'true');
  await expect(spinner).toHaveAttribute('aria-hidden', 'true');
  expect(await spinner.evaluate((el) => el.tabIndex)).toBe(-1);
  expect(await spinner.getAttribute('role')).toBeNull();
});

test('reduced motion removes continuous Progress and Spinner travel', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(route);

  const progressAnimation = await page.locator('#progress-indeterminate').evaluate((el) => {
    const style = getComputedStyle(el);
    return { name: style.animationName, duration: style.animationDuration };
  });
  expect(progressAnimation.name).toBe('none');

  const spinnerAnimation = await page.locator('.ns-spinner').evaluate((el) => {
    const style = getComputedStyle(el);
    return { name: style.animationName, style: style.borderStyle };
  });
  expect(spinnerAnimation.name).toBe('none');
  expect(spinnerAnimation.style).toContain('dashed');
});

test('forced colors preserves visible primitives without adding focusability', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto(route);

  for (const selector of ['#separator-horizontal', '#progress-determinate', '.ns-spinner']) {
    const metrics = await page.locator(selector).evaluate((el) => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return { width: rect.width, height: rect.height, forcedColorAdjust: style.forcedColorAdjust };
    });
    expect(metrics.width).toBeGreaterThan(0);
    expect(metrics.height).toBeGreaterThan(0);
    expect(metrics.forcedColorAdjust).toBe('auto');
  }

  expect(await page.locator('#label-rest').evaluate((el) => el.tabIndex)).toBe(-1);
  expect(await page.locator('#progress-determinate').evaluate((el) => el.tabIndex)).toBe(-1);
  expect(await page.locator('.ns-spinner').evaluate((el) => el.tabIndex)).toBe(-1);
});

test('RTL and narrow layouts retain containment for all four primitives', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 1100 });
  await page.goto(route);
  await page.evaluate(() => { document.documentElement.dir = 'rtl'; });

  await page.locator('#label-rest').evaluate((el) => {
    el.textContent = 'اسم مساحة عمل طويل للغاية للتحقق من التفاف النص داخل واجهة صغيرة من اليمين إلى اليسار';
  });

  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);

  for (const selector of ['#label-rest', '#separator-horizontal', '#progress-determinate', '.ns-spinner']) {
    const direction = await page.locator(selector).evaluate((el) => getComputedStyle(el).direction);
    expect(direction).toBe('rtl');
  }
});
