import { mkdir } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

const evidenceDir = 'artifacts/browser';

const tooltipState = async (target, tooltip) => target.evaluate((element, tooltipId) => {
  const surface = document.getElementById(tooltipId);
  const targetStyles = getComputedStyle(element);
  const tooltipStyles = getComputedStyle(surface);
  const targetRect = element.getBoundingClientRect();
  const tooltipRect = surface.getBoundingClientRect();
  return {
    targetTag: element.tagName,
    href: element.getAttribute('href'),
    describedBy: element.getAttribute('aria-describedby'),
    targetState: element.dataset.tooltipState || '',
    targetTransform: targetStyles.transform,
    targetX: targetRect.x,
    targetY: targetRect.y,
    targetDocumentX: targetRect.x + window.scrollX,
    targetDocumentY: targetRect.y + window.scrollY,
    targetWidth: targetRect.width,
    targetHeight: targetRect.height,
    targetFocused: document.activeElement === element,
    role: surface?.getAttribute('role'),
    state: surface?.dataset.state || '',
    tabIndex: surface?.tabIndex,
    visibility: tooltipStyles.visibility,
    opacity: Number.parseFloat(tooltipStyles.opacity),
    pointerEvents: tooltipStyles.pointerEvents,
    transform: tooltipStyles.transform,
    transitionDuration: tooltipStyles.transitionDuration,
    borderWidth: tooltipStyles.borderTopWidth,
    borderStyle: tooltipStyles.borderTopStyle,
    direction: tooltipStyles.direction,
    left: tooltipRect.left,
    right: tooltipRect.right,
    top: tooltipRect.top,
    bottom: tooltipRect.bottom,
    width: tooltipRect.width,
    scrollWidth: surface?.scrollWidth ?? 0,
    clientWidth: surface?.clientWidth ?? 0,
    interactiveDescendants: surface?.querySelectorAll('button, a[href], input, select, textarea, [contenteditable="true"], [tabindex]:not([tabindex="-1"])').length ?? -1
  };
}, await tooltip.getAttribute('id'));

const pageOverflowState = async (page) => page.evaluate(() => {
  const viewportWidth = document.documentElement.clientWidth;
  const offenders = [...document.querySelectorAll('body *')]
    .map((element) => {
      const rect = element.getBoundingClientRect();
      const styles = getComputedStyle(element);
      return {
        tag: element.tagName,
        id: element.id || '',
        className: typeof element.className === 'string' ? element.className : '',
        left: Math.round(rect.left * 100) / 100,
        right: Math.round(rect.right * 100) / 100,
        width: Math.round(rect.width * 100) / 100,
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
        position: styles.position,
        direction: styles.direction
      };
    })
    .filter((entry) => entry.left < -1 || entry.right > viewportWidth + 1 || entry.scrollWidth > entry.clientWidth + 1)
    .sort((a, b) => Math.max(b.right - viewportWidth, b.scrollWidth - b.clientWidth) - Math.max(a.right - viewportWidth, a.scrollWidth - a.clientWidth))
    .slice(0, 12);
  return {
    scroll: document.documentElement.scrollWidth,
    client: viewportWidth,
    offenders
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
  await expect(page.locator('#tooltip-target')).toBeVisible();
  await expect(page.locator('#tooltip-demo')).toHaveAttribute('role', 'tooltip');
  expect(errors).toEqual([]);
});

test('core.tooltip keeps a real described target, non-interactive tooltip semantics, exact states, and token-backed informational geometry', async ({ page }) => {
  const target = page.locator('#tooltip-target');
  const tooltip = page.locator('#tooltip-demo');

  const closed = await tooltipState(target, tooltip);
  expect(closed.targetTag).toBe('A');
  expect(closed.href).toBe('#principles');
  expect(closed.describedBy).toBe('tooltip-demo');
  expect(closed.role).toBe('tooltip');
  expect(closed.state).toBe('closed');
  expect(closed.targetState).toBe('closed');
  expect(closed.tabIndex).toBe(-1);
  expect(closed.interactiveDescendants).toBe(0);
  expect(closed.visibility).toBe('hidden');
  expect(closed.pointerEvents).toBe('none');

  await target.focus();
  await expect(tooltip).toHaveAttribute('data-state', 'open');
  await expect(target).toHaveAttribute('data-tooltip-state', 'open');
  await expect.poll(async () => (await tooltipState(target, tooltip)).opacity).toBeCloseTo(1, 2);
  const open = await tooltipState(target, tooltip);
  expect(open.targetFocused).toBeTruthy();
  expect(open.visibility).toBe('visible');
  expect(open.pointerEvents).toBe('auto');
  expect(open.opacity).toBeCloseTo(1, 2);
  expect(open.transform).toBe('none');
  expect(open.borderStyle).toBe('solid');
  expect(open.borderWidth).toBe(await resolvedLength(page, '--ns-border-annotation-width'));
  await page.screenshot({ path: `${evidenceDir}/core-tooltip-semantics.png`, fullPage: true });
});

test('core.tooltip Escape dismisses the current session without moving focus or trapping normal Tab navigation', async ({ page }) => {
  const target = page.locator('#tooltip-target');
  const tooltip = page.locator('#tooltip-demo');
  const next = page.locator('#tooltip-next-focus');

  await target.focus();
  await expect(tooltip).toHaveAttribute('data-state', 'open');
  await page.keyboard.press('Escape');
  await expect(tooltip).toHaveAttribute('data-state', 'dismissed');
  await expect(target).toHaveAttribute('data-tooltip-state', 'dismissed');
  await expect(target).toBeFocused();
  await page.waitForTimeout(140);
  await expect(tooltip).toHaveAttribute('data-state', 'dismissed');

  await page.keyboard.press('Tab');
  await expect(next).toBeFocused();
  await expect(tooltip).toHaveAttribute('data-state', 'closed');
  await page.keyboard.press('Shift+Tab');
  await expect(target).toBeFocused();
  await expect(tooltip).toHaveAttribute('data-state', 'open');
});

test('core.tooltip remains available while the pointer transfers from target to tooltip and closes only after both are left', async ({ page }) => {
  const target = page.locator('#tooltip-target');
  const tooltip = page.locator('#tooltip-demo');

  await target.hover();
  await expect(tooltip).toHaveAttribute('data-state', 'open');
  await tooltip.hover();
  await page.waitForTimeout(140);
  await expect(tooltip).toHaveAttribute('data-state', 'open');

  await page.mouse.move(1, 1);
  await expect.poll(async () => (await tooltipState(target, tooltip)).state).toBe('closed');
  await expect(tooltip).toHaveAttribute('data-state', 'closed');
});

test('core.tooltip never moves its target and preserves RTL plus long localized wrapping without page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const target = page.locator('#tooltip-target');
  const tooltip = page.locator('#tooltip-demo');
  const wrapper = page.locator('#tooltip-example');
  const baselineOverflow = await pageOverflowState(page);

  await wrapper.evaluate((element) => element.setAttribute('dir', 'rtl'));
  await tooltip.evaluate((element) => {
    element.textContent = 'معلومات توضيحية إضافية طويلة تظل قابلة للقراءة وتلتف داخل السطح من دون إنشاء تمرير أفقي على الصفحة';
  });

  const before = await tooltipState(target, tooltip);
  await target.focus();
  await expect(tooltip).toHaveAttribute('data-state', 'open');
  const after = await tooltipState(target, tooltip);
  expect(after.targetTransform).toBe('none');
  expect(after.targetDocumentX).toBeCloseTo(before.targetDocumentX, 2);
  expect(after.targetDocumentY).toBeCloseTo(before.targetDocumentY, 2);
  expect(after.targetWidth).toBeCloseTo(before.targetWidth, 2);
  expect(after.targetHeight).toBeCloseTo(before.targetHeight, 2);
  expect(after.direction).toBe('rtl');
  expect(after.width).toBeLessThanOrEqual(288.5);
  expect(after.scrollWidth).toBeLessThanOrEqual(after.clientWidth + 1);
  const viewport = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
  expect(after.left).toBeGreaterThanOrEqual(0);
  expect(after.right).toBeLessThanOrEqual(viewport.width + 0.5);
  expect(after.top).toBeGreaterThanOrEqual(0);
  expect(after.bottom).toBeLessThanOrEqual(viewport.height + 0.5);
  const pageOverflow = await pageOverflowState(page);
  expect(
    pageOverflow.scroll,
    `baseline=${baselineOverflow.scroll}/${baselineOverflow.client}; after=${pageOverflow.scroll}/${pageOverflow.client}; offenders=${JSON.stringify(pageOverflow.offenders)}`
  ).toBeLessThanOrEqual(pageOverflow.client + 1);
  await page.screenshot({ path: `${evidenceDir}/core-tooltip-rtl-long-copy.png`, fullPage: true });
});

test('core.tooltip reduced motion is immediate and forced colors keeps a readable non-pressable surface without changing target semantics', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await page.goto('/');
  const target = page.locator('#tooltip-target');
  const tooltip = page.locator('#tooltip-demo');

  await target.focus();
  await expect(tooltip).toHaveAttribute('data-state', 'open');
  const state = await tooltipState(target, tooltip);
  expect(parseFloat(state.transitionDuration)).toBeLessThanOrEqual(0.002);
  expect(state.transform).toBe('none');
  expect(parseFloat(state.borderWidth)).toBeGreaterThanOrEqual(2);
  expect(state.visibility).toBe('visible');
  expect(state.href).toBe('#principles');
  expect(state.describedBy).toBe('tooltip-demo');
  expect(state.targetFocused).toBeTruthy();
  expect(state.interactiveDescendants).toBe(0);
  await page.screenshot({ path: `${evidenceDir}/core-tooltip-forced-colors.png`, fullPage: true });
});
