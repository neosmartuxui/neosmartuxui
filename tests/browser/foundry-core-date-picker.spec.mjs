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
  await expect(page.locator('#date-picker-slice')).toContainText('core.date-picker');
  expect(errors).toEqual([]);
});

test('DatePicker deploys its adapter and composes the shipping Calendar without duplicate grid authority', async ({ page, request }) => {
  for (const asset of ['date-picker.css', 'date-picker.mjs', 'calendar.css', 'calendar.mjs']) {
    const response = await request.get('/' + asset);
    expect(response.ok(), asset).toBeTruthy();
    expect((await response.text()).length, asset).toBeGreaterThan(100);
  }

  const root = page.locator('#date-picker-demo');
  const start = page.locator('#date-picker-start');
  const endField = root.locator('[data-date-picker-end-field]');
  const trigger = page.locator('#date-picker-trigger');
  const popup = page.locator('#date-picker-popup');
  const calendar = page.locator('#date-picker-calendar');

  await expect(root).toHaveAttribute('data-mode', 'single');
  await expect(root).toHaveAttribute('data-selection-state', 'empty');
  await expect(start).toHaveAttribute('type', 'text');
  await expect(start).toHaveAttribute('inputmode', 'numeric');
  await expect(endField).toBeHidden();
  await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(popup).toHaveAttribute('role', 'dialog');
  await expect(popup).toHaveAttribute('aria-modal', 'false');
  await expect(popup).toBeHidden();
  await expect(calendar).toHaveCount(1);
  await expect(calendar.locator('[data-calendar-grid]')).toHaveAttribute('role', 'grid');
  await expect(calendar.locator('[role="gridcell"]')).toHaveCount(42);
  expect(await calendar.locator('.ns-calendar__day').evaluateAll((nodes) => nodes.filter((node) => node.tabIndex === 0).length)).toBe(1);
});

test('DatePicker disclosure is non-modal, focuses Calendar on open, and Escape returns focus to the trigger', async ({ page }) => {
  const root = page.locator('#date-picker-demo');
  const trigger = page.locator('#date-picker-trigger');
  const popup = page.locator('#date-picker-popup');

  await trigger.click();
  await expect(root).toHaveAttribute('data-state', 'open');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(popup).toBeVisible();
  await expect(page.locator('#date-picker-calendar-grid .ns-calendar__day[tabindex="0"]')).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(popup).toBeHidden();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger).toBeFocused();
});

test('DatePicker accepts ISO entry, rejects ambiguous locale text, and keeps Calendar synchronized', async ({ page }) => {
  const root = page.locator('#date-picker-demo');
  const start = page.locator('#date-picker-start');
  const calendar = page.locator('#date-picker-calendar');

  await start.fill('2026-09-16');
  await start.press('Enter');
  await expect(root).toHaveAttribute('data-selection-state', 'selected');
  await expect(root).toHaveAttribute('data-selected-value', '2026-09-16');
  await expect(calendar).toHaveAttribute('data-selected-date', '2026-09-16');
  await expect(calendar).toHaveAttribute('data-visible-month', '2026-09');
  await expect(start).not.toHaveAttribute('aria-invalid', 'true');

  await start.fill('09/16/2026');
  await start.press('Enter');
  await expect(root).toHaveAttribute('data-state', 'invalid');
  await expect(start).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#date-picker-error')).toBeVisible();
  await expect(calendar).toHaveAttribute('data-selected-date', '2026-09-16');
});

test('DatePicker mirrors completed single Calendar selection back to entry and closes', async ({ page }) => {
  const root = page.locator('#date-picker-demo');
  const trigger = page.locator('#date-picker-trigger');
  const start = page.locator('#date-picker-start');

  await trigger.click();
  await page.locator('#date-picker-calendar-grid-day-2026-09-16').click();
  await expect(start).toHaveValue('2026-09-16');
  await expect(root).toHaveAttribute('data-selection-state', 'selected');
  await expect(root).toHaveAttribute('data-selected-value', '2026-09-16');
  await expect(page.locator('#date-picker-popup')).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await page.locator('#date-picker-calendar-grid-day-2026-09-23').click({ force: true });
  await expect(start).toHaveValue('2026-09-16');
  await expect(page.locator('#date-picker-popup')).toBeVisible();
});

test('DatePicker range mode exposes partial and selected values while Calendar owns range markers', async ({ page }) => {
  const root = page.locator('#date-picker-demo');
  const start = page.locator('#date-picker-start');
  const end = page.locator('#date-picker-end');
  const endField = root.locator('[data-date-picker-end-field]');
  const calendar = page.locator('#date-picker-calendar');

  await page.evaluate(async () => {
    const module = await import('./date-picker.mjs');
    module.setDatePickerValue(document.querySelector('#date-picker-demo'), { mode: 'range', start: '2026-09-14', end: '' });
    module.setDatePickerOpen(document.querySelector('#date-picker-demo'), true, { focusCalendar: true });
  });

  await expect(root).toHaveAttribute('data-mode', 'range');
  await expect(root).toHaveAttribute('data-selection-state', 'range-partial');
  await expect(endField).toBeVisible();
  await expect(start).toHaveValue('2026-09-14');
  await expect(end).toHaveValue('');
  await expect(calendar).toHaveAttribute('data-selection-state', 'range-partial');
  await expect(page.locator('#date-picker-calendar-grid-day-2026-09-14')).toHaveAttribute('data-range-position', 'start');

  await page.locator('#date-picker-calendar-grid-day-2026-09-18').click();
  await expect(start).toHaveValue('2026-09-14');
  await expect(end).toHaveValue('2026-09-18');
  await expect(root).toHaveAttribute('data-selection-state', 'range-selected');
  await expect(root).toHaveAttribute('data-selected-value', '2026-09-14/2026-09-18');
  await expect(page.locator('#date-picker-calendar-grid-day-2026-09-16')).toHaveAttribute('data-range-position', 'middle');
  await expect(page.locator('#date-picker-popup')).toBeHidden();
});

test('DatePicker rejects unordered range entry without overwriting the last valid Calendar selection', async ({ page }) => {
  const root = page.locator('#date-picker-demo');
  const start = page.locator('#date-picker-start');
  const end = page.locator('#date-picker-end');
  const calendar = page.locator('#date-picker-calendar');

  await page.evaluate(async () => {
    const module = await import('./date-picker.mjs');
    module.setDatePickerValue(document.querySelector('#date-picker-demo'), { mode: 'range', start: '2026-09-14', end: '2026-09-18' });
  });
  await start.fill('2026-09-20');
  await end.fill('2026-09-18');
  await end.press('Enter');

  await expect(root).toHaveAttribute('data-state', 'invalid');
  await expect(start).toHaveAttribute('aria-invalid', 'true');
  await expect(end).toHaveAttribute('aria-invalid', 'true');
  await expect(calendar).toHaveAttribute('data-range-start', '2026-09-14');
  await expect(calendar).toHaveAttribute('data-range-end', '2026-09-18');
});

test('DatePicker preserves ordinary Tab traversal through entry, disclosure, Calendar, and out of the component', async ({ page }) => {
  const root = page.locator('#date-picker-demo');
  await page.evaluate(async () => {
    const module = await import('./date-picker.mjs');
    module.setDatePickerOpen(document.querySelector('#date-picker-demo'), true);
  });
  await root.evaluate((element) => {
    const before = document.createElement('button');
    before.id = 'date-picker-before';
    before.textContent = 'Before';
    const after = document.createElement('button');
    after.id = 'date-picker-after';
    after.textContent = 'After';
    element.before(before);
    element.after(after);
  });

  await page.locator('#date-picker-before').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#date-picker-start')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#date-picker-trigger')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#date-picker-calendar [data-calendar-previous]')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#date-picker-calendar [data-calendar-next]')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#date-picker-calendar-grid .ns-calendar__day[tabindex="0"]')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#date-picker-after')).toBeFocused();
  await expect(page.locator('#date-picker-popup')).toBeHidden();
});

test('DatePicker disabled state blocks entry, disclosure, and composed Calendar interaction', async ({ page }) => {
  const root = page.locator('#date-picker-demo');
  await page.evaluate(async () => {
    const module = await import('./date-picker.mjs');
    module.setDatePickerValue(document.querySelector('#date-picker-demo'), { mode: 'single', date: '2026-09-16' });
    module.setDatePickerDisabled(document.querySelector('#date-picker-demo'), true);
  });

  await expect(root).toHaveAttribute('data-state', 'disabled');
  await expect(page.locator('#date-picker-start')).toBeDisabled();
  await expect(page.locator('#date-picker-trigger')).toBeDisabled();
  await expect(page.locator('#date-picker-popup')).toBeHidden();
  await expect(page.locator('#date-picker-calendar [data-calendar-grid]')).toHaveAttribute('aria-disabled', 'true');
  expect(await page.locator('#date-picker-calendar .ns-calendar__day').evaluateAll((nodes) => nodes.every((node) => node.disabled))).toBe(true);
  await expect(root).toHaveAttribute('data-selected-value', '2026-09-16');
});

test('DatePicker applies pressure only to disclosure, inherits RTL Calendar navigation, and leaves editing surface stable', async ({ page }) => {
  const trigger = page.locator('#date-picker-trigger');
  const input = page.locator('#date-picker-start');

  await input.hover();
  expect((await transformState(input)).x).toBeCloseTo(0, 1);
  expect((await transformState(input)).y).toBeCloseTo(0, 1);

  await trigger.hover();
  await expect.poll(async () => (await transformState(trigger)).x, { timeout: 750 }).toBeCloseTo(2, 1);
  await expect.poll(async () => (await transformState(trigger)).y, { timeout: 750 }).toBeCloseTo(2, 1);
  const box = await trigger.boundingBox();
  if (!box) throw new Error('DatePicker trigger has no pointer box');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect.poll(async () => (await transformState(trigger)).x, { timeout: 750 }).toBeCloseTo(5, 1);
  await page.mouse.up();

  const root = page.locator('#date-picker-demo');
  await root.evaluate((element) => element.setAttribute('dir', 'rtl'));
  await page.evaluate(async () => {
    const datePicker = await import('./date-picker.mjs');
    const calendar = await import('./calendar.mjs');
    datePicker.setDatePickerOpen(document.querySelector('#date-picker-demo'), true);
    calendar.setCalendarActiveDate(document.querySelector('#date-picker-calendar'), '2026-09-16', { focus: true });
  });
  expect((await transformState(root)).direction).toBe('rtl');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#date-picker-calendar')).toHaveAttribute('data-active-date', '2026-09-15');
});

test('DatePicker retains reduced-motion, forced-colors focus, and narrow-layout containment', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  expect(parseFloat((await transformState(page.locator('#date-picker-trigger'))).transitionDuration)).toBeLessThanOrEqual(0.001);

  await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'active' });
  await page.goto('/');
  await page.locator('#date-picker-start').focus();
  const forced = await transformState(page.locator('#date-picker-start'));
  expect(forced.forcedColorAdjust).toBe('auto');
  expect(parseFloat(forced.outlineWidth)).toBeGreaterThan(0);

  await page.emulateMedia({ forcedColors: 'none' });
  await page.setViewportSize({ width: 375, height: 1200 });
  await page.goto('/');
  await page.locator('#date-picker-trigger').click();
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
});
