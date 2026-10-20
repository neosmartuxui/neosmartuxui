import { test, expect } from '@playwright/test';

const ids = {
  root: '#menubar-demo',
  bar: '#menubar-root',
  file: '#menubar-file',
  edit: '#menubar-edit',
  autosave: '#menubar-autosave',
  refresh: '#menubar-refresh',
  disabledRoot: '#menubar-publish',
  fileMenu: '#menubar-file-menu',
  editMenu: '#menubar-edit-menu',
  first: '#menubar-new',
  check: '#menubar-pin',
  compact: '#menubar-density-compact',
  comfortable: '#menubar-density-comfortable',
  disabledSub: '#menubar-export',
  after: '#menubar-after',
  outside: '#menubar-outside'
};

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#menubar-slice')).toContainText('core.menubar');
  expect(errors).toEqual([]);
});

test('Menubar deploys one named persistent composite, two first-level menus, and no nested menu authority', async ({ page, request }) => {
  for (const asset of ['menubar.css', 'menubar.mjs', 'menu-items.mjs']) {
    const response = await request.get('/' + asset);
    expect(response.ok(), asset).toBeTruthy();
    expect((await response.text()).length, asset).toBeGreaterThan(100);
  }

  const bar = page.locator(ids.bar);
  await expect(bar).toHaveAttribute('role', 'menubar');
  await expect(bar).toHaveAttribute('aria-label', 'Document commands');
  await expect(bar.locator(':scope > [role="menuitem"], :scope > [role="menuitemcheckbox"], :scope > [role="menuitemradio"]')).toHaveCount(5);
  await expect(bar.locator(':scope > [tabindex="0"]')).toHaveCount(1);
  await expect(page.locator(ids.fileMenu)).toHaveAttribute('role', 'menu');
  await expect(page.locator(ids.editMenu)).toHaveAttribute('role', 'menu');
  await expect(page.locator(ids.fileMenu)).toBeHidden();
  await expect(page.locator(ids.editMenu)).toBeHidden();
  await expect(page.locator(ids.fileMenu).locator('[aria-haspopup]')).toHaveCount(0);
  await expect(page.locator(ids.fileMenu).locator('a[href],button,input,select,textarea,[contenteditable="true"]')).toHaveCount(0);
  await expect(page.locator(ids.fileMenu)).not.toHaveAttribute('aria-modal', /.+/);
});

test('Menubar root roving focus wraps, supports Home End and typeahead, and keeps disabled root activation inert', async ({ page }) => {
  await page.evaluate(() => {
    window.__menubarActivations = [];
    document.querySelector('#menubar-demo').addEventListener('ns-menubar-activate', (event) => window.__menubarActivations.push(event.detail));
  });
  const file = page.locator(ids.file);
  const disabled = page.locator(ids.disabledRoot);

  await file.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(disabled).toBeFocused();
  await expect(disabled).toHaveAttribute('tabindex', '0');
  await expect(file).toHaveAttribute('tabindex', '-1');

  await page.keyboard.press('Home');
  await expect(file).toBeFocused();
  await page.keyboard.press('End');
  await expect(disabled).toBeFocused();
  await page.keyboard.press('Home');
  await page.keyboard.press('p');
  await expect(disabled).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(disabled).toBeFocused();
  expect(await page.evaluate(() => window.__menubarActivations)).toEqual([]);
});

test('Menubar root checkable activation updates local state and preserves the composite Tab stop', async ({ page }) => {
  await page.evaluate(() => {
    window.__menubarActivations = [];
    document.querySelector('#menubar-demo').addEventListener('ns-menubar-activate', (event) => window.__menubarActivations.push(event.detail));
  });
  const autosave = page.locator(ids.autosave);
  await autosave.focus();
  await page.keyboard.press('Space');
  await expect(autosave).toHaveAttribute('aria-checked', 'false');
  await expect(autosave).toBeFocused();
  await expect(autosave).toHaveAttribute('tabindex', '0');
  await expect(page.locator(ids.bar).locator(':scope > [tabindex="0"]')).toHaveCount(1);
  expect(await page.evaluate(() => window.__menubarActivations)).toEqual([
    { itemId: 'menubar-autosave', role: 'menuitemcheckbox', checked: false }
  ]);
});

test('Menubar opens first-level menus from root keyboard commands and submenu navigation wraps with disabled discovery', async ({ page }) => {
  const file = page.locator(ids.file);
  const menu = page.locator(ids.fileMenu);
  const first = page.locator(ids.first);
  const disabled = page.locator(ids.disabledSub);

  await file.focus();
  await page.keyboard.press('ArrowDown');
  await expect(menu).toBeVisible();
  await expect(file).toHaveAttribute('aria-expanded', 'true');
  await expect(first).toBeFocused();

  await page.keyboard.press('ArrowUp');
  await expect(disabled).toBeFocused();
  await page.keyboard.press('Home');
  await expect(first).toBeFocused();
  await page.keyboard.press('End');
  await expect(disabled).toBeFocused();
  await page.keyboard.press('Home');
  await page.keyboard.press('e');
  await expect(disabled).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(menu).toBeVisible();
  await expect(disabled).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(file).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(menu).toBeVisible();
  await expect(disabled).toBeFocused();
});

test('Menubar submenu checkable/radio activation stays local while plain activation closes and restores its root owner', async ({ page }) => {
  await page.evaluate(() => {
    window.__menubarActivations = [];
    document.querySelector('#menubar-demo').addEventListener('ns-menubar-activate', (event) => window.__menubarActivations.push(event.detail));
  });
  const file = page.locator(ids.file);
  const menu = page.locator(ids.fileMenu);
  const check = page.locator(ids.check);
  const compact = page.locator(ids.compact);
  const comfortable = page.locator(ids.comfortable);

  await file.focus();
  await page.keyboard.press('ArrowDown');
  await check.click();
  await expect(check).toHaveAttribute('aria-checked', 'true');
  await expect(menu).toBeVisible();

  await comfortable.click();
  await expect(compact).toHaveAttribute('aria-checked', 'false');
  await expect(comfortable).toHaveAttribute('aria-checked', 'true');
  await expect(menu).toBeVisible();

  await page.locator(ids.first).click();
  await expect(menu).toBeHidden();
  await expect(file).toBeFocused();

  const activations = await page.evaluate(() => window.__menubarActivations);
  expect(activations).toHaveLength(3);
  expect(activations[0]).toMatchObject({ itemId: 'menubar-pin', role: 'menuitemcheckbox', checked: true });
  expect(activations[1]).toMatchObject({ itemId: 'menubar-density-comfortable', role: 'menuitemradio', checked: true });
  expect(activations[2]).toEqual({ itemId: 'menubar-new', role: 'menuitem', checked: null });
});

test('Menubar transfers one open submenu across root peers and closes it on a peer without a submenu', async ({ page }) => {
  const file = page.locator(ids.file);
  const edit = page.locator(ids.edit);
  const fileMenu = page.locator(ids.fileMenu);
  const editMenu = page.locator(ids.editMenu);
  const editFirst = page.locator('#menubar-undo');

  await file.focus();
  await page.keyboard.press('ArrowDown');
  await expect(fileMenu).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(fileMenu).toBeHidden();
  await expect(editMenu).toBeVisible();
  await expect(edit).toHaveAttribute('aria-expanded', 'true');
  await expect(editFirst).toBeFocused();

  await page.keyboard.press('ArrowRight');
  await expect(fileMenu).toBeHidden();
  await expect(editMenu).toBeHidden();
  await expect(page.locator(ids.autosave)).toBeFocused();
  await expect(page.locator(ids.root).locator('[data-menubar-menu]:not([hidden])')).toHaveCount(0);
});

test('Menubar Escape returns to the owner while Tab and Shift+Tab close without trapping document focus', async ({ page }) => {
  const file = page.locator(ids.file);
  const first = page.locator(ids.first);
  const menu = page.locator(ids.fileMenu);
  const after = page.locator(ids.after);

  await file.focus();
  await page.keyboard.press('ArrowDown');
  await expect(first).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(file).toBeFocused();

  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Tab');
  await expect(menu).toBeHidden();
  await expect(after).toBeFocused();

  await file.focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Shift+Tab');
  await expect(menu).toBeHidden();
  await expect(file).toBeFocused();
});

test('Menubar outside activation light-dismisses without focus theft and context invocation remains native', async ({ page }) => {
  const file = page.locator(ids.file);
  const menu = page.locator(ids.fileMenu);
  const outside = page.locator(ids.outside);

  await file.focus();
  await page.keyboard.press('ArrowDown');
  await outside.click();
  await expect(menu).toBeHidden();
  await expect(outside).toBeFocused();

  const native = await file.evaluate((element) => {
    const context = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 });
    element.dispatchEvent(context);
    const key = new KeyboardEvent('keydown', { key: 'ContextMenu', bubbles: true, cancelable: true });
    element.dispatchEvent(key);
    const f10 = new KeyboardEvent('keydown', { key: 'F10', shiftKey: true, bubbles: true, cancelable: true });
    element.dispatchEvent(f10);
    return { context: context.defaultPrevented, key: key.defaultPrevented, f10: f10.defaultPrevented };
  });
  expect(native).toEqual({ context: false, key: false, f10: false });
  await expect(menu).toBeHidden();
});

test('Menubar rejects multiple root Tab stops, nested submenu/navigation authority, and modal first-level menus', async ({ page }) => {
  const failures = await page.evaluate(async () => {
    const module = await import('./menubar.mjs');
    const root = document.querySelector('#menubar-demo');
    const edit = document.querySelector('#menubar-edit');
    const sub = document.querySelector('#menubar-new');
    const menu = document.querySelector('#menubar-file-menu');
    const result = {};

    edit.setAttribute('tabindex', '0');
    try { module.syncMenubarState(root); } catch (error) { result.tabstop = error.message; }
    edit.setAttribute('tabindex', '-1');

    sub.setAttribute('aria-haspopup', 'menu');
    try { module.syncMenubarState(root); } catch (error) { result.submenu = error.message; }
    sub.removeAttribute('aria-haspopup');

    const anchor = document.createElement('a');
    anchor.href = '#forbidden';
    anchor.textContent = 'Route';
    document.querySelector('#menubar-refresh').append(anchor);
    try { module.syncMenubarState(root); } catch (error) { result.navigation = error.message; }
    anchor.remove();

    menu.setAttribute('aria-modal', 'true');
    try { module.syncMenubarState(root); } catch (error) { result.modal = error.message; }
    menu.removeAttribute('aria-modal');
    return result;
  });

  expect(failures.tabstop).toContain('exactly one root menu item');
  expect(failures.submenu).toContain('nested submenu authority');
  expect(failures.navigation).toContain('must not smuggle navigation');
  expect(failures.modal).toContain('must not claim modal semantics');
});

test('Menubar visual root traversal reverses in RTL without changing DOM order', async ({ page }) => {
  const file = page.locator(ids.file);
  const edit = page.locator(ids.edit);
  const disabled = page.locator(ids.disabledRoot);

  await file.focus();
  await page.keyboard.press('ArrowRight');
  await expect(edit).toBeFocused();

  await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
  await file.focus();
  await page.keyboard.press('ArrowRight');
  await expect(disabled).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(file).toBeFocused();

  const order = await page.locator(ids.bar).locator(':scope > [role^="menuitem"]').evaluateAll((items) => items.map((item) => item.id));
  expect(order).toEqual(['menubar-file', 'menubar-edit', 'menubar-autosave', 'menubar-refresh', 'menubar-publish']);
});

test('Menubar remains bounded on narrow viewports and honors reduced motion and forced colors', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const file = page.locator(ids.file);
  const menu = page.locator(ids.fileMenu);
  const first = page.locator(ids.first);

  await file.scrollIntoViewIfNeeded();
  await file.focus();
  await page.keyboard.press('ArrowDown');
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

  const bar = await page.locator(ids.bar).evaluate((element) => {
    const style = getComputedStyle(element);
    return { overflowX: style.overflowX, scrollWidth: element.scrollWidth, clientWidth: element.clientWidth };
  });
  expect(['auto','scroll']).toContain(bar.overflowX);
  expect(bar.scrollWidth).toBeGreaterThanOrEqual(bar.clientWidth);

  await page.keyboard.press('Escape');
  await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'active' });
  await page.keyboard.press('ArrowDown');
  expect(await menu.evaluate((element) => getComputedStyle(element).forcedColorAdjust)).toBe('auto');
  expect(await first.evaluate((element) => getComputedStyle(element).forcedColorAdjust)).toBe('auto');
});
