# Public Proof Gate

`public-proof` is an evidence state, not a marketing label.

A release subject such as a Core component or official Flavor may advance to `public-proof` only when all of the following are true for the same canonical source lineage:

1. **Implementation evidence** — the proof points to committed adapter/runtime, Theme, or other shipping implementation files appropriate for the subject.
2. **Exact-SHA browser evidence** — Chromium QA passes against a Foundry build checked out from the PR head SHA (or the merged `main` SHA on push). The run must exercise the actual rendered subject rather than only inspect source text.
3. **Deployment provenance** — the generated Foundry includes `deployment.json` with `neosmartui/deployment-record@1` and the exact canonical source SHA.
4. **Live evidence** — the native GitHub Pages deployment serves that deployment record and the subject proof surface successfully. Flavor proofs use a dedicated Flavor route and may additionally bind live generated assets.
5. **No maturity leap** — a CI artifact by itself is not public proof. A deployed page without exact-SHA provenance is not public proof.

## Singleton-host deployment cohort

During development the proof host is `https://neosmartui.github.io/`. Because this is one mutable deployment endpoint, every `public-proof` record validated against the current live host MUST bind the source SHA currently served by `deployment.json`.

When a newer green Foundry deployment replaces an older one, unchanged public-proof subjects are refreshed into the newer deployment cohort using the newer exact-SHA browser artifact and Pages provenance. Their implementation-file blob bindings remain unchanged unless the implementation itself changed. This prevents a historical proof record from being misrepresented as the lineage of the current live host. Subject-specific page URLs and generated assets are not cohort identity; source, browser evidence, Pages provenance, and the deployment-record endpoint are.

## Proof-bound maintenance

Already-proven implementation bytes may need maintenance while the current live deployment and its proof record remain valid. In that state, never rewrite the public-proof record early and never weaken structural proof to permit broad drift.

An active maintenance record lives at `evidence/maintenance/<subject>.json` and uses `neosmartui/public-proof-maintenance@1`. It binds the exact current public-proof record blob and the exact old proven blobs for every intentionally changing proof-bound path. The declared path set MUST equal the actual proof-bound mismatch set exactly.

Maintenance validation therefore fails when:

- proof-bound bytes drift without a maintenance record;
- the maintenance record declares a path not bound by the active proof;
- the declared prior blob differs from the active proof record;
- the proof record changed after the maintenance record was created;
- only part of the actual mismatch set is declared;
- a declared implementation path has not actually changed;
- the record names an inactive/unknown subject; or
- the record shape, tracking issue, filename, or repository-relative paths are invalid.

The active public proof continues to describe the old live Pages bytes throughout implementation. After exact-head and merged-main CI, independently verify the replacement merged-main artifact, deploy those exact bytes without rebuild, verify native Pages, and only then submit a proof-only promotion that refreshes the singleton cohort/bindings and removes the maintenance record. Do not redeploy after proof promotion.

## Browser evidence

The browser gate exercises the real rendered Core primitives and currently verifies:

- native control semantics;
- minimum 44px effective targets where required;
- pressure-not-levitation rest → hover → active behavior for pressable controls;
- zero spatial translation for `core.input`, which is interactive but not pressable;
- explicit keyboard focus;
- persistent checked/unchecked/indeterminate checkbox state;
- input empty/filled state synchronization without replacing native editing;
- invalid, read-only, and disabled states against resolved Theme tokens;
- bidi direction resilience for text input;
- reduced-motion behavior without loss of state feedback;
- forced-colors visibility/focusability;
- no console/page errors during initial render.

Official Flavor proof additionally verifies that the same shipping Core adapters consume the Flavor's resolved semantic Theme without renderer forks, while static surfaces remain static and pressure geometry, timing, focus, and generated Theme assets remain faithful to the implemented contract.

Successful runs upload screenshots, the JSON Playwright report, and the exact built `dist/foundry` artifact. Failure artifacts are retained under the same workflow run.

A release subject reaches `public-proof` only after its structural record, implementation blob bindings, exact-SHA browser evidence, Pages provenance, and live marker contract all pass together.

## Orphaned GitHub Actions runs

A mandatory merged-main verification that is orphaned by GitHub Actions before jobs instantiate does not require a new source SHA. Use the incident-only exact-SHA recovery contract in `docs/CI-INCIDENT-RECOVERY.md`.

The recovery run must exercise the same canonical source SHA with byte-identical Quality workflow bytes and the same mandatory gates. Its uploaded artifact must bind that exact SHA and its archive digest must be independently verified. A recovery PR uses existing commits only, is never merged, and is closed after its evidence is preserved.

For an implementation cohort, the verified recovery artifact may serve as the merged-main artifact only when every recovery invariant passes. For a proof-only promotion where the lifecycle forbids redeployment, the recovery payload excluding provenance-only `deployment.json` must additionally byte-match the already verified live Pages payload.

The original orphaned run remains an incident record. Never state or imply that it passed merely because a separate recovery run succeeded.
