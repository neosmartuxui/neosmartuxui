# NeoSmartUXUI Organization Operating Layer

This document is a derived routing guide. It does not override the Canonical PRD, schemas, registries, package ownership, or runtime implementation.

## Authority split

| Question | Canonical home |
|---|---|
| What is NeoSmartUXUI / how does the product behave? | `neosmartuxui/neosmartuxui` |
| Where are we now? | `neosmartuxui/Progress-Memory` |
| How do we reliably perform recurring work? | `neosmartuxui/Process-and-Workflows` |
| What can an agent safely execute repeatedly? | `neosmartuxui/Skills` |
| What has the organization decided beyond product contracts? | `neosmartuxui/Handbook` |
| What is the corporate identity asset source? | `neosmartuxui/Brand` |
| How is infrastructure documented/operated? | `neosmartuxui/Infrastructure` |
| Where do adoption/commercial/orchestration experiments live? | `Marketing` / `Monetization` / `Automation` |

## Session flow

```text
Progress-Memory
  → identify canonical owner
  → stable Skill if one exactly fits
  → otherwise validated/repeatable Process workflow
  → execute in owning repository
  → verify exact evidence
  → feed reusable learning back to Process
  → update Progress-Memory after meaningful milestones
```

## Workflow maturity

`observed → documented → tested → validated → repeatable → skill-ready → promoted`

Do not encode unstable architectural judgment as a rigid Skill. In particular, Core/Vertical/Block/Page admission remains governed by the product architecture and must preserve contextual reasoning.

## Product repository invariant

`neosmartuxui/neosmartuxui` remains the one canonical product/source monorepo. Support repositories are an operating layer around it, not a decomposition of product implementation.
