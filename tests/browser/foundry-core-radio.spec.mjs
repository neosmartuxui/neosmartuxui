import { mkdir } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

const evidenceDir = 'artifacts/browser';

const visualState = async (radio) => radio.evaluate((element) => {
  const visual = element.nextElementSibling;
  const styles = getComputedStyle(visual);
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
    opacity: styles.opacity,
    width: rect.width,
    height: rect.height,
    active: document.activeElement === element,
    dataState: element.dataset.state
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

const tabToRadio = async (page) => {
  for (let i = 0; i < 5; i += 1) await page.keyboard.press('Tab');
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
  await expect(page.locator('#radio-alpha')).toHaveAttribute('type', 'radio');
  await expect(page.locator('#radio-beta')).toHaveAttribute('type', 'radio');
  await expect(page.locator('#radio-alpha')).toBeChecked();
  await expect(page.locator('#radio-alpha')).toHaveAttribute('data-state', 'checked');
  await expect(page.locator('#radio-beta')).toHaveAttribute('data-state', 'unchecked');
  expect(errors).toEqual([]);
});

test('core.radio preserves native exclusive selection and synchronizes peer state', async ({ page }) => {
  const alpha = page.locator('#radio-alpha');
  const beta = page.locator('#radio-beta');
  await beta.click();
  await expect(beta).toBeChecked();
  await expect(alpha).not.toBeChecked();
  await expect(beta).toHaveAttribute('data-state', 'checked');
  await expect(alpha).toHaveAttribute('data-state', 'unchecked');
  await alpha.click();
  await expect(alpha).toBeChecked();
  await expect(beta).not.toBeChecked();
  await page.screenshot({ path: `${evidenceDir}/core-radio-exclusive-selection.png`, fullPage: true });
});

test('core.radio preserves native arrow-key movement inside the group', async ({ page }) => {
  await tabToRadio(page);
  const alpha = page.locator('#radio-alpha');
  const beta = page.locator('#radio-beta');
  await expect(alpha).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(beta).toBeFocused();
  await expect(beta).toBeChecked();
  await expect(alpha).not.toBeChecked();
  await expect(beta).toHaveAttribute('data-state', 'checked');
  await expect(alpha).toHaveAttribute('data-state', 'unchecked');
});

test('core.radio compresses inward and keeps a token-backed 44px target', async ({ page }) => {
  const radio = page.locator('#radio-alpha');
  const rest = await visualState(radio);
  expect(rest.x).toBeCloseTo(0, 1);
  expect(rest.y).toBeCloseTo(0, 1);
  expect(rest.width).toBeGreaterThanOrEqual(44);
  expect(rest.height).toBeGreaterThanOrEqual(44);
  expect(rest.boxShadow).not.toBe('none');

  await radio.hover();
  await page.waitForTimeout(180);
  const hover = await visualState(radio);
  expect(hover.x).toBeCloseTo(2, 1);
  expect(hover.y).toBeCloseTo(2, 1);
  expect(hover.boxShadow).not.toBe(rest.boxShadow);

  const box = await radio.boundingBox();
  if (!box) throw new Error('core.radio has no bounding box');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(120);
  const active = await visualState(radio);
  expect(active.x).toBeCloseTo(5, 1);
  expect(active.y).toBeCloseTo(5, 1);
  expect(active.boxShadow).not.toBe(hover.boxShadow);
  await page.screenshot({ path: `${evidenceDir}/core-radio-active.png`, fullPage: true });
  await page.mouse.up();
});

test('core.radio keyboard focus, invalid, and disabled states remain explicit', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await tabToRadio(page);
  const alpha = page.locator('#radio-alpha');
  const beta = page.locator('#radio-beta');
  await expect(alpha).toBeFocused();
  const focused = await visualState(alpha);
  expect(focused.active).toBeTruthy();
  expect(focused.height).toBeGreaterThanOrEqual(44);
  expect(Number.parseFloat(focused.outlineWidth)).toBeGreaterThanOrEqual(3);

  const expectedErrorBorder = await resolvedColor(page, '--ns-color-state-error');
  await alpha.evaluate((element) => element.setAttribute('aria-invalid', 'true'));
  await expect.poll(async () => (await visualState(alpha)).borderColor, { timeout: 500 }).toBe(expectedErrorBorder);

  const expectedDisabledOpacity = await resolvedNumber(page, '--ns-opacity-disabled');
  await beta.evaluate((element) => { element.disabled = true; });
  await expect.poll(async () => Number.parseFloat((await visualState(beta)).opacity), { timeout: 500 }).toBeCloseTo(expectedDisabledOpacity, 3);
  await expect(beta).toBeDisabled();
  await page.screenshot({ path: `${evidenceDir}/core-radio-focus-invalid-disabled.png`, fullPage: true });
});

test('core.radio reduced motion keeps pressure feedback and forced colors stays focusable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const alpha = page.locator('#radio-alpha');
  const state = await visualState(alpha);
  expect(Number.parseFloat(state.transitionDuration)).toBeLessThanOrEqual(0.002);
  await alpha.hover();
  await expect.poll(async () => {
    const hover = await visualState(alpha);
    return [Number(hover.x.toFixed(3)), Number(hover.y.toFixed(3))];
  }, { timeout: 500 }).toEqual([2, 2]);

  await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'active' });
  await page.goto('/');
  await tabToRadio(page);
  await expect(page.locator('#radio-alpha')).toBeFocused();
  expect((await visualState(page.locator('#radio-alpha'))).outlineStyle).not.toBe('none');
  await page.screenshot({ path: `${evidenceDir}/core-radio-forced-colors.png`, fullPage: true });
});
