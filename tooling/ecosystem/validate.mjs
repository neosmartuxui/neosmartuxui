import {readFile,access} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {verifyRootApacheLicense} from './verify-license.mjs';
const root=resolve(import.meta.dirname,'../..');
await verifyRootApacheLicense(root);
const read=async path=>JSON.parse(await readFile(resolve(root,path),'utf8'));
const lib=resolve(root,'artifacts/library-package'),manifest=await read('artifacts/library-package/package.json'),catalog=await read('artifacts/library-package/catalog.json');
const release=await read('packages/distribution/release-admission.json'),core=await read('packages/core/component-registry.json');
if(manifest.private!==true||manifest.license!=='Apache-2.0'||manifest.version!=='0.0.0-local')throw new Error('Package is not private/Apache-2.0');
if(!release.actionsMustRemainDisabled||release.publicProofReestablished||release.publicPublishApproved)throw new Error('Release gates must not be forged');
if(core.components.length!==50||catalog.counts.componentTotal!==97||catalog.items.length!==106||catalog.scope!=='local-only'||catalog.publicProof!==false)throw new Error('Discovery contracts drift');
const id=new Set(catalog.items.map(x=>x.id));if(id.size!==106)throw new Error('Non-unique IDs');
for(const filename of ['LICENSE','NOTICE']){
 if((await readFile(resolve(lib,filename))).compare(await readFile(resolve(root,filename)))!==0)throw new Error('Packaged '+filename+' does not match canonical root');
}
const exported=await import(pathToFileURL(resolve(lib,'index.mjs')).href);
for(const k of ['commerce','operations','blocks','templates'])if(!exported[k])throw new Error('Missing package namespace '+k);
for(const name of ['commerce','operations','blocks','templates']){
 const e=manifest.exports['./'+name];if(!e?.types||!e?.default)throw new Error('Missing typed subpath: '+name);
 await access(resolve(lib,e.default));
 await access(resolve(lib,e.types));
}
for(const theme of catalog.themes)await access(resolve(lib,'themes',theme+'.css'));
for(const app of ['foundry','studio']){
 const base=resolve(root,'dist',app);
 const index=await readFile(resolve(base,'index.html'),'utf8');
 if(!index.includes('data-local-ecosystem="true"')||!index.includes('./ecosystem/index.html'))throw new Error('Unified discovery is not integrated in local '+app);
 const inner=await read(resolve(base,'ecosystem/catalog.json'));
 if(inner.items.length!==106||inner.publicProof!==false)throw new Error('Untrusted local catalog '+app);
 for(const type of ['commerce','operations','blocks'])await access(resolve(base,'ecosystem',type,'index.html'));
 const deployment=await readFile(resolve(base,'deployment.json'),'utf8');
 if(!deployment.includes('local-unpinned'))throw new Error('Local proof must not look like pinned public artifact');
}
const sourceFoundry=await readFile(resolve(root,'apps/foundry/src/index.html'),'utf8');
const sourceStudio=await readFile(resolve(root,'apps/studio/src/index.html'),'utf8');
if(sourceFoundry.includes('data-local-ecosystem')||sourceStudio.includes('data-local-ecosystem'))throw new Error('Local-only overlay leaked into public application sources');
console.log('[ecosystem] PASS: 106 distinct indexed entries; 4 typed module subpaths; both local discovery surfaces; private/Apache-2.0; ten Themes; public-source isolation.');
