# NeoSmartUI Spec v1 — Ownership and Dependency Rules

## Allowed direction

```text
Spec / Contracts
      ↓
Core
      ↓
Vertical capability may consume Core
      ↓
Blocks
      ↓
Pages
      ↓
Applications
```

Flavor/Theme applies across compatible rendering layers and MUST remain independent of Vertical semantics.

## Rules

1. Core MUST NOT import a Vertical.
2. A Vertical MAY consume Core, but MUST NOT duplicate a generic Core primitive under a domain name.
3. One Vertical MUST NOT silently depend on another Vertical's private domain model.
4. Flavor MUST NOT own checkout, billing, seat, product, license, or other domain semantics.
5. Theme MUST primarily be configuration/data; renderer forks require explicit architectural justification.
6. Application-specific code MAY compose Core + Vertical capabilities but SHOULD NOT become an unofficial reusable layer without classification.
7. Framework/provider adapters MUST translate boundaries, not redefine semantic authority.
8. Blocks and Pages MUST compose registered capabilities rather than introduce hidden primitive duplicates.
9. Generated demos/docs MUST NOT become source authorities.

## Cross-flavor proof

A compatible Vertical implementation MUST be able to render under multiple official Flavors without changes to its domain/business code. If a Flavor switch requires Commerce logic changes, treat it as an architecture defect.

## Anti-guess rule

Dependencies, IDs, tokens, states, provider fields, and domain semantics MUST be discovered from authority. Missing authority is a gap to classify, not permission to invent.
