# Commerce platform-reference admission (non-components)

This file explicitly accounts for four archived source entries that are NOT component, Block or Template definitions. They must not inflate the component counts.

## component-contract

- Existing authority: packages/core/component-registry.json; packages/verticals/commerce/component-registry.json; packages/verticals/operations/component-registry.json
- Classification: mapped-to-existing-contract-authority
- Remaining gap: No separate Commerce platform contract registry is needed

## tokens

- Existing authority: spec/core/token-contracts.json; packages/themes/*/tokens.json
- Classification: mapped-to-existing-theme-authority
- Remaining gap: Theme editing remains exclusively in Studio

## system-states

- Existing authority: domain state types in packages/verticals/commerce/index.d.ts and packages/verticals/operations/index.d.ts
- Classification: documented-interface-only
- Remaining gap: Runtime provider adapters and canonical state persistence are not implemented

## ownership-lifecycle

- Existing authority: packages/verticals/commerce/wave4.mjs and provider callback types in index.d.ts
- Classification: documented-interface-only
- Remaining gap: NeoLicenser backend, entitlement signatures, license persistence and billing remain unimplemented

## Scope

All 47 source entries now have a destination or reference classification: 35 local Commerce component renderers; 1 Core reuse; 7 local Commerce Blocks; 4 platform references. This DOES NOT mean the licensing/payment backend is completed. No provider API integration, signed distribution, or public proof is claimed. Theme authoring authority stays in existing Studio, and this milestone adds only local previews.
