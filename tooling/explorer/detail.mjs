const wrapper=document.querySelector('.detail-wrap');
if(!wrapper)throw new Error('Detail page has no component ID');
const id=wrapper.dataset.componentId;
const response=await fetch('/components/details.json',{cache:'no-store'});
if(!response.ok)throw new Error('Details registry not found');
const registry=await response.json();
if(registry.schema!=='neosmartuxui/component-details@1'||registry.items.length!==106)throw new Error('Invalid details manifest');
const current=registry.items.find(x=>x.id===id);
if(!current||current.route!==location.pathname)throw new Error('Component route/source mismatch: '+id);
const iframe=document.querySelector('#actual-demo');
const viewport=document.querySelector('.detail-viewport');
const theme=document.querySelector('#preview-theme');
const previewUrl=()=>{
 if(current.kind==='Core')return current.fullPreview;
 const query=theme?'?theme='+encodeURIComponent(theme.value):'';
 return current.fullPreview+query;
};
function scrollTarget(){
 try{
  const doc=iframe.contentDocument;
  if(!doc)return;
  if(current.kind==='Template')doc.querySelector('#show-templates')?.click();
  const target=doc.querySelector(current.previewSelector);
  if(target){target.scrollIntoView({block:'start'});return true;}
 }catch{return false;}
 return false;
}
let observer;
iframe.addEventListener('load',()=>{
 if(observer)observer.disconnect();
 if(scrollTarget())return;
 try{
  const doc=iframe.contentDocument;
  if(!doc||!doc.body)return;
  observer=new MutationObserver(()=>{if(scrollTarget())observer.disconnect()});
  observer.observe(doc.body,{childList:true,subtree:true});
 }catch{}
});
iframe.src=previewUrl();
if(theme)theme.addEventListener('change',()=>{
 iframe.src=previewUrl();
});
const buttons=[...document.querySelectorAll('[data-width]')].filter(el=>el.tagName==='BUTTON');
for(const button of buttons){
 button.addEventListener('click',()=>{
  viewport.dataset.width=button.dataset.width;
  for(const other of buttons){
   const selected=other===button;
   other.classList.toggle('is-selected',selected);
   other.setAttribute('aria-pressed',String(selected));
  }
 });
}
const copy=document.querySelector('#copy-source');
copy.addEventListener('click',async()=>{
 try{
  await navigator.clipboard.writeText(document.querySelector('#source-code').textContent);
  copy.textContent='Copied';
 }catch{
  const selection=getSelection(),range=document.createRange();
  range.selectNodeContents(document.querySelector('#source-code'));
  selection.removeAllRanges();selection.addRange(range);
  copy.textContent='Select & copy code';
 }
});
const sibling=registry.items.filter(x=>x.kind===current.kind&&x.id!==id);
const found=registry.items.indexOf(current);
const related=sibling.slice(Math.max(0,Math.floor(found/5)*5-1),Math.max(0,Math.floor(found/5)*5-1)+5);
const container=document.querySelector('#related-links');
for(const item of (related.length?related:sibling.slice(0,5))){
 const a=document.createElement('a');
 a.href=item.route;a.textContent=item.id+' ↗';container.append(a);
}
document.body.dataset.explorerReady='true';
