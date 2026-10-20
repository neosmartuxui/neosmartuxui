# Legacy migration inventory

NeoSmartUI migrates **knowledge, evidence, and proven behavior**, not legacy repository structure.

The governing rule is:

> **RESTART THE ARCHITECTURE, NOT THE KNOWLEDGE.**

`inventory.json` pins every legacy source to an exact commit SHA and records selected evidence for later ADOPT / ADAPT / PROMOTE / REWRITE / RETIRE / REFERENCE decisions.

## Provenance rules

1. Never read a moving legacy branch as migration authority. Use the pinned SHA.
2. A legacy path is evidence, not NeoSmartUI authority.
3. Do not infer reuse rights from public visibility. License evidence is recorded independently.
4. Do not bulk-copy implementation while classification is unresolved.
5. Commerce is a **Vertical**, not a Flavor.
6. Soft is a **Flavor**; SaaS semantics belong to a Vertical.
7. Missing NeoSmartUI capability remains a `REGISTRY GAP`; migration evidence does not authorize invention.

## License evidence

At the captured snapshots:

- `NeoBrutalism-shop/NeoBrutal-Commerce` contains `LICENSE.md` declaring **PolyForm Noncommercial License 1.0.0**. Code-copy decisions therefore require explicit license review.
- `NeoBrutalism-shop/spec`, `NeoBrutalism-shop/NeoBrutal-Soft`, and `NeoBrutalRivet/NeoBrutal-Rivet` do not declare a license in GitHub repository metadata at capture time. They remain knowledge/evidence sources until reuse rights are deliberately reviewed.

This inventory is provenance metadata, not legal advice.

## Commands

```bash
npm run validate:migration
npm run migration:report
```

`migration:report` prints a deterministic human-readable summary from the machine-readable inventory.
