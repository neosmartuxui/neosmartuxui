import {readFile,writeFile,mkdir,cp,rm,readdir} from 'node:fs/promises';
import {resolve,dirname,relative,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const root=resolve(import.meta.dirname,'../..');
const out=resolve(root,'artifacts/experimental-public');
const git=(...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8'}).trim();
const head=git('rev-parse','HEAD');
if(!/^[0-9a-f]{40}$/.test(head))throw new Error('Expected exact Git SHA');
const draft=process.env.NEOSMARTUXUI_EXPERIMENTAL_DRAFT==='1';
if(!draft&&git('status','--porcelain'))throw new Error('Experimental public build requires clean committed source');
const sha=draft?'local-unpinned':head;
if(!draft&&process.env.NEOSMARTUXUI_SOURCE_SHA!==sha)throw new Error('NEOSMARTUXUI_SOURCE_SHA must match exact committed HEAD');
const json=async p=>JSON.parse(await readFile(resolve(root,p),'utf8'));
const admission=await json('packages/distribution/release-admission.json');
if(admission.licenseDecision!=='Apache-2.0'||admission.publicPublishApproved!==false||admission.productionProvidersVerified!==false||admission.actionsMustRemainDisabled!==true)
 throw new Error('Production admission boundary changed; audit gallery build');
const core=await json('packages/core/component-registry.json');
const commerce=await json('packages/verticals/commerce/component-registry.json');
const operations=await json('packages/verticals/operations/component-registry.json');
const blocks=await json('packages/blocks/registry.json');
const groups=[
 {category:'Commerce components',preview:'commerce',entries:commerce.components},
 {category:'Operations components',preview:'operations',entries:operations.components},
 {category:'Commerce blocks',preview:'blocks',entries:blocks.compositions},
 {category:'Operational templates',preview:'blocks',entries:blocks.templates}
];
const items=groups.flatMap(g=>g.entries.map(x=>({
 id:x.id,category:g.category,preview:g.preview,status:'experimental',
 description:g.category==='Commerce components'?'Provider-callback UI, not live billing or licensing':
 g.category==='Operations components'?'Read-only state or simulated operator action':
 g.category==='Commerce blocks'?'Reusable UI composition with mock data':'Composed example screen with synthetic records'
})));
const themes=operations.themes;
if(core.components.length!==50||commerce.components.length!==35||operations.components.length!==12||blocks.compositions.length!==7||blocks.templates.length!==2||items.length!==56||new Set(items.map(i=>i.id)).size!==56||themes.length!==10)
 throw new Error('Experimental catalog counts mismatch');
const run=relativePath=>execFileSync(process.execPath,[resolve(root,relativePath)],{cwd:root,stdio:'inherit'});
for(const script of ['tooling/commerce/build.mjs','tooling/operations/build.mjs','tooling/blocks/build.mjs'])run(script);
await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});
const lists={
 commerce:['index.html','demo.mjs','components.mjs','wave2.mjs','wave3.mjs','wave4.mjs','commerce.css','core.css','favicon.ico','assets/product-1.svg','assets/product-2.svg'],
 operations:['index.html','demo.mjs','components.mjs','operations.css','core.css','favicon.ico'],
 blocks:['index.html','demo.mjs','core.css','commerce.css','operations.css','blocks.css','favicon.ico',
 'blocks/commerce/index.mjs','templates/operations.mjs','verticals/commerce/components.mjs','verticals/operations/components.mjs']
};
const folders={commerce:'artifacts/commerce-preview',operations:'artifacts/operations-preview',blocks:'artifacts/blocks-preview'};
for(const [section,files] of Object.entries(lists)){
 for(const name of [...files,...themes.map(t=>'themes/'+t+'.css')]){
  const from=resolve(root,folders[section],name),to=resolve(out,section,name);
  await mkdir(dirname(to),{recursive:true});await cp(from,to,{force:true});
 }
}
const disclaimer='Synthetic example data and simulated callbacks only. No real payments, licenses, downloads, account changes, integrations or agent actions occur.';
for(const section of Object.keys(lists)){
 const pagePath=resolve(out,section,'index.html');
 let html=await readFile(pagePath,'utf8');
 if(!html.includes('<body>'))throw new Error('Demo HTML structure changed: '+section);
 html=html.replace(/<p>LOCAL ONLY[^<]*<\/p>/gi,'<p>PUBLIC EXPERIMENTAL PREVIEW / NOT PRODUCTION PROOF</p>');
 const banner='<aside class="experimental-notice" role="note"><strong>Experimental preview.</strong> '+disclaimer+' <a href="../">Back to gallery</a></aside>';
 html=html.replace('<body>','<body>\n'+banner);
 html=html.replace('</head>','<link rel="stylesheet" href="../experimental.css"></head>');
 html=html.replace(/<title>[^<]+<\/title>/,'<title>'+section.charAt(0).toUpperCase()+section.slice(1)+' — experimental NeoSmartUXUI preview</title>');
 await writeFile(pagePath,html);
}
const css=[
 '.experimental-notice{padding:12px 18px!important;margin:0!important;background:#fff3bd!important;color:#181818!important;border-bottom:3px solid #181818!important;font:600 14px/1.5 system-ui,sans-serif!important;display:block!important;text-align:center}',
 '.experimental-notice strong{font-weight:900}.experimental-notice a{color:#0756a5!important;margin-inline-start:.75rem!important;text-decoration:underline!important}',
 '.experimental-notice:focus-within{outline:3px solid #0756a5}'
].join('\n')+'\n';
await writeFile(resolve(out,'experimental.css'),css);
const data={schema:'neosmartuxui/experimental-gallery@1',sourceSha:sha,
 scope:'public-experimental-demo-only',productionReady:false,fixtureData:true,providerIntegrations:false,
 project:'NeoSmartUXUI',existingCoreComponents:50,counts:{commerce:35,operations:12,blocks:7,templates:2,total:56},
 themes,items};
await writeFile(resolve(out,'catalog.json'),JSON.stringify(data,null,2)+'\n');
await cp(resolve(root,'tooling/experimental/site.css'),resolve(out,'site.css'));
await cp(resolve(root,'tooling/experimental/site.mjs'),resolve(out,'site.mjs'));
const html=[
 '<!doctype html><html lang="en"><head>',
 '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light">',
 '<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\'; style-src \'self\'; img-src \'self\' data:; connect-src \'self\'; object-src \'none\'; base-uri \'self\'; form-action \'none\'">',
 '<title>Experimental components — NeoSmartUXUI</title><link rel="icon" href="./commerce/favicon.ico">',
 '<meta name="description" content="Experimental, fixture-only previews of NeoSmartUXUI Commerce and Operations components, Blocks and Templates.">',
 '<link rel="stylesheet" href="./site.css"><script type="module" src="./site.mjs"></script></head>',
 '<body><main class="layout"><header class="masthead">',
 '<div class="topbar"><span class="wordmark">NeoSmartUXUI<span class="wordmark-dot">■</span></span><nav class="toplinks" aria-label="Project links"><a href="/">Foundry</a><a href="/studio/">Theme Studio</a><a href="https://github.com/neosmartuxui/neosmartuxui">Source</a></nav></div>',
 '<div class="eyebrow"><span class="eyebrow-square" aria-hidden="true"></span> PUBLIC EXPERIMENTAL GALLERY <span class="version-tag">v0 · preview</span></div>',
 '<h1>UI components, <em>without</em><br>the production claims.</h1>',
 '<p class="lede">A working look at Commerce, Operations, Blocks and Templates. Everything here uses <strong>synthetic fixture data</strong> and simulated callbacks—no actual payments, license changes, integrations or agent execution.</p>',
 '<div class="stats" aria-label="Library inventory"><div><strong>35</strong><span>Commerce</span></div><div><strong>12</strong><span>Operations</span></div><div><strong>7</strong><span>Blocks</span></div><div><strong>2</strong><span>Templates</span></div><div><strong>10</strong><span>Themes</span></div></div>',
 '<div class="statusline"><span class="status-dot" aria-hidden="true"></span> Experimental · Not production-admitted · Apache-2.0 source <span class="sha">Source: <a href="https://github.com/neosmartuxui/neosmartuxui/commit/'+sha+'">'+sha.slice(0,12)+'</a></span></div>',
 '</header><section class="catalog" aria-labelledby="catalog-title">',
 '<div class="section-title"><div><span class="section-kicker">01 / EXPLORE THE LIBRARY</span><h2 id="catalog-title">Browse the experiments</h2></div><a class="core-link" href="/">50 existing Core components ↗</a></div>',
 '<div class="toolbar"><label class="search-label" for="search">Search components<input type="search" id="search" placeholder="Search license, pricing, agents..." autocomplete="off"></label><label class="filter-label" for="category">Category<select id="category"><option value="all">All categories</option></select></label><label class="filter-label" for="theme">Preview theme<select id="theme"></select></label></div>',
 '<div class="preview-links"><span>Open a live demo</span><a id="commerce-link" href="./commerce/">Commerce ↗</a><a id="operations-link" href="./operations/">Operations ↗</a><a id="blocks-link" href="./blocks/">Blocks + Templates ↗</a></div>',
 '<p class="result-count" id="result-count" role="status">Loading catalog…</p><div id="results" class="results" aria-label="Experimental components"></div>',
 '</section><footer class="footer"><p><strong>Before you build:</strong> This is an experimental visual preview, not a live checkout, entitlement service, or stable API. UI actions use mock responses only. See the <a href="https://github.com/neosmartuxui/neosmartuxui/blob/main/docs/PUBLIC-SOURCE-STATUS.md">published source status</a> and <a href="https://github.com/neosmartuxui/neosmartuxui/blob/main/NOTICE">attribution</a>.</p><p>NeoSmartUXUI · Apache-2.0 · Experimental preview</p></footer></main></body></html>'
].join('\n');
await writeFile(resolve(out,'index.html'),html);
const hash=data=>createHash('sha256').update(data).digest('hex');
const walk=async(dir,base=dir)=>{
 const files=[];
 for(const ent of await readdir(dir,{withFileTypes:true})){
  const p=resolve(dir,ent.name);
  if(ent.isDirectory())files.push(...await walk(p,base));
  else if(ent.isFile())files.push(relative(base,p).split(sep).join('/'));
  else throw new Error('No symlinks or non-files allowed in public gallery');
 }
 return files;
};
const paths=(await walk(out)).sort();
const details=[];
for(const name of paths){const content=await readFile(resolve(out,name));details.push({path:name,sha256:hash(content),bytes:content.length});}
const manifest={schema:'neosmartuxui/experimental-artifact@1',sourceRepository:'neosmartuxui/neosmartuxui',sourceSha:sha,
 entrypoint:'labs/experimental/index.html',publishedPath:'/labs/experimental/',scope:'public-experimental-demo-only',
 productionReady:false,privatePackageIncluded:false,githubActionsUsed:false,counts:data.counts,
 files:details,artifactHash:hash(Buffer.from(JSON.stringify(details)))};
await writeFile(resolve(out,'artifact-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('[experimental] built '+details.length+' static assets, catalog '+items.length+' entries, source '+sha+'; no library package or providers shipped');
