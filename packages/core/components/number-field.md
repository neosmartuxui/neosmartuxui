# `core.number-field`

`core.number-field` edits a numeric value through direct entry plus optional increment/decrement actions.

## Semantic boundary

The value authority is a numeric input/spinbutton model with min/max/step constraints where supplied. NumberField is not a Slider and MUST NOT convert precise typed entry into a drag-only interaction. Increment/decrement affordances are child actions, not separate public component IDs.

## State and input law

States are `rest`, `hover`, `focus-visible`, `pressed`, `empty`, `filled`, `invalid`, `read-only`, and `disabled`. Pressure applies only to increment/decrement actions, not to the editable text surface.

Arrow-key behavior MUST preserve valid numeric editing/spinbutton expectations. Home/End, text selection, copy/paste, locale-sensitive entry, and assistive-technology value announcements MUST NOT be hijacked merely for visual behavior. Read-only and disabled remain distinct.

## Canonical Web implementation

The Web adapter binds an `.ns-number-field` root whose value authority is one real `<input type="number">`. Optional decrement/increment children are real `<button type="button">` actions. They call the native `stepDown()` / `stepUp()` algorithms so min/max/step behavior is not reimplemented in application arithmetic. The adapter does not install keyboard handlers on the numeric input.

The editable numeric surface remains non-pressable at every pointer state. Only the optional step actions use the shared depth/travel pressure model.

## Maturity

Maturity is `public-proof`. The proof record binds the exact deployed merged-main cohort, live Foundry surface, and current implementation blobs.
