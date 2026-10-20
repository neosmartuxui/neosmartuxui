import { test, expect } from '@playwright/test';

const ids = {
  root: '#toast-demo',
  visible: '#toast-demo-visible',
  queued: '#toast-demo-queued',
  dismiss: '#toast-demo-dismiss',
  after: '#toast-after'
};

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#toast-slice')).toContainText('core.toast');
  await expect(page.locator(ids.root)).toBeVisible();
  expect(errors).toEqual([]);
});

test('Toast deploys one non-modal live announcement with native optional dismissal', async ({ page, request }) => {
  for (const asset of ['toast.css', 'toast.mjs']) {
    const response = await request.get('/' + asset);
    expect(response.ok(), asset).toBeTruthy();
    expect((await response.text()).length, asset).toBeGreaterThan(100);
  }

  const root = page.locator(ids.root);
  const visible = page.locator(ids.visible);
  const queued = page.locator(ids.queued);
  const dismiss = page.locator(ids.dismiss);

  await expect(root).not.toHaveAttribute('role', /.+/);
  await expect(root).not.toHaveAttribute('aria-live', /.+/);
  await expect(root).toHaveAttribute('data-state', 'visible');
  await expect(root).toHaveAttribute('data-queued-count', '1');
  await expect(visible).toBeVisible();
  await expect(visible).toHaveAttribute('role', 'status');
  await expect(visible).toHaveAttribute('aria-live', 'polite');
  await expect(visible).toHaveAttribute('aria-atomic', 'true');
  await expect(queued).toBeHidden();
  expect(await dismiss.evaluate((element) => element.tagName)).toBe('BUTTON');
  await expect(dismiss).toHaveAttribute('type', 'button');
  await expect(root.locator('a[href],input,select,textarea,[contenteditable="true"]')).toHaveCount(0);
});

test('Toast binding promotes FIFO queued items one at a time', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const module = await import('./toast.mjs');
    const root = document.createElement('div');
    root.className = 'ns-toast-region';
    root.dataset.toastRegion = '';
    root.innerHTML = `
      <article class="ns-toast" id="toast-fifo-a" data-toast-item data-state="queued" data-toast-priority="polite"><p>A</p></article>
      <article class="ns-toast" id="toast-fifo-b" data-toast-item data-state="queued" data-toast-priority="polite"><p>B</p></article>
    `;
    document.body.append(root);
    const destroy = module.bindToast(root);
    const first = root.querySelector('#toast-fifo-a');
    const second = root.querySelector('#toast-fifo-b');
    const snapshot = {
      rootState: root.dataset.state,
      visibleId: root.dataset.visibleToast,
      queuedCount: root.dataset.queuedCount,
      firstState: first.dataset.state,
      firstRole: first.getAttribute('role'),
      firstHidden: first.hidden,
      secondState: second.dataset.state,
      secondHidden: second.hidden
    };
    destroy();
    root.remove();
    return snapshot;
  });
  expect(result).toEqual({
    rootState: 'visible',
    visibleId: 'toast-fifo-a',
    queuedCount: '1',
    firstState: 'visible',
    firstRole: 'status',
    firstHidden: false,
    secondState: 'queued',
    secondHidden: true
  });
});

test('Toast programmatic dismissal preserves outside focus and promotes the next queued status', async ({ page }) => {
  const after = page.locator(ids.after);
  await after.focus();
  await expect(after).toBeFocused();

  const result = await page.evaluate(async () => {
    const module = await import('./toast.mjs');
    const root = document.querySelector('#toast-demo');
    const item = document.querySelector('#toast-demo-visible');
    module.dismissToast(root, item, { reason: 'programmatic-test' });
    const next = document.querySelector('#toast-demo-queued');
    return {
      activeId: document.activeElement?.id,
      firstState: item.dataset.state,
      firstHidden: item.hidden,
      nextState: next.dataset.state,
      nextRole: next.getAttribute('role'),
      nextHidden: next.hidden,
      visibleId: root.dataset.visibleToast
    };
  });

  expect(result).toEqual({
    activeId: 'toast-after',
    firstState: 'dismissed',
    firstHidden: true,
    nextState: 'visible',
    nextRole: 'status',
    nextHidden: false,
    visibleId: 'toast-demo-queued'
  });
  await expect(after).toBeFocused();
});

test('Toast explicit dismissal emits only local dismissal evidence and advances FIFO', async ({ page }) => {
  await page.evaluate(() => {
    window.__toastDismissEvents = [];
    document.querySelector('#toast-demo').addEventListener('ns-toast-dismiss', (event) => {
      window.__toastDismissEvents.push(event.detail);
    });
  });

  await page.locator(ids.dismiss).click();

  await expect(page.locator(ids.visible)).toBeHidden();
  await expect(page.locator(ids.queued)).toBeVisible();
  await expect(page.locator(ids.queued)).toHaveAttribute('role', 'status');
  const events = await page.evaluate(() => window.__toastDismissEvents);
  expect(events).toEqual([{ id: 'toast-demo-visible', reason: 'explicit' }]);
});

test('Toast announcement priority is explicit and is never inferred from visual tone', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const module = await import('./toast.mjs');
    const make = (id, priority, tone) => {
      const root = document.createElement('div');
      root.className = 'ns-toast-region';
      root.dataset.toastRegion = '';
      root.innerHTML = `<article class="ns-toast" id="${id}" data-toast-item data-state="visible" data-toast-priority="${priority}" data-tone="${tone}"><p>Message</p></article>`;
      document.body.append(root);
      module.syncToastState(root);
      const item = root.firstElementChild;
      const value = { role: item.getAttribute('role'), live: item.getAttribute('aria-live'), tone: item.dataset.tone };
      root.remove();
      return value;
    };
    return {
      visualErrorPolite: make('toast-priority-polite', 'polite', 'error'),
      neutralAssertive: make('toast-priority-assertive', 'assertive', 'neutral')
    };
  });

  expect(result.visualErrorPolite).toEqual({ role: 'status', live: 'polite', tone: 'error' });
  expect(result.neutralAssertive).toEqual({ role: 'alert', live: 'assertive', tone: 'neutral' });
});

test('Toast rejects competing announcements, unsafe timers, region live roles, and arbitrary action descendants', async ({ page }) => {
  const failures = await page.evaluate(async () => {
    const module = await import('./toast.mjs');
    const probe = (html, mutateRoot) => {
      const root = document.createElement('div');
      root.className = 'ns-toast-region';
      root.dataset.toastRegion = '';
      root.innerHTML = html;
      mutateRoot?.(root);
      document.body.append(root);
      let message = '';
      try { module.syncToastState(root); } catch (error) { message = error.message; }
      root.remove();
      return message;
    };
    const passive = (attrs = '', body = '<p>Message</p>') =>
      `<article class="ns-toast" id="toast-probe" data-toast-item data-state="visible" data-toast-priority="polite" ${attrs}>${body}</article>`;
    return {
      competing: probe(passive().replace('id="toast-probe"', 'id="toast-probe-a"') + passive().replace('id="toast-probe"', 'id="toast-probe-b"')),
      regionLive: probe(passive(), (root) => root.setAttribute('aria-live', 'polite')),
      assertiveTimer: probe(passive('data-toast-priority="assertive" data-toast-timeout-ms="1000"').replace('data-toast-priority="polite" ', '')),
      essentialTimer: probe(passive('data-toast-timeout-ms="1000" data-toast-essential="true"')),
      focusableTimer: probe(passive('data-toast-timeout-ms="1000"', '<p>Message</p><button type="button" data-toast-dismiss>Dismiss</button>')),
      arbitraryAction: probe(passive('', '<p>Message</p><a href="#principles">Open</a>'))
    };
  });

  expect(failures.competing).toContain('at most one visible');
  expect(failures.regionLive).toContain('must not create a competing live-region');
  expect(failures.assertiveTimer).toContain('assertive Toasts must not auto-dismiss');
  expect(failures.essentialTimer).toContain('essential Toast content must not auto-dismiss');
  expect(failures.focusableTimer).toContain('focusable Toast content must not auto-dismiss');
  expect(failures.arbitraryAction).toContain('optional native dismiss button');
});

test('Toast installs no Escape dismissal and preserves ordinary Tab traversal', async ({ page }) => {
  const visible = page.locator(ids.visible);
  const dismiss = page.locator(ids.dismiss);
  const after = page.locator(ids.after);

  await dismiss.focus();
  await expect(dismiss).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(visible).toBeVisible();
  await expect(dismiss).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(after).toBeFocused();
  await expect(visible).toBeVisible();
});

test('Toast passive timer pauses for pointer, focus-in, and document-hidden state before converging on dismissal', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const nativeSetTimeout = window.setTimeout;
    const nativeClearTimeout = window.clearTimeout;
    const scheduled = [];
    const cleared = [];
    let sequence = 0;
    window.setTimeout = (fn, ms) => {
      const id = ++sequence;
      scheduled.push({ id, fn, ms });
      return id;
    };
    window.clearTimeout = (id) => { cleared.push(id); };

    const root = document.createElement('div');
    root.className = 'ns-toast-region';
    root.dataset.toastRegion = '';
    root.innerHTML = '<article class="ns-toast" id="toast-timer" data-toast-item data-state="queued" data-toast-priority="polite" data-toast-timeout-ms="1000"><p>Passive status</p></article>';
    document.body.append(root);
    const module = await import('./toast.mjs');
    const destroy = module.bindToast(root);
    const item = root.firstElementChild;

    const firstTimer = scheduled.at(-1)?.id;
    item.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, relatedTarget: document.body }));
    const pointerCleared = cleared.includes(firstTimer);
    item.dispatchEvent(new PointerEvent('pointerout', { bubbles: true, relatedTarget: document.body }));
    const afterPointerResume = scheduled.at(-1)?.id;

    item.dispatchEvent(new FocusEvent('focusin', { bubbles: true, relatedTarget: null }));
    const focusCleared = cleared.includes(afterPointerResume);
    item.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
    const afterFocusResume = scheduled.at(-1)?.id;

    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    const hiddenCleared = cleared.includes(afterFocusResume);
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
    const finalTimer = scheduled.at(-1);

    finalTimer.fn();
    const snapshot = {
      pointerCleared,
      focusCleared,
      hiddenCleared,
      timerCount: scheduled.length,
      state: item.dataset.state,
      hidden: item.hidden,
      rootState: root.dataset.state
    };

    destroy();
    root.remove();
    delete document.hidden;
    window.setTimeout = nativeSetTimeout;
    window.clearTimeout = nativeClearTimeout;
    return snapshot;
  });

  expect(result.pointerCleared).toBe(true);
  expect(result.focusCleared).toBe(true);
  expect(result.hiddenCleared).toBe(true);
  expect(result.timerCount).toBeGreaterThanOrEqual(4);
  expect(result.state).toBe('dismissed');
  expect(result.hidden).toBe(true);
  expect(result.rootState).toBe('dismissed');
});

test('Toast stays bounded with long RTL content on a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 760 });
  const root = page.locator(ids.root);
  await root.evaluate((element) => {
    element.setAttribute('dir', 'rtl');
    element.querySelector('.ns-toast__title').textContent = 'تم حفظ التغييرات المحلية بنجاح';
    element.querySelector('.ns-toast__message').textContent = 'تظل الرسالة المكتوبة واضحة وقابلة للقراءة حتى مع المحتوى الطويل واتجاه الكتابة من اليمين إلى اليسار.';
  });

  const geometry = await page.locator(ids.visible).evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, right: rect.right, width: rect.width, direction: getComputedStyle(element).direction };
  });
  expect(geometry.left).toBeGreaterThanOrEqual(0);
  expect(geometry.right).toBeLessThanOrEqual(360);
  expect(geometry.width).toBeLessThanOrEqual(360);
  expect(geometry.direction).toBe('rtl');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});

test('Toast honors 44px dismissal, reduced motion, forced colors, and visible focus', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await page.goto('/');
  const toast = page.locator(ids.visible);
  const dismiss = page.locator(ids.dismiss);

  const state = await dismiss.evaluate((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      duration: style.transitionDuration,
      borderWidth: style.borderTopWidth,
      color: style.color
    };
  });
  expect(state.width).toBeGreaterThanOrEqual(44);
  expect(state.height).toBeGreaterThanOrEqual(44);
  expect(parseFloat(state.duration)).toBeLessThanOrEqual(0.001);
  expect(parseFloat(state.borderWidth)).toBeGreaterThanOrEqual(2);
  expect(state.color).not.toBe('rgba(0, 0, 0, 0)');

  const toastDuration = await toast.evaluate((element) => getComputedStyle(element).transitionDuration);
  expect(parseFloat(toastDuration)).toBeLessThanOrEqual(0.001);

  await dismiss.focus();
  const focus = await dismiss.evaluate((element) => {
    const style = getComputedStyle(element);
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
  });
  expect(focus.outlineStyle).toBe('solid');
  expect(parseFloat(focus.outlineWidth)).toBeGreaterThanOrEqual(2);
});
