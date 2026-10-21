import {readFile,writeFile,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'../..'),lib=resolve(root,'artifacts/library-package');
const pkg=JSON.parse(await readFile(resolve(lib,'package.json'),'utf8'));
if(pkg.name!=='@neosmartuxui/library'||pkg.private!==true||pkg.version!=='0.0.0-local'||pkg.license!=='Apache-2.0')throw new Error('Private local package release boundary changed');
if(pkg.exports?.['./core']?.default!=='./core/index.mjs'||pkg.exports?.['./core']?.types!=='./core/index.d.ts')throw new Error('Actual typed Core ESM export subpath unavailable');
const audited=['accordion','radio','toggle','segmented-control','number-field'];
for(const name of audited){
 const source=await readFile(resolve(root,'packages/adapters/web/components',name+'.mjs'));
 const bundled=await readFile(resolve(lib,'core/components',name+'.mjs'));
 if(!source.equals(bundled))throw new Error('Bundled Core adapter diverged from shipping source: '+name);
}
const typeDeclaration=await readFile(resolve(lib,'core/index.d.ts'),'utf8');
const checked=['bindAccordion','bindRadio','bindToggle','bindSegmentedControl','bindNumberField'];
for(const fn of checked)if(!typeDeclaration.includes('export function '+fn+'('))throw new Error('Missing real declaration for '+fn);
const code=[
 "import * as core from '@neosmartuxui/library/core';",
 "const names=['bindAccordion','bindRadio','bindToggle','bindSegmentedControl','bindNumberField'];",
 "for(const key of names)if(typeof core[key]!=='function')throw new Error('Missing source-backed export '+key);",
 "if(Object.keys(core).length!==19)throw new Error('Core public surface changed unexpectedly');",
 "console.log('LOCAL_CORE_SELF_IMPORT_OK '+names.length+' verified binders');"
].join('\n');
const temporary=resolve(lib,'core-import-proof.mjs');
try{
 await writeFile(temporary,code+'\n');
 execFileSync(process.execPath,[temporary],{cwd:lib,stdio:'inherit'});
}finally{await rm(temporary,{force:true})}
console.log('[core-exports] PASS: private typed ESM subpath self-imports by package name; five adapters byte-identical to canonical source');
