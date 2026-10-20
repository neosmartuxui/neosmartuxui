const assertNumberField = (root) => {
  if (!root || !root.classList?.contains('ns-number-field')) throw new TypeError('core.number-field web adapter requires an .ns-number-field root.');
  const input = root.querySelector('.ns-number-field__input');
  if (!input || input.tagName !== 'INPUT' || input.type !== 'number') throw new TypeError('core.number-field requires a real <input type="number"> value authority.');
  const decrement = root.querySelector('[data-number-field-action="decrement"]');
  const increment = root.querySelector('[data-number-field-action="increment"]');
  for (const action of [decrement, increment].filter(Boolean)) {
    if (action.tagName !== 'BUTTON' || action.type !== 'button') throw new TypeError('core.number-field step actions must be real <button type="button"> controls.');
  }
  return { input, decrement, increment };
};
const finiteAttribute = (input, name) => {
  const raw = input.getAttribute(name);
  if (raw === null || raw === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};
const syncActions = ({ input, decrement, increment }) => {
  const locked = input.disabled || input.readOnly;
  const value = input.valueAsNumber;
  const min = finiteAttribute(input, 'min');
  const max = finiteAttribute(input, 'max');
  if (decrement) decrement.disabled = locked || (Number.isFinite(value) && min !== null && value <= min);
  if (increment) increment.disabled = locked || (Number.isFinite(value) && max !== null && value >= max);
};
export function syncNumberFieldState(root) {
  const parts = assertNumberField(root);
  const { input } = parts;
  const state = input.disabled ? 'disabled' : input.readOnly ? 'read-only' : input.getAttribute('aria-invalid') === 'true' || !input.validity.valid ? 'invalid' : input.value === '' ? 'empty' : 'filled';
  root.dataset.state = state;
  input.dataset.state = state;
  syncActions(parts);
  return state;
}
export function setNumberFieldValue(root, value) {
  const { input } = assertNumberField(root);
  if (value !== '' && (typeof value !== 'number' || !Number.isFinite(value))) throw new TypeError('core.number-field value must be a finite number or an empty string.');
  input.value = value === '' ? '' : String(value);
  return syncNumberFieldState(root);
}
export function setNumberFieldInvalid(root, invalid) {
  const { input } = assertNumberField(root);
  if (typeof invalid !== 'boolean') throw new TypeError('core.number-field invalid state must be boolean.');
  if (invalid) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  return syncNumberFieldState(root);
}
export function setNumberFieldReadOnly(root, readOnly) {
  const { input } = assertNumberField(root);
  if (typeof readOnly !== 'boolean') throw new TypeError('core.number-field read-only state must be boolean.');
  input.readOnly = readOnly;
  return syncNumberFieldState(root);
}
export function setNumberFieldDisabled(root, disabled) {
  const { input } = assertNumberField(root);
  if (typeof disabled !== 'boolean') throw new TypeError('core.number-field disabled state must be boolean.');
  input.disabled = disabled;
  return syncNumberFieldState(root);
}
const stepNumberField = (root, direction) => {
  const { input } = assertNumberField(root);
  if (input.disabled || input.readOnly) return syncNumberFieldState(root);
  if (direction === 'increment') input.stepUp(); else input.stepDown();
  syncNumberFieldState(root);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  return root.dataset.state;
};
export function bindNumberField(root) {
  const { input, decrement, increment } = assertNumberField(root);
  syncNumberFieldState(root);
  const onValueChange = () => syncNumberFieldState(root);
  const onDecrement = () => stepNumberField(root, 'decrement');
  const onIncrement = () => stepNumberField(root, 'increment');
  input.addEventListener('input', onValueChange);
  input.addEventListener('change', onValueChange);
  decrement?.addEventListener('click', onDecrement);
  increment?.addEventListener('click', onIncrement);
  return () => {
    input.removeEventListener('input', onValueChange);
    input.removeEventListener('change', onValueChange);
    decrement?.removeEventListener('click', onDecrement);
    increment?.removeEventListener('click', onIncrement);
  };
}
