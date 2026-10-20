# `core.color-picker`

`core.color-picker` owns generic opaque color-value selection.

## Semantic boundary

The initial contract owns one opaque sRGB color value and committed-selection semantics. Palette presets, gradients, alpha channels, brand tokens and design-tool workflows are outside this first slice. Where the Web uses native `<input type="color">`, the browser/OS picker remains platform-owned; Core MUST NOT manufacture a fake portable `open` state merely to style the modal.

## State and interaction law

Canonical states are `rest`, `hover`, `focus-visible`, `pressed`, `selected`, `invalid`, `disabled`.

The collapsed picker/trigger may compress toward the surface on direct contact and must never float upward. Persistent selected color is independent from transient press feedback, and invalid/unsupported value handling must remain explicit.

## Accessibility and input law

The control requires an accessible name and visible focus. A visual swatch cannot be the only expression of the value when assistive technology needs a textual/value representation. Touch cannot depend on hover; forced colors must preserve boundary/focus even when custom swatch color is suppressed.

## Token boundary

This implementation introduces no component-specific semantic token contract. It reuses existing NeoSmartUXUI roles; the deployed and publicly proven official Theme scope is now exactly 30 components while preserving the exact 55-token semantic union.

## Canonical Web implementation

The canonical Web adapter binds an `.ns-color-picker` root whose value authority is one real `<input type="color">`. The adapter accepts only opaque six-digit sRGB hex values, mirrors the committed value to a textual `<output>`, and installs only native `input` / `change` synchronization.

The adapter does not call `showPicker()`, install synthetic keyboard behavior, or expose a portable open/closed state. The browser/OS picker remains platform-owned. Pressure styling applies only to the collapsed native color control; committed color state remains distinct from transient contact.

## Maturity

Maturity is `public-proof`. The canonical public-proof record binds the already-deployed exact merged-main 30-component cohort; proof-only promotion does not redeploy Pages.
