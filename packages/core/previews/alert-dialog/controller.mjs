const requireRoot = (root) => {
  const alertDialogRoot = root.querySelector('#alert-dialog-demo');
  if (!alertDialogRoot) throw new TypeError('core.alert-dialog preview requires #alert-dialog-demo');
  return alertDialogRoot;
};

export function applyPreviewState({ root, state, helpers }) {
  const alertDialogRoot = requireRoot(root);
  if (state === 'open') {
    helpers.setAlertDialogOpen(alertDialogRoot, true);
    return;
  }
  throw new Error(`core.alert-dialog preview cannot realize controller state ${state}`);
}
