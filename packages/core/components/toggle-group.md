# `core.toggle-group`

`core.toggle-group` coordinates related Toggles under an explicit single- or multiple-selection policy.

## Semantic boundary

The group does not create a third selection semantic. Children remain Toggle controls with pressed state. Single-selection policy does not automatically make the component a RadioGroup or Segmented Control; use those primitives when their semantics better match the user task.

## Keyboard and selection law

The group MUST declare its selection policy. Keyboard behavior must be deterministic and must not trap Tab traversal. If roving focus is adopted by the implementation, arrow-key direction must follow orientation and RTL logically; otherwise ordinary Tab traversal is preserved. Disabled items are skipped by any composite navigation.

Group-level states are `rest`, `none-selected`, `selected`, and `disabled`; child hover/focus/press remain Toggle states.

## Canonical Web implementation

The canonical Web implementation is `packages/adapters/web/components/toggle-group.css` plus `packages/adapters/web/components/toggle-group.mjs`. A group is a labelled `role="group"` with explicit `data-selection-mode="single|multiple"`; every child remains a real Toggle button with `aria-pressed`.

This first implementation deliberately preserves ordinary document Tab traversal and installs **no `keydown` handler**. Single mode allows zero or one pressed child, so activating the selected Toggle may return the group to `none-selected`. Multiple mode allows independent pressed children. Neither mode manufactures RadioGroup, Tabs, or Segmented Control semantics. Disabled children remain native disabled buttons.

The exact implemented/public semantic dependency union remains 55 token IDs.

## Maturity

Maturity is `public-proof`. The canonical public-proof record binds the already-deployed exact merged-main implementation cohort; this proof-only promotion does not redeploy runtime bytes.
