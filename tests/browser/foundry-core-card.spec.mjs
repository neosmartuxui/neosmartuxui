import { mkdir } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

const evidenceDir = 'artifacts/browser';

const visualState = async (card) => card.evaluate((element) => {
  const styles = getComputedStyle(element);
  const transform = styles.transform === 'none' ? null : new DOMMatrixReadOnly(styles.transform);
  const rect = element.getBoundingClientRect();
  return {
    x: transform?.m41 ?? 0,
    y: transform?.m42 ?? 0,
    transform: styles.transform,
    boxShadow: styles.boxShadow,
    transitionDuration: styles.transitionDuration,
    borderWidth: styles.borderWidth,
    borderStyle: styles.borderStyle,
    borderRadius: styles.borderRadius,
    paddingInlineStart: styles.paddingInlineStart,
    paddingInlineEnd: styles.paddingInlineEnd,
    paddingBlockStart: styles.paddingBlockStart,
    paddingBlockEnd: styles.paddingBlockEnd,
    direction: styles.direction,
    color: styles.color,
    backgroundColor: styles.backgroundColor,
    width: rect.width,
    height: rect.height,
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
    tabIndex: element.tabIndex,
    role: element.getAttribute('role'),
    tabindexAttribute: element.getAttribute('tabindex'),
    onclickIsNull: element.onclick === null,
    active: document.activeElement === element,
    tagName: element.tagName
  };
});

const tokenValue = async (page, token) => page.evaluate((name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim(), token);

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
  await expect(page.locator('#card-demo')).toBeVisible();
  await expect(page.locator('#card-demo-title')).toHaveText('Stable informational surface');
  expect(errors).toEqual([]);
});

test('core.card is a token-backed informational article without synthetic interaction semantics', async ({ page }) => {
  const card = page.locator('#card-demo');
  const state = await visualState(card);
  expect(state.tagName).toBe('ARTICLE');
  expect(state.role).toBeNull();
  expect(state.tabindexAttribute).toBeNull();
  expect(state.tabIndex).toBe(-1);
  expect(state.onclickIsNull).toBeTruthy();
  expect(state.active).toBeFalsy();
  expect(state.transform).toBe('none');
  expect(state.x).toBeCloseTo(0, 1);
  expect(state.y).toBeCloseTo(0, 1);
  expect(state.transitionDuration).toBe('0s');
  expect(state.borderWidth).toBe('3px');
  expect(state.borderRadius).toBe('6px');
  expect(state.paddingInlineStart).toBe('16px');
  expect(state.paddingInlineEnd).toBe('16px');
  expect(state.paddingBlockStart).toBe('16px');
  expect(state.paddingBlockEnd).toBe('16px');
  expect(state.boxShadow).not.toBe('none');
  await expect(page.locator('#card-demo-title')).toHaveCSS('font-weight', '800');
  expect(await tokenValue(page, '--ns-space-surface-inline')).toBe('1rem');
  expect(await tokenValue(page, '--ns-space-surface-block')).toBe('1rem');
  expect(await tokenValue(page, '--ns-border-surface-width')).toBe('3px');
  expect(await tokenValue(page, '--ns-radius-surface')).toBe('6px');
  expect(await tokenValue(page, '--ns-font-weight-strong')).toBe('800');
  await page.screenshot({ path: `${evidenceDir}/core-card-static.png`, fullPage: true });
});

test('core.card remains physically unchanged through hover and direct pointer contact', async ({ page }) => {
  const card = page.locator('#card-demo');
  const rest = await visualState(card);

  await card.hover();
  await page.waitForTimeout(180);
  const hover = await visualState(card);
  expect(hover.transform).toBe(rest.transform);
  expect(hover.boxShadow).toBe(rest.boxShadow);
  expect(hover.borderWidth).toBe(rest.borderWidth);
  expect(hover.x).toBeCloseTo(0, 1);
  expect(hover.y).toBeCloseTo(0, 1);

  await page.mouse.down();
  await page.waitForTimeout(100);
  const contact = await visualState(card);
  expect(contact.transform).toBe(rest.transform);
  expect(contact.boxShadow).toBe(rest.boxShadow);
  expect(contact.borderWidth).toBe(rest.borderWidth);
  expect(contact.x).toBeCloseTo(0, 1);
  expect(contact.y).toBeCloseTo(0, 1);
  expect(contact.active).toBeFalsy();
  await page.mouse.up();
  await page.screenshot({ path: `${evidenceDir}/core-card-pointer-stable.png`, fullPage: true });
});

test('core.card preserves logical RTL layout and wraps long localized content', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const card = page.locator('#card-demo');
  await card.evaluate((element) => {
    element.setAttribute('dir', 'rtl');
    element.querySelector('.ns-card-content p').textContent = 'معرّفطويلجداً'.repeat(40);
  });
  const state = await visualState(card);
  expect(state.direction).toBe('rtl');
  expect(state.scrollWidth).toBeLessThanOrEqual(state.clientWidth + 1);
  expect(state.transform).toBe('none');
  expect(state.paddingInlineStart).toBe(state.paddingInlineEnd);
  await page.screenshot({ path: `${evidenceDir}/core-card-rtl-long-content.png`, fullPage: true });
});

test('core.card reduced-motion mode remains motionless because the surface has no state transition', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const card = page.locator('#card-demo');
  const rest = await visualState(card);
  expect(rest.transitionDuration).toBe('0s');
  expect(rest.transform).toBe('none');

  await card.hover();
  await page.waitForTimeout(50);
  const hover = await visualState(card);
  expect(hover.transitionDuration).toBe('0s');
  expect(hover.transform).toBe('none');
  expect(hover.boxShadow).toBe(rest.boxShadow);
});

test('core.card forced-colors rendering keeps a visible grouping boundary without becoming focusable', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/');
  const card = page.locator('#card-demo');
  const state = await visualState(card);
  expect(state.borderStyle).not.toBe('none');
  expect(Number.parseFloat(state.borderWidth)).toBeGreaterThanOrEqual(3);
  expect(state.tabIndex).toBe(-1);
  expect(state.active).toBeFalsy();
  expect(state.transform).toBe('none');
  expect(state.color).not.toBe('rgba(0, 0, 0, 0)');
  expect(state.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  await page.screenshot({ path: `${evidenceDir}/core-card-forced-colors.png`, fullPage: true });
});
