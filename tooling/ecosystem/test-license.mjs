import {mkdtemp,mkdir,cp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {verifyRootApacheLicense} from './verify-license.mjs';

const root=resolve(import.meta.dirname,'../..');
const sandbox=await mkdtemp(resolve(tmpdir(),'neosmartuxui-license-fixtures-'));
const files=[
 'LICENSE','NOTICE','package.json',
 'packages/distribution/release-admission.json',
 'packages/verticals/commerce/source-admission.json',
 'packages/verticals/operations/component-registry.json'
];
let probes=0;
try{
 for(const f of files){
  const target=resolve(sandbox,f);
  await mkdir(dirname(target),{recursive:true});
  await cp(resolve(root,f),target);
 }
 await verifyRootApacheLicense(sandbox);probes++;
 const tamper=async(path,modify)=>{
  const file=resolve(sandbox,path);
  const before=await readFile(file);
  await writeFile(file,modify(before.toString('utf8')));
  let rejected=false;
  try{await verifyRootApacheLicense(sandbox);}catch{rejected=true}
  await writeFile(file,before);
  if(!rejected)throw new Error('License gate accepted tampered '+path);
  probes++;
 };
 await tamper('LICENSE',s=>s.replace('Version 2.0','Version 2.1'));
 await tamper('NOTICE',s=>s.replace('NeoBrutal Commerce','Uncredited Commerce'));
 await tamper('package.json',s=>s.replace('"Apache-2.0"','"UNLICENSED"'));
 await tamper('packages/verticals/commerce/source-admission.json',s=>s.replace('PolyForm Noncommercial 1.0.0','MIT'));
 await tamper('packages/distribution/release-admission.json',s=>s.replace('"licenseDecision": "Apache-2.0"','"licenseDecision": "pending-owner-SPDX-selection"'));
}finally{await rm(sandbox,{recursive:true,force:true});}
const gate=spawnSync(process.execPath,[resolve(root,'tooling/ecosystem/release-gate.mjs'),'--public'],{cwd:root,encoding:'utf8'});
if(gate.status!==1)throw new Error('Public release gate did not fail closed');
const output=gate.stderr+gate.stdout;
for(const reason of ['Third-party contributions/attribution not reviewed','Production checkout and licensing adapters not verified','Local-only catalog present in deployable foundry artifact','No explicit public publishing approval']){
 if(!output.includes(reason))throw new Error('Public release gate omitted '+reason);
}
if(output.includes('Named public license still requires explicit owner choice'))throw new Error('Stale pre-license blocker remains');
console.log('[license-tests] PASS: '+probes+' canonical/tamper probes + fail-closed public gate (no publishing).');
