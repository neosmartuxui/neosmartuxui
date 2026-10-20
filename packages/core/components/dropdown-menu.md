# `core.dropdown-menu`

`core.dropdown-menu` is the generic menu-button primitive for an explicitly invoked, anchored, single-surface action/command menu with composite keyboard focus.

## Semantic boundary

DropdownMenu owns the relationship between one real menu button and one temporary menu surface. The trigger remains a native `button` and exposes `aria-haspopup="menu"`, machine-readable expanded state, and an explicit controlled-menu relationship. The menu surface exposes `role="menu"` and is labelled by the trigger. Action rows use `menuitem`; checkable rows may use `menuitemcheckbox` or `menuitemradio` with `aria-checked`. Passive separators use `role="separator"` and never enter the focus model.

DropdownMenu is not generic Popover: once open, the surface owns menu roles, managed item focus, arrow-key navigation, menu-item activation, and menu dismissal. DropdownMenu is not Select/Listbox/Combobox: menu activation invokes commands or toggles menu-item state rather than committing a form/value-selection option. DropdownMenu is not ContextMenu: right-click, long-press, and context-key invocation are outside this trigger contract. DropdownMenu is not Menubar: it is temporary and opened by one menu button rather than being a persistent horizontal composite. DropdownMenu is not NavigationMenu: it does not own site/application route hierarchy, navigation disclosure policy, or destination structure.

This first contract freezes one menu surface. Nested submenu orchestration and Left/Right submenu traversal are not part of this slice and MUST NOT be silently invented by the Web adapter. Future submenu support must remain within an explicitly reviewed menu capability rather than creating alias IDs for count inflation.

Core owns interaction semantics only. It does not execute business commands, perform network requests, submit forms, mutate application state, schedule work, or decide routing/navigation policy.

## State law

The canonical contract states are exactly `closed`, `open`, `hover`, `focus-visible`, `pressed`, `checked`, and `disabled`.

`closed` and `open` are menu disclosure states. `hover`, `focus-visible`, and `pressed` are menu-item interaction evidence states. `checked` applies only to checkable menu-item roles. `disabled` applies to an unavailable menu item and MUST remain distinct from hidden/removed content. Placement side/alignment, anchor geometry, typeahead buffer, active item index, pointer location, top-layer phase, and animation phase are configuration/runtime details rather than additional component-state IDs.

Opening establishes one active menu-item focus context. Closing clears that context; it does not preserve a hidden roving-focus island.

## Trigger and opening law

The canonical trigger is a native button with `aria-haspopup="menu"`, `aria-expanded`, and `aria-controls` referencing the menu surface.

With focus on the closed trigger:

- `Enter` or `Space` opens the menu and moves DOM focus to the first enabled-or-disabled menu item in document order.
- `ArrowDown` opens the menu and moves focus to the first menu item.
- `ArrowUp` opens the menu and moves focus to the last menu item.
- Pointer/touch activation opens the same menu and moves focus into the menu; a second trigger activation closes it.

The trigger may use ordinary `core.button` presentation/pressure through composition, but DropdownMenu MUST NOT fork Button semantics merely to become a menu button.

## Menu keyboard law

While the menu is open, DOM focus is on exactly one focusable menu item. Menu items are programmatically focusable but remain outside ordinary document Tab order.

- `ArrowDown` moves focus to the next menu item and wraps from last to first.
- `ArrowUp` moves focus to the previous menu item and wraps from first to last.
- `Home` moves focus to the first menu item.
- `End` moves focus to the last menu item.
- Printable-character typeahead moves focus to the next item whose accessible name begins with the typed character sequence; the buffer expires after a controlled short interval.
- `Enter` or `Space` activates the focused enabled item.
- `Escape` closes the menu and restores focus to the trigger.
- `Tab` or `Shift+Tab` closes the menu without preventing the browser's ordinary document traversal; DropdownMenu MUST NOT trap Tab focus.

Disabled menu items remain discoverable in arrow/typeahead focus movement and expose `aria-disabled="true"`, but activation MUST be inert.

For plain `menuitem`, successful activation closes the menu and restores focus to the trigger after the action signal is emitted. For `menuitemcheckbox` and `menuitemradio`, activation updates the explicit checked state and keeps the menu open so additional menu settings remain operable; radio items sharing one declared group preserve single-check authority.

## Pointer, touch, and dismissal law

Pointer hover may expose `hover` presentation but MUST NOT execute a command. Pointer/touch activation of an enabled menu item follows the same semantic activation path as keyboard activation. Pointer activation outside the trigger/menu pair light-dismisses the menu and MUST NOT steal focus back from the newly activated outside target.

DropdownMenu MUST NOT hijack right-click, `contextmenu`, long-press, `Shift+F10`, or the platform context-menu key; those invocation paths belong to `core.context-menu`.

The menu closes when focus leaves through ordinary Tab traversal, when the invoker explicitly closes it, when an ordinary menu command activates, on Escape, or on outside light dismissal. It MUST NOT close merely because the pointer crosses a gap between trigger and menu.

## Accessibility and composition law

The menu surface MUST have an accessible name, normally through `aria-labelledby` referencing the menu button. Exactly one item owns DOM focus while open; passive separators and group labels are never focusable. Item icons, shortcut hints, descriptions, and check indicators are presentation/supporting content and MUST NOT replace an accessible item name.

DropdownMenu MUST NOT claim dialog/modal semantics, make the background inert, or trap focus. It MUST NOT synthesize listbox/option selection semantics. Logical anchored placement uses block/inline start/end meaning so RTL changes geometry without changing command order or semantic meaning.

Reduced motion and forced-colors support remain required. Menu-item focus remains visible independently of hover/checked state.

## Token boundary

This public-proof implementation introduces no DropdownMenu-specific semantic token IDs. It reuses the existing interactive/panel/content/border/focus/surface/depth/pressure/motion/typography roles already present in the exact public 41-Core / 55-token Theme union. All ten official Light/Dark Themes resolve that singleton without changing any token ID or concrete token value.

## Canonical Web implementation

The canonical Web adapter binds a real `<button type="button">` menu button to one temporary `role="menu"` surface. Closed menus use the native `hidden` attribute; open menus are logically positioned against the trigger with viewport clamping. Items remain `tabindex="-1"` and receive DOM focus programmatically, including `aria-disabled="true"` items so unavailable commands stay discoverable without becoming activatable.

The adapter uses native button click for Enter/Space/pointer/touch trigger activation, handles ArrowDown/ArrowUp opening explicitly, and handles ArrowUp/Down wrapping, Home/End, printable typeahead, Escape restoration, and enabled-item activation inside the menu. Tab/Shift+Tab schedules close after the browser's default traversal and is never prevented. Outside pointer activation closes without restoring trigger focus. The adapter installs no `contextmenu`, long-press, `Shift+F10`, or context-key override.

Plain `menuitem` activation emits a local `ns-dropdown-menu-activate` signal and closes. `menuitemcheckbox` toggles `aria-checked`; `menuitemradio` preserves one checked item per explicit `data-dropdown-menu-radio-group`; checkable activation emits the same local signal while keeping the menu open. The adapter does not execute business commands, navigate, submit forms, or perform network work.

## Maturity

Maturity is `public-proof`. Canonical implementation evidence remains `packages/adapters/web/components/dropdown-menu.mjs` with presentation in `packages/adapters/web/components/dropdown-menu.css`. The exact merged-main artifact has been deployed and verified through native Pages and live HTTPS before this structural promotion. Proof-only promotion does not redeploy Pages; it records the already-deployed 41-Core / 55-token singleton cohort and retires the satisfied exact-set Flavor maintenance.
