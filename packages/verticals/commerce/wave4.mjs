/* NeoSmartUXUI Commerce Wave 4 — account, licensing and ownership UI.
 * Domain models are provider-owned; these components do not perform real mutations. */
import {formatMoney,renderLicenseStatus,renderDownloadEntitlement} from './components.mjs';
const obj=(x,n)=>{if(!x||typeof x!=='object'||Array.isArray(x))throw new TypeError(n+' must be an object');return x;};
const str=(x,n)=>{if(typeof x!=='string'||!x.trim())throw new TypeError(n+' must be nonempty');return x;};
const bool=(x,n)=>{if(typeof x!=='boolean')throw new TypeError(n+' must be boolean');return x;};
const arr=(x,n)=>{if(!Array.isArray(x))throw new TypeError(n+' must be an array');return x;};
const callback=(x,n)=>{if(x!==undefined&&typeof x!=='function')throw new TypeError(n+' must be a function');return x;};
const pick=(x,values,n)=>{if(!values.includes(x))throw new TypeError(n+' unsupported state');return x;};
const dom=(tag,cl='',text)=>{const x=document.createElement(tag);if(cl)x.className=cl;if(text!==undefined)x.textContent=String(text);return x;};
const block=(tag,cl,...children)=>{const x=dom(tag,cl);x.append(...children.filter(x=>x!==null&&x!==undefined));return x;};
const root=(x,id)=>{x.classList.add('ns-commerce','ns-commerce-'+id);x.dataset.commerceComponent=id;return x;};
const title=t=>dom('h3','ns-commerce-title',str(t,'title'));
const muted=t=>dom('p','ns-commerce-muted',String(t));
const badge=t=>dom('span','ns-badge',t);
const button=t=>{const b=dom('button','ns-button',t);b.type='button';return b;};
const note=(e,text,tone='neutral')=>{e.textContent=text;e.dataset.tone=tone;e.setAttribute('role',tone==='error'?'alert':'status');};
const safeUrl=raw=>{
 str(raw,'link');const u=new URL(raw,document.baseURI);
 if(!['http:','https:'].includes(u.protocol)||(u.protocol==='http:'&&u.origin!==location.origin)||u.username||u.password)
   throw new TypeError('Only same-origin URLs or external HTTPS links are allowed');
 return u.href;
};
const refValue=(name,value)=>block('div','ns-commerce-summary-row',dom('dt','',name),dom('dd','',str(value,name)));
const dataList=(entries)=>{const x=dom('dl','ns-commerce-summary-list');for(const [k,v] of entries)x.append(refValue(k,v));return x;};
const masked=val=>{str(val,'masked license key');if(!/[•*…]/u.test(val))throw new TypeError('Unmasked license keys must not be rendered');return val;};
/* A caller callback must return an authoritative result. UI never invents a successful outcome. */
const providerAction=(parent,label,onAction,{initial='rest',success='confirmed',argument,onResult}={})=>{
 callback(onAction,label);const b=button(label);b.disabled=!onAction;
 const output=dom('p','ns-commerce-action-message');output.setAttribute('aria-live','polite');
 let waiting=false;
 b.addEventListener('click',async()=>{
   if(waiting||!onAction)return;
   waiting=true;b.disabled=true;parent.dataset.state='processing';note(output,'Waiting for provider confirmation…');
   try{
     const response=obj(await onAction(argument),'provider result');
     if(typeof onResult==='function'){onResult(response,parent,output,b);}
     else{
       if(response.status!=='confirmed')throw new TypeError('Provider confirmation required');
       parent.dataset.state=success;note(output,str(response.message,'provider message'),'success');
     }
   }catch{
     parent.dataset.state='failed';note(output,'The provider could not confirm this request. No change is assumed.','error');
   }finally{
     waiting=false;
     if(parent.dataset.state!=='complete'&&parent.dataset.state!=='confirmed')b.disabled=false;
   }
 });
 parent.dataset.state=initial;parent.append(b,output);return {button:b,output};
};
const amount=(m,locale='en-US')=>formatMoney(m,locale);

export function renderDownloadRow(entry,{onRequest}={}){
 obj(entry,'download row');str(entry.id,'entitlement ID');str(entry.productId,'product ID');str(entry.version,'version');
 bool(entry.eligible,'eligible');callback(onRequest,'onRequest');
 const e=root(block('article','ns-card ns-commerce-account-row',title(entry.productId),muted('Version '+entry.version)),'download-row');
 e.append(badge(entry.eligible?'Eligible':'Unavailable'));
 if(entry.reason!==undefined)e.append(muted(str(entry.reason,'eligibility reason')));
 if(entry.eligible){
  // Existing entitlement component owns the provider callback, without navigation or signed URLs.
  e.append(renderDownloadEntitlement({id:entry.id,productId:entry.productId,downloadAllowed:true},{onRequest}));
 }else e.append(muted('No signed download will be requested.'));
 return e;
}

export function renderPurchaseHistoryRow(order,{locale='en-US'}={}){
 obj(order,'purchase');str(order.id,'order ID');
 pick(order.status,['paid','pending','refunded','failed'],'order');
 const e=root(block('article','ns-card ns-commerce-account-row',title('Order '+order.id),badge(order.status)),'purchase-history-row');
 if(order.purchasedAt!==undefined)e.append(muted('Provider recorded: '+str(order.purchasedAt,'purchase date')));
 if(order.total!==undefined)e.append(muted('Order total: '+amount(order.total,locale)));
 if(order.invoiceId)e.append(muted('Invoice reference: '+str(order.invoiceId,'invoice ID')));
 e.append(muted('Order history is not proof of an active license.'));
 return e;
}

export function renderLicenseCard(license){
 obj(license,'license');str(license.id,'license ID');str(license.productId,'product ID');
 pick(license.status,['active','grace','expired','cancelled','refunded'],'license');
 const e=root(block('article','ns-card ns-commerce-account-card'),'license-card');
 e.append(renderLicenseStatus({id:license.id,productId:license.productId,status:license.status,maskedKey:license.maskedKey,updatesThrough:license.updatesThrough}));
 if(license.scope!==undefined)e.append(muted('Scope: '+str(license.scope,'license scope')));
 if(license.entitlement!==undefined){
   obj(license.entitlement,'entitlement');
   bool(license.entitlement.active,'entitlement.active');
   str(license.entitlement.reason,'entitlement.reason');
   e.append(dataList([['Entitlement',license.entitlement.active?'Allowed':'Not currently allowed'],['Reason',license.entitlement.reason]]));
 }
 return e;
}

export function renderInvoiceHistory({invoices,heading='Invoices'},{locale='en-US'}={}){
 arr(invoices,'invoices');const e=root(block('section','ns-card ns-commerce-account-list',title(heading)),'invoice-history');
 if(!invoices.length)e.append(muted('No provider invoices available.'));
 const list=dom('ul','ns-commerce-account-items');
 const seen=new Set();
 for(const invoice of invoices){
   obj(invoice,'invoice');const id=str(invoice.id,'invoice ID');
   if(seen.has(id))throw new TypeError('Duplicate invoice');seen.add(id);
   pick(invoice.status,['draft','open','paid','void','uncollectible'],'invoice');
   const item=dom('li','ns-commerce-account-item');
   item.append(dom('strong','',id),badge(invoice.status),muted(amount(invoice.amount,locale)));
   if(invoice.issuedAt!==undefined)item.append(muted('Issued: '+str(invoice.issuedAt,'issue date')));
   if(invoice.href!==undefined){const a=dom('a','','View invoice');a.href=safeUrl(invoice.href);item.append(a);}
   list.append(item);
 }
 e.append(list);return e;
}

export function renderActivationRow(activation){
 obj(activation,'activation');str(activation.id,'activation ID');str(activation.licenseId,'license ID');
 pick(activation.status,['active','inactive','revoked'],'activation');
 const e=root(block('article','ns-card ns-commerce-account-row',title('Activation '+activation.id),badge(activation.status)),'activation-row');
 if(activation.site!==undefined)e.append(muted('Site: '+str(activation.site,'site scope')));
 if(activation.lastSeenAt!==undefined)e.append(muted('Last reported: '+str(activation.lastSeenAt,'last seen')));
 e.append(muted('An activation is not a seat assignment or subscription.'));
 return e;
}

export function renderUpdateEligibility(entitlement){
 obj(entitlement,'update entitlement');str(entitlement.productId,'product ID');
 pick(entitlement.status,['active','grace','expired'],'entitlement');
 bool(entitlement.allowed,'updates allowed');str(entitlement.reason,'update entitlement reason');
 const e=root(block('section','ns-card ns-commerce-account-card',title('Update eligibility — '+entitlement.productId)),'update-eligibility');
 e.dataset.state=entitlement.status;
 e.append(badge(entitlement.allowed?'Updates allowed':'Updates unavailable'),muted(entitlement.reason));
 if(entitlement.updatesThrough!==undefined)e.append(muted('Provider update window: '+str(entitlement.updatesThrough,'updatesThrough')));
 return e;
}

export function renderRenewalState(renewal,{onRenew}={}){
 obj(renewal,'renewal');str(renewal.licenseId,'license ID');
 pick(renewal.status,['active','grace','expired','cancelled','past_due'],'renewal');
 str(renewal.message,'renewal consequence');callback(onRenew,'onRenew');
 const e=root(block('section','ns-card ns-commerce-account-card',title('License renewal'),badge(renewal.status),muted(renewal.message)),'renewal-state');
 e.dataset.state=renewal.status;
 if(renewal.renewable){
   providerAction(e,'Request license renewal',onRenew,{initial:renewal.status,success:'confirmed',argument:renewal.licenseId});
 }
 return e;
}

export function renderPlanChange({licenseId,currentSeats,targetSeats,currentPlan,targetPlan},{onQuote,onSubmit}={}){
 str(licenseId,'license ID');str(currentPlan,'current plan');str(targetPlan,'target plan');
 if(!Number.isSafeInteger(currentSeats)||currentSeats<0||!Number.isSafeInteger(targetSeats)||targetSeats<1)
   throw new TypeError('Plan capacity must be a nonnegative/current and positive/target integer');
 callback(onQuote,'onQuote');callback(onSubmit,'onSubmit');
 const e=root(block('section','ns-card ns-commerce-operation',title('Plan change')),'plan-change');
 e.dataset.state='ready';
 e.append(dataList([['Current plan',currentPlan],['Requested plan',targetPlan],['Assigned seats',String(currentSeats)],['Target capacity',String(targetSeats)]]));
 const warning=muted(targetSeats<currentSeats?'Target capacity is smaller than existing assignments; an immediate change is blocked.':'A provider quote is required before any plan change.');
 e.append(warning);
 const ask=button('Request plan quote');const submit=button('Submit quoted change');
 const result=dom('p','ns-commerce-action-message');result.setAttribute('aria-live','polite');
 ask.disabled=!onQuote||targetSeats<currentSeats;submit.disabled=true;
 let pending=false,verifiedQuote=null;
 ask.addEventListener('click',async()=>{
   if(pending||!onQuote||targetSeats<currentSeats)return;
   pending=true;ask.disabled=true;e.dataset.state='processing';note(result,'Requesting a provider quote…');
   verifiedQuote=null;submit.disabled=true;
   try{
     const answer=obj(await onQuote({licenseId,targetPlan,targetSeats}),'plan quote');
     if(answer.status!=='quoted'||!answer.quoteId||answer.licenseId!==licenseId||answer.targetPlan!==targetPlan||answer.targetSeats!==targetSeats)
       throw new TypeError('Unverified or mismatched quote');
     if(!Number.isSafeInteger(answer.assignedSeats)||answer.assignedSeats<0||answer.blocked===true||answer.assignedSeats>targetSeats)throw new TypeError('Provider must confirm safe current seat allocation');
     str(answer.description,'quote description');
     verifiedQuote={quoteId:str(answer.quoteId,'quote ID'),licenseId,targetPlan,targetSeats};
     e.dataset.state='quoted';note(result,answer.description,'success');submit.disabled=!onSubmit;
   }catch{e.dataset.state='failed';note(result,'Provider could not supply a safe quote. No change was made.','error');}
   finally{pending=false;ask.disabled=!onQuote||targetSeats<currentSeats;}
 });
 submit.addEventListener('click',async()=>{
   if(pending||!onSubmit||!verifiedQuote)return;
   pending=true;ask.disabled=true;submit.disabled=true;e.dataset.state='processing';note(result,'Waiting for provider plan-change confirmation…');
   try{
     const reply=obj(await onSubmit({...verifiedQuote}),'plan-change response');
     if(reply.status!=='complete'||reply.quoteId!==verifiedQuote.quoteId)
       throw new TypeError('Provider did not complete quoted plan change');
     e.dataset.state='complete';note(result,str(reply.message,'provider confirmation'),'success');
   }catch{e.dataset.state='failed';note(result,'Plan change not confirmed. Refresh the quote before retrying.','error');verifiedQuote=null;}
   finally{pending=false;ask.disabled=!onQuote||targetSeats<currentSeats;submit.disabled=true;}
 });
 e.append(block('div','ns-commerce-account-actions',ask,submit),result);return e;
}

export function renderOwnershipTransfer({licenseId,ownerLabel,pendingInvitations=[]},{onInvite,onCancel}={}){
 str(licenseId,'license ID');str(ownerLabel,'current owner');arr(pendingInvitations,'pending invitations');
 callback(onInvite,'onInvite');callback(onCancel,'onCancel');
 const e=root(block('section','ns-card ns-commerce-operation',title('Ownership transfer')),'ownership-transfer');
 e.dataset.state='ready';
 e.append(muted('Current owner: '+ownerLabel),muted('A pending invitation does not transfer ownership.'));
 const seen=new Set();
 const items=dom('ul','ns-commerce-account-items');
 const records=dom('div','ns-commerce-transfer-pending');
 for(const invitation of pendingInvitations){
   obj(invitation,'invitation');str(invitation.id,'invitation ID');str(invitation.recipient,'recipient');
   pick(invitation.status,['pending','accepted','expired','cancelled'],'invitation');
   if(seen.has(invitation.id))throw new TypeError('Duplicate invitation');seen.add(invitation.id);
   const li=block('li','ns-commerce-account-item',dom('strong','',invitation.recipient),badge(invitation.status));
   if(invitation.status==='pending'&&onCancel){
     const cancel=button('Cancel invitation for '+invitation.recipient);
     let pending=false;
     cancel.addEventListener('click',async()=>{
       if(pending)return;
       pending=true;cancel.disabled=true;note(records,'Requesting cancellation…');
       try{
         const response=obj(await onCancel({licenseId,invitationId:invitation.id}),'cancellation');
         if(response.status!=='cancelled'||response.invitationId!==invitation.id)throw new TypeError('Unconfirmed cancellation');
         cancel.disabled=true;li.querySelector('.ns-badge').textContent='cancelled';
         note(records,'Invitation cancelled. Current ownership remains unchanged.','success');
       }catch{note(records,'Cancellation not confirmed. Invitation may remain pending.','error');cancel.disabled=false;}
       finally{pending=false;}
     });
     li.append(cancel);
   }
   items.append(li);
 }
 e.append(items);
 const label=dom('label','','Invite new owner by email');const input=dom('input','ns-commerce-input');input.type='email';input.autocomplete='email';input.placeholder='new-owner@example.com';
 const unique='ns-transfer-'+(globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2));input.id=unique;label.htmlFor=unique;
 const action=button('Send transfer invitation');action.disabled=!onInvite;
 let pending=false;
 const validation=()=> /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
 action.addEventListener('click',async()=>{
   if(!onInvite||pending)return;
   if(!validation()){note(records,'Enter a valid recipient email.','error');return;}
   pending=true;action.disabled=true;e.dataset.state='processing';note(records,'Requesting a transfer invitation…');
   try{
     const response=obj(await onInvite({licenseId,recipient:input.value.trim()}),'invite result');
     if(response.status!=='pending'||!response.invitationId)throw new TypeError('Pending invitation confirmation required');
     e.dataset.state='ready';note(records,'Invitation pending. Ownership has not changed.','success');
   }catch{e.dataset.state='failed';note(records,'Invitation was not confirmed. Ownership remains unchanged.','error');}
   finally{pending=false;action.disabled=!onInvite;}
 });
 e.append(block('div','ns-commerce-transfer-form',label,input,action),records);records.setAttribute('aria-live','polite');
 return e;
}

export function renderSubscriptionManagement(subscription,{onCancel,onResume}={}){
 obj(subscription,'subscription');str(subscription.id,'subscription ID');str(subscription.plan,'plan');
 pick(subscription.status,['active','cancel_at_period_end','cancelled','past_due'],'subscription');
 str(subscription.message,'billing state message');
 callback(onCancel,'onCancel');callback(onResume,'onResume');
 const e=root(block('section','ns-card ns-commerce-operation',title('Subscription management')),'subscription-management');
 e.dataset.state=subscription.status;
 const statusBadge=badge(subscription.status);
 const explanation=muted(subscription.message);
 e.append(block('div','ns-commerce-status-line',statusBadge),muted('Plan: '+subscription.plan),explanation);
 if(subscription.paidThrough!==undefined)e.append(muted('Provider-paid term through: '+str(subscription.paidThrough,'paidThrough')));
 const out=dom('p','ns-commerce-action-message');out.setAttribute('aria-live','polite');
 const cancel=button('Cancel at period end');const resume=button('Resume subscription');
 const updateControls=state=>{
   cancel.disabled=!onCancel||state!=='active';
   resume.disabled=!onResume||state!=='cancel_at_period_end';
 };
 let authoritativeStatus=subscription.status;
 updateControls(authoritativeStatus);
 let busy=false;
 const operate=async(kind)=>{
   const fn=kind==='cancel'?onCancel:onResume;
   if(!fn||busy)return;
   busy=true;cancel.disabled=resume.disabled=true;note(out,'Waiting for billing provider…');e.dataset.state='processing';
   try{
     const result=obj(await fn(subscription.id),'subscription response');
     const expected=kind==='cancel'?'cancel_at_period_end':'active';
     if(result.status!==expected)throw new TypeError('Provider did not confirm new state');
     str(result.message,'provider message');
     authoritativeStatus=expected;e.dataset.state=expected;statusBadge.textContent=expected;note(out,result.message,'success');updateControls(authoritativeStatus);
   }catch{
     // Never substitute requested state for actual subscription state.
     e.dataset.state=authoritativeStatus;statusBadge.textContent=authoritativeStatus;
     note(out,'Provider did not confirm billing change. Refresh subscription status.','error');updateControls(authoritativeStatus);
   }finally{busy=false;}
 };
 cancel.addEventListener('click',()=>operate('cancel'));resume.addEventListener('click',()=>operate('resume'));
 e.append(block('div','ns-commerce-account-actions',cancel,resume),out);
 return e;
}

export function renderOwnershipTimeline({licenseId,events,heading='Ownership history'}){
 str(licenseId,'license ID');arr(events,'events');
 const e=root(block('section','ns-card ns-commerce-account-list',title(heading)),'ownership-timeline');
 const list=dom('ol','ns-commerce-timeline-list');const ids=new Set();
 for(const item of events){
   obj(item,'ownership event');const id=str(item.id,'event ID');
   if(ids.has(id))throw new TypeError('Duplicate event');ids.add(id);
   str(item.action,'event action');str(item.occurredAt,'event time');
   const li=block('li','ns-commerce-timeline-entry',dom('strong','',item.action),muted('Provider recorded: '+item.occurredAt));
   if(item.actor!==undefined)li.append(muted('Actor: '+str(item.actor,'event actor')));
   list.append(li);
 }
 if(!events.length)e.append(muted('No provider history available. Missing events are not reconstructed.'));
 e.append(list);return e;
}

export const COMMERCE_WAVE4_RENDERERS=Object.freeze({
 'commerce.download-row':renderDownloadRow,
 'commerce.purchase-history-row':renderPurchaseHistoryRow,
 'commerce.license-card':renderLicenseCard,
 'commerce.invoice-history':renderInvoiceHistory,
 'commerce.activation-row':renderActivationRow,
 'commerce.update-eligibility':renderUpdateEligibility,
 'commerce.renewal-state':renderRenewalState,
 'commerce.plan-change':renderPlanChange,
 'commerce.ownership-transfer':renderOwnershipTransfer,
 'commerce.subscription-management':renderSubscriptionManagement,
 'commerce.ownership-timeline':renderOwnershipTimeline
});
