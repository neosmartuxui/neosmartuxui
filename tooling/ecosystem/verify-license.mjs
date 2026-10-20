import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';

export const APACHE_2_SHA256='b378beae25275395ef3381a8ec5988c7c3bc12117e8f9126452a39cd772c4a48';
export async function verifyRootApacheLicense(root) {
 const license=await readFile(resolve(root,'LICENSE'));
 const digest=createHash('sha256').update(license).digest('hex');
 if(digest!==APACHE_2_SHA256)throw new Error('Canonical Apache-2.0 LICENSE mismatch: '+digest);
 const notice=await readFile(resolve(root,'NOTICE'),'utf8');
 for(const text of ['NeoSmartUXUI','Copyright 2026','NeoBrutal Commerce','NeoBrutal Soft','NeoLicenser','PolyForm Noncommercial 1.0.0']){
  if(!notice.includes(text))throw new Error('Missing required source notice: '+text);
 }
 const packageRoot=JSON.parse(await readFile(resolve(root,'package.json'),'utf8'));
 if(packageRoot.license!=='Apache-2.0'||packageRoot.private!==true)throw new Error('Root package must be Apache-2.0 but remain private');
 const admission=JSON.parse(await readFile(resolve(root,'packages/distribution/release-admission.json'),'utf8'));
 if(admission.licenseDecision!=='Apache-2.0'||!admission.licenseReviewedLocal)throw new Error('Owner-authorized Apache-2.0 decision not recorded');
 const commerce=JSON.parse(await readFile(resolve(root,'packages/verticals/commerce/source-admission.json'),'utf8'));
 if(commerce.sourceLicense!=='PolyForm Noncommercial 1.0.0'||commerce.targetLicense!=='Apache-2.0')throw new Error('Original source license or target authorization lost');
 const soft=JSON.parse(await readFile(resolve(root,'packages/verticals/operations/component-registry.json'),'utf8'));
 if(soft.source.originalSourceLicense!=='UNLICENSED in archived NeoBrutal Soft package'||soft.source.targetLicense!=='Apache-2.0')throw new Error('Soft provenance/authorization changed');
 return {spdx:'Apache-2.0',sha256:digest};
}
