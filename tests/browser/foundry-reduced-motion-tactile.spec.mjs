import { test, expect } from '@playwright/test';

const tactile = [
  { label: 'Accordion', target: '.ns-accordion-trigger', visual: '.ns-accordion-trigger' },
  { label: 'Button', target: '.ns-button', visual: '.ns-button' },
  { label: 'Checkbox', target: '#checkbox-demo', visual: '#checkbox-demo + .ns-checkbox-visual' },
  { label: 'Combobox', target: '.ns-combobox-trigger', visual: '.ns-combobox-trigger' },
  { label: 'Pagination', target: '.ns-pagination-link', visual: '.ns-pagination-link' },
  { label: 'Radio', target: '#radio-beta', visual: '#radio-beta + .ns-radio-visual' },
  { label: 'Segmented Control', target: '.ns-segmented-control-segment[aria-pressed="false"]', visual: '.ns-segmented-control-segment[aria-pressed="false"]' },
  { label: 'Select', target: '#select-demo', visual: '#select-demo' },
  { label: 'Switch', target: '#switch-demo', visual: '#switch-demo + .ns-switch-visual' },
  { label: 'Tabs', target: '#tab-auto-details', visual: '#tab-auto-details' }
];

const parseTimes = (input) => input.split(',').map((part) => {
  const value = part.trim();
  if (value.endsWith('ms')) return Number.parseFloat(value);
  if (value.endsWith('s')) return Number.parseFloat(value) * 1000;
  return Number.parseFloat(value) || 0;
});

const visualState = async (locator) => locator.evaluate((element) => {
  const styles = getComputedStyle(element);
  const transform = styles.transform === 'none' ? null : new DOMMatrixReadOnly(styles.transform);
  return {
    x: transform?.m41 ?? 0,
    y: transform?.m42 ?? 0,
    transitionDuration: styles.transitionDuration,
    transitionDelay: styles.transitionDelay
  };
});

const effectiveTransitionMs = (state) => {
  const durations = parseTimes(state.transitionDuration);
  const delays = parseTimes(state.transitionDelay);
  return Math.max(...durations.map((duration, index) => duration + (delays[index % delays.length] ?? 0)));
};

const pointerCenter = async (page, locator) => {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) throw new Error('tactile target has no bounding box');
  await page.mouse.move(box.x + Math.max(4, box.width / 2), box.y + Math.max(4, box.height / 2));
};

const find = (page, selector) => page.locator(selector).first();

test('normal motion retains the authored Rivet 80ms press transition on all tactile surfaces', async ({ page }) => {
  await page.goto('/');
  for (const item of tactile) {
    const target = find(page, item.target);
    const visual = find(page, item.visual);
    await expect(target).toBeAttached();
    await pointerCenter(page, target);
    const current = await visualState(visual);
    expect(effectiveTransitionMs(current), item.label).toBeCloseTo(80, 0);
    await page.mouse.move(1, 1);
  }
});

test('reduced motion keeps real hover and active pressure effectively immediate on every tactile surface', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  for (const item of tactile) {
    const target = find(page, item.target);
    const visual = find(page, item.visual);
    await expect(target).toBeAttached();
    await pointerCenter(page, target);

    const hovered = await visualState(visual);
    expect(effectiveTransitionMs(hovered), `${item.label} hover transition`).toBeLessThanOrEqual(2);
    await expect.poll(async () => {
      const current = await visualState(visual);
      return [Number(current.x.toFixed(2)), Number(current.y.toFixed(2))];
    }, { timeout: 500 }).toEqual([2, 2]);

    await page.mouse.down();
    const active = await visualState(visual);
    expect(effectiveTransitionMs(active), `${item.label} active transition`).toBeLessThanOrEqual(2);
    await expect.poll(async () => {
      const current = await visualState(visual);
      return [Number(current.x.toFixed(2)), Number(current.y.toFixed(2))];
    }, { timeout: 500 }).toEqual([5, 5]);
    await page.mouse.up();
    await page.mouse.move(1, 1);
  }
});

test('reduced motion also wins for persistent pressed data states without changing the pressure destination', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  for (const item of [
    { label: 'Button', selector: '.ns-button' },
    { label: 'Combobox', selector: '.ns-combobox-trigger' },
    { label: 'Select', selector: '#select-demo' }
  ]) {
    const control = find(page, item.selector);
    await control.evaluate((element) => element.setAttribute('data-pressed', 'true'));
    const pressed = await visualState(control);
    expect(effectiveTransitionMs(pressed), `${item.label} data-pressed transition`).toBeLessThanOrEqual(2);
    await expect.poll(async () => {
      const current = await visualState(control);
      return [Number(current.x.toFixed(2)), Number(current.y.toFixed(2))];
    }, { timeout: 500 }).toEqual([5, 5]);
    await control.evaluate((element) => element.removeAttribute('data-pressed'));
  }
});
