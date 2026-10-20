# NeoSmartUI Core — Component Registry Contract v1

Core Components are generic UI capabilities that can be described accurately without naming a business domain.

The registry is an authority surface, not a marketing count. A component MUST NOT be listed as implemented or publicly proven until matching evidence exists in the same repository state.

## Admission law

A Core component MUST:

1. be business-domain-neutral;
2. have a stable `core.<name>` ID;
3. publish a machine-readable `neosmartui/component@1` contract;
4. declare all semantic-token dependencies;
5. define state semantics before visual implementation;
6. define keyboard, touch, RTL, reduced-motion, and forced-colors support expectations;
7. preserve permanent tactile laws where interactive;
8. avoid Flavor-specific values or Vertical business semantics;
9. expose honest maturity/proof status in the registry.

If a capability cannot satisfy these rules yet, it is a `REGISTRY GAP`, not permission to invent a local substitute.

## Registry maturity

The registry uses three explicit maturity states:

- `contract-only` — semantic/state/token contract exists; no implementation claim.
- `implemented` — a canonical implementation exists and is quality-validated.
- `public-proof` — the canonical implementation is represented by live/public proof derived from the same source.

Promotion between states requires evidence. Tooling MUST reject a maturity claim whose evidence is absent.

## Slice 1: `core.button`

`core.button` established the first Core path and exercises permanent press/release interaction laws. Its contract covers rest, hover, focus-visible, pressed, loading, and disabled states. Its current public proof is refreshed whenever the singleton development host advances to a newer exact-SHA Foundry deployment that still exercises the unchanged implementation.

## Slice 2: `core.checkbox`

`core.checkbox` adds persistent checked/unchecked selection, indeterminate presentation, invalid state, and contact compression without introducing a business domain. Its native Web implementation and public proof exercise a 44px effective target plus pressure-not-levitation state feedback.

## Slice 3: `core.input`

`core.input` adds generic single-line text-like data entry with a canonical native Web implementation and live public proof. It exercises a different interaction class: the control is interactive but not pressable.

The implementation preserves native editing and selection while synchronizing only agent-readable empty/filled state. Hover, focus, and pointer contact never borrow press/depth tokens or translate the field. Its live proof verifies the same exact-SHA Foundry deployment cohort as the other public Core primitives.

The contract continues to require explicit focus/empty/filled/invalid/read-only/disabled states, a 44px minimum effective control height, RTL/IME resilience, reduced-motion and forced-colors support, and a strict prohibition on borrowing button pressure-depth tokens merely because the field can receive pointer or keyboard interaction.

Field labels, help/error copy, prefixes/suffixes, password reveal actions, and form layout remain composition outside this primitive.

## Slice 4: `core.radio`

`core.radio` provides mutually-exclusive native choice semantics with a canonical NeoSmartUI Web adapter and live public proof. Unlike checkbox, one checked radio affects its peers in the same selection set; the adapter mirrors state across the native group instead of reimplementing exclusivity.

The implementation preserves native same-name/form grouping and arrow-key movement while exposing agent-readable checked/unchecked state. Contact follows the family pressure law: hover and press compress toward the surface, never upward, and checked state remains unambiguous after release. The visible glyph is smaller than the token-backed 44px effective target.

Its current public proof is bound to the same exact-SHA GitHub Pages deployment cohort as the other public Core primitives. Legends, option-label content, shared help/error copy, choice-card presentation, and field layout remain composition outside this primitive.

## Slice 5: `core.switch`

`core.switch` is a binary-setting semantic class with a canonical NeoSmartUI Web adapter and live public proof. It remains intentionally distinct from checkbox and radio: one control owns one immediate off/on setting, has no indeterminate state, and does not participate in a mutually-exclusive group.

The canonical Web adapter uses a native checkbox base with `role="switch"`, preserves browser form participation and Space-key activation, prevents indeterminate presentation, and mirrors only the authoritative checked state to agent-readable `off`/`on` metadata.

The family interaction law combines ordinary contact compression with persistent toggle travel. Thumb position and state color resolve together; off maps to logical inline-start and on maps to logical inline-end, allowing RTL mirroring without reversing semantic meaning. The effective target remains at least 44px even when the visible track is smaller.

Its current public proof is bound to the same exact-SHA GitHub Pages deployment cohort as the other public Core primitives. Setting labels, descriptions, async-save status, confirmation copy, and business consequences remain higher-level composition.

## Slice 6: `core.tabs`

`core.tabs` is a composite peer-panel navigation primitive with a canonical NeoSmartUI Web adapter and live public proof. It owns the tablist/tab/tabpanel relationship, one-selected-panel state, roving focus model, orientation-aware keyboard navigation, activation mode, and tactile trigger behavior without importing routing or business-domain semantics.

The adapter supports both explicit activation modes. Automatic horizontal Tabs move focus and selection together, while manual vertical Tabs allow Arrow/Home/End focus movement without changing selection until Space/Enter. Disabled tabs are skipped, only one enabled tab participates in the page Tab order, and every controlled panel remains linked through `aria-controls`/`aria-labelledby`.

Horizontal navigation follows logical inline direction so next/previous reverses the physical Left/Right mapping under RTL; vertical sets use Down/Up. Home/End target the first/last enabled tab. Normal Tab leaves the composite rather than cycling through peer tabs.

The family interaction law is distinct from ordinary buttons: unselected tab triggers compress toward the surface on contact, while the persistent selected tab remains seated/locked at active depth instead of rising above peers. Selected state remains legible after press feedback ends, and focus-visible stays independently visible.

Rivet Light resolution includes `core.tabs` and adds only the three semantic roles that were previously absent from the exact dependency union: `color.surface.panel`, `font.size.label`, and `font.weight.emphasis`. Their values reuse visual decisions already present in the Foundry rather than introducing new arbitrary Theme choices.

Pinned family and Soft evidence support the semantic/keyboard contract. The pinned Soft React package remains reference-only knowledge; no source code is copied. The reviewed pinned Rivet `components/ui/` tree contains no `tabs.tsx`, so no Rivet Tabs implementation provenance is claimed.

Its current public proof is refreshed onto the same exact merged-main Chromium artifact and native GitHub Pages deployment cohort as every public Core primitive. The current singleton cohort binds source `57dc766ece8eca13b8c60b6f14615692ecdb51e8`, merged-main Quality run `34699170996`, browser artifact `10300390087`, deployment tree `b0f9ec75170566945b8bf00af9a5c8b1b3136555`, and Pages run `34700103133`; live verification still requires the canonical automatic/manual Tabs markers.

## Slice 7: `core.textarea`

`core.textarea` is generic multiline text entry with a canonical NeoSmartUI Web adapter and live public proof. It owns the native textarea editing surface and its empty/filled, invalid, read-only, disabled, hover, and focus-visible states without importing field-layout, formatting, auto-save, or business-domain semantics.

Textarea remains intentionally separate from `core.input`: line breaks, multiline selection, scrolling, native resize affordances, and larger editing geometry materially change platform behavior. The adapter therefore preserves a real native `<textarea>`, leaves author-supplied native attributes authoritative, and mirrors only empty/filled state into agent-readable metadata rather than recreating editing in JavaScript.

The interaction class remains the same as input: interactive, not pressable. Hover, focus, pointer contact, selection, scrolling, and resizing never borrow press-depth tokens or translate the editing surface toward or away from the page. The canonical CSS keeps structural shadow absent, preserves focus/invalid/read-only/disabled cues, does not disable native resize, and retains reduced-motion and forced-colors resilience.

Rivet Light resolution includes `core.textarea` in scope. Because every textarea dependency was already resolved for existing Core components, the exact resolved-token dependency union and every Theme token value remain unchanged; this implementation adds zero new Theme values.

Pinned family conformance supplies generic focus/keyboard/touch/reduced-motion/fluid-sizing laws, while pinned Soft evidence explicitly lists textarea among reusable Core primitives. The reviewed pinned Rivet snapshot has no `components/ui/textarea.tsx`, so no Rivet textarea implementation provenance is claimed.

Its current public proof shares the singleton cohort at source `57dc766ece8eca13b8c60b6f14615692ecdb51e8`, merged-main Quality run `34699170996`, browser artifact `10300390087`, deployment tree `b0f9ec75170566945b8bf00af9a5c8b1b3136555`, and native Pages run `34700103133`. Live verification requires the page to expose the canonical multiline textarea, non-pressable, and resize markers while structural validation preserves its own implementation blob binding.

## Slice 8: `core.select`

`core.select` is the generic native single-choice picker with a canonical NeoSmartUI Web adapter and live public proof. Its semantic boundary remains intentionally narrower than custom selection widgets: the implementation preserves a real single-select `<select>`, while multi-select/listbox, combobox/autocomplete/search, async option loading, cascading selection, labels/help/error copy, and form layout remain separate capabilities or composition.

The native selected option/value is authoritative. The adapter mirrors only `selected` state plus current value/index into agent-readable metadata, rejects `multiple` and multi-row/listbox-style selects, and leaves `<option>`, `<optgroup>`, form participation, required/disabled behavior, browser type-ahead, arrow-key navigation, and the browser/OS picker platform-owned. It does not invent a portable `open` state or a fake native placeholder semantic.

The collapsed select follows the permanent pressure-not-levitation law: rest retains structural depth, hover/contact compresses toward the surface, active/pointer contact reaches the existing active depth, and release restores depth. The platform-owned picker itself is not reimplemented as a NeoSmartUI popup merely to obtain custom motion or state hooks.

Rivet Light resolution includes `core.select` in scope. Every select dependency was already present in the exact Core dependency union, so this implementation adds zero new Theme token values; only resolution scope expands.

Foundry renders the native single-select and binds the canonical adapter. Merged-main browser proof verifies native option semantics and metadata synchronization, exact 0→2→5px pressure geometry, focus/invalid/disabled states, RTL behavior, reduced motion, forced colors, and rejection of non-single-select shapes without replacing the browser picker.

Pinned family conformance supplies the generic pressure, focus, keyboard, touch, reduced-motion, sizing, and agent-readable laws. Pinned Soft explicitly lists `select` beside input and textarea among reusable Core primitives. The reviewed pinned Rivet snapshot has no `components/ui/select.tsx`, so no Rivet Select implementation provenance is claimed.

Its public proof is bound to merged-main Quality run `34699170996`, browser artifact `10300390087`, deployment commit `f5caac25c16aa012222edeeb3b0e85c6b1bfbd11`, deployment tree `b0f9ec75170566945b8bf00af9a5c8b1b3136555`, and native Pages run `34700103133`. Live verification requires `https://neosmartui.github.io/deployment.json` to report source `57dc766ece8eca13b8c60b6f14615692ecdb51e8` and the page to expose the canonical native single-select and browser/OS picker-boundary markers. All seventeen public-proof components share this singleton cohort while retaining their own implementation blob bindings.

## Slice 9: `core.card`

`core.card` is a public-proof informational grouping surface with a deliberately CSS-only Web implementation. It is not a generic clickable container: the Card itself has no built-in button/link role, tab stop, selection state, activation behavior, JavaScript binder, or synthetic state synchronization, and nested controls keep their own semantics and focus order.

Pinned family conformance provides the decisive interaction rule: only cards with a real action or navigation role may react to hover/press; informational cards remain stable. NeoSmartUI therefore keeps the primitive at a single `rest` state. The canonical CSS has no hover/active/focus interaction selectors, sets `transform: none` and `transition: none`, and holds resting structural depth constant through pointer proximity and contact.

Soft explicitly lists Card among reusable Core primitives and records default/flat/muted/accent/interactive presentation knowledge. NeoSmartUI keeps visual variants separate from semantic activation so an `interactive` look cannot silently manufacture keyboard or pointer semantics.

Pinned Rivet contains `components/ui/card.tsx`, which provides useful anatomy knowledge for Card/header/title/description/action/content/footer. That repository snapshot declares no license metadata, so it remains reference-only and no source code is copied.

Card preserves a permanent token-model distinction: a grouped content surface is not a control. It uses `space.surface.inline`, `space.surface.block`, `border.surface.width`, and `radius.surface` rather than control padding/border/radius roles. Rivet Light resolves the exact implemented dependency union with 1rem logical surface padding, a 3px surface border, a 6px surface radius, and `font.weight.strong` at 800 while leaving every previously resolved token value unchanged.

Foundry renders the Card as a semantic `<article>` chosen by the demo's document meaning, not by the primitive itself. The demo contains no whole-card interactive role or tab stop. Dedicated Chromium QA verifies token-backed geometry, stable hover/contact depth, RTL and long-content wrapping, zero-motion reduced-motion behavior, and a visible forced-colors boundary without making the Card focusable.

Its public proof is bound to the same singleton cohort as the other sixteen public Core primitives: merged source `57dc766ece8eca13b8c60b6f14615692ecdb51e8`, Quality run `34699170996`, browser artifact `10300390087`, deployment commit `f5caac25c16aa012222edeeb3b0e85c6b1bfbd11`, deployment tree `b0f9ec75170566945b8bf00af9a5c8b1b3136555`, and Pages run `34700103133`. Structural proof validation recomputes the Card CSS blob, and live verification requires the deployed Card markers without adding any whole-card interaction semantics.

## Slice 10: `core.badge`

`core.badge` is now a public-proof compact informational metadata/status primitive with a deliberately CSS-only Web implementation. The default host remains a passive `span`: no link/button role, tab stop, pointer/keyboard activation, selection model, disabled state, JavaScript binder, or default live region is added merely because the annotation is visually prominent.

Badge explicitly does not default to ARIA `role="status"`. That role creates a live region and is appropriate only when composition has a meaningful dynamic update to announce. Foundry therefore renders ordinary static tone examples as plain text spans.

The semantic tone model remains `neutral`, `info`, `success`, `warning`, and `error`. Tone is presentation classification rather than interaction state, and every Foundry example carries visible status text so color is not the sole meaning channel.

Badge preserves the permanent geometry distinction introduced by its contract: compact annotations are neither controls nor Cards. Rivet Light now resolves `space.annotation.inline` to `0.55rem`, `space.annotation.block` to `0.15rem`, `border.annotation.width` to `2px`, and `radius.annotation` to `999px`. Pinned Soft provides the exact info (`#c9b7ff`), success (`#9be3bd`), and warning (`#f4dc78`) light palette values. The existing NeoSmartUI error role remains `#c1121f` so earlier components are not restyled, and inverse foreground resolves to `#ffffff` for that darker error surface.

The canonical CSS contains no hover/active/focus selectors, no structural shadow, `transform: none`, and `transition: none`. Long localized text may wrap rather than being silently truncated, logical inline/block geometry supports RTL, and forced-colors replaces custom tones with system Canvas/CanvasText while preserving the annotation border.

Pinned Soft explicitly lists `Badge/status` and supplies exact compact Badge/palette knowledge in its pinned CSS. Pinned Rivet uses a neutral `span` by default, pill geometry, white destructive text, and scopes hover behavior to an actual anchor host. Rivet declares no license metadata, so it remains reference-only and NeoSmartUI copies no source implementation.

Foundry exposes five visible tone examples. Dedicated Chromium QA verifies passive span semantics, exact token-backed geometry and palette resolution, stable hover/pointer contact, RTL plus long localization wrapping, reduced-motion immobility, and forced-colors readability without focusability. Its public proof is bound to merged source `57dc766ece8eca13b8c60b6f14615692ecdb51e8`, Quality run `34699170996`, browser artifact `10300390087`, deployment commit `f5caac25c16aa012222edeeb3b0e85c6b1bfbd11`, deployment tree `b0f9ec75170566945b8bf00af9a5c8b1b3136555`, and Pages run `34700103133`; structural proof validation recomputes the Badge CSS blob and live verification requires all five visible tone markers without adding interaction semantics.

## Slice 11: `core.alert`

`core.alert` is now a public-proof CSS-only prominent inline message/callout primitive. It remains a static message surface by default, not a button, link, popup, toast controller, notification queue, or live region.

The core semantic correction remains explicit in implementation: a visual Alert does not automatically receive `role="alert"`. `role="alert"` represents an assertive announcement contract for important time-sensitive content that is dynamically introduced or changed, so announcement urgency remains composition-owned rather than inferred from red styling or an Alert component name. `role="status"`, `aria-live`, and other live-region choices are likewise opt-in composition semantics.

The implemented tone model is `neutral`, `info`, `success`, `warning`, and `error`. Tone is message presentation, not interaction or lifecycle state, and color cannot be the sole carrier of meaning. Foundry therefore gives every example explicit tone/title text plus readable body copy.

Alert reuses the existing grouped-surface spacing, border, radius, resting-depth, typography, and semantic state-color roles. Rivet Light scope includes `core.alert`, but the exact dependency union requires zero new token contracts and zero new Theme values. Existing values remain unchanged: 1rem logical surface padding, a 3px surface border, 6px radius, 5px resting depth, strong weight 800, and the established info/success/warning/error colors.

The canonical Web implementation is `packages/adapters/web/components/alert.css`. It has no JavaScript binder, hover/active/focus selectors, press translation, focus ring, pointer cursor, or state synchronization. `transform: none` and `transition: none` keep the container physically stable through pointer proximity and direct contact while structural resting depth remains constant.

Foundry renders five neutral semantic `<div>` examples with no implicit `role`, `aria-live`, or tab stop. Dedicated browser QA verifies token-backed surface geometry and semantic tone borders, no-live-region behavior, stable hover/contact depth, RTL and long localized wrapping, reduced-motion immobility, and forced-colors readability without making the Alert focusable or interactive.

Dismissal, timers, stacking, insertion/removal motion, persistence, notification history, async announcement, and any nested retry/details/dismiss actions remain outside this primitive. Nested actions must be separately contracted real controls so their focus, keyboard behavior, target size, and pressure semantics remain explicit.

Pinned Soft explicitly classifies alerts as Core, provides stable icon/title/body and semantic-tone styling, and applies `role="alert"` only to its danger tone—useful evidence that visual treatment and announcement behavior are separable. Pinned Rivet provides Alert/title/description anatomy and default/destructive presentation, but its unconditional `role="alert"` is not adopted as a default because live announcement is a semantic decision rather than a visual variant. Both implementation sources remain reference-only; no legacy source code is copied.

Registry maturity is `public-proof`, with implementation evidence bound to `packages/adapters/web/components/alert.css` and canonical proof `evidence/public/core.alert.json`. Its singleton cohort binds source `57dc766ece8eca13b8c60b6f14615692ecdb51e8`, merged-main Quality run `34699170996`, browser artifact `10300390087`, deployment commit `f5caac25c16aa012222edeeb3b0e85c6b1bfbd11`, deployment tree `b0f9ec75170566945b8bf00af9a5c8b1b3136555`, and Pages run `34700103133`; live verification requires all five Alert tone markers plus the explicit no-implicit-live-region copy.

## Slice 12: `core.field`

`core.field` is now public-proof as the generic composition around one primary form control. It closes the label/help/error boundary deliberately left outside `core.input`, `core.textarea`, and `core.select`: those primitives continue to own native editing, selection, activation, focus, value, invalid, disabled, and read-only behavior, while Field owns the readable and programmatic relationships around one control.

The visible label is validly associated with the primary control; placeholder text, help copy, headings, or visual proximity do not substitute for that relationship. Supporting description/help and validation text remain explicitly associated through `aria-describedby`, `aria-errormessage`, or another valid platform mechanism when their meaning applies. Existing author-supplied description relationships remain authoritative rather than being overwritten by a Field binder.

A simple one-control Field does not manufacture `role="group"`, and static validation text does not automatically receive `role="alert"`. The canonical implementation needs no JavaScript: native label behavior focuses the actual control, `aria-invalid` remains on that control, and CSS `:has()` reflects invalid/disabled state without creating a second state authority.

Field itself remains stable and non-interactive. Its CSS has no hover/active/focus interaction selector, uses `transform: none` and `transition: none`, and leaves focus/press behavior to nested real controls. Long localized label/help/error text wraps with logical layout, and forced-colors uses system text while semantic invalidity remains machine-readable and explicitly written.

Rivet Light includes `core.field` and resolves exactly one newly required dependency: `space.field.gap`. The value is directly pinned to Soft's exact `--nbs-space-2` decision, `clamp(0.5rem, 0.44rem + 0.18vw, 0.6875rem)`. Every previously resolved Theme value remains unchanged, and Field still does not borrow control/surface/annotation geometry, target-size, focus, depth, press, or motion roles.

Foundry renders normal/help, invalid/error, and disabled examples. The normal label uses native `<label for>` focus behavior; invalidity remains on the real input with explicit help/error relationships and no live-region role; disabled state remains on the real input rather than the Field container. Dedicated Chromium QA covers those semantics, exact token-backed gap resolution, stable pointer contact, RTL/long localization, reduced motion, and forced colors.

Pinned Soft explicitly classifies `label/help/invalid field` as Core and supplies Field anatomy, invalid presentation, and exact fluid gap knowledge. Pinned Rivet provides Field/Label/Description/Error and fieldset/legend anatomy, but NeoSmartUI does not inherit its generic `role="group"` or unconditional FieldError `role="alert"` defaults. Both sources remain reference-only; no legacy source code is copied.

Registry maturity is `public-proof`. Canonical implementation evidence remains `packages/adapters/web/components/field.css` with canonical proof `evidence/public/core.field.json`. Its singleton cohort binds source `57dc766ece8eca13b8c60b6f14615692ecdb51e8`, merged-main Quality run `34699170996`, browser artifact `10300390087`, deployment commit `f5caac25c16aa012222edeeb3b0e85c6b1bfbd11`, deployment tree `b0f9ec75170566945b8bf00af9a5c8b1b3136555`, and Pages run `34700103133`; live verification requires the deployed Field label/help/invalid/disabled markers while structural validation recomputes the Field CSS blob.

## Slice 13: `core.breadcrumb`

`core.breadcrumb` is now public-proof as a generic hierarchical navigation trail with a deliberately CSS-only Web adapter. A labeled navigation landmark contains an ordered location hierarchy, ancestor locations remain genuine links, and exactly one current location is represented as non-interactive text with `aria-current="page"`.

Breadcrumb does not own routing, history mutation, prefetching, page loading, authorization, or application-shell placement. The Foundry preserves real anchor semantics for navigable ancestors rather than replacing them with buttons, click-handler spans, `role="link"` shims, or router-only pseudo-links. The current page is not a disabled link, so NeoSmartUI deliberately rejects legacy `role="link" aria-disabled="true"` current-page treatment.

Separators and the passive ellipsis are presentation-only through `aria-hidden="true"`. If an overflow indicator later opens hidden ancestors, that trigger/menu interaction remains a separate capability rather than implicit Breadcrumb behavior.

Ancestor links stay native inline navigation rather than tactile button surfaces. The canonical CSS uses no structural depth, control padding, box-shadow compression, press translation, or motion. Hover may strengthen color and underline the real anchor, focus uses the existing focus-ring roles, and `box-shadow: none`, `transform: none`, and `transition: none` keep pointer proximity/contact physically stable. Keyboard behavior remains native: Tab/Shift+Tab reaches real links, Enter follows the focused anchor, and no Arrow-key roving-focus model or Space remap is introduced.

Rivet Light resolves exactly the two roles introduced by the contract: `space.navigation.gap` is `0.45rem`, matching pinned Soft breadcrumb spacing, and `font.size.navigation` is `clamp(0.72rem, 0.69rem + 0.08vw, 0.78rem)`, matching pinned Soft text-xs typography. Every previously resolved Theme value remains unchanged. Adding Breadcrumb to Theme scope expanded the exact dependency union from 53 to 55; proof promotion changes no Theme value or scope.

The canonical Web implementation is `packages/adapters/web/components/breadcrumb.css`; no `breadcrumb.mjs` exists because anchors and `aria-current` already provide the required platform semantics. Logical wrapping supports RTL and long localized paths, while forced colors map link/current/focus presentation to system colors without changing the semantic hierarchy.

Foundry renders two real ancestor anchors, presentation-only separators and ellipsis, and a non-focusable current-page span. Five additive Chromium cases verify semantic anatomy and exact tokens, native Tab/Enter behavior without roving focus, physical stability through hover/contact, RTL plus long localization, reduced-motion immobility, and forced-colors readability/focus. Existing 65 browser cases remain unchanged, for 70 total.

Pinned Soft explicitly lists Breadcrumb under reusable Navigation + discovery capability, demonstrates ancestor anchors plus one `aria-current="page"` item, and supplies the exact `.45rem` breadcrumb gap plus fluid text-xs value. Pinned Rivet independently provides nav/ordered-list/item/link/current/separator/ellipsis anatomy. Both implementations remain reference-only; no source code is copied, and Rivet's disabled-link current-page pattern remains intentionally rejected.

Registry maturity is `public-proof`, with canonical implementation evidence `packages/adapters/web/components/breadcrumb.css` and canonical proof `evidence/public/core.breadcrumb.json`. Its singleton cohort binds source `57dc766ece8eca13b8c60b6f14615692ecdb51e8`, merged-main Quality run `34699170996`, browser artifact `10300390087`, deployment commit `f5caac25c16aa012222edeeb3b0e85c6b1bfbd11`, deployment tree `b0f9ec75170566945b8bf00af9a5c8b1b3136555`, and Pages run `34700103133`; structural proof validation recomputes the Breadcrumb CSS blob and live verification requires the native-link hierarchy markers.

## Slice 14: `core.pagination`

`core.pagination` is now public-proof as generic navigation across discrete pages in one ordered collection. Real destinations remain real anchors, exactly one page is identified as current with `aria-current="page"`, and routing, URL serialization, fetching, total-count discovery, page-size policy, virtual scrolling, and infinite-scroll behavior remain outside Core Pagination.

Pagination is deliberately not Tabs. It does not own a tablist/tabpanel relationship or Arrow-key roving focus; reachable destinations participate in ordinary document navigation and retain native anchor behavior. The current page is non-interactive by default instead of a redundant self-link, while unavailable previous/next boundaries do not remain apparently active links whose only disabling mechanism is `aria-disabled="true"`.

Unlike Breadcrumb's inline ancestor links, reachable Pagination items are compact standalone navigation controls. The canonical CSS therefore follows the permanent pressure-not-levitation law: rest has structural 5px depth, hover compresses by the existing 2px press vector, direct contact reaches the existing 5px active compression, and release restores depth. Current, unavailable, and passive ellipsis items keep `transform: none` and `transition: none` and do not manufacture tactile activation. Every reachable standalone target resolves the existing `size.control.minimum` 44px target.

Pagination introduces no new token contracts or Theme values. Rivet Light scope includes `core.pagination`, but every declared dependency was already resolved by the existing public Core cohort, so the token-contract count remains 63 and the exact implemented/public dependency union remains 55. Proof promotion changes no Theme value or scope. The implementation deliberately reuses `space.navigation.gap` and `font.size.navigation` with existing control geometry, depth/press, focus, surface/action, disabled-opacity, and emphasis roles rather than inventing pagination-specific tokens.

The canonical Web implementation is `packages/adapters/web/components/pagination.css` and is intentionally CSS-only; no `pagination.mjs` exists. Native anchors retain destination, modifier-key, context-menu, copy-link, visited-history, focus, and Enter activation behavior without JavaScript interception. Forced colors preserves visible reachable-item boundaries and focus while using a double current-page boundary as a non-color distinction; reduced motion collapses release timing without removing state feedback.

Foundry renders a labelled Pagination region with a non-operable previous boundary, real page links, one non-focusable current page, a passive assistive-technology-hidden ellipsis, and a real Next destination. Five additive Chromium cases verify semantic anatomy and exact 44px targets, native Tab/Enter behavior without roving focus, exact pressure compression only on reachable links, RTL and long-label wrapping, and reduced-motion/forced-colors behavior. The existing 70 cases remain unchanged, for 75 total.

Pinned Soft explicitly lists Pagination under reusable Navigation + discovery capability. Its component explorer provides previous/current/page/next anatomy in a labelled region, while `src/components/navigation.css` provides wrapped compact-item layout, 2px resting depth, inward hover/active compression, current treatment, and disabled presentation. NeoSmartUI preserves that physical knowledge while correcting the default semantic host to real destinations and retaining the existing 44px minimum target. The pinned Rivet tree was inspected and contains no `components/ui/pagination.tsx`, so no Rivet Pagination implementation provenance is claimed.

Registry maturity is `public-proof`, with canonical implementation evidence `packages/adapters/web/components/pagination.css` and canonical proof `evidence/public/core.pagination.json`. Its singleton cohort binds merged source `57dc766ece8eca13b8c60b6f14615692ecdb51e8`, merged-main Quality run `34699170996`, browser artifact `10300390087`, deployment commit `f5caac25c16aa012222edeeb3b0e85c6b1bfbd11`, deployment tree `b0f9ec75170566945b8bf00af9a5c8b1b3136555`, and Pages run `34700103133`; structural proof validation recomputes the Pagination CSS blob and live verification requires the deployed native Pagination markers. All seventeen public-proof components share this singleton deployment/browser cohort while retaining their own implementation blob bindings.

## Slice 15: `core.segmented-control`

`core.segmented-control` is now public-proof as a compact single-selection mode/view control. It is a visually connected set of real peer buttons where exactly one persistent mode is active through `aria-pressed="true"`; it is not a submitted form-value choice and not a tab-panel composite.

The semantic boundary remains explicit. Use `core.radio` for a mutually-exclusive value that belongs to form data or native radio choice semantics. Use `core.tabs` when selection owns a `tablist`/`tab`/`tabpanel` relationship, roving focus, or Arrow/Home/End composite navigation. Segmented Control instead uses a labelled `role="group"` around real `<button type="button">` peers. Each enabled segment stays in ordinary document Tab order, Space/Enter retain native button activation, and the adapter installs no keydown handler at all.

The state model remains exactly `rest`, `hover`, `focus-visible`, `pressed`, `selected`, and `disabled`. The canonical binder validates strict boolean `aria-pressed` values and exactly one selected peer, transfers selection only after native click, preserves an already-selected segment when reactivated, and mirrors agent-readable state without manufacturing radio or Tabs semantics. Native disabled buttons remain inert; a selected mode can remain understandable if composition later disables it.

Each enabled unselected segment follows the existing 0→2→5px pressure-not-levitation model. The selected segment stays persistently seated after release, uses the established primary action surface/content roles, and adds a double-border distinction so selection is not conveyed only by color. The group frame itself is layout, not a pressable surface. Every segment resolves the existing `size.control.minimum` 44px target.

Rivet Light resolution now includes `core.segmented-control`, but the implementation introduces no new token contract or Theme value. All dependencies were already present in the implemented/public dependency union, so the token-contract count remains 63 and the exact dependency union remains 55. The resolved bundle changes scope only.

The canonical Web runtime is `packages/adapters/web/components/segmented-control.css` plus `packages/adapters/web/components/segmented-control.mjs`. Narrow layouts move to an equal-width grid while preserving DOM order, long labels wrap instead of causing page-level overflow, RTL keeps named peer order semantic, reduced motion collapses release timing without removing state feedback, and forced colors preserves focus, native disabled meaning, and the non-color double-border selection distinction.

Foundry renders four real peer buttons: one initially selected, two enabled alternatives, and one native-disabled peer. Five additive Chromium cases verify semantic anatomy and one-selection transfer, native Tab/Space/Enter behavior without Arrow/Home/End roving focus, exact tactile geometry plus persistent selected treatment, RTL/long-label responsive resilience, and reduced-motion/forced-colors behavior. The existing 75 cases remain unchanged, for 80 total.

Pinned evidence remains the same five-artifact authority established by the contract: family tactile/selected-state law plus Soft capability, semantic anatomy, visual CSS, and single-selection behavior. All are knowledge/reference evidence; no source code is copied. The pinned Rivet `button-group.tsx` remains generic grouping evidence only and is not misrepresented as a Segmented Control implementation.

Registry maturity is `public-proof`, with canonical implementation evidence `packages/adapters/web/components/segmented-control.mjs` and canonical proof `evidence/public/core.segmented-control.json`. Its singleton cohort binds merged source `57dc766ece8eca13b8c60b6f14615692ecdb51e8`, merged-main Quality run `34699170996`, browser artifact `10300390087`, deployment commit `f5caac25c16aa012222edeeb3b0e85c6b1bfbd11`, deployment tree `b0f9ec75170566945b8bf00af9a5c8b1b3136555`, and Pages run `34700103133`; structural proof validation recomputes both Segmented Control implementation blobs and live verification requires the deployed Segmented Control marker contract. All seventeen public-proof components share this singleton deployment/browser cohort while retaining their own implementation blob bindings.

## Slice 16: `core.tooltip`

`core.tooltip` is now public-proof as a concise supplemental-description primitive with a canonical Web CSS/MJS pair. The described target keeps its own semantics and focusability while the separate `role="tooltip"` surface is linked through `aria-describedby`; Tooltip remains supplemental, non-interactive, and outside the Tab order.

The state model remains exactly `closed`, `open`, and `dismissed`. The canonical adapter mirrors that authority through `data-state` on the tooltip and `data-tooltip-state` on the target. Pointer hover or keyboard focus opens the same description, pointer transfer between target and tooltip remains available through a short transfer grace period, and ordinary blur/leave closes only after neither surface remains active.

Escape dismisses the open Tooltip without moving focus, activating the target, preventing default key behavior, or stopping propagation. Dismissal remains authoritative for the current uninterrupted hover/focus session and resets only after that session ends. The adapter never traps focus, remaps Tab/Enter/Space/Arrow/Home/End, adds a target role or tab stop, or manufactures click/touch/long-press/context-menu behavior.

The semantic boundary remains strict: Tooltip content contains no buttons, links, form fields, menus, dismiss controls, or other focusable descendants. Richer or persistent interactive disclosure remains a Popover/Dialog-class capability. Essential names, validation, safety warnings, and task instructions remain persistent content rather than Tooltip-only information.

The family interaction law is preserved in implementation. Tooltip CSS never targets the described element and never translates, lifts, compresses, scales, or changes its structural depth. The Tooltip surface itself uses `transform: none`; visibility changes through opacity only using the existing `motion.standard.duration`, with reduced motion collapsing that duration to zero.

The surface reuses existing panel/content/border roles, annotation spacing/border/radius, resting depth, and body typography. Rivet Light scope includes `core.tooltip`, but every dependency was already present in the implemented/public union: semantic token contracts remain 63, the exact dependency union remains 55, and every concrete Theme value remains unchanged.

Foundry renders a native anchor target whose existing navigation semantics remain intact, references a distinct non-focusable `role="tooltip"` surface, and provides a following native link so keyboard flow can prove that the Tooltip never becomes a focus stop. Long localized content wraps in a bounded logical-positioned surface; RTL changes visual flow without changing the description relationship; forced colors use system Canvas/CanvasText while preserving a visible boundary.

Five additive Chromium cases cover real target/description anatomy and token-backed informational geometry, Escape dismissal plus ordinary Tab flow, pointer target→tooltip persistence, target immobility with RTL/long-copy overflow resilience, and reduced-motion/forced-colors behavior. The previous 80 browser cases remain unchanged, for 85 total.

Pinned migration authority remains the four evidence records selected by the contract: family Tooltip movement law plus Soft capability, ARIA anatomy, and visual reference. These remain knowledge/reference inputs only; no legacy source code is copied. The pinned Rivet tree still contains no `components/ui/tooltip.tsx`, so no Rivet Tooltip implementation provenance is claimed.

Registry maturity is `public-proof`, with canonical implementation evidence `packages/adapters/web/components/tooltip.mjs` and canonical proof `evidence/public/core.tooltip.json`. Its singleton cohort binds merged source `57dc766ece8eca13b8c60b6f14615692ecdb51e8`, merged-main Quality run `34699170996`, browser artifact `10300390087`, deployment commit `f5caac25c16aa012222edeeb3b0e85c6b1bfbd11`, deployment tree `b0f9ec75170566945b8bf00af9a5c8b1b3136555`, and Pages run `34700103133`; structural proof validation recomputes both Tooltip implementation blobs and live verification requires the deployed Tooltip marker contract. All seventeen public-proof components share this singleton deployment/browser cohort while retaining their own implementation blob bindings.

## Slice 17: `core.combobox`

`core.combobox` is now public-proof as NeoSmartUI's first editable suggestion-list single-selection composite. It remains deliberately distinct from `core.select`: Select preserves a browser-owned picker and no portable open state, while Combobox owns editable query text, an explicitly related suggestion popup, transient active-option navigation, and one committed selected value.

The initial scope remains single-selection only. Query text and committed selection are different authorities; typing or moving highlight cannot silently claim a new selected value. Multi-select, chips/tags, freeform value creation, async request policy, virtualization, remote pagination, ranking, and business-specific filtering remain outside this slice.

The canonical Web runtime is `packages/adapters/web/components/combobox.css` plus `packages/adapters/web/components/combobox.mjs`. It requires a real `<input role="combobox">`, an owned `role="listbox"`, stable `role="option"` IDs, explicit boolean `aria-selected`, and at most one committed selected option. DOM focus remains on the editable input while `aria-activedescendant` identifies the active suggestion.

ArrowDown and ArrowUp move the active enabled visible suggestion, disabled options are skipped, Enter commits the active option, and Escape closes the popup without erasing the committed value. Tab/Shift+Tab retain ordinary document traversal. Home/End, Left/Right, printable text, clipboard operations, selection, and IME remain native text-editing behavior because the adapter installs no mappings for them.

Combobox remains non-modal. Its popup does not trap focus, inert surrounding content, or masquerade as a Dialog/Command Menu/generic Popover. Typing filters the supplied local suggestions and clears stale committed-selection metadata when the edited query no longer exactly represents the committed option. An empty-result message remains non-interactive rather than becoming a fake option.

The physical model separates editing from activation. `.ns-combobox-input` stays at `transform: none` through hover, focus, and direct editing contact. Only the optional real `<button type="button">` disclosure trigger follows the established 0→2→5px pressure-not-levitation model. The trigger mirrors expanded state for assistive technology; closing through it keeps the button focused so the input focus handler cannot immediately reopen the popup. The popup itself uses generic panel/surface spacing, border, radius, resting depth, and opacity-only standard motion.

Rivet Light scope now includes `core.combobox`, but the implementation introduces no new semantic token contract and changes no concrete Theme value. All editable-control, popup-surface, focus, selected-option, invalid, disabled, pressure, and motion dependencies already exist among the 63 Core token contracts, so the exact implemented/public dependency union remains 55.

Foundry renders the canonical labelled Combobox with four supplied suggestions, one disabled option, a separate disclosure trigger, and a non-option empty-result message. Five additive Chromium cases verify semantic/listbox/token geometry, input-focused active-descendant keyboard navigation with disabled-option skipping, query-versus-selection separation, immobile editing geometry plus trigger pressure/close stability, and RTL/long-content/reduced-motion/forced-colors resilience. The previous 85 browser cases remain unchanged, for 90 total.

Pinned migration authority remains intentionally narrow and honest: family conformance provides generic composite/accessibility laws plus the Menus/Popovers trigger-compression rule; pinned Soft explicitly lists `Combobox surfaces` while also identifying keyboard-complete production Combobox behavior as unfinished; pinned Rivet provides reference-only `components/ui/combobox.tsx` anatomy. NeoSmartUI does not claim a completed Soft runtime or copy Rivet source code, and narrows Rivet's optional chips/multi-select knowledge out of this first implementation.

Registry maturity is `public-proof`, with canonical implementation evidence `packages/adapters/web/components/combobox.mjs`, paired CSS at `packages/adapters/web/components/combobox.css`, and canonical proof `evidence/public/core.combobox.json`. Its singleton cohort binds merged source `57dc766ece8eca13b8c60b6f14615692ecdb51e8`, merged-main Quality run `34699170996`, browser artifact `10300390087`, deployment commit `f5caac25c16aa012222edeeb3b0e85c6b1bfbd11`, deployment tree `b0f9ec75170566945b8bf00af9a5c8b1b3136555`, and native Pages run `34700103133`; structural proof validation recomputes both Combobox implementation blobs and live verification requires the deployed editable Combobox/listbox marker contract. All eighteen public-proof Core components share this singleton cohort while retaining their own implementation blob bindings.

## Slice 18: `core.accordion`

`core.accordion` is now implemented as a generic disclosure composite with canonical Web CSS/MJS. It owns repeated heading/trigger/panel relationships for revealing and collapsing related content without becoming Tabs, navigation, a menu, or a business-domain workflow.

Each item uses a real `<button type="button">` trigger with strict boolean `aria-expanded` and a stable `aria-controls` relationship to one owned panel whose `aria-labelledby` points back to the trigger. The root receives no synthetic widget role, and panel `role="region"` remains optional rather than automatic so long Accordions do not create landmark noise. Closed panels use the native `hidden` attribute, removing their descendants from normal rendering and focus traversal instead of leaving hidden interactive content operable.

The canonical adapter supports explicit `single` and `multiple` expansion policies. In single mode, opening one enabled trigger closes an open peer; in multiple mode, peers remain independently disclosed. Open/closed remains disclosure state rather than selection. The binder installs click handlers only, so Tab/Shift+Tab stay ordinary document traversal and native Space/Enter button activation creates the disclosure click. The runtime installs no `keydown` handler, no Arrow/Home/End mapping, no roving tabindex, and no tablist/tab/tabpanel roles.

The trigger follows the permanent pressure-not-levitation law with the existing 0→2→5px model: rest keeps 5px structural depth, hover/proximity compresses by the existing 2px vector, direct press reaches the existing 5px active compression, and release restores resting depth. Open state persists independently of transient pressure and therefore returns to resting depth rather than staying seated like a selected Tab. A decorative indicator rotates with `motion.standard.*` while remaining outside the focus order and accessible name.

The panel is a grouped content surface, not a pressable control. It reuses existing surface spacing, border, radius, panel/content colors, and body typography. Rivet Light scope now includes `core.accordion`, but no new semantic token contract or concrete Theme value is introduced: the token-contract count remains 63 and the exact implemented/public dependency union remains 55. Reduced motion collapses trigger/indicator timing to near-instant feedback, logical layout supports RTL and long localization, and forced colors preserves trigger/panel boundaries, focus, disabled meaning, and disclosure state.

The canonical Web runtime is `packages/adapters/web/components/accordion.css` plus `packages/adapters/web/components/accordion.mjs`. The adapter exports `syncAccordionItem`, `setAccordionItemOpen`, and `bindAccordion`, validates direct-owned real button triggers and their stable ARIA relationships, mirrors agent-readable trigger/panel state, and uses `hidden` as the closed-panel authority. It does not call `preventDefault()` or `stopPropagation()` to replace native keyboard behavior.

Foundry renders one single-expansion Accordion with one initially open item, a focusable descendant, and a native-disabled trigger, plus one multiple-expansion Accordion with independently openable peers. Five additive Chromium cases verify semantic anatomy and both policies, ordinary Tab/Space/Enter behavior with no Arrow/Home/End roving focus, exact 0→2→5px trigger pressure plus resting open state, RTL/long-localized narrow-layout containment, and reduced-motion/forced-colors behavior. The previous 90 browser cases remain unchanged, for 95 total.

Migration authority remains exactly the two Slice 18 records already selected by the contract, bringing the repository total to 60 selected artifacts: `legacy.spec.accordion-conformance` contributes shared explicit-state, pressure, focus, keyboard, touch, reduced-motion, semantic-token, and agent-readable laws without pretending the family spec contains a separate Accordion-specific law; `legacy.rivet.accordion-anatomy` contributes reference-only root/item/header-trigger/content/open/closed/disabled/focus/indicator anatomy from pinned `components/ui/accordion.tsx`. Pinned Soft still does not list or implement Accordion, so no Soft Accordion provenance is claimed and no legacy implementation source is copied.

Registry maturity is `public-proof`, with canonical implementation evidence `packages/adapters/web/components/accordion.mjs`, paired CSS at `packages/adapters/web/components/accordion.css`, and canonical proof `evidence/public/core.accordion.json`. Its singleton cohort binds merged source `57dc766ece8eca13b8c60b6f14615692ecdb51e8`, merged-main Quality run `34699170996`, browser artifact `10300390087`, deployment commit `f5caac25c16aa012222edeeb3b0e85c6b1bfbd11`, deployment tree `b0f9ec75170566945b8bf00af9a5c8b1b3136555`, and native Pages run `34700103133`; structural proof validation recomputes both Accordion implementation blobs and live verification requires the deployed Accordion disclosure marker contract. All eighteen public-proof Core components share this singleton cohort while retaining their own implementation blob bindings.
