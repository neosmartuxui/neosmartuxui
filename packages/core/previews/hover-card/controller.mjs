const requireTrigger = (root) => {
  const target = root.querySelector('#hover-card-trigger');
  if (!target) throw new TypeError('core.hover-card preview requires #hover-card-trigger');
  return target;
};

export function applyPreviewState({ root, state, helpers }) {
  const target = requireTrigger(root);
  if (state === 'open' || state === 'dismissed') {
    helpers.syncHoverCardState(target, state);
    return;
  }
  throw new Error(`core.hover-card preview cannot realize controller state ${state}`);
}
