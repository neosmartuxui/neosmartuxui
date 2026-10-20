import {readFile,access} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..');
const data=JSON.parse(await readFile(resolve(root,'packages/distribution/release-admission.json'),'utf8'));
if(data.schema!=='neosmartuxui/release-admission@1'||!data.actionsMustRemainDisabled)throw new Error('Guardrail or release record changed unexpectedly');
const blockers=[];
if(!data.localMilestoneValidated)blockers.push('Local integration milestone not signed off by all regressions');
for(const app of ['foundry','studio']){try{await access(resolve(root,'dist',app,'ecosystem'));blockers.push('Local-only catalog present in deployable '+app+' artifact');}catch{}}
if(data.licenseDecision==='pending-owner-SPDX-selection')blockers.push('Named public license still requires explicit owner choice');
try{await access(resolve(root,'LICENSE'));}catch{blockers.push('No canonical LICENSE file');}
if(!data.thirdPartyAttributionReviewed)blockers.push('Third-party contributions/attribution not reviewed');
if(!data.productionProvidersVerified)blockers.push('Production checkout and licensing adapters not verified');
if(!data.publicProofReestablished)blockers.push('New-host live public proof not re-established');
if(!/^[0-9a-f]{40}$/.test(data.exactArtifactSourceSha??''))blockers.push('No pinned deployed-source SHA');
if(!data.publicPublishApproved)blockers.push('No explicit public publishing approval');
if(data.frameworkAdapters!=='browser-dom-esm-only')blockers.push('Unexpected adapter authority');
if(process.argv.includes('--public')){
 if(blockers.length){console.error('[PUBLIC RELEASE BLOCKED]\n- '+blockers.join('\n- '));process.exitCode=1;}
 else console.log('[PUBLIC RELEASE] Required gates recorded as passed; independent manual verification still mandatory.');
}else console.log('[release] local-only state validated; public publishing blocked by '+blockers.length+' gates.');
