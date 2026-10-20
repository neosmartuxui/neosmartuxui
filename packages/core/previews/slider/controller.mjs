const requireRoot = (root) => {
  const slider = root.querySelector('#slider-demo');
  if (!slider) throw new TypeError('core.slider preview requires #slider-demo');
  return slider;
};
export function applyPreviewState({ root, state, helpers }) {
  const slider = requireRoot(root);
  if (state === 'disabled') { helpers.setSliderDisabled(slider, true); return; }
  throw new Error(`core.slider preview cannot realize controller state ${state}`);
}
