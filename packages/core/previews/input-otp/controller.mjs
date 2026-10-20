const requireRoot = (root) => {
  const field = root.querySelector('#input-otp-demo');
  if (!field) throw new TypeError('core.input-otp preview requires #input-otp-demo');
  return field;
};
export function applyPreviewState({ root, state, helpers }) {
  const field = requireRoot(root);
  if (state === 'partial') { helpers.setInputOtpValue(field, '123'); return; }
  if (state === 'complete') { helpers.setInputOtpValue(field, '123456'); return; }
  if (state === 'invalid') { helpers.setInputOtpValue(field, '123456'); helpers.setInputOtpInvalid(field, true); return; }
  if (state === 'disabled') { helpers.setInputOtpValue(field, '123456'); helpers.setInputOtpDisabled(field, true); return; }
  throw new Error(`core.input-otp preview cannot realize controller state ${state}`);
}
