const requireRoot = (root) => {
  const picker = root.querySelector('#time-picker-demo');
  if (!picker) throw new TypeError('core.time-picker preview requires #time-picker-demo');
  return picker;
};
export function applyPreviewState({ root, state, helpers }) {
  const picker = requireRoot(root);
  if (state === 'filled') { helpers.setTimePickerValue(picker, '10:30'); return; }
  if (state === 'invalid') { helpers.setTimePickerValue(picker, '10:30'); helpers.setTimePickerInvalid(picker, true); return; }
  if (state === 'read-only') { helpers.setTimePickerValue(picker, '10:30'); helpers.setTimePickerReadOnly(picker, true); return; }
  if (state === 'disabled') { helpers.setTimePickerValue(picker, '10:30'); helpers.setTimePickerDisabled(picker, true); return; }
  throw new Error(`core.time-picker preview cannot realize controller state ${state}`);
}
