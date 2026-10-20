const contexts = new WeakMap();

export const menuItemSelector = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';

const accessibleName = (item) => {
  const explicit = item.getAttribute('aria-label')?.trim();
  if (explicit) return explicit;
  return (item.textContent || '').replace(/\s+/g, ' ').trim();
};

const isDisabled = (item) => item.getAttribute('aria-disabled') === 'true';
const isCheckable = (item) => ['menuitemcheckbox', 'menuitemradio'].includes(item.getAttribute('role'));

export function createMenuItemEngine({ owner, eventName, radioGroupDataKey }) {
  if (!owner || !eventName || !radioGroupDataKey) throw new TypeError('menu-item engine requires owner, eventName, and radioGroupDataKey.');
  const fail = (message) => { throw new Error(`[${owner}] ${message}`); };

  const contextFor = (root) => {
    let context = contexts.get(root);
    if (!context) {
      context = { typeahead: '', typeaheadTimer: null };
      contexts.set(root, context);
    }
    return context;
  };

  const items = (menu) => [...menu.querySelectorAll(menuItemSelector)];

  const validate = (menu) => {
    const owned = items(menu);
    if (!owned.length) fail('requires at least one menu item.');
    for (const item of owned) {
      if (!menu.contains(item)) fail('menu items must be owned by the menu surface.');
      if (item.getAttribute('tabindex') !== '-1') fail('menu items must remain tabindex="-1" and outside ordinary Tab order.');
      if (!accessibleName(item)) fail('every menu item requires an accessible name.');
      if (item.hasAttribute('aria-haspopup')) fail('nested submenu authority is not part of this first menu slice.');
      if (item.matches('a[href], input, select, textarea, summary, form') || item.querySelector('a[href], button, input, select, textarea, summary, form, [contenteditable="true"]')) {
        fail('menu items must not smuggle navigation, nested controls, editing, or form authority.');
      }
      const role = item.getAttribute('role');
      if (role === 'menuitem') {
        if (item.hasAttribute('aria-checked')) fail('plain menuitem must not claim aria-checked.');
      } else {
        if (!['true', 'false'].includes(item.getAttribute('aria-checked'))) fail('checkable menu items require aria-checked="true" or "false".');
        if (role === 'menuitemradio' && !item.dataset[radioGroupDataKey]) fail(`menuitemradio requires data-${radioGroupDataKey.replace(/[A-Z]/g, (letter) => '-' + letter.toLowerCase())}.`);
      }
    }
    return owned;
  };

  const sync = (menu) => {
    const owned = validate(menu);
    for (const item of owned) {
      if (isDisabled(item)) item.dataset.state = 'disabled';
      else if (isCheckable(item) && item.getAttribute('aria-checked') === 'true') item.dataset.state = 'checked';
      else item.dataset.state = 'rest';
    }
    return owned;
  };

  const focus = (menu, item) => {
    const owned = validate(menu);
    if (!item || !owned.includes(item)) fail('focus target must be a menu item owned by this menu.');
    item.focus({ preventScroll: true });
    return item;
  };

  const move = (menu, current, offset) => {
    const owned = validate(menu);
    const index = owned.indexOf(current);
    const base = index < 0 ? 0 : index;
    return focus(menu, owned[(base + offset + owned.length) % owned.length]);
  };

  const clear = (root) => {
    const context = contextFor(root);
    const view = root.ownerDocument.defaultView;
    if (context.typeaheadTimer !== null) view.clearTimeout(context.typeaheadTimer);
    context.typeaheadTimer = null;
    context.typeahead = '';
  };

  const typeahead = (root, menu, current, key) => {
    const owned = validate(menu);
    const context = contextFor(root);
    const view = root.ownerDocument.defaultView;
    if (context.typeaheadTimer !== null) view.clearTimeout(context.typeaheadTimer);
    const character = key.toLocaleLowerCase();
    context.typeahead += character;
    const findMatch = (needle) => {
      const start = Math.max(owned.indexOf(current), -1);
      for (let step = 1; step <= owned.length; step += 1) {
        const item = owned[(start + step) % owned.length];
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
    if (match) focus(menu, match);
    return match;
  };

  const emit = (root, item) => {
    const role = item.getAttribute('role');
    const detail = { itemId: item.id || null, role, checked: isCheckable(item) ? item.getAttribute('aria-checked') === 'true' : null };
    item.dispatchEvent(new root.ownerDocument.defaultView.CustomEvent(eventName, { bubbles: true, detail }));
  };

  const activate = (root, menu, item, { onPlain } = {}) => {
    const owned = validate(menu);
    if (!owned.includes(item)) fail('activation target must be a menu item owned by this menu.');
    if (isDisabled(item)) return false;
    const role = item.getAttribute('role');
    if (role === 'menuitemcheckbox') {
      item.setAttribute('aria-checked', item.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
      sync(menu);
      emit(root, item);
      focus(menu, item);
      return true;
    }
    if (role === 'menuitemradio') {
      const group = item.dataset[radioGroupDataKey];
      for (const candidate of owned) {
        if (candidate.getAttribute('role') === 'menuitemradio' && candidate.dataset[radioGroupDataKey] === group) {
          candidate.setAttribute('aria-checked', candidate === item ? 'true' : 'false');
        }
      }
      sync(menu);
      emit(root, item);
      focus(menu, item);
      return true;
    }
    emit(root, item);
    if (typeof onPlain === 'function') onPlain();
    return true;
  };

  const destroy = (root) => {
    clear(root);
    contexts.delete(root);
  };

  return Object.freeze({ items, validate, sync, focus, move, clear, typeahead, activate, destroy });
}
