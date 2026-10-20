import { createMenuItemEngine, menuItemSelector } from './menu-items.mjs';

const contexts = new WeakMap();
const rootItemSelector = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';
const submenuItems = createMenuItemEngine({
  owner: 'core.menubar',
  eventName: 'ns-menubar-activate',
  radioGroupDataKey: 'menubarRadioGroup'
});
const fail = (message) => { throw new Error(`[core.menubar] ${message}`); };
const accessibleName = (item) => item.getAttribute('aria-label')?.trim() || (item.textContent || '').replace(/\s+/g, ' ').trim();
const isDisabled = (item) => item.getAttribute('aria-disabled') === 'true';
const isCheckable = (item) => ['menuitemcheckbox', 'menuitemradio'].includes(item.getAttribute('role'));

const contextFor = (root) => {
  let context = contexts.get(root);
  if (!context) {
    context = { typeahead: '', typeaheadTimer: null, lastRootId: null };
    contexts.set(root, context);
  }
  return context;
};

const directRootItems = (bar) => [...bar.children].filter((item) => item.matches?.(rootItemSelector));
const directMenus = (root) => [...root.children].filter((menu) => menu.matches?.('[data-menubar-menu][role="menu"]'));

const rootItemFromTarget = (bar, target) => {
  const item = target?.closest?.(rootItemSelector);
  return item?.parentElement === bar ? item : null;
};

const partsFor = (root) => {
  if (!(root instanceof root.ownerDocument.defaultView.HTMLElement) || !root.classList.contains('ns-menubar')) fail('root must be .ns-menubar.');
  const bars = root.querySelectorAll('[data-menubar-root]');
  if (bars.length !== 1) fail('requires exactly one data-menubar-root.');
  const bar = bars[0];
  if (bar.getAttribute('role') !== 'menubar') fail('root composite requires role="menubar".');
  if (!bar.getAttribute('aria-label')?.trim() && !bar.getAttribute('aria-labelledby')?.trim()) fail('menubar requires aria-label or aria-labelledby.');
  const items = directRootItems(bar);
  if (!items.length) fail('requires at least one root menu item.');
  const tabStops = items.filter((item) => item.getAttribute('tabindex') === '0');
  if (tabStops.length !== 1) fail('exactly one root menu item must have tabindex="0".');
  const menus = directMenus(root);
  const controlled = new Set();
  let openItem = null;

  for (const item of items) {
    if (!item.id) fail('every root menu item requires a stable id.');
    if (!['0', '-1'].includes(item.getAttribute('tabindex'))) fail('root menu items require tabindex="0" or "-1".');
    if (!accessibleName(item)) fail('every root menu item requires an accessible name.');
    if (item.matches('a[href], button, input, select, textarea, summary, form') || item.querySelector('a[href], button, input, select, textarea, summary, form, [contenteditable="true"]')) {
      fail('root menu items must not smuggle navigation, nested controls, editing, or form authority.');
    }
    if (item.hasAttribute('aria-disabled') && !['true', 'false'].includes(item.getAttribute('aria-disabled'))) fail('aria-disabled must be true or false when present.');
    const role = item.getAttribute('role');
    if (role === 'menuitem') {
      if (item.hasAttribute('aria-checked')) fail('plain root menuitem must not claim aria-checked.');
    } else {
      if (!['true', 'false'].includes(item.getAttribute('aria-checked'))) fail('checkable root menu items require aria-checked="true" or "false".');
      if (role === 'menuitemradio' && !item.dataset.menubarRadioGroup) fail('root menuitemradio requires data-menubar-radio-group.');
    }

    const ownsSubmenu = item.hasAttribute('aria-haspopup');
    if (ownsSubmenu) {
      if (role !== 'menuitem') fail('first-level submenu owners must use role="menuitem".');
      if (item.getAttribute('aria-haspopup') !== 'menu') fail('submenu owner requires aria-haspopup="menu".');
      if (!['true', 'false'].includes(item.getAttribute('aria-expanded'))) fail('submenu owner requires aria-expanded="true" or "false".');
      const controlledId = item.getAttribute('aria-controls');
      if (!controlledId) fail('submenu owner requires aria-controls.');
      const menu = menus.find((candidate) => candidate.id === controlledId);
      if (!menu) fail('aria-controls must reference one direct first-level data-menubar-menu.');
      if (controlled.has(menu)) fail('a first-level submenu may have only one root owner.');
      controlled.add(menu);
      const labelled = menu.getAttribute('aria-label')?.trim() || menu.getAttribute('aria-labelledby')?.trim();
      if (!labelled) fail('first-level submenu requires an accessible name.');
      if (menu.getAttribute('aria-labelledby') && menu.getAttribute('aria-labelledby') !== item.id) fail('submenu aria-labelledby must reference its owning root item.');
      submenuItems.validate(menu);
      const expanded = item.getAttribute('aria-expanded') === 'true';
      if (expanded === menu.hidden) fail('aria-expanded and submenu hidden state must agree.');
      if (expanded) {
        if (openItem) fail('at most one first-level submenu may be open.');
        openItem = item;
      }
    } else if (item.hasAttribute('aria-expanded') || item.hasAttribute('aria-controls')) {
      fail('root items without a submenu must not claim aria-expanded or aria-controls.');
    }
  }

  for (const menu of menus) {
    if (!menu.id) fail('every first-level submenu requires a stable id.');
    if (menu.hasAttribute('aria-modal')) fail('first-level submenu must not claim modal semantics.');
    if (!controlled.has(menu)) fail('orphan first-level submenus are forbidden.');
    for (const separator of menu.querySelectorAll('[role="separator"]')) if (separator.hasAttribute('tabindex')) fail('menu separators must never enter the focus model.');
  }

  const openMenu = openItem ? menus.find((menu) => menu.id === openItem.getAttribute('aria-controls')) : null;
  return { root, bar, items, menus, openItem, openMenu };
};

const menuForItem = (parts, item) => {
  const id = item?.getAttribute('aria-controls');
  return id ? parts.menus.find((menu) => menu.id === id) ?? null : null;
};

const ownerForMenu = (parts, menu) => parts.items.find((item) => item.getAttribute('aria-controls') === menu.id) ?? null;

const clearRootTypeahead = (root) => {
  const context = contextFor(root);
  const view = root.ownerDocument.defaultView;
  if (context.typeaheadTimer !== null) view.clearTimeout(context.typeaheadTimer);
  context.typeaheadTimer = null;
  context.typeahead = '';
};

const syncRootItems = (parts) => {
  for (const item of parts.items) {
    if (isDisabled(item)) item.dataset.state = 'disabled';
    else if (item.getAttribute('aria-expanded') === 'true') item.dataset.state = 'open';
    else if (isCheckable(item) && item.getAttribute('aria-checked') === 'true') item.dataset.state = 'checked';
    else item.dataset.state = 'rest';
  }
};

export function positionMenubarSubmenu(root) {
  const parts = partsFor(root);
  if (!parts.openItem || !parts.openMenu) return { ...parts, positioned: false };
  const view = root.ownerDocument.defaultView;
  const ownerRect = parts.openItem.getBoundingClientRect();
  const menuRect = parts.openMenu.getBoundingClientRect();
  const rtl = view.getComputedStyle(parts.bar).direction === 'rtl';
  const gutter = 8;
  let left = rtl ? ownerRect.right - menuRect.width : ownerRect.left;
  let top = ownerRect.bottom + gutter;
  left = Math.max(gutter, Math.min(left, Math.max(gutter, view.innerWidth - menuRect.width - gutter)));
  let side = 'block-end';
  if (top + menuRect.height > view.innerHeight - gutter && ownerRect.top - gutter - menuRect.height >= gutter) {
    top = ownerRect.top - gutter - menuRect.height;
    side = 'block-start';
  }
  top = Math.max(gutter, Math.min(top, Math.max(gutter, view.innerHeight - menuRect.height - gutter)));
  parts.openMenu.style.left = `${Math.round(left)}px`;
  parts.openMenu.style.top = `${Math.round(top)}px`;
  parts.openMenu.dataset.menubarSide = side;
  return { ...parts, positioned: true, left, top, side };
}

export function syncMenubarState(root) {
  const parts = partsFor(root);
  for (const menu of parts.menus) {
    submenuItems.sync(menu);
    menu.dataset.state = menu.hidden ? 'closed' : 'open';
  }
  syncRootItems(parts);
  const state = parts.openItem ? 'open' : 'closed';
  root.dataset.state = state;
  parts.bar.dataset.state = state;
  if (parts.openItem) positionMenubarSubmenu(root);
  return partsFor(root);
}

const focusRootItem = (root, item) => {
  const parts = partsFor(root);
  if (!item || !parts.items.includes(item)) fail('root focus target must be owned by the Menubar.');
  for (const candidate of parts.items) candidate.setAttribute('tabindex', candidate === item ? '0' : '-1');
  contextFor(root).lastRootId = item.id;
  item.focus({ preventScroll: true });
  return item;
};

const moveRootItem = (root, current, offset) => {
  const parts = partsFor(root);
  const index = parts.items.indexOf(current);
  const base = index < 0 ? 0 : index;
  return focusRootItem(root, parts.items[(base + offset + parts.items.length) % parts.items.length]);
};

const rootTypeahead = (root, current, key) => {
  const parts = partsFor(root);
  const context = contextFor(root);
  const view = root.ownerDocument.defaultView;
  if (context.typeaheadTimer !== null) view.clearTimeout(context.typeaheadTimer);
  const character = key.toLocaleLowerCase();
  context.typeahead += character;
  const findMatch = (needle) => {
    const start = Math.max(parts.items.indexOf(current), -1);
    for (let step = 1; step <= parts.items.length; step += 1) {
      const item = parts.items[(start + step) % parts.items.length];
      if (accessibleName(item).toLocaleLowerCase().startsWith(needle)) return item;
    }
    return null;
  };
  let match = findMatch(context.typeahead);
  if (!match && context.typeahead.length > 1) {
    context.typeahead = character;
    match = findMatch(context.typeahead);
  }
  context.typeaheadTimer = view.setTimeout(() => {
    context.typeahead = '';
    context.typeaheadTimer = null;
  }, 500);
  if (match) focusRootItem(root, match);
  return match;
};

const emitRootActivation = (root, item) => {
  const role = item.getAttribute('role');
  item.dispatchEvent(new root.ownerDocument.defaultView.CustomEvent('ns-menubar-activate', {
    bubbles: true,
    detail: { itemId: item.id || null, role, checked: isCheckable(item) ? item.getAttribute('aria-checked') === 'true' : null }
  }));
};

const closeAllSubmenus = (root, { returnFocus = false, focusItem = null } = {}) => {
  const parts = partsFor(root);
  const owner = focusItem ?? parts.openItem;
  for (const item of parts.items) if (item.hasAttribute('aria-expanded')) item.setAttribute('aria-expanded', 'false');
  for (const menu of parts.menus) menu.hidden = true;
  submenuItems.clear(root);
  const synced = syncMenubarState(root);
  if (returnFocus && owner?.isConnected) focusRootItem(root, owner);
  return synced;
};

export function setMenubarSubmenuOpen(root, rootItemId, open, options = {}) {
  if (typeof open !== 'boolean') throw new TypeError('core.menubar submenu open state must be boolean.');
  const parts = partsFor(root);
  const owner = parts.items.find((item) => item.id === rootItemId);
  if (!owner) throw new TypeError('core.menubar submenu owner id must reference a root menu item.');
  const menu = menuForItem(parts, owner);
  if (!menu) throw new TypeError('core.menubar submenu owner must control a first-level menu.');
  for (const item of parts.items) if (item.hasAttribute('aria-expanded')) item.setAttribute('aria-expanded', item === owner && open ? 'true' : 'false');
  for (const candidate of parts.menus) candidate.hidden = candidate !== menu || !open;
  submenuItems.clear(root);
  const synced = syncMenubarState(root);
  if (open) {
    const focus = options.focus ?? 'first';
    if (focus === 'first') submenuItems.focus(menu, synced.openMenu ? submenuItems.items(menu)[0] : null);
    else if (focus === 'last') {
      const items = submenuItems.items(menu);
      submenuItems.focus(menu, items[items.length - 1]);
    } else if (focus !== false) throw new TypeError('core.menubar submenu focus must be first, last, or false.');
  } else if (options.returnFocus === true) {
    focusRootItem(root, owner);
  }
  return partsFor(root);
}

const visualOffset = (parts, key) => {
  const rtl = parts.root.ownerDocument.defaultView.getComputedStyle(parts.bar).direction === 'rtl';
  if (key === 'ArrowRight') return rtl ? -1 : 1;
  if (key === 'ArrowLeft') return rtl ? 1 : -1;
  return 0;
};

const switchRootFromOpenContext = (root, owner, key) => {
  const parts = partsFor(root);
  const next = moveRootItem(root, owner, visualOffset(parts, key));
  closeAllSubmenus(root);
  const refreshed = partsFor(root);
  if (menuForItem(refreshed, next)) setMenubarSubmenuOpen(root, next.id, true, { focus: 'first' });
  return next;
};

const activateRootItem = (root, item) => {
  if (isDisabled(item)) return false;
  const parts = partsFor(root);
  const menu = menuForItem(parts, item);
  if (menu) {
    const open = item.getAttribute('aria-expanded') === 'true';
    if (open) closeAllSubmenus(root, { returnFocus: true, focusItem: item });
    else setMenubarSubmenuOpen(root, item.id, true, { focus: 'first' });
    return true;
  }
  const role = item.getAttribute('role');
  if (role === 'menuitemcheckbox') {
    item.setAttribute('aria-checked', item.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
  } else if (role === 'menuitemradio') {
    const group = item.dataset.menubarRadioGroup;
    for (const candidate of parts.items) {
      if (candidate.getAttribute('role') === 'menuitemradio' && candidate.dataset.menubarRadioGroup === group) {
        candidate.setAttribute('aria-checked', candidate === item ? 'true' : 'false');
      }
    }
  }
  closeAllSubmenus(root);
  syncMenubarState(root);
  emitRootActivation(root, item);
  focusRootItem(root, item);
  return true;
};

const activateSubmenuItem = (root, menu, item) => submenuItems.activate(root, menu, item, {
  onPlain: () => {
    const owner = ownerForMenu(partsFor(root), menu);
    closeAllSubmenus(root, { returnFocus: true, focusItem: owner });
  }
});

export function bindMenubar(root) {
  let parts = syncMenubarState(root);
  const context = contextFor(root);
  const initialTabStop = parts.items.find((item) => item.getAttribute('tabindex') === '0');
  context.lastRootId = initialTabStop?.id ?? null;

  const onBarPointerDown = (event) => {
    if (event.button !== 0) return;
    const current = partsFor(root);
    const item = rootItemFromTarget(current.bar, event.target);
    if (item) focusRootItem(root, item);
  };

  const onBarClick = (event) => {
    const current = partsFor(root);
    const item = rootItemFromTarget(current.bar, event.target);
    if (!item) return;
    activateRootItem(root, item);
  };

  const onBarKeyDown = (event) => {
    const current = partsFor(root);
    const item = rootItemFromTarget(current.bar, event.target);
    if (!item) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const hadOpen = Boolean(current.openItem);
      const next = moveRootItem(root, item, visualOffset(current, event.key));
      if (hadOpen) {
        closeAllSubmenus(root);
        const refreshed = partsFor(root);
        if (menuForItem(refreshed, next)) setMenubarSubmenuOpen(root, next.id, true, { focus: 'first' });
      }
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const next = focusRootItem(root, event.key === 'Home' ? current.items[0] : current.items[current.items.length - 1]);
      if (current.openItem) {
        closeAllSubmenus(root);
        const refreshed = partsFor(root);
        if (menuForItem(refreshed, next)) setMenubarSubmenuOpen(root, next.id, true, { focus: 'first' });
      }
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!menuForItem(current, item)) return;
      event.preventDefault();
      setMenubarSubmenuOpen(root, item.id, true, { focus: event.key === 'ArrowDown' ? 'first' : 'last' });
      return;
    }
    if (event.key === 'Escape') {
      if (!current.openItem) return;
      event.preventDefault();
      closeAllSubmenus(root, { returnFocus: true, focusItem: item });
      return;
    }
    if (event.key === 'Tab') {
      root.ownerDocument.defaultView.setTimeout(() => { if (partsFor(root).openItem) closeAllSubmenus(root); }, 0);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activateRootItem(root, item);
      return;
    }
    if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      const hadOpen = Boolean(current.openItem);
      const match = rootTypeahead(root, item, event.key);
      if (hadOpen && match) {
        closeAllSubmenus(root);
        const refreshed = partsFor(root);
        if (menuForItem(refreshed, match)) setMenubarSubmenuOpen(root, match.id, true, { focus: 'first' });
      }
    }
  };

  const menuHandlers = parts.menus.map((menu) => {
    const onPointerDown = (event) => {
      if (event.button !== 0) return;
      const item = event.target.closest?.(menuItemSelector);
      if (item && menu.contains(item)) submenuItems.focus(menu, item);
    };
    const onClick = (event) => {
      const item = event.target.closest?.(menuItemSelector);
      if (item && menu.contains(item)) activateSubmenuItem(root, menu, item);
    };
    const onKeyDown = (event) => {
      const item = event.target.closest?.(menuItemSelector);
      if (!item || !menu.contains(item)) return;
      if (event.key === 'ArrowDown') { event.preventDefault(); submenuItems.move(menu, item, 1); return; }
      if (event.key === 'ArrowUp') { event.preventDefault(); submenuItems.move(menu, item, -1); return; }
      if (event.key === 'Home') { event.preventDefault(); submenuItems.focus(menu, submenuItems.items(menu)[0]); return; }
      if (event.key === 'End') {
        event.preventDefault();
        const items = submenuItems.items(menu);
        submenuItems.focus(menu, items[items.length - 1]);
        return;
      }
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        const owner = ownerForMenu(partsFor(root), menu);
        if (owner) switchRootFromOpenContext(root, owner, event.key);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        const owner = ownerForMenu(partsFor(root), menu);
        closeAllSubmenus(root, { returnFocus: true, focusItem: owner });
        return;
      }
      if (event.key === 'Tab') {
        root.ownerDocument.defaultView.setTimeout(() => { if (partsFor(root).openItem) closeAllSubmenus(root); }, 0);
        return;
      }
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activateSubmenuItem(root, menu, item); return; }
      if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        submenuItems.typeahead(root, menu, item, event.key);
      }
    };
    menu.addEventListener('pointerdown', onPointerDown);
    menu.addEventListener('click', onClick);
    menu.addEventListener('keydown', onKeyDown);
    return { menu, onPointerDown, onClick, onKeyDown };
  });

  const onBarFocusIn = (event) => {
    const current = partsFor(root);
    const item = rootItemFromTarget(current.bar, event.target);
    if (!item) return;
    for (const candidate of current.items) candidate.setAttribute('tabindex', candidate === item ? '0' : '-1');
    contextFor(root).lastRootId = item.id;
  };

  const onDocumentPointerDown = (event) => {
    const current = partsFor(root);
    if (!current.openItem || current.root.contains(event.target)) return;
    closeAllSubmenus(root);
  };

  const onDocumentFocusIn = (event) => {
    const current = partsFor(root);
    if (!current.openItem || current.root.contains(event.target)) return;
    closeAllSubmenus(root);
  };

  const onViewportChange = () => {
    if (partsFor(root).openItem) positionMenubarSubmenu(root);
  };

  parts.bar.addEventListener('pointerdown', onBarPointerDown);
  parts.bar.addEventListener('click', onBarClick);
  parts.bar.addEventListener('keydown', onBarKeyDown);
  parts.bar.addEventListener('focusin', onBarFocusIn);
  root.ownerDocument.addEventListener('pointerdown', onDocumentPointerDown);
  root.ownerDocument.addEventListener('focusin', onDocumentFocusIn);
  const view = root.ownerDocument.defaultView;
  view.addEventListener('resize', onViewportChange);
  view.addEventListener('scroll', onViewportChange, true);

  return () => {
    clearRootTypeahead(root);
    submenuItems.destroy(root);
    parts = partsFor(root);
    parts.bar.removeEventListener('pointerdown', onBarPointerDown);
    parts.bar.removeEventListener('click', onBarClick);
    parts.bar.removeEventListener('keydown', onBarKeyDown);
    parts.bar.removeEventListener('focusin', onBarFocusIn);
    for (const handlers of menuHandlers) {
      handlers.menu.removeEventListener('pointerdown', handlers.onPointerDown);
      handlers.menu.removeEventListener('click', handlers.onClick);
      handlers.menu.removeEventListener('keydown', handlers.onKeyDown);
    }
    root.ownerDocument.removeEventListener('pointerdown', onDocumentPointerDown);
    root.ownerDocument.removeEventListener('focusin', onDocumentFocusIn);
    view.removeEventListener('resize', onViewportChange);
    view.removeEventListener('scroll', onViewportChange, true);
    if (parts.openItem) closeAllSubmenus(root);
    contexts.delete(root);
  };
}
