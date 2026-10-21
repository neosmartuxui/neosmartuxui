# Explorer v2.1 — Source-verified controls, usage recipes, agent index

Scope: Documentation and preview controls only. No new Core components, maturity promotions, provider integrations, official Theme changes or npm release.

## Canonical authority

Fourteen approved property-control recipes are authored in tooling/explorer/recipes.mjs and validated against canonical packages/core/previews/{component}/preview.json fixtures loaded via the existing tooling/foundry/component-preview-assembly.mjs. HTML specimens come from the actual source fixtures, not duplicate lookalike renderers or invented APIs. Core states and supported environments still come from the Core component contract.

Supported real Foundry actions:

- core.button: native disabled and aria-disabled on/off
- core.checkbox: checked, unchecked, indeterminate; real Checkbox adapter data-state
- core.switch: native binary on/off; no mixed state
- core.input: apply and clear text through the native input event
- core.textarea: apply and clear multiline content through native input
- core.select: choose actual non-disabled native options
- core.badge: navigate to existing authored tone-labelled specimens, without recoloring misleading labels
- core.slider: native range change; original controller updates the output
- core.tabs: actual tab click with existing selected-state and panel controller

Remaining 36 Core components and 56 experimental UI entries do not claim property controls. Their original live demos, metadata and sources remain accessible. Every supported recipe explains Use when, Native/adapter semantics, and Avoid, alongside original shipping specimen markup and source-pinned evidence; this is not an npm usage claim.

## Machine-readable data

/components/agent-index.json is a source-SHA-pinned neosmartuxui/agent-capabilities@1 index of all 106 canonical entries. It includes ID, layer, maturity, source/contract links, documented states, dependencies, accessibility support, previews and source selectors. Its controlAvailability marks only the fourteen audited source-verified controls; all others are not-declared. Each entry explicitly says documentationOnly=true and productionIntegration=false. The index declares productionPackageReleased=false. An agent must still inspect canonical contracts and source before building.

The controller only permits eight fixed, reviewed native operations. Controls and targets are authored in source and not accepted from URLs or outside configuration. Input values are bounded. Hardline pressure is derived from the canonical Theme tokens; static docs and cards remain motionless. Keyboard, RTL, reduced motion and forced-color semantics remain in automated QA.

## Validation and release discipline

The new portal emits 120 digest-pinned files plus the portal manifest. The verifier compares the agent capability index against the 106 detail records, exact source SHA, approved fourteen recipes and explicit lack of production authority. Tests are in tests/portal/recipes.spec.mjs plus previous Explorer, portal and pressure suites.

Only source-committed, pinned-SHA builds may be published. Staging must preserve .nojekyll, Foundry, Studio, flavor demos, experimental labs and historical provenance byte-for-byte. Do not run GitHub Actions. Do not release npm packages or imply that fixture callbacks are production operations.

Future recipe expansions require case-by-case adapter and fixture audit. Do not manufacture a generic property API for unsupported components.

Core exports integration: See docs/CORE-ESM-FRAMEWORK-INTEGRATIONS.md and /docs/integrations/. Five additional real Core families (Accordion, Radio, Toggle, Segmented Control, Number Field) now have source-verified controls. The private local @neosmartuxui/library/core subpath exports actual Web adapter functions; no public npm or React/Vue component package is available.
