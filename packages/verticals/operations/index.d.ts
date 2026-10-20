/** Local-only Operations vertical — NeoSmartUXUI Core composition, not a public API. */
export type OperationsHealth='healthy'|'degraded'|'offline'|'unknown';
export type OperationsRisk='low'|'medium'|'high'|'critical';
export type OperationsResult={status:string;message?:string};
export function renderStatCard(input:{label:string;value:string|number;unit?:string;description?:string;status?:'normal'|'attention'|'critical'}):HTMLElement;
export function renderActivationMeter(input:{label?:string;active:number;limit:number;description?:string}):HTMLElement;
export function renderIntegrationStatus(input:{id:string;name:string;health:OperationsHealth;message:string;lastCheckedAt?:string;publicEndpoint?:string}):HTMLElement;
export function renderRiskIndicator(input:{level:OperationsRisk;rationale:string;source?:string}):HTMLElement;
export function renderPermissionScope(input:{principal:string;scopes:{id:string;description:string;level:'read'|'write'|'admin'}[]}):HTMLElement;
export function renderWebhookDeliveryLog(input:{deliveries:{id:string;event:string;status:'delivered'|'failed'|'pending';statusCode?:number}[]},opts?:{onRetry?:(id:string)=>Promise<{status:'accepted';deliveryId:string}>|{status:'accepted';deliveryId:string}}):HTMLElement;
export function renderOpaqueSecretReference(input:{label:string;reference:string;rotatedAt?:string;scope?:string}):HTMLElement;
export function renderReleaseArtifact(input:{id:string;name:string;version:string;checksum?:string;status:'verified'|'unverified'|'failed';createdAt?:string},opts?:{onRequest?:(id:string)=>Promise<{status:'accepted';artifactId:string}>|{status:'accepted';artifactId:string}}):HTMLElement;
export function renderRolloutStages(input:{label:string;stages:{id:string;name:string;status:'pending'|'in_progress'|'complete'|'failed'|'paused';percent?:number}[]}):HTMLElement;
export function renderOperationTimeline(input:{heading:string;events:{id:string;action:string;occurredAt:string;actor?:string;outcome?:'ok'|'warning'|'failed'|'pending'}[]}):HTMLElement;
export function renderUsageChart(input:{label:string;points:{label:string;value:number}[];unit?:string}):HTMLElement;
export function renderAgentApprovalPlan(input:{id:string;title:string;risk:OperationsRisk;status:'proposed'|'approved'|'rejected'|'executing'|'complete';steps:{id:string;description:string}[]},opts?:{onDecision?:(request:{planId:string;decision:'approve'|'reject'})=>Promise<{planId:string;status:'approved'|'rejected'}>|{planId:string;status:'approved'|'rejected'}}):HTMLElement;
export const OPERATIONS_RENDERERS:Readonly<Record<string,(...args:any[])=>HTMLElement>>;
