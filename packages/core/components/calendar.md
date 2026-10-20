# `core.calendar`

`core.calendar` is the standalone calendar-grid navigation and date-selection primitive.

## Semantic boundary

Calendar is reusable beyond DatePicker. It owns calendar-grid navigation, visible month/day structure, current-date indication, unavailable dates and optional single/range selection. It does not own text-entry parsing, popup disclosure, time selection, time zones, appointments or scheduling business rules.

## State and interaction law

Canonical states are `rest`, `hover`, `focus-visible`, `pressed`, `current`, `selected`, `range-start`, `range-middle`, `range-end`, `unavailable`, `disabled`.

The active day uses one roving/focusable grid position rather than placing every day in ordinary Tab order. Arrow navigation follows calendar-grid movement; Home/End and PageUp/PageDown behavior must be deterministic when supported. Day activation may use pressure feedback while selected/range state persists after contact.

## Accessibility and input law

Grid/row/gridcell or an accessibility-equivalent calendar pattern must expose current, selected and unavailable states. Range start/middle/end cannot rely only on color. RTL affects logical presentation/navigation where appropriate without changing chronological date authority; touch targets remain usable without hover.

## Token boundary

This implementation introduces no component-specific semantic token contract. It reuses existing NeoSmartUI semantic roles; the Calendar cohort expands official local Theme scope from 33 to 34 while preserving the exact 55-token semantic union.

## Canonical Web implementation

The canonical Web adapter binds an `.ns-calendar` root to one `role="grid"` surface. The grid renders six deterministic seven-day rows around an explicit `data-visible-month="YYYY-MM"` authority, keeps ISO `YYYY-MM-DD` values as date identity, exposes `aria-current="date"` for the current date, `aria-selected` on gridcells for committed selection, `aria-disabled` for unavailable dates, and exactly one roving day button with `tabindex="0"`.

Arrow keys move only the active day; Home and End move within the active week. RTL reverses logical horizontal Arrow movement while leaving ISO chronology unchanged. Enter or Space commits the active date. Single selection and bounded range selection share the same primitive: range start, middle, and end remain machine-readable in `data-range-position` and explicit accessible labels, while transient active/focus state stays separate from committed selection.

Previous/next month buttons change only the visible calendar month and retain ordinary Button semantics. Calendar does not parse text, own popup disclosure, add time/time-zone meaning, or implement appointments/scheduling/business rules. Day and month-navigation actions may use NeoSmartUI pressure feedback; selected/range/current/unavailable states persist independently of transient contact.

## Maturity

Maturity is `public-proof`. The proof record binds the exact deployed merged-main cohort, live Foundry surface, and current implementation blobs. Proof-only promotion does not redeploy Pages.
