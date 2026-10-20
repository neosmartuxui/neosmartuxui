# Unified library local integration and public release blockers

The local-only build adds a searchable 106-entry catalog to generated Foundry and Studio artifacts: 50 Core + 35 Commerce + 12 Operations components, 7 Blocks, and 2 Templates. All use the ten existing Theme bundles. Core's public proof authority remains unchanged; the local catalog is not part of deployable source and is not proof.

## Local build (no push or deployment)

From D:\neosmartuxui-recovered\neosmartuxui:

- Enable the local-only flag in PowerShell: $env:NEOSMARTUXUI_LOCAL_ECOSYSTEM='1'
- Build: npm.cmd run build:ecosystem:local
- Verify: npm.cmd run validate:ecosystem
- Inspect: npm.cmd run test:ecosystem
- Preview only on the same desktop: npm.cmd run serve:foundry and open http://127.0.0.1:4173/ecosystem/ or run npm.cmd run serve:studio and open http://127.0.0.1:4174/ecosystem/

Generated package: artifacts/library-package. Its metadata is Apache-2.0 and it includes LICENSE and NOTICE, but private is true and version is 0.0.0-local. It is **not yet approved for public distribution**.

## Public release admission

Apache-2.0 has been selected by the owner and a canonical LICENSE/NOTICE are installed.

Public release is still blocked pending third-party provenance review, live production adapters (licensing, checkout, entitlement and recovery), new-host deployment proof bound to exact code and artifacts, removal of local-only discovery overlays, and a separate explicit publishing approval.

Run npm.cmd run gate:public to confirm fail-closed behavior. Never deploy ignored dist output containing the local catalog. Any future public artifact must be rebuilt from clean source without the local overlay and must pass its own independent proof.

Do not use GitHub Actions for the automation or build work, do not push/pull merely to synchronize in-progress local work, and do not treat local browser tests as a substitute for real site acceptance.
