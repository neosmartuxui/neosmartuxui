# NeoSmartUXUI

## Canonical PRD, Architecture, Migration, Competitive Strategy & Execution Plan

**Parent company:** NeoSmartApps

**Product:** NeoSmartUXUI

**Category:** AI-first / agent-native neo-brutalist UI platform

**Status:** Canonical planning authority — active

**Document version:** 0.4

**Date:** September 20, 2026

---

# 1. Executive decision

We will rebuild the existing NeoBrutal ecosystem as a new canonical product:

# **NeoSmartUXUI**

NeoSmartUXUI will live under the broader **NeoSmartApps** product family.

```text
NeoSmartApps
│
├── NeoSmartUXUI
│   └── AI-first UI platform
│
└── AI-first applications
    └── built using NeoSmartUXUI

```

NeoSmartApps builds AI-first software.

NeoSmartUXUI becomes the AI-first interface platform used by humans, coding agents, internal NeoSmartApps products, and third-party developers.

We will build NeoSmartUXUI around:

```text
ONE MONOREPO
ONE SPEC
ONE CORE
ONE REGISTRY
ONE THEME ENGINE
ONE RESOLVER
ONE AGENT MODEL
ONE QUALITY CONTRACT
ONE PUBLIC FOUNDRY

        ↓

multiple flavors
multiple verticals
multiple frameworks
multiple applications
multiple custom themes
multiple live public proof surfaces

```

GitHub is the permanent engineering, documentation, release, and public-demonstration home of NeoSmartUXUI.

The canonical source repository and the generated public deployment are deliberately separated so the main repository remains safe:

```text
github.com/neosmartuxui/neosmartuxui
→ canonical source, contracts, tests, apps, tooling, roadmap

github.com/neosmartuxui/neosmartuxui.github.io
→ generated public Foundry / GitHub Pages deployment

neosmartuxui.com
→ public product domain for the Foundry
```

The canonical monorepo remains authoritative. The public deployment is generated from it and must never become a competing source of truth.

We are **not throwing away the existing work**.

Existing repositories become validated migration sources from which we harvest:

- components
   
- tokens
   
- interaction rules
   
- accessibility work
   
- responsive behavior
   
- blocks
   
- pages
   
- Commerce domain models
   
- agent contracts
   
- test cases
   
- screenshots and visual references
   
- resilience patterns
   
- documentation
   
- registry structures
   
- CI knowledge
   
- provider abstractions
   
- licensing and ownership semantics
   
- failures and regression tests
   

The migration principle is:

> **Restart the architecture, not the knowledge.**

---

# 2. Brand architecture

## 2.1 Parent company

```text
NeoSmartApps

```

Meaning:

> AI-first applications and software products.

## 2.2 UI platform

```text
NeoSmartUXUI

```

Meaning:

```text
NEO
→ new
→ modern
→ neo-brutalist lineage

SMART
→ AI-readable
→ agent-native
→ automatic selection
→ intelligent composition
→ automatic validation
→ explainable decisions

UI
→ components
→ blocks
→ pages
→ design system
→ complete interfaces

```

“Smart” must never be empty marketing language.

In NeoSmartUXUI, **Smart** specifically means that the system can be understood and used deterministically by software agents.

---

# 3. Brand positioning

Primary positioning:

> **NeoSmartUXUI — The AI-first neo-brutalist UI system.**

Supporting message:

> **Built for humans. Structured for agents.**

Alternative product message:

> **Design once. Compose intelligently.**

NeoSmartUXUI is not positioned simply as:

> another React component library.

It is positioned as:

> **an agent-native interface platform capable of selecting, composing, styling and validating complete production UI.**

---

# 4. Product vision

NeoSmartUXUI should become:

> **A machine-readable, themeable, tactile and agent-native UI platform for building complete applications—not merely a collection of neo-brutalist components.**

A developer, designer or agent should be able to request:

> Build a Commerce product page using Hardline.

or:

> Build a SaaS analytics dashboard with our purple brand palette, IBM Plex Sans and sharp geometry.

or:

> Convert this Commerce application from Hardline to Soft without changing business behavior.

or:

> Build a billing page and automatically select the best existing NeoSmartUXUI components and blocks.

The platform resolves the correct architecture automatically.

Users should not need to manually understand:

```text
repository structure
token names
component dependencies
vertical ownership
theme implementation
responsive behavior
accessibility contracts
agent instructions

```

The system knows.

---

# 5. Product north star

A developer should eventually be able to go from:

> “I need a distinctive SaaS billing experience with sharp NeoBrutal styling.”

to production-grade interface code without deciding:

```text
which component library
which repository
which button
which data table
which tokens
which block
which page pattern
which accessibility states
which theme
which dependencies
which agent instructions

```

NeoSmartUXUI resolves those decisions.

The human chooses:

```text
intent
vertical
personality
brand
framework

```

NeoSmartUXUI resolves the system.

---

# 6. Fundamental architecture

```text
SPEC
  ↓
CORE
  ↓
COMPONENTS
  ↓
BLOCKS
  ↓
PAGES
  ↓
APPLICATIONS

```

Two independent dimensions apply across the hierarchy:

```text
FLAVOR
= how the interface looks and physically feels

VERTICAL
= what business/domain knowledge the interface understands

```

A theme is:

```text
THEME
= a concrete configured instance of a flavor

```

Therefore:

```text
Core
+
Vertical
+
Flavor
+
Theme
+
Framework Adapter
=
Application UI

```

Example:

```text
NeoSmartUXUI Core
+
Commerce
+
Hardline
+
Acme Theme
+
React
=
Acme Commerce Application

```

---

# 7. Correct taxonomy

Commerce is **not a flavor**.

Commerce is a:

```text
VERTICAL

```

SaaS is a:

```text
VERTICAL

```

Soft, Rivet, Mono, Hardline and Pulse are:

```text
FLAVORS

```

Pulse is a public-proof official Flavor expansion. Pulse Light and Pulse Dark are implemented through the shared Core Theme pipeline, form one official Studio starter pair, and completed the full exact-artifact/live-verification/proof lifecycle. Pulse is now a required public-proof compatibility surface alongside Hardline, Soft, Rivet and Mono.

This distinction becomes normative in NeoSmartUXUI Spec v1.

Existing documents that call Commerce a flavor must be migrated.

---

# 8. Primary product promise

NeoSmartUXUI keeps these decisions independent:

```text
WHAT am I building?
→ Commerce
→ SaaS
→ Marketplace
→ Docs
→ generic application
→ future verticals

HOW should it feel?
→ Hardline
→ Soft
→ Rivet
→ Mono
→ Pulse (Light/Dark public-proof)
→ custom theme

WHAT level do I need?
→ Component
→ Block
→ Page
→ Application

HOW am I building?
→ Human
→ CLI
→ Registry
→ LLM
→ Agent
→ MCP
→ Framework

```

Changing one should not force reconstruction of the others.

---

# 9. NeoSmartUXUI intelligence model

NeoSmartUXUI becomes “Smart” through six platform capabilities.

## 9.1 Discover

Agents discover existing capabilities before inventing anything.

## 9.2 Resolve

The system determines whether the need belongs to:

```text
Core
Vertical
Block
Page
Theme
Application

```

## 9.3 Compose

The system composes existing primitives into larger structures.

## 9.4 Style

Flavor and Theme are applied independently of business logic.

## 9.5 Validate

Architecture, accessibility, theme, responsive and interaction rules are automatically checked.

## 9.6 Explain

Agent decisions are inspectable rather than mysterious.

Example:

```json
{
  "selected": "core.data-table",
  "reason": [
    "structured tabular data",
    "sortable columns requested",
    "row actions required"
  ]
}

```

---

# 10. Product principles

## 10.1 Sharp before soft

The flagship NeoSmartUXUI identity should prefer:

```text
square edges
strong geometry
hard boundaries
visible structure
deliberate shadows
high contrast
strong typography

```

`border-radius: 0` becomes a first-class configuration.

Rounded interfaces remain supported through flavors such as Soft.

Rounded geometry does **not** define NeoSmartUXUI.

---

## 10.2 Compress, never float

Ordinary interactive controls move toward their resting plane.

Canonical sequence:

```text
REST
↓
HOVER / PROXIMITY
↓
PRESS
↓
RELEASE
↓
RESULT

```

Hover begins contact.

Press completes contact.

Release restores physical depth.

Generic hover-lift behavior is prohibited.

---

# 11. NeoSmart Pressure System

The existing tactile concept becomes a first-class NeoSmartUXUI subsystem:

# **Pressure System**

Instead of separately inventing hover and pressed animations, interactive surfaces expose normalized pressure.

Example conceptual scale:

```text
0.00 = rest

0.25 = proximity / hover

1.00 = pressed

1.00 = latched / seated
       where selection semantics require it

```

Pressure can drive:

```text
translation
shadow compression
surface color
border emphasis
icon travel
selection seating

```

Example:

```css
--nsui-depth-rest: 4px;
--nsui-depth-hover: 3px;
--nsui-depth-pressed: 0px;

--nsui-travel-hover: 1px;
--nsui-travel-pressed: 4px;

```

The exact values belong to theme/flavor configuration.

---

# 12. Color Reaction System

Color participates in interaction.

Primary control example:

```text
REST
yellow

HOVER
yellow-orange

PRESS
orange

SELECTED
orange + seated geometry

FOCUS
rest surface + independent focus keyline

```

Secondary example:

```text
REST
white

HOVER
lime

PRESS
deep lime

```

Destructive:

```text
REST
coral

HOVER
red-coral

PRESS
deep red

```

Components request semantic roles.

Themes supply actual colors.

---

# 13. Motion communicates physics

Motion must communicate:

```text
affordance
proximity
contact
pressure
selection
hierarchy
continuity
progress
confirmation
failure

```

Static content remains stable.

Decorative motion must not falsely suggest interactivity.

---

# 14. Accessibility is structural

Every Core contract must account for:

```text
keyboard
focus-visible
touch
pointer
reduced motion
forced colors
semantic HTML
ARIA where required
target size
contrast
RTL
localization
overflow
loading
disabled
error

```

Accessibility is not a post-release polish pass.

---

# 15. One source of truth

Humans, Theme Studio, CI and agents use the same underlying registries and schemas.

Documentation may explain the truth.

Documentation must not become an independent authority.

```text
registry
   ↓
documentation
website
CLI
MCP
Studio
tests
scorecards

```

Counts, IDs and capabilities are generated wherever practical.

The same rule applies to public demonstrations:

> **Source once. Demonstrate everywhere.**

The Foundry, flavor pages, vertical pages, Component Lab, Block Lab, Page Lab, Motion Lab, Studio, and Agent Lab must consume shipping contracts and implementations wherever practical rather than maintaining hand-built lookalike demos.

---

# 16. Competitive baseline

Competitive research is a **living multi-competitor system**. No single competitor defines NeoSmartUXUI architecture or the Core target.

Primary tracked competitor:

```text
neobrutalism.com
```

Other tracked competitors:

```text
neobrutalism.dev
Riddle UI
```

These are distinct products/lineages and MUST NOT be conflated. Riddle UI is tracked primarily as a designer-first Framer/Figma system, while the two NeoBrutalism libraries are tracked as separate code-library competitors.

Current dated evidence is preserved under:

```text
research/competitors/
```

The canonical competitor index is:

```text
research/competitors/index.json
```

The September 20, 2026 `neobrutalism.com` snapshot records:

```text
50+ components advertised
57 unique public component documentation routes discovered
158 blocks
22 block categories
6 full-site templates
Theme Lab / theme builder
Figma
MCP
shadcn-compatible install flow
RTL
Dark mode
Radix UI / Base UI / React Aria coverage
```

The separate September 20, 2026 `neobrutalism.dev` snapshot records its own public catalogue and registry evidence.

The September 20, 2026 `Riddle UI` snapshot records first-party Framer and public Figma evidence including:

```text
39 directly verified distinct UI component families
  = 15 utility + 24 interactive
250+ global styles (marketing claim)
5k+ smart components (marketing claim; variants/configurations/instances, not a semantic Core count)
160+ example sections (marketing claim)
2,000+ included icons
Design foundations
Marketing UI sections
Example pages
Framer + Figma delivery
```

The public Preview IMAGE is sufficient to verify the 39 component-family names, but anonymous access to the separately linked full Figma file is authentication-gated. Therefore exact master component-set and total variant/instance counts are **not verified**.

The public Figma preview exposes advanced patterns including coach marks, datepicker, file uploader, range slider, steps, tables, charts, modals, notifications, stacked lists and action panels. These are gap-analysis inputs, not assets to copy.

NeoSmartUXUI's current Core breadth target is a product decision:

> **90+ distinct public-proof Core components.**

It is **not** `competitor count + N` and it is not reduced when a competitor has fewer components. Competitor counts are used to reveal gaps, table-stakes capabilities and opportunities—not to mechanically set NeoSmartUXUI's roadmap.

Before major product gates, active competitors should be re-checked and timestamped. New competitors can be added to `research/competitors/index.json` without changing the architecture.

Therefore NeoSmartUXUI cannot differentiate through:

> “We also have buttons, blocks and a color picker.”

Those are baseline expectations. NeoSmartUXUI must combine broad component coverage with stronger contracts, state semantics, accessibility, Theme/Flavor integration, Studio visibility, agent metadata, vertical depth and public proof.

---

# 17. Competitive differentiation

NeoSmartUXUI should compete around:

| Area NeoSmartUXUI direction  |                                             |
| -------------------------- | ------------------------------------------- |
| Components                 | Production-grade Core                       |
| Blocks                     | Generic Core + domain-aware vertical blocks |
| Pages                      | Machine-readable experience contracts       |
| Themes                     | State + interaction + vertical aware        |
| Motion                     | Pressure System                             |
| AI                         | Intent → resolve → compose → validate       |
| MCP                        | Architecture-aware resolver                 |
| Verticals                  | Deep domain knowledge                       |
| State                      | Full application-state semantics            |
| Accessibility              | Contract-level proof                        |
| QA                         | System-level conformance                    |
| Reuse                      | Core promotion architecture                 |
| Agents                     | Explainable deterministic selection         |
| Migration                  | Provenance-aware                            |
| Theme editing              | Real page and state preview                 |

---

# 18. Competitor interaction distinction

Competitor behavior can use:

```text
REST
offset depth

HOVER
lift / expand shadow / color change

PRESS
move inward

```

NeoSmartUXUI identity:

```text
REST
structural depth

HOVER
initial compression
+
color reaction

PRESS
full compression
+
shadow collapse

SELECTED
physically seated state

RELEASE
short controlled restoration

```

Our identity is:

> **Pressure, not levitation.**

---

# 19. Geometry System

Square corners alone are not enough differentiation.

NeoSmartUXUI should expose geometry recipes:

```text
square
micro
cut
notched
stepped

```

Flagship geometry should emphasize:

```text
square
cut
notched

```

Distinctive patterns:

### Structural edge

Stable heavy boundary with independent depth.

### Cut corner

Geometric chamfer rather than roundness.

### Seated selection

Selected components lose apparent elevation.

### Keyline focus

Keyboard focus gets an independent external keyline.

### Impact edge

Press direction can briefly emphasize the corresponding structural edge.

---

# 20. Flagship flavor

# Hardline

Hardline becomes the default NeoSmartUXUI personality.

```text
square / zero-radius defaults
hard borders
strong structural depth
high color reaction
Pressure System
sharp typography
seated selected states
minimal decorative movement

```

Hardline represents the primary NeoSmartUXUI visual identity.

---

# 21. Official flavors

Public-proof official flavors:

```text
Hardline
Soft
Rivet
Mono

```

Official implemented expansion awaiting public proof:

```text
Pulse
  Pulse Light — implemented
  Pulse Dark — implemented
  Studio starter pair — implemented
  public-proof promotion — complete

```

## Hardline

Sharp flagship.

## Soft

Calm application-oriented NeoBrutal.

## Rivet

Industrial/mechanical NeoBrutal.

## Mono

Editorial black/white/gray NeoBrutal.

## Pulse

SaaS-forward, high-energy NeoBrutal for dense product interfaces, dashboards, analytics, operations, settings, onboarding, admin, tables, charts and other long-session application surfaces. Pulse keeps sharp/micro geometry, visible structure, compact-but-accessible density, saturated high-signal accents, seated selection and the Pressure System.

Pulse is independently authored. Riddle UI may inform competitive capability research, but NeoSmartUXUI MUST NOT copy or redistribute Riddle's Figma assets, palettes, layouts, icons, sections, component geometry or source files.

---

# 22. What a flavor owns

Flavor owns expression:

```text
palette defaults
typography preset
geometry
border weight
shadow direction
shadow strength
density
spacing personality
motion intensity
release characteristics
icon treatment
surface treatment
patterns

```

Flavor does **not** own:

```text
Button behavior
Dialog behavior
Product semantics
Checkout logic
Billing semantics
Seat management

```

Preferred implementation:

```text
theme.json
recipes.json
motion.json
typography.json

```

True renderer overrides should be exceptional.

---

# 23. What Core owns

Something belongs in Core if it can be accurately described without referencing a business domain.

Examples:

```text
Button
Input
Textarea
Select
Combobox
Checkbox
Radio
Switch
Tabs
Accordion

Dialog
AlertDialog
Drawer
Popover
Tooltip
Toast

Card
Badge
Avatar
Separator
Progress
Skeleton

AppShell
Sidebar
Topbar
Breadcrumb
Pagination

DataTable
FilterBar
Search
CommandMenu
StatCard
ChartShell

EmptyState
ErrorState
LoadingState
PartialFailure

Stepper
Timeline
ActivityFeed

FormSection
SettingsSection

Hero
FeatureGrid
FAQ
Testimonials
CTA
Footer
Navbar

```

Core may also contain generic reusable Blocks and page archetypes.

## 23.1 Component-first composition law

Blocks are composed from components. A thin primitive layer produces either weak Blocks or repeated one-off primitives hidden inside Blocks.

Therefore NeoSmartUXUI adopts this permanent dependency:

```text
Core contracts
    ↓
broad Core component system
    ↓
Core Blocks
    ↓
Vertical Blocks
    ↓
Pages
    ↓
Applications

```

As of September 22, 2026, the canonical Core registry contains **50 component contracts: 49 public-proof + 1 implemented-but-unproven (`core.description-list`)**. `core.list` remains the latest fully public-proof singleton. DescriptionList implementation is maintenance-protected: all ten official Light/Dark Theme scopes resolve **50 Core / 55 tokens** locally and the local preview matrix contains **267 real states**, while deployed/public authority remains the exact **49-component / 55-token / 266-state** List cohort. DescriptionList does not count toward public-proof breadth until exact-head implementation Quality, guarded merge, mandatory merged-main Quality, exact-artifact deployment, native Pages verification, live HTTPS verification, structural proof promotion, and mandatory merged-main proof Quality complete. This in-place Core/Component Lab work does **not** create a new product version or renumber the roadmap.

### Current Core component breadth gate

Core Blocks MUST NOT become the next major implementation track until the Core registry reaches:

```text
90+ distinct public-proof Core component contracts
```

**90 is the minimum floor.** The `+` is intentional: complete coherent component families even when that takes the registry beyond 90. Competitor counts remain living research benchmarks and do not automatically recalculate this target.

### What counts as one component

A capability counts toward the breadth gate only when it has:

```text
one stable Core registry ID
one canonical component contract
a real shipping adapter/implementation
declared state semantics
keyboard behavior where applicable
pointer/touch behavior where applicable
focus behavior
accessibility semantics
Light + Dark compatibility
official Flavor compatibility
Studio preview availability
browser QA
public-proof evidence

```

Variants, subparts, aliases, examples, visual presets, and differently styled copies of the same semantic component MUST NOT be counted as separate components merely to increase the number.

### Initial candidate coverage families

The current component-expansion inventory should cover at least these families:

```text
Forms + input
Selection
Navigation
Disclosure
Overlays
Feedback + status
Data display
Data interaction
Layout utilities
Media
Productivity
Accessibility helpers

```

Candidate additions include, subject to the Core admission test:

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

This list is a candidate inventory, not permission to bypass contract review. A candidate may be merged, split, renamed, rejected, or replaced if the canonical semantics require it. The breadth gate itself remains unchanged.

---

# 24. Core admission test

Ask:

> Can this capability be explained without mentioning a business domain?

If yes:

```text
Core candidate

```

If no:

```text
Vertical candidate

```

Examples:

```text
DataTable
→ Core

EmptyState
→ Core

ProductPrice
→ Commerce

CartLine
→ Commerce

PlanUsage
→ SaaS

WorkspaceSwitcher
→ SaaS

```

---

# 25. Core promotion rule

Never generalize purely because something *might* someday be reusable.

Use:

```text
specific vertical need
        ↓
implement correctly
        ↓
reuse appears
        ↓
generalize
        ↓
promote to Core

```

Exception:

If a requirement is obviously generic before implementation, build it in Core first.

---

# 26. Commerce vertical

Commerce should contain only Commerce knowledge.

Candidate domain capabilities:

```text
ProductPrice
ProductGallery
VariantSelector
LicenseSelector
QuantitySelector
CartLine
MiniCart
CheckoutSummary
PaymentRecovery
InvoiceDetails
OrderConfirmation
EntitlementDelivery
OrderStatus
LicenseStatus
SubscriptionManagement
OwnershipTransfer
RenewalState

```

Commerce Blocks:

```text
ProductGrid
ProductHero
CartDrawer
CheckoutPanel
PricingComparison
OrderSummary
OrderHistory
LicenseManagement
OwnershipOperations

```

Generic Button/Input/Card/etc. come from Core.

---

# 27. SaaS vertical strategy

Do **not** begin SaaS by building another component library.

First:

```text
SaaS requirements
        ↓
capability inventory
        ↓
Core comparison
        ↓
Core gap analysis

```

Likely generic Core requirements:

```text
DataTable
AppShell
CommandMenu
Charts
FilterBar
ActivityFeed
SettingsSection
PermissionMatrix
Progress
Stepper
DatePicker
Combobox
SavedView

```

SaaS-specific capabilities may include:

```text
PlanUsage
SeatManager
WorkspaceSwitcher
SubscriptionSummary
APIKeyManager
IntegrationCard
UpgradePrompt
OrganizationMember
AuditEntry

```

Every vertical should strengthen Core.

---

# 28. Theme architecture

Themes are primarily **data**, not forked components.

Canonical schema:

```json
{
  "schema": "neosmartui/theme@1",
  "name": "Hardline",
  "family": "neosmartuxui",
  "category": "neo-brutalist",

  "color": {},
  "typography": {},
  "geometry": {},
  "border": {},
  "shadow": {},
  "spacing": {},
  "density": {},
  "motion": {},
  "interaction": {},
  "icons": {}
}

```

One theme file powers:

```text
runtime CSS
Tailwind mappings
NeoSmartUXUI Studio
documentation
preview
registry
agent reasoning
exports
validation

```

---

# 29. NeoSmartUXUI Studio

The previous “Theme Studio” concept becomes:

# **NeoSmartUXUI Studio**

Theme creation is one major Studio capability.

Future Studio modules may include:

```text
Theme
Component preview
Block preview
Page preview
Motion
Accessibility
Agent trace

```

---

# 30. Studio theme workflow

User starts from:

```text
Hardline
Soft
Rivet
Mono
Community theme
Existing theme

```

Then customizes.

Nobody should need to construct a complete theme file manually.

---

# 31. Studio — Color

Controls include:

```text
canvas
surface
elevated surface

primary
secondary
accent

foreground
muted

border
shadow
focus

success
warning
danger
info

charts

```

Light and dark are first-class.

---

# 32. Studio — Typography

Semantic roles:

```text
display
heading
body
label
mono

```

Controls:

```text
font family
weight
fluid scale
tracking
line height
text transformation
minimum size
maximum size

```

---

# 33. Studio — Geometry

```text
square
micro
cut
notched
stepped
custom radius

```

Hardline should default strongly toward zero-radius/square geometry.

---

# 34. Studio — Border

```text
thickness
style
foreground relationship
interactive emphasis
focus relationship

```

---

# 35. Studio — Shadow Physics

Controls:

```text
direction
X offset
Y offset
spread

rest depth
hover depth
pressed depth

modal depth
floating depth

```

NeoSmartUXUI treats shadows as structural depth.

---

# 36. Studio — Interaction

Controls:

```text
hover travel
press travel

hover color reaction
press color reaction

shadow compression

release duration
release easing
rebound

selection latch

```

This is a major product differentiator.

---

# 37. Studio preview matrix

Users can preview by:

```text
Layer:
Component
Block
Page

Vertical:
Core
Commerce
SaaS
...

Viewport:
Desktop
Tablet
Mobile

Mode:
Light
Dark

State:
Default
Hover
Focus
Pressed
Selected
Loading
Empty
Error
Success
Disabled

Input:
Mouse
Touch
Keyboard

Accessibility:
Reduced Motion
Forced Colors
High Contrast

```

A token change updates real application surfaces.

---

# 38. Typography strategy

Do not build a proprietary font initially.

Build a curated open-source font registry.

Potential starting fonts:

```text
Inter
Public Sans
IBM Plex Sans
Space Grotesk
Archivo
Bricolage Grotesque
Syne
Atkinson Hyperlegible
IBM Plex Mono
JetBrains Mono
Space Mono

```

Requirements:

```text
verified license
metadata
supported weights
variable-font data
fallback stack
performance information

```

Custom font support should also exist.

---

# 39. Icon architecture

Lucide can be the initial default renderer.

Core references semantic icon IDs:

```text
icon.search
icon.cart
icon.close
icon.success
icon.warning
icon.copy

```

not direct third-party names throughout the application architecture.

Theme/flavor may influence:

```text
icon family
stroke width
weight
size

```

---

# 40. Canonical monorepo

Recommended repository:

```text
NeoSmartUXUI/neosmartuxui

```

Working structure:

```text
neosmartuxui/
│
├── spec/
│   ├── architecture/
│   ├── contracts/
│   ├── schemas/
│   ├── interaction/
│   ├── accessibility/
│   ├── governance/
│   └── roadmap/
│
├── packages/
│   ├── core/
│   │   ├── components/
│   │   ├── blocks/
│   │   ├── layouts/
│   │   └── page-archetypes/
│   │
│   ├── tokens/
│   ├── typography/
│   ├── icons/
│   ├── motion/
│   ├── contracts/
│   ├── registry/
│   ├── resolver/
│   │
│   ├── flavor-hardline/
│   ├── flavor-soft/
│   ├── flavor-rivet/
│   ├── flavor-mono/
│   │
│   ├── vertical-commerce/
│   └── vertical-saas/
│
├── apps/
│   ├── foundry/
│   ├── docs/
│   ├── showcase/
│   ├── studio/
│   ├── component-lab/
│   ├── block-lab/
│   ├── page-lab/
│   ├── motion-lab/
│   └── agent-lab/
│
├── tooling/
│   ├── cli/
│   ├── registry/
│   ├── resolver/
│   ├── generators/
│   ├── validators/
│   ├── migration/
│   └── visual-tests/
│
├── migration/
│
├── research/
│   └── competitors/
│
├── examples/
│   ├── commerce-hardline/
│   ├── commerce-soft/
│   └── commerce-rivet/
│
├── AGENTS.md
├── LLMS.md
└── README.md

```

Spec and implementation evolve under one SHA.

## 40.1 GitHub permanent-home contract

GitHub is a permanent part of the NeoSmartUXUI product architecture, not merely a temporary source host.

Canonical organization:

```text
https://github.com/neosmartuxui
```

Required repositories at platform start:

```text
neosmartuxui/neosmartuxui
→ canonical monorepo and source of truth

neosmartuxui/neosmartuxui.github.io
→ public Foundry / GitHub Pages deployment target
```

Do not create a repository per flavor, vertical, lab, or documentation surface unless a future release, ownership, security, or distribution requirement proves that a split is necessary.

The default rule is:

```text
one canonical source monorepo
+
one public deployment repository
```

If a new repository becomes necessary, the development workflow must identify that dependency before implementation work is blocked so it can be created and connected in advance.

## 40.2 Main-repository safety

The canonical repository must remain protected.

Expected development policy:

```text
main
├── no casual direct feature development
├── PR-based changes
├── required CI before merge
├── exact-SHA verification for release/QA claims
├── branch protection where GitHub plan/capabilities allow
└── tagged/versioned release discipline
```

Generated public-site output must not be committed into canonical `main` merely to publish GitHub Pages.

Preferred deployment flow:

```text
neosmartuxui/neosmartuxui
        ↓
build + test + validate
        ↓
GitHub Actions
        ↓
neosmartuxui/neosmartuxui.github.io
        ↓
neosmartuxui.com
```

A failed or broken public deployment must be recoverable without rewriting canonical source history.

## 40.3 NeoSmartUXUI Foundry

The root public experience is called:

# **NeoSmartUXUI Foundry**

The Foundry is the front door to the complete ecosystem.

Its root page at:

```text
https://neosmartuxui.com/
```

should explain and expose:

```text
NeoSmartUXUI
The AI-first neo-brutalist UI system.

Components → Blocks → Pages → Applications

FLAVORS
Hardline
Soft
Rivet
Mono

VERTICALS
Commerce
SaaS
future verticals

BUILD / CUSTOMIZE
NeoSmartUXUI Studio

BUILD WITH AI
Registry
NeoSmart Resolver
MCP
Agent Lab

EXPLORE
Components
Blocks
Pages
Motion
Themes
Docs
Roadmap
Research
```

The root should function as both product landing page and living system index.

## 40.4 Public live-surface contract

Every official system area must have a live, inspectable public surface.

At minimum:

```text
Core
Components
Blocks
Pages
Studio
Docs
Registry
Motion Lab
Agent Lab
```

Every **public-proof official flavor** must have live pages. Contract-only Flavor expansions do not become public starter surfaces until implementation and public proof:

```text
/flavors/hardline
/flavors/soft
/flavors/rivet
/flavors/mono
```

Each flavor surface should demonstrate, where applicable:

```text
foundations
components
blocks
pages
light
dark
responsive behavior
interaction states
real application examples
```

Every official vertical must also have live public pages:

```text
/verticals/commerce
/verticals/saas
...
```

A vertical page is not just a static gallery. It must eventually expose complete workflows and meaningful states.

Commerce, for example, should be able to demonstrate:

```text
Storefront
Product listing
Product detail
Cart
Checkout
Payment recovery
Order confirmation
Account
Orders
Licenses
Subscriptions
Ownership
```

with controls for:

```text
Flavor:
Hardline / Soft / Rivet / Mono

Viewport:
Desktop / Tablet / Mobile

Mode:
Light / Dark

State:
Normal / Loading / Empty / Error / Partial Failure / Success
```

where those states are meaningful.

## 40.5 Cross-flavor and cross-vertical proof

The public site is part of the architecture test.

A shared vertical implementation should be demonstrable under every compatible public-proof official flavor without changing its domain code. Contract-only Flavor expansions join this matrix only after their concrete Theme reaches public proof.

Example conceptual routes:

```text
/verticals/commerce?flavor=hardline
/verticals/commerce?flavor=soft
/verticals/commerce?flavor=rivet
/verticals/commerce?flavor=mono
```

If changing flavor breaks Commerce behavior, that is evidence of an architecture violation.

Likewise, Core components and Blocks should be demonstrated through the same shipping implementation across flavor previews rather than duplicated demo-only implementations.

## 40.6 Public information architecture

Target public structure:

```text
neosmartuxui.com
│
├── /
│   └── Foundry
│
├── /core
├── /components
├── /blocks
├── /pages
├── /studio
├── /docs
├── /agents
├── /registry
├── /research
├── /roadmap
│
├── /flavors/
│   ├── hardline
│   ├── soft
│   ├── rivet
│   └── mono
│
├── /verticals/
│   ├── commerce
│   └── saas
│
└── /labs/
    ├── components
    ├── blocks
    ├── pages
    ├── motion
    ├── themes
    └── agents
```

This information architecture may evolve, but the product rule does not:

> **Every official flavor and every official vertical must be publicly demonstrable through live pages.**

---

# 41. Package naming

Canonical package scope:

```text
@neosmartuxui/core
@neosmartuxui/tokens
@neosmartuxui/contracts
@neosmartuxui/registry
@neosmartuxui/motion
@neosmartuxui/react
@neosmartuxui/theme
@neosmartuxui/commerce
@neosmartuxui/saas

```

Possible flavor packages:

```text
@neosmartuxui/flavor-hardline
@neosmartuxui/flavor-soft
@neosmartuxui/flavor-rivet
@neosmartuxui/flavor-mono
@neosmartuxui/flavor-pulse

```

Only expose separate packages when distribution requires them.

Monorepo boundaries remain logical even if publishing strategy changes.

---

# 42. CLI naming

Canonical CLI:

```bash
npx neosmartuxui init

```

Additional commands:

```bash
npx neosmartuxui add button

npx neosmartuxui add commerce.cart-drawer

npx neosmartuxui theme

npx neosmartuxui validate

npx neosmartuxui inspect

npx neosmartuxui migrate

```

---

# 43. Frictionless human workflow

```bash
npx neosmartuxui init

```

Wizard:

```text
What are you building?

> Commerce
  SaaS
  Generic application
  Marketing site

```

Then:

```text
Choose a starting flavor

> Hardline
  Soft
  Rivet
  Mono
  Pulse
  Custom

```

Then:

```text
Choose framework

> React
  Next.js
  Other

```

NeoSmartUXUI resolves:

```text
Core
Vertical
Flavor
Theme
Tokens
Registry
Dependencies

```

---

# 44. Machine-readable component contract

Every component has stable identity.

Example:

```json
{
  "schema": "neosmartui/component@1",
  "id": "core.button",

  "layer": "component",
  "domain": "core",

  "intent": "Trigger an action",

  "states": [
    "default",
    "hover",
    "focus-visible",
    "pressed",
    "loading",
    "disabled"
  ],

  "dependencies": [],

  "supports": {
    "keyboard": true,
    "touch": true,
    "rtl": true,
    "reducedMotion": true,
    "forcedColors": true
  }
}

```

---

# 45. Stable namespace strategy

Internal semantic IDs remain short and stable:

```text
core.button
core.dialog
core.data-table

core.block.hero
core.block.filter-toolbar

commerce.product-price
commerce.cart-line

commerce.block.product-grid
commerce.page.checkout

saas.plan-usage
saas.seat-manager

flavor.hardline
flavor.soft
flavor.rivet
flavor.mono

```

The schema identifies the NeoSmartUXUI ecosystem.

Example:

```text
neosmartui/component@1
neosmartui/block@1
neosmartui/page@1
neosmartui/theme@1

```

Avoid unnecessarily verbose IDs such as:

```text
neosmartuxui.core.component.button

```

inside everyday composition manifests.

---

# 46. NeoSmart Resolver

A major platform subsystem becomes:

# **NeoSmart Resolver**

Agents should not blindly search files and improvise.

Pipeline:

```text
USER INTENT
     ↓
Intent Parser
     ↓
Vertical Resolver
     ↓
Capability Resolver
     ↓
Core Registry
     ↓
Vertical Registry
     ↓
Block/Page Resolver
     ↓
Flavor Resolver
     ↓
Theme Resolver
     ↓
Framework Resolver
     ↓
Composition Plan
     ↓
Validation
     ↓
CODE

```

---

# 47. Agent request example

Request:

> Build a SaaS billing page in purple with sharp edges and strong physical button presses.

Resolver:

```json
{
  "vertical": "saas",

  "page": "saas.page.billing",

  "blocks": [
    "saas.block.subscription-summary",
    "saas.block.usage-overview",
    "saas.block.payment-method",
    "saas.block.invoice-history"
  ],

  "core": [
    "core.tabs",
    "core.data-table",
    "core.button",
    "core.dialog"
  ],

  "flavor": "hardline",

  "themeOverrides": {
    "primary": "purple",
    "geometry": "square",
    "interaction.pressIntensity": "strong"
  }
}

```

No invented components unless a registry gap is proven.

---

# 48. Agent laws

Every NeoSmartUXUI coding agent follows:

```text
DISCOVER before inventing.

COMPOSE before duplicating.

CORE before vertical duplication.

VERTICAL before application duplication.

TOKENS before hardcoded styling.

CONTRACTS before assumptions.

STATE AUTHORITY before demo copy.

ACCESSIBILITY before visual polish.

VALIDATE before completion.

EXPLAIN selection when automation makes architectural decisions.

```

---

# 49. Anti-guess contract

Agents MUST NOT:

```text
invent an existing component

invent domain state

invent provider fields

invent theme token names

duplicate a block under another name

hardcode flavor values

skip accessibility states

silently fork Core behavior

guess dependencies

```

When no valid capability exists:

```text
REGISTRY GAP

```

The system then determines:

```text
Core candidate?
Vertical candidate?
Application-specific?

```

---

# 50. Agent-native definition

NeoSmartUXUI is **agent-native** when an authorized agent can:

```text
discover
understand
select
compose
install
theme
validate
explain

```

without relying on screenshots or human guesses.

This should become a measurable product requirement.

---

# 51. Agent Lab

NeoSmartUXUI includes a permanent:

# **Agent Lab**

It exposes:

```text
request
↓
intent
↓
vertical selection
↓
capabilities
↓
selected components
↓
selected blocks
↓
selected page
↓
flavor
↓
theme
↓
framework
↓
validation

```

Agent behavior should be inspectable.

---

# 52. MCP

NeoSmartUXUI MCP should expose structured functions around:

```text
search capabilities
resolve intent
fetch contract
fetch examples
fetch states
fetch Block
fetch Page
resolve dependencies
install
validate composition
validate theme

```

MCP is not merely repository search.

It becomes an interface to the NeoSmart Resolver.

---

# 53. Existing work preservation

No existing repository is deleted at migration start.

Existing sources include:

```text
NeoBrutalism-shop/spec

NeoBrutalism-shop/NeoBrutal-Soft

NeoBrutalism-shop/NeoBrutal-Commerce

NeoBrutalRivet/NeoBrutal-Rivet

```

These become migration sources.

They remain active enough for:

```text
security fixes
critical defects
migration support
documentation pointers

```

but future architecture development moves to NeoSmartUXUI.

---

# 54. Migration ledger

Every artifact receives one status:

```text
ADOPT
Use essentially unchanged.

ADAPT
Preserve but conform to NeoSmartUXUI contracts.

PROMOTE
Move from a vertical/flavor into Core.

REWRITE
Preserve knowledge while rebuilding implementation.

RETIRE
Superseded or duplicate.

REFERENCE
Historical/testing source only.

```

Nothing simply disappears.

---

# 55. Migration manifest

Create:

```text
migration/inventory.json

```

Example:

```json
{
  "sourceRepo": "NeoBrutal-Commerce",
  "sourcePath": "...",
  "sourceSha": "...",

  "type": "component",

  "oldId": "...",
  "newId": "core.button",

  "decision": "adapt",

  "preserve": [
    "keyboard behavior",
    "tests",
    "state contract"
  ],

  "reason": "...",

  "status": "pending"
}

```

---

# 56. Provenance

Every migrated artifact records:

```text
source repository
source path
source SHA
source license
third-party attribution
migration decision
new destination
replacement ID

```

Tests retain provenance too.

A regression test that once caught a real defect is valuable knowledge.

---

# 57. Legacy freeze strategy

Before migration, capture exact:

```text
repository
branch
SHA

component registry
Block registry
Page registry

tokens
themes
states
actions

tests
screenshots

CI workflows

licenses
third-party notices

agent contracts

```

Create a migration checksum manifest.

Legacy feature expansion stops.

Critical maintenance remains allowed.

---

# 58. Current Commerce checkpoint

Current canonical Commerce migration source:

```text
24563484a9993c6c994f24114dc7956d3b93f694

```

Commerce knowledge worth preserving includes:

```text
47 component contracts
Block architecture
Page architecture
Motion Lab
Agent Execution Lab
runtime states
normalized actions
provider models
ownership lifecycle
cross-browser QA
accessibility gates

```

Commerce should become:

> a migration gold mine and future NeoSmartUXUI Commerce vertical.

---

# 59. Source-of-truth drift to eliminate

Counts and feature status must not be manually repeated across multiple files.

Bad:

```text
README says 18 Blocks
registry says 25 Blocks
website says 21 Blocks

```

New architecture:

```text
registry
   ↓
generated outputs
   ↓
README
docs
website
CLI
MCP
Studio
scorecard

```

One authority.

---

# 60. Migration M0 — Freeze & Capture

Deliver:

```text
legacy repository SHA map

migration checksum

asset inventory

licenses

test inventory

visual reference inventory

```

No meaningful migration begins without this.

---

# 61. Migration M1 — NeoSmartUXUI Foundation

Create canonical repository and workspace.

Foundation includes:

```text
workspace
TypeScript configuration
lint
format
test runner
Playwright
visual regression
schema validation
registry build
docs application
release infrastructure
dependency-boundary enforcement

```

No rush to copy visual components.

---

# 62. Migration M2 — NeoSmartUXUI Spec v1

Define:

```text
Core
Flavor
Theme
Vertical
Component
Block
Page
Application
Adapter
Agent
Resolver

```

Correct old taxonomy:

```diff
- Commerce = flavor
+ Commerce = vertical

```

Preserve proven tactile laws.

---

# 63. Migration M3 — Capability Inventory

Combine:

```text
Rivet
Soft
Commerce
Spec

```

Map conceptual equivalence.

Example:

```text
Rivet Button
Soft Button
Commerce button behavior
        ↓
core.button

```

Do not simply crown one legacy version as the Core implementation.

Harvest best behavior from all sources.

---

# 64. Migration M4 — Core Build

Every Core component requires:

```text
1. contract

2. semantic token map

3. accessibility contract

4. responsive contract

5. state contract

6. implementation

7. tests

8. live preview

9. registry metadata

10. agent usage examples

11. official-flavor proof

```

A component is incomplete without the contract surrounding it.

---

# 65. Migration M5 — Flavor Extraction

Convert legacy visual-system duplication into:

```text
theme data
recipes
motion personality
geometry
typography

```

Initial flavors:

```text
Hardline
Soft
Rivet
Mono

```

---

# 66. Migration M6 — Commerce

Separate generic capability from Commerce knowledge.

Generic:

```text
→ Core

```

Commerce-specific:

```text
→ packages/vertical-commerce

```

Port:

```text
models
actions
states
adapters
domain components
Blocks
Pages
recipes
agent metadata
tests

```

Commerce must successfully render using:

```text
Hardline
Soft
Rivet
Mono

```

without changing Commerce business logic.

---

# 67. Migration M7 — NeoSmartUXUI Studio

Build Studio on the actual theme schema.

No preview-only hidden implementation.

Initial Studio features:

```text
preset themes
colors
fonts
geometry
borders
shadow physics
Pressure System
motion
density
light/dark
state previews
vertical previews
responsive previews
accessibility score
theme diff
save
share
import
export

```

---

# 68. Migration M8 — Agent Platform

Build:

```text
NeoSmart Resolver

registry API

CLI

MCP

agent recipes

anti-guess validator

composition traces

automatic install

Agent Lab

```

This is where “Smart” becomes fully operational.

---

# 69. Development roadmap

## v0.1 — Foundation

Exit:

```text
NeoSmartUXUI monorepo

GitHub permanent-home contract

NeoSmartUXUI Foundry deployment baseline

canonical source/deployment separation

Spec v1

schemas

stable namespaces

migration ledger

registry architecture

CI baseline

package boundaries

```

---

## v0.2 — Core

Exit:

```text
Core foundations

generic component migration

component contracts

state matrices

accessibility

responsive system

Component Lab

```

No arbitrary component-count race.

---

## v0.3 — Flavor Engine

Exit:

```text
neosmartui/theme@1

Hardline

Soft

Rivet

Mono

light/dark

typography

icons

geometry

shadow

motion

Pressure System

```

---

## v0.4 — NeoSmartUXUI Studio

Exit:

```text
visual theme editing

fonts

colors

edges

shadows

Pressure System controls

motion

state previews

responsive previews

import/export

theme validation

```

---

### Current Lab delivery status

The product/Lab roadmap remains unchanged while the Core component library expands:

```text
Component Lab ✅
Dedicated Theme Gallery/Lab ⏳
Blocks Lab ⏳
Pages Lab ⏳
Vertical/SaaS/Commerce previews ⏳
```

The **Component Lab is complete as a delivered surface**. Adding more canonical components extends the library shown by that Lab; it does not reopen or rename the Lab milestone.

NeoSmartUXUI Studio is also complete through public launch, but Studio completion does **not** mean the separate **Dedicated Theme Gallery/Lab** is complete.

### Current Core component expansion workstream — no roadmap renumbering

Purpose:

> Broaden the existing Core component library so later Blocks can primarily compose proven generic primitives instead of inventing hidden one-off primitives.

Current registry state on September 20, 2026:

```text
44 registered Core component contracts
=
44 public-proof components
```

Only public-proof components count toward the breadth gate.

Current breadth target:

```text
90+ distinct public-proof Core components
```

This is a fixed product floor for the current expansion. Competitor analysis remains active and may influence capability priorities, but it does not lower or mechanically recalculate the 90+ target.

This is an engineering workstream inside the existing Core/Component Lab architecture, **not v0.5 and not a new top-level milestone**.

A counted component still requires:

```text
one stable Core registry ID
one canonical component contract
real shipping implementation/adapter
explicit state semantics
keyboard behavior where applicable
pointer/touch behavior where applicable
focus behavior
accessibility semantics
Light + Dark compatibility
all public-proof official Flavor compatibility (Hardline / Soft / Rivet / Mono / Pulse)
Component Lab / Studio preview
browser QA
public-proof evidence
```

Variants, aliases, examples, visual presets, subparts, and renamed copies do not count separately.

The roadmap may exceed the target when a coherent component family should be completed together. Do not stop halfway through a family merely because the numeric gate was reached.

The existing roadmap now continues without renumbering.

---

## v0.5 — Core Blocks

Dependency:

```text
current Core component breadth gate = green
```

Exit:

```text
marketing Blocks

application Blocks

content Blocks

Block Lab

machine-readable Block composition

Blocks built primarily from canonical Core components

no hidden one-off primitive system inside Blocks
```

---

## v0.6 — Commerce Vertical

Exit:

```text
Commerce models

Commerce domain components

Commerce Blocks

Commerce Pages

real application journey

all official flavors

complete state model
```

---

## v0.7 — Smart Agent Platform

Exit:

```text
NeoSmart Resolver

registry API

CLI

MCP

AGENTS.md

LLMS.md

composition recipes

anti-patterns

explainable selection

Agent Lab
```

---

## v0.8 — Distribution

Exit:

```text
source-copy registry

package strategy

shadcn-compatible workflow where useful

documentation

versioning

migration tooling

examples
```

---

## v0.9 — Hardening

Exit:

```text
Chromium
Firefox
WebKit

visual regression

forced colors

RTL

localization

performance budgets

theme conformance

vertical conformance

agent conformance

migration completeness
```

---

## v1.0 — NeoSmartUXUI Stable

Stable contracts for:

```text
Core

Theme

Flavors

Registry

Resolver

Agent behavior

Commerce

CLI

Studio
```

---

## v1.1 — SaaS Discovery

Sequence:

```text
SaaS requirements
        ↓
capability inventory
        ↓
Core gap analysis
        ↓
Core expansion
        ↓
SaaS domain layer
        ↓
SaaS Blocks
        ↓
SaaS Pages

```

---

# 70. Pull-request execution plan

Initial architectural sequence:

```text
PR 01
NeoSmartUXUI monorepo scaffold

PR 02
Spec architecture + corrected taxonomy

PR 03
Schemas + stable IDs

PR 04
Legacy snapshot + migration inventory tooling

PR 05
Token architecture

PR 06
Pressure System contract

PR 07
Typography + icon registries

PR 08
First Core foundation batch

PR 09
Component Lab

PR 10
Hardline flavor

PR 11
Soft migration

PR 12
Rivet migration

PR 13
Mono flavor

PR 14+
remaining Core capability migration

```

The historical sequence above is preserved as provenance. The current component-library work is an in-place expansion inside the existing Core/Component Lab milestone:

```text
Expansion A
inventory + stable contracts

Expansion B
Forms / selection expansion

Expansion C
Overlay / navigation / disclosure expansion

Expansion D
Data display / data interaction / layout expansion

Expansion E
Productivity / advanced interaction expansion

Expansion F
competitive recount + coverage audit + complete public proof
```

This work does **not** consume a new roadmap version. The dedicated Lab backlog remains:

```text
Component Lab ✅
Dedicated Theme Gallery/Lab ⏳
Blocks Lab ⏳
Pages Lab ⏳
Vertical/SaaS/Commerce previews ⏳
```

After the in-place Core expansion and the remaining dedicated Theme Gallery/Lab work, the versioned roadmap resumes at **v0.5 Core Blocks**. Commerce remains **v0.6**.

---

# 71. Quality contract

Every Core component must prove:

| Gate Requirement   |                                   |
| ------------------ | --------------------------------- |
| Contract           | Valid NeoSmartUXUI schema           |
| States             | Explicit state matrix             |
| Keyboard           | Proven                            |
| Touch              | Proven                            |
| Focus              | Proven                            |
| Reduced motion     | Proven                            |
| Forced colors      | Proven                            |
| RTL                | Where applicable                  |
| Responsive         | Proven                            |
| Light              | Proven                            |
| Dark               | Proven                            |
| Flavor conformance | All official flavors              |
| Agent metadata     | Complete                          |
| Browser            | Chromium + Firefox + WebKit       |
| Accessibility      | Automated + contract/manual proof |
| Visual             | Reference proof                   |
| Registry           | Registered                        |
| Resolver           | Discoverable/selectable           |
| Public proof       | Live canonical preview where applicable |

---

# 72. Theme conformance

A published theme must pass:

```text
contrast

focus visibility

font legibility

depth coherence

hover distinction

pressed distinction

selected distinction

disabled distinction

danger distinction

light/dark completeness

reduced-motion behavior

```

Customization cannot silently destroy usability.

---

# 73. NeoSmartUXUI Theme Health

Studio can expose:

```text
Theme Health

Contrast           A
Interaction        A
Hierarchy          A
Dark Mode          A
Typography         B+
Accessibility      A
NeoBrutal Identity A
Agent Readiness    A

Overall            A

```

---

# 74. Competitive research system

Canonical living research home:

```text
research/competitors/
```

Current structure:

```text
research/competitors/
  README.md
  index.json

  neobrutalism-com/
    snapshot-2026-09-20.json

  neobrutalism-dev/
    components-2026-09-20.json

  <future-competitor>/
    snapshot-YYYY-MM-DD.json
```

New competitors are added under stable independent slugs. Do not merge evidence from different products simply because their names or visual categories overlap.

The research system should grow to include, as evidence becomes available:

```text
components
Blocks
Pages/templates
themes
interactions
DX
accessibility
agent/MCP experience
framework/primitive coverage
Figma/design assets
pricing/licensing
vertical depth
public proof
changelog/history
```

---

# 75. Competitor profile schema

Example current snapshot:

```json
{
  "competitor": "neobrutalism.com",
  "checkedAt": "2026-09-20",
  "metrics": {
    "componentsAdvertised": "50+",
    "uniquePublicComponentDocLinks": 57,
    "blocksAdvertised": 158,
    "blockCategoriesAdvertised": 22,
    "templatesAdvertised": 6
  },
  "capabilities": {
    "themeBuilder": true,
    "templates": true,
    "mcp": true,
    "figma": true,
    "rtl": true,
    "darkMode": true,
    "radixUi": true,
    "baseUi": true,
    "reactAria": true
  },
  "observations": [],
  "opportunities": []
}
```

Competitor numbers must always have timestamps and source evidence. Advertised counts and exact discoverable counts are tracked separately.

Current first-party evidence:

- `research/competitors/neobrutalism-com/snapshot-2026-09-20.json`
- `research/competitors/neobrutalism-dev/components-2026-09-20.json`

The current NeoSmartUXUI Core target remains **90+ public-proof components** regardless of the lower component counts in these snapshots.

---

# 76. Competitive scorecard

Track:

```text
Component quality
Component breadth
Block breadth
Application depth
Vertical intelligence
Theme customization
Interaction quality
Accessibility
Developer experience
Agent experience
Resolver intelligence
Documentation
Performance
Responsive quality
Community
Distribution
Visual distinctiveness

```

---

# 77. Competitive watch

Monitor:

```text
new components
new blocks
theme functionality
templates
pricing
MCP
framework support
GitHub releases
installation flow
agent features
Figma features
community traction

```

But never automatically imitate.

Decision questions:

```text
Does the feature solve a real problem?

Does it fit NeoSmartUXUI architecture?

Can NeoSmartUXUI solve the underlying problem better?

```

---

# 78. Tweakcn benchmark

A basic Theme Studio must assume these features are table stakes:

```text
live preview
presets
colors
typography
radius
spacing
shadows
contrast
export
AI theme generation

```

NeoSmartUXUI Studio differentiates through:

```text
interaction physics

Pressure System

state color

vertical-aware preview

Page preview

responsive state matrix

accessibility validation

theme conformance

theme versioning

theme diff

agent-readable output

```

---

# 79. Valid competitive inspiration

Concepts we may learn from:

```text
fast installation
live previews
source ownership
shareable themes
large Block libraries
MCP integration
clear documentation

```

Do not copy proprietary implementations.

---

# 80. Things not to copy

Do not reproduce:

```text
competitor palette

exact button transforms

exact shadows

exact layouts

exact names

exact Page composition

component code

theme presets

marketing copy

```

NeoSmartUXUI must have its own visual and interaction identity.

---

# 81. Visual manifesto

## Sharp

Structure is visible.

## Touchable

Interactive controls look physically usable.

## Pressure, not levitation

Hover begins compression.

Press completes it.

## Chromatic

Color can react strongly to state.

## Seated selection

Selected UI locks into its structure.

## Stable content

Static content remains stable.

## Immediate

Actions acknowledge input immediately.

## Fluid

Typography and spacing scale naturally.

## Honest

Loading, error and partial failure are real designed states.

## Accessible

Accessibility is structural.

## Smart

Interfaces are understandable to authorized agents without guessing.

---

# 82. State-completeness moat

Blocks and Pages should support meaningful production states:

```text
normal

loading

empty

error

partial failure

success

disabled

offline / retry
where appropriate

```

Production completeness is more valuable than decorative breadth.

---

# 83. Vertical moat

Commerce understands:

```text
cart
checkout
invoice
payment recovery
entitlement
license
renewal
seat
activation
ownership
transfer
subscription

```

SaaS understands:

```text
workspace
organization
seat
permission
usage
plan
billing
API key
integration
audit history

```

This domain knowledge is difficult to replicate with a generic component catalogue.

---

# 84. Agent moat

Typical component-library agent flow:

```text
search
preview
install

```

NeoSmartUXUI target:

```text
understand intent

select vertical

resolve capability

reuse Core

compose Blocks

compose Page

select flavor

configure theme

resolve dependencies

produce code

validate accessibility

validate architecture

validate theme

explain decisions

```

---

# 85. NeoSmartUXUI Studio moat

Studio should eventually own:

```text
theme design

interaction physics

Pressure System

state colors

shadow compression

release behavior

selected-state seating

vertical Pages

state previews

theme quality scoring

agent-readable themes

theme versioning

```

---

# 86. Success metrics

## Architecture

```text
0 duplicated generic components across verticals

100% stable IDs

100% registry-backed public counts

100% published themes valid

100% public-proof official flavors have live public surfaces

100% released verticals have live public surfaces

```

## Components

```text
100% explicit required states

100% keyboard contracts

100% accessibility evidence

100% public-proof official-flavor coverage

```

## Agent

```text
≥95% correct reuse
on curated architecture evaluation

0 invented registry IDs

0 silently fabricated domain states

100% composition traces

```

## Studio

```text
themes created without code

all exports validate

Core + vertical previews

light/dark together

```

## Migration

```text
100% legacy artifacts inventoried

100% migration decisions recorded

0 valuable work silently lost

100% retained third-party provenance

```

---

# 87. Smart-specific success metrics

NeoSmartUXUI should additionally measure:

```text
intent resolution accuracy

component selection accuracy

Block selection accuracy

vertical classification accuracy

theme conformance rate

registry-gap false positive rate

agent architecture violation rate

explanation trace completeness

```

“AI-first” should be measurable.

---

# 88. Non-goals for v1

NeoSmartUXUI v1 does not require:

```text
our own proprietary font

every framework

every possible vertical

hundreds of arbitrary components

decorative animation everywhere

perfect backward compatibility
with every experimental legacy implementation

```

Quality over inflated breadth.

---

# 89. Risks

## Giant Core

Use domain-free description test.

## Flavor forks

Prefer data/recipes over renderer duplication.

## Monorepo coupling

Enforce package dependency boundaries.

## Rewrite fever

Require migration ledger.

## Competitor-count chasing

Measure capability and workflow quality.

## Broken custom themes

Theme guardrails and conformance.

## Agent hallucination

Registry + Resolver + anti-guess contract.

## “Smart” becoming marketing fluff

Tie every “Smart” claim to measurable agent functionality.

---

# 90. Repository authorities

```text
spec/schemas/*
→ schema authority

registry/components.json
→ component identity

registry/blocks.json
→ Block identity

registry/pages.json
→ Page identity

registry/flavors.json
→ official flavor identity

registry/verticals.json
→ vertical identity

registry/themes.json
→ official theme identity

packages/tokens
→ token implementation

packages/motion
→ Pressure System implementation

packages/resolver
→ selection/composition logic

AGENTS.md
→ agent workflow authority

LLMS.md
→ concise machine guidance

neosmartuxui/neosmartuxui
→ canonical source authority

neosmartuxui/neosmartuxui.github.io
→ generated public deployment only; never source authority

```

---

# 91. SEO and discovery strategy

The brand is:

# NeoSmartUXUI

The category descriptors remain search-oriented.

Homepage / Foundry title:

> **NeoSmartUXUI — AI-First Neo-Brutalist UI/UX Design System**

The root `neosmartuxui.com` page is the **NeoSmartUXUI Foundry**: the product landing page and live index of Core, flavors, verticals, Studio, labs, registry, agents, docs, and roadmap.

Potential category pages:

```text
/neobrutalism

/neobrutal-ui-components

/neobrutal-design-system

/ai-ui-design-system

/agent-native-ui

/neobrutal-theme-builder

/neobrutal-commerce

/neobrutal-saas

```

Component page title example:

> **Neo-Brutalist Button Component — NeoSmartUXUI**

Studio:

> **Neo-Brutal Theme Builder — NeoSmartUXUI Studio**

Commerce:

> **Neo-Brutal Ecommerce UI System — NeoSmartUXUI Commerce**

Brand and SEO category remain separate.

---

# 92. Product naming conventions

Use:

```text
NeoSmartUXUI

```

Avoid:

```text
Neosmartui
Neo Smart UI
NeoSmart Ui
NEOSMARTUXUI

```

Technical slug:

```text
neosmartuxui

```

Product family:

```text
NeoSmartUXUI Core
NeoSmartUXUI Studio
NeoSmartUXUI Registry
NeoSmartUXUI Resolver
NeoSmartUXUI MCP
NeoSmartUXUI Commerce
NeoSmartUXUI SaaS

```

---

# 93. Relationship to NeoSmartApps

NeoSmartApps should dogfood NeoSmartUXUI.

```text
NeoSmartUXUI
        ↓
used to build
        ↓
NeoSmartApps products
        ↓
real requirements
        ↓
improve NeoSmartUXUI Core

```

This creates a valuable feedback loop.

NeoSmartUXUI does not become a theoretical component gallery.

It is tested in real AI-first software.

---

# 94. Canonical architectural statement

> **NeoSmartUXUI is not a collection of separate Soft, Rivet, Commerce and SaaS design systems.**

It is:

> **One agent-native UI architecture with reusable Core capabilities, configurable physical/visual flavors, domain-aware verticals, versioned themes and machine-readable composition contracts.**

---

# 95. Canonical product statement

> **NeoSmartUXUI is the AI-first neo-brutalist UI platform for humans and agents.**

It combines:

```text
Core
+
Flavors
+
Themes
+
Verticals
+
Studio
+
Registry
+
Resolver
+
MCP
+
Quality Contracts

```

to build complete interfaces.

---

# 96. First execution action

The first implementation slice should be:

```text
Create/verify NeoSmartUXUI canonical monorepo
+
create/verify neosmartuxui.github.io public deployment repository
+
establish canonical-source vs generated-deployment contract
+
scaffold the NeoSmartUXUI Foundry deployment baseline
+
freeze legacy development
+
snapshot exact legacy SHAs
+
create migration/inventory.json
+
write NeoSmartUXUI Spec v1

```

Do **not** begin by copying:

```text
47 Commerce components
or
61 Rivet contracts

```

into the new Core.

Define the destination architecture first.

Harvest second.

---

# 97. Immediate repository transition

Recommended state:

```text
NeoSmartUXUI/
├── neosmartuxui
│   └── canonical monorepo / source of truth
│
└── neosmartuxui.github.io
    └── generated GitHub Pages / Foundry deployment

neosmartuxui.com
└── public domain pointing to the Foundry

```

Existing repositories initially remain available:

```text
NeoBrutalism-shop/spec

NeoBrutalism-shop/NeoBrutal-Soft

NeoBrutalism-shop/NeoBrutal-Commerce

NeoBrutalRivet/NeoBrutal-Rivet

```

Their new status becomes:

```text
migration source
maintenance only

```

Do not archive them until migration completeness is proven.

---

# 98. Execution priority

The top-level roadmap remains unchanged by the current component-library expansion.

Current Lab delivery status:

```text
Component Lab ✅
Dedicated Theme Gallery/Lab ⏳
Blocks Lab ⏳
Pages Lab ⏳
Vertical/SaaS/Commerce previews ⏳
```

Current engineering focus:

```text
expand the canonical Core component library
inside the existing Core / Component Lab architecture
→ move contract-only components through implementation and proof
→ reach the production-grade breadth gate
→ preserve contracts, accessibility, Flavor/Theme coverage,
  browser QA, Studio visibility and public proof
```

This work does **not** become a new numbered product phase.

The unchanged versioned sequence after the completed v0.4 Studio milestone is:

```text
v0.5 Core Blocks
v0.6 Commerce Vertical
v0.7 Smart Agent Platform
v0.8 Distribution
v0.9 Hardening
v1.0 Stable
v1.1 SaaS Discovery
```

Execution rule:

> **Expand Core without renumbering the roadmap. Do not inflate the component count with aliases, variants or hidden one-off primitives.**

---

# 99. Permanent migration rule

> **Restart the architecture, not the knowledge.**

Every useful lesson from:

```text
Spec
Rivet
Soft
Commerce

```

survives unless deliberately rejected with a documented reason.

This includes:

```text
code
contracts
tests
bugs
CI failures
browser fixes
accessibility fixes
interaction experiments
documentation
domain knowledge

```

Failures are knowledge too.

---

# 99.1 Permanent GitHub and deployment rule

> **GitHub is NeoSmartUXUI's permanent engineering and public proof home.**

The canonical monorepo owns source, contracts, history, tests, and development authority.

The GitHub Pages repository owns generated deployment output only.

All official flavors and released verticals must remain live and inspectable.

The permanent delivery principle is:

> **Source once. Demonstrate everywhere.**

A public demo must not be maintained as a separate visual imitation of shipping code when the real implementation can be rendered directly.

---

# 100. Final product destination

Eventually a user should be able to say:

```text
BUILD
Commerce

STYLE
Hardline

BRAND
My colors + fonts

FRAMEWORK
React

GENERATE

```

NeoSmartUXUI resolves:

```text
NeoSmartUXUI Spec
+
Core
+
Commerce
+
Hardline
+
Custom Theme
+
React Adapter
+
Accessibility contracts
+
Agent validation

```

and creates the implementation.

The same product can later switch:

```text
Hardline
↓
Soft

```

without rewriting Commerce.

A coding agent can build the same application because the entire architecture is machine-readable.

That is NeoSmartUXUI.

---

# 101. Product promise

> **NeoSmartUXUI makes distinctive interfaces understandable to both humans and machines.**

Humans choose intent and personality.

Agents understand the architecture.

Core prevents duplication.

Verticals provide domain intelligence.

Flavors provide personality.

Themes provide branding.

Studio provides control.

The Resolver provides intelligence.

Contracts preserve correctness.

Quality gates preserve trust.

That is the platform we are building.

**Current-host proof-only admission (October 22, 2026):** The native DescriptionList has completed exact-source QA, guarded Foundry publication, 105/105 generated/Pages/live asset SHA-256 parity and the 54 historical-subject live migration verifier. The versioned `neosmartuxui/public-proof-cohort@2` evidence in `evidence/current-host/cohort-v2.json` records **50 public-proof Core contracts and five official Flavor subjects** against already deployed source `ec0a720813565270bceee1191d1d6a9c77cede36` and Pages commit `6ecd5e21b8d7817d9b73526a14d17e790d2ea6cb`. It retains the **267-state** preview matrix and the exact **55-token** semantic union. The old 54 historical v1 proof files and five maintenance files remain immutable provenance; no GitHub Actions or npm publication is used. The proof-only source commit does not rebuild or redeploy Pages.

## Expansion D scroll/resize continuation — October 23, 2026

The 50-component public-proof source and Pages cohort remains authoritative and immutable. The registry now has **one additional, separately identified contract-only candidate: `core.scroll-area`**, making 51 registered contracts but still exactly **50 public-proof**. Its native scroll semantics and input/accessibility boundaries are defined by `packages/core/components/scroll-area.{json,md}`. No CSS/JavaScript implementation, Studio preview, token additions or public proof are claimed. The next step is implementation under the five official Light/Dark Flavor maintenance discipline, followed by exact browser acceptance and a newly verified public-proof cohort; Resizable is the next scroll/resize candidate after ScrollArea.
