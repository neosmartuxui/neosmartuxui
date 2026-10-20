# NeoSmartUI Foundry — Source and Deployment Contract

This document is derived from the Canonical PRD. The Canonical PRD remains authoritative.

## Active development topology — GitHub first

```text
neosmartui/neosmartui
        ↓
build + test + validate
        ↓
GitHub Actions
        ↓
neosmartui/neosmartui.github.io
        ↓
https://neosmartui.github.io/
```

`neosmartui/neosmartui` owns source, contracts, tests, tooling, and history. `neosmartui/neosmartui.github.io` owns generated deploy output only. GitHub Pages is the authoritative public host throughout active development.

**Custom domain is deferred until the full development roadmap is complete.** `neosmartui.com`, Cloudflare, registrar settings, DNS records, and custom-domain certificates are deliberately out of scope during active product development. They MUST NOT block roadmap execution, CI, deployment, browser QA, or a public-proof claim that is already verifiable on the GitHub Pages host.

## Foundry baseline

The Foundry root is both a product landing page and a live system index. During development it deliberately exposes only architecture that actually exists. Flavor, vertical, Studio, and Lab routes must not be hand-built lookalikes before their shipping implementations exist.

Source lives under `apps/foundry/`. `npm run build:foundry` writes deterministic static output to `dist/foundry/`. Studio source lives under `apps/studio/`; `npm run build:studio` writes deterministic static output to `dist/studio/`. Each public artifact carries its own `deployment.json` with the canonical `neosmartui/neosmartui` source SHA. Foundry publishes at `/`; Studio publishes at `/studio/`.

Development builds MUST NOT emit a `CNAME`. The deployment repository therefore uses its native GitHub Pages hostname until the entire development roadmap is complete and a separate custom-domain milestone is intentionally started.

## Safe CI / deployment strategy

1. Pull-request CI validates repository authority, builds the Foundry from the explicit PR head SHA, and runs real Chromium browser QA.
2. No PR or branch build pushes to the deployment repository.
3. After merge to `main`, the same Quality workflow builds and browser-tests the exact merged SHA.
4. The generated `dist/foundry/` and `dist/studio/` trees from a green merged SHA are the only valid publish inputs for their respective public routes.
5. The deployment repository must remain generated output only; do not hand-maintain a divergent implementation there.
6. A Foundry live proof claim requires the root public `deployment.json` to match its canonical merged source SHA. Studio independently exposes `/studio/deployment.json`; do not substitute one record for the other.
7. Failed deployment must not rewrite canonical source history.
8. Custom-domain work begins only after the full development roadmap is complete; that later migration must preserve the same source-SHA proof contract and must not weaken GitHub Pages verification.

## Deployment automation and bootstrap

The preferred permanent path is a dedicated cross-repository GitHub Actions deployment using a narrowly scoped credential or GitHub App installation that can write only `neosmartui/neosmartui.github.io`.

Until that credential is configured, an authorized maintainer or connected GitHub integration MAY bootstrap-publish the exact already-green `dist/foundry/` and/or `dist/studio/` artifact trees to their canonical deployment paths. The bootstrap path MUST preserve each artifact's `deployment.json`, MUST NOT edit generated files independently, and MUST be followed by native Pages plus live URL/source-SHA verification. Any Foundry cohort movement still requires the normal proof-only promotion after deployment.

Custom-domain configuration is intentionally excluded from every active-development milestone. After the roadmap is complete, it may be scheduled as a separate infrastructure/release milestone.
