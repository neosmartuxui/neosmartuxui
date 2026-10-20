import { createMenuItemEngine, menuItemSelector } from './menu-items.mjs';

const controllers = new WeakMap();
const sides = new Set(['block-start', 'block-end', 'inline-start', 'inline-end']);
const aligns = new Set(['start', 'center', 'end']);
const fail = (message) => { throw new Error(`[core.dropdown-menu] ${message}`); };
const menuItems = createMenuItemEngine({
  owner: 'core.dropdown-menu',
  eventName: 'ns-dropdown-menu-activate',
  radioGroupDataKey: 'dropdownMenuRadioGroup'
});

const partsFor = (root) => {
  if (!root || root.nodeType !== 1) fail('root must be an Element.');
  const trigger = root.querySelector('[data-dropdown-menu-trigger]');
  const menu = root.querySelector('[data-dropdown-menu-menu][role="menu"]');
  if (!trigger || trigger.tagName !== 'BUTTON' || trigger.type !== 'button') fail('DropdownMenu requires a real <button type="button"> trigger.');
  if (!menu) fail('DropdownMenu requires one role="menu" surface.');
  if (!trigger.id || !menu.id) fail('DropdownMenu trigger and menu require stable ids.');
  if (trigger.getAttribute('aria-haspopup') !== 'menu') fail('trigger requires aria-haspopup="menu".');
  if (trigger.getAttribute('aria-controls') !== menu.id) fail('trigger aria-controls must reference the menu surface.');
  if (!['true', 'false'].includes(trigger.getAttribute('aria-expanded'))) fail('trigger requires machine-readable aria-expanded state.');
  if (menu.getAttribute('aria-labelledby') !== trigger.id) fail('menu must be aria-labelledby by the trigger.');
  if (menu.hasAttribute('aria-modal')) fail('DropdownMenu must not claim modal semantics.');
  if (menu.querySelector('[role="menu"]')) fail('nested menus/submenus are not part of this DropdownMenu slice.');
  const expanded = trigger.getAttribute('aria-expanded') === 'true';
  if (expanded === menu.hidden) fail('aria-expanded and menu hidden state must agree.');
  const side = menu.dataset.dropdownMenuSide;
  const align = menu.dataset.dropdownMenuAlign;
  if (!sides.has(side)) fail('DropdownMenu requires logical data-dropdown-menu-side.');
  if (!aligns.has(align)) fail('DropdownMenu requires data-dropdown-menu-align start, center, or end.');
  const items = menuItems.validate(menu);
  for (const separator of menu.querySelectorAll('[role="separator"]')) {
    if (separator.hasAttribute('tabindex')) fail('menu separators must never enter the focus model.');
  }
  return { root, trigger, menu, items, side, align, open: expanded };
};

const numericStyle = (styles, property) => {
  const value = Number.parseFloat(styles[property]);
  return Number.isFinite(value) ? value : 0;
};

export function positionDropdownMenu(root) {
  const parts = partsFor(root);
  if (!parts.open) return { ...parts, positioned: false };
  const view = root.ownerDocument.defaultView;
  const anchor = parts.trigger.getBoundingClientRect();
  const menuRect = parts.menu.getBoundingClientRect();
  const menuStyles = view.getComputedStyle(parts.menu);
  const triggerStyles = view.getComputedStyle(parts.trigger);
  const inlineGutter = Math.max(numericStyle(menuStyles, 'paddingInlineStart'), numericStyle(menuStyles, 'borderInlineStartWidth'), 1);
  const blockGutter = Math.max(numericStyle(menuStyles, 'paddingBlockStart'), numericStyle(menuStyles, 'borderBlockStartWidth'), 1);
  const rtl = triggerStyles.direction === 'rtl';
  let left;
  let top;

  if (parts.side === 'block-start' || parts.side === 'block-end') {
    top = parts.side === 'block-start' ? anchor.top - blockGutter - menuRect.height : anchor.bottom + blockGutter;
    if (parts.align === 'center') left = anchor.left + (anchor.width - menuRect.width) / 2;
    else if (parts.align === 'start') left = rtl ? anchor.right - menuRect.width : anchor.left;
    else left = rtl ? anchor.left : anchor.right - menuRect.width;
  } else {
    const inlineStartLeft = rtl ? anchor.right + inlineGutter : anchor.left - inlineGutter - menuRect.width;
    const inlineEndLeft = rtl ? anchor.left - inlineGutter - menuRect.width : anchor.right + inlineGutter;
    left = parts.side === 'inline-start' ? inlineStartLeft : inlineEndLeft;
    if (parts.align === 'center') top = anchor.top + (anchor.height - menuRect.height) / 2;
    else if (parts.align === 'start') top = anchor.top;
    else top = anchor.bottom - menuRect.height;
  }

  const maxLeft = Math.max(inlineGutter, view.innerWidth - menuRect.width - inlineGutter);
  const maxTop = Math.max(blockGutter, view.innerHeight - menuRect.height - blockGutter);
  left = Math.min(Math.max(left, inlineGutter), maxLeft);
  top = Math.min(Math.max(top, blockGutter), maxTop);
  parts.menu.style.left = `${left}px`;
  parts.menu.style.top = `${top}px`;
  parts.menu.style.right = 'auto';
  parts.menu.style.bottom = 'auto';
  return { ...parts, positioned: true, left, top };
}

const syncItemStates = (parts) => menuItems.sync(parts.menu);

export function syncDropdownMenuState(root) {
  const parts = partsFor(root);
  const state = parts.open ? 'open' : 'closed';
  parts.root.dataset.state = state;
  parts.menu.dataset.state = state;
  parts.root.dataset.dropdownMenuSide = parts.side;
  parts.root.dataset.dropdownMenuAlign = parts.align;
  syncItemStates(parts);
  if (parts.open) positionDropdownMenu(root);
  return { ...parts, state };
}

const focusItem = (root, item) => menuItems.focus(partsFor(root).menu, item);
const focusByOffset = (root, current, offset) => menuItems.move(partsFor(root).menu, current, offset);
const clearTypeahead = (root) => menuItems.clear(root);
const typeaheadFocus = (root, current, key) => menuItems.typeahead(root, partsFor(root).menu, current, key);

export function setDropdownMenuPlacement(root, side, align = 'start') {
  if (!sides.has(side)) throw new TypeError('core.dropdown-menu side must be block-start, block-end, inline-start, or inline-end.');
  if (!aligns.has(align)) throw new TypeError('core.dropdown-menu align must be start, center, or end.');
  const parts = partsFor(root);
  parts.menu.dataset.dropdownMenuSide = side;
  parts.menu.dataset.dropdownMenuAlign = align;
  return syncDropdownMenuState(root);
}

export function setDropdownMenuOpen(root, open, options = {}) {
  if (typeof open !== 'boolean') throw new TypeError('core.dropdown-menu open state must be boolean.');
  const parts = partsFor(root);
  if (open) {
    parts.trigger.setAttribute('aria-expanded', 'true');
    parts.menu.hidden = false;
    const synced = syncDropdownMenuState(root);
    const focus = options.focus ?? 'first';
    if (focus === 'first') focusItem(root, synced.items[0]);
    else if (focus === 'last') focusItem(root, synced.items[synced.items.length - 1]);
    else if (focus !== false) throw new TypeError('core.dropdown-menu focus must be first, last, or false.');
    return syncDropdownMenuState(root);
  }

  clearTypeahead(root);
  parts.trigger.setAttribute('aria-expanded', 'false');
  parts.menu.hidden = true;
  const result = syncDropdownMenuState(root);
  if (options.returnFocus === true && parts.trigger.isConnected && !parts.trigger.disabled) {
    parts.trigger.focus({ preventScroll: true });
  }
  return result;
}

const activateItem = (root, item) => {
  const parts = partsFor(root);
  return menuItems.activate(root, parts.menu, item, {
    onPlain: () => setDropdownMenuOpen(root, false, { returnFocus: true })
  });
};

export function bindDropdownMenu(root, options = {}) {
  controllers.get(root)?.();
  let parts = partsFor(root);
  const view = root.ownerDocument.defaultView;
  const initialOpen = parts.open;
  syncDropdownMenuState(root);
  if (initialOpen && options.initialFocus !== false && !parts.menu.contains(root.ownerDocument.activeElement)) {
    focusItem(root, parts.items[0]);
  }

  const onTriggerClick = () => {
    parts = partsFor(root);
    if (parts.open) setDropdownMenuOpen(root, false, { returnFocus: false });
    else setDropdownMenuOpen(root, true, { focus: 'first' });
  };

  const onTriggerKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setDropdownMenuOpen(root, true, { focus: 'first' });
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setDropdownMenuOpen(root, true, { focus: 'last' });
    }
  };

  const onMenuPointerDown = (event) => {
    if (event.button !== 0) return;
    const item = event.target.closest?.(menuItemSelector);
    if (item && partsFor(root).menu.contains(item)) focusItem(root, item);
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

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusByOffset(root, item, 1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusByOffset(root, item, -1);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      focusItem(root, current.items[0]);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      focusItem(root, current.items[current.items.length - 1]);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setDropdownMenuOpen(root, false, { returnFocus: true });
      return;
    }
    if (event.key === 'Tab') {
      view.setTimeout(() => {
        if (partsFor(root).open) setDropdownMenuOpen(root, false, { returnFocus: false });
      }, 0);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activateItem(root, item);
      return;
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      typeaheadFocus(root, item, event.key);
    }
  };

  const onDocumentPointerDown = (event) => {
    const current = partsFor(root);
    if (!current.open || current.root.contains(event.target)) return;
    setDropdownMenuOpen(root, false, { returnFocus: false });
  };

  const onDocumentFocusIn = (event) => {
    const current = partsFor(root);
    if (!current.open || current.root.contains(event.target)) return;
    setDropdownMenuOpen(root, false, { returnFocus: false });
  };

  const onViewportChange = () => {
    if (partsFor(root).open) positionDropdownMenu(root);
  };

  parts.trigger.addEventListener('click', onTriggerClick);
  parts.trigger.addEventListener('keydown', onTriggerKeyDown);
  parts.menu.addEventListener('pointerdown', onMenuPointerDown);
  parts.menu.addEventListener('click', onMenuClick);
  parts.menu.addEventListener('keydown', onMenuKeyDown);
  root.ownerDocument.addEventListener('pointerdown', onDocumentPointerDown);
  root.ownerDocument.addEventListener('focusin', onDocumentFocusIn);
  view.addEventListener('resize', onViewportChange);
  view.addEventListener('scroll', onViewportChange, true);

  const dispose = () => {
    clearTypeahead(root);
    parts.trigger.removeEventListener('click', onTriggerClick);
    parts.trigger.removeEventListener('keydown', onTriggerKeyDown);
    parts.menu.removeEventListener('pointerdown', onMenuPointerDown);
    parts.menu.removeEventListener('click', onMenuClick);
    parts.menu.removeEventListener('keydown', onMenuKeyDown);
    root.ownerDocument.removeEventListener('pointerdown', onDocumentPointerDown);
    root.ownerDocument.removeEventListener('focusin', onDocumentFocusIn);
    view.removeEventListener('resize', onViewportChange);
    view.removeEventListener('scroll', onViewportChange, true);
    if (partsFor(root).open) setDropdownMenuOpen(root, false, { returnFocus: false });
    menuItems.destroy(root);
    if (controllers.get(root) === dispose) controllers.delete(root);
  };

  controllers.set(root, dispose);
  return dispose;
}
