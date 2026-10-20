import { mkdir } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

const evidenceDir = 'artifacts/browser';

const visualState = async (textarea) => textarea.evaluate((element) => {
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
    borderStyle: styles.borderStyle,
    opacity: styles.opacity,
    resize: styles.resize,
    overflowY: styles.overflowY,
    width: rect.width,
    height: rect.height,
    active: document.activeElement === element,
    dataState: element.dataset.state,
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

const tabToTextarea = async (page) => {
  for (let i = 0; i < 9; i += 1) await page.keyboard.press('Tab');
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
  const textarea = page.locator('#textarea-demo');
  await expect(textarea).toHaveJSProperty('tagName', 'TEXTAREA');
  await expect(textarea).toHaveAttribute('data-state', 'empty');
  expect(errors).toEqual([]);
});

test('core.textarea preserves native multiline editing and synchronizes empty/filled state only', async ({ page }) => {
  const textarea = page.locator('#textarea-demo');
  const value = 'First line\nSecond line\nمرحبا NeoSmartUI';
  await textarea.fill(value);
  await expect(textarea).toHaveValue(value);
  await expect(textarea).toHaveAttribute('data-state', 'filled');
  expect(await textarea.evaluate((element) => element.value.split('\n').length)).toBe(3);
  await textarea.fill('');
  await expect(textarea).toHaveValue('');
  await expect(textarea).toHaveAttribute('data-state', 'empty');
  await page.screenshot({ path: `${evidenceDir}/core-textarea-native-state.png`, fullPage: true });
});

test('core.textarea stays non-pressable, visibly multiline, and preserves native resize', async ({ page }) => {
  const textarea = page.locator('#textarea-demo');
  const rest = await visualState(textarea);
  expect(rest.height).toBeGreaterThanOrEqual(44);
  expect(rest.height).toBeGreaterThan(88);
  expect(rest.x).toBeCloseTo(0, 3);
  expect(rest.y).toBeCloseTo(0, 3);
  expect(rest.boxShadow).toBe('none');
  expect(rest.resize).not.toBe('none');

  await textarea.hover();
  await page.waitForTimeout(180);
  const hover = await visualState(textarea);
  expect(hover.x).toBeCloseTo(0, 3);
  expect(hover.y).toBeCloseTo(0, 3);
  expect(hover.boxShadow).toBe('none');
  expect(hover.resize).not.toBe('none');

  const box = await textarea.boundingBox();
  if (!box) throw new Error('core.textarea has no bounding box');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(120);
  const active = await visualState(textarea);
  expect(active.x).toBeCloseTo(0, 3);
  expect(active.y).toBeCloseTo(0, 3);
  expect(active.boxShadow).toBe('none');
  await page.mouse.up();
});

test('core.textarea keyboard focus, invalid, read-only, and disabled states remain explicit', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await tabToTextarea(page);
  const textarea = page.locator('#textarea-demo');
  await expect(textarea).toBeFocused();
  const focused = await visualState(textarea);
  expect(focused.active).toBeTruthy();
  expect(focused.height).toBeGreaterThanOrEqual(44);
  expect(Number.parseFloat(focused.outlineWidth)).toBeGreaterThanOrEqual(3);
  expect(focused.x).toBeCloseTo(0, 3);
  expect(focused.y).toBeCloseTo(0, 3);

  const expectedErrorBorder = await resolvedColor(page, '--ns-color-state-error');
  await textarea.evaluate((element) => element.setAttribute('aria-invalid', 'true'));
  await expect.poll(async () => (await visualState(textarea)).borderColor, { timeout: 500 }).toBe(expectedErrorBorder);

  await textarea.fill('Selectable\nread-only content');
  await textarea.evaluate((element) => { element.readOnly = true; });
  await expect(textarea).toHaveAttribute('readonly', '');
  expect((await visualState(textarea)).borderStyle).toBe('dashed');
  expect(Number.parseFloat((await visualState(textarea)).opacity)).toBeCloseTo(1, 3);
  await expect(textarea).toHaveValue('Selectable\nread-only content');

  const expectedDisabledOpacity = await resolvedNumber(page, '--ns-opacity-disabled');
  await textarea.evaluate((element) => { element.readOnly = false; element.disabled = true; });
  await expect.poll(async () => Number.parseFloat((await visualState(textarea)).opacity), { timeout: 500 }).toBeCloseTo(expectedDisabledOpacity, 3);
  await expect(textarea).toBeDisabled();
  await page.screenshot({ path: `${evidenceDir}/core-textarea-focus-invalid-readonly-disabled.png`, fullPage: true });
});

test('core.textarea preserves RTL direction, mixed text, and line breaks', async ({ page }) => {
  const textarea = page.locator('#textarea-demo');
  await textarea.evaluate((element) => element.setAttribute('dir', 'rtl'));
  const value = 'السطر الأول\nNeoSmartUI 123\nالسطر الثالث';
  await textarea.fill(value);
  await expect(textarea).toHaveValue(value);
  await expect(textarea).toHaveAttribute('data-state', 'filled');
  expect((await visualState(textarea)).direction).toBe('rtl');
  expect(await textarea.evaluate((element) => element.value.split('\n').length)).toBe(3);
});

test('core.textarea reduced motion keeps state feedback without spatial movement', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const textarea = page.locator('#textarea-demo');
  const rest = await visualState(textarea);
  expect(Number.parseFloat(rest.transitionDuration)).toBeLessThanOrEqual(0.002);
  await textarea.hover();
  const hover = await visualState(textarea);
  expect(hover.x).toBeCloseTo(0, 3);
  expect(hover.y).toBeCloseTo(0, 3);
  expect(hover.resize).not.toBe('none');
});

test('core.textarea forced-colors rendering remains visible and keyboard focusable', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/');
  await tabToTextarea(page);
  const textarea = page.locator('#textarea-demo');
  await expect(textarea).toBeFocused();
  const focused = await visualState(textarea);
  expect(focused.outlineStyle).not.toBe('none');
  expect(focused.resize).not.toBe('none');
  await page.screenshot({ path: `${evidenceDir}/core-textarea-forced-colors.png`, fullPage: true });
});
