import {
  bindCalendar,
  setCalendarActiveDate,
  setCalendarDisabled,
  setCalendarSelection,
  setCalendarVisibleMonth
} from './calendar.mjs';

const controllers = new WeakMap();
const isoPattern = /^\d{4}-\d{2}-\d{2}$/;

const parseIso = (value) => {
  if (typeof value !== 'string' || !isoPattern.test(value)) throw new TypeError(`core.date-picker requires ISO calendar dates; received ${value}`);
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new RangeError(`core.date-picker invalid date: ${value}`);
  }
  return date;
};

const assertDatePicker = (root) => {
  if (!root || !root.classList?.contains('ns-date-picker')) throw new TypeError('core.date-picker web adapter requires an .ns-date-picker root.');
  const start = root.querySelector('[data-date-picker-start]');
  const end = root.querySelector('[data-date-picker-end]');
  const endField = root.querySelector('[data-date-picker-end-field]');
  const trigger = root.querySelector('[data-date-picker-trigger]');
  const popup = root.querySelector('[data-date-picker-popup]');
  const calendar = root.querySelector('.ns-calendar');
  const error = root.querySelector('[data-date-picker-error]');
  const primaryLabel = root.querySelector('[data-date-picker-primary-label]');
  if (!start || start.tagName !== 'INPUT' || start.type !== 'text') throw new TypeError('core.date-picker requires a real text input for the primary ISO date.');
  if (!end || end.tagName !== 'INPUT' || end.type !== 'text') throw new TypeError('core.date-picker requires a real text input for the range end date.');
  if (!endField) throw new TypeError('core.date-picker requires an owned range-end field.');
  if (!trigger || trigger.tagName !== 'BUTTON' || trigger.type !== 'button') throw new TypeError('core.date-picker requires a real <button type="button"> disclosure trigger.');
  if (!popup || !root.contains(popup)) throw new TypeError('core.date-picker requires an owned popup surface.');
  if (trigger.getAttribute('aria-controls') !== popup.id) throw new TypeError('core.date-picker trigger aria-controls must resolve to its owned popup.');
  if (popup.getAttribute('role') !== 'dialog' || popup.getAttribute('aria-modal') !== 'false') throw new TypeError('core.date-picker popup must be an explicit non-modal dialog.');
  if (!calendar || !popup.contains(calendar)) throw new TypeError('core.date-picker must compose one owned core.calendar surface.');
  if (!['single','range'].includes(root.dataset.mode)) throw new TypeError('core.date-picker mode must be single or range.');
  return { root, start, end, endField, trigger, popup, calendar, error, primaryLabel };
};

const partsFor = (root) => assertDatePicker(root);
const isValidIso = (value) => {
  if (!value) return false;
  try { parseIso(value); return true; } catch { return false; }
};

const setInvalidPresentation = (parts, invalid) => {
  parts.root.dataset.invalid = invalid ? 'true' : 'false';
  for (const input of [parts.start, parts.end]) {
    if (invalid) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }
  if (parts.error) parts.error.hidden = !invalid;
};

const syncSelectionMetadata = (parts) => {
  const mode = parts.root.dataset.mode;
  const start = parts.start.value.trim();
  const end = parts.end.value.trim();
  let selectionState = 'empty';
  let selectedValue = '';
  if (mode === 'single') {
    if (start && isValidIso(start)) {
      selectionState = 'selected';
      selectedValue = start;
    }
  } else if (start && isValidIso(start)) {
    selectionState = end && isValidIso(end) ? 'range-selected' : 'range-partial';
    selectedValue = end && isValidIso(end) ? `${start}/${end}` : start;
  }
  parts.root.dataset.selectionState = selectionState;
  parts.root.dataset.selectedValue = selectedValue;
  return { selectionState, selectedValue };
};

const syncPresentation = (parts) => {
  const disabled = parts.root.dataset.disabled === 'true';
  const invalid = parts.root.dataset.invalid === 'true';
  const open = parts.root.dataset.open === 'true' && !disabled;
  parts.popup.hidden = !open;
  parts.trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  parts.start.disabled = disabled;
  parts.end.disabled = disabled;
  parts.trigger.disabled = disabled;
  parts.endField.hidden = parts.root.dataset.mode !== 'range';
  if (parts.primaryLabel) parts.primaryLabel.textContent = parts.root.dataset.mode === 'range' ? 'Start date' : 'Date';
  const calendarDisabled = disabled ? 'true' : 'false';
  if (parts.calendar.dataset.disabled !== calendarDisabled) setCalendarDisabled(parts.calendar, disabled);
  const { selectionState, selectedValue } = syncSelectionMetadata(parts);
  parts.root.dataset.state = disabled ? 'disabled' : invalid ? 'invalid' : open ? 'open' : selectionState === 'empty' ? 'closed' : selectionState;
  return { disabled, invalid, open, selectionState, selectedValue };
};

const applyInputsToCalendar = (parts) => {
  const mode = parts.root.dataset.mode;
  const start = parts.start.value.trim();
  const end = parts.end.value.trim();
  if (mode === 'single') {
    setCalendarSelection(parts.calendar, { mode: 'single', date: start && isValidIso(start) ? start : '' });
    if (start && isValidIso(start)) setCalendarVisibleMonth(parts.calendar, start.slice(0, 7));
    return;
  }
  const validStart = start && isValidIso(start) ? start : '';
  const validEnd = end && isValidIso(end) ? end : '';
  if (validStart) setCalendarVisibleMonth(parts.calendar, validStart.slice(0, 7));
  setCalendarSelection(parts.calendar, { mode: 'range', start: validStart, end: validStart ? validEnd : '' });
};

const commitInputs = (parts) => {
  const mode = parts.root.dataset.mode;
  const start = parts.start.value.trim();
  const end = parts.end.value.trim();
  let invalid = false;
  if (mode === 'single') {
    invalid = Boolean(start) && !isValidIso(start);
  } else {
    invalid = Boolean(start) && !isValidIso(start)
      || Boolean(end) && !isValidIso(end)
      || Boolean(end) && !start
      || Boolean(start) && Boolean(end) && isValidIso(start) && isValidIso(end) && end < start;
  }
  setInvalidPresentation(parts, invalid);
  if (!invalid) applyInputsToCalendar(parts);
  return syncDatePickerState(parts.root);
};

const syncFromCalendar = (parts) => {
  if (parts.root.dataset.mode === 'single') {
    parts.start.value = parts.calendar.dataset.selectedDate || '';
    parts.end.value = '';
  } else {
    parts.start.value = parts.calendar.dataset.rangeStart || '';
    parts.end.value = parts.calendar.dataset.rangeEnd || '';
  }
  setInvalidPresentation(parts, false);
  return syncDatePickerState(parts.root);
};

export function syncDatePickerState(root) {
  const parts = partsFor(root);
  if (!['true','false'].includes(parts.root.dataset.open)) parts.root.dataset.open = parts.popup.hidden ? 'false' : 'true';
  if (!['true','false'].includes(parts.root.dataset.invalid)) parts.root.dataset.invalid = 'false';
  if (!['true','false'].includes(parts.root.dataset.disabled)) parts.root.dataset.disabled = 'false';
  return syncPresentation(parts);
}

export function setDatePickerOpen(root, open, { focusCalendar = false } = {}) {
  if (typeof open !== 'boolean') throw new TypeError('core.date-picker open state must be boolean.');
  const parts = partsFor(root);
  if (open && parts.root.dataset.disabled === 'true') throw new TypeError('core.date-picker cannot open while disabled.');
  parts.root.dataset.open = open ? 'true' : 'false';
  const state = syncDatePickerState(root);
  if (open && focusCalendar) {
    const preferred = parts.root.dataset.mode === 'single'
      ? (parts.calendar.dataset.selectedDate || parts.calendar.dataset.today)
      : (parts.calendar.dataset.rangeStart || parts.calendar.dataset.today);
    if (preferred) setCalendarActiveDate(parts.calendar, preferred, { focus: true });
  }
  return state;
}

export function setDatePickerMode(root, mode) {
  if (!['single','range'].includes(mode)) throw new TypeError('core.date-picker mode must be single or range.');
  const parts = partsFor(root);
  parts.root.dataset.mode = mode;
  if (mode === 'single') parts.end.value = '';
  setInvalidPresentation(parts, false);
  applyInputsToCalendar(parts);
  return syncDatePickerState(root);
}

export function setDatePickerValue(root, selection) {
  if (!selection || typeof selection !== 'object') throw new TypeError('core.date-picker selection must be an object.');
  const parts = partsFor(root);
  if (selection.mode === 'single') {
    const date = selection.date || '';
    if (date) parseIso(date);
    parts.root.dataset.mode = 'single';
    parts.start.value = date;
    parts.end.value = '';
  } else if (selection.mode === 'range') {
    const start = selection.start || '';
    const end = selection.end || '';
    if (start) parseIso(start);
    if (end) parseIso(end);
    if (end && !start) throw new TypeError('core.date-picker range end requires a start.');
    if (start && end && end < start) throw new RangeError('core.date-picker range end must not precede range start.');
    parts.root.dataset.mode = 'range';
    parts.start.value = start;
    parts.end.value = end;
  } else {
    throw new TypeError('core.date-picker selection mode must be single or range.');
  }
  setInvalidPresentation(parts, false);
  applyInputsToCalendar(parts);
  return syncDatePickerState(root);
}

export function setDatePickerInvalid(root, invalid) {
  if (typeof invalid !== 'boolean') throw new TypeError('core.date-picker invalid state must be boolean.');
  const parts = partsFor(root);
  setInvalidPresentation(parts, invalid);
  return syncDatePickerState(root);
}

export function setDatePickerDisabled(root, disabled) {
  if (typeof disabled !== 'boolean') throw new TypeError('core.date-picker disabled state must be boolean.');
  const parts = partsFor(root);
  parts.root.dataset.disabled = disabled ? 'true' : 'false';
  if (disabled) parts.root.dataset.open = 'false';
  return syncDatePickerState(root);
}

export function bindDatePicker(root) {
  const parts = partsFor(root);
  controllers.get(root)?.();
  const disposeCalendar = bindCalendar(parts.calendar);
  commitInputs(parts);

  const open = () => setDatePickerOpen(root, true, { focusCalendar: true });
  const close = ({ returnFocus = false } = {}) => {
    setDatePickerOpen(root, false);
    if (returnFocus) parts.trigger.focus({ preventScroll: true });
  };

  const onTriggerClick = () => {
    if (parts.root.dataset.open === 'true') close();
    else open();
  };
  const onInputChange = () => commitInputs(parts);
  const onInputKeyDown = (event) => {
    if (event.key !== 'Enter') return;
    const state = commitInputs(parts);
    if (!state.invalid && state.selectionState !== 'range-partial') close();
  };
  const onRootKeyDown = (event) => {
    if (event.key !== 'Escape' || parts.root.dataset.open !== 'true') return;
    event.preventDefault();
    close({ returnFocus: true });
  };
  const onCalendarCommit = (event) => {
    const day = event.target.closest?.('.ns-calendar__day');
    const activation = event.type === 'click' || event.key === 'Enter' || event.key === ' ';
    if (!day || !activation || day.getAttribute('aria-disabled') === 'true' || day.disabled) return;
    queueMicrotask(() => {
      const state = syncFromCalendar(parts);
      if (state.selectionState === 'selected' || state.selectionState === 'range-selected') close({ returnFocus: true });
    });
  };
  const onFocusOut = (event) => {
    const next = event.relatedTarget;
    if (!next || !root.contains(next)) close();
  };

  parts.trigger.addEventListener('click', onTriggerClick);
  parts.start.addEventListener('change', onInputChange);
  parts.end.addEventListener('change', onInputChange);
  parts.start.addEventListener('keydown', onInputKeyDown);
  parts.end.addEventListener('keydown', onInputKeyDown);
  parts.calendar.addEventListener('click', onCalendarCommit);
  parts.calendar.addEventListener('keydown', onCalendarCommit);
  root.addEventListener('keydown', onRootKeyDown);
  root.addEventListener('focusout', onFocusOut);

  const dispose = () => {
    parts.trigger.removeEventListener('click', onTriggerClick);
    parts.start.removeEventListener('change', onInputChange);
    parts.end.removeEventListener('change', onInputChange);
    parts.start.removeEventListener('keydown', onInputKeyDown);
    parts.end.removeEventListener('keydown', onInputKeyDown);
    parts.calendar.removeEventListener('click', onCalendarCommit);
    parts.calendar.removeEventListener('keydown', onCalendarCommit);
    root.removeEventListener('keydown', onRootKeyDown);
    root.removeEventListener('focusout', onFocusOut);
    disposeCalendar();
    if (controllers.get(root) === dispose) controllers.delete(root);
  };
  controllers.set(root, dispose);
  return dispose;
}
