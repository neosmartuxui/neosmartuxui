const requireRoot = (root) => {
  const picker = root.querySelector('#date-picker-demo');
  if (!picker) throw new TypeError('core.date-picker preview requires #date-picker-demo');
  return picker;
};

export function applyPreviewState({ root, state, helpers }) {
  const picker = requireRoot(root);
  if (state === 'open') { helpers.setDatePickerOpen(picker, true); return; }
  if (state === 'selected') { helpers.setDatePickerValue(picker, { mode: 'single', date: '2026-09-16' }); return; }
  if (state === 'range-partial') { helpers.setDatePickerValue(picker, { mode: 'range', start: '2026-09-14', end: '' }); return; }
  if (state === 'range-selected') { helpers.setDatePickerValue(picker, { mode: 'range', start: '2026-09-14', end: '2026-09-18' }); return; }
  if (state === 'invalid') { helpers.setDatePickerInvalid(picker, true); return; }
  if (state === 'disabled') { helpers.setDatePickerValue(picker, { mode: 'single', date: '2026-09-16' }); helpers.setDatePickerDisabled(picker, true); return; }
  throw new Error(`core.date-picker preview cannot realize controller state ${state}`);
}
