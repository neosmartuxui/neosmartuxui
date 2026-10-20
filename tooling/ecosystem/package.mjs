import {mkdir,readFile,writeFile,cp,rm} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {renderResolvedTokenCss} from '../../packages/adapters/css/resolve-theme.mjs';
const root=resolve(import.meta.dirname,'../..'),out=resolve(root,'artifacts/library-package');
const json=async path=>JSON.parse(await readFile(resolve(root,path),'utf8'));
const core=await json('packages/core/component-registry.json');
const commerce=await json('packages/verticals/commerce/component-registry.json');
const operations=await json('packages/verticals/operations/component-registry.json');
const blocks=await json('packages/blocks/registry.json');
const items=[
 ...core.components.map(x=>({id:x.id,kind:'Core component',maturity:x.maturity,preview:'core',description:'Canonical Core primitive with individual proof status'})),
 ...commerce.components.map(x=>({id:x.id,kind:'Commerce component',maturity:x.status,preview:'commerce',description:'Provider-authoritative digital commerce UI'})),
 ...operations.components.map(x=>({id:x.id,kind:'Operations component',maturity:x.status,preview:'operations',description:x.origin})),
 ...blocks.compositions.map(x=>({id:x.id,kind:'Commerce block',maturity:x.status,preview:'blocks',description:'Composed Commerce surface'})),
 ...blocks.templates.map(x=>({id:x.id,kind:'Operations template',maturity:x.status,preview:'blocks',description:'Composed operational application view'}))
];
if(core.components.length!==50||commerce.components.length!==35||operations.components.length!==12||blocks.compositions.length!==7||blocks.templates.length!==2||items.length!==106||new Set(items.map(x=>x.id)).size!==106)throw new Error('Unified catalog counts or uniqueness drifted');
const themes=commerce.themes;
if(themes.length!==10||themes.some(t=>!blocks.themes.includes(t)||!operations.themes.includes(t)))throw new Error('Canonical theme mismatch');
const catalog={schema:'neosmartuxui/unified-catalog@1',scope:'local-only',publicProof:false,counts:{core:50,commerce:35,operations:12,blocks:7,templates:2,componentTotal:97,compositionsTotal:9},themes,items};
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
const copy=async(src,dst)=>{const target=resolve(out,dst);await mkdir(dirname(target),{recursive:true});await cp(resolve(root,src),target);};
for(const [src,dst] of [
 ['packages/verticals/commerce/components.mjs','verticals/commerce/components.mjs'],
 ['packages/verticals/commerce/wave2.mjs','verticals/commerce/wave2.mjs'],
 ['packages/verticals/commerce/wave3.mjs','verticals/commerce/wave3.mjs'],
 ['packages/verticals/commerce/wave4.mjs','verticals/commerce/wave4.mjs'],
 ['packages/verticals/commerce/index.mjs','verticals/commerce/index.mjs'],
 ['packages/verticals/commerce/index.d.ts','verticals/commerce/index.d.ts'],
 ['packages/verticals/commerce/commerce.css','styles/commerce.css'],
 ['packages/verticals/operations/components.mjs','verticals/operations/components.mjs'],
 ['packages/verticals/operations/index.mjs','verticals/operations/index.mjs'],
 ['packages/verticals/operations/index.d.ts','verticals/operations/index.d.ts'],
 ['packages/verticals/operations/operations.css','styles/operations.css'],
 ['packages/blocks/commerce/index.mjs','blocks/commerce/index.mjs'],
 ['packages/blocks/commerce/index.d.ts','blocks/commerce/index.d.ts'],
 ['packages/blocks/blocks.css','styles/blocks.css'],
 ['packages/templates/operations.mjs','templates/operations.mjs'],
 ['packages/templates/operations.d.ts','templates/operations.d.ts']
])await copy(src,dst);
const baseCSS=(await Promise.all(['button.css','badge.css','card.css'].map(f=>readFile(resolve(root,'packages/adapters/web/components',f),'utf8')))).join('\n');
await writeFile(resolve(out,'styles/core.css'),baseCSS);
const tokenSpec=await json('spec/core/token-contracts.json');
await mkdir(resolve(out,'themes'),{recursive:true});
for(const t of themes)await writeFile(resolve(out,'themes',t+'.css'),renderResolvedTokenCss(tokenSpec,await json('packages/themes/'+t+'/tokens.json'),{selector:':root'}));
const barrels=["commerce from './verticals/commerce/index.mjs'","operations from './verticals/operations/index.mjs'","blocks from './blocks/commerce/index.mjs'","templates from './templates/operations.mjs'"];
await writeFile(resolve(out,'index.mjs'),barrels.map(x=>'export * as '+x+';').join('\n')+'\n');
await writeFile(resolve(out,'index.d.ts'),barrels.map(x=>'export * as '+x+';').join('\n')+'\n');
const moduleExport=(js,types)=>({types,default:js});
const pkg={name:'@neosmartuxui/library',version:'0.0.0-local',type:'module',private:true,license:'UNLICENSED',description:'Local-only browser DOM ESM package for Commerce, Operations, Blocks, Templates',exports:{
 '.':moduleExport('./index.mjs','./index.d.ts'),
 './commerce':moduleExport('./verticals/commerce/index.mjs','./verticals/commerce/index.d.ts'),
 './operations':moduleExport('./verticals/operations/index.mjs','./verticals/operations/index.d.ts'),
 './blocks':moduleExport('./blocks/commerce/index.mjs','./blocks/commerce/index.d.ts'),
 './templates':moduleExport('./templates/operations.mjs','./templates/operations.d.ts'),
 './styles/core.css':'./styles/core.css','./styles/commerce.css':'./styles/commerce.css','./styles/operations.css':'./styles/operations.css','./styles/blocks.css':'./styles/blocks.css',
 './themes/*':'./themes/*','./catalog.json':'./catalog.json'
}};
await writeFile(resolve(out,'package.json'),JSON.stringify(pkg,null,2)+'\n');
await writeFile(resolve(out,'catalog.json'),JSON.stringify(catalog,null,2)+'\n');
await writeFile(resolve(out,'README.md'),[
 '# NeoSmartUXUI browser DOM package — LOCAL ONLY',
 '106 catalog entries: 97 components, 7 Commerce Blocks, 2 operational templates.',
 'Use the package subpaths commerce, operations, blocks and templates. Imports return semantic DOM renderers, not React/Vue components.',
 'Import core.css, one canonical theme CSS and relevant vertical/blocks CSS. Theme authoring remains in Studio.',
 'Provider mutations and billing need explicitly integrated host callbacks. No simulated payment authorization.',
 'This package is private, 0.0.0-local and UNLICENSED: this is NOT a grant of public distribution rights.',
 'A named target license, third-party rights review, live proof and backend integration remain release blockers.'
].join('\n')+'\n');
await writeFile(resolve(out,'RELEASE-BLOCKED.txt'),'NOT FOR PUBLIC DISTRIBUTION - named license and production-admission gates pending.\n');
const mod=await import(pathToFileURL(resolve(out,'index.mjs')).href);
if(Object.keys(mod.commerce.COMMERCE_RENDERERS).length!==8||Object.keys(mod.operations.OPERATIONS_RENDERERS).length!==12||Object.keys(mod.blocks.COMMERCE_BLOCKS).length!==7||Object.keys(mod.templates.TEMPLATE_RENDERERS).length!==2)throw new Error('Built distribution import self-test failed');
console.log('[distribution] built private ESM exports and ten saved Themes for',items.length,'catalog entries');
