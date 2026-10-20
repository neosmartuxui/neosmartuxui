const assertToggle = (toggle) => {
  if (!toggle || toggle.tagName !== 'BUTTON' || toggle.type !== 'button') {
    throw new TypeError('core.toggle web adapter requires a real <button type="button">.');
  }
  if (!['true', 'false'].includes(toggle.getAttribute('aria-pressed'))) {
    throw new TypeError('core.toggle requires aria-pressed="true" or aria-pressed="false".');
  }
};

export function syncToggleState(toggle) {
  assertToggle(toggle);
  const state = toggle.disabled ? 'disabled' : toggle.getAttribute('aria-pressed') === 'true' ? 'on' : 'off';
  toggle.dataset.state = state;
  return state;
}

export function setTogglePressed(toggle, pressed) {
  assertToggle(toggle);
  if (typeof pressed !== 'boolean') throw new TypeError('core.toggle pressed state must be boolean.');
  toggle.setAttribute('aria-pressed', pressed ? 'true' : 'false');
  return syncToggleState(toggle);
}

export function setToggleDisabled(toggle, disabled) {
  assertToggle(toggle);
  if (typeof disabled !== 'boolean') throw new TypeError('core.toggle disabled state must be boolean.');
  toggle.disabled = disabled;
  return syncToggleState(toggle);
}

export function bindToggle(toggle) {
  assertToggle(toggle);
  syncToggleState(toggle);
  const onClick = () => {
    if (toggle.disabled) return;
    setTogglePressed(toggle, toggle.getAttribute('aria-pressed') !== 'true');
  };
  toggle.addEventListener('click', onClick);
  return () => toggle.removeEventListener('click', onClick);
}
