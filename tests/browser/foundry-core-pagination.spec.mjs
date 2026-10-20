import { mkdir } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

const evidenceDir = 'artifacts/browser';

const paginationState = async (locator) => locator.evaluate((element) => {
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
    backgroundColor: styles.backgroundColor,
    borderWidth: styles.borderTopWidth,
    outlineStyle: styles.outlineStyle,
    outlineWidth: styles.outlineWidth,
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
  await expect(page.locator('#pagination-demo')).toBeVisible();
  expect(errors).toEqual([]);
});

test('core.pagination preserves labeled native navigation, current/unavailable semantics, passive ellipsis, and token-backed 44px targets', async ({ page }) => {
  const nav = page.locator('#pagination-demo');
  const links = nav.locator('.ns-pagination-link');
  const current = page.locator('#pagination-current');
  const unavailable = page.locator('#pagination-previous-unavailable');
  const ellipsis = page.locator('#pagination-ellipsis');

  expect(await nav.evaluate((element) => element.tagName)).toBe('NAV');
  await expect(nav).toHaveAttribute('aria-label', 'Pagination');
  await expect(links).toHaveCount(4);
  for (let index = 0; index < 4; index += 1) {
    expect(await links.nth(index).evaluate((element) => element.tagName)).toBe('A');
    expect(await links.nth(index).getAttribute('href')).toBeTruthy();
    expect((await paginationState(links.nth(index))).height).toBeGreaterThanOrEqual(44);
    expect((await paginationState(links.nth(index))).width).toBeGreaterThanOrEqual(44);
  }

  expect(await current.evaluate((element) => element.tagName)).toBe('SPAN');
  await expect(current).toHaveAttribute('aria-current', 'page');
  expect(await current.getAttribute('href')).toBeNull();
  expect((await paginationState(current)).tabIndex).toBe(-1);
  expect((await paginationState(current)).height).toBeGreaterThanOrEqual(44);
  expect((await paginationState(current)).width).toBeGreaterThanOrEqual(44);

  expect(await unavailable.evaluate((element) => element.tagName)).toBe('SPAN');
  await expect(unavailable).toHaveAttribute('aria-disabled', 'true');
  expect(await unavailable.getAttribute('href')).toBeNull();
  expect((await paginationState(unavailable)).tabIndex).toBe(-1);
  await expect(ellipsis).toHaveAttribute('aria-hidden', 'true');
  expect((await paginationState(ellipsis)).tabIndex).toBe(-1);

  const navState = await paginationState(nav);
  expect(navState.rowGap).toBe(await resolvedLength(page, '--ns-space-navigation-gap'));
  expect(navState.columnGap).toBe(await resolvedLength(page, '--ns-space-navigation-gap'));
  await page.screenshot({ path: `${evidenceDir}/core-pagination-semantics.png`, fullPage: true });
});

test('core.pagination keeps native anchor keyboard behavior and does not create roving focus or focusable current/unavailable items', async ({ page }) => {
  const first = page.locator('#pagination-page-1');
  const next = page.locator('#pagination-page-3');
  const current = page.locator('#pagination-current');
  const unavailable = page.locator('#pagination-previous-unavailable');

  await first.focus();
  await expect(first).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(first).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(next).toBeFocused();
  const focused = await paginationState(next);
  expect(focused.outlineStyle).toBe('solid');
  expect(focused.outlineWidth).toBe('3px');

  await first.focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => location.hash)).toBe('#page-1');
  expect((await paginationState(current)).active).toBeFalsy();
  expect((await paginationState(current)).tabIndex).toBe(-1);
  expect((await paginationState(unavailable)).tabIndex).toBe(-1);
});

test('core.pagination reachable links compress inward while current, unavailable, and ellipsis items remain stable', async ({ page }) => {
  const link = page.locator('#pagination-page-3');
  const current = page.locator('#pagination-current');
  const unavailable = page.locator('#pagination-previous-unavailable');
  const ellipsis = page.locator('#pagination-ellipsis');
  const rest = await paginationState(link);
  expect(rest.x).toBeCloseTo(0, 2);
  expect(rest.y).toBeCloseTo(0, 2);

  await link.hover();
  await expect.poll(async () => (await paginationState(link)).x).toBeCloseTo(2, 1);
  await expect.poll(async () => (await paginationState(link)).y).toBeCloseTo(2, 1);

  const box = await link.boundingBox();
  if (!box) throw new Error('pagination link has no pointer box');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect.poll(async () => (await paginationState(link)).x).toBeCloseTo(5, 1);
  await expect.poll(async () => (await paginationState(link)).y).toBeCloseTo(5, 1);
  await page.mouse.up();

  for (const locator of [current, unavailable, ellipsis]) {
    const before = await paginationState(locator);
    await locator.hover();
    const after = await paginationState(locator);
    expect(after.transform).toBe(before.transform);
    expect(after.boxShadow).toBe(before.boxShadow);
    expect(after.x).toBeCloseTo(before.x, 2);
    expect(after.y).toBeCloseTo(before.y, 2);
  }
});

test('core.pagination preserves RTL direction and wraps long localized labels without horizontal page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const nav = page.locator('#pagination-demo');
  await nav.evaluate((element) => {
    element.setAttribute('dir', 'rtl');
    element.style.maxInlineSize = '18rem';
    element.querySelector('#pagination-previous-unavailable').textContent = 'الصفحة السابقة غير متاحة';
    element.querySelector('#pagination-next').textContent = 'الانتقال إلى الصفحة التالية';
  });

  const state = await paginationState(nav);
  expect(state.direction).toBe('rtl');
  expect(state.scrollWidth).toBeLessThanOrEqual(state.clientWidth + 1);
  expect(state.height).toBeGreaterThan(44);
  await expect(page.locator('#pagination-next')).toHaveAttribute('href', '#page-3');
  await expect(page.locator('#pagination-current')).toHaveAttribute('aria-current', 'page');
  await page.screenshot({ path: `${evidenceDir}/core-pagination-rtl-long-labels.png`, fullPage: true });
});

test('core.pagination reduced motion keeps pressure immediate and forced colors preserves current, unavailable, boundary, and focus meaning', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await page.goto('/');
  const link = page.locator('#pagination-page-3');
  const current = page.locator('#pagination-current');
  const unavailable = page.locator('#pagination-previous-unavailable');

  const rest = await paginationState(link);
  expect(parseFloat(rest.transitionDuration)).toBeLessThanOrEqual(0.002);
  expect(parseFloat(rest.borderWidth)).toBeGreaterThanOrEqual(3);
  await link.focus();
  const focused = await paginationState(link);
  expect(focused.outlineStyle).toBe('solid');
  expect(parseFloat(focused.outlineWidth)).toBeGreaterThanOrEqual(3);

  const currentState = await paginationState(current);
  expect(parseFloat(currentState.borderWidth)).toBeGreaterThanOrEqual(3);
  expect(currentState.color).not.toBe('rgba(0, 0, 0, 0)');
  expect(currentState.tabIndex).toBe(-1);
  await expect(current).toHaveAttribute('aria-current', 'page');

  const unavailableState = await paginationState(unavailable);
  expect(parseFloat(unavailableState.borderWidth)).toBeGreaterThanOrEqual(3);
  expect(unavailableState.tabIndex).toBe(-1);
  await expect(unavailable).toHaveAttribute('aria-disabled', 'true');
  await page.screenshot({ path: `${evidenceDir}/core-pagination-forced-colors.png`, fullPage: true });
});
