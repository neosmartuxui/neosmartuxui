import { test, expect } from '@playwright/test';

const ids = {
  item: '#item-demo',
  action: '#item-demo-action',
  after: '#item-after'
};

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#item-slice')).toContainText('core.item');
  await expect(page.locator(ids.item)).toBeVisible();
  expect(errors).toEqual([]);
});

test('Item deploys a composition-owned article host with structured anatomy and no widget role', async ({ page, request }) => {
  const response = await request.get('/item.css');
  expect(response.ok()).toBeTruthy();
  expect((await response.text()).length).toBeGreaterThan(100);

  const item = page.locator(ids.item);
  expect(await item.evaluate((element) => element.tagName)).toBe('ARTICLE');
  await expect(item).toHaveAttribute('data-state', 'rest');
  await expect(item).not.toHaveAttribute('role', /.+/);
  await expect(item).not.toHaveAttribute('tabindex', /.+/);
  await expect(item.locator('.ns-item__leading')).toHaveCount(1);
  await expect(item.locator('.ns-item__title')).toContainText('Foundry workspace');
  await expect(item.locator('.ns-item__description')).toHaveCount(1);
  await expect(item.locator('.ns-item__metadata')).toHaveCount(1);
  await expect(item.locator('.ns-item__trailing')).toHaveCount(1);
  await expect(item.locator('.ns-item__actions')).toHaveCount(1);
});

test('Item itself never enters Tab order while nested proven actions keep ordinary focus order and target size', async ({ page }) => {
  const item = page.locator(ids.item);
  const action = page.locator(ids.action);
  const after = page.locator(ids.after);

  expect(await item.evaluate((element) => element.tabIndex)).toBe(-1);
  await action.focus();
  await expect(action).toBeFocused();

  const geometry = await action.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });
  expect(geometry.width).toBeGreaterThanOrEqual(44);
  expect(geometry.height).toBeGreaterThanOrEqual(44);

  await page.keyboard.press('Tab');
  await expect(after).toBeFocused();
});

test('Item empty-row pointer activation does not focus or activate the nested action', async ({ page }) => {
  const item = page.locator(ids.item);
  const leading = item.locator('.ns-item__leading');
  const action = page.locator(ids.action);

  await page.evaluate(() => {
    window.__itemActionClicks = 0;
    document.querySelector('#item-demo-action').addEventListener('click', () => { window.__itemActionClicks += 1; });
  });

  await leading.click();
  expect(await page.evaluate(() => window.__itemActionClicks)).toBe(0);
  expect(await action.evaluate((element) => document.activeElement === element)).toBe(false);
  expect(await item.evaluate((element) => document.activeElement === element)).toBe(false);
  await expect(item).toHaveAttribute('data-state', 'rest');
});

test('Item manufactures no collection, selection, navigation, disclosure, or synthetic activation semantics', async ({ page }) => {
  const item = page.locator(ids.item);
  await expect(item.locator('[role="list"],[role="listitem"],[role="option"],[role="menuitem"],[role="treeitem"],[role="gridcell"]')).toHaveCount(0);
  await expect(item.locator('[aria-selected],[aria-current],[aria-expanded],[aria-checked],[aria-activedescendant]')).toHaveCount(0);
  await expect(item.locator('[tabindex]')).toHaveCount(0);
  await expect(item.locator('a')).toHaveCount(0);
  await expect(item.locator('button')).toHaveCount(1);
});

test('Item preserves authored region order and ordinary action focus behavior in RTL', async ({ page }) => {
  const item = page.locator(ids.item);
  const before = await item.locator(':scope > *').evaluateAll((nodes) => nodes.map((node) => node.className));
  await item.evaluate((element) => element.setAttribute('dir', 'rtl'));
  const after = await item.locator(':scope > *').evaluateAll((nodes) => nodes.map((node) => node.className));
  expect(after).toEqual(before);

  const direction = await item.evaluate((element) => getComputedStyle(element).direction);
  expect(direction).toBe('rtl');

  await page.locator(ids.action).focus();
  await page.keyboard.press('Tab');
  await expect(page.locator(ids.after)).toBeFocused();
});

test('Item wraps long localized content on narrow viewports without clipping or semantic reordering', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 760 });
  const item = page.locator(ids.item);
  await item.locator('.ns-item__title').evaluate((element) => {
    element.textContent = 'Extremely long localized workspace title that must remain readable without clipping essential content';
  });

  const state = await item.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const metadata = element.querySelector('.ns-item__metadata');
    return {
      left: rect.left,
      right: rect.right,
      width: rect.width,
      metadataOverflowWrap: getComputedStyle(metadata).overflowWrap,
      order: [...element.children].map((child) => child.className)
    };
  });

  expect(state.left).toBeGreaterThanOrEqual(0);
  expect(state.right).toBeLessThanOrEqual(360);
  expect(state.width).toBeLessThanOrEqual(360);
  expect(state.metadataOverflowWrap).toBe('anywhere');
  expect(state.order).toEqual(['ns-item__leading','ns-item__content','ns-item__trailing','ns-item__actions']);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});

test('Item forced-colors rendering keeps text and the authored row boundary perceivable', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/');

  const state = await page.locator(ids.item).evaluate((element) => {
    const style = getComputedStyle(element);
    const leading = getComputedStyle(element.querySelector('.ns-item__leading'));
    const description = getComputedStyle(element.querySelector('.ns-item__description'));
    return {
      borderStyle: style.borderBottomStyle,
      borderWidth: parseFloat(style.borderBottomWidth),
      color: style.color,
      leadingBorderStyle: leading.borderTopStyle,
      leadingBorderWidth: parseFloat(leading.borderTopWidth),
      descriptionColor: description.color
    };
  });

  expect(state.borderStyle).not.toBe('none');
  expect(state.borderWidth).toBeGreaterThan(0);
  expect(state.leadingBorderStyle).not.toBe('none');
  expect(state.leadingBorderWidth).toBeGreaterThan(0);
  expect(state.color).not.toBe('rgba(0, 0, 0, 0)');
  expect(state.descriptionColor).not.toBe('rgba(0, 0, 0, 0)');
});

test('Item CSS owns no control pressure, focus, state, depth, radius, or motion authority', async ({ request }) => {
  const response = await request.get('/item.css');
  expect(response.ok()).toBeTruthy();
  const css = await response.text();

  for (const forbidden of [
    'cursor: pointer',
    'tabindex',
    'role="button"',
    'aria-selected',
    'aria-current',
    'aria-expanded',
    'var(--ns-color-action-',
    'var(--ns-color-focus-',
    'var(--ns-depth-',
    'var(--ns-press-',
    'var(--ns-motion-',
    'var(--ns-radius-',
    'transition:',
    'transition-property',
    'animation:',
    'transform:',
    'box-shadow:'
  ]) {
    expect(css, forbidden).not.toContain(forbidden);
  }

  expect(css).toContain('flex-wrap: wrap');
  expect(css).toContain('@media (forced-colors: active)');
});
