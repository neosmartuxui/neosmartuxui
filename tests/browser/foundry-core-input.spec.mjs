import { mkdir } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

const evidenceDir = 'artifacts/browser';

const visualState = async (input) => input.evaluate((element) => {
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

const tabToInput = async (page) => {
  for (let i = 0; i < 4; i += 1) await page.keyboard.press('Tab');
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
  await expect(page.locator('#input-demo')).toHaveAttribute('type', 'text');
  await expect(page.locator('#input-demo')).toHaveAttribute('data-state', 'empty');
  expect(errors).toEqual([]);
});

test('core.input preserves native editing and synchronizes empty/filled state only', async ({ page }) => {
  const input = page.locator('#input-demo');
  await input.fill('NeoSmartUI');
  await expect(input).toHaveValue('NeoSmartUI');
  await expect(input).toHaveAttribute('data-state', 'filled');
  await input.fill('');
  await expect(input).toHaveValue('');
  await expect(input).toHaveAttribute('data-state', 'empty');
  await page.screenshot({ path: `${evidenceDir}/core-input-native-state.png`, fullPage: true });
});

test('core.input keeps a 44px target without pressure or levitation translation', async ({ page }) => {
  const input = page.locator('#input-demo');
  const rest = await visualState(input);
  expect(rest.height).toBeGreaterThanOrEqual(44);
  expect(rest.x).toBeCloseTo(0, 3);
  expect(rest.y).toBeCloseTo(0, 3);
  expect(rest.boxShadow).toBe('none');

  await input.hover();
  await page.waitForTimeout(180);
  const hover = await visualState(input);
  expect(hover.x).toBeCloseTo(0, 3);
  expect(hover.y).toBeCloseTo(0, 3);
  expect(hover.boxShadow).toBe('none');

  const box = await input.boundingBox();
  if (!box) throw new Error('core.input has no bounding box');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(120);
  const active = await visualState(input);
  expect(active.x).toBeCloseTo(0, 3);
  expect(active.y).toBeCloseTo(0, 3);
  expect(active.boxShadow).toBe('none');
  await page.mouse.up();
});

test('core.input keyboard focus, invalid, read-only, and disabled states remain explicit', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await tabToInput(page);
  const input = page.locator('#input-demo');
  await expect(input).toBeFocused();
  const focused = await visualState(input);
  expect(focused.active).toBeTruthy();
  expect(focused.height).toBeGreaterThanOrEqual(44);
  expect(Number.parseFloat(focused.outlineWidth)).toBeGreaterThanOrEqual(3);
  expect(focused.x).toBeCloseTo(0, 3);
  expect(focused.y).toBeCloseTo(0, 3);

  const expectedErrorBorder = await resolvedColor(page, '--ns-color-state-error');
  await input.evaluate((element) => element.setAttribute('aria-invalid', 'true'));
  await expect.poll(async () => (await visualState(input)).borderColor, { timeout: 500 }).toBe(expectedErrorBorder);

  await input.evaluate((element) => { element.readOnly = true; });
  await expect(input).toHaveAttribute('readonly', '');
  expect((await visualState(input)).borderStyle).toBe('dashed');
  expect(Number.parseFloat((await visualState(input)).opacity)).toBeCloseTo(1, 3);

  const expectedDisabledOpacity = await resolvedNumber(page, '--ns-opacity-disabled');
  await input.evaluate((element) => { element.readOnly = false; element.disabled = true; });
  await expect.poll(async () => Number.parseFloat((await visualState(input)).opacity), { timeout: 500 }).toBeCloseTo(expectedDisabledOpacity, 3);
  await page.screenshot({ path: `${evidenceDir}/core-input-focus-invalid-readonly-disabled.png`, fullPage: true });
});

test('core.input preserves bidi direction and native text value', async ({ page }) => {
  const input = page.locator('#input-demo');
  await input.evaluate((element) => element.setAttribute('dir', 'rtl'));
  await input.fill('مرحبا NeoSmartUI');
  await expect(input).toHaveValue('مرحبا NeoSmartUI');
  await expect(input).toHaveAttribute('data-state', 'filled');
  expect((await visualState(input)).direction).toBe('rtl');
});

test('core.input reduced motion keeps state feedback without spatial movement', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const input = page.locator('#input-demo');
  const rest = await visualState(input);
  expect(Number.parseFloat(rest.transitionDuration)).toBeLessThanOrEqual(0.002);
  await input.hover();
  const hover = await visualState(input);
  expect(hover.x).toBeCloseTo(0, 3);
  expect(hover.y).toBeCloseTo(0, 3);
});

test('core.input forced-colors rendering remains visible and keyboard focusable', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/');
  await tabToInput(page);
  const input = page.locator('#input-demo');
  await expect(input).toBeFocused();
  const focused = await visualState(input);
  expect(focused.outlineStyle).not.toBe('none');
  await page.screenshot({ path: `${evidenceDir}/core-input-forced-colors.png`, fullPage: true });
});
