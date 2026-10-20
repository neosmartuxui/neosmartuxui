# `core.item`

`core.item` is NeoSmartUXUI's generic structured content row/unit. It organizes optional leading/media content, a primary content region, supporting description, metadata, trailing content and independent actions without importing collection, selection, navigation, activation or business semantics.

## Semantic boundary

Item is not List. `core.list` will own collection semantics, ordering and container structure. Item may be composed as a child of a semantic List, but a standalone Item does not manufacture `list` / `listitem` roles or imply membership in a collection.

Item is not Card. Card is a bounded informational grouping surface. Item is a linear/row-oriented content unit and MUST NOT silently inherit Card depth, radius, boxed-surface meaning or whole-surface treatment merely because both may contain title/description/action anatomy.

The semantic host is composition-owned. Depending on surrounding document meaning, an Item may be authored on a valid `li`, `article`, `div` or another appropriate host. Core MUST NOT add a conflicting ARIA role just to make the visual row look like a known widget.

Item has no inherent `list`, `option`, `menuitem`, `treeitem`, `gridcell`, button, link, checkbox, selection or disclosure role. It is not a MenuItem, Listbox option, TreeItem, DataGrid row/cell, selectable row, command row or navigation destination.

Leading/media, title, description, metadata, trailing and actions are anatomy names for composition, not accessibility roles. A title does not choose its own heading rank; metadata does not become a status/live region automatically; trailing content does not make the whole Item interactive.

## State model

The canonical component state is exactly `rest`.

Hover, focus-visible, pressed, selected, active/current, checked, expanded, disabled, loading, invalid and error are not Item states. Those belong to real nested controls/status primitives or a higher-level component that explicitly owns the relevant interaction/value authority.

Presentation variants such as compact, spacious, divided, media-leading or metadata-heavy may alter composition later, but they MUST NOT create additional semantic states or count-inflating aliases.

## Interaction law: a content row is not a control

Item MUST NOT become whole-row clickable or focusable by attaching `tabindex`, `role="button"`, synthetic key handlers, overlay click handlers, pointer cursor or hidden activation targets to the container.

When an Item contains a genuine link, button, checkbox, menu trigger or other control, that descendant retains its own semantics, minimum target size, focus-visible treatment and activation behavior. Independent nested controls MUST remain independently operable; Core MUST NOT stretch a synthetic whole-row click target over them.

Item owns no roving `tabindex`, `aria-activedescendant`, Arrow/Home/End keyboard model, selection, checked/current/expanded state, disclosure, drag/drop, sorting, filtering, editing, persistence, network work, form submission or business-state mutation.

## Keyboard, pointer and touch

The Item container itself does not enter the page Tab sequence and does not synthesize Enter/Space activation. Interactive descendants remain in ordinary document Tab order.

Pointer hover may be used by a future containing interactive composition to style an active row, but plain Item itself MUST remain semantically stable: hovering or pressing empty row space does not focus descendants, execute actions, select content or imply clickability.

Touch behavior follows the real nested controls. Item MUST NOT place an invisible row-wide activation surface over unrelated text or multiple independent actions.

## RTL, narrow layouts and long content

Item layout uses logical properties and preserves authored reading/focus order in LTR and RTL. RTL may change visual alignment but MUST NOT reorder semantic meaning or keyboard order.

Narrow layouts may wrap or stack visual regions when necessary, provided source order and accessible reading/focus order remain coherent. Long localized titles, descriptions, metadata and identifiers must wrap without clipping essential content or requiring duplicated presentation-only labels.

## Reduced motion and forced colors

Item owns no spatial motion requirement. Reduced-motion mode therefore preserves the same stable structure.

Forced-colors/high-contrast rendering must keep primary/supporting content readable and preserve a perceivable row boundary when one is authored. Meaning MUST NOT depend only on custom background or border color.

## Canonical Web implementation

The shipping Web implementation is CSS-only at `packages/adapters/web/components/item.css`. No JavaScript adapter or preview controller exists because Item owns no activation, focus model, selection, disclosure, value state or business behavior.

The canonical preview uses a composition-owned native `<article id="item-demo" class="ns-item" data-state="rest">` with leading, primary/title, supporting description, metadata, trailing and independent action regions. The Item host has no widget role and no `tabindex`; the nested real Button remains an ordinary Button with its own semantics, target geometry and focus-visible behavior.

The implementation preview matrix expands from 264 to **265 real states** = **109 fixture + 49 native-pointer + 27 native-keyboard + 80 controller**. Item contributes exactly one fixture-realized `rest` state and no controller or runtime binding.

## Responsive, RTL, reduced-motion, and forced-colors implementation

`.ns-item` uses logical flex layout and source-order-preserving wrapping. Narrow layouts wrap leading/content/trailing/action regions without duplicating labels or creating fake mobile cards. Long titles, descriptions, metadata and identifiers use normal wrapping and `overflow-wrap: anywhere` where needed.

RTL changes logical alignment and visual flow only; authored DOM/read/focus order remains unchanged. Item owns no animation, transition or transform travel. Forced-colors mode keeps text readable and preserves the authored row divider with system colors.

## Token boundary

Item introduces no component-specific semantic token IDs. It reuses the existing **55-token** union through panel surface, primary/secondary content, default border, surface spacing/border geometry and body/strong typography roles.

The implementation deliberately excludes focus, action, pressure, depth, control-radius, selection, state-color and motion tokens because Item itself is not interactive, selectable, pressable or animated. Any composed nested control brings its own proven control tokens through that control's own implementation.

Public proof and Pages are bound to the exact deployed **48-Core / 55-token / 265-state** singleton from merged source `83954edf87c56a529b8e26e848c901d1b43fa4f2`, Pages commit `bab256ec0f107d434fe66b8c99a415ce1dd0f9bf`, and Pages tree `1dc32b03e7b54965df61259db85079609e02678c`.

## Maturity

Maturity is `public-proof`. Implementation evidence is `packages/adapters/web/components/item.css`; structural public proof is `evidence/public/core.item.json` and is bound to the exact merged-main browser evidence, exact-artifact Pages deployment, native Pages verification, and live HTTPS surface.
