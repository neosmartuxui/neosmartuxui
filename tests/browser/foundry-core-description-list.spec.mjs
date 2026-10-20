import { test, expect } from '@playwright/test';

const ids = {
  list: '#description-list-demo',
  link: '#description-list-demo-link',
  after: '#description-list-after'
};

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#description-list-slice')).toContainText('core.description-list');
  await expect(page.locator(ids.list)).toBeVisible();
  expect(errors).toEqual([]);
});

test('DescriptionList deploys a real native description list with authored term and description nodes', async ({ page, request }) => {
  const response = await request.get('/description-list.css');
  expect(response.ok()).toBeTruthy();
  expect((await response.text()).length).toBeGreaterThan(100);

  const list = page.locator(ids.list);
  expect(await list.evaluate((element) => element.tagName)).toBe('DL');
  await expect(list).not.toHaveAttribute('role', /.+/);
  await expect(list).not.toHaveAttribute('tabindex', /.+/);
  await expect(list).toHaveAttribute('data-state', 'rest');
  await expect(list.locator(':scope > dt')).toHaveCount(4);
  await expect(list.locator(':scope > dd')).toHaveCount(4);
  expect(await list.locator(':scope > dt').evaluateAll((nodes) => nodes.map((node) => node.tagName))).toEqual(['DT','DT','DT','DT']);
  expect(await list.locator(':scope > dd').evaluateAll((nodes) => nodes.map((node) => node.tagName))).toEqual(['DD','DD','DD','DD']);
});

test('DescriptionList preserves native many-to-one and one-to-many source grouping', async ({ page }) => {
  const sequence = await page.locator(ids.list).evaluate((element) =>
    [...element.children].map((node) => ({ tag: node.tagName, text: node.textContent.trim() }))
  );

  expect(sequence.map((entry) => entry.tag)).toEqual(['DT','DT','DD','DT','DD','DD','DT','DD']);
  expect(sequence[0].text).toBe('Foundry');
  expect(sequence[1].text).toBe('Component Lab');
  expect(sequence[2].text).toContain('two authored terms share one native description');
  expect(sequence[3].text).toBe('Public proof');
  expect(sequence[4].text).toContain('49 Core components');
  expect(sequence[5].text).toContain('Review permanent evidence rules');
});

test('DescriptionList container stays passive while descendant controls keep ordinary Tab traversal', async ({ page }) => {
  const list = page.locator(ids.list);
  const link = page.locator(ids.link);
  const after = page.locator(ids.after);

  await expect(list.locator('[role="list"],[role="listitem"],[role="table"],[role="grid"],[role="row"],[role="term"],[role="definition"]')).toHaveCount(0);
  await link.focus();
  await expect(link).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(after).toBeFocused();
});

test('DescriptionList does not manufacture selection, activation, composite focus, or editable state', async ({ page }) => {
  const list = page.locator(ids.list);
  await expect(list.locator('[aria-selected],[aria-current],[aria-checked],[aria-expanded],[aria-activedescendant]')).toHaveCount(0);
  await expect(list.locator('dt[tabindex],dd[tabindex]')).toHaveCount(0);

  const term = list.locator(':scope > dt').first();
  const description = list.locator(':scope > dd').first();
  await term.click({ position: { x: 4, y: 4 } });
  await expect(list).toHaveAttribute('data-state', 'rest');
  expect(await term.evaluate((element) => document.activeElement === element)).toBe(false);
  await description.click({ position: { x: 4, y: 4 } });
  expect(await description.evaluate((element) => document.activeElement === element)).toBe(false);
});

test('DescriptionList preserves authored source order and descendant focus order in RTL', async ({ page }) => {
  const list = page.locator(ids.list);
  const before = await list.evaluate((element) => [...element.children].map((node) => node.textContent.trim()));

  await list.evaluate((element) => element.setAttribute('dir', 'rtl'));

  const after = await list.evaluate((element) => [...element.children].map((node) => node.textContent.trim()));
  expect(after).toEqual(before);
  expect(await list.evaluate((element) => getComputedStyle(element).direction)).toBe('rtl');

  await page.locator(ids.link).focus();
  await page.keyboard.press('Tab');
  await expect(page.locator(ids.after)).toBeFocused();
});

test('DescriptionList keeps native source structure and wraps long descriptions on a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 760 });
  const list = page.locator(ids.list);

  const state = await list.evaluate((element) => {
    const term = element.querySelector(':scope > dt');
    const description = [...element.querySelectorAll(':scope > dd')].find((node) => node.textContent.includes('description-list-accessibility-verification'));
    return {
      tag: element.tagName,
      termDisplay: getComputedStyle(term).display,
      descriptionDisplay: getComputedStyle(description).display,
      overflowWrap: getComputedStyle(description).overflowWrap,
      terms: element.querySelectorAll(':scope > dt').length,
      descriptions: element.querySelectorAll(':scope > dd').length
    };
  });

  expect(state.tag).toBe('DL');
  expect(state.termDisplay).toBe('block');
  expect(state.descriptionDisplay).toBe('block');
  expect(state.overflowWrap).toBe('anywhere');
  expect(state.terms).toBe(4);
  expect(state.descriptions).toBe(4);
});

test('DescriptionList forced-colors rendering keeps term boundaries and text visible', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/');

  const state = await page.locator(ids.list).evaluate((element) => {
    const term = element.querySelector(':scope > dt:nth-of-type(3)');
    const description = element.querySelector(':scope > dd');
    const termStyle = getComputedStyle(term);
    const descriptionStyle = getComputedStyle(description);
    return {
      termColor: termStyle.color,
      descriptionColor: descriptionStyle.color,
      borderStyle: termStyle.borderTopStyle,
      borderWidth: parseFloat(termStyle.borderTopWidth)
    };
  });

  expect(state.termColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(state.descriptionColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(state.borderStyle).not.toBe('none');
  expect(state.borderWidth).toBeGreaterThan(0);
});

test('DescriptionList CSS excludes control pressure, motion, and synthetic-interaction authority', async ({ request }) => {
  const response = await request.get('/description-list.css');
  expect(response.ok()).toBeTruthy();
  const css = await response.text();

  for (const forbidden of [
    'var(--ns-depth-',
    'var(--ns-press-',
    'var(--ns-motion-',
    'transition:',
    'transition-property',
    'animation:',
    'transform:',
    'cursor: pointer',
    '[aria-selected',
    '[role="list"',
    '[role="grid"'
  ]) {
    expect(css, forbidden).not.toContain(forbidden);
  }

  expect(css).toContain('.ns-description-list > dt');
  expect(css).toContain('.ns-description-list > dd');
  expect(css).toContain('@media (forced-colors: active)');
});
