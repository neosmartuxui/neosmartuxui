import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { renderResolvedTokenCss } from '../../packages/adapters/css/resolve-theme.mjs';

const root = resolve(import.meta.dirname, '../..');
const output = resolve(root, 'dist/foundry');

const contracts = JSON.parse(await readFile(resolve(root, 'spec/core/token-contracts.json'), 'utf8'));
const rivetDarkBundle = JSON.parse(await readFile(resolve(root, 'packages/themes/rivet-dark/tokens.json'), 'utf8'));
await writeFile(resolve(output, 'rivet-dark-theme.css'), renderResolvedTokenCss(contracts, rivetDarkBundle, { selector: '.ns-theme-rivet-dark' }));

const rivetDarkFragment = await readFile(resolve(root, 'apps/foundry/fragments/rivet-dark.html'), 'utf8');
const rivetRoutePath = resolve(output, 'flavors/rivet/index.html');
let rivetRoute = await readFile(rivetRoutePath, 'utf8');
const rivetThemeLink = '    <link rel="stylesheet" href="../../rivet-theme.css" />';
const rivetReturnLink = '      <p><a href="../../">Return to the Rivet Light Core Foundry</a></p>';
if (!rivetRoute.includes(rivetThemeLink)) throw new Error('Rivet route is missing the Light Theme stylesheet marker required for Dark assembly');
if (!rivetRoute.includes(rivetReturnLink)) throw new Error('Rivet route is missing the canonical return-link insertion marker required for Dark assembly');
rivetRoute = rivetRoute
  .replace(rivetThemeLink, `${rivetThemeLink}\n    <link rel="stylesheet" href="../../rivet-dark-theme.css" />`)
  .replace(rivetReturnLink, `${rivetDarkFragment.trimEnd()}\n\n${rivetReturnLink}`);
await writeFile(rivetRoutePath, rivetRoute);

console.log(`Assembled Rivet Dark into NeoSmartUI Foundry → ${output}`);
