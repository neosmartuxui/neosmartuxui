import {mkdir,readFile,writeFile,rm,cp,readdir} from 'node:fs/promises';
import {resolve,dirname,relative,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import * as site from './pages.mjs';

const root=resolve(import.meta.dirname,'../..'),out=resolve(root,'artifacts/portal-public');
const git=(...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8'}).trim();
const draft=process.env.NEOSMARTUXUI_PORTAL_DRAFT==='1';
const sha=draft?'local-unpinned':git('rev-parse','HEAD');
if(!draft&&(git('status','--porcelain')||process.env.NEOSMARTUXUI_SOURCE_SHA!==sha))throw new Error('Portal publication requires clean committed source and pinned source SHA');
const json=async file=>JSON.parse(await readFile(resolve(root,file),'utf8'));
const [core,commerce,operations,blocks,release]=await Promise.all([
 'packages/core/component-registry.json','packages/verticals/commerce/component-registry.json',
 'packages/verticals/operations/component-registry.json','packages/blocks/registry.json',
 'packages/distribution/release-admission.json'].map(json));
if(core.components.length!==50||commerce.components.length!==35||operations.components.length!==12||blocks.compositions.length!==7||blocks.templates.length!==2)throw new Error('Source registry count drift');
if(release.licenseDecision!=='Apache-2.0'||release.actionsMustRemainDisabled!==true||release.publicPublishApproved!==false)throw new Error('Production gate unexpectedly changed');
const items=[
 ...core.components.map(x=>({id:x.id,kind:'Core',status:x.maturity==='public-proof'?'Public proof':'Implemented',description:'Canonical interactive Core component. Explore its states in Foundry.',href:'/foundry/#'+x.id.slice(5)+'-slice'})),
 ...commerce.components.map(x=>({id:x.id,kind:'Commerce',status:'Experimental',description:'Synthetic provider-callback Commerce interface',href:'/labs/experimental/commerce/'})),
 ...operations.components.map(x=>({id:x.id,kind:'Operations',status:'Experimental',description:'Fixture-powered operations interface',href:'/labs/experimental/operations/'})),
 ...blocks.compositions.map(x=>({id:x.id,kind:'Block',status:'Experimental',description:'Reusable UI composition',href:'/labs/experimental/blocks/'})),
 ...blocks.templates.map(x=>({id:x.id,kind:'Template',status:'Experimental',description:'Composed application screen using synthetic records',href:'/labs/experimental/blocks/'}))
];
if(items.length!==106||new Set(items.map(x=>x.id)).size!==106)throw new Error('Duplicate or missing catalog IDs');
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
const write=async(path,data)=>{const f=resolve(out,path);await mkdir(dirname(f),{recursive:true});await writeFile(f,data)};
const pages=[
 ['index.html','One system. Every interface',site.homepage,''],
 ['components/index.html','Components',site.componentPage,'Components'],
 ['themes/index.html','Themes',site.themePage,'Themes'],
 ['blocks/index.html','Blocks',site.blockPage(blocks.compositions),'Blocks'],
 ['templates/index.html','Templates',site.templatePage,'Templates'],
 ['labs/index.html','Labs',site.labPage,'Labs'],
 ['flavors/index.html','Flavors',site.flavorPage,''],
 ['docs/index.html','Documentation',site.docsPage,'Docs']
];
for(const [path,title,body,active] of pages)await write(path,site.shell(title,body,{active,sha}));
// Use the canonical Hardline Theme rather than arbitrary marketing-page press values.
const hardline=await json('packages/themes/hardline-light/tokens.json');
if(hardline.flavor!=='flavor.hardline')throw new Error('Portal must use Hardline Theme');
const values=new Map(hardline.values.map(t=>[t.id,t.value]));
const pressure={
 '--portal-depth-rest-x':'depth.rest.x','--portal-depth-rest-y':'depth.rest.y',
 '--portal-depth-hover-x':'depth.hover.x','--portal-depth-hover-y':'depth.hover.y',
 '--portal-depth-active-x':'depth.active.x','--portal-depth-active-y':'depth.active.y',
 '--portal-press-hover-x':'press.hover.x','--portal-press-hover-y':'press.hover.y',
 '--portal-press-active-x':'press.active.x','--portal-press-active-y':'press.active.y',
 '--portal-motion-press-duration':'motion.press.duration',
 '--portal-motion-release-duration':'motion.release.duration',
 '--portal-motion-press-easing':'motion.press.easing',
 '--portal-motion-release-easing':'motion.release.easing',
 '--portal-focus-width':'focus.ring.width','--portal-focus-offset':'focus.ring.offset',
 '--portal-focus-color':'color.focus.ring',
 '--portal-pressure-radius':'radius.control',
 '--portal-control-minimum':'size.control.minimum'
};
const declarations=Object.entries(pressure).map(([css,role])=>{
 const raw=values.get(role);
 if(raw===undefined)throw new Error('Required Hardline token missing: '+role);
 const val=Array.isArray(raw)?'cubic-bezier('+raw.join(',')+')':String(raw);
 if(!/^(#[0-9a-fA-F]{6}|[0-9]+px|[0-9]+ms|cubic-bezier\([\d., ]+\))$/.test(val))
  throw new Error('Unsupported semantic token value: '+role);
 return '  '+css+': '+val+';';
}).join('\n');
const cssBase=await readFile(resolve(root,'tooling/portal/site.css'),'utf8');
const cssPressure=await readFile(resolve(root,'tooling/portal/pressure.css'),'utf8');
await write('portal.css',cssBase+'\n/* Generated from canonical Hardline Light Theme; no copied values */\n:root {\n'+declarations+'\n}\n'+cssPressure);
await cp(resolve(root,'tooling/portal/site.mjs'),resolve(out,'portal.mjs'));
const catalog={schema:'neosmartuxui/portal-catalog@1',sourceSha:sha,scope:'mixed-maturity',productionReady:false,counts:{core:50,commerce:35,operations:12,blocks:7,templates:2,total:106},items};
await write('components/catalog.json',JSON.stringify(catalog,null,2)+'\n');
const entrypoints=['/','/components/','/themes/','/blocks/','/templates/','/labs/','/flavors/','/docs/'];
const manifest={schema:'neosmartuxui/portal-artifact@1',sourceSha:sha,sections:entrypoints,existingRoutesPreserved:['/foundry/','/studio/','/labs/experimental/','/flavors/hardline/','/flavors/rivet/','/flavors/soft/','/flavors/mono/','/flavors/pulse/'],
 scope:'public-site-navigation',privatePackageIncluded:false,githubActionsUsed:false,productionPackageReleased:false,counts:catalog.counts,files:[]};
const hash=b=>createHash('sha256').update(b).digest('hex');
const walk=async dir=>{
 for(const ent of await readdir(dir,{withFileTypes:true})){
  const f=resolve(dir,ent.name);
  if(ent.isDirectory())await walk(f);
  else if(ent.isFile()){const buf=await readFile(f);manifest.files.push({path:relative(out,f).split(sep).join('/'),sha256:hash(buf),bytes:buf.length});}
  else throw new Error('No symlinks or special files in portal artifact');
 }
};
await walk(out);
manifest.files.sort((a,b)=>a.path.localeCompare(b.path));
manifest.artifactHash=hash(Buffer.from(JSON.stringify(manifest.files)));
await write('portal-manifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log('[portal] generated '+pages.length+' connected pages, catalog '+items.length+' entries, '+manifest.files.length+' static files, source '+sha);
