# NeoBrutal Soft and NeoLicenser v0.7 - local admission

Source: NeoBrutalismshop/NeoBrutal-Soft, archived and verified on local desktop. No pushes, public-proof claim, or existing-Core mutation.

The 7 installable UI registry elements (button, card, field, badge, alert, switch, tabs) are already covered by NeoSmartUXUI Core. Reuse them with the Soft Theme. The 29 CSS modules describe GROUPS of UI patterns and do not represent 29 separate mature components.

## Core reuse (15 CSS modules)

`alert`, `badge`, `button`, `card`, `checkbox`, `date-time`, `feedback`, `file`, `input`, `navigation`, `overlay`, `radio`, `switch`, `table`, `tabs`.

## Core candidate extension (4 CSS modules)

`command`, `data-table-pro`, `data-viz`, `inspector`.

## Commerce vertical (3 CSS modules)

`billing`, `license`, `product`.

## SaaS and agent domain (6 CSS modules)

`identity`, `operations`, `permissions`, `scheduling`, `workflows`, `agent-diff`.

## Composed application block (1 CSS modules)

`app-shell`.

## NeoLicenser demo v0.7 admission

**Commerce components:** license card and masked key, activation meter, license status, seat/team allocation, billing summary, renewal/eligibility, secure delivery entitlement.

**Core candidates:** stat card, data visualization, command palette, activity timeline, integration status, webhook delivery row, permission scope.

**Agent and SaaS patterns:** agent plan diff, risk chip, human approval control, rollout stages, operations audit timeline, opaque secret reference.

**Later Blocks and templates:** operations dashboard, license-management page, release console, integrations page, agent control plane.

The Soft v0.7 demo has five views: overview, licenses, releases, integrations and agents. It uses sample data and UI interactions, not a functioning server license system. Separate neolicenser and neolicenser-pro repos contain only placeholder READMEs.

## Next implementation gate

Merge Wave 1's eight tested Commerce renderers to LOCAL main only, when all quality checks pass. Add the next actual renderers in a fresh LOCAL feature branch. Priority: license card, activation meter, integration status, risk indicator, agent approval plan. Each needs contracts, appropriate authority, adapters, accessibility and tests; Blocks remain deferred. No remote push or pull; GitHub Actions remains disabled.

## Local integration update

The subsequent local milestone implements 12 independently composed Operations components from the advanced Soft/NeoLicenser domain patterns, seven Commerce Blocks from the original source inventory, and two operations Templates. The older admission sections above describe original source candidates, not new Core identities. Run quality:operations and quality:blocks. No backend, public proof, or GitHub push/pull. All theme choices use the existing canonical ten Theme bundles; Theme editing remains in Studio.
