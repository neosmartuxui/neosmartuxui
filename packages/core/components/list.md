# `core.list`

`core.list` is NeoSmartUXUI's generic semantic collection primitive. It owns collection/container structure and authored ordering for a sequence or group of related items without importing option selection, composite navigation, activation, disclosure, editing or business semantics.

## Semantic boundary

List owns collection semantics; Item owns one structured row/unit. A List may compose `core.item` children, including the valid native composition `<li class="ns-item">`, but List does not require Item and Item does not create a collection by itself.

The canonical Web host prefers a real `<ul>` for an unordered collection or a real `<ol>` for an authored ordered collection, with real `<li>` children. ARIA `role="list"` / `role="listitem"` is fallback composition only when native list elements are genuinely impossible. Core MUST NOT replace valid native list semantics with generic containers merely for styling convenience.

Ordered versus unordered is authored document meaning, not a component state. Native ordered-list semantics such as `start`, `reversed` and per-item `value` remain author/document authority and MUST NOT become hidden Core state.

List is not Listbox. It does not own `option`, `aria-selected`, active-option state, `aria-activedescendant` or managed option focus.

List is not Menu, TreeView, DataGrid, NavigationMenu, Tabs or Feed. Those primitives own menu-item commands, hierarchical tree interaction, grid-cell focus, route/navigation semantics, tab activation or feed reading/position semantics that a passive list does not acquire.

Timeline and DataTable remain Blocks/compositions rather than aliases for List. Nested lists remain ordinary valid document hierarchy; Core MUST NOT flatten nested collection structure into one composite or infer TreeView semantics.

## State model

The canonical component state is exactly `rest`.

Ordered/unordered, compact/spacious, divided/plain, marker style and nesting depth are authored meaning or presentation variants, not semantic component states and MUST NOT inflate the state matrix.

Hover, focus-visible, pressed, selected, current, checked, expanded, disabled, loading, invalid and error are not List states. Those belong to genuine descendant controls/status primitives or a higher-level interactive component.

## Interaction law: a collection is not a composite control

The List container itself MUST NOT enter the page Tab sequence or synthesize activation. It installs no row-wide click target and no hidden keyboard target.

Genuine links, buttons, checkboxes, menu triggers and other controls inside list items retain their own native/owned semantics, minimum target size, focus-visible treatment and ordinary document Tab order.

List owns no roving `tabindex`, `aria-activedescendant`, Arrow/Home/End keyboard model, selection, checked/current/expanded state, disclosure, drag/drop, sorting, filtering, search, pagination, editing, virtualization, persistence, network work, form submission or business-state mutation.

Pointer/touch interaction follows real descendant controls. Pressing passive list/item space MUST NOT focus a descendant, select an item, execute an action or imply clickability.

## Native list integrity

A native List uses `<ul>` or `<ol>` with semantic `<li>` children. Presentation CSS MUST NOT remove collection meaning through role replacement or duplicate hidden list markup.

For ordered collections, numbering/source order remain authored document semantics. CSS visual reordering MUST NOT make visible order disagree with semantic order.

Nested lists remain nested in valid list-item structure. Core MUST NOT convert nested passive lists into TreeView without a separately reviewed tree contract and interaction model.

## RTL, narrow layouts and long content

List layout uses logical properties and preserves authored item order, numbering meaning, reading order and descendant focus order in LTR and RTL. RTL may change marker/alignment presentation but MUST NOT reverse semantic sequence.

Narrow layouts may wrap item content or adjust spacing, provided semantic list/item structure and descendant focus order remain intact. Long localized content and identifiers wrap without duplicated presentation-only labels.

## Reduced motion and forced colors

List owns no spatial motion requirement. Reduced-motion mode therefore preserves the same stable collection structure.

Forced-colors/high-contrast rendering must keep item content readable and preserve any authored separators or boundaries without relying only on custom background/color.

## Canonical Web implementation

The shipping Web implementation is CSS-only at `packages/adapters/web/components/list.css`. No JavaScript adapter or preview controller exists because List owns no runtime state transition, focus model, activation, selection, disclosure, ordering mutation, editing, virtualization or command handling.

The canonical preview is a real `<ul id="list-demo" class="ns-list" data-state="rest">` with real `<li>` children. It composes proven `core.item` rows and a real nested Button action while preserving the semantic List → list item → Item/content/control hierarchy. List CSS styles the collection and markers; it does not add replacement ARIA roles, synthetic row targets or alternate hidden list markup.

The proven shipping cohort resolves all ten official Light/Dark Theme scopes at **49 Core / 55 semantic token values**. The canonical preview matrix contains **266 real states**, with List's sole `rest` state fixture-realized and no controller/binding.

## Responsive, RTL, reduced-motion, and forced-colors implementation

`.ns-list` preserves native list-item display and semantic source order. Logical spacing supports LTR/RTL without reversing sequence; long localized content wraps through the composed Item/content primitives. Nested native lists keep their authored hierarchy and are not flattened into TreeView semantics.

List authors no transitions or animations, so reduced-motion mode requires no behavior fork. Forced-colors mode keeps list content, markers, and separators readable with system colors.

## Token boundary

List introduces no component-specific semantic token IDs. It reuses the existing **55-token** union through primary/secondary content, default border, surface spacing/border geometry and body/strong typography roles.

The contract deliberately excludes focus, action, pressure, depth, selection, state-color and motion tokens because List itself is passive and non-interactive.

Public proof and Pages are bound to the exact deployed **49-Core / 55-token / 266-state** singleton from merged source `3d41541d81f8fd5c24e11c9d12a17bb9e7a9e9b0`, Pages commit `d21d12143368efaee1ce1e083f7f936b209b1e19`, and Pages tree `2662bbdb270ab2fb0d336ca1e31889672a5fdc8b`.

## Maturity

Maturity is `public-proof`. Implementation evidence is `packages/adapters/web/components/list.css`; structural public proof is `evidence/public/core.list.json` and is bound to the exact merged-main browser evidence, exact-artifact Pages deployment, native Pages verification, and live HTTPS surface.
