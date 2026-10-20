const requireRoot = (root) => {
  const field = root.querySelector('#file-upload-demo');
  if (!field) throw new TypeError('core.file-upload preview requires #file-upload-demo');
  return field;
};
const demoFiles = (root) => [
  new root.ownerDocument.defaultView.File(['brief'], 'project-brief.pdf', { type: 'application/pdf' }),
  new root.ownerDocument.defaultView.File(['image'], 'cover.png', { type: 'image/png' })
];
export function applyPreviewState({ root, state, helpers }) {
  const field = requireRoot(root);
  if (state === 'drag-active') { helpers.setFileUploadDragActive(field, true); return; }
  if (state === 'selected') { helpers.setFileUploadFiles(field, demoFiles(field)); return; }
  if (state === 'invalid') { helpers.setFileUploadFiles(field, demoFiles(field).slice(0, 1)); helpers.setFileUploadInvalid(field, true); return; }
  if (state === 'disabled') { helpers.setFileUploadFiles(field, demoFiles(field).slice(0, 1)); helpers.setFileUploadDisabled(field, true); return; }
  throw new Error(`core.file-upload preview cannot realize controller state ${state}`);
}
