const controllers = new WeakMap();
const runtimes = new WeakMap();
const fail = (message) => { throw new Error(`[core.toast] ${message}`); };
const STATES = new Set(['queued', 'visible', 'dismissed']);
const PRIORITIES = new Set(['polite', 'assertive']);
const TONES = new Set(['neutral', 'info', 'success', 'warning', 'error']);

const ownedItems = (root) => [...root.querySelectorAll('[data-toast-item]')]
  .filter((item) => item.closest('[data-toast-region]') === root);

const timeoutFor = (item) => {
  const raw = item.getAttribute('data-toast-timeout-ms');
  if (raw === null || raw === '') return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) fail('data-toast-timeout-ms must be a positive finite number when authored.');
  return value;
};

const dismissFor = (item) => {
  const controls = [...item.querySelectorAll('[data-toast-dismiss]')];
  if (controls.length > 1) fail('a Toast may contain at most one dismiss control.');
  const button = controls[0] ?? null;
  if (!button) return null;
  if (button.tagName !== 'BUTTON' || button.type !== 'button') fail('Toast dismiss control must be a real <button type="button">.');
  const name = button.getAttribute('aria-label')?.trim() || button.textContent?.trim();
  if (!name) fail('Toast dismiss control requires an accessible name.');
  return button;
};

const validateItem = (item) => {
  if (!item.id) fail('each Toast item requires a stable id.');
  const state = item.dataset.state;
  if (!STATES.has(state)) fail(`Toast ${item.id} requires queued, visible, or dismissed data-state.`);
  const priority = item.dataset.toastPriority || 'polite';
  if (!PRIORITIES.has(priority)) fail(`Toast ${item.id} priority must be polite or assertive.`);
  const tone = item.dataset.tone || 'neutral';
  if (!TONES.has(tone)) fail(`Toast ${item.id} tone must be neutral, info, success, warning, or error.`);
  const dismiss = dismissFor(item);
  const interactive = [...item.querySelectorAll('a[href],button,input,select,textarea,[contenteditable="true"],[tabindex]')]
    .filter((element) => element !== dismiss);
  if (interactive.length) fail('first-slice Toast content may contain only the optional native dismiss button as an interactive descendant.');
  const timeout = timeoutFor(item);
  if (timeout !== null) {
    if (priority !== 'polite') fail('assertive Toasts must not auto-dismiss in the first slice.');
    if (item.dataset.toastEssential === 'true') fail('essential Toast content must not auto-dismiss.');
    if (dismiss) fail('focusable Toast content must not auto-dismiss on an unadjustable timer.');
  }
  return { item, state, priority, tone, dismiss, timeout };
};

const partsFor = (root) => {
  if (!(root instanceof Element) || !root.classList.contains('ns-toast-region') || !root.hasAttribute('data-toast-region')) {
    fail('web adapter requires an .ns-toast-region[data-toast-region] root.');
  }
  if (root.hasAttribute('role') || root.hasAttribute('aria-live')) {
    fail('Toast region itself must not create a competing live-region announcement channel.');
  }
  const items = ownedItems(root);
  if (!items.length) fail('Toast region requires at least one authored [data-toast-item].');
  const records = items.map(validateItem);
  if (records.filter((record) => record.state === 'visible').length > 1) fail('Toast permits at most one visible announcement at a time.');
  return { root, records };
};

const projectItem = (record) => {
  const visible = record.item.dataset.state === 'visible';
  record.item.hidden = !visible;
  if (visible) {
    record.item.setAttribute('role', record.priority === 'assertive' ? 'alert' : 'status');
    record.item.setAttribute('aria-live', record.priority);
    record.item.setAttribute('aria-atomic', 'true');
  } else {
    record.item.removeAttribute('role');
    record.item.removeAttribute('aria-live');
    record.item.removeAttribute('aria-atomic');
  }
};

const currentVisible = (parts) => parts.records.find((record) => record.item.dataset.state === 'visible') ?? null;

const clearBoundTimer = (runtime) => {
  if (runtime?.timeoutId !== null && runtime?.timeoutId !== undefined) clearTimeout(runtime.timeoutId);
  if (runtime) runtime.timeoutId = null;
};

const scheduleBoundTimer = (root) => {
  const runtime = runtimes.get(root);
  if (!runtime) return;
  clearBoundTimer(runtime);
  const parts = partsFor(root);
  const visible = currentVisible(parts);
  if (!visible || visible.timeout === null) {
    runtime.item = visible?.item ?? null;
    runtime.remaining = null;
    runtime.startedAt = null;
    return;
  }
  if (runtime.item !== visible.item || runtime.remaining === null) {
    runtime.item = visible.item;
    runtime.remaining = visible.timeout;
  }
  if (runtime.paused.size || runtime.remaining <= 0) return;
  runtime.startedAt = performance.now();
  runtime.timeoutId = setTimeout(() => {
    runtime.timeoutId = null;
    runtime.startedAt = null;
    dismissToast(root, visible.item, { reason: 'timeout' });
  }, runtime.remaining);
};

const pauseBoundTimer = (root, reason) => {
  const runtime = runtimes.get(root);
  if (!runtime || runtime.paused.has(reason)) return;
  runtime.paused.add(reason);
  if (runtime.timeoutId !== null && runtime.startedAt !== null && runtime.remaining !== null) {
    runtime.remaining = Math.max(0, runtime.remaining - (performance.now() - runtime.startedAt));
  }
  clearBoundTimer(runtime);
  runtime.startedAt = null;
};

const resumeBoundTimer = (root, reason) => {
  const runtime = runtimes.get(root);
  if (!runtime) return;
  runtime.paused.delete(reason);
  if (!runtime.paused.size) scheduleBoundTimer(root);
};

export function syncToastState(root) {
  const parts = partsFor(root);
  for (const record of parts.records) projectItem(record);
  const visible = currentVisible(parts);
  const queued = parts.records.filter((record) => record.item.dataset.state === 'queued');
  root.dataset.state = visible ? 'visible' : queued.length ? 'queued' : 'dismissed';
  if (visible) root.dataset.visibleToast = visible.item.id;
  else delete root.dataset.visibleToast;
  root.dataset.queuedCount = String(queued.length);
  scheduleBoundTimer(root);
  return {
    state: root.dataset.state,
    visible: visible?.item ?? null,
    queued: queued.map((record) => record.item),
    dismissed: parts.records.filter((record) => record.item.dataset.state === 'dismissed').map((record) => record.item)
  };
}

export function showNextToast(root) {
  const parts = partsFor(root);
  const visible = currentVisible(parts);
  if (visible) {
    syncToastState(root);
    return visible.item;
  }
  const next = parts.records.find((record) => record.item.dataset.state === 'queued');
  if (!next) {
    syncToastState(root);
    return null;
  }
  next.item.dataset.state = 'visible';
  syncToastState(root);
  return next.item;
}

export function dismissToast(root, item, { reason = 'programmatic' } = {}) {
  const parts = partsFor(root);
  const record = parts.records.find((candidate) => candidate.item === item);
  if (!record) fail('dismissal requires a Toast item owned by the bound region.');
  if (item.dataset.state === 'dismissed') {
    syncToastState(root);
    return null;
  }
  const wasVisible = item.dataset.state === 'visible';
  item.dataset.state = 'dismissed';
  syncToastState(root);
  root.dispatchEvent(new CustomEvent('ns-toast-dismiss', {
    bubbles: true,
    detail: { id: item.id, reason: String(reason) }
  }));
  return wasVisible ? showNextToast(root) : null;
}

export function bindToast(root) {
  partsFor(root);
  controllers.get(root)?.();

  const runtime = {
    timeoutId: null,
    remaining: null,
    startedAt: null,
    item: null,
    paused: new Set()
  };
  runtimes.set(root, runtime);

  const initial = syncToastState(root);
  if (!initial.visible) showNextToast(root);

  const onClick = (event) => {
    const button = event.target.closest?.('[data-toast-dismiss]');
    if (!button || button.closest('[data-toast-region]') !== root) return;
    const item = button.closest('[data-toast-item]');
    if (item) dismissToast(root, item, { reason: 'explicit' });
  };

  const visibleFromEvent = (event) => {
    const item = event.target.closest?.('[data-toast-item]');
    return item && item.closest('[data-toast-region]') === root && item.dataset.state === 'visible' ? item : null;
  };

  const onPointerOver = (event) => {
    const item = visibleFromEvent(event);
    if (!item || item.contains(event.relatedTarget)) return;
    pauseBoundTimer(root, 'pointer');
  };
  const onPointerOut = (event) => {
    const item = visibleFromEvent(event);
    if (!item || item.contains(event.relatedTarget)) return;
    resumeBoundTimer(root, 'pointer');
  };
  const onFocusIn = (event) => {
    if (visibleFromEvent(event)) pauseBoundTimer(root, 'focus');
  };
  const onFocusOut = (event) => {
    const item = visibleFromEvent(event);
    if (!item || item.contains(event.relatedTarget)) return;
    resumeBoundTimer(root, 'focus');
  };
  const onVisibilityChange = () => {
    if (root.ownerDocument.hidden) pauseBoundTimer(root, 'document-hidden');
    else resumeBoundTimer(root, 'document-hidden');
  };

  root.addEventListener('click', onClick);
  root.addEventListener('pointerover', onPointerOver);
  root.addEventListener('pointerout', onPointerOut);
  root.addEventListener('focusin', onFocusIn);
  root.addEventListener('focusout', onFocusOut);
  root.ownerDocument.addEventListener('visibilitychange', onVisibilityChange);
  if (root.ownerDocument.hidden) pauseBoundTimer(root, 'document-hidden');

  const destroy = () => {
    root.removeEventListener('click', onClick);
    root.removeEventListener('pointerover', onPointerOver);
    root.removeEventListener('pointerout', onPointerOut);
    root.removeEventListener('focusin', onFocusIn);
    root.removeEventListener('focusout', onFocusOut);
    root.ownerDocument.removeEventListener('visibilitychange', onVisibilityChange);
    clearBoundTimer(runtime);
    runtimes.delete(root);
    if (controllers.get(root) === destroy) controllers.delete(root);
  };
  controllers.set(root, destroy);
  return destroy;
}
