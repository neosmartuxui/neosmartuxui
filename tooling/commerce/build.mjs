import {mkdir,readFile,writeFile,cp} from 'node:fs/promises';
import {resolve} from 'node:path';
import {renderResolvedTokenCss} from '../../packages/adapters/css/resolve-theme.mjs';
const root=resolve(import.meta.dirname,'../..');
const out=resolve(root,'artifacts/commerce-preview');
const registry=JSON.parse(await readFile(resolve(root,'packages/verticals/commerce/component-registry.json'),'utf8'));
const tokens=JSON.parse(await readFile(resolve(root,'spec/core/token-contracts.json'),'utf8'));
await mkdir(resolve(out,'themes'),{recursive:true});
await mkdir(resolve(out,'assets'),{recursive:true});
for(const theme of registry.themes){
  if(!/^[a-z]+-(light|dark)$/.test(theme))throw new Error('Invalid local theme name');
  const bundle=JSON.parse(await readFile(resolve(root,'packages/themes',theme,'tokens.json'),'utf8'));
  const css=renderResolvedTokenCss(tokens,bundle,{selector:':root'});
  await writeFile(resolve(out,'themes',theme+'.css'),css);
}
const coreCSS=await Promise.all(['card.css','badge.css','button.css'].map(f=>readFile(resolve(root,'packages/adapters/web/components',f),'utf8')));
await writeFile(resolve(out,'core.css'),coreCSS.join('\n'));
await cp(resolve(root,'packages/verticals/commerce/commerce.css'),resolve(out,'commerce.css'));
await cp(resolve(root,'packages/verticals/commerce/components.mjs'),resolve(out,'components.mjs'));
await cp(resolve(root,'tooling/commerce/demo.mjs'),resolve(out,'demo.mjs'));
await cp(resolve(root,'apps/foundry/public/favicon.ico'),resolve(out,'favicon.ico'));
for(const [name,fill,letter] of [['product-1','#78cce2','N'],['product-2','#ffd780','S']]){
  const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><rect width="640" height="480" fill="'+fill+'"/><rect x="70" y="80" width="500" height="320" rx="8" fill="none" stroke="#101010" stroke-width="22"/><text x="320" y="323" font-family="Arial,sans-serif" font-size="210" font-weight="900" text-anchor="middle" fill="#101010">'+letter+'</text></svg>';
  await writeFile(resolve(out,'assets',name+'.svg'),svg);
}
const options=registry.themes.map(t=>'<option value="'+t+'">'+t.replace('-',' ')+'</option>').join('');
const page='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NeoSmartUXUI — local Commerce component lab</title><link rel="icon" type="image/x-icon" href="./favicon.ico"><link id="resolved-theme" rel="stylesheet" href="./themes/hardline-light.css"><link rel="stylesheet" href="./core.css"><link rel="stylesheet" href="./commerce.css"><style>body{margin:0;padding:1rem 1.5rem;background:var(--ns-color-surface-panel);color:var(--ns-color-content-primary);font-family:var(--ns-font-family-body)}header{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:1rem;max-width:80rem;margin:0 auto 2rem}header h1{font-size:clamp(1.6rem,4vw,3rem);margin:0}header p{color:var(--ns-color-content-secondary)}header select{min-height:var(--ns-size-control-minimum);padding:.5rem;background:var(--ns-color-surface-interactive);color:var(--ns-color-content-primary);border:var(--ns-border-control-width) solid var(--ns-color-border-strong)}main{max-width:80rem;margin:auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr));gap:1.5rem}.demo-box{min-width:0}.demo-box h2{font-size:1rem;margin:0 0 .6rem}@media(max-width:35rem){body{padding:1rem}}</style><script type="module" src="./demo.mjs"></script></head><body><header><div><p>LOCAL ONLY / IMPLEMENTED / NO PUBLIC PROOF</p><h1>Commerce components</h1><p>NeoSmartUXUI vertical + existing Core, five flavors, ten themes</p></div><label for="theme">Theme <select id="theme">'+options+'</select></label></header><main id="components"></main></body></html>';
await writeFile(resolve(out,'index.html'),page);
console.log('Built local Commerce component showcase: '+registry.components.length+' components / '+registry.themes.length+' pre-existing Themes, output ignored by Git.');
