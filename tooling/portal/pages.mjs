// Shared portal markup. No external assets, fonts, or provider requests.
export const navigation=[['Components','/components/'],['Themes','/themes/'],['Blocks','/blocks/'],['Templates','/templates/'],['Labs','/labs/'],['Docs','/docs/']];
const link=(url,label,cls='')=>'<a href="'+url+'"'+(cls?' class="'+cls+'"':'')+'>'+label+'</a>';
const cta=(url,label,kind='')=>link(url,label+' ↗','btn'+(kind?' btn-'+kind:''));
const kicker=s=>'<p class="kicker">'+s+'</p>';
const card=(url,title,caption,desc,tone='')=>'<a class="tile" href="'+url+'"><div class="tile-art '+tone+'"><div class="fake-rows" aria-hidden="true"><div></div><div></div><div></div><div></div><div></div></div></div><div class="tile-body"><span class="tile-eyebrow">'+caption+'</span><h3 class="tile-title">'+title+'</h3><p class="tile-desc">'+desc+'</p><span class="tile-link">Explore '+title+' ↗</span></div></a>';
const route=(number,title,description,href)=>'<a class="route-card" href="'+href+'"><div class="route-top"><span class="route-num">'+number+'</span><span class="status">VIEW AVAILABLE</span></div><h3>'+title+'</h3><p>'+description+'</p><span class="textlink">Explore section ↗</span></a>';
export function shell(title,main,{active='',sha='local-unpinned',description='An accessible system of UI components, themes, Blocks, Templates and interactive Labs.'}={}){
 const nav=navigation.map(([name,href])=>'<a href="'+href+'"'+(name===active?' aria-current="page"':'')+'>'+name+'</a>').join('');
 return [
 '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
 '<meta name="description" content="'+description.replaceAll('"','&quot;')+'"><meta name="theme-color" content="#f8f9fb">',
 '<link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="stylesheet" href="/portal.css"><script type="module" src="/portal.mjs"></script>',
 '<title>'+title+' — NeoSmartUXUI</title></head><body><a class="skip" href="#main">Skip to content</a>',
 '<header class="bar"><div class="bar-inner"><a class="brand" href="/" aria-label="NeoSmartUXUI home"><span class="mark" aria-hidden="true">N</span><span><strong>NeoSmartUXUI</strong><small>INTERFACE SYSTEM / OPEN SOURCE</small></span></a>',
 '<button type="button" class="menu-btn" id="menu-toggle" aria-expanded="false" aria-controls="site-nav">Menu ☰</button>',
 '<nav class="nav" id="site-nav" aria-label="Main navigation">'+nav+'</nav><a class="nav-cta" href="/studio/">Open Studio ↗</a></div></header>',
 '<main id="main">'+main+'</main>',
 '<footer class="footer"><div class="footer-inner"><div><strong>NeoSmartUXUI<span style="color:#92a8ff">■</span></strong><p>One composable language for accessible components, tactile interactions, themes, Blocks and complete interfaces. Apache-2.0 source.</p></div>',
 '<div><h3>EXPLORE</h3>'+link('/components/','Components')+link('/themes/','Themes')+link('/blocks/','Blocks')+link('/templates/','Templates')+'</div>',
 '<div><h3>BUILD</h3>'+link('/studio/','Theme Studio')+link('/foundry/','Core Foundry')+link('/flavors/','Flavors')+link('/labs/','Experimental Labs')+'</div>',
 '<div><h3>RESOURCES</h3>'+link('/docs/','Documentation')+link('https://github.com/neosmartuxui/neosmartuxui','GitHub source ↗')+link('https://github.com/neosmartuxui/neosmartuxui/blob/main/LICENSE','Apache-2.0')+link('https://github.com/neosmartuxui/neosmartuxui/blob/main/docs/PUBLIC-SOURCE-STATUS.md','Release status')+'</div></div>',
 '<div class="footer-bottom"><span>© 2026 NeoSmartUXUI. Built for humans. Structured for agents.</span><span>Source: '+sha.slice(0,12)+' · Individual maturity states apply.</span></div></footer></body></html>'
 ].join('\n');
}
const visual=[
 '<div class="hero-art"><div class="preview-shell" role="img" aria-label="Illustration of a component dashboard with cards, chart and theme controls">',
 '<div class="preview-top"><i class="dot"></i><i class="dot"></i><i class="dot"></i><span class="preview-url">workspace / overview</span></div>',
 '<div class="preview-body"><div class="preview-side"><div class="mini-mark"></div><span class="side-line active"></span><span class="side-line"></span><span class="side-line"></span><span class="side-line"></span></div>',
 '<div class="preview-main"><span class="preview-breadcrumb">DESIGN SYSTEM / DASHBOARD</span><h3>Your workspace.</h3>',
 '<div class="preview-chips"><span class="preview-chip blue">UI preview</span><span class="preview-chip">Core + Commerce</span></div>',
 '<div class="preview-row"><div class="mini-card blue"><span class="mini-kicker">COMPONENTS</span><div class="mini-number">97</div><span class="mini-kicker">Composable pieces</span></div>',
 '<div class="mini-card"><span class="mini-kicker">VISUAL REPORT</span><div class="mini-bars"><i></i><i></i><i></i><i></i><i></i><i></i></div></div></div>',
 '<div class="preview-foot"><span>ONE TOKEN SYSTEM</span><b>HARDLINE / LIGHT ↗</b></div></div></div></div>',
 '<span class="floating-label">DESIGNED TO COMPOSE ↗</span></div>'
].join('');
const studioVisual='<div class="feature-art"><div class="studio-mock" role="img" aria-label="Illustration of Theme Studio"><div class="studio-title"><span>NEOSMART / THEME STUDIO</span><span>↗</span></div><div class="studio-content"><div class="studio-controls"><span class="control">BORDER WIDTH<i></i></span><span class="control">PRIMARY COLOR<i></i></span><span class="control">ACCENT COLOR<i></i></span></div><div class="studio-live"><b>Preview panel</b><span class="fine-line"></span><span class="action-preview"></span><span class="fine-line"></span><span class="fine-line" style="width:53%"></span></div></div></div></div>';
export const homepage=[
 '<div class="wrap"><div class="announcement"><span>✳ THE UNIFIED UI SYSTEM — COMPONENTS, THEMES, BLOCKS & TEMPLATES</span>'+link('/labs/experimental/','Explore the experimental gallery ↗')+'</div>',
 '<section class="hero"><div class="hero-copy"><span class="pill">BUILD BETTER, FROM ONE SYSTEM</span>',
 '<h1>One system.<br><span class="accent">Every interface.</span></h1>',
 '<p class="hero-subtitle">A tactile UI system where components, themes, Blocks and ready-made templates belong together. Explore the library, compose faster and make every interaction feel intentional.</p>',
 '<div class="hero-actions">'+cta('/components/','Explore components','primary')+cta('/studio/','Launch Theme Studio')+'</div>',
 '<div class="hero-note"><span><b>50</b> CORE COMPONENTS</span><span><b>47</b> DOMAIN COMPONENTS</span><span><b>10</b> THEMES</span></div></div>'+visual+'</section></div>',
 '<div class="ticker" aria-label="Design principles"><span>ACCESSIBLE</span><span>AGENT-READABLE</span><span>COMPOSABLE</span><span>TACTILE</span><span>ONE TOKEN SYSTEM</span></div>',
 '<section class="section wrap" id="explore"><div class="section-header"><div>'+kicker('01 / FOUNDATIONS')+'<h2>Start with the right layer.</h2></div><p class="section-intro">From small interaction primitives to complete operational experiences, every layer has a clear responsibility.</p></div>',
 '<div class="rail">'+
 card('/components/?type=Core','Core components','50 COMPONENTS / FOUNDATION','Buttons, inputs, navigation, dialogs, data and more, with original Core Foundry proof.')+
 card('/components/?type=Commerce','Commerce','35 COMPONENTS / EXPERIMENTAL','Product, checkout, licensing and subscription UI with explicit provider boundaries.','blocks')+
 card('/components/?type=Operations','Operations','12 COMPONENTS / EXPERIMENTAL','Release management, agent approvals, activation and administration patterns.','ops')+
 '</div></section>',
 '<section class="section wrap"><div class="section-header"><div>'+kicker('02 / COMPOSE')+'<h2>From components to experiences.</h2></div>'+link('/labs/','View all labs →','textlink')+'</div>',
 '<div class="lab-card-grid">'+card('/blocks/','Blocks','07 REUSABLE COMPOSITIONS','Reusable sections for product, account and commercial journeys.','blocks')+
 card('/templates/','Templates','02 APPLICATION PATTERNS','Licensing dashboards and release consoles assembled from domain components.','templates')+'</div></section>',
 '<section class="section wrap" id="studio"><div class="feature"><div class="feature-copy">'+kicker('03 / DESIGN WITH THE SYSTEM')+
 '<h2>Find your flavor.<br>Keep your rules.</h2><p>Ten saved themes across five distinct flavors. Change visual character without rebuilding interaction behavior or semantics.</p>',
 '<div class="hero-actions">'+cta('/studio/','Open Theme Studio','primary')+cta('/themes/','Browse all themes')+'</div></div>'+studioVisual+'</div></section>',
 '<section class="section wrap"><div class="section-header"><div>'+kicker('04 / THE WORKSPACE')+'<h2>Everything has a home.</h2></div><p class="section-intro">One navigation system connecting the library, proofs, experiments and design tools.</p></div>',
 '<div class="route-grid">'+
 route('01 / SYSTEM','Component Explorer','Search all 106 catalog entries with honest maturity labels.','/components/')+
 route('02 / APPEARANCE','Themes & Flavors','Five visual styles, light and dark variants and previews.','/themes/')+
 route('03 / CREATE','Theme Studio','Customize and export using the existing official theme editor.','/studio/')+
 route('04 / EXPERIMENT','Labs & Previews','Inspect fixture-based Commerce, Operations, Blocks and Templates.','/labs/')+
 route('05 / PROOF','Core Foundry','Inspect original interactive Core demos and component states.','/foundry/')+
 route('06 / RESOURCES','Documentation','Explore the architecture, code, release status and license.','/docs/')+
 '</div></section>',
 '<section class="section wrap"><div class="value-strip"><div><strong>50</strong><small>Core components</small></div><div><strong>47</strong><small>Domain components</small></div><div><strong>9</strong><small>Blocks + templates</small></div><div><strong>10</strong><small>Saved themes</small></div></div></section>'
].join('');
export const banner=(eyebrow,title,description,tag)=>'<div class="wrap subpage"><div class="subhero"><span class="subbadge">'+tag+'</span>'+kicker(eyebrow)+'<h1>'+title+'</h1><p>'+description+'</p></div>';
export const componentPage=banner('01 / COMPONENTS','Everything in one catalog.','Find Core, Commerce, Operations, Blocks and Templates. Core links lead to Foundry; experimental UI links lead to safe example previews.','106 ENTRIES / MIXED MATURITY')+
 '<div class="catalog-tools"><label for="component-search">SEARCH COMPONENTS<input type="search" id="component-search" autocomplete="off" placeholder="button, license, checkout, calendar..."></label>'+
 '<label for="component-category">COMPONENT FAMILY<select id="component-category"><option value="all">All categories</option></select></label></div>'+
 '<p class="result-line" id="catalog-count" role="status">Loading catalog...</p><div class="entry-grid" id="catalog-results"></div>'+
 '<p class="note">Maturity is preserved per entry. Commerce, Operations, Blocks and Templates remain experimental interfaces with simulated callbacks.</p></div>';
export const flavorNames=['Hardline','Rivet','Soft','Mono','Pulse'];
export const flavorSlugs=['hardline','rivet','soft','mono','pulse'];
const palette=[['#f7f5ef','#181818','#2357e6','#fff'],['#eceeee','#141b22','#e38d26','#fff'],['#f1f3f8','#29344a','#7e8ee2','#fff'],['#fdfdfd','#1a1a1a','#525252','#fff'],['#f7f8ff','#172953','#fa6c8e','#fff']];
export const themePage=banner('02 / THEMES','Ten themes. One grammar.','Five flavors, each available in light and dark, all using shared semantic design tokens.','5 FLAVORS / 10 THEMES')+
 '<div class="subsection">'+kicker('SAVED THEMES')+'<h2>Choose the personality.</h2><div class="theme-grid">'+
 palette.flatMap((col,i)=>['light','dark'].map(mode=>{
 const dark=mode==='dark',bg=dark?'#181c25':col[0],fg=dark?'#ecf0fa':col[1],surface=dark?'#262c36':col[3];
 return '<article class="theme-card"><div class="theme-art" style="--c-bg:'+bg+';--c-fg:'+fg+';--c-surface:'+surface+';--c-accent:'+col[2]+'"><div class="bar-ui"></div><div class="block-ui"><i></i><span style="font-size:12px;font-weight:900">Preview</span></div></div><span class="theme-name">'+flavorNames[i]+' '+(dark?'Dark':'Light')+'</span>'+link('/flavors/'+flavorSlugs[i]+'/','Explore '+flavorNames[i]+' ↗')+'</article>';
 })).join('')+'</div><p class="note">Theme cards illustrate the palettes. Actual token editing and export stay in the canonical Theme Studio.</p><div class="hero-actions">'+cta('/studio/','Launch Theme Studio','primary')+cta('/flavors/','Browse flavor previews')+'</div></div></div>';
export const blockPage=(items)=>banner('04 / BLOCKS','Build with blocks.','Seven reusable Commerce compositions with synthetic data and provider simulation.','7 EXPERIMENTAL BLOCKS')+
 '<div class="subsection"><div class="link-list">'+items.map((x,i)=>link('/labs/experimental/blocks/','<strong>0'+(i+1)+' / '+x.id+'</strong><span>Inspect this composition in the Blocks Lab ↗</span>')).join('')+'</div>'+
 '<p class="note">Blocks compose Core and Commerce interfaces and are not duplicate Core primitives.</p><div class="hero-actions">'+cta('/labs/experimental/blocks/','Open Blocks Lab','primary')+'</div></div></div>';
export const templatePage=banner('05 / TEMPLATES','Start from a real structure.','Two example application screens built from domain components and fictional records.','2 EXPERIMENTAL TEMPLATES')+
 '<div class="subsection"><div class="route-grid">'+
 route('01 / DASHBOARD','License Operations Dashboard','Activation capacity, provider health and event timeline composition.','/labs/experimental/blocks/')+
 route('02 / RELEASES','Release Operations Console','Artifact checks, rollout stages, webhook feedback and operator approval.','/labs/experimental/blocks/')+
 '</div><p class="note">These are experiments, not a production licensing backend or agent executor.</p></div></div>';
export const labPage=banner('06 / EXPERIMENTS','An organized playground.','All experimental previews share one gallery, with fixture data explicitly separated from production proof.','FIXTURE-ONLY / EXPERIMENTAL')+
 '<div class="subsection"><div class="rail">'+
 card('/labs/experimental/commerce/','Commerce Lab','35 UI COMPONENTS','Product, payment, cart, downloads and licensing lifecycle UI.','blocks')+
 card('/labs/experimental/operations/','Operations Lab','12 UI COMPONENTS','Activations, agents, releases, integrations and admin UI.','ops')+
 card('/labs/experimental/blocks/','Blocks & Templates','7 BLOCKS / 2 TEMPLATES','Reusable sections and application examples.','templates')+
 '</div><div class="hero-actions">'+cta('/labs/experimental/','Explore all 56 experimental entries','primary')+cta('/foundry/','View Core Foundry')+'</div></div></div>';
export const flavorPage=banner('03 / FLAVORS','Different materials. Shared physics.','Five distinct styles grounded in shared component contracts and semantic tokens.','5 EXISTING FLAVORS')+
 '<div class="subsection"><div class="rail">'+flavorNames.map((name,i)=>card('/flavors/'+flavorSlugs[i]+'/',name,'FLAVOR '+String(i+1).padStart(2,'0'),
 ['Strong edges and editorial contrast.','Industrial forms and mechanical interaction.','Calm interfaces with tactile feedback.','Minimal monochrome, focused hierarchy.','Energetic accents and color hierarchy.'][i],i===2?'ops':i===4?'themes':'')).join('')+'</div></div></div>';
export const docsPage=banner('07 / DOCUMENTATION','Everything documented.','Code, contracts, release boundaries and the local-first quality process.','SOURCE OF TRUTH / GITHUB')+
 '<div class="subsection"><div class="link-list">'+[
 ['Agent capability index','Machine-readable component contracts and safe preview controls','/components/agent-index.json'],
 ['Source repository','Components, schemas and tests','https://github.com/neosmartuxui/neosmartuxui'],
 ['Project overview','Architecture and usage','https://github.com/neosmartuxui/neosmartuxui/blob/main/README.md'],
 ['Public source status','Verified and experimental distinctions','https://github.com/neosmartuxui/neosmartuxui/blob/main/docs/PUBLIC-SOURCE-STATUS.md'],
 ['Experimental gallery','Publication guardrails and proof','https://github.com/neosmartuxui/neosmartuxui/blob/main/docs/EXPERIMENTAL-GALLERY-PUBLISH.md'],
 ['Apache-2.0','Project source license','https://github.com/neosmartuxui/neosmartuxui/blob/main/LICENSE'],
 ['Attribution','Upstream source provenance','https://github.com/neosmartuxui/neosmartuxui/blob/main/docs/THIRD-PARTY-ATTRIBUTION.md'],
 ['Release process','Quality and deployment constraints','https://github.com/neosmartuxui/neosmartuxui/blob/main/docs/FOUNDRY-DEPLOYMENT.md'],
 ['Theme Studio','Edit, preview and export','/studio/']
 ].map(([name,desc,url])=>link(url,'<strong>'+name+'</strong><span>'+desc+' ↗</span>')).join('')+'</div></div></div>';
