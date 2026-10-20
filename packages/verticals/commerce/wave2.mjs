/* Commerce Wave 2: independent domain controls using NeoSmartUXUI Core classes and token styling. */
import {renderProductPrice,renderProductGallery} from './components.mjs';

const obj=(x,name)=>{if(!x||typeof x!=='object'||Array.isArray(x))throw new TypeError(name+' must be an object');return x};
const str=(x,name)=>{if(typeof x!=='string'||!x.trim())throw new TypeError(name+' must be nonempty');return x};
const whole=(x,name)=>{if(!Number.isSafeInteger(x)||x<0)throw new TypeError(name+' must be nonnegative integer');return x};
const el=(tag,cl='',value)=>{const e=document.createElement(tag);if(cl)e.className=cl;if(value!==undefined)e.textContent=String(value);return e};
const wrap=(tag,cl,...children)=>{const e=el(tag,cl);e.append(...children.filter(Boolean));return e};
const root=(e,id)=>{e.classList.add('ns-commerce','ns-commerce-'+id);e.dataset.commerceComponent=id;return e};
const button=(name)=>{const e=el('button','ns-button',name);e.type='button';return e};
const title=(value)=>el('h3','ns-commerce-title',str(value,'title'));
const muted=(value)=>el('p','ns-commerce-muted',value);
const httpsOrRelative=(raw)=>{
  str(raw,'URL');
  const u=new URL(raw,document.baseURI);
  if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.protocol==='http:'&&u.origin!==location.origin)
    throw new TypeError('Only HTTPS or same-origin URLs are accepted');
  return u.href;
};
const validateOffers=(offers)=>{
  if(!Array.isArray(offers)||!offers.length)throw new TypeError('Expected at least one offer');
  const keys=new Set();
  for(const offer of offers){
    obj(offer,'offer');const id=str(offer.id,'offer.id');
    if(keys.has(id))throw new TypeError('Duplicate offer ID');keys.add(id);
    str(offer.label,'offer.label');
    if(!offer.price)throw new TypeError('Offer price missing');
    // Reuse the proven money validation via the canonical price renderer.
    renderProductPrice(offer.price);
  }
  return offers;
};
const renderOffer=(offer,locale)=>renderProductPrice(offer.price,{locale,interval:offer.interval});

export function renderProductDetail(product,{offerId,locale='en-US'}={}){
  obj(product,'product');str(product.id,'product.id');str(product.name,'product.name');
  const offers=validateOffers(product.offers);
  const chosen=offerId?offers.find(o=>o.id===offerId):offers.length===1?offers[0]:null;
  if(!chosen)throw new TypeError('Select offerId for products with multiple offers');
  const e=root(wrap('article','ns-card ns-commerce-detail'), 'product-detail');
  e.append(title(product.name));
  if(product.description!==undefined)e.append(muted(str(product.description,'description')));
  e.append(renderOffer(chosen,locale));
  if(product.availability!==undefined)e.append(el('span','ns-badge',str(product.availability,'availability')));
  if(product.image){
    const image=el('img','ns-commerce-detail-image');
    image.src=httpsOrRelative(product.image.src);
    image.alt=str(product.image.alt,'image.alt');
    image.loading='lazy';
    e.prepend(image);
  }
  return e;
}

export function renderProductMedia({label,preview,code,files},{initial='preview'}={}){
  str(label,'media.label');
  const views={};
  if(preview){
    obj(preview,'preview');
    const img=el('img');img.src=httpsOrRelative(preview.src);img.alt=str(preview.alt,'preview.alt');
    views.preview=wrap('div','ns-commerce-media-preview',img);
  }
  if(code!==undefined)views.code=wrap('pre','ns-commerce-media-code',el('code','',str(code,'media.code')));
  if(files!==undefined){
    if(!Array.isArray(files)||!files.length)throw new TypeError('files must be a nonempty array');
    const list=el('ul','ns-commerce-media-files');
    for(const file of files)list.append(el('li','',str(file,'file name')));
    views.files=list;
  }
  const keys=Object.keys(views);
  if(!keys.length||!keys.includes(initial))throw new TypeError('At least one supported initial view is required');
  const e=root(wrap('section','ns-card ns-commerce-media'), 'product-media');
  const heading=title(label);
  const tablist=el('div','ns-commerce-media-tabs');
  tablist.setAttribute('role','tablist');tablist.setAttribute('aria-label',label+' media');
  const content=el('div','ns-commerce-media-panel');
  content.setAttribute('role','tabpanel');
  const uid='commerce-media-'+(globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2));
  const tabs={};
  let selected=initial;
  const update=(key,{focus=false}={})=>{
    selected=key;
    for(const [id,b] of Object.entries(tabs)){
      b.setAttribute('aria-selected',String(id===key));
      b.tabIndex=id===key?0:-1;
    }
    content.replaceChildren(views[key]);
    content.setAttribute('aria-labelledby',tabs[key].id);
    if(focus)tabs[key].focus();
    e.dataset.view=key;
  };
  for(const key of keys){
    const b=el('button','ns-button',key[0].toUpperCase()+key.slice(1));
    b.type='button';b.setAttribute('role','tab');b.id=uid+'-'+key;
    b.setAttribute('aria-controls',uid+'-panel');
    b.addEventListener('click',()=>update(key));
    b.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();
      const next=event.key==='Home'?0:event.key==='End'?keys.length-1:(keys.indexOf(selected)+(event.key==='ArrowLeft'?-1:1)+keys.length)%keys.length;
      update(keys[next],{focus:true});
    });
    tabs[key]=b;tablist.append(b);
  }
  content.id=uid+'-panel';
  e.append(heading,tablist,content);
  update(initial);
  return e;
}

export function renderReviewSummary({rating,count,caption='Customer reviews'}){
  if(typeof rating!=='number'||!Number.isFinite(rating)||rating<0||rating>5)throw new TypeError('rating must be 0..5');
  whole(count,'review count');
  const e=root(wrap('section','ns-card ns-commerce-reviews'), 'review-summary');
  e.append(title(caption));
  const score=el('strong','ns-commerce-review-score',new Intl.NumberFormat('en-US',{maximumFractionDigits:1}).format(rating)+' / 5');
  const display=wrap('div','ns-commerce-review-head',score,el('span','ns-commerce-muted',count+' reviews'));
  e.append(display);
  // Rating counts come from the provider; do not infer stars from sentiment text.
  const meter=el('meter','');meter.min=0;meter.max=5;meter.value=rating;meter.setAttribute('aria-label',caption+' average rating');
  e.append(meter);
  return e;
}

export function renderLicenseSelector({label='License',offers,selectedId},{onChange,locale='en-US'}={}){
  str(label,'license label');const items=validateOffers(offers);
  if(selectedId!==undefined&&!items.some(o=>o.id===selectedId))throw new TypeError('Unknown selected offer');
  if(onChange!==undefined&&typeof onChange!=='function')throw new TypeError('onChange must be a function');
  const e=root(wrap('fieldset','ns-card ns-commerce-license-selector'), 'license-selector');
  e.append(el('legend','',label));
  const group=el('div','ns-commerce-license-options');
  const id='commerce-offer-'+(globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2));
  for(const offer of items){
    const choice=el('label','ns-commerce-license-option');
    const input=el('input');input.type='radio';input.name=id;input.value=offer.id;input.checked=offer.id===selectedId;
    const copy=wrap('span','',el('strong','',offer.label),renderOffer(offer,locale));
    choice.append(input,copy);
    input.addEventListener('change',()=>{if(input.checked)onChange?.(offer.id);});
    group.append(choice);
  }
  e.append(group);
  return e;
}

export function renderRenewalNote({label='Renewal terms',message,renewsAt,policyUrl}){
  const e=root(wrap('aside','ns-card ns-commerce-renewal'), 'renewal-note');
  e.append(title(label),muted(str(message,'renewal message')));
  if(renewsAt!==undefined)e.append(el('p','ns-commerce-muted','Provider renewal date: '+str(renewsAt,'renewsAt')));
  if(policyUrl!==undefined){
    const a=el('a','', 'Read renewal policy');a.href=httpsOrRelative(policyUrl);e.append(a);
  }
  return e;
}

export function renderPricingTier(offer,{onSelect,locale='en-US'}={}){
  obj(offer,'offer');str(offer.id,'offer.id');str(offer.label,'offer.label');
  const e=root(wrap('article','ns-card ns-commerce-pricing-tier'), 'pricing-tier');
  e.dataset.state='rest';
  e.append(title(offer.label),renderOffer(offer,locale));
  if(offer.description!==undefined)e.append(muted(str(offer.description,'offer.description')));
  if(offer.features!==undefined){
    if(!Array.isArray(offer.features))throw new TypeError('Features must be an array');
    const ul=el('ul');
    for(const feature of offer.features)ul.append(el('li','',str(feature,'feature')));
    e.append(ul);
  }
  if(onSelect!==undefined&&typeof onSelect!=='function')throw new TypeError('onSelect must be a callback');
  const cta=button('Select '+offer.label);
  if(!onSelect){cta.disabled=true;cta.title='Provider integration required';}
  let pending=false;
  cta.addEventListener('click',async()=>{
    if(pending||!onSelect)return;
    pending=true;cta.disabled=true;e.dataset.state='requesting';
    e.querySelector('[role=alert]')?.remove();
    try{await onSelect(offer.id);e.dataset.state='rest';}
    catch(err){
      e.dataset.state='error';
      const error=el('p','',err instanceof Error?err.message:'Unable to select offer');
      error.setAttribute('role','alert');e.append(error);
    }finally{pending=false;cta.disabled=false;}
  });
  e.append(cta);
  return e;
}

export const COMMERCE_WAVE2_RENDERERS=Object.freeze({
  'commerce.product-detail':renderProductDetail,
  'commerce.product-media':renderProductMedia,
  'commerce.review-summary':renderReviewSummary,
  'commerce.license-selector':renderLicenseSelector,
  'commerce.renewal-note':renderRenewalNote,
  'commerce.pricing-tier':renderPricingTier
});
