import { cp, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { assembleFoundryPreviewHtml, assembleFoundryPreviewStyles, loadComponentPreviews } from './component-preview-assembly.mjs';
const root = resolve(import.meta.dirname, '../..');
const output = resolve(root, 'dist/foundry');
const previews = await loadComponentPreviews(root);
const htmlPath = resolve(output, 'index.html');
const cssPath = resolve(output, 'styles.css');

const rendererAssets = new Set();
for (const preview of previews) {
  for (const style of preview.manifest.renderers.web.styles) rendererAssets.add(style);
  for (const binding of preview.manifest.renderers.web.bindings) {
    rendererAssets.add(binding.module);
    const source = await readFile(resolve(root, binding.module), 'utf8');
    for (const match of source.matchAll(/from\s+['"]\.\/(menu-items\.mjs)['"]/g)) {
      rendererAssets.add(`packages/adapters/web/components/${match[1]}`);
    }
  }
}
for (const asset of [...rendererAssets].sort()) {
  await cp(resolve(root, asset), resolve(output, asset.split('/').at(-1)));
}
const [htmlTemplate, cssTemplate, harnessBase, harnessResponsive] = await Promise.all([
  readFile(htmlPath, 'utf8'),
  readFile(cssPath, 'utf8'),
  readFile(resolve(root, 'packages/core/previews/harness.css'), 'utf8'),
  readFile(resolve(root, 'packages/core/previews/harness-responsive.css'), 'utf8')
]);
await writeFile(htmlPath, assembleFoundryPreviewHtml(htmlTemplate, previews));
await writeFile(cssPath, assembleFoundryPreviewStyles(cssTemplate, harnessBase, harnessResponsive));
console.log(`Assembled ${previews.length} shared Core previews and ${rendererAssets.size} authorized renderer assets into Foundry without renderer forks`);
