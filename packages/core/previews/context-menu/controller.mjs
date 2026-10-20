const requireRoot = (root) => {
  const contextRoot = root.querySelector('#context-menu-demo');
  if (!contextRoot) throw new TypeError('core.context-menu preview requires #context-menu-demo');
  return contextRoot;
};

export function applyPreviewState({ root, state, helpers }) {
  const contextRoot = requireRoot(root);
  if (state === 'focus-visible') {
    helpers.setContextMenuOpen(contextRoot, true, { focus: 'first', anchor: { kind: 'target' } });
    return;
  }
  throw new Error(`core.context-menu preview cannot realize controller state ${state}`);
}
