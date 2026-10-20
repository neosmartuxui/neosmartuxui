import { test, expect } from '@playwright/test';

const ids = {
  root: '#context-menu-demo',
  target: '#context-menu-target',
  menu: '#context-menu-menu',
  open: '#context-menu-item-open',
  check: '#context-menu-item-pin',
  compact: '#context-menu-item-compact',
  comfortable: '#context-menu-item-comfortable',
  disabled: '#context-menu-item-archive',
  visible: '#context-menu-visible-action',
  after: '#context-menu-after',
  outside: '#context-menu-outside'
};

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#context-menu-slice')).toContainText('core.context-menu');
  expect(errors).toEqual([]);
});

test('ContextMenu deploys one explicit reachable target, one named non-modal menu, and a visible fallback action', async ({ page, request }) => {
  for (const asset of ['context-menu.css', 'context-menu.mjs', 'menu-items.mjs']) {
    const response = await request.get('/' + asset);
    expect(response.ok(), asset).toBeTruthy();
    expect((await response.text()).length, asset).toBeGreaterThan(100);
  }
  const target = page.locator(ids.target);
  const menu = page.locator(ids.menu);
  await expect(target).toHaveJSProperty('tagName', 'BUTTON');
  await expect(target).toHaveAttribute('type', 'button');
  await expect(target).not.toHaveAttribute('aria-haspopup', /.+/);
  await expect(target).not.toHaveAttribute('aria-expanded', /.+/);
  await expect(target).not.toHaveAttribute('aria-controls', /.+/);
  await expect(menu).toHaveAttribute('role', 'menu');
  await expect(menu).toHaveAttribute('aria-label', 'Project card actions');
  await expect(menu).toHaveAttribute('hidden', '');
  await expect(menu).not.toHaveAttribute('aria-modal', /.+/);
  await expect(menu.locator('[role="menu"]')).toHaveCount(0);
  await expect(menu.locator('[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]')).toHaveCount(5);
  await expect(menu.locator('[role="separator"][tabindex]')).toHaveCount(0);
  await expect(page.locator(ids.visible)).toBeVisible();
});

test('ContextMenu secondary context invocation opens at pointer coordinates and reinvocation repositions the same surface', async ({ page }) => {
  const target = page.locator(ids.target);
  const menu = page.locator(ids.menu);
  const box = await target.boundingBox();
  expect(box).not.toBeNull();
  const dispatchContext = async (x, y) => target.evaluate((element, point) => {
    const event = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      button: 2,
      clientX: point.x,
      clientY: point.y
    });
    element.dispatchEvent(event);
    return event.defaultPrevented;
  }, { x, y });
  expect(await dispatchContext(box.x + 6, box.y + 7)).toBe(true);
  await expect(menu).toBeVisible();
  await expect(menu).toHaveAttribute('data-context-menu-anchor', 'point');
  await expect(page.locator(ids.open)).toBeFocused();
  const first = await menu.boundingBox();

  expect(await dispatchContext(box.x + Math.min(40, box.width - 2), box.y + Math.min(35, box.height - 2))).toBe(true);
  await expect(menu).toBeVisible();
  await expect(page.locator(ids.open)).toBeFocused();
  const second = await menu.boundingBox();
  expect(Math.abs(second.x - first.x) + Math.abs(second.y - first.y)).toBeGreaterThan(1);
  await expect(page.locator(ids.root).locator('[role="menu"]')).toHaveCount(1);
});

test('ContextMenu keyboard invocation supports Shift+F10 and ContextMenu key while ordinary primary click remains native', async ({ page }) => {
  const target = page.locator(ids.target);
  const menu = page.locator(ids.menu);
  const first = page.locator(ids.open);

  await target.click();
  await expect(menu).toBeHidden();

  await target.focus();
  await page.keyboard.press('Shift+F10');
  await expect(menu).toBeVisible();
  await expect(menu).toHaveAttribute('data-context-menu-anchor', 'target');
  await expect(first).toBeFocused();
  expect(await first.evaluate((element) => element.matches(':focus-visible'))).toBe(true);

  await page.keyboard.press('Escape');
  await expect(target).toBeFocused();
  await page.keyboard.press('ContextMenu');
  await expect(menu).toBeVisible();
  await expect(first).toBeFocused();
});

test('ContextMenu composite keyboard law wraps, typeaheads to disabled items, and keeps disabled activation inert', async ({ page }) => {
  const target = page.locator(ids.target);
  const menu = page.locator(ids.menu);
  const first = page.locator(ids.open);
  const disabled = page.locator(ids.disabled);
  await page.evaluate(() => {
    window.__contextActivations = [];
    document.querySelector('#context-menu-demo').addEventListener('ns-context-menu-activate', (event) => window.__contextActivations.push(event.detail));
  });

  await target.focus();
  await page.keyboard.press('Shift+F10');
  await expect(first).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(disabled).toBeFocused();
  await page.keyboard.press('Home');
  await expect(first).toBeFocused();
  await page.keyboard.press('End');
  await expect(disabled).toBeFocused();
  await page.keyboard.press('Home');
  await page.keyboard.press('a');
  await expect(disabled).toBeFocused();
  await expect(disabled).toHaveAttribute('aria-disabled', 'true');
  await page.keyboard.press('Enter');
  await expect(menu).toBeVisible();
  await expect(disabled).toBeFocused();
  expect(await page.evaluate(() => window.__contextActivations.length)).toBe(0);
});

test('ContextMenu checkable items stay open while plain activation emits locally, closes, and restores target focus', async ({ page }) => {
  const target = page.locator(ids.target);
  const menu = page.locator(ids.menu);
  const checkbox = page.locator(ids.check);
  const compact = page.locator(ids.compact);
  const comfortable = page.locator(ids.comfortable);
  await page.evaluate(() => {
    window.__contextActivations = [];
    document.querySelector('#context-menu-demo').addEventListener('ns-context-menu-activate', (event) => window.__contextActivations.push(event.detail));
  });

  await target.focus();
  await page.keyboard.press('Shift+F10');
  await checkbox.click();
  await expect(checkbox).toHaveAttribute('aria-checked', 'true');
  await expect(menu).toBeVisible();
  await comfortable.click();
  await expect(compact).toHaveAttribute('aria-checked', 'false');
  await expect(comfortable).toHaveAttribute('aria-checked', 'true');
  await expect(menu).toBeVisible();

  await page.locator(ids.open).click();
  await expect(menu).toBeHidden();
  await expect(target).toBeFocused();
  const activations = await page.evaluate(() => window.__contextActivations);
  expect(activations).toHaveLength(3);
  expect(activations[0]).toMatchObject({ itemId: 'context-menu-item-pin', role: 'menuitemcheckbox', checked: true });
  expect(activations[1]).toMatchObject({ itemId: 'context-menu-item-comfortable', role: 'menuitemradio', checked: true });
  expect(activations[2]).toEqual({ itemId: 'context-menu-item-open', role: 'menuitem', checked: null });
});

test('ContextMenu Escape restores target while Tab and Shift+Tab preserve ordinary document traversal', async ({ page }) => {
  const target = page.locator(ids.target);
  const menu = page.locator(ids.menu);
  const first = page.locator(ids.open);
  const visible = page.locator(ids.visible);

  await target.focus();
  await page.keyboard.press('Shift+F10');
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(target).toBeFocused();

  await page.keyboard.press('Shift+F10');
  await expect(first).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(visible).toBeFocused();
  await expect(menu).toBeHidden();

  await target.focus();
  await page.keyboard.press('Shift+F10');
  await expect(first).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(target).toBeFocused();
  await expect(menu).toBeHidden();
});

test('ContextMenu outside activation light-dismisses without focus theft and native context menus remain untouched elsewhere', async ({ page }) => {
  const target = page.locator(ids.target);
  const menu = page.locator(ids.menu);
  const outside = page.locator(ids.outside);
  await target.focus();
  await page.keyboard.press('Shift+F10');
  await outside.click();
  await expect(menu).toBeHidden();
  await expect(outside).toBeFocused();

  const nativePreserved = await outside.evaluate((element) => {
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 });
    element.dispatchEvent(event);
    return !event.defaultPrevented;
  });
  expect(nativePreserved).toBe(true);
});

test('ContextMenu long-press opens only after a deliberate hold and cancels on tap, movement, and nested editing', async ({ page }) => {
  const target = page.locator(ids.target);
  const menu = page.locator(ids.menu);

  const pointer = async (type, init) => target.dispatchEvent(type, { pointerType: 'touch', button: 0, pointerId: 77, clientX: 40, clientY: 40, ...init });
  await pointer('pointerdown', {});
  await pointer('pointerup', {});
  await page.waitForTimeout(600);
  await expect(menu).toBeHidden();

  await pointer('pointerdown', {});
  await pointer('pointermove', { clientX: 70, clientY: 70 });
  await page.waitForTimeout(600);
  await expect(menu).toBeHidden();

  await pointer('pointerdown', {});
  await page.waitForTimeout(600);
  await expect(menu).toBeVisible();
  await expect(menu).toHaveAttribute('data-context-menu-anchor', 'point');
  await page.keyboard.press('Escape');

  const nativeEditable = await target.evaluate((element) => {
    const input = document.createElement('input');
    input.type = 'text';
    element.append(input);
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 });
    input.dispatchEvent(event);
    input.remove();
    return !event.defaultPrevented;
  });
  expect(nativeEditable).toBe(true);
  await expect(menu).toBeHidden();
});

test('ContextMenu rejects manufactured target reachability, submenu, modal, and navigation authority', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const module = await import('./context-menu.mjs');
    const root = document.querySelector('#context-menu-demo');
    const target = document.querySelector('#context-menu-target');
    const menu = document.querySelector('#context-menu-menu');
    const item = document.querySelector('#context-menu-item-open');
    const failures = {};

    target.setAttribute('tabindex', '-1');
    try { module.syncContextMenuState(root); } catch (error) { failures.target = error.message; }
    target.removeAttribute('tabindex');

    item.setAttribute('aria-haspopup', 'menu');
    try { module.syncContextMenuState(root); } catch (error) { failures.submenu = error.message; }
    item.removeAttribute('aria-haspopup');

    const anchor = document.createElement('a');
    anchor.href = '#forbidden';
    anchor.textContent = 'Nested link';
    item.append(anchor);
    try { module.syncContextMenuState(root); } catch (error) { failures.navigation = error.message; }
    anchor.remove();

    menu.setAttribute('aria-modal', 'true');
    try { module.syncContextMenuState(root); } catch (error) { failures.modal = error.message; }
    menu.removeAttribute('aria-modal');
    return failures;
  });

  expect(result.target).toContain('already be keyboard reachable');
  expect(result.submenu).toContain('nested submenu authority');
  expect(result.navigation).toContain('must not smuggle navigation');
  expect(result.modal).toContain('must not claim modal semantics');
});

test('ContextMenu keyboard anchoring honors RTL and narrow viewport/reduced-motion/forced-colors constraints', async ({ page }) => {
  await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
  const target = page.locator(ids.target);
  const menu = page.locator(ids.menu);
  const first = page.locator(ids.open);

  await target.scrollIntoViewIfNeeded();
  await target.focus();
  await page.keyboard.press('Shift+F10');
  await expect(menu).toBeVisible();
  await expect(first).toBeFocused();
  const targetWide = await target.boundingBox();
  const menuWide = await menu.boundingBox();
  expect(Math.abs(menuWide.x + menuWide.width - targetWide.x - targetWide.width)).toBeLessThanOrEqual(3);

  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 360, height: 640 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await target.scrollIntoViewIfNeeded();
  await target.focus();
  await page.keyboard.press('Shift+F10');
  await expect(menu).toBeVisible();
  await expect(first).toBeFocused();
  const geometry = await menu.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, transitionDuration: style.transitionDuration };
  });
  expect(parseFloat(geometry.transitionDuration)).toBeLessThanOrEqual(0.001);
  expect(geometry.left).toBeGreaterThanOrEqual(0);
  expect(geometry.right).toBeLessThanOrEqual(360);
  expect(geometry.top).toBeGreaterThanOrEqual(0);
  expect(geometry.bottom).toBeLessThanOrEqual(640);
  expect(parseFloat(await first.evaluate((element) => getComputedStyle(element).transitionDuration))).toBeLessThanOrEqual(0.001);

  await page.keyboard.press('Escape');
  await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'active' });
  await page.keyboard.press('Shift+F10');
  expect(await menu.evaluate((element) => getComputedStyle(element).forcedColorAdjust)).toBe('auto');
  expect(await first.evaluate((element) => getComputedStyle(element).forcedColorAdjust)).toBe('auto');
});
