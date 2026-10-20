const assertGroup = (group) => {
  if (!group || group.getAttribute('role') !== 'group') {
    throw new TypeError('core.toggle-group web adapter requires role="group".');
  }
  const mode = group.dataset.selectionMode;
  if (!['single', 'multiple'].includes(mode)) {
    throw new TypeError('core.toggle-group requires data-selection-mode="single" or "multiple".');
  }
  return mode;
};

const togglesFor = (group) => [...group.querySelectorAll('.ns-toggle')];

const assertToggle = (group, toggle) => {
  if (!toggle || !group.contains(toggle) || toggle.tagName !== 'BUTTON' || toggle.type !== 'button') {
    throw new TypeError('core.toggle-group children must be real Toggle <button type="button"> controls.');
  }
  if (!['true', 'false'].includes(toggle.getAttribute('aria-pressed'))) {
    throw new TypeError('core.toggle-group children require aria-pressed="true" or aria-pressed="false".');
  }
};

export function syncToggleGroup(group) {
  const mode = assertGroup(group);
  const toggles = togglesFor(group);
  if (!toggles.length) throw new TypeError('core.toggle-group requires at least one Toggle child.');
  for (const toggle of toggles) assertToggle(group, toggle);
  const selected = toggles.filter((toggle) => toggle.getAttribute('aria-pressed') === 'true');
  if (mode === 'single' && selected.length > 1) {
    throw new TypeError('core.toggle-group single mode permits at most one pressed Toggle.');
  }
  for (const toggle of toggles) {
    toggle.dataset.state = toggle.disabled ? 'disabled' : toggle.getAttribute('aria-pressed') === 'true' ? 'on' : 'off';
  }
  const allDisabled = toggles.every((toggle) => toggle.disabled);
  group.dataset.disabled = allDisabled ? 'true' : 'false';
  group.dataset.state = allDisabled ? 'disabled' : selected.length ? 'selected' : 'none-selected';
  group.dataset.selectedCount = String(selected.length);
  return selected;
}

export function setToggleGroupSelection(group, selectedIds) {
  const mode = assertGroup(group);
  if (!Array.isArray(selectedIds) || selectedIds.some((id) => typeof id !== 'string')) {
    throw new TypeError('core.toggle-group selected IDs must be a string array.');
  }
  const toggles = togglesFor(group);
  const known = new Set(toggles.map((toggle) => toggle.id).filter(Boolean));
  const requested = new Set(selectedIds);
  for (const id of requested) {
    if (!known.has(id)) throw new TypeError('core.toggle-group selection references an unknown Toggle.');
  }
  if (mode === 'single' && requested.size > 1) {
    throw new TypeError('core.toggle-group single mode accepts at most one selected ID.');
  }
  for (const toggle of toggles) {
    assertToggle(group, toggle);
    toggle.setAttribute('aria-pressed', requested.has(toggle.id) ? 'true' : 'false');
  }
  return syncToggleGroup(group);
}

export function setToggleGroupDisabled(group, disabled) {
  assertGroup(group);
  if (typeof disabled !== 'boolean') throw new TypeError('core.toggle-group disabled state must be boolean.');
  for (const toggle of togglesFor(group)) {
    assertToggle(group, toggle);
    toggle.disabled = disabled;
  }
  return syncToggleGroup(group);
}

export function bindToggleGroup(group) {
  const mode = assertGroup(group);
  const toggles = togglesFor(group);
  if (!toggles.length) throw new TypeError('core.toggle-group requires at least one Toggle child.');
  syncToggleGroup(group);
  const handlers = new Map();
  for (const toggle of toggles) {
    const onClick = () => {
      if (toggle.disabled) return;
      const pressed = toggle.getAttribute('aria-pressed') === 'true';
      if (mode === 'single') setToggleGroupSelection(group, pressed ? [] : [toggle.id]);
      else {
        toggle.setAttribute('aria-pressed', pressed ? 'false' : 'true');
        syncToggleGroup(group);
      }
    };
    toggle.addEventListener('click', onClick);
    handlers.set(toggle, onClick);
  }
  return () => {
    for (const [toggle, handler] of handlers) toggle.removeEventListener('click', handler);
  };
}
