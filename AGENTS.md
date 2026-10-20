# NeoSmartUXUI Agent Contract

## Authority order

1. `docs/CANONICAL-PRD.md` — permanent product, architecture, migration, competitive-strategy, quality, and roadmap authority.
2. `spec/schemas/*` — schema authority once introduced.
3. Registry files — identity/capability authority once introduced.
4. Package implementations — runtime authority for their owned capability.
5. Derived docs — explanatory only; they must not override the Canonical PRD or machine-readable authorities.

When authorities disagree, stop and classify the drift. Do not silently choose the convenient version.

## Architecture laws

Preserve:

```text
SPEC → CORE → COMPONENTS → BLOCKS → PAGES → APPLICATIONS
```

Keep these independent:

- **Flavor**: visual/physical expression.
- **Vertical**: domain/business knowledge.
- **Theme**: configured instance of a flavor.

Commerce and SaaS are verticals. Hardline, Soft, Rivet, and Mono are flavors. Never model Commerce as a flavor.

A capability belongs in Core when it can be accurately described without naming a business domain. Prefer vertical correctness first; promote to Core only when genuinely generic or obviously generic before implementation.

## Agent laws

- DISCOVER before inventing.
- COMPOSE before duplicating.
- CORE before vertical duplication.
- VERTICAL before application duplication.
- TOKENS before hardcoded styling.
- CONTRACTS before assumptions.
- STATE AUTHORITY before demo copy.
- ACCESSIBILITY before visual polish.
- VALIDATE before completion.
- EXPLAIN architectural selections made by automation.

If no valid capability exists, report `REGISTRY GAP` and classify it as Core, Vertical, or application-specific. Do not hallucinate IDs, domain states, provider fields, theme tokens, dependencies, or architecture.

## Interaction identity

Preserve the NeoSmartUXUI laws:

- Sharp before soft.
- Compress, never float.
- Pressure, not levitation.
- Color is part of interaction.
- Motion communicates physics.
- Static things remain stable.
- Accessibility is structural.

Ordinary controls must not generically move upward on hover. Pressure and exact physical values belong in Flavor/Theme tokens rather than being independently hardcoded in components.

## Studio discipline

Studio consumes canonical Theme and registry authority. It must not become a competing authority.

- One logical editable Theme is the existing canonical package: `theme.json` + `resolution.json` + `tokens.json`.
- Theme is data, not forked components. Studio must not invent `studio-theme.json`, a hidden fallback token layer, a Studio-only token registry, or a Studio-only runtime styling authority.
- DISCOVER PREVIEW CAPABILITY before rendering. Component preview comes from canonical component contracts, the Core registry, shipping adapters, and the shared `neosmartuxui/component-preview@1` substrate.
- Component state controls are derived only from the selected component contract. Never invent generic states or fake browser pseudo-states with lookalike CSS.
- If Block, Page, Vertical, input-environment, or accessibility-preview capability does not yet exist as real authority, surface it as unavailable or `REGISTRY GAP`; do not manufacture a demo so the UI appears complete.
- Studio import is untrusted data. It may accept canonical Theme JSON only; imported HTML, CSS, JavaScript, fixtures, controllers, selectors, or executable code are not Theme data.
- Studio must reuse `packages/contracts/theme-package-io.mjs`, `theme-package-semantic.mjs`, `resolved-token-value.mjs`, `theme-workspace.mjs`, and the existing `packages/adapters/css/resolve-theme.mjs`. Do not copy validation, import/export, workspace, or token-mapping logic into the application.
- Preview the shipping system in isolation. Studio controls must not be restyled by the draft Theme, and preview controllers must not become visual/runtime component authority.
- The initial browser runtime keeps previews in an opaque-origin iframe sandbox with only `allow-scripts`; do not add same-origin, forms, popups, navigation, or download privileges to make a test convenient.
- The public Studio route is `/studio/`. Publish only exact already-green merged-main `dist/studio/` bytes, preserve `/studio/deployment.json`, and never rebuild or hand-edit Studio in the Pages repository.

## Migration discipline

Permanent rule: **RESTART THE ARCHITECTURE, NOT THE KNOWLEDGE.**

Before relying on a legacy source, verify its branch and exact SHA. Every migrated artifact must receive exactly one decision: `ADOPT`, `ADAPT`, `PROMOTE`, `REWRITE`, `RETIRE`, or `REFERENCE`.

Preserve provenance: source repository, path, SHA, license/attribution, old ID, new ID, decision, rationale, status, and valuable test/failure history.

Do not bulk-copy legacy components before destination contracts are defined.

## Repository discipline

`neosmartuxui/neosmartuxui` is canonical source. `neosmartuxui/neosmartuxui.github.io` is generated deployment output only.

Use branch → implementation → tests → PR → exact-SHA verification → merge. Do not do casual feature work directly on `main`.

Do not weaken or delete tests to make CI pass. Investigate the defect. Preserve exact failure details.

A GitHub Actions scheduler/control-plane incident MUST NOT be worked around by creating a no-op source commit, rewriting history, or moving `main` solely to obtain another run. When a mandatory merged-main Quality run is demonstrably orphaned before jobs execute, use `docs/CI-INCIDENT-RECOVERY.md`: existing commits only, exact canonical source SHA, byte-identical Quality workflow, unchanged mandatory gates, independently verified artifact provenance, and a temporary recovery PR that is closed unmerged. Recovery evidence substitutes for the missing scheduler execution; it does not make the orphaned run successful.

## Public proof

Permanent rule: **SOURCE ONCE. DEMONSTRATE EVERYWHERE.**

Foundry, flavor pages, vertical pages, labs, Studio, registry, and agent surfaces should render shipping contracts/implementations wherever practical. Do not create preview-only lookalikes when the real system can be rendered.

Already-proven implementation bytes MUST NOT drift silently. When a public-proof-bound file needs replacement while the old deployment is still live, use `neosmartuxui/public-proof-maintenance@1`: bind the exact active proof-record blob, link a tracking issue, declare only already-proof-bound paths, bind their old proven blobs, and require the declared path set to equal actual proof-bound drift exactly. Maintenance is never a broad skip. After verified exact deployment, the proof-only promotion refreshes the cohort/bindings and removes the satisfied maintenance records; it does not redeploy Pages.

## Work sequencing

Follow `docs/DEVELOPMENT-ROADMAP.md`, but defer to the Canonical PRD if they diverge. When a slice completes, immediately choose the earliest unfinished dependency. Do not jump ahead because later work is more exciting.

## Organization operating layer

NeoSmartUXUI has organization-level support repositories that improve continuity and repeatable execution without becoming product authority:

- `neosmartuxui/Progress-Memory` — current state, routing, checkpoints, and handoffs.
- `neosmartuxui/Process-and-Workflows` — reusable procedures, QA gates, and recovery runbooks.
- `neosmartuxui/Skills` — stable/experimental machine-routable execution capabilities.
- `neosmartuxui/Handbook` — organization decisions outside the product contract.
- `neosmartuxui/Brand` — corporate/product identity assets only; never product Flavors/Themes.
- `neosmartuxui/Infrastructure` — infrastructure documentation/runbooks; never secret values.
- `neosmartuxui/Marketing`, `Monetization`, and `Automation` — specialist laboratories that may not redefine product truth.

For session continuity, start with Progress-Memory and route to the minimum canonical context needed. For repeatable execution, prefer a matching **stable Skill**; otherwise use the best validated/repeatable Process workflow/runbook. New procedures should be learned from real execution before promotion to Skills.

Support repositories may summarize or route to this monorepo, but they MUST NOT override the authority order at the top of this file. Product authority and operating authority are deliberately separate.



## GitHub operating guardrails (NeoSmartUXUI)

- GitHub Actions is intentionally disabled for this repository. Do not enable, dispatch, or add auto-running workflows without explicit owner approval and review of GitHub's Acceptable Use Policies.
- GitHub is for version control, issues, PRs, and normal repository operations, not persistent agents, third-party website automation, incentivized tasks, scraping, or unrelated compute.
- Run tests and builds on controlled local computers or approved infrastructure, not GitHub-hosted runners.
- No cross-organization migrations; only operate within neosmartuxui unless explicitly authorized.
- Keep original recovery evidence and manifests intact; do not rewrite old SHAs or fabricate Git history.
