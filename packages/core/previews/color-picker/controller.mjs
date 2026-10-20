const requireRoot = (root) => {
  const picker = root.querySelector('#color-picker-demo');
  if (!picker) throw new TypeError('core.color-picker preview requires #color-picker-demo');
  return picker;
};
export function applyPreviewState({ root, state, helpers }) {
  const picker = requireRoot(root);
  if (state === 'selected') { helpers.setColorPickerValue(picker, '#2e6e50'); return; }
  if (state === 'invalid') { helpers.setColorPickerInvalid(picker, true); return; }
  if (state === 'disabled') { helpers.setColorPickerDisabled(picker, true); return; }
  throw new Error(`core.color-picker preview cannot realize controller state ${state}`);
}
