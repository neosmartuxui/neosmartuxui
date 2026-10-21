# NeoSmartUXUI Core ESM and framework integration milestone

**Scope:** 5 additional verified Core controls, private local ESM Core subpath, truthful documentation for Vanilla JavaScript, React and Vue 3. No public npm package, provider connection, new proof classification or Theme fork.

## Source authority

The canonical five Web adapters are under packages/adapters/web/components: accordion.mjs, radio.mjs, toggle.mjs, segmented-control.mjs, number-field.mjs. The source barrel packages/adapters/web/core-exports.mjs explicitly exports 19 existing functions without changing their implementation. Core type declarations in core-exports.d.ts declare exactly those module functions and native DOM types.

The private package build tooling/ecosystem/package.mjs now copies the canonical adapter modules into artifacts/library-package/core/components, adds core/index.mjs and core/index.d.ts, and declares @neosmartuxui/library/core in the local-only package.json exports. The generated local styles/core.css now includes the five corresponding original Core CSS files. Existing Commerce, Operations, Blocks and Templates exports remain unchanged. Release stays private=true and version=0.0.0-local.

Before a consumer uses an example, run npm run build:library:local and link artifacts/library-package locally. Never imply npm install @neosmartuxui/library from a public registry is available. Import the private core subpath and local core + Theme styles.

## Newly verified Explorer controls

- core.accordion: single-expansion disclosure open and closed via native button click; real peer aria-expanded and panel.hidden updates.
- core.radio: native alpha/beta peer selection with adapter-managed data-state.
- core.toggle: persistent aria-pressed on/off via real bound button and its adapter.
- core.segmented-control: one-of-N real selection with disabled peer preserved.
- core.number-field: native bounded numeric input, empty and filled states, increment and decrement via bound step buttons.

Total Explorer Core families with source-verified controls: 14. The other 36 Core families and 56 experimental entries still have no invented property panels. Canonical state and maturity registries remain the authority.

## Framework examples and limitations

The page /docs/integrations/ provides code for Vanilla JavaScript (bindAccordion with disposer), React (bindToggle in useEffect cleanup with DOM ref) and Vue 3 (bindNumberField with onMounted/onBeforeUnmount and DOM ref). These are DOM lifecycle patterns using real package exports and real supported markup. They are NOT React/Vue component exports, and are not claimed to be framework-runtime-tested bundles. Do not write another reactive state authority over the adapter without an explicit sync strategy.

The machine-readable /components/agent-index.json includes the five exact ESM symbols with scope private-local-only, the doc route, and all original source pins. No public install claim is added to the agent manifest.

## Validation

- npm run build:library:local
- npm run validate:core-exports (checks the actual private package name self-import, 19 ESM names, typed subpath and exact source byte copies of all five adapters)
- npm run validate:ecosystem (now includes Core self-import validation)
- npm run build:portal, stage:portal:local, verify:portal, test:portal
- npm run validate:license

Browser tests cover real adapter changes, keyboard accessibility, mobile RTL/reduced motion, private package documentation, component catalog, Themes, Labs and Hardline tactile physics. No Pages write is allowed unless the exact SHA local artifact passes and existing Foundry, Studio and Labs remain byte-for-byte unchanged. GitHub Actions stay disabled; the public npm release gate stays closed.

## Next phase

Investigate the remaining Core components case-by-case from the canonical component-preview contract and shipping adapter. Before claiming React/Vue framework support, set up end-to-end runtime tests in locally installed frameworks and assess official adapter distribution/semver. Do not count framework examples toward public-proof component maturity.
