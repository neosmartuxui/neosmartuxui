# `core.description-list`

`core.description-list` is NeoSmartUXUI's semantic term/description display primitive. It owns native description-list relationships for authored names, terms, labels, values, meanings, metadata or definitions without importing generic collection ordering, row activation, option selection, composite navigation, editing or business semantics.

## Semantic boundary

The canonical Web host is a real `<dl>` containing real `<dt>` term elements and real `<dd>` description elements. Core MUST prefer those native elements and MUST NOT replace them with generic containers or ARIA list/grid/table roles merely for styling convenience.

DescriptionList owns term/description relationships. List owns generic ordered/unordered collection semantics, and Item owns one structured content row/unit. A DescriptionList may visually resemble rows or may compose rich content inside a `<dd>`, but it does not become `core.list`, `core.item`, Table, DataGrid or a DataTable Block.

Native description-list grouping is not constrained to synthetic one-row-per-pair markup. Multiple consecutive `<dt>` elements may share one following `<dd>`, and one `<dt>` may be followed by multiple `<dd>` elements. Core MUST preserve authored native relationships rather than flattening them into duplicated presentation rows.

`role="list"`, `role="listitem"`, `role="table"`, `role="grid"`, `role="row"`, `role="term"` and `role="definition"` are not required replacements when native `<dl>/<dt>/<dd>` semantics are available.

## State model

The canonical component state is exactly `rest`.

Horizontal/stacked, compact/spacious, bordered/plain, divided/undivided, inline, dense, responsive, grouped and multi-column are presentation/composition choices, not semantic component states and MUST NOT inflate the state matrix.

Hover, focus-visible, pressed, selected, current, checked, expanded, disabled, loading, invalid and error are not DescriptionList states. Those belong to genuine descendant controls/status primitives or higher-level interactive compositions.

## Interaction law: descriptive content is not a composite control

The DescriptionList container, terms and passive descriptions MUST NOT enter the page Tab sequence or synthesize activation. Core installs no row-wide click target, hidden keyboard target, roving `tabindex`, `aria-activedescendant`, Arrow/Home/End model, selection, checked/current/expanded state, disclosure or editing model.

Genuine links, buttons and other controls authored inside a `<dd>` retain their own native/owned semantics, minimum target size, focus-visible treatment and ordinary document Tab order.

Pointer/touch interaction follows real descendant controls. Pressing or clicking passive term/description content MUST NOT imply row selection, activation, navigation or editing.

DescriptionList owns no sorting, filtering, search, pagination, drag/drop, virtualization, persistence, networking, form submission or business-state mutation.

## Native description-list integrity

Presentation CSS MUST preserve the `<dl>/<dt>/<dd>` DOM relationships and MUST NOT duplicate terms into hidden/presentation-only labels, manufacture one-to-one rows that change authored grouping, or visually reorder terms/descriptions away from semantic source order.

A term may describe metadata, a human-readable label, a definition term or another authored name/value relationship. Core does not infer schema, field validation, form ownership or application data semantics from that content.

## RTL, narrow layouts and long content

DescriptionList layout uses logical properties and preserves authored term/description order, reading order and descendant focus order in LTR and RTL. RTL may change alignment/presentation but MUST NOT reverse semantic relationships.

Narrow layouts may move from multi-column presentation to stacked presentation or wrap long localized content, provided the same native `<dl>/<dt>/<dd>` structure and source order remain intact. Core MUST NOT duplicate labels to simulate responsive rows.

## Reduced motion and forced colors

DescriptionList owns no spatial motion requirement. Reduced-motion mode therefore preserves the same stable semantic structure.

Forced-colors/high-contrast rendering must keep terms/descriptions readable and preserve any authored separators or boundaries without relying only on custom background/color.

## Canonical Web implementation

The shipping Web implementation is CSS-only at `packages/adapters/web/components/description-list.css`. No JavaScript adapter or preview controller exists because DescriptionList owns no runtime state transition, focus model, activation, selection, disclosure, editing, ordering mutation or command handling.

The canonical preview is a real `<dl id="description-list-demo" class="ns-description-list" data-state="rest">` with real `<dt>` and `<dd>` descendants. It deliberately demonstrates both multiple terms sharing one following description and one term owning multiple following descriptions. A genuine descendant link retains its own semantics and ordinary document Tab order. The implementation styles native flow directly; it does not manufacture pair wrappers, grid/table roles, hidden duplicate labels or one-to-one synthetic rows.

The local implementation cohort expands all ten official Light/Dark Theme scopes from 49 to **50 Core** while preserving exactly **55 semantic token values** under five exact-set Flavor maintenance records. The canonical preview matrix expands from 266 to **267 real states** = **111 fixture + 49 native-pointer + 27 native-keyboard + 80 controller**, with DescriptionList's sole `rest` state fixture-realized and no controller/binding.

## Responsive, RTL, reduced-motion, and forced-colors implementation

`.ns-description-list` preserves native `<dl>/<dt>/<dd>` source order in every viewport. Logical indentation distinguishes descriptions from terms without creating layout rows, so one-to-many and many-to-one native grouping remains readable. Narrow layouts reduce indentation while long localized text wraps naturally.

DescriptionList authors no transitions or animations, so reduced-motion mode requires no behavior fork. Forced-colors mode keeps term/description text and authored term boundaries readable with system colors.

## Token boundary

DescriptionList introduces no component-specific semantic token IDs. It reuses the existing **55-token** union through primary/secondary content, default border, surface spacing/border geometry and body/strong typography roles.

The contract deliberately excludes focus, action, pressure, depth, selection, state-color and motion tokens because DescriptionList itself is passive and non-interactive.

The maintained local implementation scope is **50 Core / 55 tokens**. Public proof and Pages remain bound to the deployed **49-Core / 55-token / 266-state** List singleton until mandatory merged-main implementation verification, exact-artifact deployment, native/live verification and proof-only promotion complete.

## Maturity

Maturity is `implemented`. Implementation evidence is `packages/adapters/web/components/description-list.css`; public-proof evidence remains null until exact-head implementation Quality, guarded merge, mandatory merged-main Quality, exact-artifact deployment, native/live verification, structural proof promotion, and mandatory merged-main proof Quality complete.
