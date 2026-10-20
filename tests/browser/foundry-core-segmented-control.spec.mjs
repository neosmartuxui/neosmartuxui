import { mkdir } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

const evidenceDir = 'artifacts/browser';

const segmentState = async (locator) => locator.evaluate((element) => {
  const styles = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  const matrix = styles.transform === 'none' ? null : new DOMMatrixReadOnly(styles.transform);
  return {
    tagName: element.tagName,
    type: element.getAttribute('type'),
    role: element.getAttribute('role'),
    ariaPressed: element.getAttribute('aria-pressed'),
    disabled: element.disabled === true,
    dataState: element.dataset.state || '',
    transform: styles.transform,
    x: matrix?.m41 ?? 0,
    y: matrix?.m42 ?? 0,
    boxShadow: styles.boxShadow,
    borderStyle: styles.borderTopStyle,
    borderWidth: styles.borderTopWidth,
    outlineStyle: styles.outlineStyle,
    outlineWidth: styles.outlineWidth,
    transitionDuration: styles.transitionDuration,
    direction: styles.direction,
    width: rect.width,
    height: rect.height,
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
    active: document.activeElement === element
  };
});

const groupState = async (locator) => locator.evaluate((element) => {
  const styles = getComputedStyle(element);
  return {
    role: element.getAttribute('role'),
    label: element.getAttribute('aria-label'),
    selectedSegment: element.dataset.selectedSegment || '',
    direction: styles.direction,
    display: styles.display,
    rowGap: styles.rowGap,
    columnGap: styles.columnGap,
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth
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
  await expect(page.locator('#segmented-control-demo')).toBeVisible();
  expect(errors).toEqual([]);
});

test('core.segmented-control preserves real button peers, one aria-pressed selection, native disabled semantics, and token-backed targets', async ({ page }) => {
  const group = page.locator('#segmented-control-demo');
  const segments = group.locator('.ns-segmented-control-segment');
  await expect(segments).toHaveCount(4);
  await expect(group).toHaveAttribute('role', 'group');
  await expect(group).toHaveAttribute('aria-label', 'View mode');

  for (let index = 0; index < 4; index += 1) {
    const state = await segmentState(segments.nth(index));
    expect(state.tagName).toBe('BUTTON');
    expect(state.type).toBe('button');
    expect(['true', 'false']).toContain(state.ariaPressed);
    expect(state.height).toBeGreaterThanOrEqual(44);
    expect(state.width).toBeGreaterThanOrEqual(44);
    expect(state.role).toBeNull();
  }

  await expect(page.locator('[aria-pressed="true"].ns-segmented-control-segment')).toHaveCount(1);
  await expect(page.locator('#segment-overview')).toHaveAttribute('data-state', 'selected');
  await expect(page.locator('#segment-unavailable')).toBeDisabled();
  await expect(page.locator('#segment-unavailable')).toHaveAttribute('data-state', 'disabled');
  expect((await groupState(group)).selectedSegment).toBe('segment-overview');
  expect((await groupState(group)).columnGap).toBe(await resolvedLength(page, '--ns-space-navigation-gap'));

  await page.locator('#segment-activity').click();
  await expect(page.locator('[aria-pressed="true"].ns-segmented-control-segment')).toHaveCount(1);
  await expect(page.locator('#segment-activity')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#segment-overview')).toHaveAttribute('aria-pressed', 'false');
  expect((await groupState(group)).selectedSegment).toBe('segment-activity');

  await page.locator('#segment-activity').click();
  await expect(page.locator('#segment-activity')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[aria-pressed="true"].ns-segmented-control-segment')).toHaveCount(1);
  await page.screenshot({ path: `${evidenceDir}/core-segmented-control-semantics.png`, fullPage: true });
});

test('core.segmented-control keeps normal button Tab, Space, and Enter behavior and does not create roving Arrow/Home/End focus', async ({ page }) => {
  const overview = page.locator('#segment-overview');
  const activity = page.locator('#segment-activity');
  const history = page.locator('#segment-history');

  await overview.focus();
  await expect(overview).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(overview).toBeFocused();
  await page.keyboard.press('Home');
  await expect(overview).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(activity).toBeFocused();
  await page.keyboard.press('Space');
  await expect(activity).toHaveAttribute('aria-pressed', 'true');
  expect((await segmentState(activity)).outlineStyle).toBe('solid');

  await page.keyboard.press('Tab');
  await expect(history).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(history).toHaveAttribute('aria-pressed', 'true');
  await expect(activity).toHaveAttribute('aria-pressed', 'false');

  await page.keyboard.press('Tab');
  await expect(page.locator('#principles')).not.toBeFocused();
  expect((await segmentState(page.locator('#segment-unavailable'))).active).toBeFalsy();
});

test('core.segmented-control unselected peers compress 0→2→5px while selected state remains persistently seated and non-color distinct', async ({ page }) => {
  const history = page.locator('#segment-history');
  const activity = page.locator('#segment-activity');
  const rest = await segmentState(history);
  expect(rest.x).toBeCloseTo(0, 2);
  expect(rest.y).toBeCloseTo(0, 2);

  await history.hover();
  await expect.poll(async () => (await segmentState(history)).x).toBeCloseTo(2, 1);
  await expect.poll(async () => (await segmentState(history)).y).toBeCloseTo(2, 1);

  const box = await history.boundingBox();
  if (!box) throw new Error('segmented-control segment has no pointer box');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect.poll(async () => (await segmentState(history)).x).toBeCloseTo(5, 1);
  await expect.poll(async () => (await segmentState(history)).y).toBeCloseTo(5, 1);
  await page.mouse.up();

  await activity.click();
  await expect.poll(async () => (await segmentState(activity)).x).toBeCloseTo(5, 1);
  await expect.poll(async () => (await segmentState(activity)).y).toBeCloseTo(5, 1);
  const selected = await segmentState(activity);
  expect(selected.borderStyle).toBe('double');
  await expect(activity).toHaveAttribute('aria-pressed', 'true');
  await expect(activity).toHaveAttribute('data-state', 'selected');
});

test('core.segmented-control preserves RTL document order and wraps long localized labels without horizontal page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const group = page.locator('#segmented-control-demo');
  await group.evaluate((element) => {
    element.setAttribute('dir', 'rtl');
    element.querySelector('#segment-overview').textContent = 'نظرة عامة على مساحة العمل';
    element.querySelector('#segment-activity').textContent = 'النشاط والتغييرات الأخيرة';
    element.querySelector('#segment-history').textContent = 'السجل الكامل للإصدارات';
  });

  const state = await groupState(group);
  expect(state.direction).toBe('rtl');
  expect(state.display).toBe('grid');
  expect(state.scrollWidth).toBeLessThanOrEqual(state.clientWidth + 1);
  const labels = await group.locator('.ns-segmented-control-segment').allTextContents();
  expect(labels[0]).toContain('نظرة عامة');
  await expect(page.locator('#segment-overview')).toHaveAttribute('aria-pressed', 'true');
  await page.screenshot({ path: `${evidenceDir}/core-segmented-control-rtl-long-labels.png`, fullPage: true });
});

test('core.segmented-control reduced motion keeps immediate state feedback and forced colors preserves focus, disabled, and non-color selection meaning', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await page.goto('/');
  const selected = page.locator('#segment-overview');
  const activity = page.locator('#segment-activity');
  const unavailable = page.locator('#segment-unavailable');

  expect(parseFloat((await segmentState(activity)).transitionDuration)).toBeLessThanOrEqual(0.002);
  await activity.focus();
  const focused = await segmentState(activity);
  expect(focused.outlineStyle).toBe('solid');
  expect(parseFloat(focused.outlineWidth)).toBeGreaterThanOrEqual(3);

  const selectedState = await segmentState(selected);
  expect(selectedState.borderStyle).toBe('double');
  expect(parseFloat(selectedState.borderWidth)).toBeGreaterThanOrEqual(3);
  await expect(selected).toHaveAttribute('aria-pressed', 'true');

  const disabledState = await segmentState(unavailable);
  expect(disabledState.disabled).toBeTruthy();
  expect(parseFloat(disabledState.borderWidth)).toBeGreaterThanOrEqual(3);
  await expect(unavailable).toBeDisabled();
  await page.screenshot({ path: `${evidenceDir}/core-segmented-control-forced-colors.png`, fullPage: true });
});
