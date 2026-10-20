# `core.popover`

`core.popover` is the generic explicitly invoked anchored non-modal overlay primitive for supplemental interactive content.

## Semantic boundary

Popover owns an anchored top-layer surface whose disclosure is explicitly controlled by an invoker while the rest of the document remains interactive. It is not Dialog or AlertDialog: opening a Popover does not establish modal semantics, background inertness, or a focus trap. It is not Tooltip or HoverCard: interactive content is allowed and explicit activation is authoritative rather than hover/focus-delay disclosure. It is not DropdownMenu, ContextMenu, Menubar, or NavigationMenu: Popover does not own menu roles, roving focus, menu-item semantics, command semantics, or navigation policy. Trigger pressure remains ordinary Button composition, and Popover does not own business policy, network requests, form submission, application scheduling, routing, or page navigation.

## State and interaction law

Canonical semantic states are exactly `closed` and `open`. Side, alignment, anchor geometry, top-layer phase, and animation phase are not component-state IDs. The canonical Web behavior is the platform non-modal Popover model using an auto popover surface (`popover="auto"`) with explicit invoker relationship and machine-readable expanded state. Ordinary light dismiss and close-request behavior may close the open Popover through Escape or outside interaction. Trigger activation toggles the same disclosure authority; explicit/programmatic close must converge on the same closed state rather than inventing parallel state machines.

## Accessibility and input law

Popover does not claim `aria-modal="true"`, does not make the background inert, and does not trap focus. Ordinary Tab and Shift+Tab traversal remain document traversal; Core MUST NOT install a Tab loop or roving-focus model for generic Popover content. Interactive descendants retain their native semantics. If dismissal hides the currently focused Popover subtree, focus must resolve safely to the valid invoker rather than disappear. The trigger/content relationship and expanded state remain explicit and machine-readable. Anchored placement uses logical geometry so inline-start/inline-end meaning survives RTL. Reduced motion and forced colors remain required. Generic Popover MUST NOT manufacture `menu`, `menuitem`, `dialog`, or `alertdialog` semantics.

## Token boundary

This implementation introduces no Popover-specific semantic token contract. It reuses existing panel/content/border/surface/depth/motion/typography roles already present in the 55-token Theme union. All ten official Light/Dark Themes resolve the exact public 39-Core scope without expanding the 55-token semantic union.

## Canonical Web implementation

The canonical Web adapter uses the platform Popover API with an auto popover surface, a real Button invoker with `popovertarget`, explicit `aria-controls` / `aria-expanded` state, native light-dismiss and Escape behavior, and adapter-owned logical positioning through `data-popover-side` plus `data-popover-align`. Opening keeps the invoker focus unless ordinary document traversal moves it; the adapter installs no Tab loop. Explicit/programmatic close and native dismissal share the same state synchronization, and focus is restored only when dismissal would otherwise strand focus inside the hidden Popover subtree.

## Maturity

Maturity is `public-proof`. The exact merged-main artifact has been deployed and verified through native Pages and live HTTPS before this structural promotion. Proof-only promotion does not redeploy Pages; it records the already-deployed 39-Core / 55-token singleton cohort and retires the satisfied exact-set Flavor maintenance.
