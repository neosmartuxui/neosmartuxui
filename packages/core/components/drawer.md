# `core.drawer`

`core.drawer` is the generic edge-origin modal overlay primitive for supplemental application content and actions.

## Semantic boundary

Drawer owns an edge-origin modal surface that temporarily interrupts interaction with underlying content without becoming a page, route, or navigation authority. Sheet remains merged into Drawer; edge, size, and presentation are configuration of `core.drawer`, not duplicate Core IDs. FocusTrap remains internal overlay infrastructure and does not become a public Core component ID. Drawer does not own business policy, network requests, form submission, application scheduling, or route changes. Trigger and action controls compose ordinary Buttons; the Drawer surface itself is not a pressable control.

## State and interaction law

Canonical semantic states are exactly `closed` and `open`. Placement, drag progress, and animation phases are not component-state IDs. Opening establishes modal interaction and focus containment; Escape, explicit close, and programmatic close share one dismissal and focus-restoration law. Closing returns focus to the valid invoker when it still exists and remains focusable. Placement is configured from the logical `inline-start`, `inline-end`, `block-start`, or `block-end` edge; RTL changes the physical mapping of inline edges without changing semantic meaning.

## Accessibility and input law

An open Drawer exposes modal dialog semantics with one accessible name and an optional description. Keyboard focus remains contained while open, and ordinary Tab/Shift+Tab traversal stays within the modal interaction path. Pointer/touch interaction may support intentional swipe or drag dismissal, but incidental scrolling or small pointer movement must not dismiss the Drawer. Swipe/drag handling must preserve nested content scrolling and must not convert the Drawer surface into a generic press target. Reduced motion and forced colors remain required, and dismissal/restoration behavior must remain equivalent across keyboard, pointer, and touch.

## Token boundary

This implementation introduces no Drawer-specific semantic token contract. It reuses the existing NeoSmartUI semantic roles already present in the 55-token Theme union. After the maintenance checkpoint, all ten official Light/Dark Themes resolve the local 38-Core scope without expanding that exact token set.

## Canonical Web implementation

The canonical Web adapter uses a native `<dialog>` opened with `showModal()`, logical `data-drawer-placement` values, native modal/top-layer focus containment, and the same idempotent close/focus-restoration law across Escape, explicit close, programmatic close, and a qualified outward swipe from the optional dedicated swipe handle. The swipe gesture is redundant with ordinary close controls and is deliberately scoped to the handle so content scrolling and small movement do not become dismissal authority.

## Maturity

Maturity is `public-proof`. The exact merged-main artifact has been deployed and verified through native Pages and live HTTPS before this structural promotion. Proof-only promotion does not redeploy Pages; it records the already-deployed 38-Core / 55-token singleton cohort and retires the satisfied exact-set Flavor maintenance.
