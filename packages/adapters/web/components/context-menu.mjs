import { createMenuItemEngine, menuItemSelector } from './menu-items.mjs';

const controllers = new WeakMap();
const contexts = new WeakMap();
const fail = (message) => { throw new Error(`[core.context-menu] ${message}`); };
const menuItems = createMenuItemEngine({
  owner: 'core.context-menu',
  eventName: 'ns-context-menu-activate',
  radioGroupDataKey: 'contextMenuRadioGroup'
});

const contextFor = (root) => {
  let context = contexts.get(root);
  if (!context) {
    context = { anchor: null, hold: null, suppressContextUntil: 0 };
    contexts.set(root, context);
  }
  return context;
};

const hasAccessibleName = (menu) => {
  if (menu.getAttribute('aria-label')?.trim()) return true;
  const ids = (menu.getAttribute('aria-labelledby') || '').trim().split(/\s+/).filter(Boolean);
  return ids.length > 0 && ids.every((id) => menu.ownerDocument.getElementById(id));
};

const partsFor = (root) => {
  if (!root || root.nodeType !== 1) fail('root must be an Element.');
  const target = root.querySelector('[data-context-menu-target]');
  const menu = root.querySelector('[data-context-menu-menu][role="menu"]');
  if (!target) fail('ContextMenu requires one explicit data-context-menu-target.');
  if (target.tabIndex < 0 || ('disabled' in target && target.disabled)) fail('context target must already be keyboard reachable and enabled; Core will not manufacture tabindex or role.');
  if (!menu) fail('ContextMenu requires one role="menu" surface.');
  if (!menu.id) fail('ContextMenu menu requires a stable id.');
  if (!hasAccessibleName(menu)) fail('ContextMenu menu requires aria-label or a valid aria-labelledby relationship.');
  if (menu.hasAttribute('aria-modal')) fail('ContextMenu must not claim modal semantics.');
  if (menu.querySelector('[role="menu"]')) fail('nested menus/submenus are not part of this ContextMenu slice.');
  for (const separator of menu.querySelectorAll('[role="separator"]')) if (separator.hasAttribute('tabindex')) fail('menu separators must never enter the focus model.');
  const items = menuItems.validate(menu);
  return { root, target, menu, items, open: !menu.hidden };
};

const numericStyle = (styles, property) => {
  const value = Number.parseFloat(styles[property]);
  return Number.isFinite(value) ? value : 0;
};

export function positionContextMenu(root) {
  const parts = partsFor(root);
  if (!parts.open) return { ...parts, positioned: false };
  const view = root.ownerDocument.defaultView;
  const context = contextFor(root);
  const menuRect = parts.menu.getBoundingClientRect();
  const menuStyles = view.getComputedStyle(parts.menu);
  const targetStyles = view.getComputedStyle(parts.target);
  const inlineGutter = Math.max(numericStyle(menuStyles, 'paddingInlineStart'), numericStyle(menuStyles, 'borderInlineStartWidth'), 1);
  const blockGutter = Math.max(numericStyle(menuStyles, 'paddingBlockStart'), numericStyle(menuStyles, 'borderBlockStartWidth'), 1);
  const anchor = context.anchor ?? { kind: 'target' };
  let left;
  let top;

  if (anchor.kind === 'point') {
    left = anchor.x;
    top = anchor.y;
  } else {
    const targetRect = parts.target.getBoundingClientRect();
    const rtl = targetStyles.direction === 'rtl';
    left = rtl ? targetRect.right - menuRect.width : targetRect.left;
    top = targetRect.bottom + blockGutter;
  }

  const maxLeft = Math.max(inlineGutter, view.innerWidth - menuRect.width - inlineGutter);
  const maxTop = Math.max(blockGutter, view.innerHeight - menuRect.height - blockGutter);
  left = Math.min(Math.max(left, inlineGutter), maxLeft);
  top = Math.min(Math.max(top, blockGutter), maxTop);
  parts.menu.style.left = `${left}px`;
  parts.menu.style.top = `${top}px`;
  parts.menu.style.right = 'auto';
  parts.menu.style.bottom = 'auto';
  parts.menu.dataset.contextMenuAnchor = anchor.kind;
  return { ...parts, positioned: true, left, top, anchor: anchor.kind };
}

export function syncContextMenuState(root) {
  const parts = partsFor(root);
  const state = parts.open ? 'open' : 'closed';
  parts.root.dataset.state = state;
  parts.menu.dataset.state = state;
  menuItems.sync(parts.menu);
  if (parts.open) positionContextMenu(root);
  return { ...parts, state };
}

export function setContextMenuOpen(root, open, options = {}) {
  if (typeof open !== 'boolean') throw new TypeError('core.context-menu open state must be boolean.');
  const parts = partsFor(root);
  const context = contextFor(root);
  if (open) {
    if (options.anchor) {
      if (options.anchor.kind === 'point') {
        if (!Number.isFinite(options.anchor.x) || !Number.isFinite(options.anchor.y)) throw new TypeError('core.context-menu point anchor requires finite x/y coordinates.');
        context.anchor = { kind: 'point', x: options.anchor.x, y: options.anchor.y };
      } else if (options.anchor.kind === 'target') {
        context.anchor = { kind: 'target' };
      } else {
        throw new TypeError('core.context-menu anchor kind must be point or target.');
      }
    } else if (!context.anchor) {
      context.anchor = { kind: 'target' };
    }
    parts.menu.hidden = false;
    const synced = syncContextMenuState(root);
    const focus = options.focus ?? 'first';
    if (focus === 'first') menuItems.focus(synced.menu, synced.items[0]);
    else if (focus === 'last') menuItems.focus(synced.menu, synced.items[synced.items.length - 1]);
    else if (focus !== false) throw new TypeError('core.context-menu focus must be first, last, or false.');
    return syncContextMenuState(root);
  }

  menuItems.clear(root);
  parts.menu.hidden = true;
  const result = syncContextMenuState(root);
  if (options.returnFocus === true && parts.target.isConnected && parts.target.tabIndex >= 0 && !('disabled' in parts.target && parts.target.disabled)) {
    parts.target.focus({ preventScroll: true });
  }
  return result;
}

const editableWithinTarget = (eventTarget, target) => {
  const editable = eventTarget?.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])');
  return Boolean(editable && target.contains(editable));
};

const activateItem = (root, item) => {
  const parts = partsFor(root);
  return menuItems.activate(root, parts.menu, item, {
    onPlain: () => setContextMenuOpen(root, false, { returnFocus: true })
  });
};

export function bindContextMenu(root, options = {}) {
  controllers.get(root)?.();
  let parts = partsFor(root);
  const view = root.ownerDocument.defaultView;
  const context = contextFor(root);
  const holdDelay = options.longPressDelay ?? 550;
  const moveTolerance = options.longPressMoveTolerance ?? 10;
  if (!Number.isFinite(holdDelay) || holdDelay < 350 || holdDelay > 1000) throw new TypeError('core.context-menu longPressDelay must be between 350 and 1000ms.');
  if (!Number.isFinite(moveTolerance) || moveTolerance < 4 || moveTolerance > 32) throw new TypeError('core.context-menu longPressMoveTolerance must be between 4 and 32px.');
  syncContextMenuState(root);

  const cancelHold = () => {
    if (!context.hold) return;
    if (context.hold.timer !== null) view.clearTimeout(context.hold.timer);
    context.hold = null;
  };

  const openFromPoint = (x, y) => setContextMenuOpen(root, true, { focus: 'first', anchor: { kind: 'point', x, y } });
  const openFromTarget = () => setContextMenuOpen(root, true, { focus: 'first', anchor: { kind: 'target' } });

  const onContextMenu = (event) => {
    parts = partsFor(root);
    if (!parts.target.contains(event.target)) return;
    if (editableWithinTarget(event.target, parts.target)) return;
    event.preventDefault();
    cancelHold();
    if (Date.now() < context.suppressContextUntil && parts.open) return;
    openFromPoint(event.clientX, event.clientY);
  };

  const onTargetKeyDown = (event) => {
    if ((event.key === 'F10' && event.shiftKey) || event.key === 'ContextMenu') {
      event.preventDefault();
      cancelHold();
      openFromTarget();
    }
  };

  const onTargetPointerDown = (event) => {
    if (event.pointerType !== 'touch' || event.button !== 0 || editableWithinTarget(event.target, partsFor(root).target)) return;
    cancelHold();
    const hold = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, timer: null };
    hold.timer = view.setTimeout(() => {
      if (context.hold !== hold) return;
      context.hold = null;
      context.suppressContextUntil = Date.now() + 800;
      openFromPoint(hold.x, hold.y);
    }, holdDelay);
    context.hold = hold;
  };

  const onTargetPointerMove = (event) => {
    const hold = context.hold;
    if (!hold || hold.pointerId !== event.pointerId) return;
    if (Math.hypot(event.clientX - hold.x, event.clientY - hold.y) > moveTolerance) cancelHold();
  };

  const onTargetPointerEnd = (event) => {
    if (context.hold?.pointerId === event.pointerId) cancelHold();
  };

  const onMenuPointerDown = (event) => {
    if (event.button !== 0) return;
    const item = event.target.closest?.(menuItemSelector);
    const current = partsFor(root);
    if (item && current.menu.contains(item)) menuItems.focus(current.menu, item);
  };

  const onMenuClick = (event) => {
    const current = partsFor(root);
    const item = event.target.closest?.(menuItemSelector);
    if (!item || !current.menu.contains(item)) return;
    activateItem(root, item);
  };

  const onMenuKeyDown = (event) => {
    const current = partsFor(root);
    const item = event.target.closest?.(menuItemSelector);
    if (!item || !current.menu.contains(item)) return;
    if (event.key === 'ArrowDown') { event.preventDefault(); menuItems.move(current.menu, item, 1); return; }
    if (event.key === 'ArrowUp') { event.preventDefault(); menuItems.move(current.menu, item, -1); return; }
    if (event.key === 'Home') { event.preventDefault(); menuItems.focus(current.menu, current.items[0]); return; }
    if (event.key === 'End') { event.preventDefault(); menuItems.focus(current.menu, current.items[current.items.length - 1]); return; }
    if (event.key === 'Escape') { event.preventDefault(); setContextMenuOpen(root, false, { returnFocus: true }); return; }
    if (event.key === 'Tab') {
      view.setTimeout(() => { if (partsFor(root).open) setContextMenuOpen(root, false, { returnFocus: false }); }, 0);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activateItem(root, item); return; }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      menuItems.typeahead(root, current.menu, item, event.key);
    }
  };

  const onDocumentPointerDown = (event) => {
    const current = partsFor(root);
    if (!current.open || current.target.contains(event.target) || current.menu.contains(event.target)) return;
    setContextMenuOpen(root, false, { returnFocus: false });
  };

  const onDocumentFocusIn = (event) => {
    const current = partsFor(root);
    if (!current.open || current.root.contains(event.target)) return;
    setContextMenuOpen(root, false, { returnFocus: false });
  };

  const onViewportChange = () => {
    cancelHold();
    if (partsFor(root).open) positionContextMenu(root);
  };

  parts.target.addEventListener('contextmenu', onContextMenu);
  parts.target.addEventListener('keydown', onTargetKeyDown);
  parts.target.addEventListener('pointerdown', onTargetPointerDown);
  parts.target.addEventListener('pointermove', onTargetPointerMove);
  parts.target.addEventListener('pointerup', onTargetPointerEnd);
  parts.target.addEventListener('pointercancel', onTargetPointerEnd);
  parts.menu.addEventListener('pointerdown', onMenuPointerDown);
  parts.menu.addEventListener('click', onMenuClick);
  parts.menu.addEventListener('keydown', onMenuKeyDown);
  root.ownerDocument.addEventListener('pointerdown', onDocumentPointerDown);
  root.ownerDocument.addEventListener('focusin', onDocumentFocusIn);
  view.addEventListener('resize', onViewportChange);
  view.addEventListener('scroll', onViewportChange, true);

  const dispose = () => {
    cancelHold();
    parts.target.removeEventListener('contextmenu', onContextMenu);
    parts.target.removeEventListener('keydown', onTargetKeyDown);
    parts.target.removeEventListener('pointerdown', onTargetPointerDown);
    parts.target.removeEventListener('pointermove', onTargetPointerMove);
    parts.target.removeEventListener('pointerup', onTargetPointerEnd);
    parts.target.removeEventListener('pointercancel', onTargetPointerEnd);
    parts.menu.removeEventListener('pointerdown', onMenuPointerDown);
    parts.menu.removeEventListener('click', onMenuClick);
    parts.menu.removeEventListener('keydown', onMenuKeyDown);
    root.ownerDocument.removeEventListener('pointerdown', onDocumentPointerDown);
    root.ownerDocument.removeEventListener('focusin', onDocumentFocusIn);
    view.removeEventListener('resize', onViewportChange);
    view.removeEventListener('scroll', onViewportChange, true);
    if (partsFor(root).open) setContextMenuOpen(root, false, { returnFocus: false });
    menuItems.destroy(root);
    contexts.delete(root);
    if (controllers.get(root) === dispose) controllers.delete(root);
  };

  controllers.set(root, dispose);
  return dispose;
}
