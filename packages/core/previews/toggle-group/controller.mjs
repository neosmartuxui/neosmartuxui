const requireGroup = (root) => {
  const group = root.querySelector('#toggle-group-demo');
  if (!group) throw new TypeError('core.toggle-group preview requires #toggle-group-demo');
  return group;
};
export function applyPreviewState({ root, state, helpers }) {
  const group = requireGroup(root);
  if (state === 'none-selected') { helpers.setToggleGroupDisabled(group, false); helpers.setToggleGroupSelection(group, []); return; }
  if (state === 'selected') { helpers.setToggleGroupDisabled(group, false); helpers.setToggleGroupSelection(group, ['toggle-group-bold', 'toggle-group-italic']); return; }
  if (state === 'disabled') { helpers.setToggleGroupDisabled(group, true); return; }
  throw new Error(`core.toggle-group preview cannot realize controller state ${state}`);
}
