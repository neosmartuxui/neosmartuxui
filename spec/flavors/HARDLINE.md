# Hardline Flavor Contract

Hardline is the flagship/default NeoSmartUXUI flavor. It owns visual and tactile expression, not component behavior or business semantics.

## Stable identity

- Flavor ID: `flavor.hardline`
- Flavor schema: `neosmartui/flavor@1`
- Implemented light Theme: `packages/themes/hardline-light/theme.json`
- Implemented dark Theme: `packages/themes/hardline-dark/theme.json`
- Resolved Light bundle: `packages/themes/hardline-light/tokens.json`
- Light Theme resolution: `packages/themes/hardline-light/resolution.json`
- Resolved Dark bundle: `packages/themes/hardline-dark/tokens.json`
- Dark Theme resolution: `packages/themes/hardline-dark/resolution.json`
- Interaction model: `pressure-not-levitation`
- Maturity: `public-proof`
- Hardline Light maturity: `public-proof`
- Hardline Dark maturity: `public-proof`

## Expression contract

Hardline defaults toward square or zero-radius geometry, hard boundaries, strong structural depth, high color reaction, sharp typography, seated persistent selection, and restrained decorative movement. Hover begins compression toward the resting plane; direct press completes compression. Hardline MUST NOT introduce hover lift.

Flavor-owned expression may configure palette defaults, typography, geometry, border weight, shadow direction/strength, density, spacing personality, motion intensity/release, icon treatment, surface treatment, and patterns.

Hardline MUST NOT own Button/Dialog/Product/Checkout/Billing behavior or any other Core/Vertical semantic behavior. Renderer overrides are exceptional and are not part of either concrete Hardline Theme.

## Hardline Light implementation

`Hardline Light` is publicly proven for the exact semantic dependency union consumed by the **49 public-proof Core components**. The deployed singleton resolves all 49 without changing the 55-token union. It does not add component-specific magic values or fork component renderers. Core adapters remain authoritative and receive Hardline expression through inherited semantic custom properties.

The pressure model follows the pinned family reference:

- rest depth: `4px × 4px`
- hover/proximity depth: `2px × 2px`
- pressed/seated depth: `0px × 0px`
- hover travel: `2px × 2px`
- pressed/seated travel: `4px × 4px`
- press/release/standard timing: `70ms / 110ms / 170ms`
- control, grouped-surface, and annotation radius: `0px`
- minimum interactive target: `44px`
- independent focus keyline: `3px` width with `3px` offset

The resolved bundle contains exactly the 55 semantic roles currently required by implemented/public-proof Core components. The full Core registry still defines 63 value-free contracts; unused contracts are not padded into this concrete bundle.

## Hardline Dark implementation

Dark mode follows as its own concrete Theme instance rather than hidden conditional values inside the light Theme. `Hardline Dark` is the second concrete Theme instance of `flavor.hardline`. It is authored as its own `neosmartui/theme@1` descriptor, resolution, and 55-token bundle and is not implemented as CSS inversion, filter-based dark mode, or hidden conditional values inside Hardline Light.

Hardline Dark resolves the exact shipping **49-Core / 55-token** semantic dependency boundary while preserving the complete Hardline structural and interaction model.

The following Hardline laws are invariant across Light and Dark:

- square/zero-radius default geometry;
- hard structural boundaries and strong structural depth;
- `4px → 2px → 0px` structural depth for rest → hover → active;
- `0px → 2px → 4px` inward travel;
- `70ms / 110ms / 170ms` pressure timings;
- `44px` minimum interactive target;
- independent `3px` focus keyline with `3px` offset;
- seated persistent selection;
- reduced-motion state acknowledgement without non-essential travel;
- forced-colors, keyboard, touch, pointer, RTL, localization, and narrow-layout conformance.

### Authored dark semantic palette

The Dark Theme is deliberately resolved rather than inverted:

- interactive surface: `#141414`;
- panel surface: `#1d1d1d`;
- primary content: `#f5f5f5`;
- secondary content: `#c9c9c9`;
- default / strong boundary: `#d8d8d8` / `#ffffff`;
- flagship primary action: `#ffd84d` with `#111111` content;
- focus keyline: `#8fb3ff`;
- success / warning / error / info: `#19793d` / `#826600` / `#ff737d` / `#6e3fff`.

The dedicated Theme validator requires at least `4.5:1` authored contrast for primary and secondary text, action content, and the state badge pairings used by shared Core adapters. Written labels remain authoritative for status meaning, so color is never the only state signal.

The existing `/flavors/hardline/` proof surface remains the canonical Flavor route. Its already-proven Light source file stays untouched: the proven Light source route remains byte-identical to the blob recorded in `evidence/public/flavor.hardline.json`. The Dark demo is authored separately in `apps/foundry/fragments/hardline-dark.html`.

The deterministic Foundry builder extends the deployed artifact for that same canonical route: it copies the proven Light source page, injects the generated `hardline-dark-theme.css` link, injects `apps/foundry/fragments/hardline-dark.html` before the route's existing return link, and writes only the artifact copy under `dist/foundry/flavors/hardline/index.html`. Light and Dark together therefore appear on the one canonical Hardline route without mutating the already-proven Light source blob. The deployed Light section remains `.ns-theme-hardline-light`; the injected Dark section is scoped by `.ns-theme-hardline-dark` and consumes the same `.ns-button`, `.ns-input`, `.ns-card`, and `.ns-badge` adapter classes. The build emits `hardline-theme.css` and `hardline-dark-theme.css` from the two independent resolved bundles.

Dedicated browser coverage verifies authored dark CSS, shared adapter identity, exact flagship pressure physics, stability of non-pressable editing/informational surfaces, explicit written state labels, reduced motion, forced colors, normal Tab order, RTL, and narrow localized containment.

Hardline Dark is `public-proof`. Promotion was gated on the exact merged-main Quality artifact from source `9135d2b00b34954f41c72f4b6c12289d10b476fc`, deployment of those exact bytes without rebuilding, and successful native GitHub Pages verification. Public-proof promotion does not redeploy Pages.

## Provenance

Hardline is a new NeoSmartUXUI flagship personality, not a copied legacy implementation. Its family-law evidence is pinned through the migration ledger to `NeoBrutalism-shop/spec@fbf499397f4e9a52d6e25c13921fd5377799c626`:

- `FLAVORS.md` supplies the Flavor/Core ownership boundary and cross-flavor semantic invariants.
- `TOKENS.md` supplies the semantic pressure, motion, focus, and token-separation reference model.
- `INTERACTION.md` supplies compress-never-float, coherent shadow/travel, reduced-motion, keyboard/touch, and static-surface laws.

The canonical NeoSmartUXUI PRD supplies the Hardline-specific flagship choices: zero-radius/square geometry, hard boundaries, strong structural depth, high reaction, seated selection, restrained decorative movement, and the v0.3 light/dark requirement. No legacy source code is copied.

## Public-proof evidence

Hardline Light and Hardline Dark are `public-proof` only for the exact merged-main source and singleton Pages cohort recorded in `evidence/public/flavor.hardline.json`.

The proof record retains the concrete Light Theme, Light resolution, Light resolved-token bundle, and the byte-identical Light source route. It additionally binds the concrete Dark Theme, Dark resolution, Dark resolved-token bundle, `apps/foundry/fragments/hardline-dark.html`, and `tooling/foundry/build.mjs`, so the verified public artifact can be traced from both Theme inputs through deterministic proof-safe route assembly.

The live gate verifies the canonical `/flavors/hardline/` route contains both `.ns-theme-hardline-light` and `.ns-theme-hardline-dark` surfaces, retains the existing Light pressure markers, exposes the authored Dark section, and serves both `hardline-theme.css` and `hardline-dark-theme.css` with their independent scoped token markers.

The current singleton proof cohort binds all **49 public-proof Core records plus the 5 Flavor records** to the same merged-main browser evidence and the same native Pages deployment. No exact-set maintenance remains active. Public-proof promotion does not redeploy Pages; it records and verifies the already-deployed singleton.

The accessibility-maintenance refresh is proven from merged source `fb2b401f67723f5274f1bd3699be97877fc88c86`, Quality run `35249742761`, browser artifact `10509631176` with Chromium `146/146`, exact Pages commit `4c576231efd8ff479f67e748001ff43914216a76`, Pages tree `c037e76d9b288a081ad11dda17d12c2b432d9d1d`, and native Pages run `35295432975`. The refresh changes only proof-declared accessibility implementation bytes and keeps the canonical Hardline route and shared adapter architecture intact.

Following `core.table` structural proof promotion, the singleton public-proof cohort resolves the exact shipping **46-Core / 55-token** semantic dependency boundary; the temporary Table exact-set maintenance records are retired and proof-only promotion does not redeploy Pages.

Following `core.data-grid` structural proof promotion, the singleton public-proof cohort resolves the exact shipping **47-Core / 55-token** semantic dependency boundary; the temporary DataGrid exact-set maintenance records are retired and proof-only promotion does not redeploy Pages.

Following `core.item` structural proof promotion, the singleton public-proof cohort resolves the exact shipping **48-Core / 55-token** semantic dependency boundary; the temporary Item exact-set maintenance records are retired and proof-only promotion does not redeploy Pages.

Following `core.list` structural proof promotion, the singleton public-proof cohort resolves the exact shipping **49-Core / 55-token** semantic dependency boundary; the temporary List exact-set maintenance records are retired and proof-only promotion does not redeploy Pages.

During the `core.description-list` implementation cohort, exact-set Flavor maintenance permits a maintained local **50-Core / 55-token** semantic dependency boundary while public proof remains bound to the deployed **49-Core / 55-token** List singleton until merged-main deployment, native/live verification, and proof-only promotion complete.
