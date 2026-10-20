import {mkdir,readFile,writeFile,cp,rm,readdir,stat} from 'node:fs/promises';
import {resolve,dirname,relative,sep} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../..');
const pages=resolve(process.env.NEOSMARTUXUI_PAGES_REPO||'D:/neosmartuxui-recovered/neosmartuxui.github.io');
const source=resolve(root,'artifacts/portal-public'),target=resolve(root,'artifacts/portal-stage');
const manifest=JSON.parse(await readFile(resolve(source,'portal-manifest.json'),'utf8'));
if(manifest.schema!=='neosmartuxui/portal-artifact@1'||manifest.sections.length!==8)throw new Error('Portal build not ready');
if(!(await stat(resolve(pages,'.nojekyll')).catch(()=>null)))throw new Error('Pages source is not a valid Pages repo');
await rm(target,{recursive:true,force:true});
await cp(pages,target,{recursive:true,filter:src=>!relative(pages,src).split(sep).includes('.git')});
const oldRoot=await readFile(resolve(target,'index.html'),'utf8');
if(!oldRoot.includes('id="button-slice"'))throw new Error('Original Foundry proof is missing');
await mkdir(resolve(target,'foundry'),{recursive:true});
let foundry=oldRoot.replace('<head>','<head><base href="/">');
// Keep fragment links pointing back to the relocated Foundry, not to the new landing page.
foundry=foundry.replace(/href="#([^"]+)"/g,'href="/foundry/#$1"');
await writeFile(resolve(target,'foundry/index.html'),foundry);
const historical=await readFile(resolve(target,'deployment.json'),'utf8');
const oldDeployment=JSON.parse(historical);
if(oldDeployment.artifact!=='foundry'||oldDeployment.sourceSha!=='ff6897eb0db5d86ab28847b91bac76af26416891')throw new Error('Historical Foundry deployment provenance changed');
await writeFile(resolve(target,'foundry/deployment.json'),historical);
await writeFile(resolve(target,'deployment.json'),JSON.stringify({
 schema:'neosmartuxui/deployment-record@1',
 sourceRepository:'neosmartuxui/neosmartuxui',
 sourceSha:manifest.sourceSha,
 artifact:'portal',
 componentProof:'historical Foundry at /foundry/deployment.json',
 productionPackageReady:false,
 githubActionsUsed:false
},null,2)+'\n');

const h=b=>createHash('sha256').update(b).digest('hex');
for(const file of manifest.files){
 const sourceFile=resolve(source,file.path),destination=resolve(target,file.path);
 await mkdir(dirname(destination),{recursive:true});
 await cp(sourceFile,destination);
 const got=await readFile(destination);
 if(got.length!==file.bytes||h(got)!==file.sha256)throw new Error('Portal file changed during staging: '+file.path);
}
await cp(resolve(source,'portal-manifest.json'),resolve(target,'portal-manifest.json'));
for(const legacy of ['studio/index.html','labs/experimental/index.html','flavors/hardline/index.html','deployment.json','foundry/deployment.json','.nojekyll']){
 if(!(await stat(resolve(target,legacy)).catch(()=>null)))throw new Error('Legacy route lost: '+legacy);
}
console.log('[portal-stage] built combined site preserving all original routes; 8 portal pages + relocated Foundry /foundry/');
