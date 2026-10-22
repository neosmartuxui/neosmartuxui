# `core.scroll-area` — Expansion D contract admission

`core.scroll-area` is a Core content viewport that preserves **native scrolling** and the semantics of the content it contains. This contract is admitted as **contract-only**; there is no shipping adapter, preview, Pages deployment, or public-proof claim yet. The existing 50 proven Core components and their 55-token, 267-state implementation cohort remain unchanged.

## Semantic ownership

The canonical Web host is an authored, dimensionally bounded scrolling container using native CSS overflow. It may contain a Table, DataGrid, List, DescriptionList, document content, or controls, but it must not own their roles or state. ScrollArea is **not** a selectable listbox, grid, TreeView, carousel, virtualized list, resize handle, pagination system, or focus-trapped composite.

The viewport preserves **one original DOM subtree**, without duplicate hidden content, copied item markup, artificially inserted table headers, or presentation-only element replicas. The native scrolling element owns its own scroll offsets; ScrollArea does not recreate them as a second application-state authority.

## State and configuration

The canonical state list is exactly `rest`. Scroll position, overflow present/absent, top/bottom, start/end, horizontal/vertical axis, and scrollbar appearance are **native conditions or configuration**, not invented component states. Do not inflate the preview matrix with `hover`, `pressed`, `selected`, `open`, or `disabled` states.

Constrained block/inline size is supplied by the parent or author. The implementation must not force one global fixed height/width. Axis choices are native overflow configuration, not distinct Core components. `overflow: auto` should be the default when scrollbars are needed, and normal native scrolling must remain available if an enhancement is unsupported.

## Keyboard and focus

When content overflow makes the viewport a separately keyboard-operable scrolling region, it must be focusable through a **single predictable Tab stop** (for example, authored `tabindex="0"` on the viewport); it must provide an accessible name when users need to distinguish it from other scrollable regions. Do not set `tabindex` on every content row or inject roving descendants.

Tab/Shift+Tab must continue in ordinary DOM order into and out of descendant controls. Arrow keys, Page Up/Down, Home/End and Space operate through the browser's native scrolling behavior when appropriate. Core does not install global key handlers, steal Arrow keys from embedded DataGrid or inputs, trap focus, or call `preventDefault()` to create its own scrolling algorithm.

A generic `role="region"` is **not automatically assigned** to every viewport; use landmarks and labels only when justified by the authored page context. Do not invent list/grid semantics to announce scrollability.

## Pointer, touch, nested content

Wheel, trackpad, drag/touch scrolling and inertial scrolling remain platform-native. Do not hide native scrollbars without an equally accessible alternative. No custom thumb/controller, pointer capture, native scrollbar imitation, document scroll locking, synthesized pointer actions, scroll snapping or forced smooth-scroll animations in the base primitive.

Nested scrolling follows native containment and platform behavior; any `overscroll-behavior` override must be an explicit higher-level composition decision and must not create a trapping region.

## RTL, viewport size and accessibility

Use logical `inline`/`block` sizing, spacing and borders. RTL content is not reversed or remounted and the implementation must **not assume a particular sign or zero origin** for RTL `scrollLeft` across browsers. Preserve the authored reading order, independent descendant focus, horizontal overflow, narrow mobile scrolling and long localized text.

Reduced motion requires no core animation. The browser's OS/user scrolling preference remains authoritative; never force smooth motion when reduced motion is requested. In forced colors, the viewport's focus outline, boundaries and native scrollbars must remain perceivable; scrollbar-only color coding is prohibited.

## Token boundary

Only current canonical token IDs are admitted: `color.border.default`, `color.focus.ring`, `space.surface.inline`, `space.surface.block`, `border.surface.width`, `focus.ring.width`, `focus.ring.offset`. There are **no new Theme token IDs**, no Pressure/hover-lift animation and no ScrollArea-specific color palette.

## Deferred implementation and proof gate

Contract admission does **not** ship a `.ns-scroll-area` CSS class or a controller. Implementation must prove real scrolling in all ten official Light/Dark Theme scopes, focus traversal around descendant controls, horizontal/vertical and nested content behavior, RTL without numeric offset assumptions, narrow screens, reduced motion, forced colors, no browser errors, and accessibility of the named scrolling viewport where needed.

Only after tested implementation, exact merged-main QA, guarded Foundry release, 105+ exact live-file parity, official Flavor verification, and a **new versioned proof-only cohort promotion** may the registry advance to `implemented` and eventually `public-proof`. Do not mutate the existing `neosmartuxui/public-proof-cohort@2` evidence or historical v1 records for this admission.
