const requireRoot = (root) => {
  const popoverRoot = root.querySelector('#popover-demo');
  if (!popoverRoot) throw new TypeError('core.popover preview requires #popover-demo');
  return popoverRoot;
};

export function applyPreviewState({ root, state, helpers }) {
  const popoverRoot = requireRoot(root);
  if (state === 'open') {
    helpers.setPopoverOpen(popoverRoot, true);
    return;
  }
  throw new Error(`core.popover preview cannot realize controller state ${state}`);
}
