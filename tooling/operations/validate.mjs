import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=resolve(import.meta.dirname,'../..');
const load=async p=>JSON.parse(await readFile(resolve(root,p),'utf8'));
const reg=await load('packages/verticals/operations/component-registry.json');
const core=await load('packages/core/component-registry.json');
const tokens=await load('spec/core/token-contracts.json');
if(reg.schema!=='neosmartuxui/operations-component-registry@1'||reg.vertical!=='operations'||!reg.noCoreMutation||!reg.noPublicProofClaim)throw new Error('Operations identity or public-proof boundary');
if(core.components.length!==50||reg.components.length!==12||reg.themes.length!==10)throw new Error('Unexpected registry size');
const coreIDs=new Set(core.components.map(x=>x.id));
const js=await import(pathToFileURL(resolve(root,'packages/verticals/operations/components.mjs')).href);
if(Object.keys(js.OPERATIONS_RENDERERS).length!==12)throw new Error('Export mismatch');
const names=new Set();
for(const item of reg.components){
 if(names.has(item.id)||!item.id.startsWith('operations.')||coreIDs.has(item.id)||item.status!=='implemented-local')throw new Error('Invalid component id '+item.id);
 names.add(item.id);
 if(!item.composesCore.every(x=>coreIDs.has(x)))throw new Error('Missing Core primitive');
 if(typeof js[item.exportName]!=='function'||js.OPERATIONS_RENDERERS[item.id]!==js[item.exportName])throw new Error('Missing component renderer: '+item.id);
}
const css=await readFile(resolve(root,'packages/verticals/operations/operations.css'),'utf8');
const valid=new Set(tokens.contracts.map(t=>'--ns-'+t.id.replaceAll('.','-')));
for(const [,token] of css.matchAll(/var\((--ns-[a-z0-9-]+)/g))if(!valid.has(token))throw new Error('Unregistered token '+token);
for(const name of reg.themes){
 const theme=await load('packages/themes/'+name+'/tokens.json');
 if(theme.values.length!==55||!['core.card','core.badge','core.button'].every(x=>theme.scope.includes(x)))throw new Error('Theme scope '+name);
}
console.log('[operations] PASS: 12 independent renderers; 50 Core untouched; 10 original Themes; no unknown token references.');
