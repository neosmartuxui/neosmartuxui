const requireToggle = (root) => {
  const toggle = root.querySelector('#toggle-demo');
  if (!toggle) throw new TypeError('core.toggle preview requires #toggle-demo');
  return toggle;
};
export function applyPreviewState({ root, state, helpers }) {
  const toggle = requireToggle(root);
  if (state === 'off') { helpers.setToggleDisabled(toggle, false); helpers.setTogglePressed(toggle, false); return; }
  if (state === 'on') { helpers.setToggleDisabled(toggle, false); helpers.setTogglePressed(toggle, true); return; }
  if (state === 'disabled') { helpers.setToggleDisabled(toggle, true); return; }
  throw new Error(`core.toggle preview cannot realize controller state ${state}`);
}
