import { mkdir } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

const evidenceDir = 'artifacts/browser';

const visualState = async (tab) => tab.evaluate((element) => {
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
    backgroundColor: styles.backgroundColor,
    opacity: styles.opacity,
    width: rect.width,
    height: rect.height,
    active: document.activeElement === element,
    selected: element.getAttribute('aria-selected'),
    tabIndex: element.tabIndex,
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

const tabToAutomaticTabs = async (page) => {
  for (let i = 0; i < 7; i += 1) await page.keyboard.press('Tab');
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

  await expect(page.locator('#tabs-auto-list')).toHaveAttribute('role', 'tablist');
  await expect(page.locator('#tabs-auto-list')).toHaveAttribute('data-activation', 'automatic');
  await expect(page.locator('#tabs-manual-list')).toHaveAttribute('data-activation', 'manual');
  await expect(page.locator('#tab-auto-overview')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#panel-auto-overview')).toBeVisible();
  await expect(page.locator('#panel-auto-details')).toBeHidden();
  expect(errors).toEqual([]);
});

test('core.tabs preserves ARIA relationships, roving focus, disabled skipping, and automatic activation', async ({ page }) => {
  const list = page.locator('#tabs-auto-list');
  const overview = page.locator('#tab-auto-overview');
  const disabled = page.locator('#tab-auto-disabled');
  const details = page.locator('#tab-auto-details');

  await expect(list).toHaveAttribute('aria-orientation', 'horizontal');
  await expect(overview).toHaveAttribute('role', 'tab');
  await expect(overview).toHaveAttribute('aria-controls', 'panel-auto-overview');
  await expect(page.locator('#panel-auto-overview')).toHaveAttribute('role', 'tabpanel');
  await expect(page.locator('#panel-auto-overview')).toHaveAttribute('aria-labelledby', 'tab-auto-overview');
  await expect(overview).toHaveAttribute('tabindex', '0');
  await expect(details).toHaveAttribute('tabindex', '-1');
  await expect(disabled).toHaveAttribute('tabindex', '-1');
  await expect(disabled).toBeDisabled();

  await overview.focus();
  await page.keyboard.press('ArrowRight');
  await expect(details).toBeFocused();
  await expect(details).toHaveAttribute('aria-selected', 'true');
  await expect(details).toHaveAttribute('data-state', 'selected');
  await expect(overview).toHaveAttribute('aria-selected', 'false');
  await expect(page.locator('#panel-auto-details')).toBeVisible();
  await expect(page.locator('#panel-auto-overview')).toBeHidden();
  await expect(details).toHaveAttribute('tabindex', '0');
  await expect(overview).toHaveAttribute('tabindex', '-1');

  await page.keyboard.press('Home');
  await expect(overview).toBeFocused();
  await expect(overview).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('End');
  await expect(details).toBeFocused();
  await expect(details).toHaveAttribute('aria-selected', 'true');
  await page.screenshot({ path: `${evidenceDir}/core-tabs-automatic.png`, fullPage: true });
});

test('core.tabs manual activation separates roving focus from selection until Space or Enter', async ({ page }) => {
  const alpha = page.locator('#tab-manual-alpha');
  const beta = page.locator('#tab-manual-beta');
  const gamma = page.locator('#tab-manual-gamma');

  await alpha.focus();
  await page.keyboard.press('ArrowDown');
  await expect(beta).toBeFocused();
  await expect(alpha).toHaveAttribute('aria-selected', 'true');
  await expect(beta).toHaveAttribute('aria-selected', 'false');
  await expect(page.locator('#panel-manual-alpha')).toBeVisible();
  await expect(page.locator('#panel-manual-beta')).toBeHidden();

  await page.keyboard.press('Space');
  await expect(beta).toBeFocused();
  await expect(beta).toHaveAttribute('aria-selected', 'true');
  await expect(alpha).toHaveAttribute('aria-selected', 'false');
  await expect(page.locator('#panel-manual-beta')).toBeVisible();

  await page.keyboard.press('ArrowDown');
  await expect(gamma).toBeFocused();
  await expect(beta).toHaveAttribute('aria-selected', 'true');
  await expect(gamma).toHaveAttribute('aria-selected', 'false');
  await page.keyboard.press('Enter');
  await expect(gamma).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#panel-manual-gamma')).toBeVisible();

  await page.keyboard.press('Home');
  await expect(alpha).toBeFocused();
  await expect(gamma).toHaveAttribute('aria-selected', 'true');
  await expect(alpha).toHaveAttribute('aria-selected', 'false');
  await page.screenshot({ path: `${evidenceDir}/core-tabs-manual.png`, fullPage: true });
});

test('core.tabs horizontal navigation follows logical direction in RTL', async ({ page }) => {
  const list = page.locator('#tabs-auto-list');
  const overview = page.locator('#tab-auto-overview');
  const details = page.locator('#tab-auto-details');

  await list.evaluate((element) => { element.dir = 'rtl'; });
  await overview.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(details).toBeFocused();
  await expect(details).toHaveAttribute('aria-selected', 'true');

  await page.keyboard.press('ArrowRight');
  await expect(overview).toBeFocused();
  await expect(overview).toHaveAttribute('aria-selected', 'true');
});

test('core.tabs keeps selected tabs seated while unselected tabs compress inward on contact', async ({ page }) => {
  const overview = page.locator('#tab-auto-overview');
  const details = page.locator('#tab-auto-details');
  const selectedColor = await resolvedColor(page, '--ns-color-action-primary-surface');

  const seated = await visualState(overview);
  expect(seated.x).toBeCloseTo(5, 1);
  expect(seated.y).toBeCloseTo(5, 1);
  expect(seated.height).toBeGreaterThanOrEqual(44);
  expect(seated.width).toBeGreaterThanOrEqual(44);
  expect(seated.backgroundColor).toBe(selectedColor);

  const rest = await visualState(details);
  expect(rest.x).toBeCloseTo(0, 1);
  expect(rest.y).toBeCloseTo(0, 1);
  expect(rest.height).toBeGreaterThanOrEqual(44);
  expect(rest.width).toBeGreaterThanOrEqual(44);

  await details.hover();
  await page.waitForTimeout(180);
  const hover = await visualState(details);
  expect(hover.x).toBeCloseTo(2, 1);
  expect(hover.y).toBeCloseTo(2, 1);
  expect(hover.boxShadow).not.toBe(rest.boxShadow);

  const box = await details.boundingBox();
  if (!box) throw new Error('core.tabs Details tab has no bounding box');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(120);
  const active = await visualState(details);
  expect(active.x).toBeCloseTo(5, 1);
  expect(active.y).toBeCloseTo(5, 1);
  expect(active.boxShadow).not.toBe(hover.boxShadow);
  await page.mouse.up();

  await expect(details).toHaveAttribute('aria-selected', 'true');
  await expect.poll(async () => {
    const selected = await visualState(details);
    return [Number(selected.x.toFixed(3)), Number(selected.y.toFixed(3))];
  }, { timeout: 750 }).toEqual([5, 5]);
  await page.screenshot({ path: `${evidenceDir}/core-tabs-seated-pressure.png`, fullPage: true });
});

test('core.tabs keeps keyboard focus explicit, disabled state inert, and Tab exits the composite', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await tabToAutomaticTabs(page);

  const overview = page.locator('#tab-auto-overview');
  const disabled = page.locator('#tab-auto-disabled');
  const details = page.locator('#tab-auto-details');
  await expect(overview).toBeFocused();
  const focused = await visualState(overview);
  expect(focused.active).toBeTruthy();
  expect(Number.parseFloat(focused.outlineWidth)).toBeGreaterThanOrEqual(3);

  const expectedDisabledOpacity = await resolvedNumber(page, '--ns-opacity-disabled');
  const disabledState = await visualState(disabled);
  expect(Number.parseFloat(disabledState.opacity)).toBeCloseTo(expectedDisabledOpacity, 3);
  expect(disabledState.tabIndex).toBe(-1);

  await page.keyboard.press('ArrowRight');
  await expect(details).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#tab-manual-alpha')).toBeFocused();
  await page.screenshot({ path: `${evidenceDir}/core-tabs-focus-mobile.png`, fullPage: true });
});

test('core.tabs reduced motion preserves state nearly instantly and forced colors preserves focus/selection', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  const overview = page.locator('#tab-auto-overview');
  const details = page.locator('#tab-auto-details');
  const seated = await visualState(overview);
  expect(Number.parseFloat(seated.transitionDuration)).toBeLessThanOrEqual(0.002);
  expect(seated.x).toBeCloseTo(5, 1);
  expect(seated.y).toBeCloseTo(5, 1);

  await details.hover();
  await expect.poll(async () => {
    const hover = await visualState(details);
    return [Number(hover.x.toFixed(3)), Number(hover.y.toFixed(3))];
  }, { timeout: 500 }).toEqual([2, 2]);

  await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'active' });
  await page.goto('/');
  await tabToAutomaticTabs(page);
  await expect(page.locator('#tab-auto-overview')).toBeFocused();
  await expect(page.locator('#tab-auto-overview')).toHaveAttribute('aria-selected', 'true');
  expect((await visualState(page.locator('#tab-auto-overview'))).outlineStyle).not.toBe('none');
  await expect(page.locator('#panel-auto-overview')).toBeVisible();
  await page.screenshot({ path: `${evidenceDir}/core-tabs-forced-colors.png`, fullPage: true });
});
