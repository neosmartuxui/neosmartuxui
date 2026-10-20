# NeoSmartUI Spec v1 — Taxonomy

## Core

Domain-neutral reusable capabilities shared by applications and verticals. Core owns generic semantics, accessibility, state contracts, and composition primitives.

## Component

A focused reusable UI capability with stable intent and explicit states. Components MAY be Core-owned or Vertical-owned.

## Block

A reusable composition of Components and/or smaller Blocks that solves a coherent interface task. Blocks retain the domain ownership of their semantics.

## Page

A machine-readable experience composition that coordinates Blocks, layout, meaningful application states, and actions for one route/task.

## Application

A product-specific composition of Pages plus product behavior, integrations, routing, and data/provider concerns.

## Flavor

A visual and physical personality. Flavor owns expression such as palette defaults, typography preset, geometry, border weight, shadow personality, density, spacing personality, motion intensity, release characteristics, icons, surfaces, and patterns.

Flavor MUST NOT own domain/business semantics. Official flavors are Hardline, Soft, Rivet, Mono, and Pulse. Pulse is an independently authored SaaS-forward visual/physical expression; SaaS itself remains a Vertical.

## Theme

A versioned configured instance of a Flavor. Themes are primarily data and SHOULD override semantic values without forking component/domain behavior.

## Vertical

A package of domain/business knowledge. A Vertical owns domain models, actions, states, domain Components, Blocks, Pages, adapters, and agent metadata that cannot be accurately described without the domain.

**Commerce is a Vertical, not a Flavor.**

**SaaS is a Vertical, not a Flavor.**

Any legacy document that classifies Commerce as a flavor is historical migration input and MUST NOT govern NeoSmartUI architecture.

## Adapter

A boundary translating NeoSmartUI contracts to a framework, runtime, provider, or platform without redefining product semantics.

## Agent

An authorized software actor that discovers, composes, installs, themes, validates, and explains NeoSmartUI capabilities using machine-readable authority rather than guesses.

## Resolver

The deterministic subsystem that maps intent to Vertical, capabilities, Blocks/Pages, Flavor, Theme, framework, dependencies, validation, and an explainable composition plan.

## Registry gap

When no valid capability exists, automation MUST report `REGISTRY GAP` and classify the missing need as Core, Vertical, or application-specific. It MUST NOT fabricate an existing ID.
