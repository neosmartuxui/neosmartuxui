# Rivet Flavor Contract

Rivet is the industrial/mechanical NeoSmartUI flavor. It turns pressure, hard boundaries, crisp offset depth, and machine-readable structure into a durable product-independent expression while keeping Core behavior shared.

## Stable identity

- Flavor ID: `flavor.rivet`
- Flavor schema: `neosmartui/flavor@1`
- Light Theme: `packages/themes/rivet-light/theme.json`
- Dark Theme: `packages/themes/rivet-dark/theme.json`
- Interaction model: `pressure-not-levitation`
- Official migration maturity: `public-proof`
- Public-proof record: `evidence/public/flavor.rivet.json`
- Rivet Dark contract maturity: `contract-only` (superseded contract checkpoint)
- Rivet Dark implementation maturity: `public-proof`
- Rivet Dark public-proof status: **public-proof**

## Expression contract

Rivet owns industrial/mechanical expression: semantic palette defaults, sturdy typography, mechanical geometry, visible structural borders, crisp hard-shadow depth, fluid sizing, purposeful pressure motion, comfortable density, icon treatment, and surface treatment. Raised controls compress toward their shadow on contact and seat into the surface on direct press. Persistent selection remains seated rather than floating.

Rivet MUST NOT introduce generic hover lift. Informational surfaces remain stable unless they carry real action or navigation semantics. Editing surfaces stay editable rather than pretending to be pressable objects. Reduced-motion behavior must preserve state clarity while removing non-essential travel.

Rivet MUST NOT own Button/Dialog/Product/Checkout/Billing behavior or any Vertical semantics. Those remain Core/Vertical responsibilities. Flavor-specific renderer forks are exceptional and are not part of Rivet Light or Rivet Dark.

## Rivet Light reconciliation

NeoSmartUI already had a Rivet Light 18-component / exact 55-token foundation baseline before the official Flavor migration lifecycle began. The implementation phase reconciled that baseline against the pinned Rivet knowledge source instead of discarding it or silently inheriting it.

The mechanical model is deliberately **ratified** under NeoSmartUI authority: `3px` structural control/surface borders, `6px` control/surface radii, coherent `5px → 3px → 0` structural depth with `0 → 2px → 5px` inward travel, `80ms / 140ms / 160ms` press/release/standard timing, a `44px` minimum target, and an independent `3px` focus keyline. These values produce the sturdy mechanical pressure model intended by Rivet while preserving shared Core semantics.

The identity palette is deliberately **adapted** from pinned Rivet design knowledge rather than retaining the generic bootstrap palette. Rivet Light resolves paper surfaces (`#fffefb` interactive and `#f8f6f1` panel), strong ink (`#222126` primary content and `#25232b` strong border), lavender primary action (`#b9a1ed` with `#211c2b` content), and a deep lavender focus ring (`#7550ac`). Success, warning, error, and information colors are remapped into the Rivet family while keeping written state meaning authoritative.

The deployed public-proof Theme cohort resolves exactly the **49 public-proof Core components** and the exact resolved semantic dependency union: **55 token IDs**. It uses the same adapter-owned component CSS as Hardline and Soft; no Core renderer fork is introduced.

The Foundry exposes a dedicated `/flavors/rivet/` route and generated `rivet-theme.css` scope so Rivet can be exercised independently from the root Core Foundry while remaining byte-consistent with the same resolved bundle.

## Rivet Dark contract

Rivet Dark is the second concrete Theme instance of `flavor.rivet`. Its descriptor declares an authored industrial dark semantic strategy while keeping Rivet ownership, mechanical structure, sturdy typography, comfortable density, adapter-owned icons, and pressure-not-levitation interaction intact. It is not CSS inversion, filter-based dark mode, or hidden conditional values inside Rivet Light.

The original contract froze Rivet Dark to the then-shipping 18-Core / 55-token boundary. The first Core expansion batch extended both Rivet modes to 22 Core components, the grouped-controls Expansion B batch extended local scope to 24, the toggle-controls pair extended scope to 26, the NumberField/Slider pair advanced public proof to 28, the ColorPicker/TimePicker pair advanced public proof to 30 Core components, the dedicated InputOTP cohort advanced public proof to 31, the dedicated MultiSelect cohort advanced public proof to 32, the dedicated FileUpload cohort advanced public proof to 33, the dedicated Calendar cohort advanced public proof to 34, the dedicated DatePicker cohort advanced public proof to 35, and the dedicated Dialog cohort advanced public proof to 36, AlertDialog advanced it to 37, Drawer advanced it to 38, Popover advanced public proof to 39, and HoverCard advanced public proof to 40, and DropdownMenu advanced it to 41, and ContextMenu advanced public proof to **42**, and Menubar has now completed deployment and structural proof promotion to advance public proof to **43** while preserving the exact 55-token semantic dependency union and all ratified mechanical laws. Implementation preserves the ratified mechanical laws across color modes: `3px` control/surface and `2px` annotation boundaries, `6px` control/surface and pill annotation geometry, `5px → 3px → 0px` structural depth, `0px → 2px → 5px` inward travel, `80ms / 140ms / 160ms` pressure timings, a `44px` minimum target, and an independently visible `3px` focus width/offset.

Concrete Dark palette values were intentionally deferred during the contract-only checkpoint. That statement is retained as lifecycle history; the implementation below authors those values under NeoSmartUI authority rather than copying legacy implementation bytes. Written state labels and non-color meaning remain authoritative.

The existing `/flavors/rivet/` proof surface remains the canonical Flavor route. The proven source route remains byte-identical; Dark is assembled only into the generated artifact copy. No competing `flavor.rivet-dark` identity or route exists.

No Pages deployment occurred from the contract branch. That contract checkpoint merged green and mandatory merged-main Quality passed before implementation began.

## Rivet Dark implementation

Rivet Dark resolves through `packages/themes/rivet-dark/resolution.json` and `packages/themes/rivet-dark/tokens.json`. Its deployed public-proof cohort uses the exact same **49-Core / 55-token** semantic dependency surface as Rivet Light. Every non-color geometry, spacing, target, depth, travel, timing, focus-width/offset, typography, density, and disabled-opacity value is preserved value-for-value from Rivet Light.

The authored Dark palette is NeoSmartUI-owned: interactive/panel surfaces `#18171c` / `#232129`, primary/secondary content `#f6f3fa` / `#c9c3d1`, structural borders `#aaa4b2` / `#f5f1fa`, primary lavender action `#c7b5f2` with `#211c2b` content, status fills `#2e7644` / `#5e7008` / `#ef8a84` / `#764dd6`, and independent focus `#cdbdf7`. Implementation validation requires at least 4.5:1 for authored text pairings and 3:1 for the focus/default-boundary non-text pairings exercised by the shared adapters.

Runtime assembly is proof-safe and additive. The shared proven `tooling/foundry/build.mjs` remains unchanged, the proven Soft Dark assembler remains unchanged, and `tooling/foundry/assemble-rivet-dark.mjs` runs afterward. It emits scoped `rivet-dark-theme.css` and injects the separate `apps/foundry/fragments/rivet-dark.html` fragment into the generated copy of `/flavors/rivet/`. The already-proven Rivet Light source route is not mutated.

Six additive browser cases verify shared-adapter identity and authored palette, coherent 5→3→0 depth with 0→2→5 inward travel, non-pressable editing/static surfaces plus written state meaning, reduced motion, forced-colors/focus/Tab order, and RTL/narrow/localized containment. Existing coverage is retained unchanged.

Rivet Dark is `public-proof`. The machine-readable record binds both Light and Dark Theme/resolution/token inputs, the Dark fragment, the deterministic Rivet Dark assembler, the exact merged-main browser cohort, the exact no-rebuild Pages deployment, and both live Theme assets.

## Rivet Dark public-proof cohorts

The implementation merged at exact source `neosmartui/neosmartui@be730284fd0c040aa6ad3be8cde6cb52acb3309a`. The original merged-main Quality run was externally stuck in GitHub Actions' scheduler before any runner step executed; after the stale run was cancelled, attempt 2 reran the same workflow/run on the same source SHA and completed green. No source commit was created to clear the scheduler incident.

The initial Rivet Dark public-proof cohort was:

- deployed implementation source: `neosmartui/neosmartui@be730284fd0c040aa6ad3be8cde6cb52acb3309a`
- merged-main Quality run: `34737889119` (successful attempt 2 on the same exact SHA)
- merged-main browser artifact: `10314159095`
- merged-main artifact SHA256: `2a4e9937917a25eb5d3bafa25aa6c7678daf2c575a1b2b57eb32e5a8f3a3064c`
- Chromium: `136/136`
- browser report: `136` expected, `0` skipped, `0` unexpected, `0` flaky
- exact deployable Foundry file count: `44`
- exact deployable artifact tree: `f8d0282852ee376c4fbf96117d0439e9b960e031`
- Pages commit: `ef84508f5dc001b72ebec3fdb7b3deb815c29454`
- Pages tree: `f8d0282852ee376c4fbf96117d0439e9b960e031`
- native Pages run: `34747673153`
- native Pages artifact: `10314896015`
- native Pages artifact SHA256: `af942a1a60d90f6c9cd22ec77fcee3ef4ecc5a4c091e42e496f21834d5092598`
- live route: `https://neosmartui.github.io/flavors/rivet/`
- live Light Theme asset: `https://neosmartui.github.io/rivet-theme.css`
- live Dark Theme asset: `https://neosmartui.github.io/rivet-dark-theme.css`
- canonical deployment record: `https://neosmartui.github.io/deployment.json`

The merged-main browser artifact was independently downloaded and hashed before deployment. Its `deployment.json` names the exact source SHA above, its browser report is clean, and its deterministic 44-file Git tree is exactly `f8d0282852ee376c4fbf96117d0439e9b960e031`. It differs from the preceding Soft Dark deployment only in the deployment record, assembled Rivet route, and new `rivet-dark-theme.css`; all other deployable target files remain byte-identical.

The Pages repository final commit tree is exactly the same verified 44-file artifact tree. Native Pages run `34747673153` checked out `ef84508f5dc001b72ebec3fdb7b3deb815c29454` and used it as `build_revision`; its native artifact contains all 44 deployable Foundry files byte-for-byte identical to the merged-main artifact, plus only Jekyll's generated `assets/css/style.css`.

During bootstrap publishing, an unintended empty `__noop__` commit `ec98b161efc7840c78bc1ea5a14150f58f105612` was created in the generated Pages repository by a connector invocation. It was immediately superseded without force or history rewriting by the final exact-tree commit `ef84508f5dc001b72ebec3fdb7b3deb815c29454`; the transient Pages run `34747651280` was cancelled and is not proof authority. No source repository state or verified artifact bytes were changed by that tooling incident.

Public-proof promotion does not redeploy Pages. The separate proof-only source change may update evidence, lifecycle documentation, and proof validators, but must not alter runtime Theme/token/fragment/assembler/browser/workflow/Pages output.

## Historical Rivet Light cohort

Rivet Light reached `public-proof` only after its implementation was merged, the exact merged-main artifact was independently verified, and those exact bytes were deployed to GitHub Pages without rebuilding.

- deployed source: `neosmartui/neosmartui@5ba46a5962db8241a247574ab920f47cd843925b`
- merged-main Quality run: `34709638377`
- merged-main browser artifact: `10302489738`
- Chromium: `111/111`
- Pages commit: `db3b2013439c3365c900d68899cd750318e3b724`
- Pages tree: `45d8a3a721df9dbba2794c7562e7b5c51578c0a8`
- native Pages run: `34709962865`

The singleton public-proof cohort has since advanced as later verified Flavor work deployed. `evidence/public/flavor.rivet.json` is the machine-readable authority for Rivet's current cohort and retains exact Light and Dark implementation blob bindings.

The current accessibility-maintenance refresh is proven from merged source `fb2b401f67723f5274f1bd3699be97877fc88c86`, merged-main Quality run `35249742761`, browser artifact `10509631176`, merged-main artifact SHA-256 `73340f8d70d6f68985b866ad5232137deb77e905e0435b50f3dbd4b0d20a4f54`, Chromium `146/146` with zero skipped, unexpected, or flaky tests, exact Pages commit `4c576231efd8ff479f67e748001ff43914216a76`, Pages tree `c037e76d9b288a081ad11dda17d12c2b432d9d1d`, native Pages run `35295432975`, native Pages artifact `10527333013`, and native artifact SHA-256 `6ed44ab59ffa12ccff640d6c7a638dd01cc98447c805bd3422cc0efdb0d03420`. All 44 deployable Foundry files in the native artifact are byte-identical to merged-main evidence; the only extra native artifact file is Jekyll-generated `assets/css/style.css`. Public-proof promotion does not redeploy Pages.

## Migration provenance

The primary legacy knowledge source is pinned as `NeoBrutalRivet/NeoBrutal-Rivet@bb4b641d35bc77c958b7345a3b7c0a134c7d802d`. The migration inventory classifies `legacy.rivet.flavor-system` as `ADAPT` into the Flavor layer.

Pinned knowledge establishes useful Rivet principles: semantic tokens rather than component-local color values, fluid `clamp()` sizing, crisp hard-shadow elevation, physical hover/press movement, explicit motion tokens, reduced-motion support, light/dark semantic mappings, machine-readable component discovery, and a recognizable industrial/mechanical NeoBrutal personality. Its lavender/lime/peach/blue and ink/paper relationships are treated as design knowledge inputs; NeoSmartUI owns the final semantic mapping above.

Repository metadata for the pinned source does not declare a project license. The migration policy remains `knowledge-only-until-reviewed`: NeoSmartUI extracts architecture and design knowledge, but copied no legacy implementation CSS/TypeScript/React bytes.

## Verification boundary

Rivet public proof remains evidence-bound rather than declarative. Structural validation checks the singleton deployment cohort and current proven implementation blob SHAs. Live validation checks the canonical deployment record, dedicated Rivet page markers, and exact proven Light and Dark Theme asset markers over HTTPS.

Rivet Dark remains the second concrete Theme instance of the existing `flavor.rivet`; no hidden conditional mutation or inversion filter is permitted.

## Current exclusions

- No Rivet renderer override.
- No `flavor.rivet-dark` identity or separate Dark route.
- No Core adapter fork.
- No Vertical semantics inside the Flavor.
- No Pages deployment from the proof promotion.

## Next lifecycle stage

Rivet Dark is complete through public proof. The v0.3 Flavor Engine light/dark completion sequence may proceed contract-first to the next unfinished official Flavor dark Theme, expected to be Mono Dark. No further Pages deployment belongs to this Rivet Dark proof promotion.

Following `core.table` structural proof promotion, the singleton public-proof cohort resolves the exact shipping **46-Core / 55-token** semantic dependency boundary; the temporary Table exact-set maintenance records are retired and proof-only promotion does not redeploy Pages.

Following `core.data-grid` structural proof promotion, the singleton public-proof cohort resolves the exact shipping **47-Core / 55-token** semantic dependency boundary; the temporary DataGrid exact-set maintenance records are retired and proof-only promotion does not redeploy Pages.

Following `core.item` structural proof promotion, the singleton public-proof cohort resolves the exact shipping **48-Core / 55-token** semantic dependency boundary; the temporary Item exact-set maintenance records are retired and proof-only promotion does not redeploy Pages.

Following `core.list` structural proof promotion, the singleton public-proof cohort resolves the exact shipping **49-Core / 55-token** semantic dependency boundary; the temporary List exact-set maintenance records are retired and proof-only promotion does not redeploy Pages.

During the `core.description-list` implementation cohort, exact-set Flavor maintenance permits a maintained local **50-Core / 55-token** semantic dependency boundary while public proof remains bound to the deployed **49-Core / 55-token** List singleton until merged-main deployment, native/live verification, and proof-only promotion complete.
