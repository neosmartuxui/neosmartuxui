import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=resolve(import.meta.dirname,'../..');
if(process.env.NEOSMARTUXUI_LOCAL_ECOSYSTEM!=='1')throw new Error('Refusing to install unproven unified catalog without explicit LOCAL flag');
const run=script=>execFileSync(process.execPath,[resolve(root,script)],{cwd:root,stdio:'inherit',env:{...process.env,NEOSMARTUXUI_SOURCE_SHA:'local-unpinned'}});
const runCmd=command=>execFileSync(process.env.ComSpec||'cmd.exe',['/d','/s','/c',command],{cwd:root,stdio:'inherit',env:{...process.env,NEOSMARTUXUI_SOURCE_SHA:'local-unpinned'}});
runCmd('npm.cmd run build:foundry && npm.cmd run build:studio');
for(const file of ['tooling/commerce/build.mjs','tooling/operations/build.mjs','tooling/blocks/build.mjs','tooling/ecosystem/package.mjs'])run(file);
const catalog=JSON.parse(await readFile(resolve(root,'artifacts/library-package/catalog.json'),'utf8'));
if(catalog.scope!=='local-only'||catalog.publicProof!==false||catalog.items.length!==106)throw new Error('Invalid local-only catalog data');
const dirs=[['commerce','commerce-preview'],['operations','operations-preview'],['blocks','blocks-preview']];
for(const app of ['foundry','studio']){
 const dist=resolve(root,'dist',app),ec=resolve(dist,'ecosystem');
 await mkdir(ec,{recursive:true});
 for(const [dest,src] of dirs)await cp(resolve(root,'artifacts',src),resolve(ec,dest),{recursive:true});
 for(const [source,target] of [['catalog.html','index.html'],['catalog.css','catalog.css'],['catalog.mjs','catalog.mjs']]){
  await cp(resolve(root,'tooling/ecosystem',source),resolve(ec,target));
 }
 await writeFile(resolve(ec,'catalog.json'),JSON.stringify(catalog,null,2)+'\n');
 const indexPath=resolve(dist,'index.html'),before=await readFile(indexPath,'utf8');
 const block='<section aria-labelledby="unified-ecosystem-heading" data-local-ecosystem="true" style="border:2px solid currentColor;padding:1rem;margin:1rem 0"><h2 id="unified-ecosystem-heading">Unified library — local discovery</h2><p>50 Core + 35 Commerce + 12 Operations components, 7 Blocks and 2 Templates. Local-only. Not public proof.</p><a href="./ecosystem/index.html">Browse the local unified catalog and themed previews</a></section>';
 let after;
 if(app==='foundry'){
   const marker='</main>';
   if(!before.includes(marker))throw new Error('Foundry layout marker changed');
   after=before.replace(marker,block+'\n'+marker);
 }else{
   const marker='<main class="studio-grid" aria-label="NeoSmartUXUI Studio">';
   if(!before.includes(marker))throw new Error('Studio layout marker changed');
   // Preserve shipping Core component selection and isolated Theme preview. Add discoverability without a second registry authority.
   after=before.replace(marker,block+'\n'+marker);
 }
 if(after===before)throw new Error('Missing local catalog placement');
 await writeFile(indexPath,after);
}
console.log('[ecosystem] Local catalog installed in dist/foundry/ecosystem and dist/studio/ecosystem. Neither source app was modified. Do not publish dist.');
