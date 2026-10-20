const requireRoot = (root) => {
  const calendar = root.querySelector('#calendar-demo');
  if (!calendar) throw new TypeError('core.calendar preview requires #calendar-demo');
  return calendar;
};

export function applyPreviewState({ root, state, helpers }) {
  const calendar = requireRoot(root);
  if (state === 'selected') {
    helpers.setCalendarSelection(calendar, { mode: 'single', date: '2026-09-16' });
    return;
  }
  if (state === 'range-start') {
    helpers.setCalendarSelection(calendar, { mode: 'range', start: '2026-09-14', end: '' });
    return;
  }
  if (state === 'range-middle' || state === 'range-end') {
    helpers.setCalendarSelection(calendar, { mode: 'range', start: '2026-09-14', end: '2026-09-18' });
    return;
  }
  if (state === 'disabled') {
    helpers.setCalendarDisabled(calendar, true);
    return;
  }
  throw new Error(`core.calendar preview cannot realize controller state ${state}`);
}
