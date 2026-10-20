# CI Incident Recovery

GitHub Actions is evidence infrastructure, not source authority. A scheduler or control-plane incident MUST NOT force a new source commit merely to obtain another run.

## Orphaned-run recovery

A mandatory merged-main Quality run may be replaced by exact-SHA recovery evidence only when the original run is demonstrably orphaned before job execution and all of the following are true:

1. **Canonical SHA is fixed** — the source SHA under verification already exists on canonical `main`; recovery MUST NOT create a no-op commit, rewrite history, or move `main` merely to trigger CI.
2. **Original incident is preserved** — record the orphaned run ID, workflow identity, source SHA, and observable scheduler failure. Do not delete or rewrite the incident as though the original run succeeded.
3. **Existing commits only** — a recovery PR uses temporary refs that point to existing commits. Its head MUST point exactly at the canonical source SHA under verification, and its base MUST be an ancestor that gives GitHub a legitimate PR diff.
4. **Workflow-byte continuity** — the Quality workflow used by the recovery event MUST be byte-identical between the recovery base and recovery head. Recovery MUST NOT edit workflow bytes to obtain a pass.
5. **Exact checkout** — the recovery workflow MUST resolve its source checkout to the recovery PR head SHA, not the synthetic merge SHA, and all build/test provenance MUST record that same canonical source SHA.
6. **Same mandatory gates** — every mandatory Quality job and step required by the canonical workflow MUST pass. Tests, validators, browser coverage, thresholds, and live-proof checks MUST NOT be weakened for recovery.
7. **Artifact provenance** — uploaded evidence MUST bind the canonical source SHA. The artifact digest MUST be independently verified against the downloaded archive before it is accepted.
8. **Deployment discipline** — if recovery replaces a missing merged-main implementation verification, only the independently verified recovery artifact for that exact source SHA may advance to deployment. If recovery replaces a proof-only merged-main verification for a cohort that MUST NOT be redeployed, the deployable payload excluding provenance-only deployment metadata MUST byte-match the already verified live cohort.
9. **No merge of recovery PR** — the recovery PR exists only to obtain an independent scheduler execution. It MUST be labeled/preserved as recovery evidence and closed unmerged after evidence verification.
10. **No false history** — recovery evidence substitutes for the missing scheduler execution; it MUST NOT be described as the orphaned run having passed.

If a fresh exact-SHA recovery PR also fails to instantiate jobs, classify the incident as a broader GitHub Actions outage and do not treat it as release evidence.

This mechanism is an incident path, not the normal lifecycle. Normal work continues to use branch → exact-head CI → merge → merged-main CI → independent artifact verification → exact no-rebuild deployment → native Pages verification → proof promotion.
