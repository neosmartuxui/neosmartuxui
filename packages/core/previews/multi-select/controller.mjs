const requireRoot = (root) => {
  const field = root.querySelector('#multi-select-demo');
  if (!field) throw new TypeError('core.multi-select preview requires #multi-select-demo');
  return field;
};
export function applyPreviewState({ root, state, helpers }) {
  const field = requireRoot(root);
  if (state === 'open') { helpers.setMultiSelectOpen(field, true); return; }
  if (state === 'selected') { helpers.setMultiSelectSelection(field, ['react', 'vue']); return; }
  if (state === 'highlighted') { helpers.setMultiSelectOpen(field, true); helpers.setMultiSelectHighlighted(field, 'svelte'); return; }
  if (state === 'invalid') { helpers.setMultiSelectInvalid(field, true); return; }
  if (state === 'disabled') { helpers.setMultiSelectDisabled(field, true); return; }
  throw new Error(`core.multi-select preview cannot realize controller state ${state}`);
}
