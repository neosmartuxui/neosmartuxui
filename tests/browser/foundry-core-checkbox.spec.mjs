import { mkdir } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

const evidenceDir = 'artifacts/browser';

const visualState = async (input) => input.evaluate((element) => {
  const visual = element.nextElementSibling;
  const styles = getComputedStyle(visual);
  const transform = styles.transform === 'none' ? null : new DOMMatrixReadOnly(styles.transform);
  const rect = element.getBoundingClientRect();
  return {
    x: transform?.m41 ?? 0,
    y: transform?.m42 ?? 0,
    boxShadow: styles.boxShadow,
    outlineWidth: styles.outlineWidth,
    transitionDuration: styles.transitionDuration,
    borderColor: styles.borderColor,
    opacity: styles.opacity,
    width: rect.width,
    height: rect.height,
    active: document.activeElement === element,
    dataState: element.dataset.state,
    indeterminate: element.indeterminate
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

const resolvedNumber = async (page, token) => page.evaluate((name) => {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return Number(raw);
}, token);

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
  await expect(page.locator('#checkbox-demo')).toHaveAttribute('type', 'checkbox');
  await expect.poll(() => page.locator('#checkbox-mixed').evaluate((element) => element.indeterminate)).toBe(true);
  expect(errors).toEqual([]);
});

test('core.checkbox preserves native semantics and explicit selection states', async ({ page }) => {
  const checkbox = page.locator('#checkbox-demo');
  await expect(checkbox).not.toBeChecked();
  expect((await visualState(checkbox)).dataState).toBe('unchecked');
  await checkbox.click();
  await expect(checkbox).toBeChecked();
  expect((await visualState(checkbox)).dataState).toBe('checked');

  const mixed = page.locator('#checkbox-mixed');
  const mixedState = await visualState(mixed);
  expect(mixedState.indeterminate).toBeTruthy();
  expect(mixedState.dataState).toBe('indeterminate');
  await page.screenshot({ path: `${evidenceDir}/core-checkbox-selection-states.png`, fullPage: true });
});

test('core.checkbox compresses inward and keeps a token-backed 44px target', async ({ page }) => {
  const checkbox = page.locator('#checkbox-demo');
  const rest = await visualState(checkbox);
  expect(rest.x).toBeCloseTo(0, 1);
  expect(rest.y).toBeCloseTo(0, 1);
  expect(rest.width).toBeGreaterThanOrEqual(44);
  expect(rest.height).toBeGreaterThanOrEqual(44);
  expect(rest.boxShadow).not.toBe('none');

  await checkbox.hover();
  await page.waitForTimeout(180);
  const hover = await visualState(checkbox);
  expect(hover.x).toBeCloseTo(2, 1);
  expect(hover.y).toBeCloseTo(2, 1);
  expect(hover.boxShadow).not.toBe(rest.boxShadow);

  const box = await checkbox.boundingBox();
  if (!box) throw new Error('core.checkbox has no bounding box');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(120);
  const active = await visualState(checkbox);
  expect(active.x).toBeCloseTo(5, 1);
  expect(active.y).toBeCloseTo(5, 1);
  expect(active.boxShadow).not.toBe(hover.boxShadow);
  await page.screenshot({ path: `${evidenceDir}/core-checkbox-active.png`, fullPage: true });
  await page.mouse.up();
});

test('core.checkbox keyboard focus, invalid, and disabled states remain explicit', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.locator('section[aria-labelledby="button-slice"] button.ns-button')).toBeFocused();
  await page.keyboard.press('Tab');
  const checkbox = page.locator('#checkbox-demo');
  await expect(checkbox).toBeFocused();
  const focused = await visualState(checkbox);
  expect(focused.active).toBeTruthy();
  expect(Number.parseFloat(focused.outlineWidth)).toBeGreaterThanOrEqual(3);
  expect(focused.height).toBeGreaterThanOrEqual(44);

  const expectedErrorBorder = await resolvedColor(page, '--ns-color-state-error');
  await checkbox.evaluate((element) => element.setAttribute('aria-invalid', 'true'));
  await expect.poll(async () => (await visualState(checkbox)).borderColor, { timeout: 500 }).toBe(expectedErrorBorder);

  const expectedDisabledOpacity = await resolvedNumber(page, '--ns-opacity-disabled');
  await checkbox.evaluate((element) => { element.disabled = true; });
  await expect.poll(async () => Number.parseFloat((await visualState(checkbox)).opacity), { timeout: 500 }).toBeCloseTo(expectedDisabledOpacity, 3);
  await page.screenshot({ path: `${evidenceDir}/core-checkbox-focus-invalid-disabled.png`, fullPage: true });
});

test('core.checkbox reduced motion keeps pressure state with near-instant transition', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const checkbox = page.locator('#checkbox-demo');
  const state = await visualState(checkbox);
  expect(Number.parseFloat(state.transitionDuration)).toBeLessThanOrEqual(0.002);
  await checkbox.hover();
  await expect.poll(async () => {
    const hover = await visualState(checkbox);
    return [Number(hover.x.toFixed(3)), Number(hover.y.toFixed(3))];
  }, { timeout: 500 }).toEqual([2, 2]);
});

test('core.checkbox forced-colors rendering remains visible and focusable', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/');
  const checkbox = page.locator('#checkbox-demo');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(checkbox).toBeFocused();
  await page.screenshot({ path: `${evidenceDir}/core-checkbox-forced-colors.png`, fullPage: true });
});
