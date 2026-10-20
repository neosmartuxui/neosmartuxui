import { test, expect } from '@playwright/test';

const ids = {
  root: '#dropdown-menu-demo',
  trigger: '#dropdown-menu-trigger',
  menu: '#dropdown-menu-menu',
  open: '#dropdown-menu-item-open',
  check: '#dropdown-menu-item-pin',
  compact: '#dropdown-menu-item-compact',
  comfortable: '#dropdown-menu-item-comfortable',
  disabled: '#dropdown-menu-item-archive',
  after: '#dropdown-menu-after'
};

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#dropdown-menu-slice')).toContainText('core.dropdown-menu');
  expect(errors).toEqual([]);
});

test('DropdownMenu deploys one native menu button and one labelled non-modal menu', async ({ page, request }) => {
  for (const asset of ['dropdown-menu.css', 'dropdown-menu.mjs']) {
    const response = await request.get('/' + asset);
    expect(response.ok(), asset).toBeTruthy();
    expect((await response.text()).length, asset).toBeGreaterThan(100);
  }

  const trigger = page.locator(ids.trigger);
  const menu = page.locator(ids.menu);
  await expect(trigger).toHaveJSProperty('tagName', 'BUTTON');
  await expect(trigger).toHaveAttribute('type', 'button');
  await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger).toHaveAttribute('aria-controls', 'dropdown-menu-menu');
  await expect(menu).toHaveAttribute('role', 'menu');
  await expect(menu).toHaveAttribute('aria-labelledby', 'dropdown-menu-trigger');
  await expect(menu).toHaveAttribute('hidden', '');
  await expect(menu).not.toHaveAttribute('aria-modal', /.+/);
  await expect(menu.locator('[role="menu"]')).toHaveCount(0);
  await expect(menu.locator('[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]')).toHaveCount(5);
  await expect(menu.locator('[role="separator"][tabindex]')).toHaveCount(0);
});

test('DropdownMenu trigger and composite keyboard law include disabled-item discoverability', async ({ page }) => {
  const trigger = page.locator(ids.trigger);
  const menu = page.locator(ids.menu);
  const first = page.locator(ids.open);
  const disabled = page.locator(ids.disabled);

  await page.evaluate(() => {
    window.__dropdownActivations = [];
    document.querySelector('#dropdown-menu-demo').addEventListener('ns-dropdown-menu-activate', (event) => {
      window.__dropdownActivations.push(event.detail);
    });
  });

  await trigger.focus();
  await page.keyboard.press('ArrowDown');
  await expect(menu).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
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
  expect(await page.evaluate(() => window.__dropdownActivations.length)).toBe(0);
});

test('DropdownMenu checkable and radio items update local state while the menu stays open', async ({ page }) => {
  const trigger = page.locator(ids.trigger);
  const menu = page.locator(ids.menu);
  const checkbox = page.locator(ids.check);
  const compact = page.locator(ids.compact);
  const comfortable = page.locator(ids.comfortable);

  await page.evaluate(() => {
    window.__dropdownActivations = [];
    document.querySelector('#dropdown-menu-demo').addEventListener('ns-dropdown-menu-activate', (event) => {
      window.__dropdownActivations.push(event.detail);
    });
  });

  await trigger.click();
  await expect(menu).toBeVisible();

  await checkbox.click();
  await expect(checkbox).toHaveAttribute('aria-checked', 'true');
  await expect(checkbox).toBeFocused();
  await expect(menu).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');

  await comfortable.click();
  await expect(compact).toHaveAttribute('aria-checked', 'false');
  await expect(comfortable).toHaveAttribute('aria-checked', 'true');
  await expect(comfortable).toBeFocused();
  await expect(menu).toBeVisible();

  const activations = await page.evaluate(() => window.__dropdownActivations);
  expect(activations).toHaveLength(2);
  expect(activations[0]).toMatchObject({ itemId: 'dropdown-menu-item-pin', role: 'menuitemcheckbox', checked: true });
  expect(activations[1]).toMatchObject({ itemId: 'dropdown-menu-item-comfortable', role: 'menuitemradio', checked: true });
});

test('DropdownMenu plain command activation emits a local signal, closes, and restores trigger focus', async ({ page }) => {
  const trigger = page.locator(ids.trigger);
  const menu = page.locator(ids.menu);
  const item = page.locator(ids.open);

  await page.evaluate(() => {
    window.__dropdownActivations = [];
    document.querySelector('#dropdown-menu-demo').addEventListener('ns-dropdown-menu-activate', (event) => {
      window.__dropdownActivations.push(event.detail);
    });
  });

  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(menu).toBeVisible();
  await expect(item).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(menu).toBeHidden();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger).toBeFocused();
  const activations = await page.evaluate(() => window.__dropdownActivations);
  expect(activations).toEqual([{ itemId: 'dropdown-menu-item-open', role: 'menuitem', checked: null }]);
});

test('DropdownMenu Escape restores trigger while Tab and Shift+Tab preserve ordinary document traversal', async ({ page }) => {
  const trigger = page.locator(ids.trigger);
  const menu = page.locator(ids.menu);
  const first = page.locator(ids.open);
  const after = page.locator(ids.after);

  await trigger.focus();
  await page.keyboard.press('ArrowDown');
  await expect(first).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();

  await page.keyboard.press('ArrowDown');
  await expect(first).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(after).toBeFocused();
  await expect(menu).toBeHidden();

  await trigger.focus();
  await page.keyboard.press('ArrowDown');
  await expect(first).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(trigger).toBeFocused();
  await expect(menu).toBeHidden();
});

test('DropdownMenu outside activation light-dismisses without stealing outside focus', async ({ page }) => {
  const trigger = page.locator(ids.trigger);
  const menu = page.locator(ids.menu);
  const outside = page.locator('#dropdown-menu-outside');

  await trigger.click();
  await expect(menu).toBeVisible();
  await outside.click();
  await expect(menu).toBeHidden();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(outside).toBeFocused();
});

test('DropdownMenu leaves context-menu invocation paths untouched and rejects nested/menu-value authority', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const module = await import('./dropdown-menu.mjs');
    const root = document.querySelector('#dropdown-menu-demo');
    const trigger = document.querySelector('#dropdown-menu-trigger');
    const menu = document.querySelector('#dropdown-menu-menu');
    const item = document.querySelector('#dropdown-menu-item-open');

    const context = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 });
    trigger.dispatchEvent(context);
    const shiftF10 = new KeyboardEvent('keydown', { key: 'F10', shiftKey: true, bubbles: true, cancelable: true });
    trigger.dispatchEvent(shiftF10);
    const contextKey = new KeyboardEvent('keydown', { key: 'ContextMenu', bubbles: true, cancelable: true });
    trigger.dispatchEvent(contextKey);

    const failures = {};
    item.setAttribute('aria-haspopup', 'menu');
    try { module.syncDropdownMenuState(root); } catch (error) { failures.submenu = error.message; }
    item.removeAttribute('aria-haspopup');

    const anchor = document.createElement('a');
    anchor.href = '#forbidden';
    anchor.textContent = 'Nested link';
    item.append(anchor);
    try { module.syncDropdownMenuState(root); } catch (error) { failures.navigation = error.message; }
    anchor.remove();

    menu.setAttribute('aria-modal', 'true');
    try { module.syncDropdownMenuState(root); } catch (error) { failures.modal = error.message; }
    menu.removeAttribute('aria-modal');

    return {
      defaultPrevented: { context: context.defaultPrevented, shiftF10: shiftF10.defaultPrevented, contextKey: contextKey.defaultPrevented },
      expanded: trigger.getAttribute('aria-expanded'),
      failures
    };
  });

  expect(result.defaultPrevented).toEqual({ context: false, shiftF10: false, contextKey: false });
  expect(result.expanded).toBe('false');
  expect(result.failures.submenu).toContain('nested submenu authority');
  expect(result.failures.navigation).toContain('must not smuggle navigation');
  expect(result.failures.modal).toContain('must not claim modal semantics');
});

test('DropdownMenu logical inline placement preserves inline-end meaning in RTL', async ({ page }) => {
  const trigger = page.locator(ids.trigger);
  const menu = page.locator(ids.menu);

  await trigger.scrollIntoViewIfNeeded();
  await page.evaluate(async () => {
    const module = await import('./dropdown-menu.mjs');
    const root = document.querySelector('#dropdown-menu-demo');
    module.setDropdownMenuPlacement(root, 'inline-end', 'start');
    module.setDropdownMenuOpen(root, true, { focus: false });
  });
  const triggerLtr = await trigger.boundingBox();
  const menuLtr = await menu.boundingBox();
  expect(menuLtr.x).toBeGreaterThanOrEqual(triggerLtr.x + triggerLtr.width - 1);

  await page.evaluate(async () => {
    document.documentElement.setAttribute('dir', 'rtl');
    const module = await import('./dropdown-menu.mjs');
    const root = document.querySelector('#dropdown-menu-demo');
    module.setDropdownMenuPlacement(root, 'inline-end', 'start');
  });
  const triggerRtl = await trigger.boundingBox();
  const menuRtl = await menu.boundingBox();
  await expect(menu).toHaveAttribute('data-dropdown-menu-side', 'inline-end');
  expect(menuRtl.x + menuRtl.width).toBeLessThanOrEqual(triggerRtl.x + 1);
});

test('DropdownMenu reduced motion, forced colors, and narrow viewport remain bounded and focus-visible', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.emulateMedia({ reducedMotion: 'reduce' });

  const trigger = page.locator(ids.trigger);
  const menu = page.locator(ids.menu);
  const first = page.locator(ids.open);
  await trigger.scrollIntoViewIfNeeded();
  await trigger.focus();
  await page.keyboard.press('ArrowDown');
  await expect(menu).toBeVisible();
  await expect(first).toBeFocused();

  const geometry = await menu.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom,
      transitionDuration: style.transitionDuration,
      forcedColorAdjust: style.forcedColorAdjust
    };
  });
  expect(parseFloat(geometry.transitionDuration)).toBeLessThanOrEqual(0.001);
  expect(geometry.left).toBeGreaterThanOrEqual(0);
  expect(geometry.right).toBeLessThanOrEqual(360);
  expect(geometry.top).toBeGreaterThanOrEqual(0);
  expect(geometry.bottom).toBeLessThanOrEqual(640);

  const itemDuration = await first.evaluate((element) => getComputedStyle(element).transitionDuration);
  expect(parseFloat(itemDuration)).toBeLessThanOrEqual(0.001);

  await page.keyboard.press('Escape');
  await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'active' });
  await page.keyboard.press('ArrowDown');
  await expect(menu).toBeVisible();
  expect(await menu.evaluate((element) => getComputedStyle(element).forcedColorAdjust)).toBe('auto');
  expect(await first.evaluate((element) => getComputedStyle(element).forcedColorAdjust)).toBe('auto');
});
