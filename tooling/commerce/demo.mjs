import {renderProductPrice,renderProductCard,renderProductGallery,renderCartLine,renderOrderSummary,renderLicenseStatus,renderSeatUsage,renderDownloadEntitlement} from './components.mjs';
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
