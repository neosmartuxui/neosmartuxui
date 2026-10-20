# `core.toggle`

`core.toggle` is one persistent pressed/unpressed option.

## Semantic boundary

Use a real button-style control with machine-readable pressed state such as `aria-pressed`. Toggle is not `core.switch`: a Switch represents an immediate binary setting with switch semantics, while Toggle represents a pressed option/action mode. It is also not a Checkbox replacement.

## State and pressure law

The canonical states are `rest`, `hover`, `focus-visible`, `pressed`, `off`, `on`, and `disabled`. Transient physical `pressed` feedback is separate from persistent `on` state. Hover compresses rather than lifts; active contact seats further.

Space/Enter activation follows native Button behavior. Accessible name and persistent state MUST remain perceivable without relying only on color.

## Canonical Web implementation

The canonical Web implementation is `packages/adapters/web/components/toggle.css` plus `packages/adapters/web/components/toggle.mjs`. The adapter requires a real `<button type="button" aria-pressed="true|false">`, installs click handling only, and relies on native Button Space/Enter activation. It installs no `keydown` handler and never creates Switch, Checkbox, Radio, or Tab semantics.

The visual pressure model remains 0→2→5px inward travel. Persistent `on` state is separately exposed by `aria-pressed="true"`, a seated depth treatment, and a non-color double-border cue while its resting transform stays at the origin. The 5px inward travel is reserved for transient active contact, so persistent selection never masquerades as a held press. The exact implemented/public semantic dependency union remains 55 token IDs.

## Maturity

Maturity is `public-proof`. The canonical public-proof record binds the already-deployed exact merged-main implementation cohort; this proof-only promotion does not redeploy runtime bytes.
