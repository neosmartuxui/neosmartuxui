import { test, expect } from '@playwright/test';

const transformState = async (locator) => locator.evaluate((element) => {
  const style = getComputedStyle(element);
  const matrix = style.transform === 'none' ? null : new DOMMatrixReadOnly(style.transform);
  return {
    x: matrix?.m41 ?? 0,
    y: matrix?.m42 ?? 0,
    transform: style.transform,
    transitionDuration: style.transitionDuration,
    outlineWidth: style.outlineWidth,
    forcedColorAdjust: style.forcedColorAdjust,
    direction: style.direction,
    textDecorationLine: style.textDecorationLine
  };
});

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#calendar-slice')).toContainText('core.calendar');
  expect(errors).toEqual([]);
});

test('Calendar deploys one grid with exactly one roving active day and explicit current/unavailable semantics', async ({ page, request }) => {
  for (const asset of ['calendar.css', 'calendar.mjs']) {
    const response = await request.get('/' + asset);
    expect(response.ok(), asset).toBeTruthy();
    expect((await response.text()).length, asset).toBeGreaterThan(100);
  }

  const root = page.locator('#calendar-demo');
  const grid = page.locator('#calendar-grid');
  const days = grid.locator('.ns-calendar__day');

  await expect(grid).toHaveAttribute('role', 'grid');
  await expect(grid.locator('[role="row"]')).toHaveCount(6);
  await expect(grid.locator('[role="gridcell"]')).toHaveCount(42);
  await expect(days).toHaveCount(42);
  expect(await days.evaluateAll((nodes) => nodes.filter((node) => node.tabIndex === 0).length)).toBe(1);
  await expect(root).toHaveAttribute('data-active-date', '2026-09-20');
  await expect(page.locator('#calendar-grid-day-2026-09-20')).toHaveAttribute('aria-current', 'date');
  await expect(page.locator('#calendar-grid-day-2026-09-20')).toHaveAttribute('data-state', 'current');
  await expect(page.locator('#calendar-grid-day-2026-09-23')).toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('#calendar-grid-day-2026-09-23')).toHaveAttribute('data-state', 'unavailable');
  await expect(page.locator('#calendar-grid-day-2026-09-23')).toHaveAttribute('aria-label', /unavailable/);
  expect((await transformState(page.locator('#calendar-grid-day-2026-09-23'))).textDecorationLine).toContain('line-through');
  await expect(root).toHaveAttribute('data-selection-state', 'empty');
});

test('Calendar keyboard navigation moves active day without committing selection', async ({ page }) => {
  const root = page.locator('#calendar-demo');
  const start = page.locator('#calendar-grid-day-2026-09-20');

  await start.focus();
  await expect(start).toBeFocused();
  await start.press('ArrowRight');
  await expect(root).toHaveAttribute('data-active-date', '2026-09-21');
  await expect(page.locator('#calendar-grid-day-2026-09-21')).toBeFocused();
  await expect(root).toHaveAttribute('data-selection-state', 'empty');

  await page.keyboard.press('ArrowDown');
  await expect(root).toHaveAttribute('data-active-date', '2026-09-28');
  await expect(page.locator('#calendar-grid-day-2026-09-28')).toBeFocused();

  await page.keyboard.press('Home');
  await expect(root).toHaveAttribute('data-active-date', '2026-09-27');
  await expect(page.locator('#calendar-grid-day-2026-09-27')).toBeFocused();
  await expect(page.locator('#calendar-grid-day-2026-09-27')).toHaveAttribute('aria-disabled', 'true');

  await page.evaluate(async () => {
    const module = await import('./calendar.mjs');
    module.setCalendarActiveDate(document.querySelector('#calendar-demo'), '2026-09-16', { focus: true });
  });
  await expect(page.locator('#calendar-grid-day-2026-09-16')).toBeFocused();
  await page.keyboard.press('Home');
  await expect(root).toHaveAttribute('data-active-date', '2026-09-13');
  await page.keyboard.press('End');
  await expect(root).toHaveAttribute('data-active-date', '2026-09-19');
  await expect(root).toHaveAttribute('data-selection-state', 'empty');
});

test('Calendar commits single selection separately from transient active focus', async ({ page }) => {
  const root = page.locator('#calendar-demo');
  const day16 = page.locator('#calendar-grid-day-2026-09-16');

  await day16.click();
  await expect(root).toHaveAttribute('data-selection-state', 'selected');
  await expect(root).toHaveAttribute('data-selected-value', '2026-09-16');
  await expect(day16).toHaveAttribute('data-state', 'selected');
  await expect(day16.locator('xpath=..')).toHaveAttribute('aria-selected', 'true');

  await day16.press('ArrowRight');
  await expect(root).toHaveAttribute('data-active-date', '2026-09-17');
  await expect(page.locator('#calendar-grid-day-2026-09-17')).toBeFocused();
  await expect(root).toHaveAttribute('data-selected-value', '2026-09-16');
  await expect(page.locator('#calendar-grid-day-2026-09-16').locator('xpath=..')).toHaveAttribute('aria-selected', 'true');

  await page.keyboard.press('Enter');
  await expect(root).toHaveAttribute('data-selected-value', '2026-09-17');
  await expect(page.locator('#calendar-grid-day-2026-09-17').locator('xpath=..')).toHaveAttribute('aria-selected', 'true');
});

test('Calendar exposes range start, middle and end without relying only on color', async ({ page }) => {
  const root = page.locator('#calendar-demo');
  await page.evaluate(async () => {
    const module = await import('./calendar.mjs');
    module.setCalendarSelection(document.querySelector('#calendar-demo'), {
      mode: 'range',
      start: '2026-09-14',
      end: '2026-09-18'
    });
  });

  await expect(root).toHaveAttribute('data-selection-state', 'range-selected');
  await expect(root).toHaveAttribute('data-selected-value', '2026-09-14/2026-09-18');
  for (const [date, position] of [['2026-09-14','start'],['2026-09-16','middle'],['2026-09-18','end']]) {
    const day = page.locator(`#calendar-grid-day-${date}`);
    await expect(day).toHaveAttribute('data-range-position', position);
    await expect(day).toHaveAttribute('data-state', `range-${position}`);
    await expect(day).toHaveAttribute('aria-label', new RegExp(position === 'middle' ? 'selected range' : `range ${position}`));
    await expect(day.locator('xpath=..')).toHaveAttribute('aria-selected', 'true');
  }

  await page.evaluate(async () => {
    const module = await import('./calendar.mjs');
    module.setCalendarSelection(document.querySelector('#calendar-demo'), { mode: 'range', start: '2026-09-20', end: '' });
  });
  await expect(root).toHaveAttribute('data-selection-state', 'range-partial');
  await page.locator('#calendar-grid-day-2026-09-18').click();
  await expect(root).toHaveAttribute('data-selection-state', 'range-selected');
  await expect(root).toHaveAttribute('data-range-start', '2026-09-18');
  await expect(root).toHaveAttribute('data-range-end', '2026-09-20');
});

test('Calendar unavailable dates are inert and month navigation is deterministic', async ({ page }) => {
  const root = page.locator('#calendar-demo');
  const unavailable = page.locator('#calendar-grid-day-2026-09-23');

  await unavailable.click({ force: true });
  await expect(root).toHaveAttribute('data-selection-state', 'empty');

  await root.locator('[data-calendar-next]').click();
  await expect(root).toHaveAttribute('data-visible-month', '2026-10');
  await expect(page.locator('#calendar-month')).toHaveText('October 2026');
  await expect(page.locator('#calendar-grid [role="gridcell"]')).toHaveCount(42);
  expect(await page.locator('#calendar-grid .ns-calendar__day').evaluateAll((nodes) => nodes.filter((node) => node.tabIndex === 0).length)).toBe(1);

  await root.locator('[data-calendar-previous]').click();
  await expect(root).toHaveAttribute('data-visible-month', '2026-09');
  await expect(page.locator('#calendar-month')).toHaveText('September 2026');
});

test('Calendar preserves ordinary Tab traversal around one roving grid day', async ({ page }) => {
  const root = page.locator('#calendar-demo');
  await root.evaluate((element) => {
    const before = document.createElement('button');
    before.id = 'calendar-before';
    before.textContent = 'Before';
    const after = document.createElement('button');
    after.id = 'calendar-after';
    after.textContent = 'After';
    element.before(before);
    element.after(after);
  });

  await page.locator('#calendar-before').focus();
  await page.keyboard.press('Tab');
  await expect(root.locator('[data-calendar-previous]')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(root.locator('[data-calendar-next]')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#calendar-grid .ns-calendar__day[tabindex="0"]')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#calendar-after')).toBeFocused();
});

test('Calendar disabled state blocks navigation and selection', async ({ page }) => {
  const root = page.locator('#calendar-demo');
  await page.evaluate(async () => {
    const module = await import('./calendar.mjs');
    module.setCalendarSelection(document.querySelector('#calendar-demo'), { mode: 'single', date: '2026-09-16' });
    module.setCalendarDisabled(document.querySelector('#calendar-demo'), true);
  });
  await expect(root).toHaveAttribute('data-state', 'disabled');
  await expect(root).toHaveAttribute('data-disabled', 'true');
  await expect(page.locator('#calendar-grid')).toHaveAttribute('aria-disabled', 'true');
  await expect(root.locator('[data-calendar-previous]')).toBeDisabled();
  await expect(root.locator('[data-calendar-next]')).toBeDisabled();
  expect(await page.locator('#calendar-grid .ns-calendar__day').evaluateAll((nodes) => nodes.every((node) => node.disabled))).toBe(true);
  await expect(root).toHaveAttribute('data-selected-value', '2026-09-16');
});

test('Calendar applies pressure to operable day actions and respects RTL chronology mapping', async ({ page }) => {
  const day = page.locator('#calendar-grid-day-2026-09-16');

  await day.hover();
  await expect.poll(async () => (await transformState(day)).x, { timeout: 750 }).toBeCloseTo(2, 1);
  await expect.poll(async () => (await transformState(day)).y, { timeout: 750 }).toBeCloseTo(2, 1);
  const box = await day.boundingBox();
  if (!box) throw new Error('Calendar day has no pointer box');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect.poll(async () => (await transformState(day)).x, { timeout: 750 }).toBeCloseTo(5, 1);
  await expect.poll(async () => (await transformState(day)).y, { timeout: 750 }).toBeCloseTo(5, 1);
  await page.mouse.up();

  const root = page.locator('#calendar-demo');
  await root.evaluate((element) => element.setAttribute('dir', 'rtl'));
  await page.evaluate(async () => {
    const module = await import('./calendar.mjs');
    module.setCalendarActiveDate(document.querySelector('#calendar-demo'), '2026-09-16', { focus: true });
  });
  expect((await transformState(root)).direction).toBe('rtl');
  await page.keyboard.press('ArrowRight');
  await expect(root).toHaveAttribute('data-active-date', '2026-09-15');
  await page.keyboard.press('ArrowLeft');
  await expect(root).toHaveAttribute('data-active-date', '2026-09-16');
});

test('Calendar retains reduced-motion, forced-colors, and narrow-layout support', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  expect(parseFloat((await transformState(page.locator('#calendar-grid-day-2026-09-16'))).transitionDuration)).toBeLessThanOrEqual(0.001);

  await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'active' });
  await page.goto('/');
  await page.locator('#calendar-grid-day-2026-09-20').focus();
  const forced = await transformState(page.locator('#calendar-grid-day-2026-09-20'));
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
