# `core.data-grid`

`core.data-grid` is NeoSmartUI's generic interactive tabular-data composite. It owns one managed grid focus model, deterministic cell navigation, optional single-cell selection, and an explicit transition into and out of cell edit mode without importing application data operations or business semantics.

## Semantic boundary

DataGrid is not Table. `core.table` is a native static/read-only tabular-display primitive whose interactive descendants remain in ordinary document Tab order. DataGrid is an interactive composite: the grid exposes `role="grid"`, one managed page Tab stop, and directional navigation among cells.

DataGrid is not DataTable. DataTable remains a v0.5 Core Block composition over Table plus sorting, filtering, pagination, search, bulk actions, EmptyState/loading surfaces, and other application-level controls. Those operations do not become DataGrid states merely because they are common around data.

DataGrid is not Calendar. Calendar has date chronology, current-date, unavailable-date, and date-selection authority. DataGrid rows and columns have no calendar meaning.

DataGrid is not TreeView or TreeGrid. Hierarchical rows, parent/child expansion and tree levels are outside this first slice. It is not Listbox, Select or Combobox because cell focus/selection is tabular navigation rather than generic option/value commitment. It is not spreadsheet application logic: formulas, clipboard orchestration, fill handles, undo stacks, persistence and domain validation remain outside Core.

The canonical component states are exactly `rest`, `hover`, `focus-visible`, `selected`, and `editing`. Active-cell coordinates, row/column indexes, editor values, pointer position, selection origin and navigation direction are runtime data rather than additional component-state IDs.

## Grid structure law

The Web composite exposes an explicit accessible name on the `role="grid"` root and machine-readable row/header/cell relationships through `row`, `columnheader`, `rowheader`, and `gridcell` semantics or the native/ARIA equivalent.

The first slice requires a rectangular, fully DOM-resident grid. All rows/columns are DOM-resident in this first slice. Row/column spanning, virtualized rows or columns, infinite loading, dynamically inserted off-DOM ranges, tree hierarchy, column groups, frozen panes, column resize/reorder and drag/drop are deferred reviewed capabilities rather than silently inferred.

Column and row identity remain authored data structure. If `aria-rowindex`, `aria-colindex`, `aria-rowcount`, or `aria-colcount` are authored, they MUST be truthful; Core MUST NOT synthesize misleading virtual counts when the first slice renders all cells.

## Managed focus and keyboard law

In grid navigation mode, exactly one navigable data cell is in the page Tab sequence with `tabindex="0"`; all other navigable grid cells use `tabindex="-1"`. The grid therefore contributes one page Tab stop rather than placing every cell into ordinary document Tab order.

Tab and Shift+Tab enter or leave the composite through the current roving cell. Core MUST NOT trap Tab inside the grid when the user is in navigation mode.

ArrowRight and ArrowLeft move one visual cell horizontally. ArrowDown and ArrowUp move one row vertically in the same authored column. Navigation does not wrap at row or grid edges in the first slice.

Home and End move to the first and last navigable data cell in the active row. Control+Home and Control+End move to the first and last navigable data cell in the whole grid. PageUp/PageDown, wrapping navigation and discontinuous jumps are deferred.

RTL reverses the visual horizontal Arrow mapping without rewriting DOM/source column identity or row/column semantics. Vertical navigation and authored row order remain unchanged.

Pointer/touch primary activation may make a data cell the active roving focus target. Hover alone MUST NOT move DOM focus, select a cell, enter editing, or execute application actions.

## Focus and selection are distinct authorities

Moving the active grid focus MUST NOT silently select the focused cell. `focus-visible` is transient navigation state; `selected` is persistent local selection state.

The first slice permits optional **single-cell selection only**. When selection is enabled, zero or one data gridcell may expose `aria-selected="true"`; all other selectable cells expose false or no selected state according to the chosen valid ARIA model. Multi-cell, range, row, column, select-all and discontinuous selection are deferred.

In navigation mode, Space may toggle selection on the active selectable cell. Selection does not submit forms, execute commands, mutate application records, or imply business commitment. Consumers needing checkbox-based bulk row selection compose that behavior separately rather than converting it into hidden DataGrid authority.

## Explicit edit-mode law

A gridcell may be authored editable. Read-only versus editable capability must be machine-readable through valid grid/cell semantics such as truthful `aria-readonly` where applicable.

Enter or F2 on an active editable cell may enter `editing`. Entering edit mode suspends grid Arrow/Home/End navigation and moves DOM focus into the cell's single authored native editor. The editor's ordinary text-editing keys, selection, IME/composition and clipboard behavior remain native.

Escape exits edit mode and restores focus to the owning gridcell. Core may emit a local cancel/edit-exit intent, but it MUST NOT claim that application data was rolled back. For a single-line editor, Enter may emit a local commit/edit-exit intent and restore gridcell focus; actual persistence, validation, mutation, networking, form submission and undo history remain application authority.

Tab or Shift+Tab from an editor may exit edit mode and continue ordinary document traversal. The first slice does not trap focus among editors or silently jump into the next row's editor.

When not editing, editor descendants MUST NOT become extra page Tab stops that defeat the single composite Tab-stop model.

## Data-operation and application boundaries

DataGrid does not own sorting, filtering, pagination, search, grouping commands, bulk actions, row expansion, column resize/reorder, data fetching, caching, remote pagination, virtualization, formulas, clipboard orchestration, persistence, validation policy, application scheduling, form submission, network work or business-state mutation.

The first slice does not author `aria-sort`, hierarchical `aria-level`, tree expansion, virtual row/column counts, multi-selection, range-selection shortcuts, or spreadsheet cut/copy/paste semantics.

If a later composition needs sorting/filtering/pagination around static data, that remains DataTable Block authority. If it needs large-data virtualization, that composes with a separately reviewed virtualization primitive rather than silently changing DataGrid's first-slice focus law.

## Responsive, RTL and content law

Responsive composition may place DataGrid inside an external overflow/ScrollArea boundary while preserving one grid composite, row/column identity, roving focus, and authored cell order. Core MUST NOT reflow grid rows into fake cards or duplicate cell/header text solely for narrow-layout presentation.

Long localized labels, identifiers and cell content must remain readable. Horizontal scrolling is preferable to destroying the row/column model when the available inline size is too small.

RTL affects visual layout and the horizontal Arrow mapping only. It does not renumber authored columns, reverse stored data meaning, or synthesize a different assistive-technology row/column order.

## Reduced motion and forced colors

The first DataGrid slice owns no spatial motion requirement. Focus movement, selection and edit-mode transitions must remain understandable with reduced motion and MUST NOT depend on animated travel.

Forced-colors/high-contrast mode must preserve the grid boundary, row/cell/header boundaries, the active focus indication, selected-cell distinction, and edit-mode focus. Focus and selection MUST remain distinguishable from each other and cannot rely only on custom color fills.

## Canonical Web implementation

The shipping Web implementation is `packages/adapters/web/components/data-grid.css` plus `packages/adapters/web/components/data-grid.mjs`.

The canonical host is a real `role="grid"` composite with an explicit accessible name, one header row, DOM-resident data rows, explicit `role="columnheader"` and `role="gridcell"` relationships, and stable `data-row-index` / `data-col-index` coordinates. Exactly one navigable data cell has `tabindex="0"` in navigation mode; every other gridcell has `tabindex="-1"`.

The adapter owns only generic grid interaction. Arrow keys move one cell without wrapping; Home/End move to the first/last data cell in the active row; Control+Home/Control+End move to the first/last data cell in the grid. RTL reverses only horizontal Arrow mapping. Pointer primary activation may make a cell active and focus it; hover alone never moves focus or selection.

Single-cell selection is optional through `data-selection-enabled="true"`. Space toggles the active selectable cell, preserving zero-or-one `aria-selected="true"`. Focus movement does not change selection.

Editable cells use `data-editable="true"` and contain exactly one native `[data-grid-editor]`. Enter or F2 enters edit mode, moves DOM focus into the editor, and suspends grid navigation. Escape exits and restores focus to the owning cell. Enter in a single-line editor emits a local commit exit and restores grid focus. Tab/Shift+Tab remain ordinary document traversal: the adapter schedules edit-mode cleanup without trapping or redirecting Tab. Local `neosmartui:data-grid-edit-exit` events communicate only a generic exit intent; they do not claim persistence, validation, rollback, form submission, network work, or application mutation.

The canonical preview contributes exactly five states: `rest` is fixture-realized, `hover` is native-pointer, `focus-visible` is native-keyboard, and `selected` / `editing` are controller states exercised through the real adapter keyboard path. The implementation preview matrix therefore expands from 259 to **264 real states** = **108 fixture + 49 native-pointer + 27 native-keyboard + 80 controller**. DataGrid adds one canonical Web binding and no additional business controller.

## Responsive, RTL, reduced-motion, and forced-colors implementation

The grid keeps a stable rectangular DOM and authored coordinate identity at all viewport sizes. Cells wrap long text rather than becoming fake cards. A consumer may compose an external ScrollArea when horizontal overflow is preferable, but DataGrid itself never duplicates or reorders row/column meaning.

The component owns no spatial transition. Reduced-motion mode therefore preserves the same immediate focus, selection, and edit-mode semantics. Forced-colors mode keeps grid/header/cell boundaries, focus outline, selected-state distinction, and editor focus visible using system colors.

## Token boundary

DataGrid introduces no component-specific semantic token IDs. It reuses the existing **55-token** union through panel/interactive surfaces, primary/secondary content, default/strong borders, action surface/content, focus ring, control/surface spacing, minimum target geometry, border widths, and body/emphasis/strong typography.

Public proof and Pages are bound to the exact deployed **47-Core / 55-token / 264-state** singleton from merged source `ad0001050b393be22e24cb156c35d08464be4bab`, Pages commit `de5d74c0aa5d1382de2a00aab7c8b6ac10067bef`, and Pages tree `5689497f7d8609eccc00f6368393fd118caa538d`.

## Maturity

Maturity is `public-proof`. Implementation evidence is `packages/adapters/web/components/data-grid.mjs`; structural public proof is `evidence/public/core.data-grid.json` and is bound to the exact merged-main browser evidence, exact-artifact Pages deployment, native Pages verification, and live HTTPS surface.
