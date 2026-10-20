import { test, expect } from '@playwright/test';

const ids = {
  list: '#list-demo',
  action: '#list-demo-action',
  after: '#list-after'
};

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#list-slice')).toContainText('core.list');
  await expect(page.locator(ids.list)).toBeVisible();
  expect(errors).toEqual([]);
});

test('List deploys a real native list with real direct list items', async ({ page, request }) => {
  const response = await request.get('/list.css');
  expect(response.ok()).toBeTruthy();
  expect((await response.text()).length).toBeGreaterThan(100);

  const list = page.locator(ids.list);
  expect(await list.evaluate((element) => element.tagName)).toBe('UL');
  await expect(list).not.toHaveAttribute('role', /.+/);
  await expect(list).not.toHaveAttribute('tabindex', /.+/);
  await expect(list).toHaveAttribute('data-state', 'rest');
  await expect(list.locator(':scope > li')).toHaveCount(3);
  expect(await list.locator(':scope > li').evaluateAll((items) => items.map((item) => item.tagName))).toEqual(['LI','LI','LI']);
});

test('List container stays passive while nested controls keep ordinary Tab traversal', async ({ page }) => {
  const list = page.locator(ids.list);
  const action = page.locator(ids.action);
  const after = page.locator(ids.after);

  await expect(list.locator('[role="option"],[role="menuitem"],[role="treeitem"],[role="gridcell"]')).toHaveCount(0);
  await action.focus();
  await expect(action).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(after).toBeFocused();
});

test('List does not manufacture selection, current, checked, expanded, or composite-focus state', async ({ page }) => {
  const list = page.locator(ids.list);
  await expect(list.locator('[aria-selected],[aria-current],[aria-checked],[aria-expanded],[aria-activedescendant]')).toHaveCount(0);
  await expect(list.locator('[tabindex]')).toHaveCount(0);

  const firstItem = list.locator(':scope > li').first();
  await firstItem.click({ position: { x: 4, y: 4 } });
  await expect(list).toHaveAttribute('data-state', 'rest');
  expect(await firstItem.evaluate((element) => document.activeElement === element)).toBe(false);
  await expect(page.locator(ids.action)).not.toBeFocused();
});

test('List preserves authored item order and descendant focus order in RTL', async ({ page }) => {
  const list = page.locator(ids.list);
  const before = await list.locator(':scope > li .ns-item__title').allTextContents();

  await list.evaluate((element) => element.setAttribute('dir', 'rtl'));

  const after = await list.locator(':scope > li .ns-item__title').allTextContents();
  expect(after).toEqual(before);
  expect(await list.evaluate((element) => getComputedStyle(element).direction)).toBe('rtl');

  await page.locator(ids.action).focus();
  await page.keyboard.press('Tab');
  await expect(page.locator(ids.after)).toBeFocused();
});

test('List preserves native list-item display and wraps long content on narrow viewports', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 760 });
  const list = page.locator(ids.list);

  const state = await list.evaluate((element) => {
    const item = element.querySelector(':scope > li');
    const longText = [...element.querySelectorAll('p')].find((node) => node.textContent.includes('workspace-accessibility-verification'));
    return {
      listDisplay: getComputedStyle(element).display,
      itemDisplay: getComputedStyle(item).display,
      overflowWrap: getComputedStyle(longText).overflowWrap,
      directItems: element.querySelectorAll(':scope > li').length
    };
  });

  expect(state.listDisplay).toBe('block');
  expect(state.itemDisplay).toBe('list-item');
  expect(state.overflowWrap).toBe('anywhere');
  expect(state.directItems).toBe(3);
});

test('List keeps nested native hierarchy instead of flattening it into tree semantics', async ({ page }) => {
  const result = await page.locator(ids.list).evaluate((list) => {
    const parent = list.querySelector(':scope > li:last-child');
    const nested = document.createElement('ul');
    nested.className = 'ns-list';
    nested.innerHTML = '<li id="list-nested-child">Nested collection item</li>';
    parent.append(nested);
    const child = nested.querySelector('#list-nested-child');
    return {
      nestedTag: nested.tagName,
      childTag: child.tagName,
      nestedRole: nested.getAttribute('role'),
      childRole: child.getAttribute('role'),
      nestedDisplay: getComputedStyle(nested).display,
      childDisplay: getComputedStyle(child).display
    };
  });

  expect(result).toEqual({
    nestedTag: 'UL',
    childTag: 'LI',
    nestedRole: null,
    childRole: null,
    nestedDisplay: 'block',
    childDisplay: 'list-item'
  });
});

test('List forced-colors rendering keeps markers, text, and authored separators visible', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/');

  const state = await page.locator(ids.list).evaluate((element) => {
    const item = element.querySelector(':scope > li');
    const style = getComputedStyle(item);
    const marker = getComputedStyle(item, '::marker');
    return {
      color: style.color,
      borderStyle: style.borderBottomStyle,
      borderWidth: parseFloat(style.borderBottomWidth),
      markerColor: marker.color
    };
  });

  expect(state.color).not.toBe('rgba(0, 0, 0, 0)');
  expect(state.borderStyle).not.toBe('none');
  expect(state.borderWidth).toBeGreaterThan(0);
  expect(state.markerColor).not.toBe('rgba(0, 0, 0, 0)');
});

test('List CSS excludes control pressure, motion, and synthetic-interaction authority', async ({ request }) => {
  const response = await request.get('/list.css');
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
    '[role="listbox"'
  ]) {
    expect(css, forbidden).not.toContain(forbidden);
  }

  expect(css).toContain('.ns-list > li::marker');
  expect(css).toContain('@media (forced-colors: active)');
});
