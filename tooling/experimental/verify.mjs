import {readFile,readdir,stat} from 'node:fs/promises';
import {resolve,relative,sep} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../..');
const out=resolve(root,'artifacts/experimental-public');
const json=async name=>JSON.parse(await readFile(resolve(out,name),'utf8'));
const [manifest,data]=await Promise.all([json('artifact-manifest.json'),json('catalog.json')]);
const head=process.env.NEOSMARTUXUI_EXPERIMENTAL_DRAFT==='1'?'local-unpinned':process.env.NEOSMARTUXUI_SOURCE_SHA;
if(!head||data.sourceSha!==head||manifest.sourceSha!==head)throw new Error('Gallery source SHA mismatch');
if(manifest.scope!=='public-experimental-demo-only'||manifest.productionReady!==false||manifest.privatePackageIncluded!==false||manifest.githubActionsUsed!==false)throw new Error('Gallery claimed public product readiness');
if(data.schema!=='neosmartuxui/experimental-gallery@1'||data.items.length!==56||data.productionReady!==false||data.providerIntegrations!==false||data.fixtureData!==true)throw new Error('Unsafe catalog claim');
if(new Set(data.items.map(x=>x.id)).size!==56||data.themes.length!==10)throw new Error('Duplicate items or Theme drift');
const counts={commerce:35,operations:12,blocks:7,templates:2,total:56};
if(Object.entries(counts).some(([key,count])=>data.counts[key]!==count||manifest.counts[key]!==count))throw new Error('Inventory drift');
const hash=buffer=>createHash('sha256').update(buffer).digest('hex');
const paths=[];
const walk=async(dir)=>{
 for(const entry of await readdir(dir,{withFileTypes:true})){
  const f=resolve(dir,entry.name);
  if(entry.isDirectory())await walk(f);
  else if(entry.isFile())paths.push(relative(out,f).split(sep).join('/'));
  else throw new Error('Non-file gallery content');
 }
};
await walk(out);
const real=paths.filter(x=>x!=='artifact-manifest.json').sort();
if(real.length!==manifest.files.length||new Set(manifest.files.map(f=>f.path)).size!==real.length)throw new Error('Undeclared or duplicate file');
for(let i=0;i<real.length;i++){
 const info=manifest.files[i],name=real[i];
 if(info.path!==name||name.startsWith('/')||name.includes('..'))throw new Error('Manifest path mismatch');
 const buf=await readFile(resolve(out,name));
 if(info.bytes!==buf.length||info.sha256!==hash(buf))throw new Error('File integrity failure: '+name);
 if(/package\.json|README|RELEASE-BLOCKED|LICENSE|NOTICE|node_modules|\.env|secret|\.git|\.map$/.test(name))throw new Error('Private-package or secret-looking file leaked: '+name);
}
if(hash(Buffer.from(JSON.stringify(manifest.files)))!==manifest.artifactHash)throw new Error('Aggregate artifact hash mismatch');
for(const entry of data.items)if(entry.status!=='experimental'||!['commerce','operations','blocks'].includes(entry.preview))throw new Error('Invalid preview status');
for(const section of ['commerce','operations','blocks']){
 const html=await readFile(resolve(out,section,'index.html'),'utf8');
 if(!html.includes('Experimental preview.')||!html.includes('simulated callbacks')||html.includes('LOCAL ONLY'))throw new Error('Experimental disclaimer missing: '+section);
}
const index=await readFile(resolve(out,'index.html'),'utf8');
for(const text of ['PUBLIC EXPERIMENTAL GALLERY','synthetic fixture data','Not production-admitted','no actual payments','50 existing Core components'])if(!index.includes(text))throw new Error('Missing site disclaimer '+text);
console.log('[experimental] PASS '+real.length+' exact SHA-256 verified files; 56 experimental entries; source '+head+'; no private package; no production claims.');
