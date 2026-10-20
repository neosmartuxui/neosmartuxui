/* NeoSmartUXUI Commerce Vertical — local, model-driven DOM components.
   No untrusted HTML rendering, no provider side-effects, no hardcoded Flavor decisions. */
const requireObject = (value,name) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(name+" must be an object");
  return value;
};
const requireString = (value,name) => {
  if (typeof value !== "string" || !value.trim()) throw new TypeError(name+" must be a nonempty string");
  return value;
};
const nonnegative = (value,name) => {
  if (typeof value !== "number" || !Number.isFinite(value) || value<0) throw new TypeError(name+" must be finite and nonnegative");
  return value;
};
const positiveInt = (value,name) => {
  if (!Number.isSafeInteger(value) || value<1) throw new TypeError(name+" must be a positive safe integer");
  return value;
};
const node = (tag,classes="",text) => {
  const el=document.createElement(tag);
  if(classes) el.className=classes;
  if(text!==undefined) el.textContent=String(text);
  return el;
};
const group = (tag,classes,...children) => {
  const e=node(tag,classes);
  for(const c of children) if(c!==undefined&&c!==null) e.append(c);
  return e;
};
const asRoot = (element,slug) => {
  element.classList.add("ns-commerce","ns-commerce-"+slug);
  element.dataset.commerceComponent=slug;
  return element;
};
const title = (s,tag="h3") => node(tag,"ns-commerce-title",requireString(s,"title"));
const muted = (s) => node("span","ns-commerce-muted",String(s));
const badge = (s,tone) => {
  const e=node("span","ns-badge",s);
  if(tone) e.dataset.tone=tone;
  return e;
};
const asMoney = (money) => {
  requireObject(money,"Money");
  nonnegative(money.amount,"Money.amount");
  if(!/^[A-Z]{3}$/.test(requireString(money.currency,"Money.currency"))) throw new TypeError("Money.currency must be ISO 4217 uppercase code");
  // Validate that the runtime recognizes the ISO currency code before formatting.
  try { new Intl.NumberFormat("en-US",{style:"currency",currency:money.currency}); }
  catch { throw new TypeError("Unsupported currency "+money.currency); }
  return money;
};
export const formatMoney = (money,locale="en-US") => {
  const m=asMoney(money);
  return new Intl.NumberFormat(locale,{style:"currency",currency:m.currency}).format(m.amount);
};
const sameCurrency = (items) => {
  const codes=new Set(items.map(x=>asMoney(x).currency));
  if(codes.size>1) throw new TypeError("Mixed currencies are not a displayable single order total");
};
const safeUrl = (input) => {
  requireString(input,"URL");
  const u=new URL(input,document.baseURI);
  if(u.username||u.password||u.protocol!=="https:"&&u.origin!==document.location.origin) throw new TypeError("Only same-origin or external HTTPS URLs allowed");
  if(!["https:","http:"].includes(u.protocol)) throw new TypeError("Unsupported URL protocol");
  return u.href;
};
const actionButton = (text) => {
  const b=node("button","ns-button",text);
  b.type="button";
  return b;
};
const errorMessage = (error) => error instanceof Error ? error.message : "Action failed. Please retry.";

export function renderProductPrice(money,{locale="en-US",compareAt,interval,renewal}={}) {
  const e=asRoot(group("div","ns-commerce-price"),"product-price");
  e.append(node("strong","",formatMoney(money,locale)));
  if(compareAt!==undefined){
    asMoney(compareAt);sameCurrency([money,compareAt]);
    if(compareAt.amount<=money.amount) throw new TypeError("compareAt must exceed current price");
    e.append(node("del","",formatMoney(compareAt,locale)));
  }
  if(interval!==undefined) e.append(node("small","",requireString(interval,"interval")));
  if(renewal!==undefined) e.append(node("small","",requireString(renewal,"renewal")));
  return e;
}

export function renderProductCard(product,{offerId,locale="en-US"}={}) {
  requireObject(product,"ProductView");
  requireString(product.id,"ProductView.id");
  const name=requireString(product.name,"ProductView.name");
  if(!Array.isArray(product.offers)||!product.offers.length) throw new TypeError("ProductView.offers must contain a priced offer");
  const offer=offerId ? product.offers.find(x=>x.id===offerId) : product.offers.length===1 ? product.offers[0] : null;
  if(!offer) throw new TypeError("Select offerId explicitly when multiple offers exist");
  const e=asRoot(group("article","ns-card"),"product-card");
  const art=group("div","ns-commerce-product-art");
  if(product.image?.src){
    const img=node("img");
    img.src=safeUrl(product.image.src);
    img.alt=requireString(product.image.alt,"ProductView.image.alt");
    img.loading="lazy";
    art.append(img);
  }else art.append(node("strong","",name.slice(0,2).toUpperCase()));
  const heading=title(name);
  if(product.route){
    const link=node("a","",name);
    link.href=safeUrl(product.route);
    heading.replaceChildren(link);
  }
  e.append(art,heading);
  if(product.summary)e.append(node("p","ns-commerce-muted",product.summary));
  e.append(renderProductPrice(offer.price,{locale,interval:offer.interval}));
  if(product.status)e.append(badge(product.status));
  return e;
}

export function renderProductGallery({label,images}) {
  if(!Array.isArray(images)||!images.length) throw new TypeError("Product gallery requires at least one image");
  const caption=requireString(label,"ProductMedia.label");
  const sources=images.map((x,i)=>{
    requireObject(x,"image "+i);
    return {src:safeUrl(x.src),alt:requireString(x.alt,"image.alt"),label:requireString(x.label,"image.label")};
  });
  const main=node("img");main.src=sources[0].src;main.alt=sources[0].alt;
  const viewport=group("div","ns-commerce-gallery-main",main);
  const controls=group("div","ns-commerce-gallery-choices");
  controls.setAttribute("role","group");
  controls.setAttribute("aria-label",caption+" image choices");
  const buttons=sources.map((source,i)=>{
    const button=node("button","",source.label);
    button.type="button";
    button.setAttribute("aria-label","View "+source.label+" of "+caption);
    button.setAttribute("aria-pressed",String(i===0));
    button.addEventListener("click",()=>{
      main.src=source.src;main.alt=source.alt;
      buttons.forEach((b,j)=>b.setAttribute("aria-pressed",String(i===j)));
    });
    return button;
  });
  controls.append(...buttons);
  const e=asRoot(group("div","",viewport,controls),"product-gallery");
  e.setAttribute("aria-label",caption+" gallery");
  return e;
}

export function renderCartLine(line,{onRemove,locale="en-US"}={}) {
  requireObject(line,"CartLineView");
  requireString(line.id,"CartLineView.id");
  const label=requireString(line.label,"CartLineView.label");
  positiveInt(line.quantity,"CartLineView.quantity");
  sameCurrency([line.unitPrice,line.subtotal]);
  const e=asRoot(group("article","ns-card"),"cart-line");
  e.dataset.state="rest";
  const details=group("div","",
    title(label),
    group("div","ns-commerce-cart-meta",
      muted("Quantity: "+line.quantity),
      muted("Unit: "+formatMoney(line.unitPrice,locale)),
      node("strong","",formatMoney(line.subtotal,locale))
    )
  );
  e.append(details);
  if(onRemove!==undefined){
    if(typeof onRemove!=="function") throw new TypeError("onRemove must be a callback");
    const button=actionButton("Remove");
    button.setAttribute("aria-label","Remove "+label+" from cart");
    let pending=false;
    button.addEventListener("click",async()=>{
      if(pending)return;
      pending=true;button.disabled=true;
      button.textContent="Removing";e.dataset.state="removing";
      e.querySelector('[role="alert"]')?.remove();
      try {
        await onRemove(line.id);
        // The host owns canonical cart state and decides whether to rerender.
        e.dataset.state="rest";
      } catch(err) {
        e.dataset.state="error";
        e.append(node("p","",errorMessage(err)));
        e.lastChild.setAttribute("role","alert");
      } finally {
        pending=false;button.disabled=false;button.textContent="Remove";
      }
    });
    e.append(button);
  }
  return e;
}

export function renderOrderSummary(quote,{locale="en-US",heading="Order summary"}={}) {
  requireObject(quote,"CartView or CheckoutQuoteView");
  const subtotal=asMoney(quote.subtotal);
  const total=asMoney(quote.total);
  const discounts=quote.discounts??[];
  const taxes=quote.taxes??[];
  if(!Array.isArray(discounts)||!Array.isArray(taxes)) throw new TypeError("discounts and taxes must be arrays");
  const extras=[...discounts,...taxes];
  for(const [i,entry] of extras.entries()) {
    requireObject(entry,"adjustment "+i);
    requireString(entry.label,"adjustment.label");
    asMoney(entry.amount);
  }
  sameCurrency([subtotal,total,...extras.map(x=>x.amount)]);
  const e=asRoot(group("section","ns-card ns-commerce-order-summary"),"order-summary");
  e.append(title(heading,"h3"));
  const list=group("dl","ns-commerce-summary-list");
  const row=(label,money,{negative=false,isTotal=false}={})=>{
    const amount=negative ? "−"+formatMoney(money,locale) : formatMoney(money,locale);
    const entry=group("div","ns-commerce-summary-row"+(isTotal?" ns-commerce-summary-total":""),node("dt","",label),node("dd","",amount));
    list.append(entry);
  };
  row("Subtotal",subtotal);
  for(const entry of discounts) row(entry.label,entry.amount,{negative:true});
  for(const entry of taxes) row(entry.label,entry.amount);
  row("Total",total,{isTotal:true});
  e.append(list);
  return e;
}

const STATUS={
  active:["Active","success"],
  grace:["Grace period","warning"],
  expired:["Expired","error"],
  cancelled:["Cancelled","neutral"],
  refunded:["Refunded","neutral"]
};
export function renderLicenseStatus(license) {
  requireObject(license,"LicenseView");
  requireString(license.id,"LicenseView.id");
  requireString(license.productId,"LicenseView.productId");
  if(!Object.hasOwn(STATUS,license.status)) throw new TypeError("Unsupported LicenseView status");
  const [label,tone]=STATUS[license.status];
  const e=asRoot(group("section","ns-card ns-commerce-license-status"),"license-status");
  e.dataset.state=license.status;
  e.setAttribute("aria-label","License for "+license.productId);
  e.append(group("div","ns-commerce-status-line",title(license.productId),badge(label,tone)));
  if(license.maskedKey!==undefined) {
    const masked=requireString(license.maskedKey,"maskedKey");
    if(!/[*•…]/u.test(masked))throw new TypeError("License key must be masked by the provider");
    e.append(node("p","ns-commerce-muted","License: "+masked));
  }
  if(license.updatesThrough!==undefined&&license.updatesThrough!==null){
    const date=String(license.updatesThrough);
    // Display the provider value rather than infer entitlement from this date.
    e.append(node("p","ns-commerce-muted","Updates through: "+date));
  }
  return e;
}

export function renderSeatUsage({label,used,capacity}) {
  const displayLabel=requireString(label,"seat label");
  if(!Number.isSafeInteger(used)||used<0) throw new TypeError("used must be nonnegative integer");
  positiveInt(capacity,"seat capacity");
  if(used>capacity) throw new TypeError("used seats cannot exceed assigned capacity");
  const e=asRoot(group("section","ns-card ns-commerce-seat-usage"),"seat-usage");
  e.dataset.state=used===capacity?"full":"rest";
  const descriptor=title(displayLabel);
  const info=node("p","ns-commerce-muted",String(used)+" of "+String(capacity)+" seats assigned");
  const progress=node("progress");
  progress.max=capacity;progress.value=used;
  progress.setAttribute("aria-label",displayLabel+" seats allocated");
  e.append(descriptor,info,progress);
  return e;
}

export function renderDownloadEntitlement(entitlement,{onRequest}={}) {
  requireObject(entitlement,"EntitlementView");
  requireString(entitlement.id,"EntitlementView.id");
  requireString(entitlement.productId,"EntitlementView.productId");
  if(typeof entitlement.downloadAllowed!=="boolean")throw new TypeError("EntitlementView.downloadAllowed must be boolean");
  const e=asRoot(group("section","ns-card ns-commerce-entitlement"),"download-entitlement");
  e.setAttribute("aria-label","Download entitlement for "+entitlement.productId);
  e.dataset.state=entitlement.downloadAllowed?"eligible":"unavailable";
  e.append(title(entitlement.productId));
  if(!entitlement.downloadAllowed) {
    e.append(muted("Download unavailable under the current entitlement."));
    return e;
  }
  if(typeof onRequest!=="function"){
    e.append(muted("Download eligible. Connect a signed-download provider to request a file."));
    return e;
  }
  const button=actionButton("Request secure download");
  const msg=node("p","ns-commerce-muted","A signed download must be returned by your provider.");
  let pending=false;
  button.addEventListener("click",async()=>{
    if(pending)return;
    pending=true;button.disabled=true;button.textContent="Requesting";e.dataset.state="requesting";
    e.querySelector('[role="alert"]')?.remove();
    try{
      await onRequest(entitlement.id);
      // The host handles signed URL navigation and authoritative response.
      e.dataset.state="eligible";
    }catch(err){
      e.dataset.state="error";
      const error=node("p","",errorMessage(err));
      error.setAttribute("role","alert");
      e.append(error);
    }finally{
      pending=false;button.disabled=false;button.textContent="Request secure download";
    }
  });
  e.append(button,msg);
  return e;
}

export const COMMERCE_RENDERERS=Object.freeze({
  "commerce.product-price":renderProductPrice,
  "commerce.product-card":renderProductCard,
  "commerce.product-gallery":renderProductGallery,
  "commerce.cart-line":renderCartLine,
  "commerce.order-summary":renderOrderSummary,
  "commerce.license-status":renderLicenseStatus,
  "commerce.seat-usage":renderSeatUsage,
  "commerce.download-entitlement":renderDownloadEntitlement
});
