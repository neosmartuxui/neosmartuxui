import { test, expect } from '@playwright/test';

const visualState = async (locator) => locator.evaluate((element) => {
  const style = getComputedStyle(element);
  return {
    transform: style.transform,
    transitionDuration: style.transitionDuration,
    forcedColorAdjust: style.forcedColorAdjust,
    direction: style.direction,
    closedX: style.getPropertyValue('--ns-drawer-closed-x').trim(),
    closedY: style.getPropertyValue('--ns-drawer-closed-y').trim()
  };
});

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#drawer-slice')).toContainText('core.drawer');
  expect(errors).toEqual([]);
});

test('Drawer deploys a named native modal with logical placement and implemented assets', async ({ page, request }) => {
  for (const asset of ['drawer.css', 'drawer.mjs']) {
    const response = await request.get('/' + asset);
    expect(response.ok(), asset).toBeTruthy();
    expect((await response.text()).length, asset).toBeGreaterThan(100);
  }
  const root = page.locator('#drawer-demo');
  const trigger = page.locator('#drawer-trigger');
  const dialog = page.locator('#drawer-surface');
  await expect(root).toHaveAttribute('data-state','closed');
  await expect(root).toHaveAttribute('data-drawer-placement','inline-end');
  await expect(trigger).toHaveAttribute('aria-haspopup','dialog');
  await expect(trigger).toHaveAttribute('aria-controls','drawer-surface');
  await expect(dialog).toHaveAttribute('aria-modal','true');
  await expect(dialog).toHaveAttribute('aria-labelledby','drawer-title');
  await expect(dialog).toHaveAttribute('aria-describedby','drawer-description');
  await expect(dialog).toHaveAttribute('tabindex','-1');
  await expect(dialog).toHaveAttribute('data-drawer-placement','inline-end');
  await expect(dialog).toHaveJSProperty('open',false);
});

test('Drawer opens modally, contains focus, and Escape restores the invoker', async ({ page }) => {
  const root = page.locator('#drawer-demo');
  const trigger = page.locator('#drawer-trigger');
  const dialog = page.locator('#drawer-surface');
  await trigger.click();
  await expect(root).toHaveAttribute('data-state','open');
  await expect(dialog).toHaveJSProperty('open',true);
  expect(await dialog.evaluate((element) => element.matches(':modal'))).toBe(true);
  await expect(page.locator('#drawer-close')).toBeFocused();

  for (let index = 0; index < 6; index += 1) {
    await page.keyboard.press(index % 2 ? 'Shift+Tab' : 'Tab');
    expect(await page.evaluate(() => document.querySelector('#drawer-surface')?.contains(document.activeElement))).toBe(true);
    await expect(page.locator('#drawer-after')).not.toBeFocused();
  }

  await page.keyboard.press('Escape');
  await expect(root).toHaveAttribute('data-state','closed');
  await expect(dialog).toHaveJSProperty('open',false);
  await expect(trigger).toBeFocused();
});

test('Drawer explicit and programmatic close share focus restoration', async ({ page }) => {
  const trigger = page.locator('#drawer-trigger');
  await trigger.click();
  await page.locator('#drawer-close').click();
  await expect(page.locator('#drawer-surface')).toHaveJSProperty('open',false);
  await expect(trigger).toBeFocused();

  await page.evaluate(async () => {
    const module = await import('./drawer.mjs');
    const root = document.querySelector('#drawer-demo');
    const after = document.querySelector('#drawer-after');
    after.focus();
    module.setDrawerOpen(root, true, { invoker: after });
  });
  await expect(page.locator('#drawer-close')).toBeFocused();
  await page.evaluate(async () => {
    const module = await import('./drawer.mjs');
    module.setDrawerOpen(document.querySelector('#drawer-demo'), false);
  });
  await expect(page.locator('#drawer-after')).toBeFocused();
});

test('Drawer rejects ambiguous naming, invalid placement, and non-modal open state', async ({ page }) => {
  const failures = await page.evaluate(async () => {
    const module = await import('./drawer.mjs');
    const root = document.querySelector('#drawer-demo');
    const dialog = document.querySelector('#drawer-surface');
    const result = {};

    dialog.setAttribute('aria-label','Duplicate name');
    try { module.syncDrawerState(root); } catch (error) { result.ambiguous = error.message; }
    dialog.removeAttribute('aria-label');

    dialog.dataset.drawerPlacement = 'left';
    try { module.syncDrawerState(root); } catch (error) { result.placement = error.message; }
    dialog.dataset.drawerPlacement = 'inline-end';

    dialog.setAttribute('open','');
    try { module.syncDrawerState(root); } catch (error) { result.nonModal = error.message; }
    dialog.removeAttribute('open');

    return result;
  });
  expect(failures.ambiguous).toContain('exactly one accessible-name source');
  expect(failures.placement).toContain('logical data-drawer-placement');
  expect(failures.nonModal).toContain('showModal');
});

test('Drawer maps logical inline edges in RTL without changing semantic placement', async ({ page }) => {
  const dialog = page.locator('#drawer-surface');
  await page.evaluate(async () => {
    const module = await import('./drawer.mjs');
    module.setDrawerPlacement(document.querySelector('#drawer-demo'), 'inline-end');
  });
  expect((await visualState(dialog)).closedX).toBe('100%');

  await page.locator('html').evaluate((element) => element.setAttribute('dir','rtl'));
  await expect(dialog).toHaveAttribute('data-drawer-placement','inline-end');
  expect((await visualState(dialog)).closedX).toBe('-100%');

  await page.evaluate(async () => {
    const module = await import('./drawer.mjs');
    module.setDrawerPlacement(document.querySelector('#drawer-demo'), 'inline-start');
  });
  await expect(dialog).toHaveAttribute('data-drawer-placement','inline-start');
  expect((await visualState(dialog)).closedX).toBe('100%');

  await page.evaluate(async () => {
    const module = await import('./drawer.mjs');
    module.setDrawerPlacement(document.querySelector('#drawer-demo'), 'block-start');
  });
  expect((await visualState(dialog)).closedY).toBe('-100%');
});

test('Drawer swipe dismissal requires intentional outward movement on the dedicated handle', async ({ page }) => {
  const trigger = page.locator('#drawer-trigger');
  const dialog = page.locator('#drawer-surface');
  const handle = page.locator('[data-drawer-swipe-handle]');

  await trigger.click();
  const handleBox = await handle.boundingBox();
  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(handleBox.x + handleBox.width / 2 + 20, handleBox.y + handleBox.height / 2);
  await page.mouse.up();
  await expect(dialog).toHaveJSProperty('open',true);

  const surfaceBox = await dialog.boundingBox();
  await page.mouse.move(surfaceBox.x + surfaceBox.width / 2, surfaceBox.y + surfaceBox.height / 2);
  await page.mouse.wheel(0, 120);
  await expect(dialog).toHaveJSProperty('open',true);

  const handleBox2 = await handle.boundingBox();
  await page.mouse.move(handleBox2.x + handleBox2.width / 2, handleBox2.y + handleBox2.height / 2);
  await page.mouse.down();
  await page.mouse.move(handleBox2.x + handleBox2.width / 2 + 160, handleBox2.y + handleBox2.height / 2);
  await page.mouse.up();
  await expect(dialog).toHaveJSProperty('open',false);
  await expect(trigger).toBeFocused();
});

test('Drawer surface avoids Button pressure while preserving reduced motion, forced colors, and narrow containment', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 360, height: 640 });
  await page.locator('#drawer-trigger').click();
  const dialog = page.locator('#drawer-surface');
  const close = page.locator('#drawer-close');
  const before = await visualState(dialog);
  expect(parseFloat(before.transitionDuration)).toBeLessThanOrEqual(0.001);
  await close.hover();
  expect((await visualState(close)).transform).not.toBe('none');
  const box = await dialog.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  expect((await visualState(dialog)).transform).toBe(before.transform);
  await page.mouse.up();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(360);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(640);
  await page.keyboard.press('Escape');

  await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'active' });
  await page.locator('#drawer-trigger').click();
  expect((await visualState(dialog)).forcedColorAdjust).toBe('auto');
  await page.keyboard.press('Escape');
});
