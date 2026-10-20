# Soft Flavor Contract

Soft is the calm application-oriented NeoSmartUI flavor for long-session interfaces. It preserves visible structure, direct contrast, tactile depth, obvious affordance, and physical micro-interaction while reducing the visual aggression of the flagship Hardline expression.

## Stable identity

- Flavor ID: `flavor.soft`
- Flavor schema: `neosmartui/flavor@1`
- Implemented light Theme: `packages/themes/soft-light/theme.json`
- Implemented dark Theme: `packages/themes/soft-dark/theme.json`
- Interaction model: `pressure-not-levitation`
- Flavor maturity: `public-proof`
- Soft Light maturity: `public-proof`
- Soft Dark maturity: `public-proof`
- Soft Dark public-proof status: **public-proof**
- Public-proof record: `evidence/public/flavor.soft.json`

## Expression contract

Soft defaults toward moderate rounding, visible moderate boundaries, shallow hard structural depth, warm neutral application surfaces, softened blue accent intent, readable system-first typography, comfortable application density, seated persistent selection, and restrained motion. Hover begins compression toward the resting plane; direct press completes compression. Soft MUST NOT introduce generic hover lift.

Raised controls may express tactile hard-shadow depth. Recessed editing/data surfaces remain seated rather than pretending to be raised pressable controls. Informational surfaces remain stable. Motion is reserved for affordance, pressure, selection, progress, confirmation, and failure rather than decorative hover movement.

Flavor-owned expression may configure palette defaults, typography, geometry, border weight, shadow direction/strength, density, spacing personality, motion intensity/release, icon treatment, surface treatment, and patterns.

Soft MUST NOT own Button/Dialog/Product/Checkout/Billing behavior, SaaS workspace/billing semantics, or any other Core/Vertical behavior. The legacy source called itself a SaaS/application flavor, but NeoSmartUI extracts only its visual/physical personality; SaaS remains a Vertical under the Canonical PRD.

## Soft Light implementation

`Soft Light` is a concrete schema-valid `neosmartui/theme@1` implementation. Its resolution is explicit and machine-readable:

- `packages/themes/soft-light/tokens.json`
- `packages/themes/soft-light/resolution.json`
- exact scope: the current **49 public-proof Core components**
- exact resolved semantic dependency union: 55 token IDs
- generated CSS scope: `.ns-theme-soft-light`

The implementation resolves visible `2px` structural boundaries, `8px` control radius, `12px` surface radius, pill annotation geometry, a coherent `3px → 1.5px → 0px` structural depth model with matching `0px → 1.5px → 3px` inward travel, and restrained `70ms / 105ms / 165ms` press/release/standard timing. Controls retain a `44px` minimum target and an independent `3px` focus keyline with `3px` offset.

Soft Light uses independently resolved warm neutral surfaces and a softened-blue primary action while keeping written state meaning, semantic HTML, accessibility behavior, RTL behavior, reduced-motion behavior, forced-colors behavior, and Core interaction semantics in the shared adapters. The Foundry route `apps/foundry/src/flavors/soft/index.html` imports the same shipping Button/Input/Card/Badge adapter CSS used by other flavors; no Soft component implementation fork exists.

## Soft Dark implementation and public proof

`Soft Dark` is the second concrete Theme instance of `flavor.soft`. It is implemented as an authored semantic Dark Theme, not CSS inversion, filter-based dark mode, or hidden conditional values inside Soft Light.

Soft Dark resolves the same exact shipping **49-Core / 55-token** semantic dependency boundary through the same shared Core adapters. The temporary Menubar maintenance record is retired by structural proof promotion.

- `packages/themes/soft-dark/tokens.json`
- `packages/themes/soft-dark/resolution.json`
- exact scope: the same **49 public-proof Core components** as Soft Light
- exact resolved semantic dependency union: 55 token IDs
- generated CSS scope: `.ns-theme-soft-dark`
- proof-safe demo fragment: `apps/foundry/fragments/soft-dark.html`
- deterministic post-build assembler: `tooling/foundry/assemble-soft-dark.mjs`
- canonical route: `/flavors/soft/`

The non-color Soft laws remain identical across Light and Dark:

- visible `2px` control, surface, and annotation boundaries;
- moderate `8px` control radius, `12px` grouped-surface radius, and pill annotation geometry;
- `3px → 1.5px → 0px` structural depth for rest → hover → active;
- `0px → 1.5px → 3px` inward travel;
- `70ms / 105ms / 165ms` pressure timings;
- `44px` minimum interactive target;
- independent `3px` focus keyline with `3px` offset;
- comfortable application density;
- readable system-first typography;
- seated persistent selection;
- reduced-motion state acknowledgement without non-essential travel;
- forced-colors, keyboard, touch, pointer, RTL, localization, and narrow-layout conformance.

The authored Soft Dark semantic palette is NeoSmartUI-owned and independently contrast-validated:

- interactive surface `#1e1b19` and panel `#292522`;
- primary content `#f7f1e8` and secondary content `#c7bfb5`;
- default/strong boundaries `#b8afa5` / `#f3ebe2`;
- softened-blue primary action `#8fb8f4` with dark content `#171513`;
- success `#30744d`, warning `#806315`, error `#e88983`, and info `#734ecd` with explicit written labels;
- focus ring `#9ec4ff` independent of action color.

The dedicated validator requires at least 4.5:1 for text/content pairings and at least 3:1 for focus/boundary non-text contrast. Status meaning remains written and semantic; color is never the only carrier of meaning.

The proven Light source route remains byte-identical. `tooling/foundry/assemble-soft-dark.mjs` runs after the proven shared builder, generates `soft-dark-theme.css`, and deterministically assembles `apps/foundry/fragments/soft-dark.html` into the copied `/flavors/soft/` artifact after the proven Light source route is copied. No `flavor.soft-dark` identity, `/flavors/soft-dark/` route, renderer fork, or component fork exists.

Soft Dark is `public-proof`. The machine-readable record binds both Light and Dark implementation inputs, the deterministic Soft Dark assembler, the exact merged-main browser cohort, the exact no-rebuild Pages deployment, and both live Theme assets.

The initial verified Soft Dark public-proof cohort was:

- deployed implementation source `neosmartui/neosmartui@20b32bba63f5882b17193eaca093e315c214ccd6`;
- merged-main Quality run `34721447129`;
- merged-main browser artifact `10306147715`;
- Chromium `130/130` with zero skipped, unexpected, or flaky tests;
- merged-main artifact SHA-256 `298562ffbe59f46ac6cfcef95c23d033a4a8186a77bef89469a934d0e62955b3`;
- exact Pages commit `06c68201a1842cdea42fa5e4d24c68215e97ae51`;
- exact Pages tree `7ff00b76190cab5c9cdf1862db2cff4b0c7762d2`;
- native Pages run `34721869013`;
- native Pages artifact `10306322680` with all 43 deployable files byte-identical to the merged-main artifact plus only Jekyll-generated `assets/css/style.css`.

Public-proof promotion does not redeploy Pages.

## Contract history

The preceding lifecycle stage intentionally carried the marker `Soft Dark contract maturity: `contract-only`` and the rule “Concrete Dark palette values are intentionally deferred” until the contract merged green and mandatory merged-main Quality passed. Those contract-only statements are superseded by the implementation and public proof above; they are retained here solely as lifecycle history and validator evidence, not as current maturity.

The contract established that Soft Dark is the second concrete Theme instance of `flavor.soft`; its current public-proof singleton preserves the exact shipping 43-Core / 55-token semantic dependency boundary and must not mutate the existing `/flavors/soft/` proof source. Those boundaries remain authoritative.

## Public-proof cohort

Soft Light originally reached `public-proof` only after implementation merged and the exact merged-main artifact was independently verified and deployed without rebuilding. Its original proof lifecycle used:

- implementation source `neosmartui/neosmartui@5e999f2e62dc7727ebb74a9c79c5bd40513d6d0d`
- merged-main Quality run `34707268277`
- merged-main browser artifact `10301797631`
- Chromium `105/105`
- Pages commit `ff7723951ff1eba3a6890ce57f71eeb2646f524a`
- Pages tree `24f8086b988db5aaa97c6bba44c4f8f35dcf6c95`
- native Pages run `34707560564`

The singleton public-proof cohort has since advanced as later verified Flavor work deployed. `evidence/public/flavor.soft.json` is the machine-readable authority for Soft's current cohort and retains exact Light and Dark implementation blob bindings.

The current accessibility-maintenance refresh is proven from merged source `fb2b401f67723f5274f1bd3699be97877fc88c86`, Quality run `35249742761`, browser artifact `10509631176` with Chromium `146/146`, exact Pages commit `4c576231efd8ff479f67e748001ff43914216a76`, Pages tree `c037e76d9b288a081ad11dda17d12c2b432d9d1d`, and native Pages run `35295432975`. Public-proof promotion records this already-deployed singleton and does not redeploy Pages.

## Migration provenance

The primary legacy knowledge source is pinned as `NeoBrutalism-shop/NeoBrutal-Soft@dfed77bd159ac5c38081f7a4ca5c2229b61ffb8a`, especially `DESIGN.md`. The migration ledger classifies `legacy.soft.design-language` as `ADAPT` into the Flavor layer and explicitly says to extract Soft visual personality without importing SaaS domain semantics.

The pinned source describes coated-plastic / soft-touch hardware, visible `2px` default structural borders, moderate rounding, shallow hard depth with reference rest → hover → active geometry of `3px → 1.5px → 0px`, warm neutral surfaces, softened blue accents, restrained motion, and dark mode as a first-class Theme rather than an inversion filter. These are migration knowledge inputs; NeoSmartUI resolves its own semantic token values and copies no legacy implementation source.

Repository metadata for that legacy source does not declare a license. The migration policy therefore remains `knowledge-only-until-reviewed`, and no legacy CSS/JS/React implementation bytes are imported.

## Next lifecycle stage

Soft Dark is complete through public proof. The v0.3 Flavor Engine light/dark completion sequence may now proceed contract-first to the next unfinished official Flavor dark Theme. No further Pages deployment belongs to this Soft Dark proof promotion.

Following `core.table` structural proof promotion, the singleton public-proof cohort resolves the exact shipping **46-Core / 55-token** semantic dependency boundary; the temporary Table exact-set maintenance records are retired and proof-only promotion does not redeploy Pages.

Following `core.data-grid` structural proof promotion, the singleton public-proof cohort resolves the exact shipping **47-Core / 55-token** semantic dependency boundary; the temporary DataGrid exact-set maintenance records are retired and proof-only promotion does not redeploy Pages.

Following `core.item` structural proof promotion, the singleton public-proof cohort resolves the exact shipping **48-Core / 55-token** semantic dependency boundary; the temporary Item exact-set maintenance records are retired and proof-only promotion does not redeploy Pages.

Following `core.list` structural proof promotion, the singleton public-proof cohort resolves the exact shipping **49-Core / 55-token** semantic dependency boundary; the temporary List exact-set maintenance records are retired and proof-only promotion does not redeploy Pages.

During the `core.description-list` implementation cohort, exact-set Flavor maintenance permits a maintained local **50-Core / 55-token** semantic dependency boundary while public proof remains bound to the deployed **49-Core / 55-token** List singleton until merged-main deployment, native/live verification, and proof-only promotion complete.
