import { test, expect } from '@playwright/test';

const state = async (locator) => locator.evaluate((element) => {
  const style = getComputedStyle(element);
  return {
    transform: style.transform,
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
  await expect(page.locator('#dialog-slice')).toContainText('core.dialog');
  expect(errors).toEqual([]);
});

test('Dialog deploys a real named native modal with implemented assets', async ({ page, request }) => {
  for (const asset of ['dialog.css', 'dialog.mjs']) {
    const response = await request.get('/' + asset);
    expect(response.ok(), asset).toBeTruthy();
    expect((await response.text()).length, asset).toBeGreaterThan(100);
  }
  const root = page.locator('#dialog-demo');
  const trigger = page.locator('#dialog-trigger');
  const dialog = page.locator('#dialog-surface');
  await expect(root).toHaveAttribute('data-state','closed');
  await expect(trigger).toHaveAttribute('aria-haspopup','dialog');
  await expect(trigger).toHaveAttribute('aria-controls','dialog-surface');
  await expect(dialog).toHaveAttribute('aria-modal','true');
  await expect(dialog).toHaveAttribute('aria-labelledby','dialog-title');
  await expect(dialog).toHaveAttribute('aria-describedby','dialog-description');
  await expect(dialog).toHaveJSProperty('open',false);
});

test('Dialog opens with showModal, contains focus, and Escape returns focus to the invoker', async ({ page }) => {
  const root = page.locator('#dialog-demo');
  const trigger = page.locator('#dialog-trigger');
  const dialog = page.locator('#dialog-surface');
  await trigger.focus();
  await trigger.click();
  await expect(root).toHaveAttribute('data-state','open');
  await expect(dialog).toHaveJSProperty('open',true);
  expect(await dialog.evaluate((element) => element.matches(':modal'))).toBe(true);
  await expect(page.locator('#dialog-close')).toBeFocused();

  for (let index = 0; index < 6; index += 1) {
    await page.keyboard.press(index % 2 ? 'Shift+Tab' : 'Tab');
    expect(await page.evaluate(() => {
      const dialog = document.querySelector('#dialog-surface');
      return Boolean(dialog?.contains(document.activeElement));
    })).toBe(true);
    await expect(page.locator('#dialog-after')).not.toBeFocused();
  }

  await page.keyboard.press('Escape');
  await expect(root).toHaveAttribute('data-state','closed');
  await expect(dialog).toHaveJSProperty('open',false);
  await expect(trigger).toBeFocused();
});

test('Dialog explicit and programmatic close share focus restoration', async ({ page }) => {
  const trigger = page.locator('#dialog-trigger');
  await trigger.click();
  await page.locator('#dialog-close').click();
  await expect(page.locator('#dialog-surface')).toHaveJSProperty('open',false);
  await expect(trigger).toBeFocused();

  await page.evaluate(async () => {
    const module = await import('./dialog.mjs');
    const root = document.querySelector('#dialog-demo');
    const after = document.querySelector('#dialog-after');
    after.focus();
    module.setDialogOpen(root, true, { invoker: after });
  });
  await expect(page.locator('#dialog-close')).toBeFocused();
  await page.evaluate(async () => {
    const module = await import('./dialog.mjs');
    module.setDialogOpen(document.querySelector('#dialog-demo'), false);
  });
  await expect(page.locator('#dialog-after')).toBeFocused();
});

test('Dialog rejects ambiguous naming and non-modal open state', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const module = await import('./dialog.mjs');
    const root = document.querySelector('#dialog-demo');
    const dialog = document.querySelector('#dialog-surface');
    const failures = {};
    dialog.setAttribute('aria-label','Duplicate name');
    try { module.syncDialogState(root); } catch (error) { failures.ambiguous = error.message; }
    dialog.removeAttribute('aria-label');
    dialog.setAttribute('open','');
    try { module.syncDialogState(root); } catch (error) { failures.nonModal = error.message; }
    dialog.removeAttribute('open');
    return failures;
  });
  expect(result.ambiguous).toContain('exactly one accessible-name source');
  expect(result.nonModal).toContain('showModal');
});

test('Dialog surface remains stable while composed Buttons own pressure', async ({ page }) => {
  const trigger = page.locator('#dialog-trigger');
  await trigger.hover();
  expect((await state(trigger)).transform).not.toBe('none');
  await trigger.click();
  const dialog = page.locator('#dialog-surface');
  expect((await state(dialog)).transform).toBe('none');
  const box = await dialog.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  expect((await state(dialog)).transform).toBe('none');
  await page.mouse.up();
  await page.keyboard.press('Escape');
});

test('Dialog preserves reduced motion, forced colors, RTL and narrow containment', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('#dialog-trigger').click();
  const dialog = page.locator('#dialog-surface');
  const reduced = await state(dialog);
  expect(parseFloat(reduced.transitionDuration)).toBeLessThanOrEqual(0.001);
  await page.keyboard.press('Escape');

  await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'active' });
  await page.locator('#dialog-trigger').click();
  const forced = await state(dialog);
  expect(forced.forcedColorAdjust).toBe('auto');
  await page.keyboard.press('Escape');

  await page.emulateMedia({ forcedColors: 'none' });
  await page.setViewportSize({ width: 360, height: 640 });
  await page.locator('html').evaluate((element) => element.setAttribute('dir', 'rtl'));
  await page.locator('#dialog-trigger').click();
  expect((await state(dialog)).direction).toBe('rtl');
  const box = await dialog.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(360);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(640);
});
