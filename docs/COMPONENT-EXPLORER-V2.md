# Component Explorer v2 — detail pages and real proof

A documentation-site milestone, not a library/package release. Every entry in the canonical 106-item catalog now has its own static, shareable page at /components/{core|commerce|operations|block|template}/{slug}/. The landing page and Home/Studio/Foundry destinations are unchanged.

## Architecture and source authority

- Component inventory is generated from the 50 Core, 35 Commerce, 12 Operations, seven Commerce Block, and two Template source registries. No aliases or renamed variants count as extra components.
- Core state and intent come from canonical packages/core/components/*.json. Proof labels come **only** from the Core registry, not from this new documentation. 49 public-proof Core, one implemented/unproven Core (DescriptionList) remain differentiated.
- Domain entries remain "Experimental", and their states, dependencies, provider authority and source module paths come from the actual domain registries.
- Pages include direct source links to the exact build commit, source excerpts copied verbatim from adapter or renderer files, links to the canonical Core contracts and related component pages. The code excerpt is not advertised as an npm API.
- Detail implementation: tooling/explorer/build-details.mjs. Browser controller: tooling/explorer/detail.mjs. Styling: tooling/explorer/detail.css, appended to the portal stylesheet using the original Hardline Theme-derived pressure roles.
- The component directory's links now go to detail pages. The previous Foundry and Lab URLs remain and are linked from the individual pages.

## Live component previews without new fake renderers

- Core previews embed the preexisting published /foundry/ route, scrolled to the canonical {id}-slice anchor. This is the real existing implementation and interactive state demonstration, not a separately invented example.
- Commerce and Operations previews embed the published fixture-only labs and find the same renderer by its data-component/data-example identifier.
- Blocks and Templates embed the existing Blocks Lab. Templates switch the existing tab to Templates.
- Ten experimental demo themes use the actual Lab theme CSS, not a marketing-only recoloring. Core Foundry proofs are **not** falsely presented as switchable across ten themes: Studio and full flavor previews are linked separately.
- Responsive iframe width can be toggled between desktop and mobile. Controls follow native button semantics, focus-visible, forced colors, reduced motion and the Hardline pressure token contract.
- No payment, license entitlement, subscription, secret, external request, or agent execution provider is introduced here.

## Delivery and tests

Portal build now emits 119 hashed static files including 106 detail pages, details.json, component-detail.mjs and portal.css. portal-manifest.json lists the exact files, source SHA and hashes. Verify with npm.cmd run verify:portal, test via npm.cmd run test:portal. The implementation was locally verified across 37 Chromium cases including all 106 routes, source provenance, actual embedded Core/Commerce/Operations/Block/Template renderers and mobile/RTL states.

A deploy must be built from clean HEAD with NEOSMARTUXUI_SOURCE_SHA pinned. Only generated portal files may be staged in the Pages repository, retaining .nojekyll and old Foundry, Studio, Flavors and Labs byte-for-byte. GitHub Actions stay disabled. The npm distribution release gate remains closed.

## Next depth milestone

The new detail architecture allows an incremental second Explorer wave: renderer-specific property controls and authored usage recipes, richer API docs per family, and machine-readable snippets where contracts support them. Do not invent generalized props or state simulators for Core components that do not have those capabilities, and do not classify documentation completeness as Core public-proof.
