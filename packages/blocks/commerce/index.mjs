/* NeoSmartUXUI Blocks — Commerce compositions. Local only. */
import {renderProductPrice} from '../../verticals/commerce/components.mjs';
const obj=(x,n)=>{if(!x||typeof x!=='object'||Array.isArray(x))throw new TypeError(n+' must be an object');return x};
const str=(x,n)=>{if(typeof x!=='string'||!x.trim())throw new TypeError(n+' must be a nonempty string');return x};
const arr=(x,n)=>{if(!Array.isArray(x))throw new TypeError(n+' must be an array');return x};
const cb=f=>{if(f!==undefined&&typeof f!=='function')throw new TypeError('Host callback must be a function');return f};
const el=(tag,cl='',text)=>{const x=document.createElement(tag);if(cl)x.className=cl;if(text!==undefined)x.textContent=String(text);return x};
const group=(tag,cl,...items)=>{const x=el(tag,cl);x.append(...items.filter(x=>x!==null&&x!==undefined));return x};
const root=(x,name)=>{x.classList.add('ns-block','ns-block-'+name);x.dataset.block=name;return x};
const title=s=>el('h3','ns-block-title',str(s,'heading'));
const muted=s=>el('p','ns-block-muted',String(s));
const button=s=>{const b=el('button','ns-button',s);b.type='button';return b};
const safeUrl=raw=>{str(raw,'URL');const u=new URL(raw,document.baseURI);if(!['http:','https:'].includes(u.protocol)||(u.protocol==='http:'&&u.origin!==location.origin)||u.username||u.password)throw new TypeError('External URL must use HTTPS');return u.href};
const distinct=(xs,key='id')=>{const seen=new Set();for(const x of xs){obj(x,'entry');const id=str(x[key],key);if(seen.has(id))throw new TypeError('Duplicate entry '+id);seen.add(id)}};
export function renderTrustStrip({items,label='Trust evidence'}){
 arr(items,'trust items');if(!items.length)throw new TypeError('At least one evidence item is required');
 const e=root(group('section','ns-card ns-block-trust-strip'),'trust-strip');e.setAttribute('aria-label',label);
 const list=el('ul','ns-block-inline-list');
 for(const item of items){
   obj(item,'trust item');str(item.label,'trust label');str(item.detail,'trust detail');
   list.append(group('li','',el('strong','',item.label),muted(item.detail)));
 }
 e.append(list);return e;
}
export function renderPromoBand({heading,description,actionLabel,promotionCode},{onActivate}={}){
 cb(onActivate);
 const e=root(group('section','ns-card ns-block-promo-band',title(heading),muted(str(description,'description'))),'promo-band');
 if(promotionCode!==undefined)e.append(muted('Promotion code (provider): '+str(promotionCode,'promotion code')));
 const b=button(str(actionLabel,'action label'));b.disabled=!onActivate;
 const status=el('p','ns-block-message');status.setAttribute('aria-live','polite');
 let pending=false;
 b.addEventListener('click',async()=>{
   if(!onActivate||pending)return;
   pending=true;b.disabled=true;status.textContent='Requesting provider offer...';e.dataset.state='processing';
   try{
     const reply=obj(await onActivate(),'provider offer result');
     if(reply.status!=='accepted')throw new TypeError('No accepted offer');
     e.dataset.state='offer-requested';status.textContent='Provider accepted offer request. Checkout totals are not yet confirmed.';
   }catch{e.dataset.state='error';status.textContent='Provider offer not confirmed.';status.setAttribute('role','alert');}
   finally{pending=false;b.disabled=false}
 });
 e.append(b,status);return e;
}
export function renderTestimonials({heading,items}){
 arr(items,'testimonials');if(!items.length)throw new TypeError('Provide at least one testimonial');
 const e=root(group('section','ns-card ns-block-testimonials',title(heading)),'testimonials');
 const list=el('ul','ns-block-cards');
 for(const item of items){
   obj(item,'testimonial');str(item.author,'author');str(item.quote,'quote');
   const row=group('li','ns-card',el('blockquote','',item.quote),el('strong','',item.author));
   if(item.source!==undefined)row.append(muted(str(item.source,'source')));
   list.append(row);
 }
 e.append(list);return e;
}
export function renderGuarantee({heading,terms,policyUrl}){
 const e=root(group('section','ns-card ns-block-guarantee',title(heading),muted(str(terms,'guarantee terms'))),'guarantee');
 if(policyUrl!==undefined){const a=el('a','','Read full policy');a.href=safeUrl(policyUrl);e.append(a)}
 return e;
}
export function renderPlanComparison({heading,plans,locale='en-US'},{onSelect}={}){
 arr(plans,'plans');if(plans.length<2)throw new TypeError('Compare at least two plans');distinct(plans);
 cb(onSelect);
 const e=root(group('section','ns-card ns-block-plan-comparison',title(heading)),'plan-comparison');
 const list=el('div','ns-block-cards');
 for(const plan of plans){
   str(plan.name,'plan name');arr(plan.features,'features');
   const card=group('article','ns-card',title(plan.name));
   card.append(renderProductPrice(plan.price,{locale,interval:plan.interval}));
   const ul=el('ul','ns-block-list');
   for(const feature of plan.features)ul.append(el('li','',str(feature,'feature')));
   card.append(ul);
   const b=button('Choose '+plan.name);b.disabled=!onSelect;
   b.addEventListener('click',()=>onSelect?.(plan.id));
   card.append(b);list.append(card);
 }
 e.append(list);return e;
}
export function renderBundleBuilder({heading,items,selection=[]},{onQuote,locale='en-US'}={}){
 arr(items,'bundle items');if(!items.length)throw new TypeError('Bundle items required');distinct(items);
 arr(selection,'selection');cb(onQuote);
 const enabled=new Set(items.map(x=>x.id));
 if(selection.some(x=>!enabled.has(x)))throw new TypeError('Unknown selected item');
 const chosen=new Set(selection);
 const e=root(group('fieldset','ns-card ns-block-bundle-builder'),'bundle-builder');
 e.append(el('legend','',str(heading,'bundle heading')));
 const list=el('div','ns-block-list');
 for(const item of items){
   str(item.label,'item label');
   const checkbox=el('input');checkbox.type='checkbox';checkbox.value=item.id;checkbox.checked=chosen.has(item.id);
   const row=group('label','ns-block-choice',checkbox,el('span','',item.label));
   checkbox.addEventListener('change',()=>{checkbox.checked?chosen.add(item.id):chosen.delete(item.id)});
   list.append(row);
 }
 e.append(list);
 const action=button('Request bundle quote');action.disabled=!onQuote;
 const output=el('div','ns-block-message');output.setAttribute('aria-live','polite');
 let busy=false;
 action.addEventListener('click',async()=>{
   if(!onQuote||busy)return;
   if(!chosen.size){output.textContent='Select at least one item.';output.setAttribute('role','alert');return;}
   busy=true;action.disabled=true;e.dataset.state='quoting';output.textContent='Waiting for provider quote...';
   try{
     const requested=[...chosen].sort();
     const reply=obj(await onQuote(requested),'bundle quote');
     const returned=arr(reply.itemIds,'quote items').slice().sort();
     if(reply.status!=='quoted'||JSON.stringify(returned)!==JSON.stringify(requested)||!reply.total)throw new TypeError('Provider quote does not match selected bundle');
     output.replaceChildren(el('p','', 'Provider quoted bundle:'),renderProductPrice(reply.total,{locale}));
     e.dataset.state='quoted';
   }catch{output.textContent='Bundle quote not confirmed. No price was assumed.';output.setAttribute('role','alert');e.dataset.state='error';}
   finally{busy=false;action.disabled=false}
 });
 e.append(action,output);
 return e;
}
export function renderAccountNav({label='Account navigation',items,currentId}){
 arr(items,'navigation items');if(!items.length)throw new TypeError('Account pages required');distinct(items);
 if(currentId!==undefined&&!items.some(x=>x.id===currentId))throw new TypeError('Unknown current page');
 const e=root(group('nav','ns-card ns-block-account-nav'),'account-nav');
 e.setAttribute('aria-label',label);
 const list=el('ul','ns-block-inline-list');
 for(const item of items){
   const a=el('a','',str(item.label,'page label'));a.href=safeUrl(item.href);
   if(item.id===currentId)a.setAttribute('aria-current','page');
   list.append(group('li','',a));
 }
 e.append(list);return e;
}
export const COMMERCE_BLOCKS=Object.freeze({
 'block.trust-strip':renderTrustStrip,
 'block.promo-band':renderPromoBand,
 'block.testimonials':renderTestimonials,
 'block.guarantee':renderGuarantee,
 'block.plan-comparison':renderPlanComparison,
 'block.bundle-builder':renderBundleBuilder,
 'block.account-nav':renderAccountNav
});
