# `core.toast`

`core.toast` is the generic transient status-announcement primitive: it queues non-modal feedback, presents one announcement at a time, and dismisses it without stealing application focus or becoming a stable Alert, dialog, popover, menu, or application-command surface.

## Semantic boundary

Toast owns transient status presentation, FIFO queue order, announcement priority, and dismissal mechanics only. It does not decide message content, execute business actions, mutate application state, submit forms, navigate, perform network work, or schedule application work.

The first Core slice permits status text plus an optional native dismiss `<button type="button">`. Arbitrary action links/buttons and application command execution are deferred reviewed capability rather than silently included in this contract.

Toast is not Alert: `core.alert` is stable inline message content and deliberately does not create implicit live-region behavior. Toast is transient feedback and may announce newly presented status. Toast is not Dialog or AlertDialog because it is non-modal and never contains or redirects application focus. Toast is not Popover or Tooltip because it is not anchored supplemental content owned by an invoker. Toast is not DropdownMenu, ContextMenu, Menubar, NavigationMenu, Select/Listbox/Combobox, or a routing/command primitive.

## Queue and state law

The canonical contract states are exactly `queued`, `visible`, and `dismissed`.

The first slice uses FIFO ordering and permits at most one visible Toast announcement at a time. This avoids manufacturing simultaneous competing live-region speech. A future stacked-visibility model requires explicit review rather than being inferred as a visual variant.

`queued` means the Toast is awaiting presentation. `visible` means its message is currently presented and eligible for announcement. `dismissed` is the terminal local state after explicit dismissal, permitted timeout dismissal, or application-requested removal.

Timeout progress, pause reason, dismissal reason, queue position, tone, announcement priority, pointer state, focus location, and transition phase are runtime/configuration details rather than additional component-state IDs.

## Announcement and timing law

The default announcement channel is polite status. Assertive/urgent announcement requires explicit authored priority and MUST NOT be inferred from warning/error color or visual tone alone.

Appearance MUST NOT move DOM focus, auto-focus a dismiss control, create a focus trap, or rewrite ordinary document Tab order. Removal MUST NOT restore or move focus because Toast never owns focus.

Timed dismissal is optional configuration, not required Toast behavior. Essential, critical, or focusable Toast content MUST NOT disappear on an unadjustable timer. When timed dismissal is enabled for non-essential passive status, countdown pauses while the pointer is over the Toast, while focus is inside it, and while the document is hidden.

Explicit dismissal and permitted timeout/programmatic dismissal converge on the same local removal path. Dismissal MUST NOT trigger navigation, submit forms, execute network work, or infer application success/failure state.

## Accessibility and input law

A dismiss control, when present, is a real native `<button type="button">` and must preserve a target capable of meeting the Core minimum control size. It remains in ordinary Tab order and is never auto-focused when the Toast appears.

Keyboard users who reach the optional dismiss control receive ordinary native button Enter/Space activation. Toast MUST NOT install global Escape handling or unrelated document key interception merely because a notification is visible.

Pointer hover may pause an authored timeout but MUST NOT move focus. Touch interaction remains ordinary control activation; long-press, swipe-to-dismiss, drag gestures, and global pointer capture are not part of this first slice.

Written message content remains authoritative. Neutral/info/success/warning/error tone may reuse existing semantic color roles, but color, iconography, sound, or motion MUST NOT be the only carrier of status meaning.

Reduced motion changes transition presentation only; it does not change queue order, announcement priority, dismissal eligibility, or timing authority. RTL affects logical layout, not queue order or message meaning. Forced-colors support must preserve message/dismiss-control boundaries and visible focus.

## Canonical Web implementation

The shipping Web adapter is `packages/adapters/web/components/toast.mjs` with presentation in `packages/adapters/web/components/toast.css`. `bindToast` validates one authored Toast region, exact `queued|visible|dismissed` item states, FIFO DOM queue order, zero-or-one visible announcement, explicit polite/assertive priority, optional native dismiss-button authority, and the first-slice ban on arbitrary interactive descendants.

`syncToastState` projects authored state into visibility and announcement semantics without moving focus. `showNextToast` promotes the first queued item only when no Toast is visible. `dismissToast` converges explicit, permitted timeout, and programmatic removal into one local dismissal path and then promotes the next queued item. The adapter emits only the local `ns-toast-dismiss` interaction signal; it does not execute application actions, navigate, submit forms, perform network work, or infer business success/failure.

Optional passive timers are accepted only for polite, non-essential Toasts without focusable dismiss/action content. Bound timers pause while the pointer is over the visible Toast, while focus is within it, and while the document is hidden. Toast installs no global Escape handler and never focuses or restores an element.

The proven shipping cohort resolves all ten official Theme scopes at **45 Core / 55 token values**. The canonical preview matrix contains **258 real states**, with `queued`, `visible`, and `dismissed` each fixture-realized and no preview controller.

## Token boundary

Toast introduces no component-specific semantic token IDs. It reuses existing panel/interactive/content/border/state/focus, control/surface spacing, control/surface geometry, depth/pressure, motion, typography, and minimum-target roles from the shipping **55-token** semantic union.

Public proof and Pages are bound to the exact deployed **45-Core / 55-token / 258-state** singleton from merged source `6301265c8ed2699e9d5b5745dee99efa53c3fb58`, Pages commit `f6b374564667b2e23c8f7120896003795e4a5fe9`, and Pages tree `a66df3abb90fd198e65a780ae1aa66a774d830e2`.

## Maturity

Maturity is `public-proof`. Implementation evidence is `packages/adapters/web/components/toast.mjs`; structural public proof is `evidence/public/core.toast.json` and is bound to the exact merged-main browser evidence, exact-artifact Pages deployment, native Pages verification, and live HTTPS surface.
