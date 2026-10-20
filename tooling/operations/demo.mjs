import * as m from './components.mjs';
const examples=[
 ['stat-card',m.renderStatCard({label:'Active licenses',value:11892,unit:'licenses',description:'Fixture from NeoLicenser UI',status:'normal'})],
 ['activation-meter',m.renderActivationMeter({label:'Licensing activations',active:37,limit:50,description:'Provider sample; seats are tracked separately'})],
 ['integration-status',m.renderIntegrationStatus({id:'payments',name:'Billing provider',health:'degraded',message:'Recent webhook retries',lastCheckedAt:'2026-10-20',publicEndpoint:'./index.html'})],
 ['risk-indicator',m.renderRiskIndicator({level:'high',rationale:'Agent requests release publication rights',source:'Operator review'})],
 ['permission-scope',m.renderPermissionScope({principal:'Agent release helper',scopes:[{id:'release.read',level:'read',description:'Inspect release metadata'},{id:'release.write',level:'write',description:'Submit approved release changes'}]})],
 ['webhook-delivery-log',m.renderWebhookDeliveryLog({deliveries:[{id:'wh-1',event:'invoice.paid',status:'delivered',statusCode:200},{id:'wh-2',event:'license.renewed',status:'failed',statusCode:503}]},{onRetry:async id=>{window.__webhookRetry=id;return {status:'accepted',deliveryId:id};}})],
 ['secret-reference',m.renderOpaqueSecretReference({label:'Billing credentials',reference:'secret:prod/••••',scope:'Billing provider',rotatedAt:'2026-10-10'})],
 ['release-artifact',m.renderReleaseArtifact({id:'release-v1',name:'Neo Plugin v1',version:'1.0.0',checksum:'sha256:'+'a'.repeat(64),status:'verified'},{onRequest:async id=>{window.__artifactRequest=id;return {status:'accepted',artifactId:id};}})],
 ['rollout-stages',m.renderRolloutStages({label:'Progressive rollout',stages:[{id:'canary',name:'Canary',status:'complete',percent:10},{id:'beta',name:'Beta',status:'in_progress',percent:50},{id:'stable',name:'Stable',status:'pending'}]})],
 ['operation-timeline',m.renderOperationTimeline({heading:'Release audit timeline',events:[{id:'a',action:'Package verified',occurredAt:'2026-10-20',actor:'Verifier',outcome:'ok'},{id:'b',action:'Operator review pending',occurredAt:'2026-10-20',actor:'Operator',outcome:'pending'}]})],
 ['usage-chart',m.renderUsageChart({label:'Weekly activations',unit:'activations',points:[{label:'Mon',value:20},{label:'Tue',value:28},{label:'Wed',value:31},{label:'Thu',value:27},{label:'Fri',value:35}]})],
 ['agent-approval-plan',m.renderAgentApprovalPlan({id:'plan-1',title:'Prepare plugin release',risk:'high',status:'proposed',steps:[{id:'1',description:'Read release manifest'},{id:'2',description:'Verify archive integrity'},{id:'3',description:'Request operator approval'}]},{onDecision:async request=>{window.__agentDecision=request;return {planId:request.planId,status:request.decision==='approve'?'approved':'rejected'};}})]
];
const select=document.querySelector('#theme');
const available=new Set(['hardline-light','hardline-dark','soft-light','soft-dark','rivet-light','rivet-dark','mono-light','mono-dark','pulse-light','pulse-dark']);
const fromQuery=new URLSearchParams(location.search).get('theme');
if(available.has(fromQuery))select.value=fromQuery;
const theme=()=>{document.querySelector('#tokens').href='./themes/'+select.value+'.css';document.documentElement.dataset.opsTheme=select.value;};
select.addEventListener('change',theme);theme();
for(const [id,element] of examples){
 const section=document.createElement('section');section.className='example';section.dataset.example=id;
 const header=document.createElement('h2');header.textContent=id;section.append(header,element);document.querySelector('#examples').append(section);
}
document.body.dataset.opsReady='true';
