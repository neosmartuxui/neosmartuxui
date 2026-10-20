import type {OperationsRisk,OperationsHealth} from '../verticals/operations/index.mjs';
export interface LicenseOperationsData {
  stat:{label:string;value:string|number;description?:string;status?:'normal'|'attention'|'critical'};
  activations:{label?:string;active:number;limit:number};
  integration:{id:string;name:string;health:OperationsHealth;message:string};
  timeline:{heading:string;events:{id:string;action:string;occurredAt:string}[]};
}
export interface ReleaseOperationsData {
  artifact:{id:string;name:string;version:string;status:'verified'|'unverified'|'failed';checksum?:string};
  rollout:{label:string;stages:{id:string;name:string;status:'pending'|'in_progress'|'complete'|'failed'|'paused';percent?:number}[]};
  agentPlan:{id:string;title:string;risk:OperationsRisk;status:'proposed'|'approved'|'rejected'|'executing'|'complete';steps:{id:string;description:string}[]};
  webhooks:{deliveries:{id:string;event:string;status:'delivered'|'failed'|'pending';statusCode?:number}[]};
}
export function renderLicenseOperationsDashboard(data:LicenseOperationsData):HTMLElement;
export function renderReleaseOperationsConsole(data:ReleaseOperationsData,options?:{onRequest?:(id:string)=>unknown;onDecision?:(payload:{planId:string;decision:'approve'|'reject'})=>unknown;onRetry?:(id:string)=>unknown}):HTMLElement;
export const TEMPLATE_RENDERERS:Readonly<Record<string,(...args:any[])=>HTMLElement>>;
