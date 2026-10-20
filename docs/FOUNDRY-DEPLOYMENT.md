# NeoSmartUXUI Foundry — Source and Deployment Contract

This document is derived from the Canonical PRD. The Canonical PRD remains authoritative.

## Active development topology — controlled local release

GitHub Actions stays **disabled** in every NeoSmartUXUI repository. This safety decision supersedes legacy CI/Actions prescriptions from the September 2026 archived PRD and deployment documents.

1. Build, validate, and run Chrome/Chromium browser tests on an authorized local machine or controlled VPS.
2. Keep source in neosmartuxui/neosmartuxui; keep only generated Foundry and Studio files in neosmartuxui/neosmartuxui.github.io.
3. Push the tested source commit, then rebuild with NEOSMARTUXUI_SOURCE_SHA set to that exact commit SHA.
4. Deploy only generated dist/foundry root and dist/studio subdirectory by explicit local Git operation, after confirming Actions is disabled in both repositories.
5. Verify Pages and both deployment records live, matching the exact tested source commit. Native GitHub Pages legacy publishing is not permission to enable GitHub Actions.
6. Historical proof records are not current proof. Re-establish browser proof under the new hostname before promoting new public-proof claims.

GitHub Pages: https://neosmartuxui.github.io/

## Foundry baseline

The Foundry root is both a product landing page and a live system index. During development it deliberately exposes only architecture that actually exists. Flavor, vertical, Studio, and Lab routes must not be hand-built lookalikes before their shipping implementations exist.

Source lives under `apps/foundry/`. `npm run build:foundry` writes deterministic static output to `dist/foundry/`. Studio source lives under `apps/studio/`; `npm run build:studio` writes deterministic static output to `dist/studio/`. Each public artifact carries its own `deployment.json` with the canonical `neosmartuxui/neosmartuxui` source SHA. Foundry publishes at `/`; Studio publishes at `/studio/`.

Development builds MUST NOT emit a `CNAME`. The deployment repository therefore uses its native GitHub Pages hostname until the entire development roadmap is complete and a separate custom-domain milestone is intentionally started.

## Safe local validation and deployment

- Run npm run quality:restore for architecture, schemas, local contracts and local builds.
- Run the full Foundry and Studio browser test suites on your authorized computer before publishing.
- The strict legacy npm run quality includes archived public-proof source-byte assertions, which remain unresolved until fresh new-site proof exists. Do not bypass them and call old evidence current.
- .github/workflows is inert historical content. Do not enable Actions or dispatch workflows.
- Set both generated deployment records to the exact locally-tested Git commit SHA; do not edit generated HTML/CSS/JS by hand.
- Recovered historical SHA records are archival, not reconstructed Git commit graph.

## Deployment automation and bootstrap

Only authorized local agents/maintainers may perform explicit pushes after checking Actions remains disabled. No scheduled GitHub-hosted jobs, autonomous agents on runners, or unattended cross-repository deployment tasks are authorized. Existing CI references in the archival PRD do not override this safety policy.

Custom domain is deferred until the full development roadmap is complete. The historical neosmartui.com domain should not be assumed available; no ownership or DNS is assumed for neosmartuxui.com.
