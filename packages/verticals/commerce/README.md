# NeoSmartUXUI Commerce — local component wave 1

Branch: feature/local-commerce-components-wave1. NO PUSH OR PULL. All changes local, no public proof or public build.
Commerce is a vertical (business semantics), not a sixth Flavor. Keep 50 Core contracts and 10 existing Theme bundles untouched.

Implemented: product-price, product-card, product-gallery, cart-line, order-summary, license-status, seat-usage, download-entitlement. These use the canonical Core classes (ns-card, ns-button, ns-badge) plus existing ns-* Theme tokens. They do not invent provider outcomes.

Provenance: NeoBrutalismshop/NeoBrutal-Commerce commit 493f9c0, PolyForm Noncommercial License 1.0.0, copyright 2026 NeoBrutalism-shop. Domain models and behavior patterns are adapted. CSS and DOM components are written independently on NeoSmartUXUI architecture. The owner of both projects explicitly authorized cross-project reuse under NeoSmartUXUI's intended terms. NeoSmartUXUI currently has no top-level LICENSE file specifying a named license, so a formal license declaration remains a pre-distribution task. Preserve original attribution and any third-party rights. Secondary reference: NeoBrutalismshop/NeoBrutal-Soft/demo/v07.html (a NeoLicenser demo, not an independent library).

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

## Wave 2 - local catalog/offer admission

Six more catalog/offer entries are implemented locally: product-detail, product-media, review-summary, license-selector, renewal-note, pricing-tier. Product-media has keyboard-operable preview/code/files tabs; license-selector explicitly selects offers through a caller callback. Pricing-tier does not fabricate provider success. Review scores/counts and renewal messages come from the provider. Total implemented Commerce entries: 14; Core stays at 50. Not yet a public release.

## Wave 3 - checkout/payment local admission

Ten additional components are implemented locally: coupon, checkout-field, invoice-details, checkout-steps, payment-method, payment-failure, payment-recovery, processing-state, order-confirmation and receipt. Together with Waves 1/2 this makes 24 locally implemented Commerce components, alongside 50 unchanged Core components.

Authority boundaries: Coupon callbacks return provider accepted/rejected states. Billing draft updates require an adapter acknowledgement. Payment choices are safe descriptors, never raw card credentials or tokens. Checkout recovery cannot be claimed without a provider response. Confirmations require status confirmed; receipt records require status paid; neither implies unverified entitlements. A receipt is not a tax invoice.

No live checkout SDK, backend, payment capture, gateway integration, or real provider validation is implemented in Wave 3. No remote push or public proof.

## Wave 4 — licensing and account lifecycle admission

Eleven locally implemented UI components: download-row, purchase-history-row, license-card, invoice-history, activation-row, update-eligibility, renewal-state, plan-change, ownership-transfer, subscription-management and ownership-timeline. The Commerce registry now has **35** local entries, Core still has **50**, and source admission has **11** remaining entries reserved for Blocks/platform patterns.

The component layer never invents signed URLs, payments, license history or real ownership transfers. License state, update entitlement, activation, seat allocation, subscription billing and invoice state are intentionally separate. Plan changes require a verified provider quote before submission; unsafe seat-capacity downgrades are blocked. Transfer invitations do not imply accepted ownership. Subscription cancellation keeps the paid period valid when the provider returns cancel-at-period-end. All network actions remain host callbacks and do not issue requests in the UI implementation.

These are tested local DOM renderers, not a production licensing service, SDK, checkout or signed download provider. Rights reuse was authorized by the owner, but the canonical NeoSmartUXUI public license declaration is still pending. No GitHub push, pull or Actions execution.
