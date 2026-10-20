# `core.spinner`

`core.spinner` is a compact visual busy indicator.

## Semantic boundary

Spinner does not claim a percentage, queue position, or completion estimate. It is not automatically a live region and MUST NOT spam assistive technology through repeated announcements. The loading context supplies an accessible name/status when one is needed.

The shipping Web implementation is intentionally CSS-only at `packages/adapters/web/components/spinner.css`. The Spinner glyph itself should normally be `aria-hidden="true"` while a surrounding labeled context owns `aria-busy` or any intentional status semantics.

## Motion and accessibility

The sole canonical state is `active`. Reduced-motion mode removes continuous rotation and preserves a static dashed/solid busy geometry. Forced-colors mode uses system colors and a highlighted leading edge. Spinner itself is not focusable or actionable.

The implementation MUST NOT invent progress percentage, `role="progressbar"`, or an automatic live region.

## Maturity

Maturity is `public-proof`. The canonical public-proof record binds the already-deployed exact merged-main implementation cohort; this proof-only promotion does not redeploy runtime bytes.
