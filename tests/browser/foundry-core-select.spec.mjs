import { mkdir } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

const evidenceDir = 'artifacts/browser';

const visualState = async (select) => select.evaluate((element) => {
  const styles = getComputedStyle(element);
  const transform = styles.transform === 'none' ? null : new DOMMatrixReadOnly(styles.transform);
  const rect = element.getBoundingClientRect();
  return {
    x: transform?.m41 ?? 0,
    y: transform?.m42 ?? 0,
    boxShadow: styles.boxShadow,
    outlineWidth: styles.outlineWidth,
    outlineStyle: styles.outlineStyle,
    transitionDuration: styles.transitionDuration,
    borderColor: styles.borderColor,
    borderWidth: styles.borderWidth,
    borderStyle: styles.borderStyle,
    opacity: styles.opacity,
    appearance: styles.appearance,
    width: rect.width,
    height: rect.height,
    active: document.activeElement === element,
    dataState: element.dataset.state,
    selectedValue: element.dataset.selectedValue,
    selectedIndex: element.dataset.selectedIndex,
    pressed: element.dataset.pressed,
    direction: styles.direction
  };
});

const resolvedColor = async (page, token) => page.evaluate((name) => {
  const probe = document.createElement('span');
  probe.style.color = `var(${name})`;
  document.body.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}, token);

const resolvedNumber = async (page, token) => page.evaluate((name) => Number(getComputedStyle(document.documentElement).getPropertyValue(name).trim()), token);

const tabToSelect = async (page) => {
  for (let i = 0; i < 10; i += 1) await page.keyboard.press('Tab');
};

test.beforeAll(async () => {
  await mkdir(evidenceDir, { recursive: true });
});

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  const select = page.locator('#select-demo');
  await expect(select).toHaveJSProperty('tagName', 'SELECT');
  await expect(select).toHaveAttribute('data-state', 'selected');
  await expect(select).toHaveAttribute('data-selected-value', 'alpha');
  await expect(select).toHaveAttribute('data-selected-index', '0');
  expect(errors).toEqual([]);
});

test('core.select preserves native single-select option semantics and mirrors only selected metadata', async ({ page }) => {
  const select = page.locator('#select-demo');
  expect(await select.evaluate((element) => element.multiple)).toBe(false);
  expect(await select.evaluate((element) => element.size)).toBe(0);
  expect(await select.locator('option').count()).toBe(4);
  await expect(select.locator('optgroup')).toHaveAttribute('label', 'More options');
  await expect(select.locator('option[value="disabled"]')).toBeDisabled();

  await select.selectOption('gamma');
  await expect(select).toHaveValue('gamma');
  await expect(select).toHaveAttribute('data-selected-value', 'gamma');
  await expect(select).toHaveAttribute('data-selected-index', '2');
  expect((await visualState(select)).appearance).not.toBe('none');

  const rejection = await page.evaluate(async () => {
    const { bindSelect } = await import('./select.mjs');
    const multiple = document.createElement('select');
    multiple.multiple = true;
    const listbox = document.createElement('select');
    listbox.size = 4;
    const messages = [];
    for (const candidate of [multiple, listbox]) {
      try {
        bindSelect(candidate);
      } catch (error) {
        messages.push(error.message);
      }
    }
    return messages;
  });
  expect(rejection).toHaveLength(2);
  for (const message of rejection) expect(message).toContain('real native single-select <select>');
  await page.screenshot({ path: `${evidenceDir}/core-select-native-state.png`, fullPage: true });
});

test('core.select compresses 0→2→5px without cancelling native pointer contact', async ({ page }) => {
  const select = page.locator('#select-demo');
  const rest = await visualState(select);
  expect(rest.width).toBeGreaterThanOrEqual(44);
  expect(rest.height).toBeGreaterThanOrEqual(44);
  expect(rest.x).toBeCloseTo(0, 1);
  expect(rest.y).toBeCloseTo(0, 1);
  expect(rest.boxShadow).not.toBe('none');

  await select.hover();
  await page.waitForTimeout(180);
  const hover = await visualState(select);
  expect(hover.x).toBeCloseTo(2, 1);
  expect(hover.y).toBeCloseTo(2, 1);
  expect(hover.boxShadow).not.toBe(rest.boxShadow);

  const pointerWasCancelled = await select.evaluate((element) => {
    const event = new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType: 'mouse' });
    element.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(pointerWasCancelled).toBe(false);
  await expect.poll(async () => (await visualState(select)).pressed).toBe('true');
  await expect.poll(async () => (await visualState(select)).x, { timeout: 750 }).toBeCloseTo(5, 1);
  await expect.poll(async () => (await visualState(select)).y, { timeout: 750 }).toBeCloseTo(5, 1);
  const active = await visualState(select);
  expect(active.boxShadow).not.toBe(hover.boxShadow);
  await page.screenshot({ path: `${evidenceDir}/core-select-active.png`, fullPage: true });

  await page.evaluate(() => window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'mouse' })));
  await expect.poll(async () => (await visualState(select)).pressed).toBe('false');
});

test('core.select keeps native keyboard selection, focus, invalid, and disabled states explicit', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await tabToSelect(page);
  const select = page.locator('#select-demo');
  await expect(select).toBeFocused();
  const focused = await visualState(select);
  expect(focused.active).toBeTruthy();
  expect(focused.height).toBeGreaterThanOrEqual(44);
  expect(Number.parseFloat(focused.outlineWidth)).toBeGreaterThanOrEqual(3);

  await page.keyboard.press('ArrowDown');
  await expect(select).toHaveValue('beta');
  await expect(select).toHaveAttribute('data-selected-value', 'beta');
  await expect(select).toHaveAttribute('data-selected-index', '1');

  const expectedErrorBorder = await resolvedColor(page, '--ns-color-state-error');
  await select.evaluate((element) => element.setAttribute('aria-invalid', 'true'));
  await expect.poll(async () => (await visualState(select)).borderColor, { timeout: 500 }).toBe(expectedErrorBorder);

  const expectedDisabledOpacity = await resolvedNumber(page, '--ns-opacity-disabled');
  await select.evaluate((element) => { element.disabled = true; });
  await expect(select).toBeDisabled();
  await expect.poll(async () => Number.parseFloat((await visualState(select)).opacity), { timeout: 500 }).toBeCloseTo(expectedDisabledOpacity, 3);
  await page.screenshot({ path: `${evidenceDir}/core-select-focus-invalid-disabled.png`, fullPage: true });
});

test('core.select preserves RTL direction and native selected value semantics', async ({ page }) => {
  const select = page.locator('#select-demo');
  await select.evaluate((element) => element.setAttribute('dir', 'rtl'));
  await select.selectOption('gamma');
  await expect(select).toHaveValue('gamma');
  await expect(select).toHaveAttribute('data-selected-value', 'gamma');
  expect((await visualState(select)).direction).toBe('rtl');
});

test('core.select reduced motion keeps pressure state meaningful without release animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const select = page.locator('#select-demo');
  const rest = await visualState(select);
  expect(Number.parseFloat(rest.transitionDuration)).toBeLessThanOrEqual(0.002);

  await select.hover();
  await expect.poll(async () => (await visualState(select)).x, { timeout: 500 }).toBeCloseTo(2, 1);
  const cancelled = await select.evaluate((element) => {
    const event = new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType: 'touch' });
    element.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(cancelled).toBe(false);
  await expect.poll(async () => (await visualState(select)).x, { timeout: 500 }).toBeCloseTo(5, 1);
  await page.evaluate(() => window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'touch' })));
});

test('core.select forced-colors rendering retains visible boundary, native affordance, and keyboard focus', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/');
  await tabToSelect(page);
  const select = page.locator('#select-demo');
  await expect(select).toBeFocused();
  const focused = await visualState(select);
  expect(focused.outlineStyle).not.toBe('none');
  expect(Number.parseFloat(focused.outlineWidth)).toBeGreaterThanOrEqual(3);
  expect(focused.borderStyle).not.toBe('none');
  expect(Number.parseFloat(focused.borderWidth)).toBeGreaterThanOrEqual(3);
  expect(focused.appearance).not.toBe('none');
  expect(focused.width).toBeGreaterThanOrEqual(44);
  expect(focused.height).toBeGreaterThanOrEqual(44);
  await page.screenshot({ path: `${evidenceDir}/core-select-forced-colors.png`, fullPage: true });
});
