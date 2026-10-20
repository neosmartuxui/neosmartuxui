const assertInputOtp = (root) => {
  if (!root || !root.classList?.contains('ns-input-otp')) throw new TypeError('core.input-otp web adapter requires an .ns-input-otp root.');
  const input = root.querySelector('.ns-input-otp__input');
  if (!input || input.tagName !== 'INPUT' || input.type !== 'text') throw new TypeError('core.input-otp requires one real <input type="text"> value authority.');
  if (input.autocomplete !== 'one-time-code') throw new TypeError('core.input-otp requires autocomplete="one-time-code".');
  if (!Number.isInteger(input.maxLength) || input.maxLength < 1) throw new TypeError('core.input-otp requires a positive maxlength.');
  return input;
};

export function syncInputOtpState(root) {
  const input = assertInputOtp(root);
  const length = input.value.length;
  const state = input.disabled
    ? 'disabled'
    : input.getAttribute('aria-invalid') === 'true'
      ? 'invalid'
      : length === 0
        ? 'empty'
        : length >= input.maxLength
          ? 'complete'
          : 'partial';
  root.dataset.state = state;
  input.dataset.state = state;
  return state;
}

export function setInputOtpValue(root, value) {
  const input = assertInputOtp(root);
  if (typeof value !== 'string') throw new TypeError('core.input-otp value must be a string.');
  if (value.length > input.maxLength) throw new RangeError('core.input-otp value cannot exceed maxlength.');
  input.value = value;
  return syncInputOtpState(root);
}

export function setInputOtpInvalid(root, invalid) {
  const input = assertInputOtp(root);
  if (typeof invalid !== 'boolean') throw new TypeError('core.input-otp invalid state must be boolean.');
  if (invalid) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  return syncInputOtpState(root);
}

export function setInputOtpDisabled(root, disabled) {
  const input = assertInputOtp(root);
  if (typeof disabled !== 'boolean') throw new TypeError('core.input-otp disabled state must be boolean.');
  input.disabled = disabled;
  return syncInputOtpState(root);
}

export function bindInputOtp(root) {
  const input = assertInputOtp(root);
  syncInputOtpState(root);
  const onValueChange = () => syncInputOtpState(root);
  input.addEventListener('input', onValueChange);
  input.addEventListener('change', onValueChange);
  return () => {
    input.removeEventListener('input', onValueChange);
    input.removeEventListener('change', onValueChange);
  };
}
