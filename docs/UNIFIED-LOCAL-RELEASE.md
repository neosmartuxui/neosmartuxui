# Unified library local integration and public release blockers

The local ecosystem build embeds a searchable 106-entry catalog into built Foundry and Studio (97 components, 7 Blocks, 2 Templates), using isolated sandboxed preview routes and all ten canonical Theme bundles. The original Core component picker in Studio remains unchanged and the public-proof route is NOT modified in source. The ecosystem routes are added only to ignored output artifacts when the explicit environment flag NEOSMARTUXUI_LOCAL_ECOSYSTEM=1 is present.

## Windows usage

From D:\neosmartuxui-recovered\neosmartuxui, run:
- $env:NEOSMARTUXUI_LOCAL_ECOSYSTEM='1'; npm.cmd run build:ecosystem:local
- npm.cmd run validate:ecosystem; npm.cmd run test:ecosystem
- In another terminal, npm.cmd run serve:foundry, open http://127.0.0.1:4173/ecosystem/
- Or npm.cmd run serve:studio, open http://127.0.0.1:4174/ecosystem/

Private distributable (NOT publishable): artifacts/library-package with @neosmartuxui/library DOM ESM subpath exports. No npm publish, GitHub Actions, push/pull or source-affecting production deployment.

## Mandatory release admission

A public release is blocked until the owner chooses a canonical LICENSE, third-party attribution has been reviewed, production provider adapters for commerce/licensing are proven, main SHA/artifact are pinned to the new host, legacy proof is re-established legitimately, and public publishing is explicitly approved. Run npm.cmd run gate:public to confirm the fail-closed posture. Any local ecosystem overlay must be excluded from public build artifacts; rebuild Foundry/Studio WITHOUT the local overlay when preparing deployable artifacts.

Historical Core public proof is unchanged; local tests never upgrade public maturity.
