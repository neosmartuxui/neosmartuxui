/* NeoSmartUXUI local template compositions — not a new primitive registry. */
import {renderStatCard,renderActivationMeter,renderIntegrationStatus,renderOperationTimeline,renderReleaseArtifact,renderRolloutStages,renderAgentApprovalPlan,renderWebhookDeliveryLog} from '../verticals/operations/components.mjs';
const obj=(o,n)=>{if(!o||typeof o!=='object'||Array.isArray(o))throw new TypeError(n+' must be an object');return o};
const el=(tag,cl='',text)=>{const e=document.createElement(tag);if(cl)e.className=cl;if(text!==undefined)e.textContent=String(text);return e};
const section=(label,content)=>{const e=el('section','ns-template-module');const h=el('h3','',label);e.append(h,content);return e};
const assemble=(id,title,items)=>{const main=el('article','ns-template');main.dataset.template=id;main.setAttribute('aria-label',title);const h=el('h2','',title);main.append(h);for(const [name,content] of items)main.append(section(name,content));return main};
export function renderLicenseOperationsDashboard(data){
 obj(data,'dashboard');
 return assemble('license-ops-dashboard','License operations dashboard',[
 ['License performance',renderStatCard(data.stat)],
 ['Activation capacity',renderActivationMeter(data.activations)],
 ['Integrations',renderIntegrationStatus(data.integration)],
 ['Audit history',renderOperationTimeline(data.timeline)]
 ]);
}
export function renderReleaseOperationsConsole(data,{onRequest,onDecision,onRetry}={}){
 obj(data,'release console');
 return assemble('release-operations-console','Release operations console',[
 ['Verified artifact',renderReleaseArtifact(data.artifact,{onRequest})],
 ['Rollout',renderRolloutStages(data.rollout)],
 ['Operator approval',renderAgentApprovalPlan(data.agentPlan,{onDecision})],
 ['Webhook status',renderWebhookDeliveryLog(data.webhooks,{onRetry})]
 ]);
}
export const TEMPLATE_RENDERERS=Object.freeze({
 'template.license-ops-dashboard':renderLicenseOperationsDashboard,
 'template.release-operations-console':renderReleaseOperationsConsole
});
