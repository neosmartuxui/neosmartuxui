# NeoSmartUXUI Development Roadmap

This is the operational summary derived from [`CANONICAL-PRD.md`](CANONICAL-PRD.md). If this file and the Canonical PRD ever disagree, the Canonical PRD wins.

**Roadmap status:** original product sequence preserved; Core breadth expansion is an in-place workstream  
**Updated:** September 20, 2026

## Product sequence

1. **v0.1 Foundation** — complete.
2. **v0.2 Core** — complete foundation and **Component Lab** delivery; the component catalog can continue expanding without reopening or renumbering this milestone.
3. **v0.3 Flavor Engine** — complete: Hardline, Soft, Rivet, Mono, Light/Dark, typography, geometry, motion and Pressure System. **Pulse** is a post-v0.4 official Flavor expansion. Pulse Light and Pulse Dark are implemented as an official Studio starter pair and are complete through public proof. This does not reopen or renumber v0.3.
4. **v0.4 NeoSmartUXUI Studio** — complete through public launch: Theme editing, official starters, component preview, responsive preview, import/export and validation.
5. **v0.5 Core Blocks** — pending: marketing, application and content Blocks; Blocks Lab; machine-readable composition.
6. **v0.6 Commerce Vertical** — pending: Commerce models, domain components, Blocks, Pages and real application journeys.
7. **v0.7 Smart Agent Platform** — pending: Resolver, registry API, CLI, MCP, recipes, anti-patterns and Agent Lab.
8. **v0.8 Distribution** — pending.
9. **v0.9 Hardening** — pending.
10. **v1.0 Stable** — pending.
11. **v1.1 SaaS Discovery** — pending.

The versioned product roadmap above is **unchanged** by the current component-library expansion.

## Current Lab delivery status

- **Component Lab** ✅
- **Dedicated Theme Gallery/Lab** ⏳
- **Blocks Lab** ⏳
- **Pages Lab** ⏳
- **Vertical/SaaS/Commerce previews** ⏳

NeoSmartUXUI Studio is already publicly launched, but Studio completion does **not** mean the dedicated Theme Gallery/Lab is complete. Likewise, the existing Component Lab is complete as a product surface even while the canonical component library continues to gain new production-grade components.

## Current execution focus — Core component library expansion

The canonical Core registry now contains **50 public-proof component contracts**, including `core.description-list`, admitted through the versioned current-host proof-only cohort. The prior 49+1 status below is retained as a historical expansion checkpoint. Expansion C is complete through Toast, and Expansion D Table + DataGrid + Item + List remain fully public-proof. Exact-set Flavor maintenance permits the local Light/Dark Theme scope to advance to **50 Core / 55 tokens**, and DescriptionList adds its single fixture-realized `rest` state for a local **267-state** preview matrix. Deployed/public authority remains exactly **49 Core / 55 tokens / 266 states** until DescriptionList passes exact-head implementation Quality, guarded merge, mandatory merged-main Quality, exact-artifact deployment, native/live verification, and proof-only promotion. All five Flavor maintenance records remain active; only the 49 public-proof components count toward the breadth gate.

The active engineering work expands that catalog inside the existing Core/Component Lab architecture. This is an **execution workstream, not a new roadmap version**.

The reason for doing the breadth work now remains the same: later Blocks should primarily compose proven generic primitives instead of inventing hidden one-off primitives. This dependency does not renumber the roadmap or change the Lab status list above.

## Current Core component breadth gate

Before broad **v0.5 Core Blocks / Blocks Lab** implementation begins:

```text
90+ distinct public-proof Core components
```

**90 is the minimum floor.** Complete coherent component families even if the public-proof count goes beyond 90.

Competitive research is a living multi-competitor benchmark, not a formula for recalculating the target. The canonical research index is `research/competitors/index.json`.

Current September 20, 2026 evidence includes:

- `neobrutalism.com`: 50+ components advertised, 57 unique public component docs discovered, 158 blocks across 22 categories, 6 templates, Theme Lab, Figma and MCP;
- `neobrutalism.dev`: separately tracked catalogue/registry evidence in its own snapshot;
- `Riddle UI`: Framer/Figma design-system evidence with **39 directly verified distinct UI component families** in the public preview (15 utility + 24 interactive), 160+ example sections as a marketing claim, advanced SaaS-oriented interaction patterns, and designer-workflow breadth. Its `5k+ smart components` claim is not treated as a distinct semantic-component count.

Future competitors can be added without renumbering the roadmap or reducing the 90+ target.

### Pulse flavor expansion

Pulse (`flavor.pulse`) is an official **public-proof** Flavor aimed at dense SaaS/application UI: dashboards, operations, analytics, settings, onboarding, admin, data-heavy workflows and high-signal product surfaces. It is independently authored; Riddle UI is competitive research only and no Riddle Figma/source assets are imported.

Pulse Light and Pulse Dark are public-proof on the deployed **39-Core / 55-token** singleton cohort. The Popover expansion preserved the exact 55-token union across every official Light/Dark Theme, completed exact-artifact deployment and native/live verification, and retired the temporary exact-set maintenance through structural proof promotion. The compatibility gate remains Hardline, Soft, Rivet, Mono and Pulse.

### Count integrity

A component counts only when it has:

- one stable Core registry ID;
- one canonical contract;
- real shipping implementation/adapter;
- explicit state semantics;
- keyboard behavior where applicable;
- pointer/touch behavior where applicable;
- focus behavior;
- accessibility semantics;
- Light and Dark compatibility;
- all public-proof official Flavor compatibility (Hardline, Soft, Rivet, Mono and Pulse);
- Studio preview;
- browser QA;
- public-proof evidence.

Do **not** count variants, subparts, examples, aliases, visual presets, or renamed copies as separate components.

## Core expansion component families

The expansion should produce balanced coverage rather than 60 variants of one control family.

### A. Forms and selection

Candidate gaps:

```text
ButtonGroup
InputGroup
NativeSelect
MultiSelect
NumberField
SearchField
Slider
RangeSlider
Toggle
ToggleGroup
InputOTP
FileUpload
Dropzone
ColorPicker
DatePicker
DateRangePicker
TimePicker
Calendar
Rating
Label
```

### B. Overlays, menus and feedback

```text
Dialog
AlertDialog
Drawer
Sheet
Popover
HoverCard
DropdownMenu
ContextMenu
Menubar
NavigationMenu
Toast
Progress
Spinner
Skeleton
EmptyState
Meter
```

### C. Navigation, disclosure and layout utilities

```text
Avatar
Separator
Collapsible
ScrollArea
Resizable
AspectRatio
Carousel
Sidebar
Toolbar
CommandMenu
Stepper
TreeView
```

### D. Data and productivity

```text
Table
DataTable
DataGrid
Item
List
DescriptionList
Timeline
Code
Kbd
Marker
Chart
Sparkline
TagInput
TransferList
EditableText
FileTree
VirtualList
KeyValue
```

These are candidate capabilities, not pre-approved IDs. Every candidate still goes through the Core admission test and may be merged, split, renamed, substituted or rejected.

## Core expansion execution batches

### Expansion A — Inventory and contracts

The initial inventory research is complete and records:

- the exact 18-component public-proof starting cohort;
- the September 20, 2026 competitor evidence and deduplicated registry count;
- the component-family gap matrix;
- Core / Merge / Block / Vertical / Defer admission decisions.

Since that inventory checkpoint, the first 10 approved expansion contracts completed the full implementation → exact-head green → merge → merged-main verification → exact-artifact deployment → native/live verification → structural proof lifecycle, advancing public-proof Core to **28** while preserving the exact **55-token** Theme union. The next Forms/Selection freeze added seven more contracts; `core.color-picker` and `core.time-picker` completed the same full lifecycle to reach **30 public-proof**, `core.input-otp` advanced public proof to **31**, `core.multi-select` advanced it to **32**, `core.file-upload` advanced it to **33**, `core.calendar` advanced it to **34**, `core.date-picker` advanced it to **35**, `core.dialog` advanced it to **36**, `core.alert-dialog` advanced it to **37**, `core.drawer` advanced it to **38**, and Expansion C `core.popover` has now completed the same lifecycle to advance public proof to **39**. Expansion C `core.hover-card` has now completed the full implementation → exact-head green → merge → merged-main verification → exact-artifact deployment → native/live verification → structural proof lifecycle, advancing public proof to **40**. Expansion C `core.dropdown-menu` completed the full implementation → exact-head green → merge → merged-main verification → exact-artifact deployment → native/live verification → structural proof lifecycle, advancing public proof to **41**. Expansion C `core.context-menu` has now completed that same lifecycle, including cancellable long-press/shared-menu integration and exact-artifact native/live verification, advancing public proof to **42** while preserving the exact **55-token** Theme union. `core.menubar` completed that same lifecycle, advancing public proof to **43** while preserving the exact **55-token** Theme union and expanding the canonical preview matrix to **249 real states**. `core.navigation-menu` has now completed the same lifecycle, advancing public proof to **44** while preserving the exact **55-token** Theme union and expanding the canonical preview matrix to **255 real states**. The ordered Expansion C feedback-surface dependency `core.toast` has now completed that same implementation → exact-head green → guarded merge → merged-main verification → exact-artifact deployment → native/live verification → structural proof lifecycle, advancing public proof to **45** while preserving the exact **55-token** Theme union and expanding the canonical preview matrix to **258 real states**. Expansion D now starts with `core.table`; it has completed contract verification, maintenance-first implementation, exact-head verification, guarded merge, mandatory merged-main verification, exact-artifact deployment, native/live verification, and structural proof promotion, advancing public proof to **46** while preserving the exact **55-token** Theme union and expanding the canonical preview matrix to **259 real states**. The next Data/display dependency `core.data-grid` has now completed contract verification, maintenance-first implementation, exact-head verification, guarded merge, mandatory merged-main verification, exact-artifact deployment, native/live verification, and structural proof promotion, advancing public proof to **47** while preserving the exact **55-token** Theme union and expanding the canonical preview matrix to **264 real states**. The next Expansion D lists/items dependency `core.item` has now completed contract verification, maintenance-first implementation, exact-head verification, guarded merge, mandatory merged-main verification, exact-artifact deployment, native/live verification, and structural proof promotion, advancing public proof to **48** while preserving the exact **55-token** Theme union and expanding the canonical preview matrix to **265 real states**. The next lists/items dependency `core.list` has now completed contract verification, maintenance-first implementation, exact-head verification, guarded merge, mandatory merged-main verification, exact-artifact deployment, native/live verification, and structural proof promotion, advancing public proof to **49** while preserving the exact **55-token** Theme union and expanding the canonical preview matrix to **266 real states**. The next lists/items/display dependency `core.description-list` has completed contract admission and mandatory merged-main contract verification and is now implemented locally as Core 50 under exact-set Flavor maintenance: local Theme scope is **50 Core / 55 tokens** and the preview matrix is **267 states**, while deployed/public authority remains **49 Core / 55 tokens / 266 states** until the normal merged-main deployment/proof lifecycle completes.

Canonical competitor evidence:

- `research/competitors/neobrutalism-dev/components-2026-09-20.json`

Historical research files may retain earlier working-version labels; those filenames are provenance only and do not define the product roadmap.

### Expansion B — Forms and selection

Prioritize the controls needed by almost every later Block/Page:

- field/input families;
- choice controls;
- date/time controls;
- upload controls;
- grouped/toggle controls.

### Expansion C — Overlay, navigation and disclosure

Build the interaction-heavy primitives that later application Blocks require:

- dialogs/drawers/popovers;
- menus;
- navigation;
- disclosure;
- feedback surfaces.

### Expansion D — Data, display and layout

Build the generic primitives needed for dashboards, Commerce and SaaS:

- table/data interaction;
- lists/items;
- scroll/resize;
- charts and progress;
- advanced structured display.

### Expansion E — Productivity and advanced interaction

Close high-value generic gaps such as:

- command/productivity controls;
- editable/tag/transfer controls;
- trees/virtualized lists;
- remaining accessibility-driven primitives.

### Expansion F — Coverage audit and public proof

The phase exits only when:

- the dynamic breadth formula is satisfied;
- no candidate is counted through variant inflation;
- every counted component is in the canonical registry;
- every counted component is visible in Studio;
- required state/input/accessibility coverage is green;
- official Flavor/Theme coverage is green;
- browser QA is green;
- public proof is complete;
- the remaining Block backlog can be described primarily as compositions of Core components.

## Block-start gate

v0.5 Core Blocks / Blocks Lab MUST NOT become the primary implementation track until Expansion F is green.

Small internal compositions used solely to test a component are allowed, but they do not establish Block contracts or a parallel Block registry.

When v0.5 Core Blocks starts, the rule is:

> **Compose first. Invent a new primitive only when the expanded Core genuinely lacks a domain-free capability.**

## Development lifecycle

For every component:

```text
research
→ Core admission decision
→ contract
→ validator
→ implementation
→ states
→ accessibility/input behavior
→ Studio preview
→ browser QA
→ PR
→ exact-head green
→ merge
→ merged-main verification
→ public proof where required
```

Never weaken QA to increase component count faster.

## Hosting rule during development

GitHub is the permanent home and GitHub Pages is the required public host while this roadmap is active. `neosmartuxui.com`, Cloudflare, registrar configuration, DNS and custom-domain certificates remain non-blocking infrastructure work.

## Immediate next PR sequence

The next implementation sequence is:

```text
Expansion A
inventory + stable contracts

Expansion B*
forms + selection implementation batches

Expansion C*
overlays + navigation + disclosure batches

Expansion D*
data + layout batches

Expansion E*
advanced/productivity batches

Expansion F
competitive recount + coverage audit + full public-proof gate
```

This component work does not consume a new product version. The existing pending Lab/product sequence remains:

```text
Dedicated Theme Gallery/Lab
→ Blocks Lab / v0.5 Core Blocks
→ Pages Lab
→ Vertical/SaaS/Commerce previews
```

The exact PR split may change when repository dependency reality makes a better split obvious. The component-first dependency does not change the top-level roadmap.

## Permanent execution gate

```text
inspect
→ branch
→ implement
→ validate
→ PR
→ verify exact head SHA + CI
→ merge
→ mandatory merged-main verification
→ deploy exact merged artifact when public proof changes
→ verify live
→ select earliest unfinished dependency
```

Never weaken tests, validators, accessibility, semantics, browser coverage or proof requirements to make CI green.

### Current-host proof-only admission — October 22, 2026

The 50th Core component, `core.description-list`, is promoted through the separate `neosmartuxui/public-proof-cohort@2` authority after full exact-source QA, approved Foundry publication and independent 105-file/54-old-subject live proof. The active 55-subject cohort is stored under `evidence/current-host/cohort-v2.json`, preserving all original 49 Core + five Flavor v1 proofs and their five maintenance records untouched. No post-promotion Pages redeployment. Core breadth continues with Expansion D after this admission.
