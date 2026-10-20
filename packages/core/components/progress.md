# `core.progress`

`core.progress` reports task completion; it is not user-adjustable.

## Semantic boundary

The Web implementation uses a real native `<progress>` element. Determinate progress exposes current/max semantics through native `value` and `max`. Indeterminate progress omits the `value` attribute entirely rather than fabricating a percentage. `complete` represents the terminal maximum state.

A Progress surface MUST NOT masquerade as a Slider and MUST NOT accept drag/keyboard value changes. The shipping implementation is CSS-only at `packages/adapters/web/components/progress.css`.

## State model

- `rest` — valid progress semantics at the initial value.
- `determinate` — a current numeric value is exposed.
- `indeterminate` — no current value is claimed.
- `complete` — current value equals the task maximum.

Visual animation for indeterminate progress is supplementary. Reduced motion replaces continuous travel with a static patterned busy treatment while preserving native progress semantics.

Announcements are owned by the surrounding task/status composition unless a valid accessible naming/live-region contract is intentionally supplied.

## Interaction and accessibility

Progress is reporting, not control: it is not made focusable, draggable, pressable, or keyboard-adjustable. Forced-colors mode uses system colors while preserving the native progress boundary and fill distinction. RTL does not reverse the semantic meaning of task completion unless a higher-level domain intentionally changes directionality.

## Maturity

Maturity is `public-proof`. The canonical public-proof record binds the already-deployed exact merged-main implementation cohort; this proof-only promotion does not redeploy runtime bytes.
