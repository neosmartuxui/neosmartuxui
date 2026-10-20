# NeoSmartUI Spec v1 — Public Proof Contract

Permanent principle: **SOURCE ONCE. DEMONSTRATE EVERYWHERE.**

The Foundry and Labs are architecture proof surfaces, not parallel demo implementations.

## Requirements

- Public previews SHOULD render shipping contracts and implementations wherever practical.
- Fake lookalike Components, Blocks, Pages, Flavors, or Verticals MUST NOT be maintained when the real implementation can be rendered.
- Every released official Flavor MUST eventually have live foundations, Components, Blocks, Pages, light/dark, responsive, interaction-state, and real-application proof where applicable.
- Every released Vertical MUST eventually expose meaningful workflows and production states.
- Cross-flavor Vertical previews MUST reuse the same domain implementation.
- Public counts and identities MUST be generated from registries once registry authority exists.
- `neosmartui/neosmartui.github.io` is generated output only and MUST NOT become a second source of truth.

A public surface that diverges from shipping architecture is a defect, not merely stale documentation.

## Proof-bound maintenance

Public proof binds exact implementation bytes. A proven implementation that needs maintenance MUST NOT silently invalidate, rewrite, or prematurely refresh the live proof record while the old deployment is still public.

An active `neosmartui/public-proof-maintenance@1` record is the only sanctioned bridge between the currently live proof and replacement source bytes. It MUST:

- bind exactly one active public-proof Component or Flavor;
- bind the exact Git blob SHA of that subject's current `evidence/public/<subject>.json` record;
- link a repository tracking issue;
- enumerate only paths already bound by that public-proof record;
- bind each enumerated path to its exact old proven blob SHA; and
- declare exactly the complete set of proof-bound implementation paths whose current source bytes differ from the active public proof.

Maintenance is not an ignore flag. Undeclared proof drift still fails. Declared paths that have not drifted fail. Partial declarations fail. A stale proof-record anchor fails. Unknown or non-proof paths fail. Maintenance records for inactive subjects fail.

The live public-proof record remains unchanged while replacement source is under maintenance, so it continues to describe the bytes actually deployed. Replacement source still follows exact-head CI → merge → merged-main CI → independent artifact verification → exact no-rebuild Pages deployment → native Pages verification. The later proof-only promotion refreshes the singleton cohort and affected implementation bindings, then removes all satisfied maintenance records. Proof promotion does not redeploy Pages.

## CI scheduler incident recovery

A broken CI scheduler record is infrastructure drift, not permission to mutate canonical source solely to obtain another run.

When a mandatory merged-main Quality run is demonstrably orphaned before job execution, NeoSmartUI MAY accept a separate exact-SHA recovery run only under the closed incident contract in `docs/CI-INCIDENT-RECOVERY.md`. Recovery MUST preserve the same canonical source SHA, byte-identical Quality workflow, mandatory validators/tests/browser coverage, and independently verified artifact provenance. The temporary recovery PR MUST use existing commits only and MUST be closed unmerged.

Recovery evidence substitutes for the missing scheduler execution; it MUST NOT rewrite history or claim that the orphaned run itself passed.
