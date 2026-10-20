import {test,expect} from '@playwright/test';
const ids=['stat-card','activation-meter','integration-status','risk-indicator','permission-scope','webhook-delivery-log','secret-reference','release-artifact','rollout-stages','operation-timeline','usage-chart','agent-approval-plan'];
test.beforeEach(async({page})=>{
 page.__errors=[];
 page.on('pageerror',e=>page.__errors.push(e.message));
 page.on('console',e=>{if(e.type()==='error')page.__errors.push(e.text())});
 page.on('response',r=>{if(r.status()>=400)page.__errors.push(String(r.status())+' '+r.url())});
 await page.goto('/');
 await expect(page.locator('body')).toHaveAttribute('data-ops-ready','true');
});
test('Twelve independent operational components render in the local lab',async({page})=>{
 await expect(page.locator('.example > [data-operations-component]')).toHaveCount(12);
 for(const id of ids)await expect(page.locator('[data-example="'+id+'"] > [data-operations-component="'+id+'"]')).toHaveCount(1);
 await expect(page.locator('[data-example="integration-status"]')).toContainText('degraded');
 await expect(page.locator('[data-example="risk-indicator"]')).toContainText('high');
 await expect(page.locator('[data-example="activation-meter"] progress')).toHaveJSProperty('value',37);
 expect(page.__errors).toEqual([]);
});
test('Approval is explicit and cannot be taken for agent execution',async({page})=>{
 const e=page.locator('[data-example="agent-approval-plan"] > [data-operations-component]');
 const approve=e.getByRole('button',{name:'Approve plan'});
 await approve.click();
 await expect(e).toHaveAttribute('data-state','approved');
 await expect(approve).toBeDisabled();
 expect(await page.evaluate(()=>window.__agentDecision)).toEqual({planId:'plan-1',decision:'approve'});
 await expect(e).toContainText('No execution implied');
 expect(page.__errors).toEqual([]);
});
test('Rejecting an agent plan requires its own confirmed provider callback',async({page})=>{
 const result=await page.evaluate(async()=>{
  const m=await import('/components.mjs');
  const e=m.renderAgentApprovalPlan({id:'plan',title:'Sensitive plan',risk:'critical',status:'proposed',steps:[{id:'1',description:'Proposed action'}]},{onDecision:async input=>({planId:input.planId,status:'rejected'})});
  document.body.append(e);e.querySelectorAll('button')[1].click();
  await new Promise(ok=>setTimeout(ok,30));
  return {state:e.dataset.state,buttons:[...e.querySelectorAll('button')].map(b=>b.disabled)};
 });
 expect(result).toEqual({state:'rejected',buttons:[true,true]});
});
test('An unconfirmed approval cannot change the plan state',async({page})=>{
 const result=await page.evaluate(async()=>{
  const m=await import('/components.mjs');
  const e=m.renderAgentApprovalPlan({id:'plan',title:'Release plan',risk:'high',status:'proposed',steps:[{id:'1',description:'Publish'}]},{onDecision:async()=>({planId:'wrong',status:'approved'})});
  document.body.append(e);e.querySelector('button').click();await new Promise(ok=>setTimeout(ok,30));
  return {state:e.dataset.state,error:e.querySelector('[role=alert]')?.textContent,enabled:[...e.querySelectorAll('button')].every(b=>!b.disabled)};
 });
 expect(result).toEqual({state:'proposed',error:'Decision was not confirmed; plan remains proposed.',enabled:true});
});
test('Webhook retry accepted does not imply delivery',async({page})=>{
 const e=page.locator('[data-example="webhook-delivery-log"] > [data-operations-component]');
 await e.getByRole('button',{name:'Request retry for wh-2'}).click();
 await expect(e).toContainText('delivery not yet verified');
 expect(await page.evaluate(()=>window.__webhookRetry)).toBe('wh-2');
 await expect(e.locator('[data-state="retry-requested"]')).toHaveCount(1);
 expect(page.__errors).toEqual([]);
});
test('Signed artifact requires source verification and host provider',async({page})=>{
 const e=page.locator('[data-example="release-artifact"] > [data-operations-component]');
 await e.getByRole('button',{name:'Request signed artifact'}).click();
 await expect(e).toHaveAttribute('data-state','requested');
 await expect(e).toContainText('Host will handle signed delivery');
 expect(await page.evaluate(()=>window.__artifactRequest)).toBe('release-v1');
 const invalid=await page.evaluate(async()=>{
  const m=await import('/components.mjs');
  const unverified=m.renderReleaseArtifact({id:'a',name:'File',version:'1',status:'unverified'},{onRequest:async()=>{throw Error('Unexpected');}});
  const noProvider=m.renderReleaseArtifact({id:'a',name:'File',version:'1',status:'verified'});
  return {blocked:unverified.querySelector('button').disabled,providerRequired:noProvider.querySelector('button').disabled};
 });
 expect(invalid).toEqual({blocked:true,providerRequired:true});
});
test('Raw credentials and invalid certificate claims are rejected',async({page})=>{
 const outcome=await page.evaluate(async()=>{
  const m=await import('/components.mjs');
  const rejects=fn=>{try{fn();return false}catch{return true}};
  return [
    rejects(()=>m.renderOpaqueSecretReference({label:'Key',reference:'secret-prod-real-key'})),
    rejects(()=>m.renderReleaseArtifact({id:'x',name:'File',version:'1',status:'verified',checksum:'sha256:123'})),
    rejects(()=>m.renderAgentApprovalPlan({id:'p',title:'P',status:'proposed',risk:'low',apiKey:'unredacted',steps:[{id:'1',description:'Read'}]})),
    rejects(()=>m.renderAgentApprovalPlan({id:'p',title:'P',status:'proposed',risk:'low',steps:[{id:'1',description:'Read',token:'unredacted'}]})),
    rejects(()=>m.renderIntegrationStatus({id:'i',name:'Status',health:'healthy',message:'ok',publicEndpoint:'javascript:alert(1)'}))
  ];
 });
 expect(outcome).toEqual([true,true,true,true,true]);
});
test('Operation chart provides a native accessible table with chart values',async({page})=>{
 const e=page.locator('[data-example="usage-chart"] > [data-operations-component]');
 await expect(e.getByRole('img',{name:/Weekly activations bar chart/})).toHaveCount(1);
 await expect(e.locator('table tbody tr')).toHaveCount(5);
 await expect(e.locator('svg rect')).toHaveCount(5);
 await expect(e.locator('table')).toContainText('Fri');
 const invalid=await page.evaluate(async()=>{
  const m=await import('/components.mjs');
  const rejects=fn=>{try{fn();return false}catch{return true}};
  return [rejects(()=>m.renderUsageChart({label:'Test',points:[{label:'M',value:1}]})),rejects(()=>m.renderUsageChart({label:'Test',points:[{label:'M',value:1},{label:'T',value:Infinity}]}))];
 });
 expect(invalid).toEqual([true,true]);
});
test('Permission scopes and rollout identities are validated',async({page})=>{
 const checks=await page.evaluate(async()=>{
  const m=await import('/components.mjs');
  const rejects=fn=>{try{fn();return false}catch{return true}};
  return [
    rejects(()=>m.renderPermissionScope({principal:'p',scopes:[{id:'r',level:'read',description:'a'},{id:'r',level:'admin',description:'b'}]})),
    rejects(()=>m.renderRolloutStages({label:'L',stages:[{id:'a',name:'A',status:'complete',percent:150}]})),
    rejects(()=>m.renderActivationMeter({active:101,limit:100})),
    rejects(()=>m.renderIntegrationStatus({id:'i',name:'N',health:'operational-ish',message:'M'}))
  ];
 });
 expect(checks).toEqual([true,true,true,true]);
});
test('Untrusted textual labels cannot inject markup',async({page})=>{
 const values=await page.evaluate(async()=>{
  const m=await import('/components.mjs');
  const risk=m.renderRiskIndicator({level:'high',rationale:'<img src=x onerror=alert(1)>'});
  const action=m.renderAgentApprovalPlan({id:'p',title:'<script>alert(1)</script>',risk:'low',status:'proposed',steps:[{id:'1',description:'<svg onload=alert(1)>'}]});
  return {injected:risk.querySelector('img,script')!==null||action.querySelector('svg,script')!==null,hasText:risk.textContent.includes('<img src=')&&action.textContent.includes('<script>')};
 });
 expect(values).toEqual({injected:false,hasText:true});
 expect(page.__errors).toEqual([]);
});
for(const theme of ['hardline-light','hardline-dark','soft-light','soft-dark','rivet-light','rivet-dark','mono-light','mono-dark','pulse-light','pulse-dark']){
 test('12 operational surfaces retain '+theme+' canonical Theme',async({page})=>{
   await page.locator('#theme').selectOption(theme);
   await expect(page.locator('html')).toHaveAttribute('data-ops-theme',theme);
   for(const id of ids){
     const item=page.locator('[data-example="'+id+'"] > [data-operations-component="'+id+'"]');
     await expect(item).toBeVisible();
     expect(await item.evaluate(el=>parseFloat(getComputedStyle(el).borderTopWidth))).toBeGreaterThan(0);
   }
   expect(page.__errors).toEqual([]);
 });
}
test('RTL, reduced motion, forced-colors and mobile navigation remain usable',async({page})=>{
 await page.setViewportSize({width:375,height:812});
 await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});
 await page.evaluate(()=>document.documentElement.dir='rtl');
 const action=page.locator('[data-example="agent-approval-plan"] button').first();
 await expect(action).toBeVisible();
 await action.focus();await page.keyboard.press('Enter');
 await expect(page.locator('[data-example="agent-approval-plan"] > [data-operations-component]')).toHaveAttribute('data-state','approved');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
 expect(page.__errors).toEqual([]);
});
