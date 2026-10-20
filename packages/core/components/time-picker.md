# `core.time-picker`

`core.time-picker` owns generic local wall-clock time entry/selection.

## Semantic boundary

TimePicker is distinct from DatePicker and does not own calendar dates, time zones, recurrence, scheduling policy or business opening-hours logic. Where the Web uses native `<input type="time">`, min/max/step, form participation and browser/OS picker modality remain authoritative; Core does not invent a portable popup-open state.

## State and interaction law

Canonical states are `rest`, `hover`, `focus-visible`, `empty`, `filled`, `invalid`, `read-only`, `disabled`.

The time-entry surface is interactive but not generically pressable. Native segmented editing, platform picker invocation, selection and value stepping must not be replaced solely to force custom motion. Read-only and disabled remain distinct.

## Accessibility and input law

Keyboard/touch users retain platform time-entry behavior, visible focus and machine-readable invalid state. Locale display may vary by platform without changing the underlying time value. RTL must preserve logical layout and native segment behavior.

## Token boundary

This implementation introduces no component-specific semantic token contract. It reuses existing NeoSmartUXUI roles; the deployed and publicly proven official Theme scope is now exactly 30 components while preserving the exact 55-token semantic union.

## Canonical Web implementation

The canonical Web adapter binds an `.ns-time-picker` root whose value authority is one real `<input type="time">`. Native min/max/step, form participation, segmented keyboard editing, platform picker invocation and validity remain browser-owned. The adapter installs only `input` / `change` synchronization plus explicit invalid/read-only/disabled state helpers.

The adapter does not call `showPicker()`, install synthetic key handlers, or create a portable popup-open state. The editable time surface stays at `transform: none` through hover, focus and active contact.

## Maturity

Maturity is `public-proof`. The canonical public-proof record binds the already-deployed exact merged-main 30-component cohort; proof-only promotion does not redeploy Pages.
