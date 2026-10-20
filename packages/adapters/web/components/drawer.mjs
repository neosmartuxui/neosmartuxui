const controllers = new WeakMap();
const contexts = new WeakMap();
const placements = new Set(['inline-start', 'inline-end', 'block-start', 'block-end']);
const focusableSelector = ['button:not([disabled])','a[href]','input:not([disabled])','select:not([disabled])','textarea:not([disabled])','[tabindex]:not([tabindex="-1"])'].join(',');
const fail = (message) => { throw new Error(`[core.drawer] ${message}`); };

const contextFor = (root) => {
  let context = contexts.get(root);
  if (!context) {
    context = { invoker: null, pendingRestore: false, returnFocus: true, gesture: null };
    contexts.set(root, context);
  }
  return context;
};

const validFocusTarget = (element) => Boolean(
  element?.isConnected
  && !element.hasAttribute?.('disabled')
  && element.getAttribute?.('aria-disabled') !== 'true'
  && !element.closest?.('[inert]')
);

const resolveLabel = (dialog) => {
  const ariaLabel = (dialog.getAttribute('aria-label') || '').trim();
  const labelledBy = (dialog.getAttribute('aria-labelledby') || '').trim();
  if (Boolean(ariaLabel) === Boolean(labelledBy)) {
    fail('drawer must have exactly one accessible-name source: aria-label or aria-labelledby.');
  }
  if (labelledBy) {
    for (const id of labelledBy.split(/\s+/)) {
      const label = dialog.ownerDocument.getElementById(id);
      if (!label || !label.textContent?.trim()) fail(`aria-labelledby must resolve to non-empty text: ${id}`);
    }
  }
  const describedBy = (dialog.getAttribute('aria-describedby') || '').trim();
  if (describedBy) {
    for (const id of describedBy.split(/\s+/)) {
      if (!dialog.ownerDocument.getElementById(id)) fail(`aria-describedby must resolve: ${id}`);
    }
  }
};

const partsFor = (root) => {
  if (!root || root.nodeType !== 1) fail('root must be an Element.');
  const trigger = root.querySelector('[data-drawer-trigger]');
  const dialog = root.querySelector('dialog.ns-drawer');
  if (!trigger || trigger.tagName !== 'BUTTON' || trigger.type !== 'button') {
    fail('Drawer requires a real <button type="button"> trigger.');
  }
  if (!dialog || dialog.tagName !== 'DIALOG') fail('Drawer surface must be a native <dialog>.');
  if (!dialog.id || trigger.getAttribute('aria-controls') !== dialog.id) {
    fail('trigger aria-controls must reference the owned native drawer.');
  }
  if (trigger.getAttribute('aria-haspopup') !== 'dialog') fail('trigger requires aria-haspopup="dialog".');
  if (dialog.getAttribute('aria-modal') !== 'true') fail('native Drawer requires aria-modal="true".');
  if (dialog.tabIndex !== -1) fail('Drawer surface must use tabindex="-1" for deterministic fallback focus.');
  const placement = dialog.dataset.drawerPlacement;
  if (!placements.has(placement)) fail('Drawer requires a logical data-drawer-placement.');
  resolveLabel(dialog);
  const closeControls = [...dialog.querySelectorAll('[data-drawer-close]')];
  if (!closeControls.length || closeControls.some((button) => button.tagName !== 'BUTTON' || button.type !== 'button')) {
    fail('Drawer requires at least one real <button type="button"> close control.');
  }
  const swipeHandle = dialog.querySelector('[data-drawer-swipe-handle]');
  return { root, trigger, dialog, closeControls, swipeHandle, placement };
};

const initialFocusTarget = (dialog) => {
  const explicit = dialog.querySelector('[autofocus]');
  if (explicit && explicit.matches(focusableSelector) && validFocusTarget(explicit)) return explicit;
  return [...dialog.querySelectorAll(focusableSelector)].find(validFocusTarget) ?? dialog;
};

const clearRestore = (context) => {
  context.invoker = null;
  context.pendingRestore = false;
  context.returnFocus = true;
};

const restoreInvoker = (root, fallbackTrigger) => {
  const context = contextFor(root);
  if (!context.pendingRestore) return;
  const target = validFocusTarget(context.invoker)
    ? context.invoker
    : (validFocusTarget(fallbackTrigger) ? fallbackTrigger : null);
  clearRestore(context);
  target?.focus({ preventScroll: true });
};

const closingVector = (dialog, placement) => {
  if (placement === 'block-start') return { axis: 'y', sign: -1 };
  if (placement === 'block-end') return { axis: 'y', sign: 1 };
  const rtl = getComputedStyle(dialog).direction === 'rtl';
  if (placement === 'inline-start') return { axis: 'x', sign: rtl ? 1 : -1 };
  return { axis: 'x', sign: rtl ? -1 : 1 };
};

const gestureDistance = (dialog, placement, startX, startY, endX, endY) => {
  const dx = endX - startX;
  const dy = endY - startY;
  const { axis, sign } = closingVector(dialog, placement);
  const primary = (axis === 'x' ? dx : dy) * sign;
  const cross = Math.abs(axis === 'x' ? dy : dx);
  const rect = dialog.getBoundingClientRect();
  const extent = axis === 'x' ? rect.width : rect.height;
  const threshold = Math.max(56, Math.min(extent * 0.2, 128));
  return { primary, cross, threshold };
};

export function syncDrawerState(root) {
  const parts = partsFor(root);
  if (parts.dialog.open && !parts.dialog.matches(':modal')) {
    fail('Drawer must be opened modally with showModal(), never the non-modal open attribute.');
  }
  const state = parts.dialog.open ? 'open' : 'closed';
  parts.root.dataset.state = state;
  parts.root.dataset.drawerPlacement = parts.placement;
  parts.dialog.dataset.state = state;
  return { state, open: parts.dialog.open, modal: parts.dialog.open && parts.dialog.matches(':modal'), placement: parts.placement };
}

export function setDrawerPlacement(root, placement) {
  if (!placements.has(placement)) throw new TypeError('core.drawer placement must be inline-start, inline-end, block-start, or block-end.');
  const parts = partsFor(root);
  parts.dialog.dataset.drawerPlacement = placement;
  parts.root.dataset.drawerPlacement = placement;
  return syncDrawerState(root);
}

export function setDrawerOpen(root, open, options = {}) {
  if (typeof open !== 'boolean') throw new TypeError('core.drawer open state must be boolean.');
  const parts = partsFor(root);
  const context = contextFor(root);
  if (open) {
    if (!parts.dialog.open) {
      const invoker = options.invoker ?? parts.trigger;
      context.invoker = validFocusTarget(invoker) ? invoker : parts.trigger;
      context.pendingRestore = true;
      context.returnFocus = true;
      parts.dialog.showModal();
    }
    syncDrawerState(root);
    if (options.focus !== false) initialFocusTarget(parts.dialog).focus({ preventScroll: true });
    return syncDrawerState(root);
  }

  context.returnFocus = options.returnFocus !== false;
  context.gesture = null;
  if (parts.dialog.open) parts.dialog.close();
  syncDrawerState(root);
  if (context.returnFocus) restoreInvoker(root, parts.trigger);
  else clearRestore(context);
  return syncDrawerState(root);
}

export function bindDrawer(root) {
  const parts = partsFor(root);
  controllers.get(root)?.();
  syncDrawerState(root);

  const onTriggerClick = () => setDrawerOpen(root, true, { invoker: parts.trigger });
  const onCloseClick = () => setDrawerOpen(root, false);
  const onCancel = () => {
    const context = contextFor(root);
    if (!context.pendingRestore) {
      context.invoker = parts.trigger;
      context.pendingRestore = true;
    }
    context.returnFocus = true;
    context.gesture = null;
  };
  const onClose = () => {
    syncDrawerState(root);
    const context = contextFor(root);
    context.gesture = null;
    if (context.returnFocus) restoreInvoker(root, parts.trigger);
    else clearRestore(context);
  };

  const onPointerDown = (event) => {
    if (!parts.dialog.open || event.button !== 0 || event.isPrimary === false) return;
    const context = contextFor(root);
    context.gesture = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY };
    parts.swipeHandle?.setPointerCapture?.(event.pointerId);
  };
  const onPointerUp = (event) => {
    const context = contextFor(root);
    const gesture = context.gesture;
    context.gesture = null;
    if (!gesture || gesture.pointerId !== event.pointerId || !parts.dialog.open) return;
    const current = partsFor(root);
    const { primary, cross, threshold } = gestureDistance(
      current.dialog,
      current.placement,
      gesture.startX,
      gesture.startY,
      event.clientX,
      event.clientY
    );
    if (primary >= threshold && primary > cross * 1.25) setDrawerOpen(root, false);
  };
  const onPointerCancel = () => { contextFor(root).gesture = null; };

  parts.trigger.addEventListener('click', onTriggerClick);
  for (const button of parts.closeControls) button.addEventListener('click', onCloseClick);
  parts.dialog.addEventListener('cancel', onCancel);
  parts.dialog.addEventListener('close', onClose);
  parts.swipeHandle?.addEventListener('pointerdown', onPointerDown);
  parts.swipeHandle?.addEventListener('pointerup', onPointerUp);
  parts.swipeHandle?.addEventListener('pointercancel', onPointerCancel);

  const dispose = () => {
    parts.trigger.removeEventListener('click', onTriggerClick);
    for (const button of parts.closeControls) button.removeEventListener('click', onCloseClick);
    parts.dialog.removeEventListener('cancel', onCancel);
    parts.dialog.removeEventListener('close', onClose);
    parts.swipeHandle?.removeEventListener('pointerdown', onPointerDown);
    parts.swipeHandle?.removeEventListener('pointerup', onPointerUp);
    parts.swipeHandle?.removeEventListener('pointercancel', onPointerCancel);
    if (parts.dialog.open) parts.dialog.close();
    contexts.delete(root);
    if (controllers.get(root) === dispose) controllers.delete(root);
  };

  controllers.set(root, dispose);
  return dispose;
}
