import {mkdir,readFile,writeFile,cp} from 'node:fs/promises';
import {resolve} from 'node:path';
import {renderResolvedTokenCss} from '../../packages/adapters/css/resolve-theme.mjs';
const root=resolve(import.meta.dirname,'../..');
const out=resolve(root,'artifacts/blocks-preview');
const registry=JSON.parse(await readFile(resolve(root,'packages/blocks/registry.json'),'utf8'));
const tokenSpec=JSON.parse(await readFile(resolve(root,'spec/core/token-contracts.json'),'utf8'));
for(const dir of ['themes','blocks/commerce','verticals/commerce','verticals/operations','templates'])await mkdir(resolve(out,dir),{recursive:true});
for(const theme of registry.themes){
 const bundle=JSON.parse(await readFile(resolve(root,'packages/themes',theme,'tokens.json'),'utf8'));
 await writeFile(resolve(out,'themes',theme+'.css'),renderResolvedTokenCss(tokenSpec,bundle,{selector:':root'}));
}
const base=(await Promise.all(['card.css','badge.css','button.css'].map(name=>readFile(resolve(root,'packages/adapters/web/components',name),'utf8')))).join('\n');
await writeFile(resolve(out,'core.css'),base);
for(const [src,dst] of [
 ['packages/blocks/commerce/index.mjs','blocks/commerce/index.mjs'],
 ['packages/templates/operations.mjs','templates/operations.mjs'],
 ['packages/verticals/commerce/components.mjs','verticals/commerce/components.mjs'],
 ['packages/verticals/operations/components.mjs','verticals/operations/components.mjs'],
 ['packages/blocks/blocks.css','blocks.css'],
 ['packages/verticals/commerce/commerce.css','commerce.css'],
 ['packages/verticals/operations/operations.css','operations.css'],
 ['tooling/blocks/demo.mjs','demo.mjs'],
 ['apps/foundry/public/favicon.ico','favicon.ico']]){
 await cp(resolve(root,src),resolve(out,dst));
}
const themeOptions=registry.themes.map(t=>'<option value="'+t+'">'+t+'</option>').join('');
const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>NeoSmartUXUI Blocks & Templates Lab</title><link rel="icon" href="./favicon.ico"><link id="tokens" rel="stylesheet" href="./themes/hardline-light.css"><link rel="stylesheet" href="./core.css"><link rel="stylesheet" href="./commerce.css"><link rel="stylesheet" href="./operations.css"><link rel="stylesheet" href="./blocks.css"><style>body{margin:0;padding:1rem;color:var(--ns-color-content-primary);background:var(--ns-color-surface-panel);font-family:var(--ns-font-family-body)}header{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:1rem;max-width:85rem;margin:auto auto 1rem}h1{margin:0}p{line-height:1.45}select{min-height:var(--ns-size-control-minimum);padding:.5rem;background:var(--ns-color-surface-interactive);color:var(--ns-color-content-primary);border:var(--ns-border-control-width) solid var(--ns-color-border-strong)}.gallery[hidden]{display:none}main{max-width:85rem;margin:auto}.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,22rem),1fr));gap:1.3rem}.sample{min-width:0}.sample h2{font-size:1rem;margin:0 0 .5rem}#templates-gallery{grid-template-columns:1fr}.ns-block,.ns-ops{max-width:100%}nav[aria-label="Local lab sections"]{max-width:85rem;margin:auto auto 1rem;display:flex;gap:.65rem}nav button{min-height:2.75rem}</style><script type="module" src="./demo.mjs"></script></head><body><header><div><p>LOCAL ONLY / NO PUBLIC PROOF</p><h1>Blocks & Templates Lab</h1><p>7 Commerce Blocks, 2 operations templates, 10 existing Themes</p></div><label>Theme <select id="theme">'+themeOptions+'</select></label></header><nav aria-label="Local lab sections"><button id="show-blocks" class="ns-button" type="button" aria-pressed="true">Blocks</button><button id="show-templates" class="ns-button" type="button" aria-pressed="false">Templates</button></nav><main><div id="blocks-gallery" class="gallery"></div><div id="templates-gallery" class="gallery" hidden></div></main></body></html>';
await writeFile(resolve(out,'index.html'),html);
console.log('[blocks] 7 Commerce Blocks and 2 templates built using 10 existing Theme bundles');
