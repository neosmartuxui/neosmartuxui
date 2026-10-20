import { mkdir } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

const evidenceDir = 'artifacts/browser';

const fieldState = async (field) => field.evaluate((element) => {
  const styles = getComputedStyle(element);
  const transform = styles.transform === 'none' ? null : new DOMMatrixReadOnly(styles.transform);
  const rect = element.getBoundingClientRect();
  return {
    x: transform?.m41 ?? 0,
    y: transform?.m42 ?? 0,
    transform: styles.transform,
    transitionDuration: styles.transitionDuration,
    rowGap: styles.rowGap,
    color: styles.color,
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
    cursor: styles.cursor
  };
});

const tokenValue = async (page, token) => page.evaluate((name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim(), token);
const resolvedFieldGap = async (page) => page.evaluate(() => {
  const probe = document.createElement('div');
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.marginTop = 'var(--ns-space-field-gap)';
  document.body.append(probe);
  const value = getComputedStyle(probe).marginTop;
  probe.remove();
  return value;
});

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
  await expect(page.locator('#field-normal-demo')).toBeVisible();
  expect(errors).toEqual([]);
});

test('core.field preserves native label/control/help semantics and the pinned fluid field gap', async ({ page }) => {
  const field = page.locator('#field-normal-demo');
  const input = page.locator('#field-email');
  const label = field.locator('.ns-field-label');
  const help = page.locator('#field-email-help');
  const state = await fieldState(field);

  expect(state.role).toBeNull();
  expect(state.ariaLive).toBeNull();
  expect(state.tabindexAttribute).toBeNull();
  expect(state.tabIndex).toBe(-1);
  expect(state.onclickIsNull).toBeTruthy();
  expect(state.active).toBeFalsy();
  expect(state.transform).toBe('none');
  expect(state.transitionDuration).toBe('0s');
  expect(await label.getAttribute('for')).toBe('field-email');
  expect(await input.getAttribute('aria-describedby')).toBe('field-email-help');
  expect(await help.getAttribute('role')).toBeNull();
  expect(await help.getAttribute('aria-live')).toBeNull();
  expect(await tokenValue(page, '--ns-space-field-gap')).toBe('clamp(0.5rem, 0.44rem + 0.18vw, 0.6875rem)');
  expect(state.rowGap).toBe(await resolvedFieldGap(page));

  await label.click();
  await expect(input).toBeFocused();
  await page.screenshot({ path: `${evidenceDir}/core-field-semantics.png`, fullPage: true });
});

test('core.field reflects invalid and disabled state from the real controls without inventing group or live-region semantics', async ({ page }) => {
  const invalidField = page.locator('#field-invalid-demo');
  const invalidInput = page.locator('#field-code');
  const error = page.locator('#field-code-error');
  const invalidLabel = invalidField.locator('.ns-field-label');
  const disabledField = page.locator('#field-disabled-demo');
  const disabledInput = page.locator('#field-locked');
  const disabledLabel = disabledField.locator('.ns-field-label');

  expect(await invalidField.getAttribute('role')).toBeNull();
  expect(await invalidField.getAttribute('aria-live')).toBeNull();
  expect(await invalidInput.getAttribute('aria-invalid')).toBe('true');
  expect(await invalidInput.getAttribute('aria-describedby')).toBe('field-code-help');
  expect(await invalidInput.getAttribute('aria-errormessage')).toBe('field-code-error');
  expect(await error.getAttribute('role')).toBeNull();
  expect(await error.getAttribute('aria-live')).toBeNull();
  await expect(invalidLabel).toHaveCSS('color', 'rgb(184, 58, 49)');
  await expect(error).toHaveCSS('color', 'rgb(184, 58, 49)');

  await expect(disabledInput).toBeDisabled();
  expect(await disabledField.getAttribute('disabled')).toBeNull();
  expect(await disabledField.getAttribute('aria-disabled')).toBeNull();
  expect(await disabledField.getAttribute('role')).toBeNull();
  await expect(disabledLabel).toHaveCSS('color', 'rgb(98, 95, 105)');
  await page.screenshot({ path: `${evidenceDir}/core-field-invalid-disabled.png`, fullPage: true });
});

test('core.field remains physically stable through hover and direct pointer contact', async ({ page }) => {
  const field = page.locator('#field-normal-demo');
  const rest = await fieldState(field);
  await field.hover({ position: { x: 4, y: 4 } });
  await page.waitForTimeout(180);
  const hover = await fieldState(field);
  expect(hover.transform).toBe(rest.transform);
  expect(hover.rowGap).toBe(rest.rowGap);
  expect(hover.x).toBeCloseTo(0, 1);
  expect(hover.y).toBeCloseTo(0, 1);

  await page.mouse.down();
  await page.waitForTimeout(100);
  const contact = await fieldState(field);
  expect(contact.transform).toBe(rest.transform);
  expect(contact.rowGap).toBe(rest.rowGap);
  expect(contact.active).toBeFalsy();
  expect(contact.x).toBeCloseTo(0, 1);
  expect(contact.y).toBeCloseTo(0, 1);
  await page.mouse.up();
});

test('core.field preserves RTL relationships and wraps long localized label/help/error content', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const field = page.locator('#field-invalid-demo');
  await field.evaluate((element) => {
    element.setAttribute('dir', 'rtl');
    element.style.maxInlineSize = '17rem';
    element.querySelector('.ns-field-label').textContent = 'رمز الدعوة المطلوب لهذا الحساب';
    element.querySelector('.ns-field-description').textContent = 'هذه تعليمات محلية طويلة يجب أن تلتف دون إخفاء العلاقة بين الوصف وحقل الإدخال. '.repeat(5);
    element.querySelector('.ns-field-message').textContent = 'هذا الرمز منتهي الصلاحية. اطلب رمزاً جديداً ثم حاول مرة أخرى. '.repeat(4);
  });
  const state = await fieldState(field);
  expect(state.direction).toBe('rtl');
  expect(state.scrollWidth).toBeLessThanOrEqual(state.clientWidth + 1);
  expect(state.height).toBeGreaterThan(180);
  expect(state.transform).toBe('none');
  expect(await page.locator('#field-code').getAttribute('aria-describedby')).toBe('field-code-help');
  expect(await page.locator('#field-code').getAttribute('aria-errormessage')).toBe('field-code-error');
  expect(await field.getAttribute('role')).toBeNull();
  await page.screenshot({ path: `${evidenceDir}/core-field-rtl-long-content.png`, fullPage: true });
});

test('core.field stays motionless with reduced motion and readable in forced colors without becoming focusable or live', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await page.goto('/');
  const field = page.locator('#field-invalid-demo');
  const error = page.locator('#field-code-error');
  const state = await fieldState(field);
  const errorColor = await error.evaluate((element) => getComputedStyle(element).color);
  expect(state.transitionDuration).toBe('0s');
  expect(state.transform).toBe('none');
  expect(state.tabIndex).toBe(-1);
  expect(state.role).toBeNull();
  expect(state.ariaLive).toBeNull();
  expect(state.active).toBeFalsy();
  expect(state.color).not.toBe('rgba(0, 0, 0, 0)');
  expect(errorColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(await error.getAttribute('role')).toBeNull();
  expect(await error.getAttribute('aria-live')).toBeNull();
  await expect(error).toContainText('This invite code has expired');
  await expect(page.locator('#field-code')).toBeVisible();
  await page.screenshot({ path: `${evidenceDir}/core-field-forced-colors.png`, fullPage: true });
});
