# NeoSmartUI Core — Semantic Token Contracts v1

Core owns **token meaning**, not concrete visual values.

A Component consumes semantic token contracts. A Flavor may define personality defaults. A Theme resolves those contracts to concrete values. Framework adapters translate the resolved values into platform-specific output.

```text
Core semantic contract
        ↓
Flavor personality defaults
        ↓
Theme concrete resolution
        ↓
Framework adapter output
```

This preserves the architecture rule that exact physical values belong to Flavor/Theme contracts rather than generic component code.

## Contract laws

1. Core token IDs MUST describe generic UI meaning without a business domain.
2. Core token contracts MUST NOT contain concrete values.
3. Components MUST consume semantic contracts instead of Flavor names or magic values.
4. Flavor and Theme MUST NOT change what a semantic token means.
5. Theme is the final value-resolution boundary for an application.
6. Tactile depth, press translation, motion, and focus MUST remain coherent with the permanent physical laws.
7. Reduced motion changes motion values/behavior, not state meaning or feedback availability.
8. Missing token authority is a `REGISTRY GAP`; consumers MUST NOT invent local semantic names silently.

## Stable token paths

Token IDs are lowercase dot-separated semantic paths. They deliberately omit the `neosmartui` product name because schema identity already supplies ecosystem context.

Examples:

```text
color.surface.canvas
color.content.primary
space.control.inline
size.control.minimum
border.control.width
depth.rest.x
press.active.y
motion.press.duration
motion.release.easing
focus.ring.width
font.family.body
opacity.disabled
```

Published token IDs are stable API. A rename requires explicit migration/replacement mapping.

## Value ownership

Contracts declare one of two resolution models:

- `theme` — concrete value is primarily a Theme decision, such as palette or typography.
- `flavor-theme` — Flavor supplies tactile/personality intent and Theme produces the final resolved application value.

Core never supplies a hidden fallback value in the contract registry.

## DTCG interoperability

NeoSmartUI uses its own contract registry to describe stable semantics before values exist. Resolved value bundles SHOULD target the **Design Tokens Community Group Format Module 2025.10** so themes and adapters can interoperate with external token tooling without making DTCG syntax the owner of NeoSmartUI semantics.

The contract registry therefore has no `$value` fields. DTCG-compatible value bundles belong to later Theme/Flavor implementation slices.

## Permanent tactile contract

The following semantic groups are required before interactive Core components are admitted:

```text
depth.rest.{x,y}
depth.hover.{x,y}
depth.active.{x,y}
press.hover.{x,y}
press.active.{x,y}
motion.press.duration
motion.press.easing
motion.release.duration
motion.release.easing
focus.ring.{color,width,offset}
```

The semantic relationship is permanent even when values vary:

- Rest = full visible depth, no press translation.
- Hover/proximity = partial compression, reduced visible depth.
- Active/pressed = seated compression, collapsed or near-collapsed depth.
- Release = immediate, legible return/confirmation behavior.

Ordinary controls compress; they do not gain apparent elevation on hover.
