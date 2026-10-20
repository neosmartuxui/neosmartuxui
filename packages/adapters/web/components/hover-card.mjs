const controllers = new WeakMap();
const sides = new Set(['block-start', 'block-end', 'inline-start', 'inline-end']);
const aligns = new Set(['start', 'center', 'end']);
const fail = (message) => { throw new Error(`[core.hover-card] ${message}`); };

const interactiveSelector = 'button, a[href], input, select, textarea, summary, [contenteditable="true"], [tabindex]:not([tabindex="-1"])';

function detailedSurface(target, explicitSurface) {
  if (!target || target.nodeType !== 1) fail('target must be an Element.');
  if (explicitSurface) return explicitSurface;
  const id = target.getAttribute('aria-details');
  if (!id) fail('target must reference the HoverCard surface through aria-details.');
  const surface = target.ownerDocument.getElementById(id);
  if (!surface) fail('target aria-details must resolve to the HoverCard surface.');
  return surface;
}

function validateHoverCard(target, surface) {
  if (!surface || surface.nodeType !== 1) fail('surface must be an Element.');
  if (!surface.id) fail('HoverCard surface must have an id.');
  if (target.getAttribute('aria-details') !== surface.id) fail('target aria-details must reference the HoverCard surface.');
  if (surface.tabIndex >= 0) fail('HoverCard surface must not enter the tab order.');
  if (surface.matches(interactiveSelector) || surface.querySelector(interactiveSelector)) fail('HoverCard content must remain non-interactive.');
  if (surface.hasAttribute('aria-modal')) fail('HoverCard must not claim aria-modal.');
  if (surface.hasAttribute('aria-haspopup')) fail('HoverCard must not claim aria-haspopup.');
  if (surface.hasAttribute('aria-expanded')) fail('HoverCard surface must not claim user-controlled aria-expanded state.');
  if (['tooltip', 'dialog', 'alertdialog', 'menu', 'menubar', 'navigation'].includes(surface.getAttribute('role'))) {
    fail('HoverCard must not manufacture Tooltip, modal, menu, or navigation roles.');
  }
  const side = surface.dataset.hoverCardSide;
  const align = surface.dataset.hoverCardAlign;
  if (!sides.has(side)) fail('HoverCard requires logical data-hover-card-side.');
  if (!aligns.has(align)) fail('HoverCard requires data-hover-card-align start, center, or end.');
  return { target, surface, side, align };
}

const numericStyle = (styles, property) => {
  const value = Number.parseFloat(styles[property]);
  return Number.isFinite(value) ? value : 0;
};

export function positionHoverCard(target, explicitSurface) {
  const parts = validateHoverCard(target, detailedSurface(target, explicitSurface));
  if (parts.surface.dataset.state !== 'open') return { ...parts, open: false };

  const view = target.ownerDocument.defaultView;
  const anchor = target.getBoundingClientRect();
  const surfaceRect = parts.surface.getBoundingClientRect();
  const surfaceStyles = view.getComputedStyle(parts.surface);
  const targetStyles = view.getComputedStyle(target);
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
  const rtl = targetStyles.direction === 'rtl';
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

export function syncHoverCardState(target, state = 'closed', explicitSurface) {
  const parts = validateHoverCard(target, detailedSurface(target, explicitSurface));
  if (!['closed', 'open', 'dismissed'].includes(state)) fail(`unsupported state ${state}`);
  parts.surface.dataset.state = state;
  target.dataset.hoverCardState = state;
  if (state === 'open') positionHoverCard(target, parts.surface);
  return { ...parts, state };
}

export function setHoverCardPlacement(target, side, align = 'start', explicitSurface) {
  if (!sides.has(side)) throw new TypeError('core.hover-card side must be block-start, block-end, inline-start, or inline-end.');
  if (!aligns.has(align)) throw new TypeError('core.hover-card align must be start, center, or end.');
  const surface = detailedSurface(target, explicitSurface);
  surface.dataset.hoverCardSide = side;
  surface.dataset.hoverCardAlign = align;
  return syncHoverCardState(target, surface.dataset.state || 'closed', surface);
}

export function bindHoverCard(target, options = {}) {
  if (controllers.has(target)) return controllers.get(target);
  const surface = detailedSurface(target, options.surface);
  validateHoverCard(target, surface);

  const openDelay = options.openDelay ?? 320;
  const closeDelay = options.closeDelay ?? 100;
  if (!Number.isFinite(openDelay) || openDelay < 0) throw new TypeError('core.hover-card openDelay must be a non-negative number.');
  if (!Number.isFinite(closeDelay) || closeDelay < 0) throw new TypeError('core.hover-card closeDelay must be a non-negative number.');

  let targetHovered = false;
  let surfaceHovered = false;
  let targetFocused = target.ownerDocument.activeElement === target;
  let dismissed = false;
  let openTimer = null;
  let closeTimer = null;
  const view = target.ownerDocument.defaultView;

  const clearOpenTimer = () => {
    if (openTimer !== null) {
      view.clearTimeout(openTimer);
      openTimer = null;
    }
  };
  const clearCloseTimer = () => {
    if (closeTimer !== null) {
      view.clearTimeout(closeTimer);
      closeTimer = null;
    }
  };
  const sessionActive = () => targetHovered || surfaceHovered || targetFocused;
  const setState = (state) => syncHoverCardState(target, state, surface);

  const closeOrReset = () => {
    clearOpenTimer();
    clearCloseTimer();
    if (sessionActive()) {
      if (dismissed) setState('dismissed');
      return;
    }
    dismissed = false;
    setState('closed');
  };

  const scheduleOpen = () => {
    clearCloseTimer();
    clearOpenTimer();
    if (dismissed || !sessionActive()) return;
    openTimer = view.setTimeout(() => {
      openTimer = null;
      if (!dismissed && sessionActive()) setState('open');
    }, openDelay);
  };

  const scheduleClose = () => {
    clearOpenTimer();
    clearCloseTimer();
    closeTimer = view.setTimeout(() => {
      closeTimer = null;
      closeOrReset();
    }, closeDelay);
  };

  const onTargetPointerEnter = (event) => {
    if (event.pointerType === 'touch') return;
    targetHovered = true;
    scheduleOpen();
  };
  const onTargetPointerLeave = (event) => {
    if (event.pointerType === 'touch') return;
    targetHovered = false;
    scheduleClose();
  };
  const onSurfacePointerEnter = (event) => {
    if (event.pointerType === 'touch') return;
    surfaceHovered = true;
    clearCloseTimer();
    if (!dismissed) {
      clearOpenTimer();
      if (surface.dataset.state !== 'open') scheduleOpen();
    }
  };
  const onSurfacePointerLeave = (event) => {
    if (event.pointerType === 'touch') return;
    surfaceHovered = false;
    scheduleClose();
  };
  const onTargetFocus = () => {
    targetFocused = true;
    scheduleOpen();
  };
  const onTargetBlur = () => {
    targetFocused = false;
    scheduleClose();
  };
  const onDocumentKeyDown = (event) => {
    if (event.key !== 'Escape' || surface.dataset.state !== 'open') return;
    dismissed = true;
    clearOpenTimer();
    clearCloseTimer();
    setState('dismissed');
  };
  const onViewportChange = () => {
    if (surface.dataset.state === 'open') positionHoverCard(target, surface);
  };

  target.addEventListener('pointerenter', onTargetPointerEnter);
  target.addEventListener('pointerleave', onTargetPointerLeave);
  target.addEventListener('focus', onTargetFocus);
  target.addEventListener('blur', onTargetBlur);
  surface.addEventListener('pointerenter', onSurfacePointerEnter);
  surface.addEventListener('pointerleave', onSurfacePointerLeave);
  target.ownerDocument.addEventListener('keydown', onDocumentKeyDown);
  view.addEventListener('resize', onViewportChange);
  view.addEventListener('scroll', onViewportChange, true);

  if (targetFocused) scheduleOpen();
  else setState('closed');

  const controller = {
    target,
    surface,
    dismiss() {
      if (!sessionActive()) return setState('closed');
      dismissed = true;
      clearOpenTimer();
      clearCloseTimer();
      return setState('dismissed');
    },
    sync() {
      if (dismissed && sessionActive()) return setState('dismissed');
      if (!sessionActive()) {
        dismissed = false;
        return setState('closed');
      }
      return surface.dataset.state === 'open' ? positionHoverCard(target, surface) : scheduleOpen();
    },
    position() {
      return positionHoverCard(target, surface);
    },
    destroy() {
      clearOpenTimer();
      clearCloseTimer();
      target.removeEventListener('pointerenter', onTargetPointerEnter);
      target.removeEventListener('pointerleave', onTargetPointerLeave);
      target.removeEventListener('focus', onTargetFocus);
      target.removeEventListener('blur', onTargetBlur);
      surface.removeEventListener('pointerenter', onSurfacePointerEnter);
      surface.removeEventListener('pointerleave', onSurfacePointerLeave);
      target.ownerDocument.removeEventListener('keydown', onDocumentKeyDown);
      view.removeEventListener('resize', onViewportChange);
      view.removeEventListener('scroll', onViewportChange, true);
      controllers.delete(target);
      dismissed = false;
      setState('closed');
    }
  };

  controllers.set(target, controller);
  return controller;
}
