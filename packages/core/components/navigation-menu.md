# `core.navigation-menu`

`core.navigation-menu` is the generic site/application navigation disclosure primitive: a named navigation landmark containing real destination links and optional first-level disclosure controls while preserving ordinary document focus traversal.

## Semantic boundary

NavigationMenu owns a native `<nav>` landmark with an explicit accessible name, a semantic list hierarchy, real `<a href>` destination links, and real disclosure `<button type="button">` controls. It does not replace native navigation semantics with application-menu widget roles.

NavigationMenu MUST NOT use `role="menu"`, `role="menubar"`, `menuitem`, `menuitemcheckbox`, or `menuitemradio`. Those composite menu roles imply a different focus/keyboard model and remain Menubar, DropdownMenu, and ContextMenu authority.

A top-level item may be a direct destination link, a disclosure-only group, or a destination link with a separate adjacent disclosure button. When one item has both destination and disclosure authority, the destination link and disclosure button remain separate native controls. NavigationMenu MUST NOT collapse link navigation and disclosure expansion into one synthetic control.

The first contract permits one first-level nested destination list per disclosure control. Deeper recursive disclosure is not part of this slice and MUST NOT be silently invented by the Web adapter. Future deeper hierarchy must remain explicitly reviewed capability rather than a count-inflating alias.

Core owns navigation structure, disclosure state, current-route presentation, and accessibility invariants only. It does not decide route matching, fetch route data, execute business navigation policy, mutate browser history, assign URLs, or replace an application router.

## State law

The canonical contract states are exactly `closed`, `open`, `hover`, `focus-visible`, `pressed`, and `current`.

`closed` and `open` describe a first-level disclosure button and its controlled nested destination list. `hover`, `focus-visible`, and `pressed` are interaction evidence states for a native destination link or disclosure button. `current` applies only to the real destination link carrying `aria-current="page"`.

Active disclosure id, focus location, responsive layout, pointer modality, route resolution, URL matching, and animation phase are runtime/configuration details rather than additional component-state IDs.

At most one first-level disclosure is open in this initial Core slice. The root navigation landmark itself remains persistent.

NavigationMenu does not define a disabled state. Unavailable destinations are omitted or represented as non-interactive explanatory content; Core MUST NOT manufacture fake disabled anchors with `aria-disabled`.

## Native navigation and focus law

All destination links and disclosure buttons remain in ordinary document Tab order. NavigationMenu is not a composite widget and MUST NOT create roving `tabindex`, a single composite Tab stop, or a focus trap.

- `Tab` and `Shift+Tab` follow ordinary document order through links and disclosure buttons.
- `Enter` follows native anchor activation for destination links.
- `Enter` and `Space` follow native button activation for disclosure controls.
- The first slice deliberately does not intercept Arrow keys, `Home`, or `End`. Optional spatial-navigation enhancements MUST NOT replace native Tab traversal or create Menubar-style roving focus.
- NavigationMenu MUST NOT call `preventDefault()` for ordinary destination-link activation.

RTL affects visual layout and logical placement, but NavigationMenu never reorders DOM destination meaning or synthesizes a visual-direction keyboard composite.

## Disclosure law

A disclosure control is a real `<button type="button">` with `aria-expanded="true|false"` and an explicit `aria-controls` relationship to one nested destination-list container.

Pointer/touch primary activation and native keyboard activation toggle only the controlled disclosure. Hover alone MUST NOT open the destination list, move DOM focus, or navigate.

`Escape` closes an open disclosure when focus is inside that disclosure context and restores focus to the controlling disclosure button. Moving focus outside the NavigationMenu closes any open disclosure without pulling focus back into the NavigationMenu.

Outside pointer activation closes any open disclosure without stealing focus from the newly activated outside target. Closing disclosure never cancels a destination link's native navigation.

## Current-route law

Current-route presentation uses `aria-current="page"` on the real destination link representing the current page. One NavigationMenu root permits zero or one current-page link.

A parent group containing the current destination does not receive a second synthetic `aria-current` value. Visual "current within" treatment, if later needed, must derive from the authored current link without inventing a second route authority.

The application/router remains the source of truth for which URL is current. Core validates and presents authored current-route state but MUST NOT set `location`, call `history.pushState` or `history.replaceState`, intercept native navigation, or infer route ownership from labels.

## Composition boundaries

NavigationMenu is not Menubar: NavigationMenu presents destinations and disclosure with native links/buttons and ordinary Tab order; Menubar presents application commands through `menubar`/`menuitem` composite semantics.

NavigationMenu is not DropdownMenu: DropdownMenu is a temporary command menu opened by one menu button. NavigationMenu is not ContextMenu: ContextMenu is a temporary context-invoked command menu. NavigationMenu disclosure reveals destination links and leaves those links in ordinary document navigation.

NavigationMenu is not generic Popover: its revealed content is a navigation hierarchy with destination semantics, not arbitrary anchored content.

NavigationMenu is not Tabs: navigation destinations may change URL/document/application context and do not own same-page `tabpanel` selection.

NavigationMenu is not Breadcrumb: Breadcrumb is a compact ancestor trail. NavigationMenu is not Pagination: Pagination moves within a paginated collection. NavigationMenu is not Drawer: responsive shells may compose NavigationMenu inside Drawer, but NavigationMenu does not own modal/mobile-shell behavior.

NavigationMenu is not Select/Listbox/Combobox and does not turn destinations into value selection. It is not searchable CommandMenu and does not own text entry, filtering, ranking, or command execution.

## Accessibility and input law

The `<nav>` landmark requires an explicit accessible name through `aria-label` or `aria-labelledby`. Nested lists preserve list semantics so hierarchy remains available to assistive technologies.

Disclosure controls require visible and programmatic association with their nested lists. Current-route meaning MUST remain programmatic through `aria-current="page"`; color or depth alone MUST NOT carry current-page meaning.

Native link affordances remain intact, including browser link context menus, open-in-new-tab behavior, copy-link behavior, and platform URL status. Core MUST NOT replace anchors with button-like route shims.

Reduced motion and forced-colors support remain required. Responsive layout may wrap, stack, or be composed into an external shell, but must preserve DOM order, destination semantics, focus visibility, and target usability.

## Canonical Web implementation

The shipping Web adapter is `packages/adapters/web/components/navigation-menu.mjs` with presentation in `packages/adapters/web/components/navigation-menu.css`. The adapter validates one named native `<nav>` landmark, semantic list hierarchy, real destination anchors, real disclosure buttons, one-level `aria-controls` ownership, zero-or-one `aria-current="page"` destination, and at-most-one open first-level disclosure.

`bindNavigationMenu` installs click handling only on the authored disclosure buttons, Escape handling for open disclosure context, and outside/focus-leave light dismissal. It does not install link click interception, Arrow/Home/End navigation, typeahead, roving tabindex, menu roles, nested disclosure authority, router/history mutation, or business/network behavior. Native anchors retain native navigation, browser context-menu, open-in-new-tab, copy-link, and ordinary Tab behavior.

The deployed/public singleton cohort covers all ten official Theme resolution scopes at **44 Core / 55 tokens**. The canonical preview matrix contains **255 real states** using fixture, native-pointer, and native-keyboard realization only; no preview controller is needed.

## Token boundary

NavigationMenu introduces no component-specific semantic token IDs. It reuses the navigation-gap, interactive/panel/content/border/action/focus/control/surface/depth/pressure/motion/typography roles in the public **44-Core / 55-token** singleton. Exact-artifact deployment, native Pages verification, live HTTPS verification, and proof-only promotion preserve that exact token union.

## Maturity

Maturity is `public-proof`. Implementation evidence is `packages/adapters/web/components/navigation-menu.mjs`; public-proof evidence is `evidence/public/core.navigation-menu.json`. Proof-only promotion does not redeploy Pages.
