import {mkdir,readFile,writeFile,cp} from 'node:fs/promises';
import {resolve} from 'node:path';
import {renderResolvedTokenCss} from '../../packages/adapters/css/resolve-theme.mjs';
const root=resolve(import.meta.dirname,'../..');
const out=resolve(root,'artifacts/operations-preview');
const registry=JSON.parse(await readFile(resolve(root,'packages/verticals/operations/component-registry.json'),'utf8'));
const tokens=JSON.parse(await readFile(resolve(root,'spec/core/token-contracts.json'),'utf8'));
await mkdir(resolve(out,'themes'),{recursive:true});
for(const name of registry.themes){
 const bundle=JSON.parse(await readFile(resolve(root,'packages/themes',name,'tokens.json'),'utf8'));
 await writeFile(resolve(out,'themes',name+'.css'),renderResolvedTokenCss(tokens,bundle,{selector:':root'}));
}
await writeFile(resolve(out,'core.css'),(await Promise.all(['card.css','badge.css','button.css'].map(x=>readFile(resolve(root,'packages/adapters/web/components',x),'utf8')))).join('\n'));
await cp(resolve(root,'packages/verticals/operations/operations.css'),resolve(out,'operations.css'));
await cp(resolve(root,'packages/verticals/operations/components.mjs'),resolve(out,'components.mjs'));
await cp(resolve(root,'tooling/operations/demo.mjs'),resolve(out,'demo.mjs'));
await cp(resolve(root,'apps/foundry/public/favicon.ico'),resolve(out,'favicon.ico'));
const options=registry.themes.map(t=>'<option value="'+t+'">'+t+'</option>').join('');
const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>NeoSmartUXUI Operations Local Lab</title><link rel="icon" href="./favicon.ico"><link id="tokens" rel="stylesheet" href="./themes/hardline-light.css"><link rel="stylesheet" href="./core.css"><link rel="stylesheet" href="./operations.css"><style>body{margin:0;padding:1rem;background:var(--ns-color-surface-panel);color:var(--ns-color-content-primary);font-family:var(--ns-font-family-body)}header{max-width:85rem;margin:auto auto 1.5rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem}h1{margin:0}header label{display:grid;gap:.35rem}header select{min-height:var(--ns-size-control-minimum);padding:.45rem;background:var(--ns-color-surface-interactive);color:var(--ns-color-content-primary);border:var(--ns-border-control-width) solid var(--ns-color-border-strong)}main{max-width:85rem;margin:auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr));gap:1.4rem}.example{min-width:0}.example h2{font-size:1rem;margin:0 0 .6rem}header p{color:var(--ns-color-content-secondary)}</style><script type="module" src="./demo.mjs"></script></head><body><header><div><p>LOCAL ONLY — NO PUBLIC PROOF</p><h1>Operations Lab</h1><p>NeoBrutal Soft + NeoLicenser → NeoSmartUXUI</p></div><label for="theme">Theme<select id="theme">'+options+'</select></label></header><main id="examples"></main></body></html>';
await writeFile(resolve(out,'index.html'),html);
console.log('[operations] built local preview:',registry.components.length,'components in',registry.themes.length,'saved Themes');
