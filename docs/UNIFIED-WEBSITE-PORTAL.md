# NeoSmartUXUI unified website portal

A premium connected marketing and documentation shell with eight portal pages and a 106-entry catalog. Existing Foundry, Studio, flavors and experimental demos are linked as one product without upgrading maturity of experimental interfaces.

## Routes

- / — unified landing page
- /components/ — 50 Core, 35 Commerce, 12 Operations, 7 Blocks, 2 Templates
- /themes/ — five flavors in light and dark, linking to existing flavor previews and Theme Studio
- /blocks/ — seven experimental Commerce compositions
- /templates/ — two example operations screens
- /labs/ — directory linking the published /labs/experimental/ preview
- /flavors/ — directory linking five existing flavor routes
- /docs/ — source and release documentation
- /foundry/ — relocated original Foundry HTML with root-anchored assets
- /studio/, /flavors/{flavor}/, and /labs/experimental/ — existing deployments untouched

Historical bookmarks including /#button-slice and /#principles redirect to /foundry/ with fragments preserved. The root deployment.json becomes a provenance record for the portal commit, and original Foundry deployment evidence moves to /foundry/deployment.json.

## Architecture and release safety

Source: tooling/portal/pages.mjs, site.css, site.mjs, build.mjs, verify.mjs, stage.mjs, serve.mjs; tests/portal and playwright.portal.config.mjs. All registry counts are derived from Core, Commerce, Operations and Block source metadata. Output remains ignored in artifacts/portal-public and artifacts/portal-stage.

For final publishing, npm.cmd run build:portal requires clean committed source and NEOSMARTUXUI_SOURCE_SHA equal to Git HEAD. For unfinished local work, set NEOSMARTUXUI_PORTAL_DRAFT=1. Stage against a clean Pages checkout using npm.cmd run stage:portal:local. Validate with npm.cmd run verify:portal and npm.cmd run test:portal. GitHub Actions remain disabled.

Pages deployment may change only root index.html and deployment.json, new portal.css, portal.mjs, portal-manifest.json, section index pages, foundry/index.html and foundry/deployment.json. Existing Studio, flavor previews, experimental Labs, existing assets and .nojekyll remain unchanged.

Never deploy artifacts/library-package, or imply experimental Commerce or Operations UI provides actual billing, licensing or agent actions. Apache-2.0 source publication and production/npm release admission are separate.

## Verification

Portal tests cover desktop/mobile, RTL, reduced motion, keyboard navigation, search/filter, all section pages and their crosslinks, real preexisting routes, and historical deep-link redirects. Passing the portal suite does not open the product/public npm release gate.
