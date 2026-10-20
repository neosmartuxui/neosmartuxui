import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { renderResolvedTokenCss } from '../../packages/adapters/css/resolve-theme.mjs';

const root = resolve(import.meta.dirname, '../..');
const output = resolve(root, 'dist/foundry');

const contracts = JSON.parse(await readFile(resolve(root, 'spec/core/token-contracts.json'), 'utf8'));
const pulseDarkBundle = JSON.parse(await readFile(resolve(root, 'packages/themes/pulse-dark/tokens.json'), 'utf8'));
await writeFile(resolve(output, 'pulse-dark-theme.css'), renderResolvedTokenCss(contracts, pulseDarkBundle, { selector: '.ns-theme-pulse-dark' }));

const pulseDarkFragment = await readFile(resolve(root, 'apps/foundry/fragments/pulse-dark.html'), 'utf8');
const pulseRoutePath = resolve(output, 'flavors/pulse/index.html');
let pulseRoute = await readFile(pulseRoutePath, 'utf8');
const pulseThemeLink = '    <link rel="stylesheet" href="../../pulse-theme.css" />';
const pulseReturnLink = '      <p><a href="../../">Return to the Rivet Light Core Foundry</a></p>';
if (!pulseRoute.includes(pulseThemeLink)) throw new Error('Pulse route is missing the Light Theme stylesheet marker required for Dark assembly');
if (!pulseRoute.includes(pulseReturnLink)) throw new Error('Pulse route is missing the canonical return-link insertion marker required for Dark assembly');
pulseRoute = pulseRoute
  .replace(pulseThemeLink, `${pulseThemeLink}\n    <link rel="stylesheet" href="../../pulse-dark-theme.css" />`)
  .replace(pulseReturnLink, `${pulseDarkFragment.trimEnd()}\n\n${pulseReturnLink}`);
await writeFile(pulseRoutePath, pulseRoute);

console.log(`Assembled Pulse Dark into NeoSmartUXUI Foundry → ${output}`);
