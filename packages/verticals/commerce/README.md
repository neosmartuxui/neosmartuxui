# NeoSmartUXUI Commerce — local component wave 1

Branch: feature/local-commerce-components-wave1. NO PUSH OR PULL. All changes local, no public proof or public build.
Commerce is a vertical (business semantics), not a sixth Flavor. Keep 50 Core contracts and 10 existing Theme bundles untouched.

Implemented: product-price, product-card, product-gallery, cart-line, order-summary, license-status, seat-usage, download-entitlement. These use the canonical Core classes (ns-card, ns-button, ns-badge) plus existing ns-* Theme tokens. They do not invent provider outcomes.

Provenance: NeoBrutalismshop/NeoBrutal-Commerce commit 493f9c0, PolyForm Noncommercial License 1.0.0, copyright 2026 NeoBrutalism-shop. Domain models and behavior patterns are adapted. CSS and DOM components are written independently on NeoSmartUXUI architecture. Rights review is mandatory before licensing/distributing any original derivative code. Secondary reference: NeoBrutalismshop/NeoBrutal-Soft/demo/v07.html (a NeoLicenser demo, not an independent library).

Never fabricate tax, currency, total, entitlement, renewal, download URL, license state, seat count or payment status. Never insert untrusted HTML. Host callbacks perform mutations; rendering does not imply success. Only safe links are permitted.

The local registry is separate from Core; maturity is implemented-local, not public-proof. Blocks, Pages, templates, Theme Gallery, Commerce provider integration and NeoLicenser backend remain future work.

Commands: npm.cmd run quality:commerce (registry validation and test suite), npm.cmd run test:commerce (browser tests). No GitHub Actions.

## Import and use locally

In a browser ESM environment with canonical Theme tokens and existing Core CSS loaded:

    import {renderProductPrice,renderOrderSummary} from './packages/verticals/commerce/index.mjs';
    document.querySelector('#price').append(renderProductPrice({amount:49,currency:'USD'}));
    document.querySelector('#summary').append(renderOrderSummary({
      subtotal:{amount:49,currency:'USD'},
      taxes:[{label:'Provider tax',amount:{amount:5,currency:'USD'}}],
      total:{amount:54,currency:'USD'}
    }));

The output is an HTMLElement that relies on Core ns-* variables. The local test harness generates token CSS directly from canonical Theme bundles and verifies all ten variants. Do not treat the test fixture as a payment quote, real license, or valid checkout.

### Implementation status and admission rule
Maturity is implemented-local. Components are not published, not registered in Core/Studio/Foundry, not independently proof-certified, and not yet supplied as framework packages. Production admission requires complete model/action/state contracts, real-data integration, Accessibility and browser validation, and the project's proof process on a reviewed branch. Keep the change local until the batch is ready.

## Next admission waves

The separate source-admission.json covers all 47 Commerce source IDs without presenting them as 47 production-ready imports. Wave 1: eight implemented locally. One (badge) reuses Core. The other 38 require classification and implementation: 6 catalog/offer components in wave 2, 10 checkout/payment components in wave 3, 11 accounts/ownership components in wave 4, and 11 reusable Blocks/platform patterns deferred until the appropriate foundation exists. Nothing is pushed or published before the vertical is reviewed and ready.
