# NeoSmartUI Core package

Core contains business-domain-neutral capability authority.

Current v0.1 slice:

- `component-registry.json` — honest component maturity/proof registry.
- `components/button.json` — first `neosmartui/component@1` contract.
- `components/button.md` — human-readable interaction/accessibility contract.

There is intentionally no visual Button implementation yet. Concrete rendering requires Theme value resolution plus an adapter. Core does not hide a default Flavor in generic component code.
