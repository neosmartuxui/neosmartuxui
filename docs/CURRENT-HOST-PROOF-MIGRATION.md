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

## Phase 2 — exact 54-subject current-host cohort and Flavor reconciliation (local implementation)

`npm run build:proof:cohort-candidate` creates an **unverified** candidate at `artifacts/proof/current-host-cohort-candidate.json`. It walks all 49 public-proof Core records and five historical Flavor records, checks the original record SHA anchors, checks the exact present implementation Git blob SHA for every historical bound path, and requires both a real canonical preview test and a subject-specific behavior test (or at least four Light and four Dark tests for every Flavor). It cannot promote anything, and its browser report is **explicitly not source-pinned** merely because the report exists.

The historical 54-record binding audit now reconciles **131 implementation file bindings**:

- 101 are unchanged between the historical public-proof record and the current shipping implementation.
- 20 Flavor Theme `resolution.json`/`tokens.json` bindings are **ADAPT / maintenance-declared-theme-expansion**, exactly four for each of Hardline, Soft, Rivet, Mono and Pulse. Their historical record and exact maintenance anchors are verified. The old Theme Git blobs are unavailable in the restored object store: their *prior bytes are not claimed to have been diffed*. Current Theme correctness requires independent 50-Core/55-token resolution and complete Chrome coverage.
- 10 files are **ADAPT / verified-brand-host-migration**: each Flavor's Light page plus its builder/assembler. The actual original historical Git blobs are available; each old blob SHA was checked and the exact old→new text transform was verified. The allowed change is only the rebrand/host provenance text. Additional behavior, CSS or unrelated modifications cause the candidate builder to fail. These ten changes are separate from the exact-set Theme maintenance and must not be silently appended to those old maintenance records.

`spec/schemas/proof-cohort-candidate.schema.json` defines the closed, unverified schema, including the 49/5 membership, required 20 Theme adaptations, 10 rebrand adaptations, and permanent `readyForPublicProof=false`. The cohort unit tests exercise rejection of missing original blobs, modified historical paths, wrong Theme maintenance anchors, missing Core/Flavor browser coverage and incomplete published-asset manifests.

`npm run verify:proof:cohort:live` is a **separate post-publication admission gate**. It refuses an unmerged or dirty source, missing local QA attestation, stale preflight, stale candidate/report SHA, modified historical record, or any current proof-bound implementation drift. It checks *every* generated Foundry asset (not only a couple of example files) against the Pages checkout and the actual HTTPS response, verifies all 54 live subject markers and five live Flavor pages using real Chrome, and records exact source and Pages commit/tree hashes. Its artifact is `artifacts/proof/current-host-cohort-verified.json` and its status remains **LIVE_EVIDENCE_VERIFIED_PENDING_PROOF_ONLY_PROMOTION**. It does not edit history, source maturity, old maintenance, or public Pages.

### Required controlled sequence — not performed by this phase

1. Finish isolated branch/unit/restore QA, create exact source commit, and review in a guarded PR. No GitHub Actions.
2. Only after explicit owner authorization, perform source publication and merge with source SHA verification. On clean merged main run `npm run run:proof:local-qa` **sequentially**, covering all 19 restore validators, 415+ Foundry and 8+ Studio Chrome cases; the attestation is tied to this exact SHA.
3. Generate the exact-source Foundry and validate all 105+ files/manifest-authorized staging paths. Preserve historical `/foundry/`, `/studio/`, flavors, portal and proof JSON except for explicitly admitted replacement bytes. No blind root copy, no simulated CI IDs, and no public npm release.
4. If authorized, perform the guarded exact-source Foundry publication; independently confirm Pages SHA, tree SHA, disabled Actions, all live hashes and real Chromium behavior.
5. Regenerate the 54-subject candidate from the newly pinned QA report, run `npm run validate:proof:current` and `npm run verify:proof:cohort:live`. Diagnose every nonzero exit; do not weaken any check.
6. Build a **separate v2 proof-only promotion** after all independent evidence is present. Only then may `core.description-list` be promoted to public-proof as Core 50, with all Flavor maintenance provenance closed in the new system and no post-promotion redeploy.

Legacy `npm run validate:proof` is deliberately unchanged and still fails on old-host Flavor maintenance drift. That failure is not erased by a new candidate. Full historical proof retirement requires a separately admitted, versioned proof-schema migration.
