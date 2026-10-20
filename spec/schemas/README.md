# NeoSmartUI Schemas v1

These schemas define stable identity and minimum machine-readable contracts. They do not authorize registry counts beyond committed evidence or vertical business models.

## Schema identifiers

```text
neosmartui/component@1
neosmartui/component-registry@1
neosmartui/block@1
neosmartui/page@1
neosmartui/theme@1
neosmartui/flavor@1
neosmartui/vertical@1
neosmartui/token-contracts@1
neosmartui/resolved-token-bundle@1
neosmartui/theme-resolution@1
neosmartui/deployment-record@1
neosmartui/public-proof@1
```

Core token contracts are value-free. Concrete values appear only in resolved Flavor/Theme bundles, and adapters translate those resolved values into framework/platform output. Every deployable Foundry artifact carries a source-SHA deployment record. Public-proof records bind implementation blobs, browser evidence, deployment lineage, and canonical HTTPS endpoints.

## Stable semantic IDs

IDs are lowercase ASCII and use kebab-case names.

```text
Component: <domain>.<name>
           core.button
           commerce.product-price
           saas.plan-usage

Block:     <domain>.block.<name>
           core.block.hero
           commerce.block.product-grid

Page:      <domain>.page.<name>
           commerce.page.checkout

Flavor:    flavor.<name>
           flavor.rivet

Vertical:  vertical.<name>
           vertical.commerce

Token:     <semantic-path>
           color.surface.canvas
           depth.hover.y
           motion.press.duration
```

`domain` is `core` or a Vertical domain prefix such as `commerce` or `saas`. Future Vertical prefixes remain extensible; schemas MUST NOT hardcode a closed list of business domains.

The ecosystem/schema name carries `neosmartui`; everyday semantic IDs stay short. Do not introduce verbose IDs such as `neosmartui.core.component.button`.

## Identity and evidence rules

- IDs MUST be stable once published.
- Rename/migration requires explicit provenance and replacement mapping.
- Component IDs MUST NOT contain `.block.` or `.page.`.
- Block IDs MUST contain `.block.` exactly once.
- Page IDs MUST contain `.page.` exactly once.
- Flavor IDs MUST use `flavor.`.
- Vertical manifest IDs MUST use `vertical.` while Vertical-owned capability IDs use the domain prefix directly.
- Core token paths MUST remain business-domain-neutral and value-free at the contract layer.
- Resolved token bundles MUST reference known Core token contracts and preserve their declared types.
- Deployment records MUST bind generated proof surfaces to the exact canonical source SHA.
- `public-proof` MUST have a committed proof record and a live CI verification against the declared HTTPS endpoints.
- Public-proof records MUST bind the implementation blobs they certify; changing a bound implementation file makes the proof structurally stale until redeployed and re-proven.
- Registry maturity MUST never exceed available implementation/public-proof evidence.
- Missing capability is `REGISTRY GAP`, never an invented ID.
