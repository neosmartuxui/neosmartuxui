# `core.separator`

`core.separator` creates a boundary between adjacent content or control groups.

## Semantic boundary

A structural separator uses valid separator semantics and declares orientation when needed. A purely decorative line is hidden from the accessibility tree. A labeled divider is a Separator presentation/composition, not another public component ID.

The shipping Web implementation is intentionally CSS-only at `packages/adapters/web/components/separator.css`.

## Behavior

The only state is `rest`. Separator is non-interactive, non-focusable, has no hover/press behavior, and does not create layout depth. RTL changes surrounding flow, not the meaning of horizontal/vertical orientation.

A horizontal semantic separator may use a real `<hr>`. A vertical separator uses `role="separator"` with `aria-orientation="vertical"`. Decorative separators use `aria-hidden="true"`.

Forced-colors mode preserves a visible boundary using system text color.

## Maturity

Maturity is `public-proof`. The canonical public-proof record binds the already-deployed exact merged-main implementation cohort; this proof-only promotion does not redeploy runtime bytes.
