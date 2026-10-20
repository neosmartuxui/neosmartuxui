const assertTimePicker = (root) => {
  if (!root || !root.classList?.contains('ns-time-picker')) {
    throw new TypeError('core.time-picker web adapter requires an .ns-time-picker root.');
  }
  const input = root.querySelector('.ns-time-picker__input');
  if (!input || input.tagName !== 'INPUT' || input.type !== 'time') {
    throw new TypeError('core.time-picker requires a real <input type="time"> value authority.');
  }
  return input;
};

export function syncTimePickerState(root) {
  const input = assertTimePicker(root);
  const state = input.disabled
    ? 'disabled'
    : input.readOnly
      ? 'read-only'
      : input.getAttribute('aria-invalid') === 'true' || !input.validity.valid
        ? 'invalid'
        : input.value === ''
          ? 'empty'
          : 'filled';
  root.dataset.state = state;
  input.dataset.state = state;
  return state;
}

export function setTimePickerValue(root, value) {
  const input = assertTimePicker(root);
  if (typeof value !== 'string') throw new TypeError('core.time-picker value must be a time string or empty string.');
  input.value = value;
  if (value !== '' && input.value === '') throw new TypeError('core.time-picker value must be a platform-valid local wall-clock time.');
  return syncTimePickerState(root);
}

export function setTimePickerInvalid(root, invalid) {
  const input = assertTimePicker(root);
  if (typeof invalid !== 'boolean') throw new TypeError('core.time-picker invalid state must be boolean.');
  if (invalid) input.setAttribute('aria-invalid', 'true');
  else input.removeAttribute('aria-invalid');
  return syncTimePickerState(root);
}

export function setTimePickerReadOnly(root, readOnly) {
  const input = assertTimePicker(root);
  if (typeof readOnly !== 'boolean') throw new TypeError('core.time-picker read-only state must be boolean.');
  input.readOnly = readOnly;
  return syncTimePickerState(root);
}

export function setTimePickerDisabled(root, disabled) {
  const input = assertTimePicker(root);
  if (typeof disabled !== 'boolean') throw new TypeError('core.time-picker disabled state must be boolean.');
  input.disabled = disabled;
  return syncTimePickerState(root);
}

export function bindTimePicker(root) {
  const input = assertTimePicker(root);
  syncTimePickerState(root);
  const onValueChange = () => syncTimePickerState(root);
  input.addEventListener('input', onValueChange);
  input.addEventListener('change', onValueChange);
  return () => {
    input.removeEventListener('input', onValueChange);
    input.removeEventListener('change', onValueChange);
  };
}
