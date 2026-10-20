# `core.alert-dialog`

`core.alert-dialog` is the generic urgent/confirmatory modal primitive for a brief important message that requires a response.

## Semantic boundary

AlertDialog is intentionally distinct from ordinary `core.dialog`. It owns the stronger interruption semantics signaled by `role="alertdialog"`, a required prompt/message description, and response-oriented initial-focus policy. It does not own business-domain consequences, network requests, form submission, scheduling, navigation, or application-specific destructive policy. Trigger and response controls compose ordinary Buttons rather than creating duplicate action primitives. Modal focus containment remains shared overlay infrastructure and does not create a public `core.focus-trap` ID.

## State and interaction law

Canonical semantic states are exactly `closed` and `open`. Urgency, severity, confirmation outcome, destructive intent, and animation phases are not separate component states. Opening interrupts the current workflow until a response or dismissal closes the AlertDialog. The modal surface itself is not generically pressable; response Buttons own pressure feedback.

## Accessibility and input law

The open surface must expose `role="alertdialog"` with real modal behavior. It requires exactly one accessible-name source and an `aria-describedby` reference that resolves to the brief alert/prompt message. Focus remains contained while open. Initial focus is deterministic and response-oriented; when an irreversible or destructive response exists, the least-destructive or cancel action is preferred so focus does not default to the irreversible action. If no destructive choice exists, focus moves to the most appropriate response control or a safe static focus target. Escape dismisses an ordinary dismissible AlertDialog. Escape, explicit close, and programmatic close share the same restoration law: return focus to the invoking element when it still exists and remains a valid focus target. RTL changes logical layout without changing response meaning or focus order.

## Token boundary

This contract introduces no AlertDialog-specific semantic token contract. It reuses the existing NeoSmartUXUI semantic roles already present in the deployed 37-Core / 55-token Theme union. Public-proof promotion preserves the exact 55-token union and does not redeploy Pages.

## Canonical Web implementation

The canonical Web adapter uses a real native `<dialog role="alertdialog">` opened with `showModal()`. Native top-layer modality owns background inertness and Tab containment. The adapter validates one accessible-name source, a required non-empty prompt description, real response Buttons, and a deterministic safe-response focus policy. It deliberately does not add `tabindex` to the native dialog surface; focus lands on a real response control.

## Maturity

Maturity is `public-proof`. The exact merged-main artifact has been deployed and verified through native Pages and live HTTPS. Proof-only promotion does not redeploy Pages, and the temporary 36→37 exact-set Flavor maintenance is retired.
