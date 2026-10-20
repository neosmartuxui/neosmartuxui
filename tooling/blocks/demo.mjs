import * as b from './blocks/commerce/index.mjs';
import * as t from './templates/operations.mjs';
const money=x=>({amount:x,currency:'USD'});
const cases=[
 ['trust-strip',b.renderTrustStrip({items:[{label:'Documented provenance',detail:'Local build hash available'},{label:'Accessibility checks',detail:'Verified in local browser tests'},{label:'Provider-controlled billing',detail:'No fabricated totals'}]})],
 ['promo-band',b.renderPromoBand({heading:'Preview promotion',description:'Offer terms must be checked by the billing provider',actionLabel:'Request offer',promotionCode:'DEMO'},{onActivate:async()=>{window.__promo=true;return {status:'accepted'}}})],
 ['testimonials',b.renderTestimonials({heading:'Customer statements — fixtures',items:[{author:'Example User',quote:'The setup was clear.',source:'Demonstration only'},{author:'Example Developer',quote:'The API contract was understandable.',source:'Demonstration only'}]})],
 ['guarantee',b.renderGuarantee({heading:'Support policy',terms:'Support applies only under the provider policy and stated coverage.',policyUrl:'./index.html'})],
 ['plan-comparison',b.renderPlanComparison({heading:'Compare digital product plans',plans:[{id:'solo',name:'Individual',price:money(49),interval:'per year',features:['One user','Updates']},{id:'team',name:'Team',price:money(129),interval:'per year',features:['Five users','Updates','Team operations']}]},{onSelect:id=>{window.__planSelection=id;}})],
 ['bundle-builder',b.renderBundleBuilder({heading:'Build your bundle',items:[{id:'studio',label:'Studio Plugin'},{id:'commerce',label:'Commerce Plugin'}],selection:['studio']},{onQuote:async ids=>{window.__bundleRequest=ids;return {status:'quoted',itemIds:ids,total:money(ids.length===1?49:89)}}})],
 ['account-nav',b.renderAccountNav({items:[{id:'account',label:'Overview',href:'./index.html'},{id:'licenses',label:'Licenses',href:'./index.html?tab=licenses'},{id:'invoices',label:'Invoices',href:'./index.html?tab=invoices'}],currentId:'licenses'})]
];
const templates=[
 ['license-ops-dashboard',t.renderLicenseOperationsDashboard({
  stat:{label:'Active licenses',value:11892,description:'Sample data',status:'normal'},
  activations:{label:'Activations',active:36,limit:50},
  integration:{id:'billing',name:'Billing provider',health:'healthy',message:'Sample provider'},
  timeline:{heading:'Account history',events:[{id:'1',action:'License created',occurredAt:'2026-10-20'}]}
 })],
 ['release-operations-console',t.renderReleaseOperationsConsole({
  artifact:{id:'plugin-v1',name:'Neo Plugin',version:'1.0.0',status:'verified',checksum:'sha256:'+'a'.repeat(64)},
  rollout:{label:'Rollout',stages:[{id:'c',name:'Canary',status:'complete',percent:10},{id:'s',name:'Stable',status:'pending'}]},
  agentPlan:{id:'p',title:'Approve staged release',risk:'high',status:'proposed',steps:[{id:'1',description:'Verify manifest'},{id:'2',description:'Seek approval'}]},
  webhooks:{deliveries:[{id:'w',event:'release.published',status:'pending'}]}
 },{onDecision:async request=>{window.__templateApproval=request;return {planId:request.planId,status:request.decision==='approve'?'approved':'rejected'};}})]
];
const render=(id,e,target)=>{
 const s=document.createElement('section');s.className='sample';s.dataset.example=id;
 const heading=document.createElement('h2');heading.textContent=id;s.append(heading,e);
 document.querySelector(target).append(s);
};
for(const [id,e] of cases)render(id,e,'#blocks-gallery');
for(const [id,e] of templates)render(id,e,'#templates-gallery');
const themes=new Set(['hardline-light','hardline-dark','soft-light','soft-dark','rivet-light','rivet-dark','mono-light','mono-dark','pulse-light','pulse-dark']);
const select=document.querySelector('#theme');
const initial=new URLSearchParams(location.search).get('theme');
if(themes.has(initial))select.value=initial;
const switchTheme=()=>{document.querySelector('#tokens').href='./themes/'+select.value+'.css';document.documentElement.dataset.blocksTheme=select.value;};
select.addEventListener('change',switchTheme);switchTheme();
const blockTab=document.querySelector('#show-blocks'),templateTab=document.querySelector('#show-templates');
const selectView=view=>{
 const blocks=view==='blocks';
 document.querySelector('#blocks-gallery').hidden=!blocks;
 document.querySelector('#templates-gallery').hidden=blocks;
 blockTab.setAttribute('aria-pressed',String(blocks));
 templateTab.setAttribute('aria-pressed',String(!blocks));
};
blockTab.addEventListener('click',()=>selectView('blocks'));templateTab.addEventListener('click',()=>selectView('templates'));
document.body.dataset.blocksReady='true';
