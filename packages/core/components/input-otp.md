# `core.input-otp`

`core.input-otp` accepts a short fixed-length one-time code while presenting progress clearly.

## Semantic boundary

The code is one logical form value. A Web implementation may visually segment characters, but it MUST NOT create conflicting independent value authorities or require users to understand each slot as a separate field. `autocomplete="one-time-code"`, paste, mobile input hints and assistive-technology naming must remain compatible with the single logical value.

## State and interaction law

Canonical states are `rest`, `hover`, `focus-visible`, `empty`, `partial`, `complete`, `invalid`, `disabled`.

Editing is interactive, not button-like: the code-entry surface does not gain generic pressure travel. Paste may fill multiple positions in one operation. Completion MUST NOT automatically submit a form or trigger a business action; completion is state, not permission for a side effect.

## Accessibility and input law

Backspace/Delete, selection, paste, platform autocomplete and IME-compatible editing must not be trapped by decorative slot behavior. Ordinary Tab traversal enters/leaves the logical control normally. Codes may be numeric or alphanumeric, so Core must not hard-code numeric meaning where the consumer did not specify it.

## Token boundary

This implementation introduces no component-specific semantic token contract. It reuses existing NeoSmartUI semantic roles; the implementation cohort expands official local Theme scope from 30 to 31 while preserving the exact 55-token semantic union.

## Canonical Web implementation

The Web adapter binds one real `<input type="text">` with `autocomplete="one-time-code"` and a positive `maxlength`. Native input, change, paste, selection, Backspace/Delete, mobile input hints and platform autofill remain authoritative; the adapter installs no `keydown` or submit handler. Empty, partial and complete state are derived from the single logical input value.

The editable OTP surface remains at `transform: none` through hover, focus and direct pointer contact. No slot, character or completion state becomes a separate value authority, and completion never submits the surrounding form.

## Maturity

Maturity is `public-proof`. The proof record binds the exact deployed merged-main cohort, live Foundry surface, and current implementation blobs. Proof-only promotion does not redeploy Pages.
