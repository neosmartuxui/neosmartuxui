const assertColorPicker = (root) => {
  if (!root || !root.classList?.contains('ns-color-picker')) {
    throw new TypeError('core.color-picker web adapter requires an .ns-color-picker root.');
  }
  const input = root.querySelector('.ns-color-picker__input');
  if (!input || input.tagName !== 'INPUT' || input.type !== 'color') {
    throw new TypeError('core.color-picker requires a real <input type="color"> value authority.');
  }
  return { input, output: root.querySelector('[data-color-picker-output]') };
};

const normalizeOpaqueColor = (value) => {
  if (typeof value !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(value)) {
    throw new TypeError('core.color-picker value must be an opaque six-digit sRGB hex color.');
  }
  return value.toLowerCase();
};

export function syncColorPickerState(root) {
  const { input, output } = assertColorPicker(root);
  const state = input.disabled
    ? 'disabled'
    : input.getAttribute('aria-invalid') === 'true'
      ? 'invalid'
      : 'selected';
  root.dataset.state = state;
  input.dataset.state = state;
  if (output) {
    output.value = input.value.toUpperCase();
    output.textContent = input.value.toUpperCase();
  }
  return state;
}

export function setColorPickerValue(root, value) {
  const { input } = assertColorPicker(root);
  input.value = normalizeOpaqueColor(value);
  return syncColorPickerState(root);
}

export function setColorPickerInvalid(root, invalid) {
  const { input } = assertColorPicker(root);
  if (typeof invalid !== 'boolean') throw new TypeError('core.color-picker invalid state must be boolean.');
  if (invalid) input.setAttribute('aria-invalid', 'true');
  else input.removeAttribute('aria-invalid');
  return syncColorPickerState(root);
}

export function setColorPickerDisabled(root, disabled) {
  const { input } = assertColorPicker(root);
  if (typeof disabled !== 'boolean') throw new TypeError('core.color-picker disabled state must be boolean.');
  input.disabled = disabled;
  return syncColorPickerState(root);
}

export function bindColorPicker(root) {
  const { input } = assertColorPicker(root);
  syncColorPickerState(root);
  const onValueChange = () => syncColorPickerState(root);
  input.addEventListener('input', onValueChange);
  input.addEventListener('change', onValueChange);
  return () => {
    input.removeEventListener('input', onValueChange);
    input.removeEventListener('change', onValueChange);
  };
}
