import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
const repo='https://github.com/neosmartuxui/neosmartuxui/blob/';
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const kindPath={Core:'core',Commerce:'commerce',Operations:'operations',Block:'block',Template:'template'};
function html(item) {
 const e=escape;
 const chips=(item.states||[]).map(s=>'<span>'+e(s)+'</span>').join('');
 const capabilities=Object.entries(item.supports||{}).filter(([,v])=>v).map(([k])=>'<span>'+e(k)+'</span>').join('');
 const note=item.kind==='Core'?'Canonical Foundry component, using actual rendered source and existing behavioral state. Theme Studio controls official themes.':'Actual experimental demo with synthetic records and simulated callbacks; no real payment, agent, or account mutations.';
 const themeControls=item.kind==='Core'?'<p class="detail-theme-note">Core proof uses the canonical Foundry presentation. <a href="/studio/">Edit official themes in Studio ↗</a></p>':
 '<label class="detail-theme-label" for="preview-theme">Demo theme<select id="preview-theme" aria-label="Demo theme">'+
 ['hardline','soft','rivet','mono','pulse'].flatMap(f=>['light','dark'].map(m=>'<option value="'+f+'-'+m+'">'+f+' '+m+'</option>')).join('')+'</select></label>';
 return [
 '<div class="wrap subpage detail-wrap" data-component-id="'+e(item.id)+'">',
 '<nav class="detail-breadcrumb" aria-label="Breadcrumb"><a href="/components/">Components</a><span>/</span><span>'+e(item.kind)+'</span><span>/</span><span aria-current="page">'+e(item.id)+'</span></nav>',
 '<header class="detail-head"><span class="pill">'+e(item.kind)+' / '+e(item.status)+'</span><h1>'+e(item.id)+'</h1><p class="detail-intent">'+e(item.intent)+'</p>',
 '<div class="detail-head-actions"><a class="btn btn-primary" href="'+e(item.sourceUrl)+'">View real source ↗</a><a class="btn" href="'+e(item.fullPreview)+'">Open full demo ↗</a><a class="btn" href="/studio/">Theme Studio ↗</a></div></header>',
 '<div class="detail-layout"><div class="detail-primary"><section class="detail-section detail-preview">',
 '<div class="detail-section-head"><div><span class="kicker">01 / EXISTING IMPLEMENTATION</span><h2>Live component preview</h2></div><span class="detail-proof">'+(item.kind==='Core'?'Core Foundry':'Experimental lab')+'</span></div>',
 '<p class="detail-context">'+note+'</p><div class="detail-controls">',
 '<fieldset class="detail-viewport-control"><legend>Viewport</legend><button class="detail-control is-selected" type="button" data-width="desktop" aria-pressed="true">Desktop</button><button class="detail-control" type="button" data-width="mobile" aria-pressed="false">Mobile</button></fieldset>',themeControls,'</div>',
 '<div class="detail-viewport" data-width="desktop"><iframe id="actual-demo" loading="eager" title="Existing '+e(item.id)+' demo"></iframe></div>',
 '<p class="detail-footnote">This is the <a href="'+e(item.fullPreview)+'">existing demo</a>, framed here for inspection—not a separately invented component. '+(item.kind==='Core'?'Public proof is recorded only where the canonical registry marks it.':'Provider integrations and production release are not included.')+'</p></section>',
 '<section class="detail-section"><div class="detail-section-head"><div><span class="kicker">02 / SOURCE EVIDENCE</span><h2>Real code excerpt</h2></div><button class="detail-control" id="copy-source" type="button">Copy excerpt</button></div>',
 '<p class="detail-context">Verbatim code from the pinned repository revision, not a fictional installation API. Use the linked full source for implementation.</p>',
 '<div class="detail-code-header"><span>'+e(item.sourcePath)+'</span><span>'+e(item.sourceLanguage)+'</span></div>',
 '<pre class="detail-code"><code id="source-code">'+e(item.code)+'</code></pre><a class="textlink" href="'+e(item.sourceUrl)+'">View full implementation ↗</a></section></div>',
 '<aside class="detail-aside"><section class="detail-meta"><span class="kicker">03 / CANONICAL METADATA</span><h2>Component facts</h2><dl>',
 '<div><dt>Catalog ID</dt><dd><code>'+e(item.id)+'</code></dd></div><div><dt>Maturity</dt><dd>'+e(item.status)+'</dd></div><div><dt>Layer</dt><dd>'+e(item.kind)+'</dd></div>',
 '<div><dt>Adapter source</dt><dd><a href="'+e(item.sourceUrl)+'">Code ↗</a></dd></div>',
 item.contractUrl?'<div><dt>Contract</dt><dd><a href="'+e(item.contractUrl)+'">Canonical JSON ↗</a></dd></div>':'',
 '</dl></section><section class="detail-meta"><h2>Declared states</h2><div class="detail-chips">'+chips+'</div>',
 '<p class="detail-meta-note">'+(item.kind==='Core'?'States come directly from the canonical contract.':'States come from experimental implementation metadata.')+'</p></section>',
 '<section class="detail-meta"><h2>'+(item.kind==='Core'?'Accessibility support':'Authority and dependencies')+'</h2><div class="detail-chips">'+capabilities+'</div></section>',
 '<section class="detail-meta"><h2>Related components</h2><div id="related-links" class="detail-related"></div></section></aside></div></div>',
 '<script type="module" src="/component-detail.mjs"></script>'
 ].join('\n');
}
export async function buildDetails({root,out,sha,items,shell}){
 const j=async file=>JSON.parse(await readFile(resolve(root,file),'utf8'));
 const [core,commerce,ops,blocks]=await Promise.all([
  'packages/core/component-registry.json','packages/verticals/commerce/component-registry.json','packages/verticals/operations/component-registry.json','packages/blocks/registry.json'
 ].map(j));
 const sources={Core:core.components,Commerce:commerce.components,Operations:ops.components,Block:blocks.compositions,Template:blocks.templates};
 const result=[];
 for(const item of items){
  const name=item.id.split('.').slice(1).join('.');
  if(!/^[a-z0-9-]+$/.test(name))throw new Error('Unsafe component ID '+item.id);
  const metadata=sources[item.kind].find(x=>x.id===item.id);
  if(!metadata)throw new Error('Missing component registry '+item.id);
  let contract=null,contractPath=null,sourcePath,states=[],intent=item.description,supports={};
  if(item.kind==='Core'){
   contractPath='packages/core/'+metadata.contract;
   contract=await j(contractPath);
   if(contract.id!==item.id)throw new Error('Contract ID mismatch: '+item.id);
   sourcePath=metadata.evidence.implementation;
   states=contract.states;intent=contract.intent;supports=contract.supports;
  }else if(item.kind==='Commerce'){
   sourcePath='packages/verticals/commerce/'+metadata.modulePath;
   states=metadata.states||['rest'];intent='Commerce '+name.replaceAll('-',' ')+' UI. Production use requires verified provider adapters.';
   supports=Object.fromEntries((metadata.composesCore||[]).map(x=>[x,true]));
  }else if(item.kind==='Operations'){
   sourcePath='packages/verticals/operations/components.mjs';
   states=['rest'];intent='Operations '+name.replaceAll('-',' ')+' UI; authority: '+metadata.authority+'.';
   supports={['Authority: '+metadata.authority]:true,...Object.fromEntries((metadata.composesCore||[]).map(x=>[x,true]))};
  }else{
   sourcePath=metadata.module||'packages/templates/operations.mjs';
   states=['rest'];intent='Experimental '+item.kind+' composition: '+name.replaceAll('-',' ')+'.';
   supports={'Synthetic demonstration only':true};
  }
  if(!states.length)throw new Error('Missing states '+item.id);
  const source=await readFile(resolve(root,sourcePath),'utf8');
  const lines=source.split(/\r?\n/);
  let at=0;
  const exported=item.kind==='Commerce'?metadata.module:item.kind==='Operations'?metadata.exportName:null;
  if(exported){const found=lines.findIndex(line=>line.includes(exported));if(found<0)throw new Error('Missing export '+exported);at=found;}
  const route='/components/'+kindPath[item.kind]+'/'+name+'/';
  const fullPreview=item.kind==='Core'?'/foundry/#'+name+'-slice':
    item.kind==='Commerce'?'/labs/experimental/commerce/':
    item.kind==='Operations'?'/labs/experimental/operations/':'/labs/experimental/blocks/';
  const record={id:item.id,kind:item.kind,status:item.status,intent,states,supports,route,sourcePath,
   sourceUrl:repo+sha+'/'+sourcePath+'#L'+(at+1),contractUrl:contractPath?repo+sha+'/'+contractPath:null,
   sourceLanguage:sourcePath.endsWith('.css')?'CSS':'JavaScript',code:lines.slice(at,at+36).join('\n'),
   fullPreview,previewType:item.kind==='Core'?'core':item.kind.toLowerCase()==='commerce'?'commerce':item.kind==='Operations'?'operations':'blocks',
   previewSelector:item.kind==='Core'?'#'+name+'-slice':item.kind==='Commerce'?'[data-component="'+name+'"]':'[data-example="'+name+'"]'};
  const file=resolve(out,route.slice(1)+'index.html');
  await mkdir(dirname(file),{recursive:true});
  await writeFile(file,shell(item.id,html(record),{active:'Components',sha,description:intent.slice(0,200)}));
  item.href=route;result.push(record);
 }
 await writeFile(resolve(out,'components/details.json'),JSON.stringify({schema:'neosmartuxui/component-details@1',sourceSha:sha,items:result},null,2)+'\n');
 return result;
}
