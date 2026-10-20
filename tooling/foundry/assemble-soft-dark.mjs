import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { renderResolvedTokenCss } from '../../packages/adapters/css/resolve-theme.mjs';

const root = resolve(import.meta.dirname, '../..');
const output = resolve(root, 'dist/foundry');

const contracts = JSON.parse(await readFile(resolve(root, 'spec/core/token-contracts.json'), 'utf8'));
const softDarkBundle = JSON.parse(await readFile(resolve(root, 'packages/themes/soft-dark/tokens.json'), 'utf8'));
await writeFile(resolve(output, 'soft-dark-theme.css'), renderResolvedTokenCss(contracts, softDarkBundle, { selector: '.ns-theme-soft-dark' }));

const softDarkFragment = await readFile(resolve(root, 'apps/foundry/fragments/soft-dark.html'), 'utf8');
const softRoutePath = resolve(output, 'flavors/soft/index.html');
let softRoute = await readFile(softRoutePath, 'utf8');
const softThemeLink = '    <link rel="stylesheet" href="../../soft-theme.css" />';
const softReturnLink = '      <p><a href="../../">Return to the Rivet Light Core Foundry</a></p>';
if (!softRoute.includes(softThemeLink)) throw new Error('Soft route is missing the Light Theme stylesheet marker required for Dark assembly');
if (!softRoute.includes(softReturnLink)) throw new Error('Soft route is missing the canonical return-link insertion marker required for Dark assembly');
softRoute = softRoute
  .replace(softThemeLink, `${softThemeLink}\n    <link rel="stylesheet" href="../../soft-dark-theme.css" />`)
  .replace(softReturnLink, `${softDarkFragment.trimEnd()}\n\n${softReturnLink}`);
await writeFile(softRoutePath, softRoute);

console.log(`Assembled Soft Dark into NeoSmartUI Foundry → ${output}`);
