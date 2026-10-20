import { mkdir } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

const evidenceDir = 'artifacts/browser';

const visualState = async (button) => button.evaluate((element) => {
  const styles = getComputedStyle(element);
  const transform = styles.transform === 'none' ? null : new DOMMatrixReadOnly(styles.transform);
  const rect = element.getBoundingClientRect();
  return {
    x: transform?.m41 ?? 0,
    y: transform?.m42 ?? 0,
    boxShadow: styles.boxShadow,
    outlineWidth: styles.outlineWidth,
    transitionDuration: styles.transitionDuration,
    height: rect.height,
    active: document.activeElement === element
  };
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
  await expect(page.locator('h1')).toContainText('Built for humans.');
  await expect(page.locator('section[aria-labelledby="button-slice"] button.ns-button')).toBeVisible();
  expect(errors).toEqual([]);
});

test('deployment record binds the built proof surface to the exact source SHA', async ({ request }) => {
  const response = await request.get('/deployment.json');
  expect(response.ok()).toBeTruthy();
  const record = await response.json();
  expect(record.schema).toBe('neosmartuxui/deployment-record@1');
  expect(record.sourceRepository).toBe('neosmartuxui/neosmartuxui');
  expect(record.sourceSha).toBe((process.env.NEOSMARTUXUI_SOURCE_SHA || process.env.NEOSMARTUI_SOURCE_SHA));
  expect(record.artifact).toBe('foundry');
});

test('core.button compresses inward from rest to hover to active', async ({ page }) => {
  const button = page.locator('section[aria-labelledby="button-slice"] button.ns-button');
  await expect(button).toHaveAttribute('type', 'button');

  const rest = await visualState(button);
  expect(rest.x).toBeCloseTo(0, 1);
  expect(rest.y).toBeCloseTo(0, 1);
  expect(rest.height).toBeGreaterThanOrEqual(44);
  expect(rest.boxShadow).not.toBe('none');
  await page.screenshot({ path: `${evidenceDir}/core-button-rest.png`, fullPage: true });

  await button.hover();
  await page.waitForTimeout(180);
  const hover = await visualState(button);
  expect(hover.x).toBeCloseTo(2, 1);
  expect(hover.y).toBeCloseTo(2, 1);
  expect(hover.boxShadow).not.toBe(rest.boxShadow);
  await page.screenshot({ path: `${evidenceDir}/core-button-hover.png`, fullPage: true });

  const box = await button.boundingBox();
  if (!box) throw new Error('core.button has no bounding box');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(120);
  const active = await visualState(button);
  expect(active.x).toBeCloseTo(5, 1);
  expect(active.y).toBeCloseTo(5, 1);
  expect(active.boxShadow).not.toBe(hover.boxShadow);
  await page.screenshot({ path: `${evidenceDir}/core-button-active.png`, fullPage: true });
  await page.mouse.up();
});

test('keyboard focus remains explicit and touch target remains at least 44px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.keyboard.press('Tab');
  const button = page.locator('section[aria-labelledby="button-slice"] button.ns-button');
  await expect(button).toBeFocused();
  const state = await visualState(button);
  expect(state.active).toBeTruthy();
  expect(Number.parseFloat(state.outlineWidth)).toBeGreaterThanOrEqual(3);
  expect(state.height).toBeGreaterThanOrEqual(44);
  await page.screenshot({ path: `${evidenceDir}/core-button-focus-mobile.png`, fullPage: true });
});

test('reduced motion preserves state feedback without non-essential travel animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const button = page.locator('section[aria-labelledby="button-slice"] button.ns-button');
  const state = await visualState(button);
  expect(Number.parseFloat(state.transitionDuration)).toBeLessThanOrEqual(0.002);
  await button.hover();
  await expect.poll(async () => {
    const hover = await visualState(button);
    return [Number(hover.x.toFixed(3)), Number(hover.y.toFixed(3))];
  }, { timeout: 500 }).toEqual([2, 2]);
});

test('forced-colors rendering keeps the button visible and focusable', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/');
  const button = page.locator('section[aria-labelledby="button-slice"] button.ns-button');
  await expect(button).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(button).toBeFocused();
  await page.screenshot({ path: `${evidenceDir}/core-button-forced-colors.png`, fullPage: true });
});
