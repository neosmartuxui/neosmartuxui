const controllers = new WeakMap();
const fail = (message) => { throw new Error(`[core.navigation-menu] ${message}`); };

const hasAccessibleName = (root) => {
  const label = root.getAttribute('aria-label')?.trim();
  if (label) return true;
  const labelledBy = root.getAttribute('aria-labelledby')?.trim();
  if (!labelledBy) return false;
  return labelledBy.split(/\s+/).every((id) => Boolean(root.ownerDocument.getElementById(id)));
};

const assertAnchor = (anchor) => {
  if (anchor.tagName !== 'A' || !anchor.hasAttribute('href') || !anchor.getAttribute('href')?.trim()) {
    fail('destination items must be real <a href> links.');
  }
  if (anchor.hasAttribute('role')) fail('destination links must retain native anchor semantics.');
  if (anchor.hasAttribute('aria-disabled')) fail('NavigationMenu must not manufacture disabled anchors.');
  if (anchor.hasAttribute('tabindex')) fail('NavigationMenu links must remain in native document Tab order without authored tabindex.');
  const current = anchor.getAttribute('aria-current');
  if (current !== null && current !== 'page') fail('current-route links may use only aria-current="page".');
};

const partsFor = (root) => {
  if (!(root instanceof Element) || root.tagName !== 'NAV' || !root.classList.contains('ns-navigation-menu')) {
    fail('web adapter requires a native <nav class="ns-navigation-menu"> root.');
  }
  if (!hasAccessibleName(root)) fail('NavigationMenu requires an explicit accessible name.');
  if (root.querySelector('[role="menu"],[role="menubar"],[role="menuitem"],[role="menuitemcheckbox"],[role="menuitemradio"]')) {
    fail('NavigationMenu must not use ARIA menu or menuitem widget roles.');
  }
  if (root.querySelector('[aria-haspopup]')) fail('NavigationMenu disclosure must not manufacture aria-haspopup menu authority.');

  const list = root.querySelector('[data-navigation-menu-list]');
  if (!list || !['UL', 'OL'].includes(list.tagName) || list.closest('.ns-navigation-menu') !== root) {
    fail('NavigationMenu requires one owned semantic root list.');
  }

  const anchors = [...root.querySelectorAll('a')];
  if (!anchors.length) fail('NavigationMenu requires at least one destination link.');
  for (const anchor of anchors) assertAnchor(anchor);
  const current = anchors.filter((anchor) => anchor.hasAttribute('aria-current'));
  if (current.length > 1) fail('NavigationMenu permits at most one aria-current="page" destination.');

  const triggers = [...root.querySelectorAll('[data-navigation-menu-trigger]')];
  const allButtons = [...root.querySelectorAll('button')];
  if (allButtons.some((button) => !triggers.includes(button))) fail('NavigationMenu buttons must be authored disclosure controls.');
  const panels = [];
  for (const trigger of triggers) {
    if (trigger.tagName !== 'BUTTON' || trigger.type !== 'button') fail('NavigationMenu disclosure controls must be real <button type="button"> controls.');
    if (!trigger.id) fail('NavigationMenu disclosure controls require stable ids.');
    if (trigger.hasAttribute('role') || trigger.hasAttribute('tabindex') || trigger.hasAttribute('aria-disabled') || trigger.disabled) {
      fail('NavigationMenu disclosure buttons must retain enabled native button semantics and native Tab order.');
    }
    if (trigger.closest('[data-navigation-menu-panel]')) fail('nested NavigationMenu disclosure is outside this first slice.');
    if (!['true', 'false'].includes(trigger.getAttribute('aria-expanded'))) fail('NavigationMenu disclosure controls require boolean aria-expanded.');
    const id = trigger.getAttribute('aria-controls');
    if (!id) fail('NavigationMenu disclosure controls require aria-controls.');
    const panel = root.ownerDocument.getElementById(id);
    if (!panel || !root.contains(panel) || !panel.hasAttribute('data-navigation-menu-panel')) {
      fail(`NavigationMenu could not resolve controlled panel ${id}.`);
    }
    if (panel.getAttribute('aria-labelledby') !== trigger.id) fail(`NavigationMenu panel ${id} must aria-labelledby its disclosure button.`);
    if (panel.querySelector('[data-navigation-menu-trigger],button,input,select,textarea,[contenteditable="true"]')) {
      fail('first-level NavigationMenu panels may contain destination hierarchy, not nested controls or disclosure.');
    }
    const nestedList = panel.querySelector('ul,ol');
    if (!nestedList || nestedList.closest('[data-navigation-menu-panel]') !== panel) {
      fail(`NavigationMenu panel ${id} requires an owned semantic destination list.`);
    }
    panels.push(panel);
  }
  if (new Set(panels).size !== panels.length) fail('each NavigationMenu disclosure button must own a distinct first-level panel.');
  if (triggers.filter((trigger) => trigger.getAttribute('aria-expanded') === 'true').length > 1) {
    fail('NavigationMenu permits at most one initially open first-level disclosure.');
  }
  return { root, list, anchors, current: current[0] ?? null, triggers, panels };
};

const panelFor = (parts, trigger) => {
  const id = trigger.getAttribute('aria-controls');
  const panel = parts.panels.find((candidate) => candidate.id === id);
  if (!panel) fail(`NavigationMenu could not resolve controlled panel ${id}.`);
  return panel;
};

export function syncNavigationMenuState(root) {
  const parts = partsFor(root);
  let openTrigger = null;
  for (const trigger of parts.triggers) {
    const open = trigger.getAttribute('aria-expanded') === 'true';
    const panel = panelFor(parts, trigger);
    panel.hidden = !open;
    trigger.dataset.state = open ? 'open' : 'closed';
    panel.dataset.state = open ? 'open' : 'closed';
    if (open) openTrigger = trigger;
  }
  root.dataset.state = openTrigger ? 'open' : 'closed';
  return { state: root.dataset.state, open: Boolean(openTrigger), openTrigger, current: parts.current };
}

export function setNavigationMenuOpen(root, trigger, open, { returnFocus = false } = {}) {
  if (typeof open !== 'boolean') throw new TypeError('core.navigation-menu open state must be boolean.');
  const parts = partsFor(root);
  if (!parts.triggers.includes(trigger)) fail('disclosure changes require a trigger owned by the NavigationMenu root.');

  if (open) {
    for (const candidate of parts.triggers) {
      candidate.setAttribute('aria-expanded', candidate === trigger ? 'true' : 'false');
    }
  } else {
    trigger.setAttribute('aria-expanded', 'false');
  }

  const result = syncNavigationMenuState(root);
  if (!open && returnFocus && trigger.isConnected) trigger.focus({ preventScroll: true });
  return result;
}

export function bindNavigationMenu(root) {
  const initial = partsFor(root);
  controllers.get(root)?.();
  syncNavigationMenuState(root);

  const clickHandlers = new Map();
  for (const trigger of initial.triggers) {
    const onClick = () => setNavigationMenuOpen(root, trigger, trigger.getAttribute('aria-expanded') !== 'true');
    trigger.addEventListener('click', onClick);
    clickHandlers.set(trigger, onClick);
  }

  const closeAll = () => {
    const parts = partsFor(root);
    for (const trigger of parts.triggers) trigger.setAttribute('aria-expanded', 'false');
    syncNavigationMenuState(root);
  };

  const onKeyDown = (event) => {
    if (event.key !== 'Escape') return;
    const parts = partsFor(root);
    const openTrigger = parts.triggers.find((trigger) => trigger.getAttribute('aria-expanded') === 'true');
    if (!openTrigger) return;
    const panel = panelFor(parts, openTrigger);
    if (event.target !== openTrigger && !panel.contains(event.target)) return;
    event.preventDefault();
    setNavigationMenuOpen(root, openTrigger, false, { returnFocus: true });
  };

  const onFocusOut = (event) => {
    const next = event.relatedTarget;
    if (!next || !root.contains(next)) closeAll();
  };

  const onDocumentPointerDown = (event) => {
    if (!root.contains(event.target)) closeAll();
  };

  root.addEventListener('keydown', onKeyDown);
  root.addEventListener('focusout', onFocusOut);
  root.ownerDocument.addEventListener('pointerdown', onDocumentPointerDown, true);

  const destroy = () => {
    for (const [trigger, handler] of clickHandlers) trigger.removeEventListener('click', handler);
    root.removeEventListener('keydown', onKeyDown);
    root.removeEventListener('focusout', onFocusOut);
    root.ownerDocument.removeEventListener('pointerdown', onDocumentPointerDown, true);
    closeAll();
    if (controllers.get(root) === destroy) controllers.delete(root);
  };
  controllers.set(root, destroy);
  return destroy;
}
