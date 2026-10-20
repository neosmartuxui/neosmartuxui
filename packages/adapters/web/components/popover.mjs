const controllers = new WeakMap();
const contexts = new WeakMap();
const sides = new Set(['block-start', 'block-end', 'inline-start', 'inline-end']);
const aligns = new Set(['start', 'center', 'end']);
const fail = (message) => { throw new Error(`[core.popover] ${message}`); };

const contextFor = (root) => {
  let context = contexts.get(root);
  if (!context) {
    context = { invoker: null, restoreOnClose: false };
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

const partsFor = (root) => {
  if (!root || root.nodeType !== 1) fail('root must be an Element.');
  const trigger = root.querySelector('[data-popover-trigger]');
  const surface = root.querySelector('.ns-popover[popover]');
  if (!trigger || trigger.tagName !== 'BUTTON' || trigger.type !== 'button') {
    fail('Popover requires a real <button type="button"> trigger.');
  }
  if (!surface) fail('Popover requires a [popover] surface.');
  if (surface.getAttribute('popover') !== 'auto') fail('Popover surface must use popover="auto".');
  if (!surface.id) fail('Popover surface must have an id.');
  if (trigger.getAttribute('popovertarget') !== surface.id) fail('trigger popovertarget must reference the Popover surface.');
  if (trigger.getAttribute('aria-controls') !== surface.id) fail('trigger aria-controls must reference the Popover surface.');
  if (!['true', 'false'].includes(trigger.getAttribute('aria-expanded'))) fail('trigger requires machine-readable aria-expanded state.');
  if (surface.hasAttribute('aria-modal')) fail('generic Popover must not claim aria-modal.');
  if (['dialog', 'alertdialog', 'menu', 'menubar', 'tooltip'].includes(surface.getAttribute('role'))) {
    fail('generic Popover surface must not manufacture Dialog, menu, or Tooltip semantics.');
  }
  const side = surface.dataset.popoverSide;
  const align = surface.dataset.popoverAlign;
  if (!sides.has(side)) fail('Popover requires logical data-popover-side.');
  if (!aligns.has(align)) fail('Popover requires data-popover-align start, center, or end.');
  const closeControls = [...surface.querySelectorAll('[data-popover-close]')];
  if (closeControls.some((button) => button.tagName !== 'BUTTON' || button.type !== 'button')) {
    fail('Popover close controls must be real <button type="button"> elements.');
  }
  return { root, trigger, surface, closeControls, side, align };
};

const numericStyle = (styles, property) => {
  const value = Number.parseFloat(styles[property]);
  return Number.isFinite(value) ? value : 0;
};

export function positionPopover(root) {
  const parts = partsFor(root);
  if (!parts.surface.matches(':popover-open')) return { ...parts, open: false };
  const view = parts.surface.ownerDocument.defaultView;
  const anchor = parts.trigger.getBoundingClientRect();
  const surfaceRect = parts.surface.getBoundingClientRect();
  const surfaceStyles = view.getComputedStyle(parts.surface);
  const triggerStyles = view.getComputedStyle(parts.trigger);
  const inlineGutter = Math.max(
    numericStyle(surfaceStyles, 'paddingInlineStart'),
    numericStyle(surfaceStyles, 'borderInlineStartWidth'),
    1
  );
  const blockGutter = Math.max(
    numericStyle(surfaceStyles, 'paddingBlockStart'),
    numericStyle(surfaceStyles, 'borderBlockStartWidth'),
    1
  );
  const rtl = triggerStyles.direction === 'rtl';
  let left;
  let top;

  if (parts.side === 'block-start' || parts.side === 'block-end') {
    top = parts.side === 'block-start'
      ? anchor.top - blockGutter - surfaceRect.height
      : anchor.bottom + blockGutter;
    if (parts.align === 'center') left = anchor.left + (anchor.width - surfaceRect.width) / 2;
    else if (parts.align === 'start') left = rtl ? anchor.right - surfaceRect.width : anchor.left;
    else left = rtl ? anchor.left : anchor.right - surfaceRect.width;
  } else {
    const inlineStartLeft = rtl
      ? anchor.right + inlineGutter
      : anchor.left - inlineGutter - surfaceRect.width;
    const inlineEndLeft = rtl
      ? anchor.left - inlineGutter - surfaceRect.width
      : anchor.right + inlineGutter;
    left = parts.side === 'inline-start' ? inlineStartLeft : inlineEndLeft;
    if (parts.align === 'center') top = anchor.top + (anchor.height - surfaceRect.height) / 2;
    else if (parts.align === 'start') top = anchor.top;
    else top = anchor.bottom - surfaceRect.height;
  }

  const maxLeft = Math.max(inlineGutter, view.innerWidth - surfaceRect.width - inlineGutter);
  const maxTop = Math.max(blockGutter, view.innerHeight - surfaceRect.height - blockGutter);
  left = Math.min(Math.max(left, inlineGutter), maxLeft);
  top = Math.min(Math.max(top, blockGutter), maxTop);

  parts.surface.style.left = `${left}px`;
  parts.surface.style.top = `${top}px`;
  parts.surface.style.right = 'auto';
  parts.surface.style.bottom = 'auto';
  return { ...parts, open: true, left, top };
}

const restoreInvoker = (root, fallback) => {
  const context = contextFor(root);
  if (!context.restoreOnClose) return;
  const active = root.ownerDocument.activeElement;
  const target = validFocusTarget(context.invoker) ? context.invoker : (validFocusTarget(fallback) ? fallback : null);
  const browserFallbackReplacedExplicitInvoker = active === fallback && target && target !== fallback;
  const activeIsLost = !validFocusTarget(active)
    || active === root.ownerDocument.body
    || root.querySelector('.ns-popover')?.contains(active)
    || browserFallbackReplacedExplicitInvoker;
  context.restoreOnClose = false;
  if (!activeIsLost) return;
  target?.focus({ preventScroll: true });
};

export function syncPopoverState(root) {
  const parts = partsFor(root);
  const open = parts.surface.matches(':popover-open');
  const state = open ? 'open' : 'closed';
  parts.root.dataset.state = state;
  parts.root.dataset.popoverSide = parts.side;
  parts.root.dataset.popoverAlign = parts.align;
  parts.surface.dataset.state = state;
  parts.trigger.setAttribute('aria-expanded', String(open));
  if (open) positionPopover(root);
  return { state, open, side: parts.side, align: parts.align };
}

export function setPopoverPlacement(root, side, align = 'start') {
  if (!sides.has(side)) throw new TypeError('core.popover side must be block-start, block-end, inline-start, or inline-end.');
  if (!aligns.has(align)) throw new TypeError('core.popover align must be start, center, or end.');
  const parts = partsFor(root);
  parts.surface.dataset.popoverSide = side;
  parts.surface.dataset.popoverAlign = align;
  parts.root.dataset.popoverSide = side;
  parts.root.dataset.popoverAlign = align;
  return syncPopoverState(root);
}

export function setPopoverOpen(root, open, options = {}) {
  if (typeof open !== 'boolean') throw new TypeError('core.popover open state must be boolean.');
  const parts = partsFor(root);
  const context = contextFor(root);
  if (open) {
    context.invoker = validFocusTarget(options.invoker) ? options.invoker : parts.trigger;
    context.restoreOnClose = false;
    if (!parts.surface.matches(':popover-open')) parts.surface.showPopover();
    return syncPopoverState(root);
  }

  context.restoreOnClose = options.returnFocus !== false && parts.surface.contains(parts.surface.ownerDocument.activeElement);
  if (parts.surface.matches(':popover-open')) parts.surface.hidePopover();
  const result = syncPopoverState(root);
  if (context.restoreOnClose) restoreInvoker(root, parts.trigger);
  return result;
}

export function bindPopover(root) {
  const parts = partsFor(root);
  controllers.get(root)?.();
  const context = contextFor(root);
  syncPopoverState(root);

  const onBeforeToggle = (event) => {
    if (event.newState === 'open') {
      context.invoker = validFocusTarget(event.source)
        ? event.source
        : (validFocusTarget(context.invoker) ? context.invoker : parts.trigger);
      context.restoreOnClose = false;
      return;
    }
    context.restoreOnClose = parts.surface.contains(parts.surface.ownerDocument.activeElement);
  };
  const onToggle = () => {
    const result = syncPopoverState(root);
    if (!result.open && context.restoreOnClose) restoreInvoker(root, parts.trigger);
  };
  const onCloseClick = () => setPopoverOpen(root, false);
  const onViewportChange = () => {
    if (parts.surface.matches(':popover-open')) positionPopover(root);
  };

  parts.surface.addEventListener('beforetoggle', onBeforeToggle);
  parts.surface.addEventListener('toggle', onToggle);
  for (const button of parts.closeControls) button.addEventListener('click', onCloseClick);
  parts.surface.ownerDocument.defaultView.addEventListener('resize', onViewportChange);
  parts.surface.ownerDocument.defaultView.addEventListener('scroll', onViewportChange, true);

  const dispose = () => {
    parts.surface.removeEventListener('beforetoggle', onBeforeToggle);
    parts.surface.removeEventListener('toggle', onToggle);
    for (const button of parts.closeControls) button.removeEventListener('click', onCloseClick);
    parts.surface.ownerDocument.defaultView.removeEventListener('resize', onViewportChange);
    parts.surface.ownerDocument.defaultView.removeEventListener('scroll', onViewportChange, true);
    if (parts.surface.matches(':popover-open')) parts.surface.hidePopover();
    contexts.delete(root);
    if (controllers.get(root) === dispose) controllers.delete(root);
  };

  controllers.set(root, dispose);
  return dispose;
}
