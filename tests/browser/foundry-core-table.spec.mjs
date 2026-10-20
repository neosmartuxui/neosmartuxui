import { test, expect } from '@playwright/test';

const ids = {
  table: '#table-demo',
  link: '#table-demo-link',
  button: '#table-demo-button',
  after: '#table-after'
};

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#table-slice')).toContainText('core.table');
  await expect(page.locator(ids.table)).toBeVisible();
  expect(errors).toEqual([]);
});

test('Table deploys a real native table with caption, sectioning, and scoped headers', async ({ page, request }) => {
  const response = await request.get('/table.css');
  expect(response.ok()).toBeTruthy();
  expect((await response.text()).length).toBeGreaterThan(100);

  const table = page.locator(ids.table);
  expect(await table.evaluate((element) => element.tagName)).toBe('TABLE');
  await expect(table).not.toHaveAttribute('role', /.+/);
  await expect(table).toHaveAttribute('data-state', 'rest');
  await expect(table.locator('caption')).toContainText('Workspace access summary');
  await expect(table.locator('thead')).toHaveCount(1);
  await expect(table.locator('tbody')).toHaveCount(1);
  await expect(table.locator('tfoot')).toHaveCount(1);
  await expect(table.locator('th[scope="col"]')).toHaveCount(4);
  await expect(table.locator('th[scope="row"]')).toHaveCount(4);
});

test('Table stays non-focusable while composed descendants keep ordinary Tab order', async ({ page }) => {
  const table = page.locator(ids.table);
  await expect(table).not.toHaveAttribute('tabindex', /.+/);
  await expect(table.locator('tr[tabindex],th[tabindex],td[tabindex]')).toHaveCount(0);

  const link = page.locator(ids.link);
  const button = page.locator(ids.button);
  const after = page.locator(ids.after);

  await link.focus();
  await expect(link).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(button).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(after).toBeFocused();
});

test('Table does not manufacture grid, selection, sorting, or composite-navigation semantics', async ({ page }) => {
  const table = page.locator(ids.table);
  await expect(table.locator('[role="grid"],[role="row"],[role="gridcell"],[role="columnheader"],[role="rowheader"]')).toHaveCount(0);
  await expect(table.locator('[aria-selected],[aria-activedescendant],[aria-sort]')).toHaveCount(0);

  await page.locator(ids.link).focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator(ids.link)).toBeFocused();
  await page.keyboard.press('Home');
  await expect(page.locator(ids.link)).toBeFocused();
  await page.keyboard.press('End');
  await expect(page.locator(ids.link)).toBeFocused();
});

test('Table cells remain passive pointer targets and do not create row state', async ({ page }) => {
  const cell = page.locator('#table-demo tbody tr').nth(1).locator('td').first();
  await cell.click();
  await expect(page.locator(ids.table)).toHaveAttribute('data-state', 'rest');
  expect(await cell.evaluate((element) => document.activeElement === element)).toBe(false);
  await expect(page.locator('#table-demo tr[data-state],#table-demo td[data-state],#table-demo th[data-state]')).toHaveCount(0);
});

test('Table preserves authored source order in RTL', async ({ page }) => {
  const table = page.locator(ids.table);
  const before = await table.locator('thead th').allTextContents();
  await table.evaluate((element) => element.setAttribute('dir', 'rtl'));
  const after = await table.locator('thead th').allTextContents();
  expect(after).toEqual(before);

  const direction = await table.evaluate((element) => getComputedStyle(element).direction);
  expect(direction).toBe('rtl');
  expect(await table.locator('thead th').first().textContent()).toContain('Workspace');
  expect(await table.locator('thead th').last().textContent()).toContain('Details');
});

test('Table keeps native table-row and table-cell layout on a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 760 });
  const table = page.locator(ids.table);
  const structure = await table.evaluate((element) => {
    const row = element.querySelector('tbody tr');
    const cell = element.querySelector('tbody td');
    const longCell = element.querySelector('tbody tr:nth-child(3) td');
    return {
      rowDisplay: getComputedStyle(row).display,
      cellDisplay: getComputedStyle(cell).display,
      longOverflowWrap: getComputedStyle(longCell).overflowWrap,
      rows: element.querySelectorAll('tbody tr').length,
      columns: element.querySelectorAll('thead th').length
    };
  });
  expect(structure.rowDisplay).toBe('table-row');
  expect(structure.cellDisplay).toBe('table-cell');
  expect(structure.longOverflowWrap).toBe('anywhere');
  expect(structure.rows).toBe(3);
  expect(structure.columns).toBe(4);
});

test('Table remains motionless in both normal and reduced-motion environments', async ({ page }) => {
  const snapshot = async () => page.locator(ids.table).evaluate((element) => {
    const style = getComputedStyle(element);
    const cellStyle = getComputedStyle(element.querySelector('td'));
    return {
      animationName: style.animationName,
      transitionDuration: style.transitionDuration,
      transform: style.transform,
      cellAnimationName: cellStyle.animationName,
      cellTransitionDuration: cellStyle.transitionDuration,
      cellTransform: cellStyle.transform
    };
  });

  const normal = await snapshot();
  expect(normal.animationName).toBe('none');
  expect(normal.transitionDuration).toBe('0s');
  expect(normal.transform).toBe('none');
  expect(normal.cellAnimationName).toBe('none');
  expect(normal.cellTransitionDuration).toBe('0s');
  expect(normal.cellTransform).toBe('none');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  expect(await snapshot()).toEqual(normal);
});

test('Table forced-colors rendering keeps visible table and cell boundaries', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/');

  const state = await page.locator(ids.table).evaluate((element) => {
    const tableStyle = getComputedStyle(element);
    const headerStyle = getComputedStyle(element.querySelector('th'));
    const cellStyle = getComputedStyle(element.querySelector('td'));
    return {
      tableBorderStyle: tableStyle.borderTopStyle,
      tableBorderWidth: parseFloat(tableStyle.borderTopWidth),
      headerBorderStyle: headerStyle.borderTopStyle,
      headerBorderWidth: parseFloat(headerStyle.borderTopWidth),
      cellBorderStyle: cellStyle.borderTopStyle,
      cellBorderWidth: parseFloat(cellStyle.borderTopWidth),
      color: tableStyle.color
    };
  });

  expect(state.tableBorderStyle).not.toBe('none');
  expect(state.headerBorderStyle).not.toBe('none');
  expect(state.cellBorderStyle).not.toBe('none');
  expect(state.tableBorderWidth).toBeGreaterThan(0);
  expect(state.headerBorderWidth).toBeGreaterThan(0);
  expect(state.cellBorderWidth).toBeGreaterThan(0);
  expect(state.color).not.toBe('rgba(0, 0, 0, 0)');
});

test('Table CSS excludes control-pressure, motion, and synthetic-interaction authority', async ({ request }) => {
  const response = await request.get('/table.css');
  expect(response.ok()).toBeTruthy();
  const css = await response.text();
  for (const forbidden of [
    'var(--ns-depth-',
    'var(--ns-press-',
    'var(--ns-motion-',
    'transition:',
    'transition-property',
    'animation:',
    'transform:',
    'cursor: pointer',
    '[aria-selected',
    '[role="grid"'
  ]) {
    expect(css, forbidden).not.toContain(forbidden);
  }
  expect(css).toContain('border-collapse: collapse');
  expect(css).toContain('@media (forced-colors: active)');
});
