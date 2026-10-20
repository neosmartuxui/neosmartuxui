import {readFile,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'../..');
const tracked=execFileSync('git',['-C',root,'ls-files'],{encoding:'utf8'}).split(/\r?\n/).filter(Boolean);
const assetExtensions=new Set(['.svg','.png','.jpg','.jpeg','.webp','.gif','.ico','.woff','.woff2','.otf','.ttf']);
const assets=tracked.filter(p=>assetExtensions.has(extname(p).toLowerCase())).sort();
const lock=JSON.parse(await readFile(resolve(root,'package-lock.json'),'utf8'));
const dependencies=Object.entries(lock.packages||{}).filter(([k])=>k.startsWith('node_modules/')).map(([key,pkg])=>({name:key.substring('node_modules/'.length),version:pkg.version,license:pkg.license??null,usage:'development dependency in root package lock'}));
const unresolved=['Artwork ownership and source history for tracked favicon images','Any third-party code, artwork or text contributed before reconstructed Git snapshot','Third-party license/NOTICE review on final built distribution and future runtime adapters'];
const original=[
 {project:'NeoSmartUXUI Core',license:'owner-approved Apache-2.0'},
 {project:'NeoBrutal Commerce source archive',license:'PolyForm Noncommercial 1.0.0 (archive unchanged)'},
 {project:'NeoBrutal Soft source archive',license:'UNLICENSED (archive unchanged)'},
 {project:'NeoLicenser / Pro',license:'Separate repositories; no backend/Pro bundled'}
];
const record={schema:'neosmartuxui/third-party-inventory@1',date:'2026-10-20',scope:'Tracked repository source and current npm lock, no legal clearance claim',dependencies,trackedAssets:assets,originalSourceProvenance:original,unresolved,reviewStatus:'open'};
if(dependencies.length!==3||dependencies.some(p=>p.license!=='Apache-2.0'))throw new Error('Current dependency inventory changed; review required');
if(assets.length<2)throw new Error('Unexpected source asset inventory');
const target=resolve(root,'docs/ATTRIBUTION-AUDIT.json');
await writeFile(target,JSON.stringify(record,null,2)+'\n');
console.log('[attribution] '+dependencies.length+' Apache-2.0 dev dependencies; '+assets.length+' tracked assets; '+unresolved.length+' unresolved review topics; approval remains false.');
