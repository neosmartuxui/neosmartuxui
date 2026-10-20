# `core.context-menu`

`core.context-menu` is the generic context-invoked menu primitive for a temporary, single-surface action/command menu opened from one explicit contextual target.

## Semantic boundary

ContextMenu owns the relationship between one explicit context target and one temporary `role="menu"` surface. The menu contains `menuitem`, `menuitemcheckbox`, or `menuitemradio` rows; checkable rows expose `aria-checked`. Passive separators use `role="separator"` and never enter the focus model. The menu MUST have an explicit accessible name through `aria-label` or `aria-labelledby`; there is no menu-button label to assume.

ContextMenu is not DropdownMenu: there is no menu-button trigger, no primary-click disclosure contract, and no `aria-expanded` button authority. ContextMenu is not generic Popover: once open, the surface owns menu roles, managed item focus, arrow-key navigation, menu-item activation, and dismissal. ContextMenu is not Menubar: it is temporary and context-specific rather than persistent. ContextMenu is not NavigationMenu: it does not own site/application route hierarchy, navigation disclosure policy, or destination structure. ContextMenu is not Select/Listbox/Combobox: menu activation invokes commands or toggles menu-item state rather than committing a generic form/value option.

This first contract freezes one menu surface. Nested submenu orchestration and Left/Right submenu traversal are not part of this slice and MUST NOT be silently invented by the Web adapter. Future submenu support must remain within an explicitly reviewed menu capability rather than creating alias IDs for count inflation.

Core owns context invocation and menu interaction semantics only. It does not execute business commands, perform network requests, submit forms, mutate application state, schedule work, or decide routing/navigation policy.

## State law

The canonical contract states are exactly `closed`, `open`, `hover`, `focus-visible`, `pressed`, `checked`, and `disabled`.

`closed` and `open` describe menu disclosure. `hover`, `focus-visible`, and `pressed` are menu-item interaction evidence states. `checked` applies only to checkable menu-item roles. `disabled` applies to an unavailable item and MUST remain distinct from hidden/removed content. Pointer coordinates, invocation modality, anchor geometry, typeahead buffer, active item index, top-layer phase, and animation phase are runtime/configuration details rather than additional component-state IDs.

Opening establishes one active menu-item focus context. Closing clears that context; it does not preserve a hidden roving-focus island.

## Context target and invocation law

The context target is explicit and MUST already be keyboard reachable through correct host semantics. ContextMenu MUST NOT manufacture `tabindex`, role, click behavior, ordinary primary-button activation, or a fake menu-button contract merely to make an arbitrary element invokable.

Pointer/secondary activation is represented by a platform-generated `contextmenu` event on the bound target. A future Web adapter may prevent the browser's native context menu only for an explicitly bound, valid ContextMenu target and only when the custom menu can actually open. It MUST NOT suppress browser context menus globally.

With keyboard focus on the bound context target:

- `Shift+F10` opens the menu and moves DOM focus to the first menu item.
- The platform `ContextMenu` key opens the same menu and moves DOM focus to the first menu item.
- Keyboard invocation anchors to the target's logical geometry rather than requiring pointer coordinates.

Pointer invocation anchors to the invocation coordinates. Reinvoking the same target while the menu is open retargets/repositions the same single menu surface rather than creating stacked menus.

Touch long-press is first-class ContextMenu invocation on an explicitly bound target. A Web adapter may use platform `contextmenu` when provided or a deliberate hold gesture when needed, but a synthetic hold MUST cancel on meaningful pointer movement, scroll/pointer cancellation, or release before its threshold. It MUST NOT convert an ordinary tap into context invocation, and it MUST preserve native editing/text-selection authority for nested editable controls instead of globally suppressing it.

## Menu keyboard law

While the menu is open, DOM focus is on exactly one focusable menu item. Menu items are programmatically focusable but remain outside ordinary document Tab order.

- `ArrowDown` moves focus to the next item and wraps from last to first.
- `ArrowUp` moves focus to the previous item and wraps from first to last.
- `Home` moves focus to the first item.
- `End` moves focus to the last item.
- Printable-character typeahead moves focus to the next item whose accessible name begins with the typed sequence; the buffer expires after a controlled short interval.
- `Enter` or `Space` activates the focused enabled item.
- `Escape` closes the menu and restores focus to the invoking context target.
- `Tab` or `Shift+Tab` closes the menu without preventing the browser's ordinary document traversal; ContextMenu MUST NOT trap Tab focus.

Disabled menu items remain discoverable in arrow/typeahead focus movement and expose `aria-disabled="true"`, but activation MUST be inert.

For plain `menuitem`, successful activation emits a local interaction signal, closes the menu, and restores focus to the invoking context. For `menuitemcheckbox` and `menuitemradio`, activation may update explicit checked state while keeping the menu open; radio items sharing one declared group preserve single-check authority.

## Pointer, touch, and dismissal law

Pointer hover may expose `hover` presentation but MUST NOT execute a command. Pointer activation of an enabled menu item follows the same semantic activation path as keyboard activation. Pointer activation outside the target/menu pair light-dismisses the menu and MUST NOT steal focus back from the newly activated outside target.

The menu closes on Escape, ordinary Tab traversal, successful plain-item activation, outside light dismissal, or explicit close. It MUST NOT reopen from ordinary primary click and MUST NOT treat pointer movement alone as invocation.

## Accessibility and composition law

The menu surface MUST have an accessible name. Exactly one item owns DOM focus while open; passive separators and group labels are never focusable. Item icons, shortcut hints, descriptions, and check indicators are presentation/supporting content and MUST NOT replace an accessible item name.

ContextMenu MUST NOT claim dialog/modal semantics, make the background inert, or trap focus. It MUST NOT synthesize listbox/option selection semantics. Context invocation does not grant authority to rewrite the target's semantic role or document tab order.

ContextMenu is an enhancement, not the sole discoverability path for an essential action. Applications MUST expose any required operation through an ordinary visible/keyboard-discoverable control or equivalent non-context-menu path; Core does not choose that application control.

Reduced motion and forced-colors support remain required. Menu-item focus remains independently visible from hover/checked state. RTL changes geometry where applicable but never command order or semantic meaning.

## Token boundary

This contract introduces no ContextMenu-specific semantic token IDs. It reuses the same interactive/panel/content/border/focus/surface/depth/pressure/motion/typography roles present in the already-deployed **42-Core / 55-token** Theme union. Its original contract-only admission left the then-41-Core / 55-token public Theme scope and 235-state preview matrix unchanged; implementation and deployment advanced the singleton to 42 Core / 55 tokens and **242 real preview states** without token expansion.

## Canonical Web implementation

The shipping Web adapter is `packages/adapters/web/components/context-menu.mjs` with presentation in `context-menu.css`. It binds only an explicit, already-keyboard-reachable `data-context-menu-target`; it never writes target `tabindex`, role, click behavior, `aria-haspopup`, or `aria-expanded`. Pointer `contextmenu` opens at invocation coordinates, while `Shift+F10` and the platform `ContextMenu` key use the target's logical geometry. A deliberate touch hold is supported with movement, scroll, cancellation, and early-release cancellation, and nested editable controls retain native selection/editing authority.

DropdownMenu and ContextMenu share only the uncounted internal `menu-items.mjs` mechanics for item validation, DOM focus movement, ArrowUp/ArrowDown wrapping, Home/End, printable typeahead, disabled discoverability, and checkable activation. DropdownMenu continues to own menu-button invocation and trigger placement; ContextMenu independently owns target/context invocation, pointer coordinates, keyboard target anchoring, and long-press policy. Plain ContextMenu activation emits `ns-context-menu-activate`, closes, and restores the invoking context target; checkable activation remains local and keeps the menu open.

The completed implementation cohort expanded all ten official Theme resolution scopes from 41 to **42 Core** while preserving the exact **55-token** union. Exact-head Quality, guarded merge, mandatory merged-main Quality, exact merged-main artifact deployment, native Pages verification, and live HTTPS verification all completed before this proof-only promotion; the temporary five-Flavor and shared DropdownMenu maintenance records are therefore retired by the structural proof commit.

## Maturity

Maturity is `public-proof`. Implementation evidence is `packages/adapters/web/components/context-menu.mjs`; public-proof evidence is `evidence/public/core.context-menu.json`. Proof-only promotion does not redeploy Pages; it records the already-deployed **42-Core / 55-token** singleton cohort.
