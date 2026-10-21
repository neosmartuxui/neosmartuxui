# Current-host public-proof migration (local-only gate)

This document supplements `docs/PUBLIC-PROOF-GATE.md` and `docs/FOUNDRY-DEPLOYMENT.md`. The canonical PRD still governs the product. Existing `neosmartui/public-proof@1` evidence and all five exact-set Flavor maintenance records remain archival and **must not be mass-rewritten or silently treated as proof for the new host**.

## Why the separate gate exists

The original 54 proof records describe `neosmartui/neosmartui`, `neosmartui.github.io`, and GitHub Actions run/artifact IDs. The canonical project is now `neosmartuxui/neosmartuxui`, the approved public host is `https://neosmartuxui.github.io/`, and **GitHub Actions is intentionally disabled**. Replacing old names, minting fake Actions IDs, suppressing historical implementation-blob drift, or marking `core.description-list` public-proof prematurely would corrupt provenance.

`core.description-list` remains **implemented**, not public-proof. Core public-proof count stays **49**, and the old 54 records remain independently preserved (49 Core + 5 Flavors).

## Local, fail-closed candidate gate

From a clean, merged, exact `origin/main` source checkout:

1. Run `node tooling/proof/run-local-proof-qa.mjs`. The script rejects dirty or unmerged checkouts, pins `NEOSMARTUXUI_SOURCE_SHA`, builds Foundry, runs the complete Foundry Chrome suite, builds Studio, and runs the complete Studio Chrome suite **sequentially**. It validates at least 415 Foundry and 8 Studio passing test results, zero skipped/flaky/failed tests, and eight actual Description List specs. It records SHA-256 digests for both reports and both generated deployment records in an ignored local attestation. Do not run overlapping Playwright suites sharing `test-results`.
2. After a separately authorized exact-SHA guarded website publication and independent live verification, run `node tooling/proof/current-host-gate.mjs --preflight`. It checks clean synchronized source/Pages checkouts, disabled GitHub Actions, local/Pages/live Foundry source identity, exact generated/Pages/HTTPS asset bytes, and the locally recorded test attestation. The public artifact is under `/foundry/`, while the CSS asset is currently at the site root. No URL aliasing is assumed.
3. Read `artifacts/proof/current-host-preflight.json` and investigate every blocker. The gate exits nonzero when a check fails. It produces a **candidate preflight only**; it never changes registry maturity, proof records, Pages files, Git history, or package-release state.

The full `validate:proof` historical validator remains intact, including the current Hardline maintenance mismatch (old record binds four Theme files but two additional proof-bound paths now differ: `apps/foundry/src/flavors/hardline/index.html` and `tooling/foundry/build.mjs`). Fix that authority conflict with an explicit source-admission decision; never add unrelated paths or skip checks just to turn a test green.

## Remaining admission steps, not automated by this slice

- Establish a new-host proof-record schema/validator and an independently verified, source-pinned **singleton cohort for all 49 previously proven Core components and five Flavors**. Subject-level implementation blob bindings and browser coverage must be re-established, not inferred from a single Description List smoke test.
- Create a new-host, local-QA provenance replacement for the historical Actions-specific fields. Preserve verifiable run logs, report hashes, exact source SHA, Pages Git tree/commit, live response hashes, and actual official-Flavor browser evidence. Historical IDs remain historical.
- Reconcile or explicitly supersede the five protected Flavor maintenance records with validated exact-path provenance.
- Only after the new proof cohort, deployment, native/live checks, and proof-only promotion have passed may the registry advance `core.description-list` from `implemented` to `public-proof`, moving Core from 49 to 50.

The canonical `SPEC → CORE → COMPONENTS → BLOCKS → PAGES → APPLICATIONS` ordering and approved Hardline pressure system remain unchanged. Public npm release is outside this work.

## Audited legacy-binding inventory (read-only)

Run `npm run audit:proof:legacy` to regenerate `artifacts/proof/legacy-proof-inventory.json`. This diagnostic deliberately **does not** validate, rewrite, or promote old proofs. The initial inventory found all 49 Core implementation bindings unchanged; all five Flavor records have two additional undeclared proof-bound changes each. Their old proof-record anchors remain valid.

| Flavor | Additional undeclared proof-bound paths |
| --- | --- |
| Hardline | `apps/foundry/src/flavors/hardline/index.html`, `tooling/foundry/build.mjs` |
| Soft | `apps/foundry/src/flavors/soft/index.html`, `tooling/foundry/assemble-soft-dark.mjs` |
| Rivet | `apps/foundry/src/flavors/rivet/index.html`, `tooling/foundry/assemble-rivet-dark.mjs` |
| Mono | `apps/foundry/src/flavors/mono/index.html`, `tooling/foundry/assemble-mono-dark.mjs` |
| Pulse | `apps/foundry/src/flavors/pulse/index.html`, `tooling/foundry/assemble-pulse-dark.mjs` |

These conflicts require source-admission and proof migration decisions; **do not** merely add extra paths to old maintenance records, because current-host proof is a separate authority.
