# NeoSmartUXUI


> **Recovery / proof status (2026-10-20):** This NeoSmartUXUI repository was restored from verified GitHub API snapshots as new commits. Current local builds and browser tests can be verified, but legacy live public-proof evidence refers to the former NeoSmartUI domain and historical source SHA. It has **not** been re-established for the new hostname. GitHub Actions is intentionally disabled. See [Restore and local release](docs/RESTORE-AND-LOCAL-RELEASE.md).


**NeoSmartUXUI — The AI-first neo-brutalist UI system.**

Built for humans. Structured for agents.

NeoSmartUXUI is one agent-native UI architecture with reusable Core capabilities, configurable physical/visual flavors, domain-aware verticals, versioned themes, machine-readable contracts, live public proof, and explainable AI composition.

## Authority

The permanent product, architecture, migration, competitive-strategy, quality, and roadmap authority is [`docs/CANONICAL-PRD.md`](docs/CANONICAL-PRD.md).

Derived documents may summarize the Canonical PRD, but they must not contradict or replace it.

- Operational roadmap: [`docs/DEVELOPMENT-ROADMAP.md`](docs/DEVELOPMENT-ROADMAP.md)
- Foundry source/deployment contract: [`docs/FOUNDRY-DEPLOYMENT.md`](docs/FOUNDRY-DEPLOYMENT.md)
- Coding-agent rules: [`AGENTS.md`](AGENTS.md)
- Compact LLM guide: [`LLMS.md`](LLMS.md)
- Migration ledger: [`migration/inventory.json`](migration/inventory.json)

## Architecture

```text
SPEC
  ↓
CORE
  ↓
COMPONENTS
  ↓
BLOCKS
  ↓
PAGES
  ↓
APPLICATIONS
```

Independent dimensions:

```text
FLAVOR   = how it looks and physically feels
VERTICAL = what domain/business knowledge it understands
THEME    = a configured instance of a flavor
```

Composition:

```text
Core + Vertical + Flavor + Theme + Framework Adapter = Application UI
```

Commerce and SaaS are verticals. Hardline, Soft, Rivet, Mono, and Pulse are flavors. Pulse Light and Pulse Dark are implemented through the shared Core Theme pipeline, form an official Studio starter pair, and are complete through public proof.

## Permanent rules

> **RESTART THE ARCHITECTURE, NOT THE KNOWLEDGE.**

> **SOURCE ONCE. DEMONSTRATE EVERYWHERE.**

> **BUILT FOR HUMANS. STRUCTURED FOR AGENTS.**

## Repository role

This repository, `neosmartuxui/neosmartuxui`, is the canonical source of truth.

`neosmartuxui/neosmartuxui.github.io` is generated deployment output for the NeoSmartUXUI Foundry. It must never become a second source of truth.

Development is branch → implementation → tests → PR → exact-SHA verification → merge. Do not use `main` for casual feature development.

## Current roadmap position

v0.1 Foundation, v0.2 Core, v0.3 Flavor Engine, and v0.4 NeoSmartUXUI Studio are complete through public proof.

The product roadmap remains unchanged. The current engineering work is an **in-place expansion of the Core component library** inside the already-delivered Component Lab. It is not a new roadmap version. Expansion C is complete through Toast, Expansion D Table + DataGrid + Item + List are fully public-proof, and the registry now has **50 Core contracts: 49 public-proof + 1 implemented-but-unproven (`core.description-list`)**. Exact-set Flavor maintenance permits a local **50-Core / 55-token** Theme scope and the implementation preview matrix contains **267 real states**, while deployed/public authority remains the exact **49-component / 55-token / 266-state** List singleton until DescriptionList completes merged-main verification, exact-artifact deployment, native/live verification, and proof-only promotion. All five Flavor maintenance records remain active; only the 49 public-proof components count toward the breadth gate:

```text
90+ distinct public-proof Core components
```

Competitor research is maintained under `research/competitors/` as a living multi-competitor benchmark. It informs capability priorities but does not lower or mechanically recalculate the 90+ target.

Current Lab status:

```text
Component Lab ✅
Dedicated Theme Gallery/Lab ⏳
Blocks Lab ⏳
Pages Lab ⏳
Vertical/SaaS/Commerce previews ⏳
```

Breadth does not override quality: variants, aliases, examples, and visual presets do not count as separate components.
