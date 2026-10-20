# `core.dialog`

`core.dialog` is the generic application-modal content and focus-containment primitive.

## Semantic boundary

Dialog owns modal presentation, focus containment while open, dismissal coordination and focus restoration. It does not own destructive/confirmatory AlertDialog semantics, edge-origin Drawer behavior, anchored Popover behavior, navigation semantics, business policy, or application-specific workflow decisions. A Dialog trigger is ordinary Button composition rather than a second trigger primitive. Focus containment is implementation infrastructure inside modal capabilities; `FocusTrap` MUST NOT become a public Core component ID merely to increase breadth.

## State and interaction law

Canonical semantic states are only `closed` and `open`. Opening/closing animation phases are implementation timing, not additional component states. The modal surface itself is not generically pressable and does not inherit Button pressure travel. When open, interaction outside the modal is unavailable to the active interaction path until the Dialog is dismissed or completed.

## Accessibility and input law

An open Dialog must expose modal dialog semantics with one accessible name and may expose an explicit description. Opening moves focus deterministically to an appropriate target inside the Dialog or to the Dialog surface when that is the safest fallback. Tab and Shift+Tab remain contained within the open modal without creating an application-wide keyboard trap after close. Escape dismisses an ordinary dismissible Dialog. Explicit close and programmatic close use the same focus-restoration law: return focus to the invoking element when it still exists and remains a valid focus target. Pointer/touch dismissal cannot be the only available dismissal path. RTL affects logical layout without changing modal focus order.

## Token boundary

This contract introduces no component-specific semantic token contract. It reuses the existing NeoSmartUXUI semantic roles already present in the 35-Core / 55-token deployed Theme union. Contract-only admission does not expand official Theme resolution scope, shipping previews, public proof, or Pages.

## Canonical Web implementation

The canonical Web adapter uses a real native `<dialog>` and opens it with `showModal()`. Browser modal/top-layer behavior owns background inertness and document-level focus containment; Core does not ship a second public FocusTrap component or emulate modality with a styled `<div>`. The adapter validates accessible naming, resolves deterministic initial focus, synchronizes native `cancel`/close state, and restores focus to the valid invoker after Escape, explicit close, or programmatic close.

The Dialog surface itself remains physically stable at `transform: none`. Trigger, close, and action buttons are ordinary `core.button` composition and keep Button-owned pressure behavior.

## Maturity

Maturity is `public-proof`. The proof record binds the exact deployed merged-main cohort, native `<dialog>` implementation bytes, live Foundry surface, and current Dialog CSS. The five temporary Flavor maintenance records are retired by this structural promotion. Proof-only promotion does not redeploy Pages.
