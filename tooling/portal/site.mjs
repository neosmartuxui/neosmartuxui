// Preserve bookmarks from the historical Foundry homepage after moving it to /foundry/.
if(location.pathname==='/'&&location.hash&&!['#main','#explore','#studio'].includes(location.hash))
 location.replace('/foundry/'+location.hash);
const nav=document.querySelector('#site-nav');
const menu=document.querySelector('#menu-toggle');
if(nav&&menu){
 menu.addEventListener('click',()=>{
  const open=nav.classList.toggle('open');
  menu.setAttribute('aria-expanded',String(open));
  menu.textContent=open?'Close menu ×':'Menu ☰';
 });
 nav.addEventListener('click',e=>{
  if(e.target.closest('a')){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='Menu ☰';}
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='Menu ☰';}});
}
const catalog=document.querySelector('#catalog-results');
if(catalog){
 const input=document.querySelector('#component-search');
 const category=document.querySelector('#component-category');
 const count=document.querySelector('#catalog-count');
 const response=await fetch('/components/catalog.json',{cache:'no-store'});
 if(!response.ok)throw new Error('Unified catalog could not load');
 const data=await response.json();
 if(data.schema!=='neosmartuxui/portal-catalog@1'||data.counts.total!==106||data.items.length!==106)throw new Error('Unexpected component catalog');
 for(const type of ['Core','Commerce','Operations','Block','Template']){
  const option=document.createElement('option');option.value=type;option.textContent=type;category.append(option);
 }
 const display=()=>{
  const q=input.value.toLocaleLowerCase().trim();
  const list=data.items.filter(x=>(category.value==='all'||x.kind===category.value)&&(!q||(x.id+' '+x.kind+' '+x.description).toLocaleLowerCase().includes(q)));
  catalog.replaceChildren();
  const fragment=document.createDocumentFragment();
  for(const item of list){
   const card=document.createElement('article');card.className='entry';
   const top=document.createElement('div');top.className='entry-top';
   const kind=document.createElement('span');kind.className='entry-type';kind.textContent=item.kind.toUpperCase();
   const status=document.createElement('span');status.className='status'+(item.kind==='Core'?'':' experimental');
   status.textContent=item.status;top.append(kind,status);
   const h=document.createElement('h3');h.textContent=item.id;
   const p=document.createElement('p');p.textContent=item.description;
   const a=document.createElement('a');a.href=item.href;a.textContent='Inspect '+item.kind+' ↗';
   card.append(top,h,p,a);fragment.append(card);
  }
  catalog.append(fragment);
  count.textContent=list.length+' / '+data.items.length+' entries';
 };
 input.addEventListener('input',display);category.addEventListener('change',display);
 const query=new URLSearchParams(location.search);
 if(['Core','Commerce','Operations','Block','Template'].includes(query.get('type')))category.value=query.get('type');
 if(query.get('q'))input.value=query.get('q').slice(0,100);
 display();
}
document.body.dataset.portalReady='true';
