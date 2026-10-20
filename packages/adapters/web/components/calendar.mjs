const controllers = new WeakMap();

const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
const monthPattern = /^\d{4}-\d{2}$/;

const parseIso = (value) => {
  if (typeof value !== 'string' || !isoPattern.test(value)) throw new TypeError(`core.calendar requires ISO calendar dates; received ${value}`);
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new RangeError(`core.calendar invalid date: ${value}`);
  }
  return date;
};

const toIso = (date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const shiftDays = (iso, amount) => {
  const date = parseIso(iso);
  date.setUTCDate(date.getUTCDate() + amount);
  return toIso(date);
};

const shiftMonth = (monthValue, amount) => {
  if (typeof monthValue !== 'string' || !monthPattern.test(monthValue)) throw new TypeError('core.calendar visible month must use YYYY-MM.');
  const [year, month] = monthValue.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 + amount, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
};

const assertCalendar = (root) => {
  if (!root || !root.classList?.contains('ns-calendar')) throw new TypeError('core.calendar adapter requires an .ns-calendar root.');
  const grid = root.querySelector('[data-calendar-grid]');
  const monthLabel = root.querySelector('[data-calendar-month-label]');
  const previous = root.querySelector('[data-calendar-previous]');
  const next = root.querySelector('[data-calendar-next]');
  if (!grid || grid.getAttribute('role') !== 'grid') throw new TypeError('core.calendar requires one role="grid" date surface.');
  if (!monthLabel) throw new TypeError('core.calendar requires a visible month label.');
  if (!previous || previous.tagName !== 'BUTTON' || previous.type !== 'button') throw new TypeError('core.calendar requires a real previous-month button.');
  if (!next || next.tagName !== 'BUTTON' || next.type !== 'button') throw new TypeError('core.calendar requires a real next-month button.');
  if (!monthPattern.test(root.dataset.visibleMonth || '')) throw new TypeError('core.calendar requires data-visible-month="YYYY-MM".');
  if (!['single','range'].includes(root.dataset.selectionMode)) throw new TypeError('core.calendar selection mode must be single or range.');
  parseIso(root.dataset.today);
  return { root, grid, monthLabel, previous, next };
};

const unavailableSet = (root) => new Set((root.dataset.unavailableDates || '').split(/\s+/).filter(Boolean));
const selectedRange = (root) => ({
  start: root.dataset.rangeStart || '',
  end: root.dataset.rangeEnd || ''
});

const monthLabelText = (root) => {
  const [year, month] = root.dataset.visibleMonth.split('-').map(Number);
  const locale = root.dataset.locale || 'en-US';
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, month - 1, 1)));
};

const dateLabel = (root, iso, state) => {
  const locale = root.dataset.locale || 'en-US';
  const base = new Intl.DateTimeFormat(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
    .format(parseIso(iso));
  const suffix = [];
  if (state.current) suffix.push('today');
  if (state.unavailable) suffix.push('unavailable');
  if (state.rangePosition === 'start') suffix.push('range start');
  else if (state.rangePosition === 'middle') suffix.push('in selected range');
  else if (state.rangePosition === 'end') suffix.push('range end');
  else if (state.selected) suffix.push('selected');
  return suffix.length ? `${base}, ${suffix.join(', ')}` : base;
};

const stateFor = (root, iso) => {
  const unavailable = unavailableSet(root).has(iso);
  const current = iso === root.dataset.today;
  const mode = root.dataset.selectionMode;
  let selected = false;
  let rangePosition = '';
  if (mode === 'single') {
    selected = root.dataset.selectedDate === iso;
  } else {
    const { start, end } = selectedRange(root);
    if (start && iso === start) rangePosition = 'start';
    if (end && iso === end) rangePosition = 'end';
    if (start && end && iso > start && iso < end) rangePosition = 'middle';
    selected = Boolean(rangePosition);
  }
  return { unavailable, current, selected, rangePosition };
};

const dayButton = (root, iso, inMonth) => {
  const state = stateFor(root, iso);
  const cell = root.ownerDocument.createElement('div');
  cell.className = 'ns-calendar__cell';
  cell.setAttribute('role', 'gridcell');
  cell.setAttribute('aria-selected', state.selected ? 'true' : 'false');

  const button = root.ownerDocument.createElement('button');
  button.type = 'button';
  button.className = 'ns-calendar__day';
  button.dataset.date = iso;
  button.dataset.outsideMonth = inMonth ? 'false' : 'true';
  button.dataset.state = state.unavailable ? 'unavailable'
    : state.rangePosition ? `range-${state.rangePosition}`
    : state.selected ? 'selected'
    : state.current ? 'current'
    : 'rest';
  button.dataset.rangePosition = state.rangePosition || 'none';
  button.textContent = String(parseIso(iso).getUTCDate());
  button.tabIndex = -1;
  button.setAttribute('aria-label', dateLabel(root, iso, state));
  if (state.current) button.setAttribute('aria-current', 'date');
  if (state.unavailable) button.setAttribute('aria-disabled', 'true');
  if (root.dataset.disabled === 'true') button.disabled = true;
  cell.append(button);
  return cell;
};

const daysForVisibleGrid = (root) => {
  const [year, month] = root.dataset.visibleMonth.split('-').map(Number);
  const first = new Date(Date.UTC(year, month - 1, 1));
  const start = new Date(first);
  start.setUTCDate(first.getUTCDate() - first.getUTCDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return toIso(date);
  });
};

const focusableButtons = (parts) => [...parts.grid.querySelectorAll('.ns-calendar__day')]
  .filter((button) => !button.disabled);

const syncRovingFocus = (parts, preferredIso = '') => {
  const available = focusableButtons(parts);
  for (const button of parts.grid.querySelectorAll('.ns-calendar__day')) button.tabIndex = -1;
  if (!available.length) {
    parts.root.dataset.activeDate = '';
    return null;
  }
  let active = available.find((button) => button.dataset.date === preferredIso);
  if (!active) active = available.find((button) => button.dataset.date === parts.root.dataset.activeDate);
  if (!active && parts.root.dataset.selectionMode === 'single' && parts.root.dataset.selectedDate) {
    active = available.find((button) => button.dataset.date === parts.root.dataset.selectedDate);
  }
  if (!active) active = available.find((button) => button.dataset.date === parts.root.dataset.today);
  if (!active) {
    const visibleMonth = parts.root.dataset.visibleMonth;
    active = available.find((button) => button.dataset.date.startsWith(visibleMonth)) || available[0];
  }
  active.tabIndex = 0;
  parts.root.dataset.activeDate = active.dataset.date;
  return active;
};

const renderCalendar = (parts, preferredIso = '') => {
  parts.monthLabel.textContent = monthLabelText(parts.root);
  parts.grid.replaceChildren();
  const [visibleYear, visibleMonth] = parts.root.dataset.visibleMonth.split('-').map(Number);
  const days = daysForVisibleGrid(parts.root);
  for (let rowIndex = 0; rowIndex < 6; rowIndex += 1) {
    const row = parts.root.ownerDocument.createElement('div');
    row.className = 'ns-calendar__row';
    row.setAttribute('role', 'row');
    for (const iso of days.slice(rowIndex * 7, rowIndex * 7 + 7)) {
      const date = parseIso(iso);
      const inMonth = date.getUTCFullYear() === visibleYear && date.getUTCMonth() + 1 === visibleMonth;
      const cell = dayButton(parts.root, iso, inMonth);
      const button = cell.querySelector('.ns-calendar__day');
      button.id = `${parts.grid.id}-day-${iso}`;
      row.append(cell);
    }
    parts.grid.append(row);
  }
  syncRovingFocus(parts, preferredIso);
};

const syncSelectionMetadata = (root) => {
  if (root.dataset.selectionMode === 'single') {
    const selected = root.dataset.selectedDate || '';
    root.dataset.selectionState = selected ? 'selected' : 'empty';
    root.dataset.selectedValue = selected;
    root.dataset.rangeStart = '';
    root.dataset.rangeEnd = '';
    return;
  }
  root.dataset.selectedDate = '';
  const { start, end } = selectedRange(root);
  root.dataset.selectionState = start && end ? 'range-selected' : start ? 'range-partial' : 'empty';
  root.dataset.selectedValue = start && end ? `${start}/${end}` : start;
};

const partsFor = (root) => assertCalendar(root);

export function syncCalendarState(root) {
  const parts = partsFor(root);
  syncSelectionMetadata(root);
  root.dataset.state = root.dataset.disabled === 'true' ? 'disabled' : 'rest';
  parts.grid.setAttribute('aria-disabled', root.dataset.disabled === 'true' ? 'true' : 'false');
  parts.previous.disabled = root.dataset.disabled === 'true';
  parts.next.disabled = root.dataset.disabled === 'true';
  renderCalendar(parts, root.dataset.activeDate || '');
  return {
    state: root.dataset.state,
    selectionMode: root.dataset.selectionMode,
    selectionState: root.dataset.selectionState,
    activeDate: root.dataset.activeDate,
    visibleMonth: root.dataset.visibleMonth
  };
}

export function setCalendarVisibleMonth(root, monthValue) {
  if (typeof monthValue !== 'string' || !monthPattern.test(monthValue)) throw new TypeError('core.calendar visible month must use YYYY-MM.');
  root.dataset.visibleMonth = monthValue;
  root.dataset.activeDate = '';
  return syncCalendarState(root);
}

export function setCalendarActiveDate(root, iso, { focus = false } = {}) {
  parseIso(iso);
  const parts = partsFor(root);
  const target = parts.grid.querySelector(`.ns-calendar__day[data-date="${iso}"]`);
  if (!target || target.disabled) {
    throw new RangeError(`core.calendar active date must be a rendered, focusable date: ${iso}`);
  }
  syncRovingFocus(parts, iso);
  if (focus) target.focus({ preventScroll: true });
  return {
    state: root.dataset.state,
    selectionMode: root.dataset.selectionMode,
    selectionState: root.dataset.selectionState,
    activeDate: root.dataset.activeDate,
    visibleMonth: root.dataset.visibleMonth
  };
}

export function setCalendarSelection(root, selection) {
  if (!selection || typeof selection !== 'object') throw new TypeError('core.calendar selection must be an object.');
  if (selection.mode === 'single') {
    if (selection.date !== null && selection.date !== '' && typeof selection.date !== 'string') throw new TypeError('core.calendar single date must be an ISO string or null.');
    if (selection.date) parseIso(selection.date);
    root.dataset.selectionMode = 'single';
    root.dataset.selectedDate = selection.date || '';
    root.dataset.rangeStart = '';
    root.dataset.rangeEnd = '';
  } else if (selection.mode === 'range') {
    if (selection.start) parseIso(selection.start);
    if (selection.end) parseIso(selection.end);
    if (selection.end && !selection.start) throw new TypeError('core.calendar range end requires a start.');
    if (selection.start && selection.end && selection.end < selection.start) throw new RangeError('core.calendar range end must not precede range start.');
    root.dataset.selectionMode = 'range';
    root.dataset.selectedDate = '';
    root.dataset.rangeStart = selection.start || '';
    root.dataset.rangeEnd = selection.end || '';
  } else {
    throw new TypeError('core.calendar selection mode must be single or range.');
  }
  return syncCalendarState(root);
}

export function setCalendarUnavailableDates(root, dates) {
  if (!Array.isArray(dates) || dates.some((date) => typeof date !== 'string')) throw new TypeError('core.calendar unavailable dates must be an array of ISO strings.');
  const unique = [...new Set(dates)];
  for (const date of unique) parseIso(date);
  root.dataset.unavailableDates = unique.join(' ');
  return syncCalendarState(root);
}

export function setCalendarDisabled(root, disabled) {
  if (typeof disabled !== 'boolean') throw new TypeError('core.calendar disabled state must be boolean.');
  root.dataset.disabled = disabled ? 'true' : 'false';
  return syncCalendarState(root);
}

const commitDate = (root, iso) => {
  if (unavailableSet(root).has(iso) || root.dataset.disabled === 'true') return;
  if (root.dataset.selectionMode === 'single') {
    setCalendarSelection(root, { mode: 'single', date: iso });
    return;
  }
  const { start, end } = selectedRange(root);
  if (!start || end) {
    setCalendarSelection(root, { mode: 'range', start: iso, end: '' });
    return;
  }
  if (iso < start) setCalendarSelection(root, { mode: 'range', start: iso, end: start });
  else setCalendarSelection(root, { mode: 'range', start, end: iso });
};

export function bindCalendar(root) {
  const parts = partsFor(root);
  controllers.get(root)?.();
  syncCalendarState(root);

  const focusDate = (iso) => {
    const target = parts.grid.querySelector(`.ns-calendar__day[data-date="${iso}"]`);
    if (!target || target.disabled) return false;
    syncRovingFocus(parts, iso);
    target.focus({ preventScroll: true });
    return true;
  };

  const moveByDays = (amount) => {
    const active = root.dataset.activeDate;
    if (!active) return;
    let candidate = shiftDays(active, amount);
    for (let attempts = 0; attempts < 42; attempts += 1) {
      if (focusDate(candidate)) return;
      candidate = shiftDays(candidate, Math.sign(amount) || 1);
    }
  };

  const onGridKeyDown = (event) => {
    const active = root.dataset.activeDate;
    if (!active || root.dataset.disabled === 'true') return;
    const direction = getComputedStyle(root).direction;
    if (event.key === 'ArrowRight') { event.preventDefault(); moveByDays(direction === 'rtl' ? -1 : 1); return; }
    if (event.key === 'ArrowLeft') { event.preventDefault(); moveByDays(direction === 'rtl' ? 1 : -1); return; }
    if (event.key === 'ArrowDown') { event.preventDefault(); moveByDays(7); return; }
    if (event.key === 'ArrowUp') { event.preventDefault(); moveByDays(-7); return; }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const weekday = parseIso(active).getUTCDay();
      const delta = event.key === 'Home' ? -weekday : 6 - weekday;
      moveByDays(delta);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      commitDate(root, active);
      const target = parts.grid.querySelector(`.ns-calendar__day[data-date="${active}"]`);
      target?.focus({ preventScroll: true });
    }
  };

  const onGridClick = (event) => {
    const button = event.target.closest('.ns-calendar__day');
    if (!button || !parts.grid.contains(button) || button.getAttribute('aria-disabled') === 'true' || button.disabled) return;
    root.dataset.activeDate = button.dataset.date;
    commitDate(root, button.dataset.date);
    const refreshed = parts.grid.querySelector(`.ns-calendar__day[data-date="${button.dataset.date}"]`);
    refreshed?.focus({ preventScroll: true });
  };

  const changeMonth = (amount) => {
    if (root.dataset.disabled === 'true') return;
    root.dataset.visibleMonth = shiftMonth(root.dataset.visibleMonth, amount);
    root.dataset.activeDate = '';
    syncCalendarState(root);
    const active = parts.grid.querySelector('.ns-calendar__day[tabindex="0"]');
    active?.focus({ preventScroll: true });
  };

  const onPrevious = () => changeMonth(-1);
  const onNext = () => changeMonth(1);
  parts.grid.addEventListener('keydown', onGridKeyDown);
  parts.grid.addEventListener('click', onGridClick);
  parts.previous.addEventListener('click', onPrevious);
  parts.next.addEventListener('click', onNext);

  const dispose = () => {
    parts.grid.removeEventListener('keydown', onGridKeyDown);
    parts.grid.removeEventListener('click', onGridClick);
    parts.previous.removeEventListener('click', onPrevious);
    parts.next.removeEventListener('click', onNext);
    if (controllers.get(root) === dispose) controllers.delete(root);
  };
  controllers.set(root, dispose);
  return dispose;
}
