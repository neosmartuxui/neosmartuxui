/* NeoSmartUXUI Commerce Wave 3: provider-authoritative checkout/payment UI.
   No payment credentials, provider SDK calls, automatic transactions, or payment-side effects. */
import {formatMoney} from './components.mjs';

const obj=(x,n)=>{if(!x||typeof x!=='object'||Array.isArray(x))throw new TypeError(n+' must be an object');return x};
const str=(x,n)=>{if(typeof x!=='string'||!x.trim())throw new TypeError(n+' must be a nonempty string');return x};
const bool=(x,n)=>{if(typeof x!=='boolean')throw new TypeError(n+' must be boolean');return x};
const list=(x,n)=>{if(!Array.isArray(x))throw new TypeError(n+' must be an array');return x};
const cb=(x,n)=>{if(x!==undefined&&typeof x!=='function')throw new TypeError(n+' must be a callback');return x};
const node=(tag,cls='',text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e};
const group=(tag,cls,...items)=>{const e=node(tag,cls);e.append(...items.filter(x=>x!==null&&x!==undefined));return e};
const root=(e,id)=>{e.classList.add('ns-commerce','ns-commerce-'+id);e.dataset.commerceComponent=id;return e};
const heading=s=>node('h3','ns-commerce-title',str(s,'heading'));
const help=s=>node('p','ns-commerce-muted',s);
const btn=label=>{const b=node('button','ns-button',label);b.type='button';return b};
const message=(e,text,tone='note')=>{e.textContent=text;e.dataset.tone=tone;e.setAttribute('role',tone==='error'?'alert':'status');};
const unsafePaymentField=type=>['password','hidden','number','card','cvv','cvc','expiration','exp','payment-token'].includes(type);
const privateField=/(?:card.?number|cvv|cvc|security.?code|payment.?token|client.?secret|secret|cryptogram|account.?number|token|^pan$)/i;
const scopedId=()=> 'ns-commerce-'+(globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2));
const validEmail=s=> /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const money=m=>formatMoney(m);

export function renderCoupon({label='Coupon code',placeholder='Enter code',appliedCode}={}, {onApply}={}) {
  cb(onApply,'onApply');
  const e=root(group('form','ns-card ns-commerce-coupon'),'coupon');
  const name=scopedId();
  const labelEl=node('label','',str(label,'label'));labelEl.htmlFor=name;
  const input=node('input','ns-commerce-input');input.id=name;input.type='text';input.autocomplete='off';input.maxLength=128;input.placeholder=str(placeholder,'placeholder');
  if(appliedCode!==undefined)input.value=str(appliedCode,'appliedCode');
  const apply=btn('Apply');apply.type='submit';apply.disabled=!onApply;
  const status=node('p','ns-commerce-message');status.setAttribute('aria-live','polite');
  let inFlight=false;
  e.append(labelEl,group('div','ns-commerce-field-row',input,apply),status);
  e.addEventListener('submit',async event=>{
    event.preventDefault();
    if(!onApply||inFlight)return;
    const code=input.value.trim();
    if(!code){message(status,'Enter a coupon code','error');return;}
    inFlight=true;apply.disabled=true;e.dataset.state='processing';message(status,'Checking with the provider...');
    try {
      const response=obj(await onApply(code),'coupon result');
      if(!['accepted','rejected'].includes(response.status))throw new TypeError('Coupon adapter must return accepted or rejected');
      message(status,str(response.message,'provider message'),response.status==='accepted'?'success':'error');
      e.dataset.state=response.status;
    }catch {
      message(status,'Unable to verify coupon. Try again.','error');e.dataset.state='error';
    }finally{inFlight=false;apply.disabled=false;}
  });
  return e;
}

export function renderCheckoutField({id,label,value='',required=false,type='text',autocomplete,helpText,error}={}, {onChange}={}) {
  str(id,'field.id');str(label,'field.label');bool(required,'required');cb(onChange,'onChange');
  if(!['text','email','tel'].includes(type)||unsafePaymentField(type)||privateField.test(id)||privateField.test(label))throw new TypeError('Unsupported or sensitive checkout field');
  if(typeof value!=='string')throw new TypeError('field.value must be a string');
  const e=root(group('div','ns-commerce-checkout-field'),'checkout-field');
  const uid=scopedId();
  const caption=node('label','',label);caption.htmlFor=uid;
  const input=node('input','ns-commerce-input');input.id=uid;input.name=id;input.type=type;input.value=value;input.required=required;
  if(autocomplete!==undefined){
    const allowed=new Set(['name','given-name','family-name','email','tel','street-address','address-line1','address-line2','address-level1','address-level2','postal-code','country-name','organization','off']);
    if(!allowed.has(autocomplete))throw new TypeError('Unknown autocomplete token');
    input.autocomplete=autocomplete;
  }
  const description=helpText!==undefined?help(str(helpText,'helpText')):null;
  if(description){description.id=uid+'-help';input.setAttribute('aria-describedby',description.id);}
  const alert=node('p','ns-commerce-message');
  alert.setAttribute('role','alert');alert.hidden=true;
  const showError=text=>{alert.textContent=text;alert.hidden=!text;if(text)input.setAttribute('aria-invalid','true');else input.removeAttribute('aria-invalid');};
  if(error!==undefined)showError(str(error,'error'));
  input.addEventListener('input',()=>{showError('');onChange?.(id,input.value);});
  e.append(caption,input,description,alert);
  return e;
}

export function renderInvoiceDetails(details,{onSave}={}) {
  obj(details,'invoice details');cb(onSave,'onSave');
  const fields=[
    ['legalName','Legal name','text','organization'],
    ['billingEmail','Billing email','email','email'],
    ['billingAddress','Billing address','text','street-address'],
    ['taxIdentifier','Tax identifier (optional)','text','off']
  ];
  const initial={};
  for(const [key] of fields){
    const value=details[key]??'';
    if(typeof value!=='string')throw new TypeError('Invoice '+key+' must be a string');
    initial[key]=value;
  }
  const e=root(group('form','ns-card ns-commerce-invoice-details'),'invoice-details');
  e.noValidate=true; // Local, recoverable validation; no unsupported browser blocking.
  e.append(heading('Invoice details'));
  const controls={};
  for(const [key,label,type,autocomplete] of fields){
    const field=renderCheckoutField({id:key,label,type,autocomplete,value:initial[key],required:key!=='taxIdentifier'});
    controls[key]=field.querySelector('input');e.append(field);
  }
  const status=node('p','ns-commerce-message');status.setAttribute('aria-live','polite');
  const save=btn('Request billing details update');save.type='submit';save.disabled=!onSave;
  e.append(save,status);
  let pending=false;
  e.addEventListener('submit',async event=>{
    event.preventDefault();if(pending||!onSave)return;
    const draft=Object.fromEntries(Object.entries(controls).map(([key,input])=>[key,input.value.trim()]));
    if(!draft.legalName||!draft.billingAddress||!validEmail(draft.billingEmail)){
      message(status,'Legal name, address, and valid email are required','error');e.dataset.state='invalid';return;
    }
    pending=true;save.disabled=true;e.dataset.state='saving';message(status,'Requesting provider update...');
    try{
      const result=obj(await onSave(draft),'billing update result');
      if(result.status!=='saved'&&result.status!=='rejected')throw new TypeError('Invalid billing update result');
      message(status,str(result.message,'provider message'),result.status==='saved'?'success':'error');
      e.dataset.state=result.status;
    }catch{message(status,'Provider could not save billing details','error');e.dataset.state='error';}
    finally{pending=false;save.disabled=false;}
  });
  return e;
}

export function renderCheckoutSteps({steps,currentId,status='ready'}) {
  const values=list(steps,'steps');
  if(!values.length)throw new TypeError('Checkout steps required');
  if(!['ready','processing','failed','recovered'].includes(status))throw new TypeError('Invalid checkout status');
  const ids=new Set();
  for(const item of values){obj(item,'step');const id=str(item.id,'step.id');str(item.label,'step.label');if(ids.has(id))throw new TypeError('Duplicate step');ids.add(id);}
  if(!ids.has(currentId))throw new TypeError('Unknown current step');
  const e=root(group('nav','ns-card ns-commerce-checkout-steps'),'checkout-steps');
  e.setAttribute('aria-label','Checkout progress');e.dataset.state=status;
  const listEl=node('ol','ns-commerce-checkout-progress');
  for(const item of values){
    const li=node('li','',item.label);
    if(item.id===currentId)li.setAttribute('aria-current','step');
    listEl.append(li);
  }
  e.append(listEl);
  if(status==='processing')e.append(help('Processing with payment provider. Do not submit again.'));
  if(status==='failed')e.append(help('Payment needs attention. Your checkout can be recovered.'));
  return e;
}

export function renderPaymentMethod({methods,selectedId},{onChange}={}) {
  cb(onChange,'onChange');list(methods,'payment methods');
  if(!methods.length)throw new TypeError('Payment methods are required');
  const ids=new Set();
  const e=root(group('fieldset','ns-card ns-commerce-payment-method'),'payment-method');
  e.append(node('legend','','Payment method'));
  const groupName=scopedId();
  for(const method of methods){
    obj(method,'payment method');const id=str(method.id,'payment method id');
    if(ids.has(id))throw new TypeError('Duplicate payment option');ids.add(id);
    if(Object.keys(method).some(key=>privateField.test(key)))throw new TypeError('Do not pass payment secrets into UI models');
    const label=str(method.label,'method label');
    if(method.description!==undefined)str(method.description,'method description');
    const row=node('label','ns-commerce-payment-option');
    const input=node('input');input.type='radio';input.name=groupName;input.value=id;input.checked=id===selectedId;
    input.addEventListener('change',()=>{if(input.checked)onChange?.(id);});
    row.append(input,group('span','',node('strong','',label),method.description?help(method.description):null));
    e.append(row);
  }
  if(selectedId!==undefined&&!ids.has(selectedId))throw new TypeError('Unknown selected method');
  e.append(help('Payment credentials remain with your secure payment provider.'));
  return e;
}

export function renderPaymentFailure({code,message:description,retryable=false},{onRetry}={}) {
  str(code,'failure code');str(description,'failure description');bool(retryable,'retryable');cb(onRetry,'onRetry');
  const e=root(group('section','ns-card ns-commerce-payment-failure'),'payment-failure');
  e.dataset.state='failed';
  const alert=group('div','ns-commerce-message',heading('Payment not completed'),help(description));
  alert.setAttribute('role','alert');
  e.append(alert);
  if(retryable){
    const b=btn('Retry through provider');b.disabled=!onRetry;
    let pending=false;
    b.addEventListener('click',async()=>{
      if(pending||!onRetry)return;
      pending=true;b.disabled=true;e.dataset.state='retrying';
      try{await onRetry(code);e.dataset.state='awaiting-provider';}
      catch {e.dataset.state='failed';alert.append(help('Retry could not start. Your checkout is preserved.'));}
      finally{pending=false;b.disabled=false;}
    });
    e.append(b);
  }
  return e;
}

export function renderPaymentRecovery({quoteId,message:description,status='ready'},{onRecover}={}) {
  str(quoteId,'quoteId');str(description,'recovery message');cb(onRecover,'onRecover');
  if(!['ready','failed','recovered'].includes(status))throw new TypeError('Invalid recovery state');
  const e=root(group('section','ns-card ns-commerce-payment-recovery'),'payment-recovery');
  e.dataset.state=status;
  e.append(heading('Checkout recovery'),help(description));
  const note=node('p','ns-commerce-message');note.setAttribute('aria-live','polite');
  const b=btn('Request recovery');b.disabled=!onRecover||status==='recovered';
  let pending=false;
  b.addEventListener('click',async()=>{
    if(pending||!onRecover)return;
    pending=true;b.disabled=true;e.dataset.state='processing';message(note,'Checking the preserved quote with the provider...');
    try{
      const result=obj(await onRecover(quoteId),'recovery result');
      if(!['recovered','failed'].includes(result.status))throw new TypeError('Invalid provider recovery status');
      e.dataset.state=result.status;
      message(note,str(result.message,'provider message'),result.status==='recovered'?'success':'error');
    }catch{e.dataset.state='failed';message(note,'Recovery request failed; checkout details are preserved.','error');}
    finally{pending=false;b.disabled=e.dataset.state==='recovered'||!onRecover;}
  });
  e.append(b,note);
  return e;
}

export function renderProcessingState({label='Processing payment',message:description='Waiting for the provider to confirm the result',attemptId}) {
  str(label,'processing label');str(description,'processing message');
  if(attemptId!==undefined)str(attemptId,'attemptId');
  const e=root(group('section','ns-card ns-commerce-processing-state'),'processing-state');
  e.dataset.state='processing';e.setAttribute('aria-busy','true');
  const status=group('div','',heading(label),help(description));
  status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  e.append(status);
  return e;
}

export function renderOrderConfirmation(order,{locale='en-US'}={}) {
  obj(order,'order');str(order.id,'order.id');
  if(order.status!=='confirmed')throw new TypeError('Provider-confirmed order required');
  const e=root(group('section','ns-card ns-commerce-order-confirmation'),'order-confirmation');
  e.dataset.state='confirmed';e.append(heading('Order confirmed'),help('Order '+order.id));
  if(order.total!==undefined)e.append(node('strong','',formatMoney(order.total,locale)));
  const rights=order.entitlements??[];
  list(rights,'entitlements');
  if(rights.length){
    const items=node('ul');
    for(const item of rights){
      obj(item,'entitlement');str(item.productId,'productId');
      if(typeof item.delivered!=='boolean')throw new TypeError('delivery confirmation must be boolean');
      items.append(node('li','',item.productId+': '+(item.delivered?'Delivered':'Delivery pending')));
    }
    e.append(items);
  }else e.append(help('Entitlement delivery has not been confirmed by the provider.'));
  return e;
}

export function renderReceipt(receipt,{locale='en-US'}={}) {
  obj(receipt,'receipt');str(receipt.id,'receipt.id');str(receipt.orderId,'receipt.orderId');
  if(receipt.status!=='paid')throw new TypeError('Receipt requires a provider-verified paid status');
  const total=money(receipt.amount);
  const e=root(group('section','ns-card ns-commerce-receipt'),'receipt');
  e.append(heading('Payment receipt'));
  const listEl=node('dl','ns-commerce-summary-list');
  const row=(label,value)=>listEl.append(group('div','ns-commerce-summary-row',node('dt','',label),node('dd','',value)));
  row('Receipt',receipt.id);row('Order',receipt.orderId);row('Amount paid',total);
  row('Payment status','Paid');
  if(receipt.paidAt!==undefined)row('Provider payment date',str(receipt.paidAt,'paidAt'));
  if(receipt.invoiceId!==undefined)row('Linked invoice',str(receipt.invoiceId,'invoiceId'));
  e.append(listEl,help('This transaction receipt is not a tax invoice.'));
  return e;
}

export const COMMERCE_WAVE3_RENDERERS=Object.freeze({
  'commerce.coupon':renderCoupon,
  'commerce.checkout-field':renderCheckoutField,
  'commerce.invoice-details':renderInvoiceDetails,
  'commerce.checkout-steps':renderCheckoutSteps,
  'commerce.payment-method':renderPaymentMethod,
  'commerce.payment-failure':renderPaymentFailure,
  'commerce.payment-recovery':renderPaymentRecovery,
  'commerce.processing-state':renderProcessingState,
  'commerce.order-confirmation':renderOrderConfirmation,
  'commerce.receipt':renderReceipt
});
