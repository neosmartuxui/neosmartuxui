const controllers = new WeakMap();

const optionValue = (option) => option.dataset.value ?? option.textContent?.trim() ?? '';
const isDisabledOption = (option) => option.getAttribute('aria-disabled') === 'true';

const assertMultiSelect = (root) => {
  if (!root || !root.classList?.contains('ns-multi-select')) {
    throw new TypeError('core.multi-select web adapter requires an .ns-multi-select root.');
  }
  const trigger = root.querySelector('.ns-multi-select__trigger');
  if (!trigger || trigger.tagName !== 'BUTTON' || trigger.type !== 'button') {
    throw new TypeError('core.multi-select requires a real <button type="button"> disclosure trigger.');
  }
  const listId = trigger.getAttribute('aria-controls');
  if (!listId) throw new TypeError('core.multi-select trigger requires aria-controls.');
  const list = root.ownerDocument.getElementById(listId);
  if (!list || !root.contains(list) || list.getAttribute('role') !== 'listbox') {
    throw new TypeError('core.multi-select aria-controls must resolve to an owned role="listbox".');
  }
  if (list.getAttribute('aria-multiselectable') !== 'true') {
    throw new TypeError('core.multi-select listbox requires aria-multiselectable="true".');
  }
  if (list.tabIndex !== -1) {
    throw new TypeError('core.multi-select listbox must use tabindex="-1" so disclosure, not Tab, owns entry.');
  }
  const popup = list.closest('.ns-multi-select__popup');
  if (!popup || !root.contains(popup)) throw new TypeError('core.multi-select listbox requires an owned popup surface.');
  const options = [...list.querySelectorAll('[role="option"]')];
  if (!options.length) throw new TypeError('core.multi-select requires at least one role="option".');
  const seen = new Set();
  for (const option of options) {
    const value = optionValue(option);
    if (!option.id || !value) throw new TypeError('core.multi-select options require stable ids and data-value.');
    if (seen.has(value)) throw new TypeError('core.multi-select option values must be unique.');
    seen.add(value);
    if (!['true','false'].includes(option.getAttribute('aria-selected'))) {
      throw new TypeError('core.multi-select options require boolean aria-selected state.');
    }
  }
  return {
    trigger,
    list,
    popup,
    options,
    summary: root.querySelector('[data-multi-select-summary]')
  };
};

const enabledOptions = ({ options }) => options.filter((option) => !isDisabledOption(option));
const selectedOptions = ({ options }) => options.filter((option) => option.getAttribute('aria-selected') === 'true');

const clearHighlight = (parts) => {
  parts.list.removeAttribute('aria-activedescendant');
  parts.root.dataset.highlightState = 'none';
  parts.root.dataset.highlightedValue = '';
  for (const option of parts.options) option.dataset.highlighted = 'false';
};

const setHighlightedOption = (parts, option) => {
  clearHighlight(parts);
  if (!option) return null;
  if (!parts.list.contains(option) || isDisabledOption(option)) {
    throw new TypeError('core.multi-select highlight requires an enabled owned option.');
  }
  option.dataset.highlighted = 'true';
  parts.list.setAttribute('aria-activedescendant', option.id);
  parts.root.dataset.highlightState = 'highlighted';
  parts.root.dataset.highlightedValue = optionValue(option);
  option.scrollIntoView({ block: 'nearest' });
  return option;
};

const syncSelectionMetadata = (parts) => {
  const selected = selectedOptions(parts);
  const values = selected.map(optionValue);
  parts.root.dataset.selectionState = values.length ? 'selected' : 'none-selected';
  parts.root.dataset.selectedCount = String(values.length);
  parts.root.dataset.selectedValues = values.join(' ');
  if (parts.summary) {
    parts.summary.textContent = values.length
      ? `${values.length} selected: ${selected.map((option) => option.textContent?.trim() || optionValue(option)).join(', ')}`
      : 'Choose frameworks';
  }
  return values;
};

const syncPresentationState = (parts) => {
  const disabled = parts.trigger.disabled || parts.list.getAttribute('aria-disabled') === 'true';
  const invalid = parts.list.getAttribute('aria-invalid') === 'true';
  const expanded = parts.trigger.getAttribute('aria-expanded') === 'true' && !disabled;
  parts.popup.hidden = !expanded;
  parts.trigger.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  parts.root.dataset.invalid = invalid ? 'true' : 'false';
  parts.root.dataset.disabled = disabled ? 'true' : 'false';
  parts.root.dataset.state = disabled ? 'disabled' : invalid ? 'invalid' : expanded ? 'open' : 'closed';
  if (!expanded) clearHighlight(parts);
  return { expanded, invalid, disabled };
};

const partsFor = (root) => ({ root, ...assertMultiSelect(root) });

export function syncMultiSelectState(root) {
  const parts = partsFor(root);
  if (!['true','false'].includes(parts.trigger.getAttribute('aria-expanded'))) {
    parts.trigger.setAttribute('aria-expanded', parts.popup.hidden ? 'false' : 'true');
  }
  const presentation = syncPresentationState(parts);
  const selectedValues = syncSelectionMetadata(parts);
  return {
    ...presentation,
    selectedValues,
    highlightedValue: parts.root.dataset.highlightedValue || ''
  };
}

export function setMultiSelectOpen(root, open) {
  if (typeof open !== 'boolean') throw new TypeError('core.multi-select open state must be boolean.');
  const parts = partsFor(root);
  if (open && (parts.trigger.disabled || parts.list.getAttribute('aria-disabled') === 'true')) {
    throw new TypeError('core.multi-select cannot open while disabled.');
  }
  parts.trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  return syncMultiSelectState(root);
}

export function setMultiSelectSelection(root, values) {
  const parts = partsFor(root);
  if (!Array.isArray(values) || values.some((value) => typeof value !== 'string')) {
    throw new TypeError('core.multi-select selection must be an array of string values.');
  }
  const unique = [...new Set(values)];
  if (unique.length !== values.length) throw new TypeError('core.multi-select selection values must be unique.');
  const known = new Set(parts.options.map(optionValue));
  for (const value of unique) if (!known.has(value)) throw new RangeError(`core.multi-select unknown option value: ${value}`);
  const selected = new Set(unique);
  for (const option of parts.options) option.setAttribute('aria-selected', selected.has(optionValue(option)) ? 'true' : 'false');
  return syncMultiSelectState(root);
}

export function setMultiSelectHighlighted(root, value) {
  const parts = partsFor(root);
  if (value === null || value === '') {
    clearHighlight(parts);
    return syncMultiSelectState(root);
  }
  if (typeof value !== 'string') throw new TypeError('core.multi-select highlighted value must be a string or null.');
  const option = parts.options.find((candidate) => optionValue(candidate) === value);
  if (!option) throw new RangeError(`core.multi-select unknown highlighted value: ${value}`);
  setHighlightedOption(parts, option);
  return {
    ...syncMultiSelectState(root),
    highlightedValue: value
  };
}

export function setMultiSelectInvalid(root, invalid) {
  if (typeof invalid !== 'boolean') throw new TypeError('core.multi-select invalid state must be boolean.');
  const parts = partsFor(root);
  if (invalid) parts.list.setAttribute('aria-invalid', 'true');
  else parts.list.removeAttribute('aria-invalid');
  return syncMultiSelectState(root);
}

export function setMultiSelectDisabled(root, disabled) {
  if (typeof disabled !== 'boolean') throw new TypeError('core.multi-select disabled state must be boolean.');
  const parts = partsFor(root);
  parts.trigger.disabled = disabled;
  parts.list.setAttribute('aria-disabled', disabled ? 'true' : 'false');
  if (disabled) parts.trigger.setAttribute('aria-expanded', 'false');
  return syncMultiSelectState(root);
}

export function toggleMultiSelectOption(root, option) {
  const parts = partsFor(root);
  if (!option || !parts.list.contains(option) || option.getAttribute('role') !== 'option' || isDisabledOption(option)) {
    throw new TypeError('core.multi-select toggle requires an enabled owned option.');
  }
  option.setAttribute('aria-selected', option.getAttribute('aria-selected') === 'true' ? 'false' : 'true');
  syncSelectionMetadata(parts);
  return syncMultiSelectState(root);
}

export function bindMultiSelect(root) {
  const parts = partsFor(root);
  controllers.get(root)?.();
  syncMultiSelectState(root);

  const open = ({ edge = 'start' } = {}) => {
    if (parts.trigger.disabled || parts.list.getAttribute('aria-disabled') === 'true') return;
    parts.trigger.setAttribute('aria-expanded', 'true');
    syncPresentationState(parts);
    const available = enabledOptions(parts);
    const selected = selectedOptions(parts).find((option) => !isDisabledOption(option));
    const initial = selected ?? (edge === 'end' ? available.at(-1) : available[0]) ?? null;
    if (initial) setHighlightedOption(parts, initial);
    parts.list.focus({ preventScroll: true });
  };

  const close = ({ returnFocus = false } = {}) => {
    parts.trigger.setAttribute('aria-expanded', 'false');
    syncPresentationState(parts);
    if (returnFocus) parts.trigger.focus({ preventScroll: true });
  };

  const moveHighlight = (direction) => {
    const available = enabledOptions(parts);
    if (!available.length) return clearHighlight(parts);
    const activeId = parts.list.getAttribute('aria-activedescendant');
    const currentIndex = available.findIndex((option) => option.id === activeId);
    const nextIndex = currentIndex < 0
      ? (direction > 0 ? 0 : available.length - 1)
      : (currentIndex + direction + available.length) % available.length;
    setHighlightedOption(parts, available[nextIndex]);
  };

  const jumpHighlight = (edge) => {
    const available = enabledOptions(parts);
    setHighlightedOption(parts, edge === 'end' ? available.at(-1) ?? null : available[0] ?? null);
  };

  const toggleActive = () => {
    const activeId = parts.list.getAttribute('aria-activedescendant');
    const active = activeId ? parts.options.find((option) => option.id === activeId) : null;
    if (active) toggleMultiSelectOption(root, active);
  };

  const onTriggerClick = () => {
    if (parts.trigger.getAttribute('aria-expanded') === 'true') close();
    else open();
  };

  const onTriggerKeyDown = (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    open({ edge: event.key === 'ArrowUp' ? 'end' : 'start' });
  };

  const onListKeyDown = (event) => {
    if (event.key === 'ArrowDown') { event.preventDefault(); moveHighlight(1); return; }
    if (event.key === 'ArrowUp') { event.preventDefault(); moveHighlight(-1); return; }
    if (event.key === 'Home') { event.preventDefault(); jumpHighlight('start'); return; }
    if (event.key === 'End') { event.preventDefault(); jumpHighlight('end'); return; }
    if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); toggleActive(); return; }
    if (event.key === 'Escape') { event.preventDefault(); close({ returnFocus: true }); return; }
  };

  const optionHandlers = new Map();
  for (const option of parts.options) {
    const onPointerMove = () => { if (!isDisabledOption(option)) setHighlightedOption(parts, option); };
    const onClick = () => {
      if (isDisabledOption(option)) return;
      setHighlightedOption(parts, option);
      toggleMultiSelectOption(root, option);
      parts.list.focus({ preventScroll: true });
    };
    option.addEventListener('pointermove', onPointerMove);
    option.addEventListener('click', onClick);
    optionHandlers.set(option, { onPointerMove, onClick });
  }

  const onFocusOut = (event) => {
    const next = event.relatedTarget;
    if (!next || !root.contains(next)) close();
  };

  parts.trigger.addEventListener('click', onTriggerClick);
  parts.trigger.addEventListener('keydown', onTriggerKeyDown);
  parts.list.addEventListener('keydown', onListKeyDown);
  root.addEventListener('focusout', onFocusOut);

  const dispose = () => {
    parts.trigger.removeEventListener('click', onTriggerClick);
    parts.trigger.removeEventListener('keydown', onTriggerKeyDown);
    parts.list.removeEventListener('keydown', onListKeyDown);
    root.removeEventListener('focusout', onFocusOut);
    for (const [option, handlers] of optionHandlers) {
      option.removeEventListener('pointermove', handlers.onPointerMove);
      option.removeEventListener('click', handlers.onClick);
    }
    if (controllers.get(root) === dispose) controllers.delete(root);
  };
  controllers.set(root, dispose);
  return dispose;
}
