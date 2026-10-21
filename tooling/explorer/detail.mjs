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

// Curated behavior controls only. No arbitrary selector, injected script or generic CSS state simulator.
const recipeFeedback=document.querySelector('#recipe-feedback');
if(current.recipe){
 const authored=current.recipe;
 const allowed=new Map(authored.controls.map(x=>[x.id,x]));
 const setFeedback=message=>{recipeFeedback.textContent=message};
 document.querySelector('#recipe-controls')?.addEventListener('click',event=>{
  const button=event.target.closest('button[data-recipe-id]');
  if(!button)return;
  const control=allowed.get(button.dataset.recipeId);
  if(!control){setFeedback('Unsupported control.');return;}
  const doc=iframe.contentDocument;
  const root=doc?.getElementById(current.id.slice(5)+'-slice')?.closest('section');
  if(!root){setFeedback('Preview not ready; open the full Foundry demo.');return;}
  const target=doc.querySelector(authored.specimen);
  if(!target||!root.contains(target)){setFeedback('Canonical specimen not available in the preview.');return;}
  const value=control.kind==='button'?control.value:document.querySelector('[data-recipe-field="'+control.id+'"]')?.value;
  if(typeof value!=='string'||value.length>300){setFeedback('Value is unavailable or too long.');return;}
  const EventCtor=iframe.contentWindow.Event;
  const changed=()=>target.dispatchEvent(new EventCtor('change',{bubbles:true}));
  switch(control.op){
   case 'aria-disabled':
    if(target.tagName!=='BUTTON')break;
    target.disabled=value==='true';
    if(value==='true')target.setAttribute('aria-disabled','true');
    else target.removeAttribute('aria-disabled');
    setFeedback('Native button '+(target.disabled?'disabled':'enabled')+' in the real preview.');
    return;
   case 'checkbox':
    if(target.tagName!=='INPUT'||target.type!=='checkbox')break;
    target.checked=value==='checked';
    target.indeterminate=value==='indeterminate';
    changed();
    setFeedback('Real checkbox state is '+value+'.');
    return;
   case 'switch':
    if(target.tagName!=='INPUT'||target.getAttribute('role')!=='switch')break;
    target.checked=value==='on';changed();
    setFeedback('Real switch is '+value+'.');
    return;
   case 'input':
    if(!['INPUT','TEXTAREA'].includes(target.tagName))break;
    target.value=value;
    target.dispatchEvent(new EventCtor('input',{bubbles:true}));
    setFeedback(value?'Text applied to the real native field.':'Native field cleared.');
    return;
   case 'select':
    if(target.tagName!=='SELECT'||![...target.options].some(x=>x.value===value&&!x.disabled))break;
    target.value=value;changed();
    setFeedback('Native select now shows '+value+'.');
    return;
   case 'tone':{
    // Use authored canonical badge samples; never mislabel status by recoloring arbitrary text.
    const variant=doc.getElementById('badge-'+value);
    if(!variant||!root.contains(variant)||variant.dataset.tone!==value)break;
    variant.scrollIntoView({block:'center'});
    setFeedback('Showing the real '+value+' badge specimen, including its semantic label.');
    return;
   }
   case 'range':
    if(target.tagName!=='INPUT'||target.type!=='range'||Number(value)<Number(target.min)||Number(value)>Number(target.max))break;
    target.value=value;
    target.dispatchEvent(new EventCtor('input',{bubbles:true}));
    changed();
    setFeedback('Native range input changed to '+target.value+'.');
    return;
   case 'radio':{
    if(target.tagName!=='INPUT'||target.type!=='radio')break;
    const peer=doc.querySelector('#radio-'+value);
    if(!peer||!root.contains(peer)||peer.name!==target.name||peer.type!=='radio'||peer.disabled)break;
    peer.click();
    setFeedback('Native radio selection: '+value+'.');
    return;
   }
   case 'toggle':
    if(target.tagName!=='BUTTON'||!['true','false'].includes(target.getAttribute('aria-pressed')))break;
    if(target.getAttribute('aria-pressed')!==(value==='on'?'true':'false'))target.click();
    setFeedback('Real Toggle '+value+'.');
    return;
   case 'accordion':{
    if(target.tagName!=='BUTTON'||!target.classList.contains('ns-accordion-trigger')||target.disabled)break;
    const open=value==='open';
    if(target.getAttribute('aria-expanded')!==(open?'true':'false'))target.click();
    setFeedback('Accordion '+value+' via existing disclosure controller.');
    return;
   }
   case 'segment':{
    const group=target.closest('[role="group"]');
    const segment=doc.querySelector(value);
    if(!group||!segment||!group.contains(segment)||segment.disabled||
     !segment.classList.contains('ns-segmented-control-segment'))break;
    segment.click();
    setFeedback('Selected real '+segment.textContent.trim()+' segment.');
    return;
   }
   case 'number-field':{
    const field=target.closest('.ns-number-field');
    if(target.tagName!=='INPUT'||target.type!=='number'||!field||!root.contains(field))break;
    const n=Number(value);
    const min=Number(target.min),max=Number(target.max);
    if(value!==''&&(!Number.isFinite(n)|| (target.min&&n<min)||(target.max&&n>max)))break;
    target.value=value;
    target.dispatchEvent(new EventCtor('input',{bubbles:true}));
    changed();
    setFeedback(value?'Real numeric input set to '+target.value+'.':'Numeric field cleared.');
    return;
   }
   case 'number-step':{
    const field=target.closest('.ns-number-field');
    if(!field||!root.contains(field))break;
    const action=field.querySelector('[data-number-field-action="'+value+'"]');
    if(!action||action.tagName!=='BUTTON'||action.disabled)break;
    action.click();
    setFeedback('Used existing numeric '+value+' action.');
    return;
   }
   case 'tab':{
    const tab=doc.querySelector(value);
    if(!tab||!root.contains(tab)||tab.getAttribute('role')!=='tab'||tab.disabled)break;
    tab.click();
    setFeedback('Selected real '+tab.textContent.trim()+' tab through its existing controller.');
    return;
   }
   default: break;
  }
  setFeedback('Operation unavailable for this shipping Foundry specimen.');
 });
 iframe.addEventListener('load',()=>setFeedback('Preview reloaded. Property controls are ready.'));
}
