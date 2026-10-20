import {renderProductPrice,renderProductCard,renderProductGallery,renderCartLine,renderOrderSummary,renderLicenseStatus,renderSeatUsage,renderDownloadEntitlement} from './components.mjs';
import {renderProductDetail,renderProductMedia,renderReviewSummary,renderLicenseSelector,renderRenewalNote,renderPricingTier} from './wave2.mjs';
import {renderCoupon,renderCheckoutField,renderInvoiceDetails,renderCheckoutSteps,renderPaymentMethod,renderPaymentFailure,renderPaymentRecovery,renderProcessingState,renderOrderConfirmation,renderReceipt} from './wave3.mjs';
import {renderDownloadRow,renderPurchaseHistoryRow,renderLicenseCard,renderInvoiceHistory,renderActivationRow,renderUpdateEligibility,renderRenewalState,renderPlanChange,renderOwnershipTransfer,renderSubscriptionManagement,renderOwnershipTimeline} from './wave4.mjs';
const $=(selector)=>document.querySelector(selector);
const money=(amount)=>({amount,currency:'USD'});
const root=$('#components');
const theme=$('#theme');
const themes=new Set(['hardline-light','hardline-dark','soft-light','soft-dark','rivet-light','rivet-dark','mono-light','mono-dark','pulse-light','pulse-dark']);
const selected=new URLSearchParams(location.search).get('theme')||'hardline-light';
if(themes.has(selected))theme.value=selected;
const switchTheme=()=>{$('#resolved-theme').href='./themes/'+theme.value+'.css';document.documentElement.dataset.commerceTheme=theme.value;};
theme.addEventListener('change',switchTheme);
switchTheme();
const fixture=[
  ['product-price',renderProductPrice(money(49),{compareAt:money(79),interval:'one-time purchase',renewal:'Updates for 12 months'})],
  ['product-card',renderProductCard({id:'neo',name:'Neo Studio Kit',summary:'A local product demonstration with no checkout side effects.',offers:[{id:'lifetime',price:money(99),interval:'one-time'}],image:{src:'./assets/product-1.svg',alt:'Illustrated Neo Studio Kit package'},route:'./index.html'})],
  ['product-gallery',renderProductGallery({label:'Neo Studio Kit',images:[{src:'./assets/product-1.svg',alt:'Front cover of Neo Studio Kit',label:'Front'},{src:'./assets/product-2.svg',alt:'Detail artwork of Neo Studio Kit',label:'Detail'}]})],
  ['cart-line',renderCartLine({id:'line-1',label:'Neo Studio Kit',quantity:2,unitPrice:money(49),subtotal:money(98)},{onRemove:async()=>{window.__cartRequests=(window.__cartRequests||0)+1;}})],
  ['order-summary',renderOrderSummary({subtotal:money(98),discounts:[{label:'Welcome promotion',amount:money(10)}],taxes:[{label:'Tax (provider quote)',amount:money(7)}],total:money(95)})],
  ['license-status',renderLicenseStatus({id:'license-1',productId:'Neo Studio Kit',status:'active',maskedKey:'••••-9K2',updatesThrough:'2027-10-01'})],
  ['seat-usage',renderSeatUsage({label:'Workspace members',used:3,capacity:5})],
  ['product-detail',renderProductDetail({id:'neo',name:'Neo Studio Kit',description:'Catalog details sourced from a product record.',availability:'Available',offers:[{id:'once',label:'One-time',price:money(99)}],image:{src:'./assets/product-1.svg',alt:'Neo Studio Kit preview'}})],
  ['product-media',renderProductMedia({label:'Neo Studio Kit documentation',preview:{src:'./assets/product-2.svg',alt:'Neo Studio Kit artwork'},code:'import {renderProductCard} from "neosmartuxui";',files:['manifest.json','product.mjs','README.md']})],
  ['review-summary',renderReviewSummary({rating:4.6,count:129,caption:'Verified purchase reviews (fixture)'})],
  ['license-selector',renderLicenseSelector({label:'Choose a license',offers:[{id:'solo',label:'Individual',price:money(49),interval:'per year'},{id:'team',label:'Team',price:money(129),interval:'per year'}]},{onChange:id=>{window.__selectedLicense=id;}})],
  ['renewal-note',renderRenewalNote({message:'Renewal is optional; provider terms determine access after the first year.',renewsAt:'2027-10-20',policyUrl:'./index.html'})],
  ['pricing-tier',renderPricingTier({id:'team',label:'Team plan',price:money(129),description:'Five seats from a provider offer.',features:['Updates for 12 months','Five team seats']},{onSelect:id=>{window.__requestedTier=id;}})],
  ['coupon',renderCoupon({appliedCode:'WELCOME'},{onApply:async code=>{window.__couponRequests=(window.__couponRequests||[]).concat(code);return {status:'accepted',message:'Provider quote accepted this code. Request a new order summary.'};}})],
  ['checkout-field',renderCheckoutField({id:'contactEmail',label:'Contact email',value:'demo@example.com',type:'email',required:true,autocomplete:'email'},{onChange:(key,value)=>{window.__checkoutField={key,value};}})],
  ['invoice-details',renderInvoiceDetails({legalName:'Demo Business',billingEmail:'billing@example.com',billingAddress:'123 Example Street'},{onSave:async draft=>{window.__billingDraft=draft;return {status:'saved',message:'Billing details saved by demo provider.'};}})],
  ['checkout-steps',renderCheckoutSteps({steps:[{id:'details',label:'Details'},{id:'payment',label:'Payment'},{id:'receipt',label:'Receipt'}],currentId:'payment',status:'ready'})],
  ['payment-method',renderPaymentMethod({methods:[{id:'wallet',label:'Provider wallet',description:'Handled on the provider secure page'},{id:'card-on-provider',label:'Card with provider',description:'No card data collected here'}]},{onChange:id=>{window.__paymentMethod=id;}})],
  ['payment-failure',renderPaymentFailure({code:'PROVIDER_DECLINED',message:'The payment provider did not complete this attempt.',retryable:true},{onRetry:async code=>{window.__paymentRetry=code;}})],
  ['payment-recovery',renderPaymentRecovery({quoteId:'sample-quote',message:'Quote retained for a new provider check.'},{onRecover:async id=>{window.__recoveryRequest=id;return {status:'recovered',message:'Provider confirmed a recoverable quote.'};}})],
  ['processing-state',renderProcessingState({label:'Payment processing',message:'Waiting for authoritative confirmation.'})],
  ['order-confirmation',renderOrderConfirmation({id:'ORDER-DEMO-100',status:'confirmed',total:money(95),entitlements:[{productId:'Neo Studio Kit',delivered:false}]})],
  ['receipt',renderReceipt({id:'RECEIPT-DEMO-100',orderId:'ORDER-DEMO-100',status:'paid',amount:money(95),paidAt:'2026-10-20',invoiceId:'INV-100'})],
  ['download-row',renderDownloadRow({id:'entitlement-1',productId:'Neo Studio Kit',version:'v1.2.0',eligible:true,reason:'Provider-authorized updates'}, {onRequest:async id=>{window.__wave4Download=id;}})],
  ['purchase-history-row',renderPurchaseHistoryRow({id:'order-100',status:'paid',purchasedAt:'2026-10-20',total:money(95),invoiceId:'INV-100'})],
  ['license-card',renderLicenseCard({id:'license-100',productId:'Neo Studio Kit',status:'active',maskedKey:'••••-9K2',scope:'Five seats',entitlement:{active:true,reason:'Allowed by provider'}})],
  ['invoice-history',renderInvoiceHistory({invoices:[{id:'INV-100',status:'paid',amount:money(95),issuedAt:'2026-10-20',href:'./index.html'}]})],
  ['activation-row',renderActivationRow({id:'activation-1',licenseId:'license-100',status:'active',site:'example.test',lastSeenAt:'2026-10-20'})],
  ['update-eligibility',renderUpdateEligibility({productId:'Neo Studio Kit',status:'active',allowed:true,reason:'Provider confirms update access',updatesThrough:'2027-10-20'})],
  ['renewal-state',renderRenewalState({licenseId:'license-100',status:'grace',message:'Renewal available from provider.',renewable:true},{onRenew:async id=>{window.__renewalRequest=id;return {status:'confirmed',message:'Provider confirmed renewal'};}})],
  ['plan-change',renderPlanChange({licenseId:'license-100',currentPlan:'Individual',targetPlan:'Team',currentSeats:2,targetSeats:5},{onQuote:async req=>{window.__planQuoteRequest=req;return {status:'quoted',quoteId:'quote-123',...req,assignedSeats:2,description:'Provider quoted Team plan'};},onSubmit:async quote=>{window.__planSubmitRequest=quote;return {status:'complete',quoteId:quote.quoteId,message:'Provider completed plan change'};}})],
  ['ownership-transfer',renderOwnershipTransfer({licenseId:'license-100',ownerLabel:'Demo Owner',pendingInvitations:[{id:'inv-1',recipient:'pending@example.test',status:'pending'}]},{onInvite:async req=>{window.__transferRequest=req;return {status:'pending',invitationId:'inv-2'};},onCancel:async req=>{window.__transferCancel=req;return {status:'cancelled',invitationId:req.invitationId};}})],
  ['subscription-management',renderSubscriptionManagement({id:'subscription-100',plan:'Team',status:'active',message:'Renews under provider terms.',paidThrough:'2027-10-20'},{onCancel:async id=>{window.__subscriptionCancel=id;return {status:'cancel_at_period_end',message:'Provider cancelled at period end'};},onResume:async id=>{window.__subscriptionResume=id;return {status:'active',message:'Provider resumed subscription'};}})],
  ['ownership-timeline',renderOwnershipTimeline({licenseId:'license-100',events:[{id:'evt-1',action:'License issued',occurredAt:'2026-10-20',actor:'Provider'}]})],
  ['download-entitlement',renderDownloadEntitlement({id:'entitlement-1',productId:'Neo Studio Kit',downloadAllowed:true},{onRequest:async()=>{window.__downloadRequests=(window.__downloadRequests||0)+1;}})]
];
for(const [name,component] of fixture){
  const section=document.createElement('section');
  section.className='demo-box';section.dataset.component=name;
  const heading=document.createElement('h2');heading.textContent=name;
  section.append(heading,component);
  root.append(section);
}
document.body.dataset.commerceReady='true';
