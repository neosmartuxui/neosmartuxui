import { mkdir } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

const evidenceDir = 'artifacts/browser';

const visualState = async (alert) => alert.evaluate((element) => {
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
    borderColor: styles.borderColor,
    paddingInlineStart: styles.paddingInlineStart,
    paddingInlineEnd: styles.paddingInlineEnd,
    paddingBlockStart: styles.paddingBlockStart,
    paddingBlockEnd: styles.paddingBlockEnd,
    color: styles.color,
    backgroundColor: styles.backgroundColor,
    direction: styles.direction,
    width: rect.width,
    height: rect.height,
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
    tabIndex: element.tabIndex,
    role: element.getAttribute('role'),
    ariaLive: element.getAttribute('aria-live'),
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
  await expect(page.locator('#alert-neutral')).toBeVisible();
  expect(errors).toEqual([]);
});

test('core.alert is a passive token-backed message surface and visual tone does not create a live region', async ({ page }) => {
  const neutral = page.locator('#alert-neutral');
  const state = await visualState(neutral);
  expect(state.tagName).toBe('DIV');
  expect(state.role).toBeNull();
  expect(state.ariaLive).toBeNull();
  expect(state.tabindexAttribute).toBeNull();
  expect(state.tabIndex).toBe(-1);
  expect(state.onclickIsNull).toBeTruthy();
  expect(state.active).toBeFalsy();
  expect(state.transform).toBe('none');
  expect(state.transitionDuration).toBe('0s');
  expect(state.borderWidth).toBe('3px');
  expect(state.borderRadius).toBe('6px');
  expect(state.paddingInlineStart).toBe('16px');
  expect(state.paddingInlineEnd).toBe('16px');
  expect(state.paddingBlockStart).toBe('16px');
  expect(state.paddingBlockEnd).toBe('16px');
  expect(state.boxShadow).not.toBe('none');

  expect(await tokenValue(page, '--ns-space-surface-inline')).toBe('1rem');
  expect(await tokenValue(page, '--ns-space-surface-block')).toBe('1rem');
  expect(await tokenValue(page, '--ns-border-surface-width')).toBe('3px');
  expect(await tokenValue(page, '--ns-radius-surface')).toBe('6px');
  expect(await tokenValue(page, '--ns-depth-rest-x')).toBe('5px');
  expect(await tokenValue(page, '--ns-depth-rest-y')).toBe('5px');
  expect(await tokenValue(page, '--ns-color-state-info')).toBe('#5397c7');
  expect(await tokenValue(page, '--ns-color-state-success')).toBe('#2fa371');
  expect(await tokenValue(page, '--ns-color-state-warning')).toBe('#c98017');
  expect(await tokenValue(page, '--ns-color-state-error')).toBe('#b83a31');

  const tones = [
    ['#alert-neutral', 'Neutral · Note', 'rgb(37, 35, 43)'],
    ['#alert-info', 'Info · Update', 'rgb(83, 151, 199)'],
    ['#alert-success', 'Success · Complete', 'rgb(47, 163, 113)'],
    ['#alert-warning', 'Warning · Check this', 'rgb(201, 128, 23)'],
    ['#alert-error', 'Error · Needs correction', 'rgb(184, 58, 49)']
  ];
  for (const [selector, title, borderColor] of tones) {
    const alert = page.locator(selector);
    await expect(alert.locator('.ns-alert-title')).toHaveText(title);
    await expect(alert).toHaveCSS('border-color', borderColor);
    await expect(alert).toHaveCSS('background-color', 'rgb(248, 246, 241)');
    const toneState = await visualState(alert);
    expect(toneState.role).toBeNull();
    expect(toneState.ariaLive).toBeNull();
    expect(toneState.tabIndex).toBe(-1);
  }
  await page.screenshot({ path: `${evidenceDir}/core-alert-tones.png`, fullPage: true });
});

test('core.alert remains physically unchanged through hover and direct pointer contact', async ({ page }) => {
  const alert = page.locator('#alert-info');
  const rest = await visualState(alert);
  await alert.hover();
  await page.waitForTimeout(180);
  const hover = await visualState(alert);
  expect(hover.transform).toBe(rest.transform);
  expect(hover.boxShadow).toBe(rest.boxShadow);
  expect(hover.borderColor).toBe(rest.borderColor);
  expect(hover.x).toBeCloseTo(0, 1);
  expect(hover.y).toBeCloseTo(0, 1);

  await page.mouse.down();
  await page.waitForTimeout(100);
  const contact = await visualState(alert);
  expect(contact.transform).toBe(rest.transform);
  expect(contact.boxShadow).toBe(rest.boxShadow);
  expect(contact.borderColor).toBe(rest.borderColor);
  expect(contact.active).toBeFalsy();
  expect(contact.x).toBeCloseTo(0, 1);
  expect(contact.y).toBeCloseTo(0, 1);
  await page.mouse.up();
  await page.screenshot({ path: `${evidenceDir}/core-alert-pointer-stable.png`, fullPage: true });
});

test('core.alert preserves logical RTL layout and wraps essential long localized message content', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const alert = page.locator('#alert-success');
  await alert.evaluate((element) => {
    element.setAttribute('dir', 'rtl');
    element.style.maxInlineSize = '16rem';
    element.querySelector('.ns-alert-title').textContent = 'نجاح · اكتمل الإجراء';
    element.querySelector('.ns-alert-body').textContent = 'هذه رسالة محلية طويلة جداً يجب أن تلتف دون إخفاء المعنى الأساسي للمستخدم. '.repeat(7);
  });
  const state = await visualState(alert);
  expect(state.direction).toBe('rtl');
  expect(state.scrollWidth).toBeLessThanOrEqual(state.clientWidth + 1);
  expect(state.height).toBeGreaterThan(100);
  expect(state.paddingInlineStart).toBe(state.paddingInlineEnd);
  expect(state.transform).toBe('none');
  expect(state.role).toBeNull();
  expect(state.ariaLive).toBeNull();
  await page.screenshot({ path: `${evidenceDir}/core-alert-rtl-long-content.png`, fullPage: true });
});

test('core.alert reduced-motion mode remains motionless because the static surface has no state transition', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const alert = page.locator('#alert-warning');
  const rest = await visualState(alert);
  expect(rest.transitionDuration).toBe('0s');
  expect(rest.transform).toBe('none');
  await alert.hover();
  await page.waitForTimeout(50);
  const hover = await visualState(alert);
  expect(hover.transitionDuration).toBe('0s');
  expect(hover.transform).toBe('none');
  expect(hover.boxShadow).toBe(rest.boxShadow);
  expect(hover.borderColor).toBe(rest.borderColor);
});

test('core.alert forced-colors rendering keeps readable content and a visible boundary without becoming a live or focusable region', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/');
  const alert = page.locator('#alert-error');
  const state = await visualState(alert);
  expect(state.borderStyle).not.toBe('none');
  expect(Number.parseFloat(state.borderWidth)).toBeGreaterThanOrEqual(3);
  expect(state.tabIndex).toBe(-1);
  expect(state.role).toBeNull();
  expect(state.ariaLive).toBeNull();
  expect(state.active).toBeFalsy();
  expect(state.transform).toBe('none');
  expect(state.color).not.toBe('rgba(0, 0, 0, 0)');
  expect(state.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  await expect(alert.locator('.ns-alert-title')).toHaveText('Error · Needs correction');
  await expect(alert.locator('.ns-alert-body')).toContainText('Error text remains explicit');
  await page.screenshot({ path: `${evidenceDir}/core-alert-forced-colors.png`, fullPage: true });
});
