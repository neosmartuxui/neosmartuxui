import { mkdir } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

const evidenceDir = 'artifacts/browser';

const visualState = async (badge) => badge.evaluate((element) => {
  const styles = getComputedStyle(element);
  const transform = styles.transform === 'none' ? null : new DOMMatrixReadOnly(styles.transform);
  const rect = element.getBoundingClientRect();
  return {
    x: transform?.m41 ?? 0,
    y: transform?.m42 ?? 0,
    transform: styles.transform,
    transitionDuration: styles.transitionDuration,
    boxShadow: styles.boxShadow,
    borderWidth: styles.borderWidth,
    borderStyle: styles.borderStyle,
    borderRadius: styles.borderRadius,
    paddingInlineStart: styles.paddingInlineStart,
    paddingInlineEnd: styles.paddingInlineEnd,
    paddingBlockStart: styles.paddingBlockStart,
    paddingBlockEnd: styles.paddingBlockEnd,
    fontWeight: styles.fontWeight,
    color: styles.color,
    backgroundColor: styles.backgroundColor,
    direction: styles.direction,
    whiteSpace: styles.whiteSpace,
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
  await expect(page.locator('#badge-neutral')).toBeVisible();
  expect(errors).toEqual([]);
});

test('core.badge is a passive token-backed span and every tone keeps explicit text meaning', async ({ page }) => {
  const neutral = page.locator('#badge-neutral');
  const state = await visualState(neutral);
  expect(state.tagName).toBe('SPAN');
  expect(state.role).toBeNull();
  expect(state.tabindexAttribute).toBeNull();
  expect(state.tabIndex).toBe(-1);
  expect(state.onclickIsNull).toBeTruthy();
  expect(state.active).toBeFalsy();
  expect(state.transform).toBe('none');
  expect(state.transitionDuration).toBe('0s');
  expect(state.boxShadow).toBe('none');
  expect(state.borderWidth).toBe('2px');
  expect(state.borderRadius).toBe('999px');
  expect(state.paddingInlineStart).toBe('8.8px');
  expect(state.paddingInlineEnd).toBe('8.8px');
  expect(state.paddingBlockStart).toBe('2.4px');
  expect(state.paddingBlockEnd).toBe('2.4px');
  expect(state.fontWeight).toBe('750');

  expect(await tokenValue(page, '--ns-space-annotation-inline')).toBe('0.55rem');
  expect(await tokenValue(page, '--ns-space-annotation-block')).toBe('0.15rem');
  expect(await tokenValue(page, '--ns-border-annotation-width')).toBe('2px');
  expect(await tokenValue(page, '--ns-radius-annotation')).toBe('999px');
  expect(await tokenValue(page, '--ns-color-state-info')).toBe('#5397c7');
  expect(await tokenValue(page, '--ns-color-state-success')).toBe('#2fa371');
  expect(await tokenValue(page, '--ns-color-state-warning')).toBe('#c98017');
  expect(await tokenValue(page, '--ns-color-state-error')).toBe('#b83a31');
  expect(await tokenValue(page, '--ns-color-content-inverse')).toBe('#fffef5');

  const tones = [
    ['#badge-neutral', 'Neutral metadata', 'rgb(248, 246, 241)', 'rgb(34, 33, 38)'],
    ['#badge-info', 'Info · Reference', 'rgb(83, 151, 199)', 'rgb(34, 33, 38)'],
    ['#badge-success', 'Success · Ready', 'rgb(47, 163, 113)', 'rgb(34, 33, 38)'],
    ['#badge-warning', 'Warning · Needs attention', 'rgb(201, 128, 23)', 'rgb(34, 33, 38)'],
    ['#badge-error', 'Error · Failed', 'rgb(184, 58, 49)', 'rgb(255, 254, 245)']
  ];
  for (const [selector, text, background, color] of tones) {
    const badge = page.locator(selector);
    await expect(badge).toHaveText(text);
    await expect(badge).toHaveCSS('background-color', background);
    await expect(badge).toHaveCSS('color', color);
    expect((await visualState(badge)).role).toBeNull();
  }
  await page.screenshot({ path: `${evidenceDir}/core-badge-tones.png`, fullPage: true });
});

test('core.badge remains physically unchanged through hover and direct pointer contact', async ({ page }) => {
  const badge = page.locator('#badge-info');
  const rest = await visualState(badge);
  await badge.hover();
  await page.waitForTimeout(180);
  const hover = await visualState(badge);
  expect(hover.transform).toBe(rest.transform);
  expect(hover.boxShadow).toBe(rest.boxShadow);
  expect(hover.backgroundColor).toBe(rest.backgroundColor);
  expect(hover.x).toBeCloseTo(0, 1);
  expect(hover.y).toBeCloseTo(0, 1);

  await page.mouse.down();
  await page.waitForTimeout(100);
  const contact = await visualState(badge);
  expect(contact.transform).toBe(rest.transform);
  expect(contact.boxShadow).toBe(rest.boxShadow);
  expect(contact.backgroundColor).toBe(rest.backgroundColor);
  expect(contact.active).toBeFalsy();
  expect(contact.x).toBeCloseTo(0, 1);
  expect(contact.y).toBeCloseTo(0, 1);
  await page.mouse.up();
  await page.screenshot({ path: `${evidenceDir}/core-badge-pointer-stable.png`, fullPage: true });
});

test('core.badge preserves logical RTL layout and wraps essential long localized status text', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const badge = page.locator('#badge-success');
  await badge.evaluate((element) => {
    element.setAttribute('dir', 'rtl');
    element.style.maxInlineSize = '9rem';
    element.textContent = 'نجاح · حالة محلية طويلة جداً '.repeat(8);
  });
  const state = await visualState(badge);
  expect(state.direction).toBe('rtl');
  expect(state.whiteSpace).toBe('normal');
  expect(state.scrollWidth).toBeLessThanOrEqual(state.clientWidth + 1);
  expect(state.height).toBeGreaterThan(30);
  expect(state.paddingInlineStart).toBe(state.paddingInlineEnd);
  expect(state.transform).toBe('none');
  await page.screenshot({ path: `${evidenceDir}/core-badge-rtl-long-content.png`, fullPage: true });
});

test('core.badge reduced-motion mode remains motionless because the primitive has no state transition', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const badge = page.locator('#badge-warning');
  const rest = await visualState(badge);
  expect(rest.transitionDuration).toBe('0s');
  expect(rest.transform).toBe('none');
  await badge.hover();
  await page.waitForTimeout(50);
  const hover = await visualState(badge);
  expect(hover.transitionDuration).toBe('0s');
  expect(hover.transform).toBe('none');
  expect(hover.backgroundColor).toBe(rest.backgroundColor);
});

test('core.badge forced-colors rendering keeps readable text and a visible boundary without becoming focusable', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/');
  const badge = page.locator('#badge-error');
  const state = await visualState(badge);
  expect(state.borderStyle).not.toBe('none');
  expect(Number.parseFloat(state.borderWidth)).toBeGreaterThanOrEqual(2);
  expect(state.tabIndex).toBe(-1);
  expect(state.role).toBeNull();
  expect(state.active).toBeFalsy();
  expect(state.transform).toBe('none');
  expect(state.color).not.toBe('rgba(0, 0, 0, 0)');
  expect(state.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  await page.screenshot({ path: `${evidenceDir}/core-badge-forced-colors.png`, fullPage: true });
});
