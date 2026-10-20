import { test, expect } from '@playwright/test';

const grid = '#data-grid-demo';
const cell = (row, col) => `#data-grid-r${row}c${col}`;

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#data-grid-slice')).toContainText('core.data-grid');
  await expect(page.locator(grid)).toBeVisible();
  expect(errors).toEqual([]);
});

test('DataGrid exposes one named ARIA grid with DOM-resident headers, rows, coordinates, and one page tab stop', async ({ page, request }) => {
  const response = await request.get('/data-grid.mjs');
  expect(response.ok()).toBeTruthy();
  expect((await response.text()).length).toBeGreaterThan(100);

  const root = page.locator(grid);
  await expect(root).toHaveAttribute('role', 'grid');
  await expect(root).toHaveAttribute('aria-label', 'Workspace access grid');
  await expect(root.locator(':scope > [role="row"]')).toHaveCount(4);
  await expect(root.locator('[role="columnheader"]')).toHaveCount(4);
  await expect(root.locator('[role="gridcell"][data-grid-cell]')).toHaveCount(12);
  await expect(root.locator('[role="gridcell"][tabindex="0"]')).toHaveCount(1);
  await expect(root.locator('[role="gridcell"][tabindex="-1"]')).toHaveCount(11);
  await expect(root.locator('[role="gridcell"][aria-selected="true"]')).toHaveCount(0);

  const coordinates = await root.locator('[role="gridcell"][data-grid-cell]').evaluateAll((cells) =>
    cells.map((item) => [item.dataset.rowIndex, item.dataset.colIndex])
  );
  expect(new Set(coordinates.map(([row,col]) => `${row}:${col}`)).size).toBe(12);
});

test('DataGrid Arrow navigation moves one cell without wrapping at row or grid edges', async ({ page }) => {
  await page.locator(cell(1,1)).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator(cell(1,2))).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator(cell(2,2))).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator(cell(2,1))).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(page.locator(cell(1,1))).toBeFocused();

  await page.keyboard.press('ArrowLeft');
  await expect(page.locator(cell(1,1))).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(page.locator(cell(1,1))).toBeFocused();

  await page.locator(cell(3,4)).click();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator(cell(3,4))).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator(cell(3,4))).toBeFocused();
});

test('DataGrid Home End and Control endpoints preserve authored row and grid order', async ({ page }) => {
  await page.locator(cell(2,2)).click();
  await page.keyboard.press('End');
  await expect(page.locator(cell(2,4))).toBeFocused();
  await page.keyboard.press('Home');
  await expect(page.locator(cell(2,1))).toBeFocused();
  await page.keyboard.press('Control+End');
  await expect(page.locator(cell(3,4))).toBeFocused();
  await page.keyboard.press('Control+Home');
  await expect(page.locator(cell(1,1))).toBeFocused();
});

test('DataGrid RTL reverses visual horizontal arrows without reordering DOM coordinates', async ({ page }) => {
  const root = page.locator(grid);
  const before = await root.locator('[role="row"]').nth(1).locator('[role="gridcell"]').allTextContents();
  await root.evaluate((element) => element.setAttribute('dir', 'rtl'));

  await page.locator(cell(2,2)).click();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator(cell(2,1))).toBeFocused();

  await page.locator(cell(2,2)).click();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator(cell(2,3))).toBeFocused();

  const after = await root.locator('[role="row"]').nth(1).locator('[role="gridcell"]').allTextContents();
  expect(after).toEqual(before);
  expect(await root.evaluate((element) => getComputedStyle(element).direction)).toBe('rtl');
});

test('DataGrid focus movement never silently selects and Space keeps selection single-cell', async ({ page }) => {
  await page.locator(cell(2,2)).click();
  await expect(page.locator(cell(2,2))).toHaveAttribute('aria-selected', 'false');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator(cell(2,3))).toBeFocused();
  await expect(page.locator(cell(2,3))).toHaveAttribute('aria-selected', 'false');

  await page.keyboard.press('Space');
  await expect(page.locator(cell(2,3))).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator(grid)).toHaveAttribute('data-selected-cell', 'data-grid-r2c3');
  await expect(page.locator(grid).locator('[aria-selected="true"]')).toHaveCount(1);

  await page.keyboard.press('ArrowRight');
  await expect(page.locator(cell(2,4))).toBeFocused();
  await expect(page.locator(cell(2,3))).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator(cell(2,4))).toHaveAttribute('aria-selected', 'false');

  await page.keyboard.press('Space');
  await expect(page.locator(cell(2,3))).toHaveAttribute('aria-selected', 'false');
  await expect(page.locator(cell(2,4))).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator(grid).locator('[aria-selected="true"]')).toHaveCount(1);

  await page.keyboard.press('Space');
  await expect(page.locator(grid).locator('[aria-selected="true"]')).toHaveCount(0);
  await expect(page.locator(grid)).toHaveAttribute('data-state', 'rest');
});

test('DataGrid hover does not move focus and primary pointer activation only makes a cell active', async ({ page }) => {
  const target = page.locator(cell(3,2));
  await target.hover();
  expect(await target.evaluate((element) => document.activeElement === element)).toBe(false);
  await expect(page.locator(grid)).toHaveAttribute('data-selected-cell', '');

  await target.click();
  await expect(target).toBeFocused();
  await expect(target).toHaveAttribute('tabindex', '0');
  await expect(page.locator(grid)).toHaveAttribute('data-active-cell', 'data-grid-r3c2');
  await expect(page.locator(grid).locator('[role="gridcell"][tabindex="0"]')).toHaveCount(1);
  await expect(page.locator(grid).locator('[aria-selected="true"]')).toHaveCount(0);
});

test('DataGrid Enter editing suspends grid navigation and Escape exits without claiming rollback', async ({ page }) => {
  await page.evaluate(() => {
    window.__dataGridExit = null;
    document.querySelector('#data-grid-demo').addEventListener('neosmartui:data-grid-edit-exit', (event) => {
      window.__dataGridExit = event.detail;
    });
  });

  const owner = page.locator(cell(1,4));
  const editor = owner.locator('[data-grid-editor]');
  await owner.click();
  await page.keyboard.press('Enter');
  await expect(editor).toBeFocused();
  await expect(owner).toHaveAttribute('data-editing', 'true');
  await expect(owner).toHaveAttribute('data-state', 'editing');
  await expect(page.locator(grid)).toHaveAttribute('data-state', 'editing');
  await expect(page.locator(grid).locator('[role="gridcell"][tabindex="0"]')).toHaveCount(0);
  await expect(editor).toHaveAttribute('tabindex', '0');

  await editor.fill('Locally changed');
  await page.keyboard.press('ArrowLeft');
  await expect(editor).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(owner).toBeFocused();
  await expect(owner).toHaveAttribute('data-editing', 'false');
  await expect(editor).toBeHidden();
  await expect(editor).toHaveValue('Locally changed');
  expect(await page.evaluate(() => window.__dataGridExit)).toMatchObject({ reason: 'cancel', cellId: 'data-grid-r1c4', value: 'Locally changed' });
});

test('DataGrid F2 editing and Enter emit only a local commit-exit intent without reopening editing', async ({ page }) => {
  await page.evaluate(() => {
    window.__dataGridExit = null;
    document.querySelector('#data-grid-demo').addEventListener('neosmartui:data-grid-edit-exit', (event) => {
      window.__dataGridExit = event.detail;
    });
  });

  const owner = page.locator(cell(1,4));
  const editor = owner.locator('[data-grid-editor]');
  await owner.click();
  await page.keyboard.press('F2');
  await expect(editor).toBeFocused();
  await editor.fill('Ready locally');
  await page.keyboard.press('Enter');

  await expect(owner).toBeFocused();
  await expect(owner).toHaveAttribute('data-editing', 'false');
  await expect(editor).toBeHidden();
  await expect(page.locator(grid)).toHaveAttribute('data-editing-cell', '');
  expect(await page.evaluate(() => window.__dataGridExit)).toMatchObject({ reason: 'commit', cellId: 'data-grid-r1c4', value: 'Ready locally' });
});

test('DataGrid Tab exits edit mode and continues ordinary document traversal without a focus trap', async ({ page }) => {
  const owner = page.locator(cell(1,4));
  const editor = owner.locator('[data-grid-editor]');
  await owner.click();
  await page.keyboard.press('Enter');
  await expect(editor).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.locator('#data-grid-after')).toBeFocused();
  await page.waitForTimeout(25);
  await expect(owner).toHaveAttribute('data-editing', 'false');
  await expect(editor).toBeHidden();
  await expect(owner).toHaveAttribute('tabindex', '0');
});

test('DataGrid narrow layout preserves one grid, authored rows, cell roles, and readable wrapping', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 760 });
  const root = page.locator(grid);
  const state = await root.evaluate((element) => ({
    rowDisplays: [...element.querySelectorAll(':scope > [role="row"]')].map((row) => getComputedStyle(row).display),
    cells: element.querySelectorAll('[role="gridcell"]').length,
    headers: element.querySelectorAll('[role="columnheader"]').length,
    wrap: getComputedStyle(element.querySelector('[role="gridcell"]')).overflowWrap,
    width: element.getBoundingClientRect().width,
    viewport: innerWidth
  }));
  expect(state.rowDisplays.every((display) => display === 'grid')).toBe(true);
  expect(state.cells).toBe(12);
  expect(state.headers).toBe(4);
  expect(state.wrap).toBe('anywhere');
  expect(state.width).toBeLessThanOrEqual(state.viewport);
  await expect(root.locator('[role="gridcell"][tabindex="0"]')).toHaveCount(1);
});

test('DataGrid forced colors preserve boundaries, active focus, and selected-cell distinction', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/');
  const active = page.locator(cell(1,1));
  await active.focus();
  await page.keyboard.press('Space');

  const state = await page.locator(grid).evaluate((element) => {
    const rootStyle = getComputedStyle(element);
    const activeCell = element.querySelector('[role="gridcell"][tabindex="0"]');
    const activeStyle = getComputedStyle(activeCell);
    return {
      rootBorderStyle: rootStyle.borderTopStyle,
      rootBorderWidth: parseFloat(rootStyle.borderTopWidth),
      cellBorderStyle: activeStyle.borderRightStyle || activeStyle.borderInlineEndStyle,
      cellBorderWidth: parseFloat(activeStyle.borderRightWidth || activeStyle.borderInlineEndWidth),
      outlineStyle: activeStyle.outlineStyle,
      outlineWidth: parseFloat(activeStyle.outlineWidth),
      background: activeStyle.backgroundColor,
      color: activeStyle.color
    };
  });
  expect(state.rootBorderStyle).not.toBe('none');
  expect(state.rootBorderWidth).toBeGreaterThan(0);
  expect(state.cellBorderStyle).not.toBe('none');
  expect(state.cellBorderWidth).toBeGreaterThan(0);
  expect(state.outlineStyle).not.toBe('none');
  expect(state.outlineWidth).toBeGreaterThan(0);
  expect(state.background).not.toBe('rgba(0, 0, 0, 0)');
  expect(state.color).not.toBe('rgba(0, 0, 0, 0)');
});

test('DataGrid owns no motion, virtualization, sorting, network, form, or spreadsheet authority', async ({ page, request }) => {
  const [cssResponse, adapterResponse] = await Promise.all([
    request.get('/data-grid.css'),
    request.get('/data-grid.mjs')
  ]);
  expect(cssResponse.ok()).toBeTruthy();
  expect(adapterResponse.ok()).toBeTruthy();
  const css = await cssResponse.text();
  const adapter = await adapterResponse.text();

  for (const forbidden of ['var(--ns-motion-', 'transition:', 'transition-property', 'animation:', 'transform:']) {
    expect(css, forbidden).not.toContain(forbidden);
  }
  for (const forbidden of ['fetch(', 'XMLHttpRequest', 'FormData(', '.submit(', 'aria-sort', 'aria-multiselectable', 'aria-rowcount', 'aria-colcount', 'aria-level', 'role="treegrid"']) {
    expect(adapter, forbidden).not.toContain(forbidden);
  }

  const snapshot = async () => page.locator(grid).evaluate((element) => {
    const style = getComputedStyle(element);
    const cellStyle = getComputedStyle(element.querySelector('[role="gridcell"]'));
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
