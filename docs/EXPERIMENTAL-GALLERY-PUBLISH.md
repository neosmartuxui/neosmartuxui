# Experimental public component gallery

Owner authorized publishing a clearly marked experimental gallery after the Apache-2.0 source publication on 20 October 2026. This authorizes one isolated documentation/demo route on the existing GitHub Pages website, **not** production release of @neosmartuxui/library, and **not** a bypass of packages/distribution/release-admission.json.

## Explicit publication boundary

- Site route: https://neosmartuxui.github.io/labs/experimental/
- Source: tooling/experimental/{build.mjs,verify.mjs,site.mjs,site.css,serve.mjs} plus tests/experimental and playwright.experimental.config.mjs.
- Contents: 35 Commerce components, 12 Operations components, 7 Commerce Blocks, 2 templates and ten canonical Themes, using illustrative sample data and simulated host callbacks. Existing 50 Core components remain on the original Foundry site.
- The artifact is NOT the local-only ecosystem overlay (dist/foundry/ecosystem or dist/studio/ecosystem), NOT a private npm package, and NOT a production provider integration.
- The previously deployed Pages root and studio/ files and their deployment.json provenance are not to be modified by this milestone.
- GitHub Actions remains disabled in both the source and Pages repositories.

## Safe build and verification

Commit and push the reviewed source first. Build from the committed source using NEOSMARTUXUI_SOURCE_SHA equal to the exact Git SHA (no dirty tree) with npm.cmd run build:experimental. Run npm.cmd run verify:experimental and npm.cmd run test:experimental on the controlled local machine.

Only copy artifacts/experimental-public/** into the Pages repository at labs/experimental/. The release artifact contains an artifact-manifest.json with the exact source SHA and SHA-256 for each listed static file. The generated package at artifacts/library-package MUST NOT be copied or published. The Pages commit must alter only labs/experimental/** and a narrow line-ending attribute for that subtree. Preserve every existing Pages deployment file byte-for-byte.

Push the Pages repository only after source SHA and Actions-disabled checks. Verify the live index, catalog, manifest and representative demos, including direct HTTPS fetch and corresponding hashes of deployed files. If the Pages host never updates without GitHub Actions, do not enable Actions; report this as a publishing blocker instead.

## State and proof

- This gallery is **public experimental preview**, not stable API, payment processing, licensing backend or verified app proof.
- Existing Core proof states, Pages deployment records and Theme Studio are not promoted or changed.
- Public npm/package/product release remains blocked by third-party provenance review, real provider integrations, exact production deployment evidence, and a separate approval.
- A successful experimental gallery deployment changes only its gallery-specific release status, not production readiness.
