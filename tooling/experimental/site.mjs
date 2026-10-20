const results=document.querySelector('#results');
const status=document.querySelector('#result-count');
const input=document.querySelector('#search');
const select=document.querySelector('#category');
const theme=document.querySelector('#theme');
const links={commerce:document.querySelector('#commerce-link'),operations:document.querySelector('#operations-link'),blocks:document.querySelector('#blocks-link')};
const expected={commerce:35,operations:12,blocks:7,templates:2,total:56};
const response=await fetch('./catalog.json',{cache:'no-store'});
if(!response.ok)throw new Error('Experimental catalog unavailable');
const data=await response.json();
if(data.schema!=='neosmartuxui/experimental-gallery@1'||data.scope!=='public-experimental-demo-only'||data.productionReady!==false||data.providerIntegrations!==false||data.fixtureData!==true||data.items.length!==56||
 Object.entries(expected).some(([key,n])=>data.counts[key]!==n))throw new Error('Experimental safety contract invalid');
const kinds=[...new Set(data.items.map(i=>i.category))];
for(const kind of kinds){
 const option=document.createElement('option');option.value=kind;option.textContent=kind;select.append(option);
}
for(const t of data.themes){
 const option=document.createElement('option');option.value=t;option.textContent=t;theme.append(option);
}
const url=new URL(location.href);
const incoming=url.searchParams.get('theme');
if(data.themes.includes(incoming))theme.value=incoming;
function selectTheme(){
 for(const [kind,link] of Object.entries(links))link.href='./'+kind+'/?theme='+encodeURIComponent(theme.value);
 for(const link of results.querySelectorAll('[data-preview]'))link.href='./'+link.dataset.preview+'/?theme='+encodeURIComponent(theme.value);
}
function paint(){
 const q=input.value.toLocaleLowerCase().trim();
 const matching=data.items.filter(item=>(select.value==='all'||item.category===select.value)&&
  (!q||(item.id+' '+item.category+' '+item.description).toLocaleLowerCase().includes(q)));
 results.replaceChildren();
 const fragment=document.createDocumentFragment();
 for(const item of matching){
  const card=document.createElement('article');card.className='result-card';
  const meta=document.createElement('div');meta.className='card-meta';
  const category=document.createElement('span');category.className='item-category';category.textContent=item.category;
  const state=document.createElement('span');state.className='item-state';state.textContent='EXPERIMENTAL';
  meta.append(category,state);
  const heading=document.createElement('h3');heading.textContent=item.id;
  const desc=document.createElement('p');desc.textContent=item.description;
  const anchor=document.createElement('a');anchor.textContent='Inspect preview ↗';anchor.className='preview-action';
  anchor.dataset.preview=item.preview;
  card.append(meta,heading,desc,anchor);fragment.append(card);
 }
 results.append(fragment);
 status.textContent=matching.length+' of '+data.items.length+' experimental entries';
 selectTheme();
}
theme.addEventListener('change',selectTheme);
input.addEventListener('input',paint);
select.addEventListener('change',paint);
paint();
document.body.dataset.experimentalReady='true';
