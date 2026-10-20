const controllers = new WeakMap();
const contexts = new WeakMap();
const fail = (message) => { throw new Error(`[core.dialog] ${message}`); };
const focusableSelector = ['button:not([disabled])','a[href]','input:not([disabled])','select:not([disabled])','textarea:not([disabled])','[tabindex]:not([tabindex="-1"])'].join(',');
const contextFor = (root) => { let context = contexts.get(root); if (!context) { context = { invoker: null, pendingRestore: false, returnFocus: true }; contexts.set(root, context); } return context; };
const validFocusTarget = (element) => Boolean(element?.isConnected && !element.hasAttribute?.('disabled') && element.getAttribute?.('aria-disabled') !== 'true' && !element.closest?.('[inert]'));
const resolveLabel = (dialog) => {
  const ariaLabel = (dialog.getAttribute('aria-label') || '').trim();
  const labelledBy = (dialog.getAttribute('aria-labelledby') || '').trim();
  if (Boolean(ariaLabel) === Boolean(labelledBy)) fail('dialog must have exactly one accessible-name source: aria-label or aria-labelledby.');
  if (labelledBy) for (const id of labelledBy.split(/\s+/)) { const label = dialog.ownerDocument.getElementById(id); if (!label || !label.textContent?.trim()) fail(`aria-labelledby must resolve to non-empty text: ${id}`); }
  const describedBy = (dialog.getAttribute('aria-describedby') || '').trim();
  if (describedBy) for (const id of describedBy.split(/\s+/)) if (!dialog.ownerDocument.getElementById(id)) fail(`aria-describedby must resolve: ${id}`);
};
const partsFor = (root) => {
  if (!root || root.nodeType !== 1) fail('root must be an Element.');
  const trigger = root.querySelector('[data-dialog-trigger]');
  const dialog = root.querySelector('dialog.ns-dialog');
  if (!trigger || trigger.tagName !== 'BUTTON' || trigger.type !== 'button') fail('Dialog requires a real <button type="button"> trigger.');
  if (!dialog || dialog.tagName !== 'DIALOG') fail('Dialog surface must be a native <dialog>.');
  if (!dialog.id || trigger.getAttribute('aria-controls') !== dialog.id) fail('trigger aria-controls must reference the owned native dialog.');
  if (trigger.getAttribute('aria-haspopup') !== 'dialog') fail('trigger requires aria-haspopup="dialog".');
  if (dialog.getAttribute('aria-modal') !== 'true') fail('native modal dialog requires aria-modal="true".');
  if (dialog.tabIndex !== -1) fail('dialog surface must use tabindex="-1" for deterministic fallback focus.');
  resolveLabel(dialog);
  const closeControls = [...dialog.querySelectorAll('[data-dialog-close]')];
  if (!closeControls.length || closeControls.some((button) => button.tagName !== 'BUTTON' || button.type !== 'button')) fail('Dialog requires at least one real <button type="button"> close control.');
  return { root, trigger, dialog, closeControls };
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
  const target = validFocusTarget(context.invoker) ? context.invoker : (validFocusTarget(fallbackTrigger) ? fallbackTrigger : null);
  clearRestore(context);
  target?.focus({ preventScroll: true });
};
export function syncDialogState(root) {
  const parts = partsFor(root);
  if (parts.dialog.open && !parts.dialog.matches(':modal')) fail('Dialog must be opened modally with showModal(), never the non-modal open attribute.');
  const state = parts.dialog.open ? 'open' : 'closed';
  parts.root.dataset.state = state; parts.dialog.dataset.state = state;
  return { state, open: parts.dialog.open, modal: parts.dialog.open && parts.dialog.matches(':modal') };
}
export function setDialogOpen(root, open, options = {}) {
  if (typeof open !== 'boolean') throw new TypeError('core.dialog open state must be boolean.');
  const parts = partsFor(root), context = contextFor(root);
  if (open) {
    if (!parts.dialog.open) {
      const invoker = options.invoker ?? parts.trigger;
      context.invoker = validFocusTarget(invoker) ? invoker : parts.trigger;
      context.pendingRestore = true;
      context.returnFocus = true;
      parts.dialog.showModal();
    }
    syncDialogState(root);
    if (options.focus !== false) initialFocusTarget(parts.dialog).focus({ preventScroll: true });
    return syncDialogState(root);
  }
  context.returnFocus = options.returnFocus !== false;
  if (parts.dialog.open) parts.dialog.close();
  syncDialogState(root);
  if (context.returnFocus) restoreInvoker(root, parts.trigger);
  else clearRestore(context);
  return syncDialogState(root);
}
export function bindDialog(root) {
  const parts = partsFor(root); controllers.get(root)?.(); syncDialogState(root);
  const onTriggerClick = () => setDialogOpen(root, true, { invoker: parts.trigger });
  const onCloseClick = () => setDialogOpen(root, false);
  const onCancel = () => {
    const context = contextFor(root);
    if (!context.pendingRestore) {
      context.invoker = parts.trigger;
      context.pendingRestore = true;
    }
    context.returnFocus = true;
  };
  const onClose = () => {
    syncDialogState(root);
    const context = contextFor(root);
    if (context.returnFocus) restoreInvoker(root, parts.trigger);
    else clearRestore(context);
  };
  parts.trigger.addEventListener('click', onTriggerClick);
  for (const button of parts.closeControls) button.addEventListener('click', onCloseClick);
  parts.dialog.addEventListener('cancel', onCancel); parts.dialog.addEventListener('close', onClose);
  const dispose = () => {
    parts.trigger.removeEventListener('click', onTriggerClick);
    for (const button of parts.closeControls) button.removeEventListener('click', onCloseClick);
    parts.dialog.removeEventListener('cancel', onCancel); parts.dialog.removeEventListener('close', onClose);
    if (parts.dialog.open) parts.dialog.close();
    contexts.delete(root); if (controllers.get(root) === dispose) controllers.delete(root);
  };
  controllers.set(root, dispose); return dispose;
}
