# Third-party attribution audit (local, not yet cleared)

Scope: recovered NeoSmartUXUI tracked sources and assets, archived NeoBrutal Commerce and NeoBrutal Soft source-license metadata, and currently locked npm dependencies. This is a reproducible technical inventory, not a legal sign-off.

## Source provenance

| Source | Original status | NeoSmartUXUI treatment |
|---|---|---|
| NeoSmartUXUI Core and Themes | Recovered source had no top-level license | Owner explicitly selected Apache-2.0; see root LICENSE |
| NeoBrutal Commerce | PolyForm Noncommercial 1.0.0, Copyright 2026 NeoBrutalism-shop | Owner-authorized adaptations under Apache-2.0; archive remains PolyForm |
| NeoBrutal Soft v0.7 | Original package metadata declared UNLICENSED | Owner-authorized operations patterns under Apache-2.0; archive unchanged |
| NeoLicenser and NeoLicenser Pro | Archived repositories contain placeholder READMEs, Pro private | No backend or private Pro code included; v0.7 Soft demo provided UI inspiration |

Keep the original source-license fields in component and admission registries. Apache-2.0 is the target license for this new repository, not an instruction to overwrite original source-license evidence.

## Locked npm development dependencies

The root package-lock.json lists exactly these three installed npm development dependencies:

| Package | Version | Lockfile license |
|---|---|---|
| @playwright/test | 1.64.1 | Apache-2.0 |
| playwright | 1.64.1 | Apache-2.0 |
| playwright-core | 1.64.1 | Apache-2.0 |

The local browser DOM package lists no runtime npm dependencies. That does not mean all future framework, fonts or web assets are cleared.

## Source and asset scan

- App image assets located: Foundry and Studio favicon.svg and favicon.ico.
- No bundled .woff, .woff2, .ttf or .otf fonts were found in application source.
- The chart SVG is programmatically generated using browser primitives; component styles consume local theme tokens.
- URLs in the component code primarily represent runtime host validation and relative demo/documentation links, not permission to republish externally hosted media.

## Outstanding attribution and provenance checks

1. Confirm that original icon assets and all contributed source code, text and design assets are owned or otherwise compatible with the intended Apache-2.0 distribution. Archived repository histories were reconstructed and may omit prior contributors.
2. Review third-party code/material newly added before a future release and include any required third-party notices.
3. Confirm final packaged assets and their hashes, not only the development dependency lockfile.
4. Preserve original notices required by Apache-2.0 section 4 and by any independently licensed assets.

**Status: open.** release-admission thirdPartyAttributionReviewed remains false. Public release is prohibited until these items are reviewed and recorded. Cross-project owner authorization is not blanket third-party clearance.
