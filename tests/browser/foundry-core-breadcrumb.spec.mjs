import { mkdir } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

const evidenceDir = 'artifacts/browser';

const breadcrumbState = async (locator) => locator.evaluate((element) => {
  const styles = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  const matrix = styles.transform === 'none' ? null : new DOMMatrixReadOnly(styles.transform);
  return {
    transform: styles.transform,
    x: matrix?.m41 ?? 0,
    y: matrix?.m42 ?? 0,
    boxShadow: styles.boxShadow,
    transitionDuration: styles.transitionDuration,
    color: styles.color,
    fontSize: styles.fontSize,
    rowGap: styles.rowGap,
    columnGap: styles.columnGap,
    direction: styles.direction,
    width: rect.width,
    height: rect.height,
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
    tabIndex: element.tabIndex,
    role: element.getAttribute('role'),
    ariaDisabled: element.getAttribute('aria-disabled'),
    active: document.activeElement === element
  };
});

const tokenValue = async (page, token) => page.evaluate((name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim(), token);
const resolvedLength = async (page, variable) => page.evaluate((name) => {
  const probe = document.createElement('div');
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.marginInlineStart = `var(${name})`;
  document.body.append(probe);
  const value = getComputedStyle(probe).marginInlineStart;
  probe.remove();
  return value;
}, variable);

const captureConsoleErrors = (page) => {
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
};

test.beforeAll(async () => {
  await mkdir(evidenceDir, { recursive: true });
});

test.beforeEach(async ({ page }) => {
  const errors = captureConsoleErrors(page);
  await page.goto('/');
  await expect(page.locator('#breadcrumb-demo')).toBeVisible();
  expect(errors).toEqual([]);
});

test('core.breadcrumb preserves a labeled ordered hierarchy, native ancestor links, current-page text, and pinned navigation tokens', async ({ page }) => {
  const nav = page.locator('#breadcrumb-demo');
  const list = nav.locator('.ns-breadcrumb-list');
  const ancestors = nav.locator('.ns-breadcrumb-link');
  const current = page.locator('#breadcrumb-current');
  const separators = nav.locator('.ns-breadcrumb-separator');
  const ellipsis = nav.locator('.ns-breadcrumb-ellipsis');

  await expect(nav).toHaveAttribute('aria-label', 'Breadcrumb');
  expect(await nav.evaluate((element) => element.tagName)).toBe('NAV');
  expect(await list.evaluate((element) => element.tagName)).toBe('OL');
  await expect(ancestors).toHaveCount(2);
  expect(await ancestors.nth(0).evaluate((element) => element.tagName)).toBe('A');
  expect(await ancestors.nth(1).evaluate((element) => element.tagName)).toBe('A');
  await expect(ancestors.nth(0)).toHaveAttribute('href', '#button-slice');
  await expect(ancestors.nth(1)).toHaveAttribute('href', '#field-slice');
  expect(await ancestors.nth(0).getAttribute('role')).toBeNull();
  expect(await ancestors.nth(0).getAttribute('aria-disabled')).toBeNull();

  expect(await current.evaluate((element) => element.tagName)).toBe('SPAN');
  await expect(current).toHaveAttribute('aria-current', 'page');
  expect(await current.getAttribute('role')).toBeNull();
  expect(await current.getAttribute('aria-disabled')).toBeNull();
  expect(await current.getAttribute('href')).toBeNull();
  expect((await breadcrumbState(current)).tabIndex).toBe(-1);
  await expect(separators).toHaveCount(3);
  for (let index = 0; index < 3; index += 1) await expect(separators.nth(index)).toHaveAttribute('aria-hidden', 'true');
  await expect(ellipsis).toHaveAttribute('aria-hidden', 'true');

  expect(await tokenValue(page, '--ns-space-navigation-gap')).toBe('0.45rem');
  expect(await tokenValue(page, '--ns-font-size-navigation')).toBe('clamp(0.72rem, 0.69rem + 0.08vw, 0.78rem)');
  const listState = await breadcrumbState(list);
  const navState = await breadcrumbState(nav);
  expect(listState.rowGap).toBe(await resolvedLength(page, '--ns-space-navigation-gap'));
  expect(listState.columnGap).toBe(await resolvedLength(page, '--ns-space-navigation-gap'));
  expect(navState.fontSize).toBe(await resolvedLength(page, '--ns-font-size-navigation'));
  await page.screenshot({ path: `${evidenceDir}/core-breadcrumb-semantics.png`, fullPage: true });
});

test('core.breadcrumb keeps platform link keyboard behavior and does not create roving focus or a focusable current crumb', async ({ page }) => {
  const first = page.locator('#breadcrumb-components');
  const second = page.locator('#breadcrumb-forms');
  const current = page.locator('#breadcrumb-current');

  await first.focus();
  await expect(first).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(first).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(second).toBeFocused();
  const focused = await second.evaluate((element) => {
    const styles = getComputedStyle(element);
    return { outlineStyle: styles.outlineStyle, outlineWidth: styles.outlineWidth };
  });
  expect(focused.outlineStyle).toBe('solid');
  expect(focused.outlineWidth).toBe('3px');

  await first.focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => location.hash)).toBe('#button-slice');
  expect((await breadcrumbState(current)).tabIndex).toBe(-1);
  expect((await breadcrumbState(current)).active).toBeFalsy();
});

test('core.breadcrumb ancestor links remain physically stable through hover and direct pointer contact', async ({ page }) => {
  const link = page.locator('#breadcrumb-components');
  const rest = await breadcrumbState(link);
  expect(rest.transform).toBe('none');
  expect(rest.boxShadow).toBe('none');
  expect(rest.transitionDuration).toBe('0s');

  await link.hover();
  const hover = await breadcrumbState(link);
  expect(hover.transform).toBe('none');
  expect(hover.boxShadow).toBe('none');
  expect(hover.transitionDuration).toBe('0s');
  expect(hover.x).toBeCloseTo(rest.x, 2);
  expect(hover.y).toBeCloseTo(rest.y, 2);

  const box = await link.boundingBox();
  if (!box) throw new Error('breadcrumb link has no pointer box');
  await page.mouse.move(box.x + Math.min(4, box.width / 2), box.y + Math.min(4, box.height / 2));
  await page.mouse.down();
  const active = await breadcrumbState(link);
  expect(active.transform).toBe('none');
  expect(active.boxShadow).toBe('none');
  expect(active.transitionDuration).toBe('0s');
  expect(active.x).toBeCloseTo(rest.x, 2);
  expect(active.y).toBeCloseTo(rest.y, 2);
  await page.mouse.up();
});

test('core.breadcrumb preserves logical RTL hierarchy and wraps long localized paths without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const nav = page.locator('#breadcrumb-demo');
  await nav.evaluate((element) => {
    element.setAttribute('dir', 'rtl');
    element.style.maxInlineSize = '17rem';
    element.querySelector('#breadcrumb-components').textContent = 'مكوّنات الواجهة العامة الطويلة لهذا النظام';
    element.querySelector('#breadcrumb-forms').textContent = 'نماذج إعداد الحساب ومساحات العمل المتقدمة';
    element.querySelector('#breadcrumb-current').textContent = 'مسار التنقل الحالي مع تسمية محلية طويلة جداً';
  });

  const state = await breadcrumbState(nav);
  expect(state.direction).toBe('rtl');
  expect(state.scrollWidth).toBeLessThanOrEqual(state.clientWidth + 1);
  expect(state.height).toBeGreaterThan(40);
  await expect(page.locator('#breadcrumb-components')).toHaveAttribute('href', '#button-slice');
  await expect(page.locator('#breadcrumb-forms')).toHaveAttribute('href', '#field-slice');
  await expect(page.locator('#breadcrumb-current')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.ns-breadcrumb-separator').first()).toHaveAttribute('aria-hidden', 'true');
  await page.screenshot({ path: `${evidenceDir}/core-breadcrumb-rtl-long-path.png`, fullPage: true });
});

test('core.breadcrumb stays motionless with reduced motion and keeps native link/current semantics in forced colors', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await page.goto('/');
  const nav = page.locator('#breadcrumb-demo');
  const first = page.locator('#breadcrumb-components');
  const current = page.locator('#breadcrumb-current');
  const navState = await breadcrumbState(nav);
  const linkState = await breadcrumbState(first);

  expect(navState.transitionDuration).toBe('0s');
  expect(navState.transform).toBe('none');
  expect(linkState.transitionDuration).toBe('0s');
  expect(linkState.transform).toBe('none');
  expect(linkState.boxShadow).toBe('none');
  expect(linkState.color).not.toBe('rgba(0, 0, 0, 0)');
  expect((await breadcrumbState(current)).color).not.toBe('rgba(0, 0, 0, 0)');
  expect((await breadcrumbState(current)).tabIndex).toBe(-1);
  await expect(current).toHaveAttribute('aria-current', 'page');
  expect(await current.getAttribute('role')).toBeNull();
  await first.focus();
  const focused = await first.evaluate((element) => {
    const styles = getComputedStyle(element);
    return { outlineStyle: styles.outlineStyle, outlineWidth: styles.outlineWidth };
  });
  expect(focused.outlineStyle).toBe('solid');
  expect(parseFloat(focused.outlineWidth)).toBeGreaterThanOrEqual(3);
  await expect(page.locator('.ns-breadcrumb-separator').first()).toHaveAttribute('aria-hidden', 'true');
  await page.screenshot({ path: `${evidenceDir}/core-breadcrumb-forced-colors.png`, fullPage: true });
});
