/* NeoSmartUXUI Operations vertical — Soft + NeoLicenser UI admission.
 * Written for this project from source behavior models; not a CSS fork.
 * All mutations require explicit host adapters and verified results. */
const obj=(v,n)=>{if(!v||typeof v!=='object'||Array.isArray(v))throw new TypeError(n+' must be an object');return v};
const str=(v,n)=>{if(typeof v!=='string'||!v.trim())throw new TypeError(n+' must be a nonempty string');return v};
const count=(v,n)=>{if(!Number.isSafeInteger(v)||v<0)throw new TypeError(n+' must be a nonnegative safe integer');return v};
const finite=(v,n)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<0)throw new TypeError(n+' must be a nonnegative finite number');return v};
const arr=(v,n)=>{if(!Array.isArray(v))throw new TypeError(n+' must be an array');return v};
const oneOf=(v,allowed,n)=>{if(!allowed.includes(v))throw new TypeError(n+' must be one of '+allowed.join(', '));return v};
const cb=(f)=>{if(f!==undefined&&typeof f!=='function')throw new TypeError('Host action must be a function');return f};
const el=(tag,cl='',text)=>{const x=document.createElement(tag);if(cl)x.className=cl;if(text!==undefined)x.textContent=String(text);return x};
const dom=(tag,cl,...items)=>{const x=el(tag,cl);x.append(...items.filter(x=>x!==undefined&&x!==null));return x};
const component=(x,id)=>{x.classList.add('ns-ops','ns-ops-'+id);x.dataset.operationsComponent=id;return x};
const heading=t=>el('h3','ns-ops-title',str(t,'heading'));
const muted=t=>el('p','ns-ops-muted',String(t));
const badge=t=>el('span','ns-badge',t);
const button=t=>{const b=el('button','ns-button',t);b.type='button';return b};
const status=(target,text,error=false)=>{target.textContent=text;target.setAttribute('role',error?'alert':'status');target.dataset.tone=error?'error':'neutral'};
const displayRows=rows=>{
 const list=el('dl','ns-ops-facts');
 for(const [name,value] of rows)list.append(dom('div','ns-ops-fact',el('dt','',name),el('dd','',String(value))));
 return list;
};
const noSecretKeys=/password|api.?key|secret|token|authorization|credential|private.?key/i;
const safeUrl=value=>{
 str(value,'URL');const u=new URL(value,document.baseURI);
 if(!['https:','http:'].includes(u.protocol)||(u.protocol==='http:'&&u.origin!==location.origin)||u.username||u.password)
   throw new TypeError('External URLs require HTTPS, and credentials in URLs are forbidden');
 return u.href;
};
const unique=(items,key)=>{const seen=new Set();for(const item of items){const id=str(item[key],key);if(seen.has(id))throw new TypeError('Duplicate '+key);seen.add(id)}};
const current=()=>new Date(); // Not used for entitlement decisions.
export function renderStatCard({label,value,unit,description,status:health}){
 str(label,'stat label');
 if(!(typeof value==='number'&&Number.isFinite(value)||typeof value==='string'&&value.trim()))throw new TypeError('Stat value is required');
 if(health!==undefined)oneOf(health,['normal','attention','critical'],'stat status');
 const e=component(dom('article','ns-card ns-ops-stat',el('span','ns-ops-muted',label),el('strong','ns-ops-stat-value',value)), 'stat-card');
 if(unit!==undefined)e.append(el('span','ns-ops-muted',str(unit,'unit')));
 if(description!==undefined)e.append(muted(str(description,'description')));
 if(health!==undefined)e.append(badge(health));
 return e;
}
export function renderActivationMeter({label='Activations',active,limit,description}){
 str(label,'activation label');count(active,'active activations');count(limit,'activation limit');
 if(limit===0||active>limit)throw new TypeError('Activation counts must be within positive limit');
 const e=component(dom('section','ns-card ns-ops-meter',heading(label)),'activation-meter');
 e.append(muted(active+' of '+limit+' licensed activations'));
 const p=el('progress');p.max=limit;p.value=active;p.setAttribute('aria-label',label+' used');
 e.append(p);
 if(description!==undefined)e.append(muted(str(description,'description')));
 return e;
}
export function renderIntegrationStatus({id,name,health,message,lastCheckedAt,publicEndpoint}){
 str(id,'integration id');str(name,'integration name');
 oneOf(health,['healthy','degraded','offline','unknown'],'integration health');
 const e=component(dom('article','ns-card ns-ops-integration',heading(name),badge(health),muted(str(message,'integration message'))),'integration-status');
 e.dataset.state=health;
 if(lastCheckedAt!==undefined)e.append(muted('Last provider check: '+str(lastCheckedAt,'lastCheckedAt')));
 if(publicEndpoint!==undefined){const a=el('a','', 'Public status page');a.href=safeUrl(publicEndpoint);e.append(a)}
 return e;
}
export function renderRiskIndicator({level,rationale,source}){
 oneOf(level,['low','medium','high','critical'],'risk');
 const e=component(dom('section','ns-card ns-ops-risk',heading('Risk assessment'),badge(level),muted(str(rationale,'risk rationale'))),'risk-indicator');
 e.dataset.level=level;
 if(source!==undefined)e.append(muted('Assessment source: '+str(source,'risk source')));
 return e;
}
export function renderPermissionScope({principal,scopes}){
 str(principal,'principal');arr(scopes,'permission scopes');if(!scopes.length)throw new TypeError('At least one permission scope required');
 const e=component(dom('section','ns-card ns-ops-permissions',heading('Permission scope'),muted('Principal: '+principal)),'permission-scope');
 const list=el('ul','ns-ops-list');
 for(const scope of scopes){
   obj(scope,'scope');str(scope.id,'scope id');str(scope.description,'scope description');
   oneOf(scope.level,['read','write','admin'],'permission level');
 }
 unique(scopes,'id');
 for(const scope of scopes)list.append(dom('li','ns-ops-row',dom('strong','',scope.id),badge(scope.level),muted(scope.description)));
 e.append(list);
 return e;
}
export function renderWebhookDeliveryLog({deliveries},{onRetry}={}){
 arr(deliveries,'webhook deliveries');cb(onRetry);
 const e=component(dom('section','ns-card ns-ops-webhooks',heading('Webhook deliveries')),'webhook-delivery-log');
 const list=el('ul','ns-ops-list');unique(deliveries,'id');
 for(const delivery of deliveries){
   obj(delivery,'delivery');str(delivery.id,'delivery id');str(delivery.event,'event');
   oneOf(delivery.status,['delivered','failed','pending'],'delivery status');
   if(delivery.statusCode!==undefined){count(delivery.statusCode,'HTTP status');if(delivery.statusCode<100||delivery.statusCode>599)throw new TypeError('Invalid HTTP status')}
   const row=dom('li','ns-ops-row',dom('strong','',delivery.event),badge(delivery.status),muted('Delivery: '+delivery.id));
   if(delivery.statusCode!==undefined)row.append(muted('HTTP '+delivery.statusCode));
   if(delivery.status==='failed'){
     const retry=button('Request retry for '+delivery.id);retry.disabled=!onRetry;
     let pending=false;
     const note=el('p','ns-ops-action-message');note.setAttribute('aria-live','polite');
     retry.addEventListener('click',async()=>{
       if(!onRetry||pending)return;pending=true;retry.disabled=true;status(note,'Requesting provider retry...');
       try{
         const reply=obj(await onRetry(delivery.id),'retry response');
         if(reply.status!=='accepted'||reply.deliveryId!==delivery.id)throw new TypeError('Retry not accepted by provider');
         status(note,'Retry accepted for processing; delivery not yet verified.');
         row.dataset.state='retry-requested';
       }catch{status(note,'Retry was not accepted. Delivery status remains failed.',true);row.dataset.state='failed';}
       finally{pending=false;retry.disabled=!onRetry}
     });
     row.append(retry,note);
   }
   list.append(row);
 }
 if(!deliveries.length)e.append(muted('No provider deliveries reported.'));
 e.append(list);return e;
}
export function renderOpaqueSecretReference({label,reference,rotatedAt,scope}){
 str(label,'reference label');str(reference,'opaque reference');
 if(!/[*•…]/u.test(reference))throw new TypeError('Only redacted secret references allowed');
 const e=component(dom('section','ns-card ns-ops-secret',heading(label),el('code','',reference)),'secret-reference');
 e.append(muted('Credentials are intentionally unavailable to this UI.'));
 if(rotatedAt!==undefined)e.append(muted('Last rotated: '+str(rotatedAt,'last rotation')));
 if(scope!==undefined)e.append(muted('Scope: '+str(scope,'scope')));
 return e;
}

export function renderReleaseArtifact({id,name,version,checksum,status:verification,createdAt},{onRequest}={}){
 str(id,'artifact id');str(name,'artifact name');str(version,'artifact version');
 oneOf(verification,['verified','unverified','failed'],'verification status');
 if(checksum!==undefined){
   str(checksum,'checksum');
   if(!/^sha256:[a-fA-F0-9]{64}$/.test(checksum))throw new TypeError('Expected SHA-256 hex, not arbitrary integrity claims');
 }
 cb(onRequest);
 const e=component(dom('section','ns-card ns-ops-artifact',heading(name),badge(verification)),'release-artifact');
 e.append(displayRows([['Version',version],['Artifact ID',id],['Provenance',checksum??'Not provided']]));
 if(createdAt)e.append(muted('Provider record: '+str(createdAt,'createdAt')));
 const note=el('p','ns-ops-action-message');note.setAttribute('aria-live','polite');
 const request=button('Request signed artifact');
 request.disabled=!onRequest||verification!=='verified';
 let pending=false;
 request.addEventListener('click',async()=>{
   if(pending||!onRequest||verification!=='verified')return;
   pending=true;request.disabled=true;e.dataset.state='requesting';status(note,'Contacting signed-artifact provider...');
   try{
     const res=obj(await onRequest(id),'artifact response');
     if(res.status!=='accepted'||res.artifactId!==id)throw new TypeError('Unverified artifact request');
     e.dataset.state='requested';status(note,'Provider accepted request. Host will handle signed delivery.');
   }catch{
     e.dataset.state='error';status(note,'Signed artifact request not confirmed.',true);
   }finally{pending=false;request.disabled=false}
 });
 e.append(request,note);return e;
}
export function renderRolloutStages({label,stages}){
 str(label,'release');arr(stages,'stages');if(!stages.length)throw new TypeError('Rollout stages required');
 unique(stages,'id');
 const e=component(dom('section','ns-card ns-ops-rollout',heading(label)),'rollout-stages');
 const list=el('ol','ns-ops-list');
 for(const stage of stages){
   obj(stage,'stage');str(stage.name,'stage name');
   oneOf(stage.status,['pending','in_progress','complete','failed','paused'],'stage state');
   const li=dom('li','ns-ops-row',dom('strong','',stage.name),badge(stage.status));
   if(stage.percent!==undefined){finite(stage.percent,'stage percent');if(stage.percent>100)throw new TypeError('Percent exceeds 100');li.append(muted('Provider coverage: '+stage.percent+'%'))}
   list.append(li);
 }
 e.append(list);
 return e;
}
export function renderOperationTimeline({heading:label,events}){
 str(label,'timeline heading');arr(events,'timeline events');unique(events,'id');
 const e=component(dom('section','ns-card ns-ops-timeline',heading(label)),'operation-timeline');
 const list=el('ol','ns-ops-list');
 for(const event of events){
   obj(event,'event');str(event.action,'action');str(event.occurredAt,'occurredAt');
   const li=dom('li','ns-ops-row',dom('strong','',event.action),muted(event.occurredAt));
   if(event.actor!==undefined)li.append(muted('Actor: '+str(event.actor,'actor')));
   if(event.outcome!==undefined)li.append(badge(oneOf(event.outcome,['ok','warning','failed','pending'],'outcome')));
   list.append(li);
 }
 if(!events.length)e.append(muted('No recorded events. Missing events are not reconstructed.'));
 e.append(list);return e;
}
export function renderUsageChart({label,points,unit='events'}){
 str(label,'chart label');str(unit,'chart unit');arr(points,'chart points');
 if(points.length<2||points.length>60)throw new TypeError('Usage chart accepts 2–60 points');
 const labels=new Set();
 for(const p of points){obj(p,'point');str(p.label,'point label');finite(p.value,'point value');if(labels.has(p.label))throw new TypeError('Duplicate point label');labels.add(p.label)}
 const e=component(dom('section','ns-card ns-ops-chart',heading(label)),'usage-chart');
 const max=Math.max(...points.map(p=>p.value),1);
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox','0 0 480 180');svg.setAttribute('role','img');svg.setAttribute('aria-label',label+' bar chart with '+points.length+' values in '+unit);
 const svgTitle=document.createElementNS('http://www.w3.org/2000/svg','title');svgTitle.textContent=label+' usage by period';svg.append(svgTitle);
 const step=440/points.length;
 for(let i=0;i<points.length;i++){
   const h=130*(points[i].value/max);
   const rect=document.createElementNS('http://www.w3.org/2000/svg','rect');
   rect.setAttribute('x',String(20+i*step+step*.12));rect.setAttribute('y',String(150-h));
   rect.setAttribute('width',String(step*.76));rect.setAttribute('height',String(h));
   rect.setAttribute('fill','currentColor');
   svg.append(rect);
 }
 const details=el('table','ns-ops-visually-hidden');
 const caption=el('caption','',label+' values');details.append(caption);
 const thead=dom('thead','',dom('tr','',el('th','','Period'),el('th','',unit)));details.append(thead);
 const tbody=el('tbody');
 for(const p of points)tbody.append(dom('tr','',el('td','',p.label),el('td','',p.value)));
 details.append(tbody);e.append(svg,details);
 return e;
}
export function renderAgentApprovalPlan(plan,{onDecision}={}){
 obj(plan,'agent plan');str(plan.id,'plan id');str(plan.title,'plan title');
 oneOf(plan.risk,['low','medium','high','critical'],'plan risk');
 oneOf(plan.status,['proposed','approved','rejected','executing','complete'],'plan status');
 arr(plan.steps,'plan steps');if(!plan.steps.length)throw new TypeError('At least one explicit plan step required');
 if(Object.keys(plan).some(k=>noSecretKeys.test(k)))throw new TypeError('Agent plans must not include credentials or tokens');
 cb(onDecision);
 const e=component(dom('section','ns-card ns-ops-approval',heading(plan.title),badge('Risk: '+plan.risk),badge('Status: '+plan.status)),'agent-approval-plan');
 e.dataset.state=plan.status;
 e.append(muted('An approved plan does not imply it executed.'));
 const ol=el('ol','ns-ops-list');
 for(const step of plan.steps){obj(step,'step');str(step.id,'step id');str(step.description,'step description');
   if(Object.keys(step).some(k=>noSecretKeys.test(k)))throw new TypeError('Do not include secrets in agent steps');
   ol.append(dom('li','ns-ops-row',dom('strong','',step.description)));
 }
 unique(plan.steps,'id');e.append(ol);
 const summary=el('p','ns-ops-action-message');summary.setAttribute('aria-live','polite');
 const approve=button('Approve plan'),reject=button('Reject plan');
 const actionAllowed=plan.status==='proposed'&&Boolean(onDecision);
 approve.disabled=reject.disabled=!actionAllowed;
 let busy=false;
 const act=async(decision)=>{
   if(!actionAllowed||busy||e.dataset.state!=='proposed')return;
   busy=true;approve.disabled=reject.disabled=true;e.dataset.state='requesting';status(summary,'Requesting an explicit operator decision...');
   try{
     const response=obj(await onDecision({planId:plan.id,decision}),'approval result');
     if(response.planId!==plan.id||response.status!==(decision==='approve'?'approved':'rejected'))
       throw new TypeError('Provider did not confirm decision');
     e.dataset.state=response.status;status(summary,'Provider recorded: '+response.status+'. No execution implied.');
   }catch{
     e.dataset.state='proposed';status(summary,'Decision was not confirmed; plan remains proposed.',true);
     approve.disabled=reject.disabled=false;
   }finally{busy=false}
 };
 approve.addEventListener('click',()=>act('approve'));reject.addEventListener('click',()=>act('reject'));
 e.append(dom('div','ns-ops-actions',approve,reject),summary);
 return e;
}
export const OPERATIONS_RENDERERS=Object.freeze({
 'operations.stat-card':renderStatCard,
 'operations.activation-meter':renderActivationMeter,
 'operations.integration-status':renderIntegrationStatus,
 'operations.risk-indicator':renderRiskIndicator,
 'operations.permission-scope':renderPermissionScope,
 'operations.webhook-delivery-log':renderWebhookDeliveryLog,
 'operations.secret-reference':renderOpaqueSecretReference,
 'operations.release-artifact':renderReleaseArtifact,
 'operations.rollout-stages':renderRolloutStages,
 'operations.operation-timeline':renderOperationTimeline,
 'operations.usage-chart':renderUsageChart,
 'operations.agent-approval-plan':renderAgentApprovalPlan
});
