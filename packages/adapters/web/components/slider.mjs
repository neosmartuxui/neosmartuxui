const assertSlider = (root) => {
  if (!root || !root.classList?.contains('ns-slider')) throw new TypeError('core.slider web adapter requires an .ns-slider root.');
  const mode = root.dataset.sliderMode;
  if (!['single', 'range'].includes(mode)) throw new TypeError('core.slider requires data-slider-mode="single" or "range".');
  const inputs = [...root.querySelectorAll('.ns-slider__input')];
  const expected = mode === 'single' ? 1 : 2;
  if (inputs.length !== expected || inputs.some((input) => input.tagName !== 'INPUT' || input.type !== 'range')) throw new TypeError('core.slider requires one or two real <input type="range"> controls.');
  const min = Number(root.dataset.min), max = Number(root.dataset.max), step = Number(root.dataset.step);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max || !Number.isFinite(step) || step <= 0) throw new TypeError('core.slider requires finite data-min/data-max bounds and a positive data-step.');
  if (mode === 'range') {
    const lower = inputs.find((input) => input.dataset.sliderThumb === 'lower');
    const upper = inputs.find((input) => input.dataset.sliderThumb === 'upper');
    if (!lower || !upper) throw new TypeError('core.slider range mode requires lower and upper thumb identities.');
    return { mode, inputs, lower, upper, min, max, step };
  }
  return { mode, inputs, input: inputs[0], min, max, step };
};
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const percentage = (value, min, max) => ((value - min) / (max - min)) * 100;
const writeOutput = (root, key, value) => {
  const output = root.querySelector(`[data-slider-output="${key}"]`);
  if (output) { output.value = String(value); output.textContent = String(value); }
};
export function syncSlider(root) {
  const parts = assertSlider(root);
  const { mode, inputs, min, max, step } = parts;
  for (const input of inputs) input.step = String(step);
  if (mode === 'single') {
    const value = clamp(parts.input.valueAsNumber, min, max);
    parts.input.min = String(min);
    parts.input.max = String(max);
    parts.input.value = String(value);
    root.style.setProperty('--ns-slider-value', `${percentage(value, min, max)}%`);
    writeOutput(root, 'value', value);
  } else {
    let lowerValue = clamp(parts.lower.valueAsNumber, min, max);
    let upperValue = clamp(parts.upper.valueAsNumber, min, max);
    if (lowerValue > upperValue) lowerValue = upperValue;
    parts.lower.min = String(min);
    parts.lower.max = String(upperValue);
    parts.upper.min = String(lowerValue);
    parts.upper.max = String(max);
    parts.lower.value = String(lowerValue);
    parts.upper.value = String(upperValue);
    root.style.setProperty('--ns-slider-lower', `${percentage(lowerValue, min, max)}%`);
    root.style.setProperty('--ns-slider-upper', `${percentage(upperValue, min, max)}%`);
    writeOutput(root, 'lower', lowerValue);
    writeOutput(root, 'upper', upperValue);
  }
  const disabled = inputs.every((input) => input.disabled);
  root.dataset.state = disabled ? 'disabled' : 'rest';
  root.dataset.disabled = disabled ? 'true' : 'false';
  return inputs.map((input) => input.valueAsNumber);
}
export function setSliderDisabled(root, disabled) {
  const { inputs } = assertSlider(root);
  if (typeof disabled !== 'boolean') throw new TypeError('core.slider disabled state must be boolean.');
  for (const input of inputs) input.disabled = disabled;
  return syncSlider(root);
}
export function setSliderValues(root, values) {
  const parts = assertSlider(root);
  if (!Array.isArray(values) || values.length !== parts.inputs.length || values.some((value) => typeof value !== 'number' || !Number.isFinite(value))) throw new TypeError('core.slider values must be a finite number array matching the thumb count.');
  if (parts.mode === 'range' && values[0] > values[1]) throw new TypeError('core.slider range values must preserve lower <= upper ordering.');
  parts.inputs.forEach((input, index) => { input.value = String(values[index]); });
  return syncSlider(root);
}
export function bindSlider(root) {
  const parts = assertSlider(root);
  syncSlider(root);
  const handlers = new Map();
  for (const input of parts.inputs) {
    const onValueChange = () => {
      if (parts.mode === 'range') {
        const lowerValue = parts.lower.valueAsNumber, upperValue = parts.upper.valueAsNumber;
        if (input === parts.lower && lowerValue > upperValue) parts.lower.value = String(upperValue);
        if (input === parts.upper && upperValue < lowerValue) parts.upper.value = String(lowerValue);
      }
      syncSlider(root);
    };
    input.addEventListener('input', onValueChange);
    input.addEventListener('change', onValueChange);
    handlers.set(input, onValueChange);
  }
  return () => {
    for (const [input, handler] of handlers) {
      input.removeEventListener('input', handler);
      input.removeEventListener('change', handler);
    }
  };
}
