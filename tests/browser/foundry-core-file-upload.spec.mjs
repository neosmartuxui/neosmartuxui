import { test, expect } from '@playwright/test';

const transformState = async (locator) => locator.evaluate((element) => {
  const style = getComputedStyle(element);
  const matrix = style.transform === 'none' ? null : new DOMMatrixReadOnly(style.transform);
  return {
    x: matrix?.m41 ?? 0,
    y: matrix?.m42 ?? 0,
    transform: style.transform,
    transitionDuration: style.transitionDuration,
    outlineWidth: style.outlineWidth,
    forcedColorAdjust: style.forcedColorAdjust,
    direction: style.direction
  };
});

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#file-upload-slice')).toContainText('core.file-upload');
  expect(errors).toEqual([]);
});

test('FileUpload deploys one real native file authority and no transport behavior', async ({ page, request }) => {
  for (const asset of ['file-upload.css', 'file-upload.mjs']) {
    const response = await request.get('/' + asset);
    expect(response.ok(), asset).toBeTruthy();
    expect((await response.text()).length, asset).toBeGreaterThan(100);
  }

  const root = page.locator('#file-upload-demo');
  const input = page.locator('#file-upload-input');
  const dropzone = page.locator('#file-upload-dropzone');

  expect(await input.evaluate((el) => [el.tagName, el.type, el.multiple, el.accept])).toEqual(['INPUT', 'file', true, '.pdf,image/*']);
  await expect(root).toHaveAttribute('data-state', 'empty');
  await expect(root).toHaveAttribute('data-selection-state', 'empty');
  await expect(root).toHaveAttribute('data-selected-count', '0');
  await expect(dropzone).toContainText('Drag files here or use the native file picker.');

  const moduleText = await (await request.get('/file-upload.mjs')).text();
  for (const forbidden of ['fetch(', 'XMLHttpRequest', 'WebSocket', 'requestSubmit(', 'form.submit(', 'upload-progress', 'presigned']) {
    expect(moduleText).not.toContain(forbidden);
  }
});

test('FileUpload mirrors native picker selection and clearing from the real FileList', async ({ page }) => {
  const root = page.locator('#file-upload-demo');
  const input = page.locator('#file-upload-input');
  const summary = page.locator('#file-upload-summary');

  await input.setInputFiles([
    { name: 'project-brief.pdf', mimeType: 'application/pdf', buffer: Buffer.from('brief') },
    { name: 'cover.png', mimeType: 'image/png', buffer: Buffer.from('image') }
  ]);
  await expect(root).toHaveAttribute('data-state', 'selected');
  await expect(root).toHaveAttribute('data-selection-state', 'selected');
  await expect(root).toHaveAttribute('data-selected-count', '2');
  await expect(root).toHaveAttribute('data-selected-names', 'project-brief.pdf|cover.png');
  await expect(summary).toContainText('2 files selected: project-brief.pdf, cover.png');
  expect(await input.evaluate((el) => [...el.files].map((file) => file.name))).toEqual(['project-brief.pdf', 'cover.png']);

  await input.setInputFiles([]);
  await expect(root).toHaveAttribute('data-state', 'empty');
  await expect(root).toHaveAttribute('data-selected-count', '0');
  await expect(summary).toHaveText('No files selected.');
});

test('FileUpload drag acquisition is transient and resolves into the native FileList', async ({ page }) => {
  const root = page.locator('#file-upload-demo');
  const dropzone = page.locator('#file-upload-dropzone');
  const input = page.locator('#file-upload-input');

  await page.evaluate(() => {
    const zone = document.querySelector('#file-upload-dropzone');
    const transfer = new DataTransfer();
    transfer.items.add(new File(['brief'], 'dragged-brief.pdf', { type: 'application/pdf' }));
    zone.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: transfer }));
  });
  await expect(root).toHaveAttribute('data-state', 'drag-active');
  await expect(dropzone).toHaveAttribute('data-drag-active', 'true');
  await expect(dropzone).toContainText('Release to choose these local files.');
  await expect(root).toHaveAttribute('data-selected-count', '0');

  await page.evaluate(() => {
    const zone = document.querySelector('#file-upload-dropzone');
    const transfer = new DataTransfer();
    transfer.items.add(new File(['brief'], 'dragged-brief.pdf', { type: 'application/pdf' }));
    zone.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer }));
  });
  await expect(root).toHaveAttribute('data-state', 'selected');
  await expect(root).toHaveAttribute('data-drag-state', 'idle');
  await expect(dropzone).toHaveAttribute('data-drag-active', 'false');
  expect(await input.evaluate((el) => [...el.files].map((file) => file.name))).toEqual(['dragged-brief.pdf']);
});

test('FileUpload preserves ordinary keyboard traversal and explicit invalid/disabled state', async ({ page }) => {
  const root = page.locator('#file-upload-demo');
  const input = page.locator('#file-upload-input');
  const error = page.locator('#file-upload-error');

  await root.evaluate((element) => {
    const before = document.createElement('button');
    before.id = 'file-upload-before';
    before.textContent = 'Before';
    const after = document.createElement('button');
    after.id = 'file-upload-after';
    after.textContent = 'After';
    element.before(before);
    element.after(after);
  });

  await page.locator('#file-upload-before').focus();
  await page.keyboard.press('Tab');
  await expect(input).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#file-upload-after')).toBeFocused();

  await page.evaluate(async () => {
    const module = await import('./file-upload.mjs');
    const root = document.querySelector('#file-upload-demo');
    const file = new File(['bad'], 'unsupported.exe', { type: 'application/octet-stream' });
    module.setFileUploadFiles(root, [file]);
    module.setFileUploadInvalid(root, true);
  });
  await expect(root).toHaveAttribute('data-state', 'invalid');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(error).toBeVisible();
  await expect(error).toContainText('Selection needs attention');

  await page.evaluate(async () => {
    const module = await import('./file-upload.mjs');
    const root = document.querySelector('#file-upload-demo');
    module.setFileUploadInvalid(root, false);
    module.setFileUploadDisabled(root, true);
  });
  await expect(input).toBeDisabled();
  await expect(root).toHaveAttribute('data-state', 'disabled');
  await expect(root).toHaveAttribute('data-disabled', 'true');

  await page.evaluate(() => {
    const zone = document.querySelector('#file-upload-dropzone');
    const transfer = new DataTransfer();
    transfer.items.add(new File(['ignored'], 'ignored.pdf', { type: 'application/pdf' }));
    zone.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: transfer }));
    zone.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer }));
  });
  await expect(root).toHaveAttribute('data-state', 'disabled');
  await expect(root).toHaveAttribute('data-selected-names', 'unsupported.exe');
});

test('FileUpload gives pressure to native browse/select action while drop surface stays stable', async ({ page }) => {
  const input = page.locator('#file-upload-input');
  const dropzone = page.locator('#file-upload-dropzone');

  await input.hover();
  await expect.poll(async () => (await transformState(input)).x, { timeout: 750 }).toBeCloseTo(2, 1);
  await expect.poll(async () => (await transformState(input)).y, { timeout: 750 }).toBeCloseTo(2, 1);

  const box = await input.boundingBox();
  if (!box) throw new Error('FileUpload input has no pointer box');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect.poll(async () => (await transformState(input)).x, { timeout: 750 }).toBeCloseTo(5, 1);
  await expect.poll(async () => (await transformState(input)).y, { timeout: 750 }).toBeCloseTo(5, 1);
  expect((await transformState(dropzone)).transform).toBe('none');
  await page.mouse.move(1, 1);
  await page.mouse.up();
});

test('FileUpload retains RTL, reduced-motion, forced-colors, and narrow-layout support', async ({ page }) => {
  const root = page.locator('#file-upload-demo');
  const input = page.locator('#file-upload-input');

  await root.evaluate((element) => element.setAttribute('dir', 'rtl'));
  expect((await transformState(root)).direction).toBe('rtl');

  await input.setInputFiles({
    name: 'very-long-localized-project-file-name-for-layout-verification.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('brief')
  });
  let metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  expect(parseFloat((await transformState(page.locator('#file-upload-input'))).transitionDuration)).toBeLessThanOrEqual(0.001);

  await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'active' });
  await page.goto('/');
  await page.locator('#file-upload-input').focus();
  const forced = await transformState(page.locator('#file-upload-input'));
  expect(forced.forcedColorAdjust).toBe('auto');
  expect(parseFloat(forced.outlineWidth)).toBeGreaterThan(0);

  await page.emulateMedia({ forcedColors: 'none' });
  await page.setViewportSize({ width: 375, height: 1100 });
  await page.goto('/');
  metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
});
