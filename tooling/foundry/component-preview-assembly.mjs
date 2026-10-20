import { readFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
const markerFor = (component) => `        <!-- NS_PREVIEW:${component} -->`;
export async function loadComponentPreviews(root) {
  const registry = JSON.parse(await readFile(resolve(root, 'packages/core/component-registry.json'), 'utf8'));
  const previews = [];
  for (const entry of registry.components.filter((candidate) => candidate.maturity !== 'contract-only')) {
    const slug = entry.id.split('.')[1];
    const base = resolve(root, 'packages/core/previews', slug);
    const manifest = JSON.parse(await readFile(resolve(base, 'preview.json'), 'utf8'));
    const fixture = await readFile(resolve(base, manifest.fixture), 'utf8');
    previews.push({ entry, slug, manifest, fixture });
  }
  return previews;
}
const formatOptions = (options) => {
  const entries = Object.entries(options ?? {});
  if (!entries.length) return '';
  return `{ ${entries.map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join(', ')} }`;
};
export function renderFoundryPreviewRuntime(previews) {
  const imports = [];
  const seen = new Set();
  const calls = [];
  for (const preview of previews) {
    for (const binding of preview.manifest.renderers.web.bindings) {
      const key = `${binding.module}|${binding.export}`;
      if (!seen.has(key)) {
        seen.add(key);
        imports.push(`      import { ${binding.export} } from './${basename(binding.module)}';`);
      }
      const options = binding.options === undefined ? '' : `, ${formatOptions(binding.options)}`;
      calls.push(`      ${binding.export}(document.querySelector('${binding.selector}')${options});`);
    }
  }
  return `    <script type="module">\n${imports.join('\n')}\n${calls.join('\n')}\n    </script>`;
}
export function assembleFoundryPreviewHtml(template, previews) {
  let output = template;
  for (const preview of previews) {
    const marker = markerFor(preview.entry.id);
    if (!output.includes(marker)) throw new Error(`Foundry preview marker missing: ${preview.entry.id}`);
    output = output.replace(marker, preview.fixture.trimEnd());
  }
  const runtimeMarker = '    <!-- NS_PREVIEW:RUNTIME -->';
  if (!output.includes(runtimeMarker)) throw new Error('Foundry preview runtime marker missing');
  return output.replace(runtimeMarker, renderFoundryPreviewRuntime(previews));
}
export function assembleFoundryPreviewStyles(template, harnessBase, harnessResponsive) {
  if (!template.includes('/* NS_PREVIEW:HARNESS_BASE */') || !template.includes('/* NS_PREVIEW:HARNESS_RESPONSIVE */')) throw new Error('Foundry preview harness marker missing');
  return template.replace('/* NS_PREVIEW:HARNESS_BASE */', harnessBase.trimEnd()).replace('/* NS_PREVIEW:HARNESS_RESPONSIVE */', harnessResponsive.trimEnd());
}
