const manifestUrl='./catalog.json';
const list=document.querySelector('#catalog-results');
const count=document.querySelector('#count');
const search=document.querySelector('#search');
const kind=document.querySelector('#kind');
const theme=document.querySelector('#theme');
const themeButton=document.querySelector('#open-theme');
const previewHref=item=>item.preview==='core'?'../':('./'+item.preview+'/index.html');
const render=(items)=>{
 list.replaceChildren();
 for(const item of items){
  const card=document.createElement('article');card.className='item';
  const name=document.createElement('h3');name.textContent=item.id;
  const meta=document.createElement('p');meta.className='muted';meta.textContent=item.kind+' · '+item.maturity;
  const desc=document.createElement('p');desc.textContent=item.description;
  const link=document.createElement('a');link.textContent=item.preview==='core'?'Return to Core discovery':'Open local preview';
  link.href=previewHref(item);
  if(item.preview!=='core')link.href+='?theme='+encodeURIComponent(theme.value);
  card.append(name,meta,desc,link);list.append(card);
 }
 count.textContent=items.length+' matching catalog entries';
};
const data=await (await fetch(manifestUrl,{cache:'no-store'})).json();
if(data.scope!=='local-only'||data.publicProof!==false||data.items.length!==106)throw new Error('Catalog cannot claim public proof');
const options=[...new Set(data.items.map(x=>x.kind))].sort();
for(const option of options){const el=document.createElement('option');el.value=option;el.textContent=option;kind.append(el);}
for(const t of data.themes){const el=document.createElement('option');el.value=t;el.textContent=t;theme.append(el);}
const filter=()=>{
 const needle=search.value.trim().toLowerCase();
 render(data.items.filter(x=>(kind.value==='all'||x.kind===kind.value)&&(!needle||[x.id,x.kind,x.description].some(v=>v.toLowerCase().includes(needle)))));
};
search.addEventListener('input',filter);kind.addEventListener('change',filter);
themeButton.addEventListener('click',()=>{
 const target=document.querySelector('#examples');target.replaceChildren();
 for(const section of ['commerce','operations','blocks']){
  const link=document.createElement('a');link.href='./'+section+'/index.html?theme='+encodeURIComponent(theme.value);
  link.textContent='Open '+section+' lab with '+theme.value;
  target.append(link);
 }
});
filter();
document.body.dataset.ecosystemReady='true';
