import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {verifyRootApacheLicense} from './verify-license.mjs';

const root=resolve(import.meta.dirname,'../..');
await verifyRootApacheLicense(root);
const output=resolve(root,'artifacts/library-package');
const cmd=process.platform==='win32'?(process.env.ComSpec||'cmd.exe'):'npm';
const args=process.platform==='win32'?['/d','/s','/c','npm.cmd pack --dry-run --json .\\artifacts\\library-package']:['pack','--dry-run','--json',output];
const child=spawnSync(cmd,args,{cwd:root,encoding:'utf8',maxBuffer:4*1024*1024});
if(child.status!==0)throw new Error('Local package simulation failed: '+child.stderr);
let parsed;
try{parsed=JSON.parse(child.stdout);}catch{throw new Error('Package simulation gave invalid JSON');}
const details=Array.isArray(parsed)?parsed[0]:parsed['@neosmartuxui/library'];
if(!details||!Array.isArray(details.files))throw new Error('No library dry-run manifest');
const names=details.files.map(f=>f.path);
for(const required of ['LICENSE','NOTICE','README.md','RELEASE-BLOCKED.txt','package.json','index.mjs','index.d.ts','catalog.json']){
 if(!names.includes(required))throw new Error('Local package missing '+required);
}
if(names.some(n=>/node_modules|\.env|\.git\/|neolicenser-pro/i.test(n)))throw new Error('Proprietary/secret/internal content in package');
const meta=JSON.parse(await readFile(resolve(output,'package.json'),'utf8'));
if(meta.license!=='Apache-2.0'||meta.private!==true||meta.version!=='0.0.0-local')throw new Error('Package cannot be publicly released');
console.log('[package-dryrun] PASS:',details.files.length,'local package entries; official LICENSE and NOTICE included; private Apache-2.0 metadata. Nothing published.');
