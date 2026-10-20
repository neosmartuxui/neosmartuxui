import { mkdir } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

const evidenceDir = 'artifacts/browser';

const state = async (page) => page.locator('#combobox-demo').evaluate((root) => {
  const input = root.querySelector('#combobox-input');
  const trigger = root.querySelector('#combobox-trigger');
  const popup = root.querySelector('#combobox-popup');
  const options = [...root.querySelectorAll('[role="option"]')];
  const inputStyles = getComputedStyle(input);
  const triggerStyles = getComputedStyle(trigger);
  const popupStyles = getComputedStyle(popup);
  const inputRect = input.getBoundingClientRect();
  const triggerRect = trigger.getBoundingClientRect();
  const popupRect = popup.getBoundingClientRect();
  return {
    rootState: root.dataset.state || '',
    queryState: root.dataset.queryState || '',
    selectionState: root.dataset.selectionState || '',
    selectedValue: root.dataset.selectedValue || '',
    activeValue: root.dataset.activeValue || '',
    inputTag: input.tagName,
    role: input.getAttribute('role'),
    autocomplete: input.getAttribute('aria-autocomplete'),
    expanded: input.getAttribute('aria-expanded'),
    controls: input.getAttribute('aria-controls'),
    activeDescendant: input.getAttribute('aria-activedescendant'),
    focused: document.activeElement === input,
    inputTransform: inputStyles.transform,
    inputBorderWidth: inputStyles.borderTopWidth,
    inputMinHeight: inputStyles.minHeight,
    triggerTag: trigger.tagName,
    triggerType: trigger.getAttribute('type'),
    triggerTransform: triggerStyles.transform,
    triggerShadow: triggerStyles.boxShadow,
    triggerTransitionDuration: triggerStyles.transitionDuration,
    inputX: inputRect.x,
    inputY: inputRect.y,
    inputWidth: inputRect.width,
    inputHeight: inputRect.height,
    triggerX: triggerRect.x,
    triggerY: triggerRect.y,
    popupHidden: popup.hidden,
    popupDisplay: popupStyles.display,
    popupBorderWidth: popupStyles.borderTopWidth,
    popupTransform: popupStyles.transform,
    popupTransitionDuration: popupStyles.transitionDuration,
    popupLeft: popupRect.left,
    popupRight: popupRect.right,
    popupScrollWidth: popup.scrollWidth,
    popupClientWidth: popup.clientWidth,
    visibleOptions: options.filter((option) => !option.hidden).map((option) => option.id),
    selectedOptions: options.filter((option) => option.getAttribute('aria-selected') === 'true').map((option) => option.id),
    activeOptions: options.filter((option) => option.dataset.active === 'true').map((option) => option.id),
    disabledOptions: options.filter((option) => option.getAttribute('aria-disabled') === 'true').map((option) => option.id),
    optionTabIndexes: options.map((option) => option.tabIndex),
    direction: getComputedStyle(root).direction
  };
});

const resolvedLength = async (page, variable) => page.evaluate((name) => {
  const probe = document.createElement('div');
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.marginInlineStart = `var(${name})`;
  document.body.append(probe);
  const value = getComputedStyle(probe).marginInlineStart;
  probe.remove();
  return value;
}, variable);

const captureConsoleErrors = (page) => {
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
};

test.beforeAll(async () => {
  await mkdir(evidenceDir, { recursive: true });
});

test.beforeEach(async ({ page }) => {
  const errors = captureConsoleErrors(page);
  await page.goto('/');
  await expect(page.locator('#combobox-demo')).toBeVisible();
  await expect(page.locator('#combobox-input')).toHaveAttribute('role', 'combobox');
  expect(errors).toEqual([]);
});

test('core.combobox exposes editable combobox/listbox semantics with token-backed control and popup geometry', async ({ page }) => {
  const input = page.locator('#combobox-input');
  const popup = page.locator('#combobox-popup');
  const listbox = page.locator('#combobox-listbox');

  const closed = await state(page);
  expect(closed.inputTag).toBe('INPUT');
  expect(closed.role).toBe('combobox');
  expect(closed.autocomplete).toBe('list');
  expect(closed.expanded).toBe('false');
  expect(closed.controls).toBe('combobox-listbox');
  expect(closed.rootState).toBe('closed');
  expect(closed.queryState).toBe('query-empty');
  expect(closed.selectionState).toBe('unselected');
  expect(closed.selectedValue).toBe('');
  expect(closed.popupHidden).toBeTruthy();
  expect(closed.triggerTag).toBe('BUTTON');
  expect(closed.triggerType).toBe('button');
  expect(closed.disabledOptions).toEqual(['combobox-option-svelte']);
  expect(closed.optionTabIndexes.every((value) => value === -1)).toBeTruthy();

  await input.focus();
  await expect(input).toHaveAttribute('aria-expanded', 'true');
  await expect(popup).toBeVisible();
  await expect(listbox).toHaveAttribute('role', 'listbox');
  const open = await state(page);
  expect(open.focused).toBeTruthy();
  expect(open.rootState).toBe('open');
  expect(open.popupHidden).toBeFalsy();
  expect(open.popupDisplay).not.toBe('none');
  expect(open.inputTransform).toBe('none');
  expect(open.popupTransform).toBe('none');
  expect(open.inputBorderWidth).toBe(await resolvedLength(page, '--ns-border-control-width'));
  expect(open.popupBorderWidth).toBe(await resolvedLength(page, '--ns-border-surface-width'));
  expect(parseFloat(open.inputMinHeight)).toBeGreaterThanOrEqual(44);
  await page.screenshot({ path: `${evidenceDir}/core-combobox-semantics.png`, fullPage: true });
});

test('core.combobox keeps DOM focus on the input while Arrow navigation skips disabled options and Enter commits one value', async ({ page }) => {
  const input = page.locator('#combobox-input');
  await input.focus();

  await page.keyboard.press('ArrowDown');
  await expect(input).toHaveAttribute('aria-activedescendant', 'combobox-option-react');
  expect((await state(page)).activeOptions).toEqual(['combobox-option-react']);
  await expect(input).toBeFocused();

  await page.keyboard.press('ArrowDown');
  await expect(input).toHaveAttribute('aria-activedescendant', 'combobox-option-vue');
  await page.keyboard.press('ArrowDown');
  await expect(input).toHaveAttribute('aria-activedescendant', 'combobox-option-solid');
  await page.keyboard.press('ArrowUp');
  await expect(input).toHaveAttribute('aria-activedescendant', 'combobox-option-vue');
  await expect(input).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(input).toHaveValue('Vue');
  await expect(input).toHaveAttribute('aria-expanded', 'false');
  await expect(input).not.toHaveAttribute('aria-activedescendant', /.+/);
  const committed = await state(page);
  expect(committed.selectedOptions).toEqual(['combobox-option-vue']);
  expect(committed.selectedValue).toBe('Vue');
  expect(committed.selectionState).toBe('selected');
  expect(committed.activeOptions).toEqual([]);
  expect(committed.focused).toBeTruthy();
});

test('core.combobox keeps typed query separate from committed selection and exposes a non-option empty result', async ({ page }) => {
  const input = page.locator('#combobox-input');
  const empty = page.locator('#combobox-empty');

  await input.focus();
  await input.fill('Vue');
  let typed = await state(page);
  expect(typed.queryState).toBe('query-filled');
  expect(typed.selectionState).toBe('unselected');
  expect(typed.selectedOptions).toEqual([]);
  expect(typed.visibleOptions).toEqual(['combobox-option-vue']);

  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  expect((await state(page)).selectedValue).toBe('Vue');

  await input.press('End');
  await input.type('x');
  await expect(empty).toBeVisible();
  const edited = await state(page);
  expect(edited.selectionState).toBe('unselected');
  expect(edited.selectedValue).toBe('');
  expect(edited.selectedOptions).toEqual([]);
  expect(edited.visibleOptions).toEqual([]);
  expect(edited.expanded).toBe('true');
  expect(await empty.getAttribute('role')).toBeNull();
});

test('core.combobox keeps the editable field motionless while only the disclosure trigger compresses and can stay closed', async ({ page }) => {
  const input = page.locator('#combobox-input');
  const trigger = page.locator('#combobox-trigger');

  await input.scrollIntoViewIfNeeded();
  const before = await state(page);
  await input.hover();
  await page.mouse.down();
  const inputContact = await state(page);
  expect(inputContact.inputTransform).toBe('none');
  expect(inputContact.inputX).toBeCloseTo(before.inputX, 2);
  expect(inputContact.inputY).toBeCloseTo(before.inputY, 2);
  expect(inputContact.inputWidth).toBeCloseTo(before.inputWidth, 2);
  expect(inputContact.inputHeight).toBeCloseTo(before.inputHeight, 2);
  await page.mouse.up();
  await input.press('Escape');
  await expect(input).toHaveAttribute('aria-expanded', 'false');

  await trigger.hover();
  await expect.poll(async () => (await state(page)).triggerX - before.triggerX, { timeout: 750 }).toBeCloseTo(2, 1);
  await expect.poll(async () => (await state(page)).triggerY - before.triggerY, { timeout: 750 }).toBeCloseTo(2, 1);
  const hovered = await state(page);
  expect(hovered.triggerX - before.triggerX).toBeCloseTo(2, 1);
  expect(hovered.triggerY - before.triggerY).toBeCloseTo(2, 1);
  await page.mouse.down();
  await expect.poll(async () => (await state(page)).triggerX - before.triggerX, { timeout: 750 }).toBeCloseTo(5, 1);
  await expect.poll(async () => (await state(page)).triggerY - before.triggerY, { timeout: 750 }).toBeCloseTo(5, 1);
  const pressed = await state(page);
  expect(pressed.triggerX - before.triggerX).toBeCloseTo(5, 1);
  expect(pressed.triggerY - before.triggerY).toBeCloseTo(5, 1);
  await page.mouse.up();
  await expect(input).toHaveAttribute('aria-expanded', 'true');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(input).toBeFocused();

  await trigger.click();
  await expect(input).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger).toBeFocused();
  await page.waitForTimeout(100);
  await expect(input).toHaveAttribute('aria-expanded', 'false');
});

test('core.combobox preserves RTL and long-option containment with immediate reduced motion and readable forced colors', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await page.goto('/');
  const root = page.locator('#combobox-demo');
  const input = page.locator('#combobox-input');
  const longOption = page.locator('#combobox-option-react');

  await root.evaluate((element) => element.setAttribute('dir', 'rtl'));
  await longOption.evaluate((element) => {
    element.dataset.value = 'واجهة طويلة';
    element.textContent = 'خيار طويل جدا يلتف داخل قائمة الاقتراحات من دون إنشاء تمرير أفقي على الصفحة أو تغيير اتجاه الكتابة';
  });
  await input.focus();
  await expect(input).toHaveAttribute('aria-expanded', 'true');

  const snapshot = await state(page);
  expect(snapshot.direction).toBe('rtl');
  expect(snapshot.inputTransform).toBe('none');
  expect(snapshot.popupTransform).toBe('none');
  expect(parseFloat(snapshot.popupTransitionDuration)).toBeLessThanOrEqual(0.002);
  expect(parseFloat(snapshot.triggerTransitionDuration)).toBeLessThanOrEqual(0.002);
  expect(snapshot.popupLeft).toBeGreaterThanOrEqual(-0.5);
  expect(snapshot.popupRight).toBeLessThanOrEqual(390.5);
  expect(snapshot.popupScrollWidth).toBeLessThanOrEqual(snapshot.popupClientWidth + 1);
  const pageWidth = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(pageWidth.scroll).toBeLessThanOrEqual(pageWidth.client + 1);
  await page.screenshot({ path: `${evidenceDir}/core-combobox-rtl-forced-colors.png`, fullPage: true });
});
