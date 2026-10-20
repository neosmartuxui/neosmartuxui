import { test, expect } from '@playwright/test';

const visualState = async (locator) => locator.evaluate((element) => {
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return {
    transitionDuration: style.transitionDuration,
    forcedColorAdjust: style.forcedColorAdjust,
    transform: style.transform,
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
  await expect(page.locator('#hover-card-slice')).toContainText('core.hover-card');
  expect(errors).toEqual([]);
});

test('HoverCard deploys one semantic trigger and one non-interactive read-only surface', async ({ page, request }) => {
  for (const asset of ['hover-card.css', 'hover-card.mjs']) {
    const response = await request.get('/' + asset);
    expect(response.ok(), asset).toBeTruthy();
    expect((await response.text()).length, asset).toBeGreaterThan(100);
  }

  const trigger = page.locator('#hover-card-trigger');
  const surface = page.locator('#hover-card-surface');
  await expect(trigger).toHaveAttribute('href', '#principles');
  await expect(trigger).toHaveAttribute('aria-details', 'hover-card-surface');
  await expect(trigger).toHaveAttribute('data-hover-card-state', 'closed');
  await expect(surface).toHaveAttribute('data-state', 'closed');
  await expect(surface).toHaveAttribute('data-hover-card-side', 'block-end');
  await expect(surface).toHaveAttribute('data-hover-card-align', 'start');
  await expect(surface).not.toHaveAttribute('role', /.+/);
  await expect(surface).not.toHaveAttribute('aria-modal', /.+/);
  await expect(surface).not.toHaveAttribute('aria-haspopup', /.+/);
  await expect(surface).not.toHaveAttribute('aria-expanded', /.+/);
  await expect(surface.locator('button, a[href], input, select, textarea, summary, [contenteditable="true"], [tabindex]:not([tabindex="-1"])')).toHaveCount(0);
});

test('HoverCard focus reveal preserves ordinary Tab traversal and closes after focus leaves', async ({ page }) => {
  const trigger = page.locator('#hover-card-trigger');
  const surface = page.locator('#hover-card-surface');
  const after = page.locator('#hover-card-after');

  await trigger.focus();
  await expect(trigger).toBeFocused();
  await expect(surface).toHaveAttribute('data-state', 'open');
  await expect(trigger).toHaveAttribute('data-hover-card-state', 'open');

  await page.keyboard.press('Tab');
  await expect(after).toBeFocused();
  await expect(surface).toHaveAttribute('data-state', 'closed');
  await expect(trigger).toHaveAttribute('data-hover-card-state', 'closed');
});

test('HoverCard pointer transfer keeps the preview open until the complete hover session ends', async ({ page }) => {
  const trigger = page.locator('#hover-card-trigger');
  const surface = page.locator('#hover-card-surface');

  await trigger.hover();
  await expect(surface).toHaveAttribute('data-state', 'open');

  await surface.hover();
  await page.waitForTimeout(140);
  await expect(surface).toHaveAttribute('data-state', 'open');

  await page.mouse.move(0, 0);
  await expect(surface).toHaveAttribute('data-state', 'closed');
});

test('HoverCard Escape dismissal preserves focus, suppresses same-session reopen, and resets on a new session', async ({ page }) => {
  const trigger = page.locator('#hover-card-trigger');
  const surface = page.locator('#hover-card-surface');
  const after = page.locator('#hover-card-after');

  await trigger.focus();
  await expect(surface).toHaveAttribute('data-state', 'open');
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await expect(surface).toHaveAttribute('data-state', 'dismissed');
  await expect(trigger).toHaveAttribute('data-hover-card-state', 'dismissed');

  await page.waitForTimeout(420);
  await expect(surface).toHaveAttribute('data-state', 'dismissed');

  await page.keyboard.press('Tab');
  await expect(after).toBeFocused();
  await expect(surface).toHaveAttribute('data-state', 'closed');

  await page.keyboard.press('Shift+Tab');
  await expect(trigger).toBeFocused();
  await expect(surface).toHaveAttribute('data-state', 'open');
});

test('HoverCard ignores touch hover synthesis and does not install activation authority', async ({ page }) => {
  const trigger = page.locator('#hover-card-trigger');
  const surface = page.locator('#hover-card-surface');

  const result = await page.evaluate(() => {
    const trigger = document.querySelector('#hover-card-trigger');
    const surface = document.querySelector('#hover-card-surface');
    let prevented = false;
    for (const type of ['pointerenter', 'pointerleave']) {
      const event = new PointerEvent(type, { pointerType: 'touch', bubbles: false, cancelable: true });
      trigger.dispatchEvent(event);
      prevented ||= event.defaultPrevented;
    }
    return {
      prevented,
      href: trigger.getAttribute('href'),
      state: surface.dataset.state
    };
  });

  expect(result.prevented).toBe(false);
  expect(result.href).toBe('#principles');
  expect(result.state).toBe('closed');
  await page.waitForTimeout(420);
  await expect(surface).toHaveAttribute('data-state', 'closed');
  await expect(trigger).toHaveAttribute('data-hover-card-state', 'closed');
});

test('HoverCard rejects interactive, Tooltip, popup, and invalid placement authoring', async ({ page }) => {
  const failures = await page.evaluate(async () => {
    const module = await import('./hover-card.mjs');
    const trigger = document.querySelector('#hover-card-trigger');
    const surface = document.querySelector('#hover-card-surface');
    const result = {};

    const button = document.createElement('button');
    button.type = 'button';
    surface.append(button);
    try { module.syncHoverCardState(trigger, 'closed'); } catch (error) { result.interactive = error.message; }
    button.remove();

    surface.setAttribute('role', 'tooltip');
    try { module.syncHoverCardState(trigger, 'closed'); } catch (error) { result.tooltip = error.message; }
    surface.removeAttribute('role');

    surface.setAttribute('aria-haspopup', 'dialog');
    try { module.syncHoverCardState(trigger, 'closed'); } catch (error) { result.popup = error.message; }
    surface.removeAttribute('aria-haspopup');

    surface.dataset.hoverCardSide = 'left';
    try { module.syncHoverCardState(trigger, 'closed'); } catch (error) { result.side = error.message; }
    surface.dataset.hoverCardSide = 'block-end';

    try { module.setHoverCardPlacement(trigger, 'block-end', 'middle'); } catch (error) { result.align = error.message; }

    return result;
  });

  expect(failures.interactive).toContain('must remain non-interactive');
  expect(failures.tooltip).toContain('must not manufacture Tooltip');
  expect(failures.popup).toContain('must not claim aria-haspopup');
  expect(failures.side).toContain('logical data-hover-card-side');
  expect(failures.align).toContain('align must be start, center, or end');
});

test('HoverCard logical inline placement preserves inline-end meaning in RTL', async ({ page }) => {
  const trigger = page.locator('#hover-card-trigger');
  const surface = page.locator('#hover-card-surface');

  await page.evaluate(async () => {
    const module = await import('./hover-card.mjs');
    const trigger = document.querySelector('#hover-card-trigger');
    module.setHoverCardPlacement(trigger, 'inline-end', 'start');
    module.syncHoverCardState(trigger, 'open');
  });
  const triggerLtr = await trigger.boundingBox();
  const cardLtr = await surface.boundingBox();
  expect(cardLtr.x).toBeGreaterThanOrEqual(triggerLtr.x + triggerLtr.width - 1);

  await page.locator('html').evaluate((element) => element.setAttribute('dir', 'rtl'));
  await page.evaluate(async () => {
    const module = await import('./hover-card.mjs');
    const trigger = document.querySelector('#hover-card-trigger');
    module.setHoverCardPlacement(trigger, 'inline-end', 'start');
    module.syncHoverCardState(trigger, 'open');
  });
  const triggerRtl = await trigger.boundingBox();
  const cardRtl = await surface.boundingBox();
  await expect(surface).toHaveAttribute('data-hover-card-side', 'inline-end');
  expect(cardRtl.x + cardRtl.width).toBeLessThanOrEqual(triggerRtl.x + 1);
});

test('HoverCard stays non-pressable with reduced motion, forced colors, and narrow viewport containment', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 360, height: 640 });

  const trigger = page.locator('#hover-card-trigger');
  const surface = page.locator('#hover-card-surface');
  await trigger.focus();
  await expect(surface).toHaveAttribute('data-state', 'open');

  const reduced = await visualState(surface);
  expect(parseFloat(reduced.transitionDuration)).toBeLessThanOrEqual(0.001);
  expect(reduced.transform).toBe('none');
  expect(reduced.left).toBeGreaterThanOrEqual(0);
  expect(reduced.right).toBeLessThanOrEqual(360);
  expect(reduced.top).toBeGreaterThanOrEqual(0);
  expect(reduced.bottom).toBeLessThanOrEqual(640);

  const box = await surface.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  expect((await visualState(surface)).transform).toBe('none');
  await page.mouse.up();

  await page.keyboard.press('Escape');
  await page.mouse.move(0, 0);
  await page.keyboard.press('Tab');
  await expect(surface).toHaveAttribute('data-state', 'closed');
  await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'active' });
  await page.keyboard.press('Shift+Tab');
  await expect(surface).toHaveAttribute('data-state', 'open');
  expect((await visualState(surface)).forcedColorAdjust).toBe('auto');
});
