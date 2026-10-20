# NeoSmartUI Competitive Research

Competitive research must be evidence-backed, dated, and reproducible. Time-sensitive metrics must carry a checked-at date and evidence. Learn from product patterns without copying proprietary palettes, transforms, shadows, source code, presets, layouts, naming, or marketing copy.

This directory is the canonical living home for competitor research used by NeoSmartUI product planning.

Competitive research is **not** a one-competitor exercise and is **not** a component-count race. We track multiple products over time, preserve dated evidence, and use the research to identify capability gaps, product expectations, DX patterns, agent workflows, accessibility practices, theme systems, Blocks, Pages/templates, and differentiation opportunities.

## Product target

NeoSmartUI Core is currently expanding toward:

> **90+ distinct public-proof Core components**

This is a product target, not a formula derived from one competitor. Competitor counts are benchmarks and gap signals; they do not automatically redefine or reduce the target.

## Tracked competitors

### neobrutalism.com — primary tracked competitor

Status: active

Public surfaces currently tracked:

- Components
- Blocks
- Templates
- Theme builder / Theme Lab
- Figma
- MCP / agent installation
- CLI / source ownership
- RTL
- Dark mode
- accessibility claims
- Radix UI / Base UI / React Aria coverage

Dated evidence:

- `neobrutalism-com/snapshot-2026-09-20.json`

### neobrutalism.dev — separate tracked competitor

Status: active

This is a separate product/repository lineage and must not be conflated with neobrutalism.com.

Dated evidence:

- `neobrutalism-dev/components-2026-09-20.json`

### Riddle UI — tracked design-system competitor

Status: active

Riddle UI is tracked separately as a designer-first Neo-Brutalism system delivered through Framer and Figma. Its evidence is especially useful for design foundations, advanced interaction breadth, example sections, and future Blocks/Pages research.

First-party surfaces:

- Framer marketing/product site;
- public Figma preview;
- design foundations;
- utility elements;
- interactive components;
- marketing UI sections;
- example pages.

Dated evidence:

- `riddle-ui/snapshot-2026-09-20.json`

## Adding competitors

Add each competitor under its own stable slug:

```text
research/competitors/
  README.md
  index.json

  neobrutalism-com/
    snapshot-YYYY-MM-DD.json
    ...

  neobrutalism-dev/
    snapshot-YYYY-MM-DD.json
    ...

  <future-competitor>/
    snapshot-YYYY-MM-DD.json
    ...
```

For every snapshot:

1. use first-party sources where available;
2. record `checkedAt`;
3. preserve source URLs;
4. distinguish advertised counts from exact discoverable counts;
5. do not infer current counts from old snapshots;
6. do not silently merge separate products or repositories;
7. record uncertainty explicitly;
8. never copy proprietary implementation or marketing copy.

## Research dimensions

Track at minimum:

- component breadth;
- component quality;
- state completeness;
- Block breadth;
- Page/template breadth;
- theme tooling;
- interaction system;
- accessibility;
- responsive behavior;
- developer experience;
- distribution/install flow;
- source ownership model;
- framework/primitive coverage;
- MCP and agent experience;
- Figma/design assets;
- documentation;
- pricing/licensing where relevant;
- vertical/application depth;
- public proof.

## Decision rule

Competitor research informs NeoSmartUI; it does not define NeoSmartUI.

Every observed capability is evaluated through:

```text
Does it solve a real user problem?
Does it fit NeoSmartUI architecture?
Is it Core, Block, Page, Vertical, Tooling, or reject?
Can NeoSmartUI solve the underlying problem better?
```
