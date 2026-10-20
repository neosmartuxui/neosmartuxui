import { test, expect } from '@playwright/test';

const visualState = async (locator) => locator.evaluate((element) => {
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return {
    transform: style.transform,
    transitionDuration: style.transitionDuration,
    forcedColorAdjust: style.forcedColorAdjust,
    direction: style.direction,
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height
  };
});

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#popover-slice')).toContainText('core.popover');
  expect(errors).toEqual([]);
});

test('Popover deploys an explicitly invoked native non-modal surface and implemented assets', async ({ page, request }) => {
  for (const asset of ['popover.css', 'popover.mjs']) {
    const response = await request.get('/' + asset);
    expect(response.ok(), asset).toBeTruthy();
    expect((await response.text()).length, asset).toBeGreaterThan(100);
  }

  const root = page.locator('#popover-demo');
  const trigger = page.locator('#popover-trigger');
  const surface = page.locator('#popover-surface');
  await expect(root).toHaveAttribute('data-state', 'closed');
  await expect(root).toHaveAttribute('data-popover-side', 'block-end');
  await expect(root).toHaveAttribute('data-popover-align', 'start');
  await expect(trigger).toHaveAttribute('popovertarget', 'popover-surface');
  await expect(trigger).toHaveAttribute('aria-controls', 'popover-surface');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(surface).toHaveAttribute('popover', 'auto');
  await expect(surface).not.toHaveAttribute('aria-modal', /.+/);
  await expect(surface).not.toHaveAttribute('role', /^(dialog|alertdialog|menu|menubar|tooltip)$/);
  expect(await surface.evaluate((element) => element.matches(':popover-open'))).toBe(false);
});

test('Popover opens without trapping focus and native outside light dismiss preserves outside focus', async ({ page }) => {
  const trigger = page.locator('#popover-trigger');
  const surface = page.locator('#popover-surface');
  const after = page.locator('#popover-after');

  await trigger.focus();
  await trigger.press('Enter');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(surface).toHaveAttribute('data-state', 'open');
  expect(await surface.evaluate((element) => element.matches(':popover-open'))).toBe(true);
  await expect(trigger).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.locator('#popover-close')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#popover-secondary-action')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(after).toBeFocused();
  expect(await surface.evaluate((element) => element.matches(':popover-open'))).toBe(true);

  await after.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  expect(await surface.evaluate((element) => element.matches(':popover-open'))).toBe(false);
  await expect(after).toBeFocused();
});

test('Popover Escape dismissal restores the valid invoker only when focus would be hidden', async ({ page }) => {
  const trigger = page.locator('#popover-trigger');
  const surface = page.locator('#popover-surface');

  await trigger.click();
  await page.locator('#popover-secondary-action').focus();
  await page.keyboard.press('Escape');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  expect(await surface.evaluate((element) => element.matches(':popover-open'))).toBe(false);
  await expect(trigger).toBeFocused();

  await trigger.click();
  await page.locator('#popover-after').focus();
  await page.keyboard.press('Escape');
  await expect(page.locator('#popover-after')).toBeFocused();
});

test('Popover explicit and programmatic close converge on one state and safe restoration law', async ({ page }) => {
  const trigger = page.locator('#popover-trigger');
  const surface = page.locator('#popover-surface');

  await trigger.click();
  await page.locator('#popover-secondary-action').focus();
  await page.locator('#popover-close').click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  expect(await surface.evaluate((element) => element.matches(':popover-open'))).toBe(false);
  await expect(trigger).toBeFocused();

  await page.evaluate(async () => {
    const module = await import('./popover.mjs');
    const root = document.querySelector('#popover-demo');
    const after = document.querySelector('#popover-after');
    module.setPopoverOpen(root, true, { invoker: after });
    document.querySelector('#popover-secondary-action').focus();
  });
  await expect(surface).toHaveAttribute('data-state', 'open');
  await page.evaluate(async () => {
    const module = await import('./popover.mjs');
    module.setPopoverOpen(document.querySelector('#popover-demo'), false);
  });
  await expect(surface).toHaveAttribute('data-state', 'closed');
  await expect(page.locator('#popover-after')).toBeFocused();
});

test('Popover rejects modal, menu-like, invalid target, and invalid placement authoring', async ({ page }) => {
  const failures = await page.evaluate(async () => {
    const module = await import('./popover.mjs');
    const root = document.querySelector('#popover-demo');
    const trigger = document.querySelector('#popover-trigger');
    const surface = document.querySelector('#popover-surface');
    const result = {};

    surface.setAttribute('aria-modal', 'true');
    try { module.syncPopoverState(root); } catch (error) { result.modal = error.message; }
    surface.removeAttribute('aria-modal');

    surface.setAttribute('role', 'menu');
    try { module.syncPopoverState(root); } catch (error) { result.menu = error.message; }
    surface.removeAttribute('role');

    trigger.setAttribute('popovertarget', 'wrong-target');
    try { module.syncPopoverState(root); } catch (error) { result.target = error.message; }
    trigger.setAttribute('popovertarget', 'popover-surface');

    surface.dataset.popoverSide = 'left';
    try { module.syncPopoverState(root); } catch (error) { result.side = error.message; }
    surface.dataset.popoverSide = 'block-end';

    try { module.setPopoverPlacement(root, 'block-end', 'middle'); } catch (error) { result.align = error.message; }

    return result;
  });

  expect(failures.modal).toContain('must not claim aria-modal');
  expect(failures.menu).toContain('must not manufacture');
  expect(failures.target).toContain('popovertarget must reference');
  expect(failures.side).toContain('logical data-popover-side');
  expect(failures.align).toContain('align must be start, center, or end');
});

test('Popover logical inline placement preserves meaning in RTL', async ({ page }) => {
  const trigger = page.locator('#popover-trigger');
  const surface = page.locator('#popover-surface');

  await page.evaluate(async () => {
    const module = await import('./popover.mjs');
    const root = document.querySelector('#popover-demo');
    module.setPopoverPlacement(root, 'inline-end', 'start');
    module.setPopoverOpen(root, true);
  });
  const triggerLtr = await trigger.boundingBox();
  const popoverLtr = await surface.boundingBox();
  expect(popoverLtr.x).toBeGreaterThanOrEqual(triggerLtr.x + triggerLtr.width - 1);
  await page.evaluate(async () => {
    const module = await import('./popover.mjs');
    module.setPopoverOpen(document.querySelector('#popover-demo'), false, { returnFocus: false });
  });

  await page.locator('html').evaluate((element) => element.setAttribute('dir', 'rtl'));
  await page.evaluate(async () => {
    const module = await import('./popover.mjs');
    const root = document.querySelector('#popover-demo');
    module.setPopoverPlacement(root, 'inline-end', 'start');
    module.setPopoverOpen(root, true);
  });
  const triggerRtl = await trigger.boundingBox();
  const popoverRtl = await surface.boundingBox();
  await expect(surface).toHaveAttribute('data-popover-side', 'inline-end');
  expect(popoverRtl.x + popoverRtl.width).toBeLessThanOrEqual(triggerRtl.x + 1);
});

test('Popover surface stays non-pressable while preserving reduced motion, forced colors, and narrow containment', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 360, height: 640 });
  const trigger = page.locator('#popover-trigger');
  const surface = page.locator('#popover-surface');

  await trigger.click();
  const surfaceBefore = await visualState(surface);
  expect(parseFloat(surfaceBefore.transitionDuration)).toBeLessThanOrEqual(0.001);
  expect(surfaceBefore.transform).toBe('none');

  await trigger.hover();
  const triggerHoverTransform = await trigger.evaluate((element) => getComputedStyle(element).transform);
  expect(triggerHoverTransform).not.toBe('none');

  const box = await surface.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  expect((await visualState(surface)).transform).toBe('none');
  await page.mouse.up();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(360);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(640);

  await page.keyboard.press('Escape');
  await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'active' });
  await trigger.click();
  expect((await visualState(surface)).forcedColorAdjust).toBe('auto');
  await page.keyboard.press('Escape');
});
