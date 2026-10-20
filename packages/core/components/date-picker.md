# `core.date-picker`

`core.date-picker` owns generic calendar-date entry/selection.

## Semantic boundary

Single-date and date-range selection are modes of the same capability; `DateRangePicker` MUST NOT become a second Core ID merely to increase breadth. DatePicker owns date values, not times or time zones. Its calendar surface may compose `core.calendar`, but the DatePicker remains responsible for entry/popup/value coordination.

## State and interaction law

Canonical states are `rest`, `hover`, `focus-visible`, `pressed`, `closed`, `open`, `empty`, `selected`, `range-partial`, `range-selected`, `invalid`, `disabled`.

Editable date text, when present, remains an editing surface rather than a pressable button. A separate disclosure trigger may use pressure feedback. Opening the calendar must not trap normal document Tab traversal, and transient highlighted/focused dates must remain distinct from committed single/range values.

## Accessibility and input law

Keyboard entry must preserve text editing where provided, while calendar navigation follows the calendar-grid contract. Locale presentation must not silently change the underlying date meaning. Invalid dates, unavailable dates, disabled state, range start/end and committed selection must remain machine-readable and not color-only.

## Token boundary

This implementation introduces no component-specific semantic token contract. It reuses existing NeoSmartUXUI semantic roles; the DatePicker cohort expands official local Theme scope from 34 to 35 while preserving the exact 55-token semantic union.

## Canonical Web implementation

The canonical Web adapter binds an `.ns-date-picker` root with one real text input for the primary ISO date, an optional second real text input for range end, one real disclosure `<button type="button">`, one non-modal popup, and one composed `core.calendar` surface. ISO `YYYY-MM-DD` strings remain the date-value authority. The adapter does not parse locale-dependent free-form dates, times, or time zones.

Single and range modes are coordinated through the same DatePicker ID. In single mode the primary input and Calendar selected date mirror one committed value. In range mode start and end remain separate editable values and mirror Calendar range start/end. A valid start with no end is explicitly `range-partial`; a bounded ordered pair is `range-selected`. Invalid syntax, an end without a start, or an end preceding the start is written and machine-readable through `aria-invalid` plus explicit error text.

The disclosure trigger owns `aria-expanded` / `aria-controls` and may use NeoSmartUXUI pressure feedback. Editing inputs stay seated and do not gain press travel. The popup is an explicit non-modal dialog and does not trap Tab. Opening may focus the composed Calendar's roving day; Escape closes and returns focus to the trigger. Calendar click/Enter/Space selection synchronizes back to DatePicker after Calendar commits. Completed single/range selection closes the popup; partial range selection stays open.

DatePicker imports and binds the shipping `core.calendar` adapter rather than duplicating calendar-grid navigation, current-date, unavailable-date, RTL Arrow, Home/End, selection, or range-marker behavior. It owns only entry/disclosure/value/validation coordination. No appointment, scheduling, network, business, time, or time-zone semantics are implemented.

## Maturity

Maturity is `public-proof`. The proof record binds the exact deployed merged-main cohort, live Foundry surface, and current implementation blobs. Proof-only promotion does not redeploy Pages.
