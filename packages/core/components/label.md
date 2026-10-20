# `core.label`

`core.label` is the visible labeling primitive for one labelable control.

## Semantic boundary

On the Web, use a real `<label>` with `for`/control association when the host element permits it. A Label is not help text, validation text, a Field composition, a placeholder, or a generic heading. It MUST NOT manufacture `role="label"`.

The shipping Web implementation is intentionally CSS-only at `packages/adapters/web/components/label.css`. Native label activation remains the browser/platform authority.

## State model

- `rest` — ordinary associated label text.
- `disabled` — visual context may reflect that the associated control is disabled, but the Label itself does not become an interactive disabled widget.

Disabled presentation uses `data-disabled="true"` as a styling hook only; it MUST NOT add `aria-disabled`, `tabindex`, or synthetic click behavior to the Label.

## Interaction and accessibility

Label activation follows platform semantics for the associated control. Core MUST NOT add click handlers, roving focus, or `tabindex` merely to make a label feel interactive. The visible text remains readable in forced colors and RTL. Disabled styling cannot make the label illegible.

The Component Lab preview proves native association by pairing the Label with a real text input. Clicking the Label remains native browser behavior.

## Maturity

Maturity is `public-proof`. The canonical public-proof record binds the already-deployed exact merged-main implementation cohort; this proof-only promotion does not redeploy runtime bytes.
