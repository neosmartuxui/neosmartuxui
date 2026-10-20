# NeoSmartUI LLM Guide

```yaml
product: NeoSmartUI
parent: NeoSmartApps
canonical_prd: docs/CANONICAL-PRD.md
canonical_repo: neosmartui/neosmartui
deployment_repo: neosmartui/neosmartui.github.io
public_foundry: https://neosmartui.com
status: v0.1-foundation
```

## Core model

```text
SPEC → CORE → COMPONENTS → BLOCKS → PAGES → APPLICATIONS
```

```text
FLAVOR   = visual/physical personality
VERTICAL = domain/business knowledge
THEME    = configured flavor instance
```

```text
Core + Vertical + Flavor + Theme + Framework Adapter = Application UI
```

Official initial flavors: `hardline`, `soft`, `rivet`, `mono`.

Initial verticals: `commerce`, later `saas` through the v1.1 discovery sequence.

## Stable semantic ID direction

```text
core.button
core.block.hero
commerce.product-price
commerce.block.product-grid
commerce.page.checkout
saas.plan-usage
flavor.hardline
```

Schema families:

```text
neosmartui/component@1
neosmartui/block@1
neosmartui/page@1
neosmartui/theme@1
```

## Non-negotiable agent rules

```text
DISCOVER before inventing
COMPOSE before duplicating
CORE before vertical duplication
VERTICAL before application duplication
TOKENS before hardcoded styling
CONTRACTS before assumptions
STATE AUTHORITY before demo copy
ACCESSIBILITY before visual polish
VALIDATE before completion
EXPLAIN architectural selections
```

Missing capability: emit `REGISTRY GAP`; classify, do not invent.

Interaction identity: `Pressure, not levitation`; hover begins compression, press completes compression, selection may remain seated. Exact behavior comes from tokens/Flavor/Theme.

Migration: verify current branch + exact SHA; record provenance; choose one of `ADOPT|ADAPT|PROMOTE|REWRITE|RETIRE|REFERENCE`.

Repository rule: canonical source lives only in `neosmartui/neosmartui`; generated Foundry output lives in `neosmartui/neosmartui.github.io`.

Permanent rules:

```text
RESTART THE ARCHITECTURE, NOT THE KNOWLEDGE.
SOURCE ONCE. DEMONSTRATE EVERYWHERE.
BUILT FOR HUMANS. STRUCTURED FOR AGENTS.
```

## Organization routing

```yaml
current_state: neosmartui/Progress-Memory
process_library: neosmartui/Process-and-Workflows
skills_registry: neosmartui/Skills
organization_decisions: neosmartui/Handbook
brand_identity: neosmartui/Brand
infrastructure_docs: neosmartui/Infrastructure
marketing_lab: neosmartui/Marketing
monetization_lab: neosmartui/Monetization
automation_lab: neosmartui/Automation
```

Session routing: read Progress-Memory first for mutable current state, then load only the relevant canonical product files. For repeatable repository operations, use a matching stable Skill when its contract fits; otherwise consult the Process catalog. None of these support repositories overrides `docs/CANONICAL-PRD.md`, schemas, registries, or runtime ownership in this monorepo.

