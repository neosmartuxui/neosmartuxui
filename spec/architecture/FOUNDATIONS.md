# NeoSmartUI Spec v1 — Architecture Foundations

Normative terms: **MUST** = required, **SHOULD** = expected unless a documented constraint justifies an exception, **MAY** = optional.

## Canonical hierarchy

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

This hierarchy describes increasing composition scope. It MUST NOT be used to blur domain ownership.

## Independent dimensions

```text
FLAVOR   = how UI looks and physically feels
VERTICAL = what domain/business knowledge UI understands
THEME    = a concrete configured instance of a flavor
```

Canonical composition:

```text
Core + Vertical + Flavor + Theme + Framework Adapter = Application UI
```

Flavor and Vertical MUST remain independently replaceable. Changing Flavor MUST NOT require changing Vertical business/domain code.

## Core admission rule

A capability is a Core candidate when it can be accurately described without naming a business domain.

Generic examples: Button, Dialog, DataTable, AppShell, EmptyState, Stepper.

Domain examples such as ProductPrice, CartLine, PlanUsage, and SeatManager MUST remain in their owning Vertical unless later evidence justifies promotion.

## Promotion rule

Do not generalize merely because reuse is imaginable. Implement a domain need correctly, observe genuine reuse, then promote when the abstraction is proven. Obviously generic capabilities MAY be built in Core first.

## Permanent physical laws

NeoSmartUI preserves these family laws from validated legacy knowledge:

- ordinary controls compress rather than lift on hover/proximity;
- structural shadow/depth changes coherently with translation;
- input receives immediate visible acknowledgement;
- motion communicates physics or state rather than decoration;
- static content remains stable;
- accessibility is structural;
- human and agent consumers share machine-readable authority.

Exact physical values belong to Flavor/Theme contracts, not generic component code.
