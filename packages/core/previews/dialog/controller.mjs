const requireRoot = (root) => {
  const dialogRoot = root.querySelector('#dialog-demo');
  if (!dialogRoot) throw new TypeError('core.dialog preview requires #dialog-demo');
  return dialogRoot;
};
export function applyPreviewState({ root, state, helpers }) {
  const dialogRoot = requireRoot(root);
  if (state === 'open') { helpers.setDialogOpen(dialogRoot, true); return; }
  throw new Error(`core.dialog preview cannot realize controller state ${state}`);
}
