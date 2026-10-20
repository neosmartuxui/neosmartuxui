const controllers = new WeakMap();
const contexts = new WeakMap();
const fail = (message) => { throw new Error(`[core.alert-dialog] ${message}`); };

const contextFor = (root) => {
  let context = contexts.get(root);
  if (!context) {
    context = { invoker: null, pendingRestore: false, returnFocus: true };
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

const resolveNameAndDescription = (dialog) => {
  const ariaLabel = (dialog.getAttribute('aria-label') || '').trim();
  const labelledBy = (dialog.getAttribute('aria-labelledby') || '').trim();
  if (Boolean(ariaLabel) === Boolean(labelledBy)) {
    fail('alertdialog must have exactly one accessible-name source: aria-label or aria-labelledby.');
  }
  if (labelledBy) {
    for (const id of labelledBy.split(/\s+/)) {
      const label = dialog.ownerDocument.getElementById(id);
      if (!label || !label.textContent?.trim()) fail(`aria-labelledby must resolve to non-empty text: ${id}`);
    }
  }

  const describedBy = (dialog.getAttribute('aria-describedby') || '').trim();
  if (!describedBy) fail('alertdialog requires aria-describedby for the alert or prompt message.');
  for (const id of describedBy.split(/\s+/)) {
    const description = dialog.ownerDocument.getElementById(id);
    if (!description || !description.textContent?.trim()) fail(`aria-describedby must resolve to non-empty prompt text: ${id}`);
  }
};

const partsFor = (root) => {
  if (!root || root.nodeType !== 1) fail('root must be an Element.');
  const trigger = root.querySelector('[data-alert-dialog-trigger]');
  const dialog = root.querySelector('dialog.ns-alert-dialog');
  if (!trigger || trigger.tagName !== 'BUTTON' || trigger.type !== 'button') {
    fail('AlertDialog requires a real <button type="button"> trigger.');
  }
  if (!dialog || dialog.tagName !== 'DIALOG') fail('AlertDialog surface must be a native <dialog>.');
  if (dialog.getAttribute('role') !== 'alertdialog') fail('AlertDialog surface requires role="alertdialog".');
  if (!dialog.id || trigger.getAttribute('aria-controls') !== dialog.id) {
    fail('trigger aria-controls must reference the owned native alertdialog.');
  }
  if (trigger.getAttribute('aria-haspopup') !== 'dialog') fail('trigger requires aria-haspopup="dialog".');
  if (dialog.getAttribute('aria-modal') !== 'true') fail('native AlertDialog requires aria-modal="true".');
  if (dialog.hasAttribute('tabindex')) fail('native AlertDialog surface must not declare tabindex; focus belongs on a response control.');
  resolveNameAndDescription(dialog);

  const responses = [...dialog.querySelectorAll('[data-alert-dialog-response]')];
  if (!responses.length || responses.some((button) => button.tagName !== 'BUTTON' || button.type !== 'button')) {
    fail('AlertDialog requires at least one real <button type="button"> response control.');
  }
  const closeControls = responses.filter((button) => button.hasAttribute('data-alert-dialog-close'));
  if (!closeControls.length) fail('dismissible AlertDialog requires at least one response that closes the modal.');

  const destructive = responses.filter((button) => button.hasAttribute('data-alert-dialog-destructive'));
  const leastDestructive = responses.filter((button) => button.hasAttribute('data-alert-dialog-least-destructive'));
  const explicitInitial = responses.filter((button) => button.hasAttribute('data-alert-dialog-initial-focus'));

  if (leastDestructive.length > 1) fail('AlertDialog may declare at most one least-destructive response.');
  if (explicitInitial.length > 1) fail('AlertDialog may declare at most one explicit initial response.');
  if (leastDestructive.some((button) => button.hasAttribute('data-alert-dialog-destructive'))) {
    fail('least-destructive response must not also be destructive.');
  }
  if (destructive.length && leastDestructive.length !== 1) {
    fail('AlertDialog with an irreversible or destructive response requires exactly one least-destructive response.');
  }
  if (destructive.length && explicitInitial.length && explicitInitial[0] !== leastDestructive[0]) {
    fail('AlertDialog with a destructive response may not focus that response ahead of the least-destructive choice.');
  }

  return { root, trigger, dialog, responses, closeControls, destructive, leastDestructive, explicitInitial };
};

const initialFocusTarget = (parts) => {
  if (parts.destructive.length) return parts.leastDestructive[0];
  if (parts.explicitInitial.length) return parts.explicitInitial[0];
  if (parts.leastDestructive.length) return parts.leastDestructive[0];
  return parts.responses[0];
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

export function syncAlertDialogState(root) {
  const parts = partsFor(root);
  if (parts.dialog.open && !parts.dialog.matches(':modal')) {
    fail('AlertDialog must be opened modally with showModal(), never the non-modal open attribute.');
  }
  const state = parts.dialog.open ? 'open' : 'closed';
  parts.root.dataset.state = state;
  parts.dialog.dataset.state = state;
  return {
    state,
    open: parts.dialog.open,
    modal: parts.dialog.open && parts.dialog.matches(':modal'),
    initialResponse: initialFocusTarget(parts)
  };
}

export function setAlertDialogOpen(root, open, options = {}) {
  if (typeof open !== 'boolean') throw new TypeError('core.alert-dialog open state must be boolean.');
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
    syncAlertDialogState(root);
    if (options.focus !== false) initialFocusTarget(parts).focus({ preventScroll: true });
    return syncAlertDialogState(root);
  }

  context.returnFocus = options.returnFocus !== false;
  if (parts.dialog.open) parts.dialog.close();
  syncAlertDialogState(root);
  if (context.returnFocus) restoreInvoker(root, parts.trigger);
  else clearRestore(context);
  return syncAlertDialogState(root);
}

export function bindAlertDialog(root) {
  const parts = partsFor(root);
  controllers.get(root)?.();
  syncAlertDialogState(root);

  const onTriggerClick = () => setAlertDialogOpen(root, true, { invoker: parts.trigger });
  const onCloseClick = () => setAlertDialogOpen(root, false);
  const onCancel = () => {
    const context = contextFor(root);
    if (!context.pendingRestore) {
      context.invoker = parts.trigger;
      context.pendingRestore = true;
    }
    context.returnFocus = true;
  };
  const onClose = () => {
    syncAlertDialogState(root);
    const context = contextFor(root);
    if (context.returnFocus) restoreInvoker(root, parts.trigger);
    else clearRestore(context);
  };

  parts.trigger.addEventListener('click', onTriggerClick);
  for (const button of parts.closeControls) button.addEventListener('click', onCloseClick);
  parts.dialog.addEventListener('cancel', onCancel);
  parts.dialog.addEventListener('close', onClose);

  const dispose = () => {
    parts.trigger.removeEventListener('click', onTriggerClick);
    for (const button of parts.closeControls) button.removeEventListener('click', onCloseClick);
    parts.dialog.removeEventListener('cancel', onCancel);
    parts.dialog.removeEventListener('close', onClose);
    if (parts.dialog.open) parts.dialog.close();
    contexts.delete(root);
    if (controllers.get(root) === dispose) controllers.delete(root);
  };

  controllers.set(root, dispose);
  return dispose;
}
