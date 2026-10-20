# `core.input-group`

`core.input-group` composes one primary editable control with generic leading/trailing content or actions.

## Semantic boundary

The primary Input/Textarea remains the form, value, keyboard, and accessible-name authority. Adornments MUST NOT silently become labels. Decorative adornments are hidden from the accessibility tree when appropriate; actionable adornments remain real Buttons.

## State model

- `rest` — ordinary composite surface.
- `focus-within` — one child has keyboard/pointer focus and the group may expose unified focus treatment without suppressing the real focused control.
- `invalid` — the primary control is invalid; error meaning is not color-only.
- `disabled` — the primary control is disabled; child actions that would mutate it are also unavailable.

Editable content is not pressable: the group MUST NOT apply Button pressure travel to the text-editing surface.

## Maturity

Maturity is `public-proof`. The canonical public-proof record binds the already-deployed exact merged-main implementation cohort; this proof-only promotion does not redeploy runtime bytes.
