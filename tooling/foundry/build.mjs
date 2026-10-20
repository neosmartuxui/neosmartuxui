import { access, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { renderResolvedTokenCss } from '../../packages/adapters/css/resolve-theme.mjs';

const root = resolve(import.meta.dirname, '../..');
const source = resolve(root, 'apps/foundry/src');
const publicDir = resolve(root, 'apps/foundry/public');
const output = resolve(root, 'dist/foundry');
const sourceSha = (process.env.NEOSMARTUXUI_SOURCE_SHA || process.env.NEOSMARTUI_SOURCE_SHA) || process.env.GITHUB_SHA || 'local-unpinned';

if (sourceSha !== 'local-unpinned' && !/^[0-9a-f]{40}$/.test(sourceSha)) throw new Error(`Invalid source SHA: ${sourceSha}`);

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(source, output, { recursive: true });
try {
  await access(publicDir);
  await cp(publicDir, output, { recursive: true });
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

const contracts = JSON.parse(await readFile(resolve(root, 'spec/core/token-contracts.json'), 'utf8'));
const rivetBundle = JSON.parse(await readFile(resolve(root, 'packages/themes/rivet-light/tokens.json'), 'utf8'));
const hardlineBundle = JSON.parse(await readFile(resolve(root, 'packages/themes/hardline-light/tokens.json'), 'utf8'));
const hardlineDarkBundle = JSON.parse(await readFile(resolve(root, 'packages/themes/hardline-dark/tokens.json'), 'utf8'));
const softBundle = JSON.parse(await readFile(resolve(root, 'packages/themes/soft-light/tokens.json'), 'utf8'));
const monoBundle = JSON.parse(await readFile(resolve(root, 'packages/themes/mono-light/tokens.json'), 'utf8'));
const pulseBundle = JSON.parse(await readFile(resolve(root, 'packages/themes/pulse-light/tokens.json'), 'utf8'));
await writeFile(resolve(output, 'theme.css'), renderResolvedTokenCss(contracts, rivetBundle));
await writeFile(resolve(output, 'rivet-theme.css'), renderResolvedTokenCss(contracts, rivetBundle, { selector: '.ns-theme-rivet-light' }));
await writeFile(resolve(output, 'hardline-theme.css'), renderResolvedTokenCss(contracts, hardlineBundle, { selector: '.ns-theme-hardline-light' }));
await writeFile(resolve(output, 'hardline-dark-theme.css'), renderResolvedTokenCss(contracts, hardlineDarkBundle, { selector: '.ns-theme-hardline-dark' }));
await writeFile(resolve(output, 'soft-theme.css'), renderResolvedTokenCss(contracts, softBundle, { selector: '.ns-theme-soft-light' }));
await writeFile(resolve(output, 'mono-theme.css'), renderResolvedTokenCss(contracts, monoBundle, { selector: '.ns-theme-mono-light' }));
await writeFile(resolve(output, 'pulse-theme.css'), renderResolvedTokenCss(contracts, pulseBundle, { selector: '.ns-theme-pulse-light' }));

const hardlineDarkFragment = await readFile(resolve(root, 'apps/foundry/fragments/hardline-dark.html'), 'utf8');
const hardlineRoutePath = resolve(output, 'flavors/hardline/index.html');
let hardlineRoute = await readFile(hardlineRoutePath, 'utf8');
const hardlineThemeLink = '    <link rel="stylesheet" href="../../hardline-theme.css" />';
const hardlineReturnLink = '      <p><a href="../../">Return to the Rivet Light Core Foundry</a></p>';
if (!hardlineRoute.includes(hardlineThemeLink)) throw new Error('Hardline route is missing the Light Theme stylesheet marker required for Dark assembly');
if (!hardlineRoute.includes(hardlineReturnLink)) throw new Error('Hardline route is missing the canonical return-link insertion marker required for Dark assembly');
hardlineRoute = hardlineRoute
  .replace(hardlineThemeLink, `${hardlineThemeLink}\n    <link rel="stylesheet" href="../../hardline-dark-theme.css" />`)
  .replace(hardlineReturnLink, `${hardlineDarkFragment.trimEnd()}\n\n${hardlineReturnLink}`);
await writeFile(hardlineRoutePath, hardlineRoute);

for (const file of ['button.css', 'checkbox.css', 'checkbox.mjs', 'input.css', 'input.mjs', 'radio.css', 'radio.mjs', 'switch.css', 'switch.mjs', 'tabs.css', 'tabs.mjs', 'textarea.css', 'textarea.mjs', 'select.css', 'select.mjs', 'card.css', 'badge.css', 'alert.css', 'field.css', 'breadcrumb.css', 'pagination.css', 'segmented-control.css', 'segmented-control.mjs', 'tooltip.css', 'tooltip.mjs', 'combobox.css', 'combobox.mjs', 'accordion.css', 'accordion.mjs']) {
  await cp(resolve(root, 'packages/adapters/web/components', file), resolve(output, file));
}
await writeFile(resolve(output, 'deployment.json'), `${JSON.stringify({
  schema: 'neosmartuxui/deployment-record@1',
  sourceRepository: 'neosmartuxui/neosmartuxui',
  sourceSha,
  artifact: 'foundry'
}, null, 2)}\n`);

console.log(`Built NeoSmartUXUI Foundry → ${output} (${sourceSha})`);
