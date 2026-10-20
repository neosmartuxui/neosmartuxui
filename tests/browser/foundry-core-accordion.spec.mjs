import { mkdir } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

const evidenceDir = 'artifacts/browser';

const triggerState = async (locator) => locator.evaluate((element) => {
  const styles = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  const matrix = styles.transform === 'none' ? null : new DOMMatrixReadOnly(styles.transform);
  const indicator = element.querySelector('.ns-accordion-indicator');
  const indicatorStyles = indicator ? getComputedStyle(indicator) : null;
  const indicatorMatrix = indicatorStyles?.transform && indicatorStyles.transform !== 'none' ? new DOMMatrixReadOnly(indicatorStyles.transform) : null;
  return {
    tagName: element.tagName,
    type: element.getAttribute('type'),
    expanded: element.getAttribute('aria-expanded'),
    controls: element.getAttribute('aria-controls'),
    disabled: element.disabled === true,
    dataState: element.dataset.state || '',
    transform: styles.transform,
    x: matrix?.m41 ?? 0,
    y: matrix?.m42 ?? 0,
    boxShadow: styles.boxShadow,
    outlineStyle: styles.outlineStyle,
    outlineWidth: styles.outlineWidth,
    borderWidth: styles.borderTopWidth,
    transitionDuration: styles.transitionDuration,
    indicatorTransitionDuration: indicatorStyles?.transitionDuration || '',
    indicatorAngle: indicatorMatrix ? Math.round(Math.atan2(indicatorMatrix.b, indicatorMatrix.a) * 180 / Math.PI) : 0,
    direction: styles.direction,
    width: rect.width,
    height: rect.height,
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
    active: document.activeElement === element
  };
});

const panelState = async (locator) => locator.evaluate((element) => {
  const styles = getComputedStyle(element);
  return {
    hidden: element.hidden,
    labelledBy: element.getAttribute('aria-labelledby'),
    role: element.getAttribute('role'),
    dataState: element.dataset.state || '',
    display: styles.display,
    direction: styles.direction,
    borderWidth: styles.borderTopWidth,
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth
  };
});

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
  await expect(page.locator('#accordion-single-demo')).toBeVisible();
  expect(errors).toEqual([]);
});

test('core.accordion preserves button-controlled disclosure semantics and explicit single/multiple expansion policies', async ({ page }) => {
  const single = page.locator('#accordion-single-demo');
  const multiple = page.locator('#accordion-multiple-demo');
  await expect(single).toHaveAttribute('data-expansion', 'single');
  await expect(multiple).toHaveAttribute('data-expansion', 'multiple');
  await expect(single).not.toHaveAttribute('role', /.+/);

  const triggers = single.locator('.ns-accordion-trigger');
  await expect(triggers).toHaveCount(3);
  for (let index = 0; index < 3; index += 1) {
    const trigger = triggers.nth(index);
    const state = await triggerState(trigger);
    expect(state.tagName).toBe('BUTTON');
    expect(state.type).toBe('button');
    expect(['true', 'false']).toContain(state.expanded);
    expect(state.height).toBeGreaterThanOrEqual(44);
    const panel = page.locator(`#${state.controls}`);
    await expect(panel).toHaveAttribute('aria-labelledby', await trigger.getAttribute('id'));
    expect((await panelState(panel)).role).toBeNull();
  }

  await expect(page.locator('#accordion-single-trigger-a')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#accordion-single-panel-a')).toBeVisible();
  await expect(page.locator('#accordion-single-panel-b')).toBeHidden();
  await page.locator('#accordion-single-trigger-b').click();
  await expect(page.locator('#accordion-single-trigger-a')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#accordion-single-panel-a')).toBeHidden();
  await expect(page.locator('#accordion-single-trigger-b')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#accordion-single-panel-b')).toBeVisible();

  await page.locator('#accordion-multiple-trigger-a').click();
  await page.locator('#accordion-multiple-trigger-b').click();
  await expect(page.locator('#accordion-multiple-trigger-a')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#accordion-multiple-trigger-b')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#accordion-single-trigger-disabled')).toBeDisabled();
  await expect(page.locator('#accordion-single-trigger-disabled')).toHaveAttribute('data-state', 'disabled');
  await page.screenshot({ path: `${evidenceDir}/core-accordion-semantics.png`, fullPage: true });
});

test('core.accordion keeps ordinary Tab order and native Space/Enter activation without Arrow/Home/End roving focus', async ({ page }) => {
  const first = page.locator('#accordion-single-trigger-a');
  const panelLink = page.locator('#accordion-panel-link');
  const second = page.locator('#accordion-single-trigger-b');

  await first.focus();
  await expect(first).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(first).toBeFocused();
  await page.keyboard.press('Home');
  await expect(first).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(panelLink).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(second).toBeFocused();
  await page.keyboard.press('Space');
  await expect(second).toBeFocused();
  await expect(second).toHaveAttribute('aria-expanded', 'true');
  await expect(first).toHaveAttribute('aria-expanded', 'false');
  await expect(panelLink).toBeHidden();

  await page.keyboard.press('Enter');
  await expect(second).toBeFocused();
  await expect(second).toHaveAttribute('aria-expanded', 'false');
  await page.keyboard.press('ArrowUp');
  await expect(second).toBeFocused();
});

test('core.accordion trigger compresses 0→2→5px and open disclosure returns to resting depth instead of becoming selected', async ({ page }) => {
  const trigger = page.locator('#accordion-multiple-trigger-a');
  const rest = await triggerState(trigger);
  expect(rest.x).toBeCloseTo(0, 2);
  expect(rest.y).toBeCloseTo(0, 2);
  expect(rest.indicatorAngle).toBe(0);

  await trigger.hover();
  await expect.poll(async () => (await triggerState(trigger)).x).toBeCloseTo(2, 1);
  await expect.poll(async () => (await triggerState(trigger)).y).toBeCloseTo(2, 1);

  const box = await trigger.boundingBox();
  if (!box) throw new Error('accordion trigger has no pointer box');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect.poll(async () => (await triggerState(trigger)).x).toBeCloseTo(5, 1);
  await expect.poll(async () => (await triggerState(trigger)).y).toBeCloseTo(5, 1);
  await page.mouse.up();
  await page.mouse.move(0, 0);

  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect.poll(async () => (await triggerState(trigger)).x).toBeCloseTo(0, 1);
  await expect.poll(async () => (await triggerState(trigger)).y).toBeCloseTo(0, 1);
  await expect.poll(async () => Math.abs((await triggerState(trigger)).indicatorAngle)).toBe(90);
  await expect(page.locator('#accordion-multiple-panel-a')).toBeVisible();
});

test('core.accordion preserves RTL logical layout and wraps long localized trigger/panel content without page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const root = page.locator('#accordion-multiple-demo');
  await root.evaluate((element) => {
    element.setAttribute('dir', 'rtl');
    element.querySelector('#accordion-multiple-trigger-a span:first-child').textContent = 'تفاصيل بنية النظام الطويلة التي يجب أن تلتف داخل المساحة المتاحة دون تجاوز الصفحة';
    element.querySelector('#accordion-multiple-panel-a p').textContent = 'هذا محتوى توضيحي طويل للتأكد من أن لوحة الأكورديون تستخدم التخطيط المنطقي وتلتف بصورة صحيحة في الواجهات من اليمين إلى اليسار.';
  });
  await page.locator('#accordion-multiple-trigger-a').click();

  const trigger = await triggerState(page.locator('#accordion-multiple-trigger-a'));
  const panel = await panelState(page.locator('#accordion-multiple-panel-a'));
  expect(trigger.direction).toBe('rtl');
  expect(trigger.scrollWidth).toBeLessThanOrEqual(trigger.clientWidth + 1);
  expect(panel.direction).toBe('rtl');
  expect(panel.scrollWidth).toBeLessThanOrEqual(panel.clientWidth + 1);
  const documentOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(documentOverflow).toBeLessThanOrEqual(1);
  await page.screenshot({ path: `${evidenceDir}/core-accordion-rtl-long-content.png`, fullPage: true });
});

test('core.accordion reduced motion is immediate and forced colors preserves trigger focus, disabled meaning, and panel boundaries', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await page.goto('/');
  const trigger = page.locator('#accordion-multiple-trigger-a');
  const disabled = page.locator('#accordion-single-trigger-disabled');

  const reduced = await triggerState(trigger);
  expect(parseFloat(reduced.transitionDuration)).toBeLessThanOrEqual(0.002);
  expect(parseFloat(reduced.indicatorTransitionDuration)).toBeLessThanOrEqual(0.002);
  await trigger.focus();
  const focused = await triggerState(trigger);
  expect(focused.outlineStyle).toBe('solid');
  expect(parseFloat(focused.outlineWidth)).toBeGreaterThanOrEqual(3);
  expect(parseFloat(focused.borderWidth)).toBeGreaterThanOrEqual(3);

  await page.keyboard.press('Space');
  await expect(page.locator('#accordion-multiple-panel-a')).toBeVisible();
  const panel = await panelState(page.locator('#accordion-multiple-panel-a'));
  expect(parseFloat(panel.borderWidth)).toBeGreaterThanOrEqual(3);
  expect(panel.dataState).toBe('open');
  expect((await triggerState(disabled)).disabled).toBeTruthy();
  await expect(disabled).toBeDisabled();
  await page.screenshot({ path: `${evidenceDir}/core-accordion-forced-colors.png`, fullPage: true });
});
