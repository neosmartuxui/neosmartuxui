# NeoSmartUI Spec

NeoSmartUI Spec is the normative architecture contract that evolves under the same SHA as implementation.

The Canonical PRD at `docs/CANONICAL-PRD.md` remains the product, migration, roadmap, quality, and competitive-strategy authority. Spec documents make its architecture executable; they do not replace it.

## v1 architecture

- [`architecture/FOUNDATIONS.md`](architecture/FOUNDATIONS.md) — normative layers and composition model.
- [`architecture/TAXONOMY.md`](architecture/TAXONOMY.md) — definitions for Core, Component, Block, Page, Application, Flavor, Theme, Vertical, Adapter, Agent, and Resolver.
- [`architecture/DEPENDENCIES.md`](architecture/DEPENDENCIES.md) — allowed ownership/dependency directions and anti-duplication rules.
- [`architecture/PUBLIC-PROOF.md`](architecture/PUBLIC-PROOF.md) — live proof and source-once rules.
- [`schemas/`](schemas/) — versioned machine-readable identity and capability contracts.
- [`core/TOKENS.md`](core/TOKENS.md) — value-free Core semantic token authority and Flavor/Theme resolution boundary.
- [`core/token-contracts.json`](core/token-contracts.json) — machine-readable semantic token catalog.

Meaning and ownership are defined before bulk implementation. Stable schemas and token contracts extend that authority; they do not authorize registry counts or implementation claims that have not been proven.
