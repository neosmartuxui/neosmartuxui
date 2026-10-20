# NeoSmartUI Studio Contract

**Roadmap:** v0.4 NeoSmartUI Studio  
**Contract checkpoint:** contract-only  
**Runtime status:** Studio Theme editor maturity: `implemented`. Contract, shared Component-preview, shared Theme-package, isolated runtime, and full resolved semantic-control checkpoints are complete.

This contract is subordinate to `docs/CANONICAL-PRD.md`. If this document and the Canonical PRD diverge, the Canonical PRD wins.

## 1. Product boundary

NeoSmartUI Studio is the human-facing editing and inspection surface for canonical NeoSmartUI authorities. It is not a second design system, second Theme engine, second token registry, or preview-only implementation layer.

Theme creation is the first Studio module. Future modules may expose Component, Block, Page, Motion, Accessibility, and Agent-trace capabilities only when the corresponding canonical contracts and registries exist.

The roadmap dependency remains:

```text
v0.3 Flavor Engine
→ v0.4 NeoSmartUI Studio
→ v0.5 Core Blocks
→ later Verticals / Pages / Agent platform
```

Studio must consume what exists at its current roadmap point. It must not pull later roadmap concepts forward as fake runtime capability.

## 2. Canonical Theme authority

**ONE LOGICAL THEME, THREE CANONICAL FILES.**

A logical editable Theme is represented by the existing canonical package:

1. `theme.json` — `neosmartui/theme@1`
2. `resolution.json` — `neosmartui/theme-resolution@1`
3. `tokens.json` — `neosmartui/resolved-token-bundle@1`

Studio may present these three files as one coherent editing experience, but it must preserve their identities and relationships.

**Theme is data, not forked components.**

Studio must not introduce:

- `studio-theme.json`;
- `studio-theme.schema.json`;
- a duplicate Studio token registry;
- a hidden fallback token layer;
- component-local magic values that bypass semantic token authority;
- a Studio-only runtime CSS/token mapping authority;
- a renderer, route, Flavor, Vertical, or domain fork created only for editing.

Core owns semantic token meaning. Theme remains the final concrete value-resolution boundary.

## 3. Shared validation and resolution law

Studio is a consumer of repository validation, not a bypass around it.

Generic Theme-package validation is implemented as browser-safe shared contract code so CI/tooling and Studio call the same semantic rules. Official Flavor validators retain exact official-palette/mechanics assertions; those exact-value rules are not universal custom-Theme rules.

The shared Theme-package boundary must validate, at minimum:

- exact schema identities and Theme/Flavor identity relationships;
- canonical `tokens.json` resolution binding;
- exact component scope against supplied canonical contracts;
- resolved token IDs, uniqueness, known authority, and token type;
- exact dependency union: no missing required tokens and no padding with unused invented tokens;
- safe resolved-token value grammar before CSS generation;
- Pressure System coherence;
- minimum interactive target rules when those roles are in scope.

Shared implementation lives in `packages/contracts/json-schema-subset.mjs`, `resolved-token-value.mjs`, `theme-package-semantic.mjs`, `theme-package-io.mjs`, and `theme-workspace.mjs`. The existing `packages/adapters/css/resolve-theme.mjs` now delegates token serialization to the shared safe-value contract; Studio must reuse that resolver rather than add a Studio-specific mapper.

## 4. Capability-aware discovery

**CAPABILITY ABSENCE IS NOT A PREVIEW.**

Studio discovers capabilities from canonical registries/contracts. It does not maintain a parallel list of what it wishes existed.

Initial v0.4 capability truth:

- Component preview is available from current Core component authority plus the shared preview substrate defined below.
- Block preview is unavailable until real Block contracts, implementations, and registry authority exist.
- Page preview is unavailable until real Page contracts, implementations, and registry authority exist.
- Core context is available.
- Commerce, SaaS, and other Vertical previews are unavailable until real Vertical authority exists.
- A component's state list comes only from the selected `neosmartui/component@1` contract.

When capability is absent, Studio surfaces unavailable state or `REGISTRY GAP`. It must not create a hand-built lookalike, speculative ID, fake state, or hidden substitute merely to fill the interface.

## 5. Shared Component preview authority

The current Core registry identifies shipping components, contracts, implementation evidence, and public proof, but it does not define reusable fixture/setup authority. Foundry examples therefore cannot simply be copied into Studio.

v0.4 introduces the separate schema:

`neosmartui/component-preview@1`

This preview contract is presentation/test substrate only. It must not change `neosmartui/component@1` or `neosmartui/component-registry@1`, and it must not duplicate component identity, token dependencies, support flags, maturity, or canonical state lists as a second authority.

Implementation layout is deterministic:

```text
packages/core/previews/<component-slug>/preview.json
packages/core/previews/<component-slug>/fixture.html
packages/core/previews/<component-slug>/controller.mjs   # only when required
```

A preview manifest binds:

- the canonical component ID;
- deterministic `fixture.html`;
- optional `controller.mjs`;
- `fixtureComponents` for explicitly composed shipping Core components;
- one `defaultState`;
- `resetStrategy: "remount"`;
- an exact realization entry for every canonical component state;
- canonical Web adapter styles and bindings;
- optional JSON-safe adapter binding options.

Repository validation, not JSON Schema alone, must require the state-realization keys to exactly equal the selected component contract's state list in canonical order.

Allowed state realization modes are:

- `fixture` — already represented by canonical fixture semantics;
- `native-pointer` — must be exercised through real pointer interaction;
- `native-keyboard` — must be exercised through real keyboard/focus interaction;
- `controller` — deterministic semantic orchestration using shipping adapter hooks/APIs.

A preview controller may orchestrate DOM state and call authorized shipping adapter helpers. It must not contain visual CSS, import private renderer modules, reimplement component behavior, or fake browser pseudo-states.

Renderer bindings must point to shipping adapter evidence authorized by the Core registry. Repeated bindings are allowed. Runtime cleanup may normalize shipping disposer functions and controller objects internally without inventing adapter-specific authority in the manifest.

## 6. SOURCE ONCE. DEMONSTRATE EVERYWHERE.

Foundry, Studio, Labs, tests, docs, registry surfaces, and agent surfaces should consume shipping contracts and implementations wherever practical.

The shared preview substrate must be extracted so Foundry and Studio can consume the same fixture/controller authority. Migration should preserve current proven Foundry behavior and bytes wherever the existing public-proof boundary requires it.

Studio preview is not permission to create a parallel demo implementation.

## 7. Theme editing law

Controls map to canonical semantic roles only.

### Color

Studio may edit resolved color roles that are valid for the selected Theme scope. If a desired role is absent from the resolved dependency union, that is a contract/registry gap, not permission to pad `tokens.json`.

### Typography

Typography controls use existing Theme/token authority. Studio must not create a second typography registry. Future font registry support remains separately authoritative and license-aware.

### Geometry, border, shadow, spacing and density

Controls edit canonical Theme/resolved semantic values. Preview-only CSS overrides must never become persisted authority.

### Pressure System

Pressure controls map directly to canonical depth, travel, motion and focus roles.

Editing must preserve **Pressure, not levitation**:

- rest depth does not become shallower by moving a control away from its plane;
- hover/proximity compresses toward the resting plane;
- active/pressed compresses further;
- depth/travel relationships remain coherent per axis;
- focus remains an independent visible keyline;
- seated selection semantics are used only where the component contract/runtime supports them.

Studio must reject or clearly mark incoherent drafts; it must not silently repair them into a different valid Theme.

## 8. Light and Dark workspace model

Light and Dark are first-class concrete Theme instances. The repository currently stores them as separate packages, not as one persisted pair object.

Studio therefore uses an ephemeral workspace with optional `light` and `dark` slots:

- each occupied slot contains one complete canonical three-file Theme package;
- a workspace may contain Light only, Dark only, or both;
- mode controls are enabled only for concrete slots that exist;
- paired slots presented as one editing workspace must bind the same Flavor;
- each slot validates independently;
- no persisted `theme-set.json` or Studio workspace authority is introduced for v0.4;
- export writes canonical Theme packages per mode.

Studio must not assume arbitrary imported Light/Dark Themes are mechanically paired unless that relationship is explicitly established in the current workspace.

The human starter workflow exposes the four current official canonical Theme pairs — Hardline, Soft, Rivet, and Mono — directly from `packages/themes`. Loading an official starter explicitly replaces the ephemeral workspace with that canonical Light/Dark pair. Existing or community canonical Theme packages remain data imports; starting a new workspace from an imported Theme is an explicit user action and may begin with only the imported mode.

## 9. Import and export boundary

Studio import is untrusted **data only**.

Accepted Theme import files are exactly:

- `theme.json`
- `resolution.json`
- `tokens.json`

Studio must never import or execute user-supplied HTML, CSS, JavaScript, preview fixtures, controllers, selectors, or arbitrary resource URLs as Theme data.

Before imported values reach trusted CSS resolution, implementation must validate:

1. JSON shape/schema without mutation or coercion;
2. schema identities and cross-file identity relationships;
3. Flavor and Theme identity;
4. scope and dependency union;
5. token IDs and types;
6. safe value grammar for every resolved token type;
7. Pressure/accessibility invariants applicable to the package.

Malformed or invalid input remains explicit raw/error-bearing draft data. Import failure is atomic: it must not partially replace the active Theme/workspace.

Deterministic export occurs only after validation succeeds. Canonical export must use:

- filenames exactly `theme.json`, `resolution.json`, `tokens.json`;
- stable canonical field/key ordering;
- canonical scope/token ordering from repository authority;
- two-space JSON indentation plus trailing newline;
- no silent dropping, coercion, normalization, or invented fields.

Import → export without edits must remain semantically lossless and deterministically stable.

## 10. Honest preview environments

Studio must distinguish what it can truly render from what requires real browser/system state.

Initial rules:

- Desktop / Tablet / Mobile: real preview viewport/container dimensions.
- Light / Dark: real loaded canonical Theme package in the selected workspace slot.
- Component state: exact `neosmartui/component-preview@1` realization mode only.
- Mouse / Keyboard: real interaction paths.
- Touch: live only when the device/browser exposes real touch capability; otherwise unavailable/verification-only.
- Reduced Motion: authoritative live state comes from the real media feature; CI may emulate it for automated verification.
- Forced Colors / system High Contrast: system/browser capability; Studio must not synthesize lookalike colors. CI may provide authoritative automated verification.

A normal web page must not pretend it changed a system feature when it did not.

## 11. Preview isolation and security

The edited Theme preview and Studio application shell are separate scopes. Draft Theme values must not restyle or break the editor controls themselves.

The initial runtime uses an iframe sandbox exactly `allow-scripts`, deliberately omitting same-origin privilege so the preview has an opaque origin. Each render receives a fresh nonce-scoped CSP; preview readiness/error messages are accepted only from the active iframe window with origin `null` and the current render ID.

The implementation should use an isolated preview document/iframe with the narrowest capabilities required.

Security laws:

- generated Theme CSS uses a fixed Studio-owned scoped selector, never a user-controlled selector;
- preview loads only repository-owned fixtures, controllers, adapter CSS/modules, and generated Theme CSS;
- fixtures reject executable/style authority such as `<script>`, `<style>`, external `<link>`, and inline visual style;
- controllers must not perform visual-style mutation;
- message traffic validates expected source/origin and a narrow message schema;
- iframe sandbox excludes unnecessary forms, top navigation, popups, and arbitrary downloads;
- CSP blocks arbitrary external resource/network execution;
- imported token strings are validated before the trusted token-to-CSS resolver is called.

## 12. Validation contract

The Studio quality boundary must cover:

- schema validation;
- exact Theme/Flavor identity;
- component scope/dependency validation;
- token identity/type/value validation;
- Pressure System coherence;
- authored contrast requirements;
- reduced-motion/accessibility requirements;
- component preview authority and state coverage;
- shipping adapter reuse;
- deterministic import/export;
- no renderer/route/domain fork from Theme editing;
- keyboard-operable Studio controls;
- responsive/state switching;
- explicit invalid-draft errors.

Browser tests must prove behavior through real shipping adapters rather than lookalike preview CSS.

## 13. Contract checkpoint exclusions

The merged contract checkpoint intentionally introduced contracts and validators only. The shared Component-preview substrate is the first permitted implementation slice after that checkpoint.

It MUST NOT create:

- `apps/studio/`;
- Studio runtime/generated output;
- a public Studio route/deployment;
- a new Theme schema;
- a Studio Theme/token registry;
- shared preview fixture packages during the historical contract-only checkpoint;
- a Pages deployment.

The existing Foundry build chain must remain byte-authority unchanged by this contract checkpoint.

These exclusions describe the historical contract-only checkpoint. After its green merge and the green shared dependencies, `apps/studio/` became a separate `dist/studio` build. The initial runtime checkpoint made no Pages claim; the later launch checkpoint explicitly authorizes exact-artifact publication at `/studio/` after merged-main verification.

## 14. Implementation sequence after a green contract merge

After this contract merges and mandatory merged-main Quality is green:

1. create the shared Component-preview substrate from the exact current Core/Foundry authority;
2. make Foundry consume the shared preview authority without weakening public proof;
3. introduce browser-safe shared Theme-package semantic/value validation, deterministic import/export, and ephemeral Light/Dark workspace support (**implemented before Studio runtime**);
4. create `apps/studio/` using platform HTML/CSS/ES modules and shipping Web adapters (**initial runtime implemented**);
5. implement canonical Theme-package import/export, Light/Dark workspace slots, official Hardline/Soft/Rivet/Mono starters, and explicit new-workspace import for existing/community Themes (**implemented**);
6. render registry-driven Core Component previews through the shared substrate (**implemented in initial runtime**);
7. add canonical color/typography/geometry/Pressure controls (**implemented across the active resolved semantic token surface, including typography, spacing/size, border/radius, coupled Pressure, motion, focus, and state opacity**);
8. add responsive and honest accessibility/input preview status (**implemented without fake system toggles**);
9. add deterministic validation UI and browser coverage (**implemented for the initial runtime**);
10. publish the verified Studio artifact as the public Studio surface at `/studio/` using exact merged-main bytes (**launch checkpoint**);
11. keep Block/Page/Vertical modules capability-gated until their roadmap authorities exist.

The implementation must preserve the permanent rules:

**SOURCE ONCE. DEMONSTRATE EVERYWHERE.**

**DISCOVER before inventing.**

**VALIDATE before completion.**


## 15. Public Studio deployment

The canonical public Studio route is `https://neosmartui.github.io/studio/` during active development.

Deployment laws:

- `dist/studio/` is built and browser-tested from one exact merged `neosmartui/neosmartui` SHA;
- only the already-green merged-main artifact may be copied to `neosmartui/neosmartui.github.io/studio/`; deployment must not rebuild or hand-edit Studio;
- `dist/studio/deployment.json` uses `neosmartui/deployment-record@1` with `artifact: "studio"` and the exact source SHA;
- the root Foundry `/deployment.json` and Studio `/studio/deployment.json` remain separate provenance records;
- launching Studio must not silently move an existing Core/Flavor public-proof cohort; if Foundry bytes are deployed from a newer source SHA, the normal singleton proof-only promotion follows native Pages verification;
- the deployment repository remains generated output only.
