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
    direction: style.direction
  };
});

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#multi-select-slice')).toContainText('core.multi-select');
  expect(errors).toEqual([]);
});

test('MultiSelect deploys one explicit aria-multiselectable listbox authority', async ({ page, request }) => {
  for (const asset of ['multi-select.css', 'multi-select.mjs']) {
    const response = await request.get('/' + asset);
    expect(response.ok(), asset).toBeTruthy();
    expect((await response.text()).length, asset).toBeGreaterThan(100);
  }

  const root = page.locator('#multi-select-demo');
  const trigger = page.locator('#multi-select-trigger');
  const list = page.locator('#multi-select-listbox');
  const options = list.locator('[role="option"]');

  expect(await trigger.evaluate((el) => [el.tagName, el.type])).toEqual(['BUTTON', 'button']);
  await expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(list).toHaveAttribute('role', 'listbox');
  await expect(list).toHaveAttribute('aria-multiselectable', 'true');
  expect(await list.evaluate((el) => el.tabIndex)).toBe(-1);
  expect(await options.count()).toBe(4);
  expect(await options.evaluateAll((nodes) => nodes.map((node) => [
    node.id,
    node.getAttribute('aria-selected'),
    node.dataset.value
  ]))).toEqual([
    ['multi-select-option-react', 'false', 'react'],
    ['multi-select-option-vue', 'false', 'vue'],
    ['multi-select-option-svelte', 'false', 'svelte'],
    ['multi-select-option-solid', 'false', 'solid']
  ]);
  await expect(root).toHaveAttribute('data-state', 'closed');
  await expect(root).toHaveAttribute('data-selection-state', 'none-selected');
  await expect(root).toHaveAttribute('data-selected-count', '0');
});

test('MultiSelect keeps transient highlight separate from persistent zero-or-more selection', async ({ page }) => {
  const root = page.locator('#multi-select-demo');
  const trigger = page.locator('#multi-select-trigger');
  const list = page.locator('#multi-select-listbox');
  const react = page.locator('#multi-select-option-react');
  const vue = page.locator('#multi-select-option-vue');
  const svelte = page.locator('#multi-select-option-svelte');

  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(root).toHaveAttribute('data-state', 'open');
  await expect(list).toBeFocused();
  await expect(list).toHaveAttribute('aria-activedescendant', 'multi-select-option-react');
  await expect(react).toHaveAttribute('aria-selected', 'false');

  await list.press('Space');
  await expect(react).toHaveAttribute('aria-selected', 'true');
  await expect(root).toHaveAttribute('data-selection-state', 'selected');
  await expect(root).toHaveAttribute('data-selected-count', '1');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');

  await list.press('ArrowDown');
  await expect(list).toHaveAttribute('aria-activedescendant', 'multi-select-option-vue');
  await expect(react).toHaveAttribute('aria-selected', 'true');
  await expect(vue).toHaveAttribute('aria-selected', 'false');

  await list.press('Enter');
  await expect(vue).toHaveAttribute('aria-selected', 'true');
  await expect(root).toHaveAttribute('data-selected-count', '2');
  await expect(root).toHaveAttribute('data-selected-values', 'react vue');

  await list.press('ArrowDown');
  await expect(list).toHaveAttribute('aria-activedescendant', 'multi-select-option-svelte');
  await expect(svelte).toHaveAttribute('aria-selected', 'false');
  await expect(root).toHaveAttribute('data-highlight-state', 'highlighted');
  await expect(root).toHaveAttribute('data-highlighted-value', 'svelte');
  await expect(root).toHaveAttribute('data-selected-count', '2');

  await list.press('Escape');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(root).toHaveAttribute('data-state', 'closed');
  await expect(trigger).toBeFocused();
  await expect(react).toHaveAttribute('aria-selected', 'true');
  await expect(vue).toHaveAttribute('aria-selected', 'true');
  await expect(root).toHaveAttribute('data-highlight-state', 'none');
});

test('MultiSelect preserves browser-owned Tab traversal and skips disabled options', async ({ page }) => {
  const root = page.locator('#multi-select-demo');
  const trigger = page.locator('#multi-select-trigger');
  const list = page.locator('#multi-select-listbox');
  const solid = page.locator('#multi-select-option-solid');

  await root.evaluate((element) => {
    const before = document.createElement('button');
    before.id = 'multi-select-before';
    before.textContent = 'Before';
    const after = document.createElement('button');
    after.id = 'multi-select-after';
    after.textContent = 'After';
    element.before(before);
    element.after(after);
  });

  await trigger.focus();
  await trigger.press('ArrowUp');
  await expect(list).toBeFocused();
  await expect(list).toHaveAttribute('aria-activedescendant', 'multi-select-option-svelte');
  await list.press('ArrowDown');
  await expect(list).toHaveAttribute('aria-activedescendant', 'multi-select-option-react');

  await list.press('Tab');
  await expect(page.locator('#multi-select-after')).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');

  await page.locator('#multi-select-after').press('Shift+Tab');
  await expect(trigger).toBeFocused();

  await trigger.click();
  await expect(list).toBeFocused();
  await solid.click({ force: true });
  await expect(solid).toHaveAttribute('aria-selected', 'false');
  await expect(root).toHaveAttribute('data-selected-count', '0');
});

test('MultiSelect gives pressure only to its disclosure trigger, not option rows', async ({ page }) => {
  const trigger = page.locator('#multi-select-trigger');
  const option = page.locator('#multi-select-option-react');

  await trigger.hover();
  await expect.poll(async () => (await transformState(trigger)).x, { timeout: 750 }).toBeCloseTo(2, 1);
  await expect.poll(async () => (await transformState(trigger)).y, { timeout: 750 }).toBeCloseTo(2, 1);

  const box = await trigger.boundingBox();
  if (!box) throw new Error('MultiSelect trigger has no pointer box');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect.poll(async () => (await transformState(trigger)).x, { timeout: 750 }).toBeCloseTo(5, 1);
  await expect.poll(async () => (await transformState(trigger)).y, { timeout: 750 }).toBeCloseTo(5, 1);
  await page.mouse.up();

  await expect(page.locator('#multi-select-listbox')).toBeFocused();
  await option.hover();
  expect((await transformState(option)).transform).toBe('none');
  const optionBox = await option.boundingBox();
  if (!optionBox) throw new Error('MultiSelect option has no pointer box');
  await page.mouse.move(optionBox.x + optionBox.width / 2, optionBox.y + optionBox.height / 2);
  await page.mouse.down();
  expect((await transformState(option)).transform).toBe('none');
  await page.mouse.up();
});

test('MultiSelect helpers preserve invalid, disabled, and explicit multi-value state', async ({ page }) => {
  const root = page.locator('#multi-select-demo');
  const trigger = page.locator('#multi-select-trigger');
  const list = page.locator('#multi-select-listbox');
  const react = page.locator('#multi-select-option-react');
  const svelte = page.locator('#multi-select-option-svelte');

  await page.evaluate(async () => {
    const module = await import('./multi-select.mjs');
    const root = document.querySelector('#multi-select-demo');
    module.setMultiSelectSelection(root, ['react', 'svelte']);
    module.setMultiSelectInvalid(root, true);
  });
  await expect(react).toHaveAttribute('aria-selected', 'true');
  await expect(svelte).toHaveAttribute('aria-selected', 'true');
  await expect(root).toHaveAttribute('data-selected-count', '2');
  await expect(list).toHaveAttribute('aria-invalid', 'true');
  await expect(root).toHaveAttribute('data-state', 'invalid');

  await page.evaluate(async () => {
    const module = await import('./multi-select.mjs');
    const root = document.querySelector('#multi-select-demo');
    module.setMultiSelectInvalid(root, false);
    module.setMultiSelectOpen(root, true);
    module.setMultiSelectDisabled(root, true);
  });
  await expect(trigger).toBeDisabled();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(list).toHaveAttribute('aria-disabled', 'true');
  await expect(root).toHaveAttribute('data-state', 'disabled');
  await expect(react).toHaveAttribute('aria-selected', 'true');
  await expect(svelte).toHaveAttribute('aria-selected', 'true');
});

test('MultiSelect retains RTL, reduced-motion, forced-colors, and narrow-layout support', async ({ page }) => {
  const root = page.locator('#multi-select-demo');
  const trigger = page.locator('#multi-select-trigger');

  await root.evaluate((element) => element.setAttribute('dir', 'rtl'));
  expect((await transformState(root)).direction).toBe('rtl');
  await trigger.click();
  await page.locator('#multi-select-option-svelte').evaluate((element) => {
    element.textContent = 'خيار طويل جدا للتحقق من الالتفاف داخل قائمة الاختيار المتعدد بدون تمرير أفقي';
  });
  let metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  expect(parseFloat((await transformState(page.locator('#multi-select-trigger'))).transitionDuration)).toBeLessThanOrEqual(0.001);

  await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'active' });
  await page.goto('/');
  await page.locator('#multi-select-trigger').focus();
  const forced = await transformState(page.locator('#multi-select-trigger'));
  expect(forced.forcedColorAdjust).toBe('auto');
  expect(parseFloat(forced.outlineWidth)).toBeGreaterThan(0);

  await page.emulateMedia({ forcedColors: 'none' });
  await page.setViewportSize({ width: 375, height: 1100 });
  await page.goto('/');
  await page.locator('#multi-select-trigger').click();
  metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
});
