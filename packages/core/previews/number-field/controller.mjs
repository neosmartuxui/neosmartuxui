const requireRoot = (root) => {
  const field = root.querySelector('#number-field-demo');
  if (!field) throw new TypeError('core.number-field preview requires #number-field-demo');
  return field;
};
export function applyPreviewState({ root, state, helpers }) {
  const field = requireRoot(root);
  if (state === 'filled') { helpers.setNumberFieldValue(field, 4); return; }
  if (state === 'invalid') { helpers.setNumberFieldValue(field, 14); helpers.setNumberFieldInvalid(field, true); return; }
  if (state === 'read-only') { helpers.setNumberFieldValue(field, 4); helpers.setNumberFieldReadOnly(field, true); return; }
  if (state === 'disabled') { helpers.setNumberFieldValue(field, 4); helpers.setNumberFieldDisabled(field, true); return; }
  throw new Error(`core.number-field preview cannot realize controller state ${state}`);
}
