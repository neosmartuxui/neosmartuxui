# `core.table`

`core.table` is NeoSmartUI's generic semantic tabular-display primitive for static or read-only row/column relationships. It preserves native table structure and header associations without importing sorting, filtering, pagination, selection, editing, virtualization, business-data, or application-command authority.

## Semantic boundary

The canonical Web host is a real `<table>`. Core MUST NOT replace native table structure with generic containers carrying `role="table"` or `role="grid"` merely to gain styling freedom.

Table is not DataTable. DataTable remains a Core Block composition over Table plus controls for sorting, filtering, pagination, search, bulk actions, or other application-level data operations.

Table is not DataGrid. A future `core.data-grid` contract owns interactive-grid focus/selection/editing semantics when the UI requires a cell/row navigation model rather than ordinary document/table semantics.

The canonical component state is exactly `rest`. Hover, selected, sorted, editing, loading, empty, striped, compact, sticky, dense, and responsive presentation are not Table state IDs.

## Native structure law

Authored tabular structure uses native elements: `<caption>`, `<thead>`, `<tbody>`, `<tfoot>`, `<tr>`, `<th>`, and `<td>` as appropriate to the data.

A `<caption>` is the native table-caption mechanism when a title or description belongs directly to the table. Core does not manufacture a second hidden naming system when native table semantics are sufficient.

Column headers use real `<th scope="col">`; row headers use real `<th scope="row">`. For authored multi-level or irregular header structures, consumers preserve explicit `id` + `headers` associations or otherwise valid native header relationships rather than relying on visual position alone.

Table MUST NOT flatten or duplicate semantic rows/cells solely for presentation. DOM row/column relationships remain authoritative.

## Interaction and focus law

`core.table` itself is non-interactive and non-focusable. It installs no keyboard handler and creates no composite focus model.

Core Table MUST NOT add roving `tabindex`, `aria-activedescendant`, Arrow/Home/End/Page navigation, row focus, cell focus, row selection, cell selection, or keyboard-editing authority.

Interactive descendants such as links, buttons, checkboxes, inputs, or menus remain separately composed controls and stay in ordinary document Tab order. Table does not intercept or reorder their activation.

Rows and cells MUST NOT become synthetic click targets merely because the presentation offers hover color or zebra striping. This first slice has no pointer-reactive row state.

## Data-operation boundaries

Table does not own sorting, filtering, pagination, searching, grouping commands, bulk actions, row expansion, column resizing/reordering, inline editing, data fetching, caching, virtualization, loading orchestration, error recovery, application scheduling, or business-state mutation.

Table MUST NOT add `aria-selected`, `aria-activedescendant`, grid-cell roles, or application selection state to static tabular content. Sort controls, when a later composition needs them, are real controls owned by that composition rather than hidden Table behavior.

EmptyState, loading/progress surfaces, filters, pagination, and actions compose around Table; they do not inflate Table's semantic state model.

## Responsive, RTL, and content law

Responsive composition may place a Table inside an external overflow/ScrollArea boundary, but the Table contract itself preserves the native table DOM, header associations, authored source order, and descendant focus order. Core Table MUST NOT reflow semantic rows into fake cards or duplicate header text into presentation-only cell attributes as a replacement for native associations.

RTL changes logical presentation and alignment only. It does not reverse authored column meaning, reorder DOM cells, or synthesize a different assistive-technology reading order.

Long labels, identifiers, localized strings, and cell content must remain readable without collapsing semantic relationships. Numeric/text alignment is presentation and does not create component state.

## Reduced motion and forced colors

Table owns no motion or state-driven transition, so reduced-motion mode preserves the same stable semantic surface.

Forced-colors/high-contrast rendering must retain perceivable row/cell/header boundaries and readable text when authored backgrounds or border colors are overridden by the platform.

## Canonical Web implementation

The shipping Web implementation is CSS-only at `packages/adapters/web/components/table.css`. No JavaScript adapter or preview controller exists because Table owns no runtime state transition, focus model, command handling, sorting, selection, editing, or disclosure behavior.

The canonical preview is a native `<table id="table-demo" class="ns-table" data-state="rest">` with native caption, header/body/footer sections, column and row headers, ordinary cells, and separately composed interactive descendants. The implementation styles those native elements directly; it does not replace them with generic containers or duplicate cell/header content into fake-card markup.

The proven shipping cohort resolves all ten official Light/Dark Theme scopes at **46 Core / 55 semantic token values**. The canonical preview matrix contains **259 real states**, with Table's sole `rest` state fixture-realized and no controller/binding.

## Responsive, RTL, reduced-motion, and forced-colors implementation

`.ns-table` keeps native table layout and authored source order. Cells permit normal wrapping and long-token breaking so the primitive can remain readable in constrained containers without transforming semantic rows into cards. Consumers that require horizontal scrolling compose an external overflow/ScrollArea boundary rather than changing Table semantics.

Logical padding/alignment preserves RTL presentation without reversing DOM columns. Table authors no transitions or animations, so reduced-motion mode requires no behavior fork. Forced-colors mode retains explicit cell/header/footer boundaries and platform-readable text/background colors.

## Token boundary

Table introduces no component-specific semantic token IDs. It reuses the existing **55-token** union through panel/content/border, surface-spacing, surface-border, and body/strong typography roles. It deliberately does not borrow control pressure, focus, hover/active depth, radius, or motion tokens because Table itself is not a control.

Public proof and Pages are bound to the exact deployed **46-Core / 55-token / 259-state** singleton from merged source `94d269b37d7ecbd85a69dfef718869fa162924e7`, Pages commit `442656071c9649073748f96a5f88a297e6429459`, and Pages tree `f7e37e5d51d389fff4defff3af1e680e365ac572`.

## Maturity

Maturity is `public-proof`. Implementation evidence is `packages/adapters/web/components/table.css`; structural public proof is `evidence/public/core.table.json` and is bound to the exact merged-main browser evidence, exact-artifact Pages deployment, native Pages verification, and live HTTPS surface.
