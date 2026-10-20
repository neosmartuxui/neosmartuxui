# `core.menubar`

`core.menubar` is the generic persistent horizontal application-command menu primitive: one always-present root menu composite with deterministic roving focus and optional first-level command submenus.

## Semantic boundary

Menubar owns one explicitly named `role="menubar"` surface for domain-free application commands. Root items use `menuitem`, `menuitemcheckbox`, or `menuitemradio`; checkable items expose `aria-checked`. Passive separators use `role="separator"` and never enter the focus model. The Menubar MUST have an explicit accessible name through `aria-label` or `aria-labelledby`.

Exactly one valid root item participates in ordinary document Tab order at a time. Root-item roving focus is Menubar authority; the Menubar container itself is not a second Tab stop.

Menubar is not DropdownMenu: its root composite is persistent rather than opened from one menu button. Menubar is not ContextMenu: it has no contextual invocation target and MUST NOT hijack right-click, long-press, `Shift+F10`, or the platform ContextMenu key. Menubar is not generic Popover: menu roles, composite focus, and command activation are intrinsic rather than arbitrary anchored content. Menubar is not Toolbar: its children are menu items, not arbitrary controls with toolbar semantics.

Menubar is not NavigationMenu. It does not own site/application route hierarchy, destination disclosure, current-route state, link-current semantics, or routing/navigation policy; those semantics remain reserved for the next `core.navigation-menu` contract. Menubar is not Select/Listbox/Combobox and does not turn command activation into generic form/value selection. Menubar is not searchable CommandMenu and does not own text entry, filtering, scoring, recency, or command-palette search authority.

This first contract permits one first-level submenu from a root item. Nested submenus inside that first-level menu are not part of this slice and MUST NOT be silently invented by the Web adapter. Future deeper submenu support must remain an explicitly reviewed menu-family capability rather than creating alias IDs for count inflation.

Core owns Menubar/menu interaction semantics only. It does not execute business commands, perform network requests, submit forms, mutate application-owned state, schedule work, or decide routing/navigation policy.

## State law

The canonical contract states are exactly `closed`, `open`, `hover`, `focus-visible`, `pressed`, `checked`, and `disabled`.

`closed` and `open` describe first-level submenu disclosure for a root item that owns a submenu; the root Menubar itself remains persistent. `hover`, `focus-visible`, and `pressed` are item interaction evidence states. `checked` applies only to checkable menu-item roles. `disabled` applies to an unavailable item and MUST remain distinct from hidden/removed content. Active root index, last-focused root item, submenu anchor geometry, typeahead buffer, RTL traversal mapping, pointer modality, and animation phase are runtime/configuration details rather than additional component-state IDs.

At most one first-level submenu is open. Closing a submenu clears its submenu-item focus context without destroying the persistent root Menubar focus model.

## Root focus and keyboard law

The Menubar participates in ordinary document traversal as one composite stop.

- On first Tab entry, DOM focus lands on the first root item.
- Re-entry restores the last valid root item that held Menubar focus; if it no longer exists or is invalid, focus falls back to the first root item.
- `ArrowRight` moves to the visually right adjacent root item and wraps.
- `ArrowLeft` moves to the visually left adjacent root item and wraps.
- RTL reverses visual Left/Right traversal mapping without reordering DOM command semantics.
- `Home` moves to the first root item in document order.
- `End` moves to the last root item in document order.
- Printable-character typeahead moves focus to the next root item whose accessible name begins with the typed sequence; the buffer expires after a controlled short interval.
- `Tab` or `Shift+Tab` leaves the Menubar through ordinary document traversal. Menubar MUST NOT trap Tab focus.

Disabled root items remain discoverable in arrow/typeahead focus movement and expose `aria-disabled="true"`, but activation MUST be inert.

For an enabled plain root `menuitem` with no submenu, `Enter` or `Space` emits only the local Menubar activation signal. For an enabled root `menuitemcheckbox` or `menuitemradio`, activation may update explicit checked state without leaving the Menubar; radio items sharing one declared group preserve single-check authority.

## First-level submenu law

A root item that controls a first-level submenu exposes `aria-haspopup="menu"`, `aria-expanded="true|false"`, and an explicit relationship to one labelled `role="menu"` surface.

From a root item that owns a submenu:

- `Enter`, `Space`, or `ArrowDown` opens the submenu and moves DOM focus to its first item.
- `ArrowUp` opens the submenu and moves DOM focus to its last item.
- Pointer/touch primary activation follows the same open/close authority; hover alone MUST NOT move DOM focus or execute commands.

Inside the first-level submenu, DOM focus is on exactly one focusable menu item. Items use `menuitem`, `menuitemcheckbox`, or `menuitemradio`; passive separators do not receive focus.

- `ArrowDown` moves to the next submenu item and wraps.
- `ArrowUp` moves to the previous submenu item and wraps.
- `Home` moves to the first submenu item.
- `End` moves to the last submenu item.
- Printable-character typeahead moves by accessible name.
- `Enter` or `Space` activates the focused enabled item.
- `Escape` closes the submenu and restores focus to its owning root item.
- `Tab` or `Shift+Tab` closes the submenu without preventing ordinary document traversal.

While a submenu is open, root `ArrowLeft`/`ArrowRight` traversal closes or transfers disclosure deterministically to the newly focused visual root peer. If the peer owns a submenu, the new submenu opens from its first item; if the peer has no submenu, no submenu remains open. This root-switch behavior MUST NOT be repurposed as nested-submenu Left/Right traversal.

Disabled submenu items remain focus-discoverable but inert. Plain enabled submenu activation emits the same local Menubar activation signal and closes the submenu back to its owning root context. Checkable activation may update local checked state while keeping the submenu open.

## Pointer, touch, and dismissal law

Pointer/touch primary activation of enabled root/submenu items follows the same semantic paths as keyboard activation. Hover may expose `hover` presentation but MUST NOT execute a command or silently move DOM focus.

A first-level submenu closes on Escape, ordinary Tab traversal, successful plain-item activation, switching to a root item without a submenu, outside light dismissal, or explicit close. Outside pointer activation MUST NOT steal focus back from the newly activated outside target.

Menubar MUST NOT install ContextMenu invocation behavior, synthesize long-press authority, or suppress native context menus. It MUST NOT convert pointer movement alone into command activation.

## Accessibility and composition law

The Menubar MUST have an accessible name. Parent root items expose submenu state through `aria-haspopup="menu"` and `aria-expanded`; the submenu has its own accessible name, normally through the owning root item's label relationship. Menu-item focus remains independently visible from hover/open/checked state.

Menubar MUST NOT claim dialog/modal semantics, make background content inert, or trap focus. It MUST NOT synthesize listbox/option selection semantics. Root-item roving focus changes only Menubar-owned item `tabindex`; it does not rewrite unrelated document focus order.

Reduced motion and forced-colors support remain required. The horizontal root layout must remain usable at narrow widths without hiding keyboard-reachable commands. RTL changes visual Left/Right traversal mapping and geometry where applicable but never reorders DOM command meaning.

## Canonical Web implementation

The shipping Web adapter is `packages/adapters/web/components/menubar.mjs` with presentation in `packages/adapters/web/components/menubar.css`. Root roving focus is owned directly by Menubar because exactly one persistent root item must remain `tabindex="0"`; the proven internal `menu-items.mjs` engine remains unchanged and is reused only for first-level submenu validation, focus movement, vertical ArrowUp/ArrowDown wrapping, Home/End, printable typeahead, disabled discoverability, and checkable activation.

The adapter validates authored `role="menubar"`, root menu-item roles, one root Tab stop, stable submenu ownership, explicit accessible names, one first-level submenu maximum, and coherent `aria-expanded` / `hidden` state. It never manufactures roles, links, navigation semantics, modal authority, nested submenu authority, or application commands. Root activation and submenu activation emit `ns-menubar-activate`; Core does not execute the resulting command.

The completed implementation cohort expanded all ten official Theme resolution scopes from 42 to **43 Core** while preserving the exact **55-token** union. The canonical preview matrix advanced from 242 to **249 real states**. Exact-head Quality, guarded merge, mandatory merged-main Quality, exact merged-main artifact deployment, native Pages verification, and live HTTPS verification all completed before this proof-only promotion; the temporary five-Flavor maintenance records are therefore retired by the structural proof commit.

## Token boundary

This contract introduces no Menubar-specific semantic token IDs. It reuses the interactive/panel/content/border/focus/navigation-gap/surface/depth/pressure/motion/typography roles present in the already-deployed **43-Core / 55-token** Theme union. Its original contract-only admission left the then-42-Core / 55-token public Theme scope and 242-state preview matrix unchanged; implementation and deployment advanced the singleton to 43 Core / 55 tokens and **249 real preview states** without token expansion.

## Maturity

Maturity is `public-proof`. Implementation evidence is `packages/adapters/web/components/menubar.mjs`; public-proof evidence is `evidence/public/core.menubar.json`. Proof-only promotion does not redeploy Pages; it records the already-deployed **43-Core / 55-token** singleton cohort.
