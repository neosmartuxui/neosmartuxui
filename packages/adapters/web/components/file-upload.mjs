const controllers = new WeakMap();

const assertFileUpload = (root) => {
  if (!root || !root.classList?.contains('ns-file-upload')) {
    throw new TypeError('core.file-upload web adapter requires an .ns-file-upload root.');
  }
  const input = root.querySelector('.ns-file-upload__input');
  if (!input || input.tagName !== 'INPUT' || input.type !== 'file') {
    throw new TypeError('core.file-upload requires one real <input type="file"> authority.');
  }
  const dropzone = root.querySelector('[data-file-upload-dropzone]');
  if (!dropzone || !root.contains(dropzone) || !dropzone.contains(input)) {
    throw new TypeError('core.file-upload requires an owned drop surface containing the native file input.');
  }
  return {
    input,
    dropzone,
    summary: root.querySelector('[data-file-upload-summary]'),
    dragMessage: root.querySelector('[data-file-upload-drag-message]'),
    error: root.querySelector('[data-file-upload-error]')
  };
};

const selectedFiles = (input) => [...(input.files ?? [])];

const renderFileNames = (files) => files.map((file) => file.name).filter(Boolean);

const syncText = (parts, files) => {
  const names = renderFileNames(files);
  if (parts.summary) {
    parts.summary.textContent = files.length
      ? `${files.length} file${files.length === 1 ? '' : 's'} selected: ${names.join(', ')}`
      : 'No files selected.';
  }
  if (parts.error) {
    const invalid = parts.input.getAttribute('aria-invalid') === 'true';
    parts.error.hidden = !invalid;
  }
};

export function syncFileUploadState(root) {
  const parts = { root, ...assertFileUpload(root) };
  const files = selectedFiles(parts.input);
  const disabled = parts.input.disabled;
  const invalid = parts.input.getAttribute('aria-invalid') === 'true';
  const dragActive = parts.root.dataset.dragState === 'active' && !disabled;

  parts.root.dataset.selectionState = files.length ? 'selected' : 'empty';
  parts.root.dataset.selectedCount = String(files.length);
  parts.root.dataset.selectedNames = renderFileNames(files).join('|');
  parts.root.dataset.disabled = disabled ? 'true' : 'false';
  parts.root.dataset.invalid = invalid ? 'true' : 'false';
  parts.root.dataset.state = disabled ? 'disabled' : dragActive ? 'drag-active' : invalid ? 'invalid' : files.length ? 'selected' : 'empty';
  parts.dropzone.dataset.dragActive = dragActive ? 'true' : 'false';
  if (parts.dragMessage) {
    parts.dragMessage.textContent = dragActive
      ? 'Release to choose these local files.'
      : 'Drag files here or use the native file picker.';
  }
  syncText(parts, files);
  return {
    state: parts.root.dataset.state,
    files,
    disabled,
    invalid,
    dragActive
  };
}

export function setFileUploadFiles(root, files) {
  const parts = { root, ...assertFileUpload(root) };
  if (!Array.isArray(files)) throw new TypeError('core.file-upload files must be an array of File objects.');
  const view = root.ownerDocument.defaultView;
  if (!view?.DataTransfer || !view?.File) throw new TypeError('core.file-upload requires browser File and DataTransfer support.');
  for (const file of files) if (!(file instanceof view.File)) throw new TypeError('core.file-upload files must contain only File objects.');
  if (!parts.input.multiple && files.length > 1) throw new RangeError('core.file-upload single-file authority cannot accept multiple files.');

  const transfer = new view.DataTransfer();
  for (const file of files) transfer.items.add(file);
  parts.input.files = transfer.files;
  parts.root.dataset.dragState = 'idle';
  return syncFileUploadState(root);
}

export function clearFileUploadFiles(root) {
  return setFileUploadFiles(root, []);
}

export function setFileUploadDragActive(root, active) {
  if (typeof active !== 'boolean') throw new TypeError('core.file-upload drag-active state must be boolean.');
  const parts = { root, ...assertFileUpload(root) };
  if (parts.input.disabled && active) throw new TypeError('core.file-upload cannot enter drag-active while disabled.');
  parts.root.dataset.dragState = active ? 'active' : 'idle';
  return syncFileUploadState(root);
}

export function setFileUploadInvalid(root, invalid) {
  if (typeof invalid !== 'boolean') throw new TypeError('core.file-upload invalid state must be boolean.');
  const parts = { root, ...assertFileUpload(root) };
  if (invalid) parts.input.setAttribute('aria-invalid', 'true');
  else parts.input.removeAttribute('aria-invalid');
  if (invalid) parts.root.dataset.dragState = 'idle';
  return syncFileUploadState(root);
}

export function setFileUploadDisabled(root, disabled) {
  if (typeof disabled !== 'boolean') throw new TypeError('core.file-upload disabled state must be boolean.');
  const parts = { root, ...assertFileUpload(root) };
  parts.input.disabled = disabled;
  if (disabled) parts.root.dataset.dragState = 'idle';
  return syncFileUploadState(root);
}

export function bindFileUpload(root) {
  const parts = { root, ...assertFileUpload(root) };
  controllers.get(root)?.();
  if (!parts.root.dataset.dragState) parts.root.dataset.dragState = 'idle';
  syncFileUploadState(root);

  let dragDepth = 0;
  const canAcquire = () => !parts.input.disabled;

  const onChange = () => {
    parts.root.dataset.dragState = 'idle';
    syncFileUploadState(root);
  };
  const onDragEnter = (event) => {
    if (!canAcquire()) return;
    event.preventDefault();
    dragDepth += 1;
    setFileUploadDragActive(root, true);
  };
  const onDragOver = (event) => {
    if (!canAcquire()) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    if (parts.root.dataset.dragState !== 'active') setFileUploadDragActive(root, true);
  };
  const onDragLeave = (event) => {
    if (!canAcquire()) return;
    event.preventDefault();
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) setFileUploadDragActive(root, false);
  };
  const onDrop = (event) => {
    if (!canAcquire()) return;
    event.preventDefault();
    dragDepth = 0;
    const files = [...(event.dataTransfer?.files ?? [])];
    if (files.length) setFileUploadFiles(root, files);
    else setFileUploadDragActive(root, false);
  };

  parts.input.addEventListener('change', onChange);
  parts.dropzone.addEventListener('dragenter', onDragEnter);
  parts.dropzone.addEventListener('dragover', onDragOver);
  parts.dropzone.addEventListener('dragleave', onDragLeave);
  parts.dropzone.addEventListener('drop', onDrop);

  const dispose = () => {
    parts.input.removeEventListener('change', onChange);
    parts.dropzone.removeEventListener('dragenter', onDragEnter);
    parts.dropzone.removeEventListener('dragover', onDragOver);
    parts.dropzone.removeEventListener('dragleave', onDragLeave);
    parts.dropzone.removeEventListener('drop', onDrop);
    if (controllers.get(root) === dispose) controllers.delete(root);
  };
  controllers.set(root, dispose);
  return dispose;
}
