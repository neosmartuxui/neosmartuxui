# `core.hover-card`

`core.hover-card` is the generic structured non-interactive preview primitive revealed from pointer hover or keyboard focus after a controlled delay.

## Semantic boundary

HoverCard owns supplemental preview content associated with an existing semantic trigger or destination. The card may contain richer read-only structure than a Tooltip, such as a title, descriptive text, metadata, image/illustration, or grouped preview details, but the preview is not essential task information and is not itself an action surface. HoverCard is not Tooltip: Tooltip remains concise supplemental description with `role="tooltip"`. HoverCard is not Popover: activation is not the authoritative open mechanism, persistence is not user-toggled, and the surface MUST NOT contain buttons, links, inputs, menus, dismiss controls, or other focusable descendants. If interactive content or user-controlled persistence is required, compose `core.popover` instead. HoverCard is not DropdownMenu, ContextMenu, Menubar, or NavigationMenu and MUST NOT manufacture menu roles, roving focus, command semantics, or navigation policy.

The trigger keeps its own semantics. Core MUST NOT turn an arbitrary non-interactive element into a fake control solely to own a HoverCard. HoverCard does not own business policy, network requests, form submission, application scheduling, routing, or page navigation.

## State and interaction law

Canonical semantic states are exactly `closed`, `open`, and `dismissed`. Open-delay, close-delay, pointer-transfer grace, side/alignment, anchor geometry, and animation phase are configuration or presentation details, not component-state IDs.

A valid HoverCard may open after a short controlled delay while its trigger is pointer-hovered or keyboard-focused. Pointer users must be able to move from the trigger onto the HoverCard without immediate collapse; the surface remains open while the pointer is over either member of the trigger/card pair. When neither trigger nor card remains hovered and the trigger is not focused, a short close grace may resolve the surface to `closed`.

Escape closes an open HoverCard without moving focus and places it in `dismissed` for the current uninterrupted hover/focus session so the same originating condition does not immediately reopen it. A genuine new session—such as pointer leave/re-entry or focus leaving and returning—may reveal the card again. The component MUST NOT auto-dismiss on an arbitrary reading timer while the trigger/card interaction remains active.

## Accessibility and input law

HoverCard content is supplemental, not essential. A user must not need the HoverCard as the only source of an accessible name, required instructions, validation, safety information, or information necessary to complete a task. The underlying trigger/destination remains semantically complete without the preview.

HoverCard is not a modal or composite widget. The surface MUST NOT claim `role="tooltip"`, `role="dialog"`, `role="menu"`, `aria-modal="true"`, `aria-haspopup`, or user-controlled `aria-expanded` semantics merely because it appears in the top layer. Keyboard focus remains on the trigger; the surface does not enter the tab order. Ordinary Tab and Shift+Tab traversal remain document traversal, and Core MUST NOT install a Tab loop or roving-focus model. Escape may dismiss only the owned HoverCard session and must not activate or mutate the trigger.

Touch has no dependable hover model. HoverCard MUST NOT hijack click, tap, long-press, context-menu, text-selection, or native activation to force a desktop preview pattern onto touch. If equivalent information is essential on touch, composition must expose it persistently or use an explicitly invoked disclosure such as Popover.

Logical placement preserves inline-start/inline-end meaning in RTL. Reduced motion and forced colors remain required.

## Token boundary

This public-proof implementation introduces no HoverCard-specific semantic token contract. It reuses existing panel/content/border/surface/depth/motion/typography roles already present in the exact public 40-Core / 55-token Theme union. All ten official Light/Dark Themes resolve that singleton without changing any token ID or concrete token value.

## Canonical Web implementation

The canonical Web adapter binds an existing semantic trigger to a distinct read-only HoverCard surface through `aria-details`. The trigger keeps its native role, activation, accessible name, and tab behavior. The adapter validates that the surface has no popup/modal/menu role, no `aria-modal`, `aria-haspopup`, or `aria-expanded`, no focusable descendants, and no interactive descendants. Pointer hover and keyboard focus schedule the same controlled reveal authority; moving the pointer from trigger to surface preserves the session; Escape enters `dismissed` without moving focus; leaving the complete hover/focus session resets to `closed`. Touch pointer entry is ignored and the adapter installs no click, touch, long-press, context-menu, activation, Tab-loop, or roving-focus handler. Logical `data-hover-card-side` / `data-hover-card-align` placement preserves meaning in RTL, and viewport changes reposition only while open.

## Maturity

Maturity is `public-proof`. Canonical implementation evidence remains `packages/adapters/web/components/hover-card.mjs` with presentation in `packages/adapters/web/components/hover-card.css`. The exact merged-main artifact has been deployed and verified through native Pages and live HTTPS before this structural promotion. Proof-only promotion does not redeploy Pages; it records the already-deployed 40-Core / 55-token singleton cohort and retires the satisfied exact-set Flavor maintenance.
