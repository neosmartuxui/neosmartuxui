const requireRoot = (root) => {
  const drawerRoot = root.querySelector('#drawer-demo');
  if (!drawerRoot) throw new TypeError('core.drawer preview requires #drawer-demo');
  return drawerRoot;
};

export function applyPreviewState({ root, state, helpers }) {
  const drawerRoot = requireRoot(root);
  if (state === 'open') {
    helpers.setDrawerOpen(drawerRoot, true);
    return;
  }
  throw new Error(`core.drawer preview cannot realize controller state ${state}`);
}
