import { mkdir } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

const evidenceDir = 'artifacts/browser';

const visualState = async (switchInput) => switchInput.evaluate((element) => {
  const visual = element.nextElementSibling;
  const thumb = visual.querySelector('.ns-switch-thumb');
  const styles = getComputedStyle(visual);
  const thumbStyles = getComputedStyle(thumb);
  const transform = styles.transform === 'none' ? null : new DOMMatrixReadOnly(styles.transform);
  const rect = element.getBoundingClientRect();
  const visualRect = visual.getBoundingClientRect();
  const thumbRect = thumb.getBoundingClientRect();
  return {
    x: transform?.m41 ?? 0,
    y: transform?.m42 ?? 0,
    boxShadow: styles.boxShadow,
    outlineWidth: styles.outlineWidth,
    outlineStyle: styles.outlineStyle,
    transitionDuration: styles.transitionDuration,
    thumbTransitionDuration: thumbStyles.transitionDuration,
    borderColor: styles.borderColor,
    backgroundColor: styles.backgroundColor,
    opacity: styles.opacity,
    width: rect.width,
    height: rect.height,
    active: document.activeElement === element,
    dataState: element.dataset.state,
    direction: styles.direction,
    thumbLeftGap: thumbRect.left - visualRect.left,
    thumbRightGap: visualRect.right - thumbRect.right
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

const tabToSwitch = async (page) => {
  for (let i = 0; i < 6; i += 1) await page.keyboard.press('Tab');
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
  const switchInput = page.locator('#switch-demo');
  await expect(switchInput).toHaveAttribute('type', 'checkbox');
  await expect(switchInput).toHaveAttribute('role', 'switch');
  await expect(switchInput).not.toBeChecked();
  await expect(switchInput).toHaveAttribute('data-state', 'off');
  expect(errors).toEqual([]);
});

test('core.switch preserves native Space activation and exposes only off/on state', async ({ page }) => {
  const switchInput = page.locator('#switch-demo');
  await switchInput.evaluate((element) => { element.indeterminate = true; element.dispatchEvent(new Event('change', { bubbles: true })); });
  await expect.poll(() => switchInput.evaluate((element) => element.indeterminate)).toBe(false);
  await expect(switchInput).toHaveAttribute('data-state', 'off');

  await tabToSwitch(page);
  await expect(switchInput).toBeFocused();
  await page.keyboard.press('Space');
  await expect(switchInput).toBeChecked();
  await expect(switchInput).toHaveAttribute('data-state', 'on');
  await page.keyboard.press('Space');
  await expect(switchInput).not.toBeChecked();
  await expect(switchInput).toHaveAttribute('data-state', 'off');
});

test('core.switch resolves thumb travel and track state color together', async ({ page }) => {
  const switchInput = page.locator('#switch-demo');
  const off = await visualState(switchInput);
  expect(off.thumbLeftGap).toBeLessThan(off.thumbRightGap);
  const expectedOnColor = await resolvedColor(page, '--ns-color-action-primary-surface');

  await switchInput.click();
  await expect(switchInput).toHaveAttribute('data-state', 'on');
  await expect.poll(async () => {
    const on = await visualState(switchInput);
    return on.thumbLeftGap > on.thumbRightGap && on.backgroundColor === expectedOnColor;
  }, { timeout: 750 }).toBeTruthy();
  await page.screenshot({ path: `${evidenceDir}/core-switch-on.png`, fullPage: true });
});

test('core.switch compresses inward and keeps a token-backed 44px target', async ({ page }) => {
  const switchInput = page.locator('#switch-demo');
  const rest = await visualState(switchInput);
  expect(rest.x).toBeCloseTo(0, 1);
  expect(rest.y).toBeCloseTo(0, 1);
  expect(rest.width).toBeGreaterThanOrEqual(44);
  expect(rest.height).toBeGreaterThanOrEqual(44);
  expect(rest.boxShadow).not.toBe('none');

  await switchInput.hover();
  await page.waitForTimeout(180);
  const hover = await visualState(switchInput);
  expect(hover.x).toBeCloseTo(2, 1);
  expect(hover.y).toBeCloseTo(2, 1);
  expect(hover.boxShadow).not.toBe(rest.boxShadow);

  const box = await switchInput.boundingBox();
  if (!box) throw new Error('core.switch has no bounding box');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(120);
  const active = await visualState(switchInput);
  expect(active.x).toBeCloseTo(5, 1);
  expect(active.y).toBeCloseTo(5, 1);
  expect(active.boxShadow).not.toBe(hover.boxShadow);
  await page.screenshot({ path: `${evidenceDir}/core-switch-active.png`, fullPage: true });
  await page.mouse.up();
});

test('core.switch keyboard focus, invalid, and disabled states remain explicit', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await tabToSwitch(page);
  const switchInput = page.locator('#switch-demo');
  await expect(switchInput).toBeFocused();
  const focused = await visualState(switchInput);
  expect(focused.active).toBeTruthy();
  expect(focused.height).toBeGreaterThanOrEqual(44);
  expect(Number.parseFloat(focused.outlineWidth)).toBeGreaterThanOrEqual(3);

  const expectedErrorBorder = await resolvedColor(page, '--ns-color-state-error');
  await switchInput.evaluate((element) => element.setAttribute('aria-invalid', 'true'));
  await expect.poll(async () => (await visualState(switchInput)).borderColor, { timeout: 500 }).toBe(expectedErrorBorder);

  const expectedDisabledOpacity = await resolvedNumber(page, '--ns-opacity-disabled');
  await switchInput.evaluate((element) => { element.disabled = true; });
  await expect.poll(async () => Number.parseFloat((await visualState(switchInput)).opacity), { timeout: 500 }).toBeCloseTo(expectedDisabledOpacity, 3);
  await expect(switchInput).toBeDisabled();
  await page.screenshot({ path: `${evidenceDir}/core-switch-focus-invalid-disabled.png`, fullPage: true });
});

test('core.switch uses logical thumb geometry in RTL without reversing on/off meaning', async ({ page }) => {
  const wrapper = page.locator('.ns-switch');
  const switchInput = page.locator('#switch-demo');
  await wrapper.evaluate((element) => { element.dir = 'rtl'; });
  const off = await visualState(switchInput);
  expect(off.thumbRightGap).toBeLessThan(off.thumbLeftGap);
  expect(off.dataState).toBe('off');

  await switchInput.click();
  await expect(switchInput).toHaveAttribute('data-state', 'on');
  await expect.poll(async () => {
    const on = await visualState(switchInput);
    return on.thumbLeftGap < on.thumbRightGap;
  }, { timeout: 750 }).toBeTruthy();
});

test('core.switch reduced motion resolves state nearly instantly and forced colors stays focusable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const switchInput = page.locator('#switch-demo');
  const rest = await visualState(switchInput);
  expect(Number.parseFloat(rest.transitionDuration)).toBeLessThanOrEqual(0.002);
  expect(Number.parseFloat(rest.thumbTransitionDuration)).toBeLessThanOrEqual(0.002);
  await switchInput.click();
  await expect(switchInput).toHaveAttribute('data-state', 'on');
  await expect.poll(async () => {
    const on = await visualState(switchInput);
    return on.thumbLeftGap > on.thumbRightGap;
  }, { timeout: 500 }).toBeTruthy();

  await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'active' });
  await page.goto('/');
  await tabToSwitch(page);
  await expect(page.locator('#switch-demo')).toBeFocused();
  expect((await visualState(page.locator('#switch-demo'))).outlineStyle).not.toBe('none');
  await page.screenshot({ path: `${evidenceDir}/core-switch-forced-colors.png`, fullPage: true });
});
