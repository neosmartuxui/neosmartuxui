# `core.button-group`

`core.button-group` groups closely related action Buttons into one recognizable cluster.

## Semantic boundary

The group does not turn actions into a selection widget. Use `core.segmented-control`, `core.toggle-group`, or `core.radio` when the relationship is selection. A ButtonGroup MAY expose a group label through valid group semantics, but each child remains a real Button with its own activation, focus, loading, and disabled authority.

## Keyboard and pointer law

ButtonGroup MUST NOT install roving focus by default. Tab order remains ordinary document order and activation remains owned by each child button. Orientation may affect layout but is not a separate component or count.

## State model

`rest` is the only group-level state. Hover, focus, press, loading, and disabled belong to the child Buttons.

## Maturity

Maturity is `public-proof`. The canonical public-proof record binds the already-deployed exact merged-main implementation cohort; this proof-only promotion does not redeploy runtime bytes.
