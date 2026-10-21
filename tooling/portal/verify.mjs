import {readFile,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../..'),out=resolve(root,'artifacts/portal-public');
const manifest=JSON.parse(await readFile(resolve(out,'portal-manifest.json'),'utf8'));
const catalog=JSON.parse(await readFile(resolve(out,'components/catalog.json'),'utf8'));
const details=JSON.parse(await readFile(resolve(out,'components/details.json'),'utf8'));
const agents=JSON.parse(await readFile(resolve(out,'components/agent-index.json'),'utf8'));
const desired=process.env.NEOSMARTUXUI_PORTAL_DRAFT==='1'?'local-unpinned':process.env.NEOSMARTUXUI_SOURCE_SHA;
if(!desired||desired!==manifest.sourceSha||desired!==catalog.sourceSha)throw new Error('Portal and catalog source hashes do not match expected source');
if(manifest.schema!=='neosmartuxui/portal-artifact@1'||manifest.githubActionsUsed!==false||
 manifest.privatePackageIncluded!==false||manifest.productionPackageReleased!==false)throw new Error('Invalid portal publishing boundaries');
if(manifest.files.length!==121||manifest.sections.length!==8||catalog.schema!=='neosmartuxui/portal-catalog@1'||catalog.counts.total!==106||catalog.items.length!==106)throw new Error('Portal inventory drift');
if(details.schema!=='neosmartuxui/component-details@1'||details.sourceSha!==desired||details.items.length!==106)throw new Error('Invalid component detail directory');
if(new Set(catalog.items.map(x=>x.id)).size!==106||new Set(manifest.files.map(x=>x.path)).size!==121)throw new Error('Duplicate paths or catalog entries');
if(agents.schema!=='neosmartuxui/agent-capabilities@1'||agents.sourceSha!==desired||
 agents.productionPackageReleased!==false||agents.items.length!==106||
 agents.inventory.total!==106)throw new Error('Agent capability index drift');
const actualExports={accordion:'bindAccordion',radio:'bindRadio',toggle:'bindToggle','segmented-control':'bindSegmentedControl','number-field':'bindNumberField'};
if(!manifest.files.some(f=>f.path==='docs/integrations/index.html'))throw new Error('Framework integration guide missing');
for(const item of agents.items){
 const name=item.id.startsWith('core.')?item.id.slice(5):'';
 const binding=actualExports[name];
 if(binding){
  if(item.integration?.scope!=='private-local-only'||item.integration.exportName!==binding||
   item.integration.docs!=='/docs/integrations/'||
   item.integration.package!=='@neosmartuxui/library/core')throw new Error('Core export authority mismatch '+item.id);
 }else if(item.integration!==null)throw new Error('Undeclared framework integration '+item.id);
}
const validOps=new Set(['aria-disabled','checkbox','switch','input','select','tone','range','tab','radio','toggle','accordion','segment','number-field','number-step']);
const recipeIds=new Set(['core.button','core.checkbox','core.switch','core.input','core.textarea','core.select','core.badge','core.slider','core.tabs','core.radio','core.toggle','core.accordion','core.segmented-control','core.number-field']);
if(details.items.filter(x=>x.recipe).length!==recipeIds.size)throw new Error('Unexpected authored capability count');
for(const item of agents.items){
 const actual=details.items.find(x=>x.id===item.id);
 if(!actual||item.route!==actual.route||item.maturity!==actual.status||item.sourcePath!==actual.sourcePath||
 item.controlAvailability!==(actual.recipe?'source-verified':'not-declared')||
 item.documentationOnly!==true||item.productionIntegration!==false)throw new Error('Agent capability authority drift: '+item.id);
 if(actual.recipe){
  if(!recipeIds.has(item.id)||item.kind!=='Core')throw new Error('Control not admitted in Core: '+item.id);
  if(!actual.recipe.exampleMarkup.includes('ns-')||!actual.recipe.specimenUrl.includes('/'+desired+'/'))
   throw new Error('Unpinned Foundry example: '+item.id);
  if(actual.recipe.controls.length!==item.controls.length||!actual.recipe.controls.every(x=>validOps.has(x.op)))
   throw new Error('Unsupported property operation: '+item.id);
 }else if(item.controls.length)throw new Error('Undeclared component control: '+item.id);
}
for(const item of details.items){
 if(!item.route.startsWith('/components/')||!item.sourceUrl.includes('/'+desired+'/'))throw new Error('Unpinned documentation source');
 if(item.kind==='Core' && (!item.contractUrl||item.status==='Experimental'))throw new Error('Core canonical proof label incorrect');
 if(item.kind!=='Core' && item.status!=='Experimental')throw new Error('Experimental UI promoted');
 if(!manifest.files.some(f=>f.path===item.route.slice(1)+'index.html'))throw new Error('Missing detail route: '+item.route);
}
for(const [kind,count] of [['Core',50],['Commerce',35],['Operations',12],['Block',7],['Template',2]])
 if(catalog.items.filter(x=>x.kind===kind).length!==count)throw new Error('Catalog type count incorrect: '+kind);
const sha=x=>createHash('sha256').update(x).digest('hex');
for(const item of manifest.files){
 if(item.path.includes('..')||item.path.startsWith('/')||!item.sha256)throw new Error('Unsafe public file path');
 const buf=await readFile(resolve(out,item.path));
 if(buf.length!==item.bytes||sha(buf)!==item.sha256)throw new Error('Portal artifact digest mismatch: '+item.path);
 if(/node_modules|\.env|\.git\/|library-package/.test(item.path))throw new Error('Private package or secret path leaked');
}
if(sha(Buffer.from(JSON.stringify(manifest.files)))!==manifest.artifactHash)throw new Error('Artifact manifest aggregate SHA mismatch');
// The historical Foundry starts as the Pages root, then moves to /foundry/.
// Look for its actual proof HTML, not whichever document now owns the homepage.
const candidates=[
 resolve(root,'../neosmartuxui.github.io/foundry/index.html'),
 resolve(root,'artifacts/portal-stage/foundry/index.html'),
 resolve(root,'../neosmartuxui.github.io/index.html')
];
let old;
for(const candidate of candidates){
 try{
  const content=await readFile(candidate,'utf8');
  if(content.includes('id="button-slice"')){old=content;break;}
 }catch{}
}
if(!old)throw new Error('Historical Foundry proof not found: require a controlled Pages checkout or staged Foundry');
const missing=catalog.items.filter(x=>x.kind==='Core'&&!old.includes('id="'+x.id.slice(5)+'-slice"'));
if(missing.length)throw new Error('Invalid Core Foundry bookmarks: '+missing.map(x=>x.id).join(','));
console.log('[portal] verified '+manifest.files.length+' exact files, 106 catalog entries and 50 historical Core anchors; no package publish');
