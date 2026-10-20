# `core.multi-select`

`core.multi-select` is the generic finite-option multi-value selection primitive.

## Semantic boundary

It owns a set of zero or more committed option values. It is distinct from `core.select`, which is native single-selection, and from the current `core.combobox`, whose contract is explicitly editable **single-selection only**. Search/filtering, freeform value creation, token editing, remote ranking, virtualization and application-specific business filtering are not silently added to this contract.

## State and interaction law

Canonical states are `rest`, `hover`, `focus-visible`, `pressed`, `closed`, `open`, `none-selected`, `selected`, `highlighted`, `invalid`, `disabled`.

A popup-style implementation must expose multi-selection semantics (for example an `aria-multiselectable` listbox or an accessibility-equivalent model), keep transient highlight distinct from persistent selected values, and preserve ordinary Tab/Shift+Tab document traversal. A trigger may use pressure feedback; option selection must remain explicit after transient contact ends.

## Accessibility and input law

Keyboard users must be able to move among enabled options, toggle selection without losing already committed peers, close the popup without clearing values, and leave the component normally. Touch cannot depend on hover. RTL affects layout/logical direction without changing which values are selected.

## Token boundary

This implementation introduces no component-specific semantic token contract. It reuses the existing NeoSmartUI semantic roles; the implementation cohort expands official local Theme scope from 31 to 32 while preserving the exact 55-token semantic union.

## Canonical Web implementation

The canonical Web adapter binds an `.ns-multi-select` root with one real disclosure Button and one owned `role="listbox"` carrying `aria-multiselectable="true"`. Each owned option has a stable ID, `data-value`, and boolean `aria-selected`; those option states are the committed multi-value authority. Root summary/count metadata only mirrors that authority.

Opening moves focus from the disclosure Button to the listbox and uses `aria-activedescendant` for transient option highlight. Arrow keys and Home/End move only that highlight. Space or Enter toggles the highlighted option without clearing already selected peers or closing the popup. Escape closes and returns focus to the trigger. Tab and Shift+Tab are never prevented or trapped; normal document focus movement closes the popup through ordinary focusout. Pointer movement may update highlight and pointer activation may toggle an enabled option, but disabled options remain inert.

The trigger alone uses NeoSmartUI pressure travel. Listbox/options do not become disguised Buttons, selection remains distinct from transient highlight, and the adapter does not add filtering, freeform values, remote ranking, virtualization, or business-specific policy.

## Maturity

Maturity is `public-proof`. The proof record binds the exact deployed merged-main cohort, live Foundry surface, and current implementation blobs. Proof-only promotion does not redeploy Pages.
