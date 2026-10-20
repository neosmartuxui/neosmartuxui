import { test, expect } from '@playwright/test';

const ids = {
  root: '#navigation-menu-demo',
  home: '#navigation-menu-home',
  components: '#navigation-menu-components',
  guides: '#navigation-menu-guides',
  guidesTrigger: '#navigation-menu-guides-trigger',
  guidesPanel: '#navigation-menu-guides-panel',
  guidesFirst: '#navigation-menu-guide-components',
  resourcesTrigger: '#navigation-menu-resources-trigger',
  resourcesPanel: '#navigation-menu-resources-panel',
  after: '#navigation-menu-after',
  outside: '#navigation-menu-outside'
};

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#navigation-menu-slice')).toContainText('core.navigation-menu');
  await expect(page.locator(ids.root)).toBeVisible();
  expect(errors).toEqual([]);
});

test('NavigationMenu deploys native navigation/list/link/button semantics with no ARIA menu widget authority', async ({ page, request }) => {
  for (const asset of ['navigation-menu.css', 'navigation-menu.mjs']) {
    const response = await request.get('/' + asset);
    expect(response.ok(), asset).toBeTruthy();
    expect((await response.text()).length, asset).toBeGreaterThan(100);
  }

  const root = page.locator(ids.root);
  expect(await root.evaluate((element) => element.tagName)).toBe('NAV');
  await expect(root).toHaveAttribute('aria-label', 'Primary navigation');
  expect(await root.locator('[data-navigation-menu-list]').evaluate((element) => element.tagName)).toBe('UL');
  await expect(root.locator('a[href]')).toHaveCount(7);
  await expect(root.locator('button[data-navigation-menu-trigger]')).toHaveCount(2);
  await expect(root.locator('[role="menu"],[role="menubar"],[role^="menuitem"]')).toHaveCount(0);
  await expect(root.locator('[tabindex]')).toHaveCount(0);
  await expect(root.locator('a[aria-disabled]')).toHaveCount(0);
  await expect(root.locator('a[aria-current="page"]')).toHaveCount(1);
  await expect(page.locator(ids.guidesPanel)).toBeHidden();
  await expect(page.locator(ids.resourcesPanel)).toBeHidden();

  for (const selector of [ids.guidesTrigger, ids.resourcesTrigger]) {
    const button = page.locator(selector);
    expect(await button.evaluate((element) => element.tagName)).toBe('BUTTON');
    await expect(button).toHaveAttribute('type', 'button');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).toHaveAttribute('aria-controls', /navigation-menu-.+-panel/);
  }
});

test('NavigationMenu keeps ordinary Tab order and does not intercept Arrow, Home, or End keys', async ({ page }) => {
  const home = page.locator(ids.home);
  const components = page.locator(ids.components);
  const guides = page.locator(ids.guides);
  const trigger = page.locator(ids.guidesTrigger);

  await home.focus();
  await page.keyboard.press('ArrowRight');
  await expect(home).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(home).toBeFocused();
  await page.keyboard.press('Home');
  await expect(home).toBeFocused();
  await page.keyboard.press('End');
  await expect(home).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(components).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(guides).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(trigger).toBeFocused();
});

test('NavigationMenu preserves native destination activation and platform context behavior', async ({ page }) => {
  const components = page.locator(ids.components);
  const result = await components.evaluate((element) => {
    const click = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    element.dispatchEvent(click);
    const context = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 });
    element.dispatchEvent(context);
    return { clickPrevented: click.defaultPrevented, contextPrevented: context.defaultPrevented, href: element.getAttribute('href') };
  });
  expect(result).toEqual({ clickPrevented: false, contextPrevented: false, href: '#field-slice' });

  await components.focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => location.hash)).toBe('#field-slice');
});

test('NavigationMenu opens at most one first-level disclosure and native button activation toggles it', async ({ page }) => {
  const guides = page.locator(ids.guidesTrigger);
  const guidesPanel = page.locator(ids.guidesPanel);
  const resources = page.locator(ids.resourcesTrigger);
  const resourcesPanel = page.locator(ids.resourcesPanel);

  await guides.focus();
  await page.keyboard.press('Space');
  await expect(guides).toHaveAttribute('aria-expanded', 'true');
  await expect(guidesPanel).toBeVisible();
  await expect(page.locator(ids.root).locator('[data-navigation-menu-panel]:not([hidden])')).toHaveCount(1);

  await resources.click();
  await expect(guides).toHaveAttribute('aria-expanded', 'false');
  await expect(guidesPanel).toBeHidden();
  await expect(resources).toHaveAttribute('aria-expanded', 'true');
  await expect(resourcesPanel).toBeVisible();
  await expect(page.locator(ids.root).locator('[data-navigation-menu-panel]:not([hidden])')).toHaveCount(1);
});

test('NavigationMenu Escape closes an open disclosure and restores focus to its owner', async ({ page }) => {
  const trigger = page.locator(ids.guidesTrigger);
  const panel = page.locator(ids.guidesPanel);
  await trigger.click();
  await page.locator(ids.guidesFirst).focus();
  await expect(page.locator(ids.guidesFirst)).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger).toBeFocused();
});

test('NavigationMenu focus-leave and outside pointer dismissal close without focus theft', async ({ page }) => {
  const trigger = page.locator(ids.guidesTrigger);
  const panel = page.locator(ids.guidesPanel);
  const outside = page.locator(ids.outside);

  await trigger.click();
  await page.locator(ids.guidesFirst).focus();
  await outside.focus();
  await expect(panel).toBeHidden();
  await expect(outside).toBeFocused();

  await trigger.click();
  await expect(panel).toBeVisible();
  await outside.click();
  await expect(panel).toBeHidden();
  await expect(outside).toBeFocused();
});

test('NavigationMenu hover alone never opens disclosure or navigates', async ({ page }) => {
  const trigger = page.locator(ids.guidesTrigger);
  const panel = page.locator(ids.guidesPanel);
  const before = await page.evaluate(() => location.hash);

  await trigger.hover();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(panel).toBeHidden();
  expect(await page.evaluate(() => location.hash)).toBe(before);
});

test('NavigationMenu rejects duplicate current routes, fake disabled anchors, menu roles, authored tabindex, and nested disclosure', async ({ page }) => {
  const failures = await page.evaluate(async () => {
    const module = await import('./navigation-menu.mjs');
    const root = document.querySelector('#navigation-menu-demo');
    const home = document.querySelector('#navigation-menu-home');
    const components = document.querySelector('#navigation-menu-components');
    const guidesTrigger = document.querySelector('#navigation-menu-guides-trigger');
    const panel = document.querySelector('#navigation-menu-guides-panel');
    const result = {};

    components.setAttribute('aria-current', 'page');
    try { module.syncNavigationMenuState(root); } catch (error) { result.current = error.message; }
    components.removeAttribute('aria-current');

    home.setAttribute('aria-disabled', 'true');
    try { module.syncNavigationMenuState(root); } catch (error) { result.disabled = error.message; }
    home.removeAttribute('aria-disabled');

    panel.setAttribute('role', 'menu');
    try { module.syncNavigationMenuState(root); } catch (error) { result.menu = error.message; }
    panel.removeAttribute('role');

    guidesTrigger.setAttribute('tabindex', '-1');
    try { module.syncNavigationMenuState(root); } catch (error) { result.tabindex = error.message; }
    guidesTrigger.removeAttribute('tabindex');

    const nested = document.createElement('button');
    nested.type = 'button';
    nested.dataset.navigationMenuTrigger = '';
    nested.id = 'navigation-menu-nested-probe';
    nested.setAttribute('aria-expanded', 'false');
    nested.setAttribute('aria-controls', 'navigation-menu-nested-panel');
    panel.append(nested);
    try { module.syncNavigationMenuState(root); } catch (error) { result.nested = error.message; }
    nested.remove();

    return result;
  });

  expect(failures.current).toContain('at most one aria-current');
  expect(failures.disabled).toContain('must not manufacture disabled anchors');
  expect(failures.menu).toContain('must not use ARIA menu');
  expect(failures.tabindex).toContain('native Tab order');
  expect(failures.nested).toContain('nested');
});

test('NavigationMenu stays bounded with long RTL labels on a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 760 });
  const root = page.locator(ids.root);
  await root.evaluate((element) => {
    element.setAttribute('dir', 'rtl');
    element.querySelector('#navigation-menu-home').textContent = 'الصفحة الرئيسية للنظام';
    element.querySelector('#navigation-menu-components').textContent = 'مكونات واجهة المستخدم المتقدمة';
    element.querySelector('#navigation-menu-guides').textContent = 'أدلة التصميم والتطوير';
    element.querySelector('#navigation-menu-guides-trigger').textContent = 'استكشاف الأدلة';
  });
  await page.locator(ids.guidesTrigger).click();
  const panel = page.locator(ids.guidesPanel);
  await expect(panel).toBeVisible();

  const geometry = await panel.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, right: rect.right, width: rect.width, direction: getComputedStyle(element).direction };
  });
  expect(geometry.left).toBeGreaterThanOrEqual(0);
  expect(geometry.right).toBeLessThanOrEqual(360);
  expect(geometry.width).toBeLessThanOrEqual(360);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  expect(await root.evaluate((element) => getComputedStyle(element).direction)).toBe('rtl');
});

test('NavigationMenu honors 44px targets, reduced motion, forced colors, and visible focus', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await page.goto('/');
  const link = page.locator(ids.components);
  const trigger = page.locator(ids.guidesTrigger);

  for (const control of [link, trigger]) {
    const state = await control.evaluate((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        duration: style.transitionDuration,
        color: style.color,
        borderWidth: style.borderTopWidth
      };
    });
    expect(state.width).toBeGreaterThanOrEqual(44);
    expect(state.height).toBeGreaterThanOrEqual(44);
    expect(parseFloat(state.duration)).toBeLessThanOrEqual(0.001);
    expect(parseFloat(state.borderWidth)).toBeGreaterThanOrEqual(2);
    expect(state.color).not.toBe('rgba(0, 0, 0, 0)');
  }

  await link.focus();
  const focus = await link.evaluate((element) => {
    const style = getComputedStyle(element);
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
  });
  expect(focus.outlineStyle).toBe('solid');
  expect(parseFloat(focus.outlineWidth)).toBeGreaterThanOrEqual(2);
  await expect(page.locator(ids.home)).toHaveAttribute('aria-current', 'page');
});
