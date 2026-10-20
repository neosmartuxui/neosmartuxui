# NeoSmartUXUI Operations — advanced Soft & NeoLicenser admission

Local-only milestone. These 12 distinct operational UI renderers are an Operations/SaaS vertical, not Core replacements. They reuse the existing card, badge, button and the ten theme packages. Original NeoBrutal Soft's seven installable primitives remain mapped to existing Core, not duplicated.

Reference source: verified owner-controlled NeoBrutal Soft source modules (operations, agent-diff, permissions, identity, scheduling, data-viz, inspector, file) and its NeoLicenser v0.7 demo. Owner explicitly authorized cross-project reuse. No original CSS fork is imported. Keep attribution and confirm rights of third-party contributions before public distribution. The canonical NeoSmartUXUI target license is Apache-2.0 with a root LICENSE and NOTICE; the original Soft archive remains UNLICENSED and unchanged.

Implemented components:
1. Stat Card: provider KPI
2. Activation Meter: used/licensed activation limit
3. Integration Status: provider health and checked-at
4. Risk Indicator: explicit severity, rationale and source
5. Permission Scope: actor and read/write/admin authority
6. Webhook Delivery Log: status and host callback retry request, never implied delivery
7. Opaque Secret Reference: masked references only, never raw keys
8. Release Artifact: SHA-256 evidence and signed-download request callback
9. Rollout Stages: stages and provider progress
10. Operation Timeline: recorded events only
11. Usage Chart: accessible bar chart and semantic data table
12. Agent Approval Plan: explicit human approve/reject callback; approval never means execution

The result is a set of locally tested DOM components, not a NeoLicenser backend, automation agent, real credential store, production integration, or public-proof release. Renderers initiate no network requests: host callbacks own actions.

Run npm.cmd run quality:operations. Theme editing remains in the canonical NeoSmartUXUI Studio. No GitHub push/pull or Actions.
