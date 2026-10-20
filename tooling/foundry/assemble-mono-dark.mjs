import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { renderResolvedTokenCss } from '../../packages/adapters/css/resolve-theme.mjs';

const root = resolve(import.meta.dirname, '../..');
const output = resolve(root, 'dist/foundry');

const contracts = JSON.parse(await readFile(resolve(root, 'spec/core/token-contracts.json'), 'utf8'));
const monoDarkBundle = JSON.parse(await readFile(resolve(root, 'packages/themes/mono-dark/tokens.json'), 'utf8'));
await writeFile(resolve(output, 'mono-dark-theme.css'), renderResolvedTokenCss(contracts, monoDarkBundle, { selector: '.ns-theme-mono-dark' }));

const monoDarkFragment = await readFile(resolve(root, 'apps/foundry/fragments/mono-dark.html'), 'utf8');
const monoRoutePath = resolve(output, 'flavors/mono/index.html');
let monoRoute = await readFile(monoRoutePath, 'utf8');
const monoThemeLink = '    <link rel="stylesheet" href="../../mono-theme.css" />';
const monoReturnLink = '      <p><a href="../../">Return to the Rivet Light Core Foundry</a></p>';
if (!monoRoute.includes(monoThemeLink)) throw new Error('Mono route is missing the Light Theme stylesheet marker required for Dark assembly');
if (!monoRoute.includes(monoReturnLink)) throw new Error('Mono route is missing the canonical return-link insertion marker required for Dark assembly');
monoRoute = monoRoute
  .replace(monoThemeLink, `${monoThemeLink}\n    <link rel="stylesheet" href="../../mono-dark-theme.css" />`)
  .replace(monoReturnLink, `${monoDarkFragment.trimEnd()}\n\n${monoReturnLink}`);
await writeFile(monoRoutePath, monoRoute);

console.log(`Assembled Mono Dark into NeoSmartUI Foundry → ${output}`);
