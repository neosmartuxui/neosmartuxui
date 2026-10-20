import { test, expect } from '@playwright/test';

const visualState = async (locator) => locator.evaluate((element) => {
  const style = getComputedStyle(element);
  return {
    transform: style.transform,
    transitionDuration: style.transitionDuration,
    forcedColorAdjust: style.forcedColorAdjust,
    direction: style.direction
  };
});

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#alert-dialog-slice')).toContainText('core.alert-dialog');
  expect(errors).toEqual([]);
});

test('AlertDialog deploys a described native alertdialog without dialog tabindex', async ({ page, request }) => {
  for (const asset of ['alert-dialog.css', 'alert-dialog.mjs']) {
    const response = await request.get('/' + asset);
    expect(response.ok(), asset).toBeTruthy();
    expect((await response.text()).length, asset).toBeGreaterThan(100);
  }
  const trigger = page.locator('#alert-dialog-trigger');
  const dialog = page.locator('#alert-dialog-surface');
  await expect(trigger).toHaveAttribute('aria-haspopup','dialog');
  await expect(trigger).toHaveAttribute('aria-controls','alert-dialog-surface');
  await expect(dialog).toHaveAttribute('role','alertdialog');
  await expect(dialog).toHaveAttribute('aria-modal','true');
  await expect(dialog).toHaveAttribute('aria-labelledby','alert-dialog-title');
  await expect(dialog).toHaveAttribute('aria-describedby','alert-dialog-message');
  await expect(dialog).not.toHaveAttribute('tabindex',/.+/);
  await expect(dialog).toHaveJSProperty('open',false);
});

test('AlertDialog opens modally, focuses the least-destructive response, contains focus, and Escape restores the invoker', async ({ page }) => {
  const root = page.locator('#alert-dialog-demo');
  const trigger = page.locator('#alert-dialog-trigger');
  const dialog = page.locator('#alert-dialog-surface');
  await trigger.click();
  await expect(root).toHaveAttribute('data-state','open');
  await expect(dialog).toHaveJSProperty('open',true);
  expect(await dialog.evaluate((element) => element.matches(':modal'))).toBe(true);
  await expect(page.locator('#alert-dialog-cancel')).toBeFocused();

  for (let index = 0; index < 6; index += 1) {
    await page.keyboard.press(index % 2 ? 'Shift+Tab' : 'Tab');
    expect(await page.evaluate(() => {
      const dialog = document.querySelector('#alert-dialog-surface');
      return Boolean(dialog?.contains(document.activeElement));
    })).toBe(true);
    await expect(page.locator('#alert-dialog-after')).not.toBeFocused();
  }

  await page.keyboard.press('Escape');
  await expect(root).toHaveAttribute('data-state','closed');
  await expect(dialog).toHaveJSProperty('open',false);
  await expect(trigger).toBeFocused();
});

test('AlertDialog explicit and programmatic close share focus restoration', async ({ page }) => {
  const trigger = page.locator('#alert-dialog-trigger');
  await trigger.click();
  await page.locator('#alert-dialog-cancel').click();
  await expect(page.locator('#alert-dialog-surface')).toHaveJSProperty('open',false);
  await expect(trigger).toBeFocused();

  await page.evaluate(async () => {
    const module = await import('./alert-dialog.mjs');
    const root = document.querySelector('#alert-dialog-demo');
    const after = document.querySelector('#alert-dialog-after');
    after.focus();
    module.setAlertDialogOpen(root, true, { invoker: after });
  });
  await expect(page.locator('#alert-dialog-cancel')).toBeFocused();
  await page.evaluate(async () => {
    const module = await import('./alert-dialog.mjs');
    module.setAlertDialogOpen(document.querySelector('#alert-dialog-demo'), false);
  });
  await expect(page.locator('#alert-dialog-after')).toBeFocused();
});

test('AlertDialog rejects ambiguous naming, missing prompt description, and destructive choice without a safer response', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const module = await import('./alert-dialog.mjs');
    const root = document.querySelector('#alert-dialog-demo');
    const dialog = document.querySelector('#alert-dialog-surface');
    const cancel = document.querySelector('#alert-dialog-cancel');
    const failures = {};

    dialog.setAttribute('aria-label','Duplicate name');
    try { module.syncAlertDialogState(root); } catch (error) { failures.ambiguous = error.message; }
    dialog.removeAttribute('aria-label');

    const describedBy = dialog.getAttribute('aria-describedby');
    dialog.removeAttribute('aria-describedby');
    try { module.syncAlertDialogState(root); } catch (error) { failures.description = error.message; }
    dialog.setAttribute('aria-describedby', describedBy);

    cancel.removeAttribute('data-alert-dialog-least-destructive');
    try { module.syncAlertDialogState(root); } catch (error) { failures.safeResponse = error.message; }
    cancel.setAttribute('data-alert-dialog-least-destructive','');

    return failures;
  });
  expect(result.ambiguous).toContain('exactly one accessible-name source');
  expect(result.description).toContain('requires aria-describedby');
  expect(result.safeResponse).toContain('requires exactly one least-destructive response');
});

test('AlertDialog surface stays stable while response Buttons own pressure', async ({ page }) => {
  await page.locator('#alert-dialog-trigger').click();
  const dialog = page.locator('#alert-dialog-surface');
  const cancel = page.locator('#alert-dialog-cancel');
  expect((await visualState(dialog)).transform).toBe('none');
  await cancel.hover();
  expect((await visualState(cancel)).transform).not.toBe('none');
  const box = await dialog.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  expect((await visualState(dialog)).transform).toBe('none');
  await page.mouse.up();
  await page.keyboard.press('Escape');
});

test('AlertDialog inherits reduced motion and forced colors while preserving RTL and narrow containment', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('#alert-dialog-trigger').click();
  const dialog = page.locator('#alert-dialog-surface');
  expect(parseFloat((await visualState(dialog)).transitionDuration)).toBeLessThanOrEqual(0.001);
  await page.keyboard.press('Escape');

  await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'active' });
  await page.locator('#alert-dialog-trigger').click();
  expect((await visualState(dialog)).forcedColorAdjust).toBe('auto');
  await page.keyboard.press('Escape');

  await page.emulateMedia({ forcedColors: 'none' });
  await page.setViewportSize({ width: 360, height: 640 });
  await page.locator('html').evaluate((element) => element.setAttribute('dir','rtl'));
  await page.locator('#alert-dialog-trigger').click();
  expect((await visualState(dialog)).direction).toBe('rtl');
  const box = await dialog.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(360);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(640);
});
