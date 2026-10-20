import {test,expect} from '@playwright/test';
const ids=['download-row','purchase-history-row','license-card','invoice-history','activation-row','update-eligibility','renewal-state','plan-change','ownership-transfer','subscription-management','ownership-timeline'];
test.beforeEach(async({page})=>{
 page.__errors=[];
 page.on('pageerror',e=>page.__errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')page.__errors.push(m.text())});
 page.on('response',r=>{if(r.status()>=400)page.__errors.push(r.status()+' '+r.url())});
 await page.goto('/');
 await expect(page.locator('body')).toHaveAttribute('data-commerce-ready','true');
});
test('All eleven Wave 4 account/ownership components are displayed independently',async({page})=>{
 await expect(page.locator('.demo-box > [data-commerce-component]')).toHaveCount(35);
 for(const id of ids)await expect(page.locator('[data-component="'+id+'"] > [data-commerce-component="'+id+'"]')).toHaveCount(1);
 await expect(page.locator('[data-component="license-card"]')).toContainText('Active');
 await expect(page.locator('[data-component="update-eligibility"]')).toContainText('Provider confirms update access');
 await expect(page.locator('[data-component="purchase-history-row"]')).toContainText('not proof of an active license');
 await expect(page.locator('[data-component="ownership-transfer"]')).toContainText('pending invitation does not transfer ownership');
 expect(page.__errors).toEqual([]);
});
test('Download row delegates to signed-download provider callback only when eligible',async({page})=>{
 const e=page.locator('[data-component="download-row"]');
 await e.getByRole('button',{name:'Request secure download'}).click();
 await expect.poll(()=>page.evaluate(()=>window.__wave4Download)).toBe('entitlement-1');
 const blocked=await page.evaluate(async()=>{
  const m=await import('/wave4.mjs');
  const x=m.renderDownloadRow({id:'e',productId:'P',version:'1.0',eligible:false});
  return {buttons:x.querySelectorAll('button').length,message:x.textContent.includes('No signed download')};
 });
 expect(blocked).toEqual({buttons:0,message:true});
 expect(page.__errors).toEqual([]);
});
test('Purchase and invoice history distinguish paid transaction from entitlements',async({page})=>{
 await expect(page.locator('[data-component="invoice-history"] [data-commerce-component="invoice-history"] li')).toHaveCount(1);
 await expect(page.locator('[data-component="invoice-history"] a')).toHaveAttribute('href',/index.html$/);
 const a=await page.evaluate(async()=>{
  const m=await import('/wave4.mjs');
  const empty=m.renderInvoiceHistory({invoices:[]});
  const refused=(()=>{try{m.renderInvoiceHistory({invoices:[{id:'i',status:'paid',amount:{amount:10,currency:'USD'},href:'javascript:alert(1)'}]});return false}catch{return true}})();
  return {empty:empty.textContent.includes('No provider invoices'),refused};
 });
 expect(a).toEqual({empty:true,refused:true});
});
test('License card rejects raw license keys and keeps entitlement distinct from license state',async({page})=>{
 const verdict=await page.evaluate(async()=>{
  const m=await import('/wave4.mjs');
  const rejects=fn=>{try{fn();return false}catch{return true}};
  const base={id:'l1',productId:'Kit',status:'active'};
  return [
   rejects(()=>m.renderLicenseCard({...base,maskedKey:'RAW-12345'})),
   rejects(()=>m.renderLicenseCard({...base,entitlement:{active:'yes',reason:'Unknown'}})),
   m.renderLicenseCard({...base,entitlement:{active:false,reason:'Separate entitlement denied'}}).textContent.includes('Not currently allowed')
  ];
 });
 expect(verdict).toEqual([true,true,true]);
 expect(page.__errors).toEqual([]);
});
test('Activation is separate from seat assignments and rejects unrecognized state',async({page})=>{
 await expect(page.locator('[data-component="activation-row"]')).toContainText('not a seat assignment');
 const invalid=await page.evaluate(async()=>{
  const m=await import('/wave4.mjs');
  try{m.renderActivationRow({id:'a',licenseId:'l',status:'assigned-seat'});return false}catch{return true}
 });
 expect(invalid).toBe(true);
});
test('Renewal only records provider-confirmed outcome, and action cannot repeat',async({page})=>{
 const region=page.locator('[data-component="renewal-state"] [data-commerce-component="renewal-state"]');
 await region.getByRole('button',{name:'Request license renewal'}).click();
 await expect(region).toHaveAttribute('data-state','confirmed');
 await expect(region.getByRole('button')).toBeDisabled();
 expect(await page.evaluate(()=>window.__renewalRequest)).toBe('license-100');
 const bad=await page.evaluate(async()=>{
  const m=await import('/wave4.mjs');
  const x=m.renderRenewalState({licenseId:'l',status:'expired',message:'Expired',renewable:true},{onRenew:async()=>({status:'pending',message:'Not confirmed'})});
  document.body.append(x);x.querySelector('button').click();
  await new Promise(ok=>setTimeout(ok,40));
  return {state:x.dataset.state,text:x.querySelector('[role=alert]')?.textContent};
 });
 expect(bad).toEqual({state:'failed',text:'The provider could not confirm this request. No change is assumed.'});
});
test('Plan change requires a quote before submit and honors provider quote identity',async({page})=>{
 const e=page.locator('[data-component="plan-change"] [data-commerce-component="plan-change"]');
 const quote=e.getByRole('button',{name:'Request plan quote'});
 const submit=e.getByRole('button',{name:'Submit quoted change'});
 await expect(submit).toBeDisabled();
 await quote.click();
 await expect(e).toHaveAttribute('data-state','quoted');
 await expect(submit).toBeEnabled();
 expect((await page.evaluate(()=>window.__planQuoteRequest)).targetSeats).toBe(5);
 await submit.click();
 await expect(e).toHaveAttribute('data-state','complete');
 await expect(submit).toBeDisabled();
 expect((await page.evaluate(()=>window.__planSubmitRequest)).quoteId).toBe('quote-123');
 expect(page.__errors).toEqual([]);
});
test('Unsafe immediate seat downgrade is blocked before requesting a quote',async({page})=>{
 const verdict=await page.evaluate(async()=>{
  const m=await import('/wave4.mjs');
  const x=m.renderPlanChange({licenseId:'l',currentSeats:10,targetSeats:5,currentPlan:'Team',targetPlan:'Lite'},{onQuote:async()=>{window.__unsafeQuote=true;return {status:'quoted'}},onSubmit:async()=>{}});
  document.body.append(x);
  return {disabled:x.querySelectorAll('button')[0].disabled,submitDisabled:x.querySelectorAll('button')[1].disabled,note:x.textContent.includes('immediate change is blocked')};
 });
 expect(verdict).toEqual({disabled:true,submitDisabled:true,note:true});
 expect(await page.evaluate(()=>window.__unsafeQuote??false)).toBe(false);
});
test('A forged or mismatched quote cannot authorize a plan change',async({page})=>{
 const result=await page.evaluate(async()=>{
  const m=await import('/wave4.mjs');
  let submissions=0;
  const x=m.renderPlanChange({licenseId:'l',currentSeats:2,targetSeats:3,currentPlan:'Lite',targetPlan:'Team'},{onQuote:async()=>({status:'quoted',quoteId:'q',licenseId:'another-license',targetPlan:'Team',targetSeats:3,description:'quote'}),onSubmit:async()=>{submissions++;}});
  document.body.append(x);x.querySelector('button').click();await new Promise(ok=>setTimeout(ok,60));
  return {state:x.dataset.state,submitDisabled:x.querySelectorAll('button')[1].disabled,submissions};
 });
 expect(result).toEqual({state:'failed',submitDisabled:true,submissions:0});
});
test('Provider quote with unknown or excessive assigned seats cannot authorize downgrade',async({page})=>{
 const checks=await page.evaluate(async()=>{
  const m=await import('/wave4.mjs');
  const inputs=[undefined,6,1.5];
  const verdict=[];
  for(const seats of inputs){
   let submitted=0;
   const e=m.renderPlanChange({licenseId:'l',currentSeats:2,targetSeats:5,currentPlan:'Solo',targetPlan:'Team'},{
    onQuote:async()=>({status:'quoted',quoteId:'q',licenseId:'l',targetPlan:'Team',targetSeats:5,assignedSeats:seats,description:'Provider quote'}),
    onSubmit:async()=>{submitted++;return {status:'complete',quoteId:'q',message:'Done'}}
   });
   document.body.append(e);e.querySelector('button').click();
   await new Promise(ok=>setTimeout(ok,30));
   verdict.push({status:e.dataset.state,disabled:e.querySelectorAll('button')[1].disabled,submitted});
  }
  return verdict;
 });
 expect(checks).toEqual(Array.from({length:3},()=>({status:'failed',disabled:true,submitted:0})));
});
test('Transfer invitation only creates pending state, not completed ownership',async({page})=>{
 const e=page.locator('[data-component="ownership-transfer"] [data-commerce-component="ownership-transfer"]');
 const input=e.getByRole('textbox',{name:'Invite new owner by email'});
 await input.fill('new@example.test');
 await e.getByRole('button',{name:'Send transfer invitation'}).click();
 await expect(e).toContainText('Invitation pending. Ownership has not changed.');
 expect((await page.evaluate(()=>window.__transferRequest)).recipient).toBe('new@example.test');
 await expect(e).toContainText('Current owner: Demo Owner');
 await e.getByRole('button',{name:'Cancel invitation for pending@example.test'}).click();
 await expect(e).toContainText('Invitation cancelled. Current ownership remains unchanged.');
 expect((await page.evaluate(()=>window.__transferCancel)).invitationId).toBe('inv-1');
});
test('Transfers reject invalid recipients without invoking provider',async({page})=>{
 const result=await page.evaluate(async()=>{
  const m=await import('/wave4.mjs');
  let calls=0;const e=m.renderOwnershipTransfer({licenseId:'l',ownerLabel:'Owner'},{onInvite:async()=>{calls++;return {status:'pending',invitationId:'1'}}});
  document.body.append(e);e.querySelector('input').value='not-email';e.querySelector('button').click();
  await new Promise(ok=>setTimeout(ok,30));
  return {calls,error:e.querySelector('[role=alert]')?.textContent};
 });
 expect(result).toEqual({calls:0,error:'Enter a valid recipient email.'});
});
test('Subscription cancel-at-period-end preserves billing status and supports resume',async({page})=>{
 const e=page.locator('[data-component="subscription-management"] [data-commerce-component="subscription-management"]');
 await e.getByRole('button',{name:'Cancel at period end'}).click();
 await expect(e).toHaveAttribute('data-state','cancel_at_period_end');
 await expect(e).toContainText('2027-10-20');
 expect(await page.evaluate(()=>window.__subscriptionCancel)).toBe('subscription-100');
 await e.getByRole('button',{name:'Resume subscription'}).click();
 await expect(e).toHaveAttribute('data-state','active');
 expect(await page.evaluate(()=>window.__subscriptionResume)).toBe('subscription-100');
});
test('Failed subscription update never asserts the desired state',async({page})=>{
 const result=await page.evaluate(async()=>{
  const m=await import('/wave4.mjs');
  const e=m.renderSubscriptionManagement({id:'s',plan:'Team',status:'active',message:'Provider billing'},{onCancel:async()=>({status:'cancelled',message:'Not the requested state'})});
  document.body.append(e);e.querySelector('button').click();await new Promise(ok=>setTimeout(ok,60));
  return {state:e.dataset.state,error:e.querySelector('[role=alert]')?.textContent};
 });
 expect(result).toEqual({state:'active',error:'Provider did not confirm billing change. Refresh subscription status.'});
});
test('A failed resume preserves the last provider-confirmed scheduled cancellation',async({page})=>{
 const result=await page.evaluate(async()=>{
  const m=await import('/wave4.mjs');
  const e=m.renderSubscriptionManagement({id:'s',plan:'Pro',status:'active',message:'Valid term',paidThrough:'2027-10-20'},{
    onCancel:async()=>({status:'cancel_at_period_end',message:'Ends at period end'}),
    onResume:async()=>({status:'cancelled',message:'Unexpected'})
  });
  document.body.append(e);
  e.querySelectorAll('button')[0].click();
  await new Promise(ok=>setTimeout(ok,40));
  const afterCancel=e.dataset.state;
  e.querySelectorAll('button')[1].click();
  await new Promise(ok=>setTimeout(ok,40));
  return {afterCancel,afterFailedResume:e.dataset.state,firstDisabled:e.querySelectorAll('button')[0].disabled,resumeEnabled:!e.querySelectorAll('button')[1].disabled};
 });
 expect(result).toEqual({afterCancel:'cancel_at_period_end',afterFailedResume:'cancel_at_period_end',firstDisabled:true,resumeEnabled:true});
});
test('Plan change cannot submit while provider quote is still pending',async({page})=>{
 const result=await page.evaluate(async()=>{
  const m=await import('/wave4.mjs');
  let resolveQuote,submits=0;
  const wait=new Promise(done=>resolveQuote=done);
  const e=m.renderPlanChange({licenseId:'l',currentSeats:1,targetSeats:4,currentPlan:'Solo',targetPlan:'Team'},{
   onQuote:()=>wait,onSubmit:async()=>{submits++;return {status:'complete',quoteId:'q',message:'Done'}}
  });
  document.body.append(e);
  const buttons=e.querySelectorAll('button');
  buttons[0].click();buttons[0].click();buttons[1].click();
  const before={state:e.dataset.state,disabled:buttons[1].disabled,submits};
  resolveQuote({status:'quoted',quoteId:'q',licenseId:'l',targetSeats:4,targetPlan:'Team',assignedSeats:1,description:'Quoted'});
  await new Promise(ok=>setTimeout(ok,40));
  return {before,after:e.dataset.state,enabled:!buttons[1].disabled,submits};
 });
 expect(result).toEqual({before:{state:'processing',disabled:true,submits:0},after:'quoted',enabled:true,submits:0});
});
test('Ownership timeline only renders provider evidence, no synthesized events',async({page})=>{
 const timeline=page.locator('[data-component="ownership-timeline"]');
 await expect(timeline.locator('li')).toHaveCount(1);
 const verdict=await page.evaluate(async()=>{
  const m=await import('/wave4.mjs');
  const empty=m.renderOwnershipTimeline({licenseId:'l',events:[]});
  let rejected=false;
  try{m.renderOwnershipTimeline({licenseId:'l',events:[{id:'a',action:'Created',occurredAt:'2026-10-20'},{id:'a',action:'Moved',occurredAt:'2026-10-21'}]})}catch{rejected=true}
  return {empty:empty.textContent.includes('Missing events are not reconstructed'),rejected};
 });
 expect(verdict).toEqual({empty:true,rejected:true});
});
test('No provider input is executed as HTML',async({page})=>{
 const verdict=await page.evaluate(async()=>{
  const m=await import('/wave4.mjs');
  const li=m.renderOwnershipTimeline({licenseId:'l',events:[{id:'1',action:'<img src=x onerror=alert(1)>',occurredAt:'2026-10-20'}]});
  const license=m.renderLicenseCard({id:'l',productId:'<script>alert(1)</script>',status:'active'});
  return {injection:li.querySelector('img,script')!==null||license.querySelector('script')!==null,text:li.textContent.includes('<img src=x')&&license.textContent.includes('<script>')};
 });
 expect(verdict).toEqual({injection:false,text:true});
 expect(page.__errors).toEqual([]);
});
for(const theme of ['hardline-light','hardline-dark','soft-light','soft-dark','rivet-light','rivet-dark','mono-light','mono-dark','pulse-light','pulse-dark']){
 test('All 11 Wave4 components use canonical '+theme+' Theme',async({page})=>{
   await page.locator('#theme').selectOption(theme);
   await expect(page.locator('html')).toHaveAttribute('data-commerce-theme',theme);
   for(const id of ids){
     const e=page.locator('[data-component="'+id+'"] > [data-commerce-component="'+id+'"]');
     await expect(e).toBeVisible();
     const border=await e.evaluate(x=>parseFloat(getComputedStyle(x).borderTopWidth));
     expect(border).toBeGreaterThan(0);
   }
   expect(page.__errors).toEqual([]);
 });
}
test('Mobile RTL + forced colors + reduced motion keep account controls usable',async({page})=>{
 await page.setViewportSize({width:375,height:812});
 await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});
 await page.evaluate(()=>document.documentElement.dir='rtl');
 const transfer=page.locator('[data-component="ownership-transfer"]');
 await transfer.getByRole('textbox',{name:'Invite new owner by email'}).fill('user@example.test');
 await expect(transfer.getByRole('button',{name:'Send transfer invitation'})).toBeVisible();
 await expect(page.locator('[data-component="plan-change"] button').first()).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
 expect(page.__errors).toEqual([]);
});
