# Owner-local Implementation Contracts

Use this reference after tracing current behavior. Define only implementation owned within a package, crate, module, component, state owner, database owner, or generated-artifact owner. Put boundary contracts in [integration-contracts.md](integration-contracts.md) and error identity/propagation in [error-contracts.md](error-contracts.md).

Follow the representation rules in [plan-template.md](plan-template.md). Select details that resolve actual ambiguity or protect a changed invariant; do not instantiate every field below.

## Contents

- [Files, modules, and ownership](#files-modules-and-ownership)
- [Types, functions, and methods](#types-functions-and-methods)
- [React components and hooks](#react-components-and-hooks)
- [Routes, Zustand, and browser persistence](#routes-zustand-and-browser-persistence)
- [State and data authority](#state-and-data-authority)
- [Database writes and migrations](#database-writes-and-migrations)
- [Async lifecycle and concurrency](#async-lifecycle-and-concurrency)
- [Generated and synchronized artifacts](#generated-and-synchronized-artifacts)
- [i18n contract](#i18n-contract)
- [Security and observability](#security-and-observability)

Verify exact current names and behavior from owner README files and executable sources. Label proposed names and signatures as target design.

## Files, modules, and ownership

For meaningful ownership or source-of-truth changes, identify relevant paths and:

- owning package, crate, service, deployment resource, or repository scope;
- one responsibility and explicit non-responsibilities;
- public exports, callers, consumers, configuration, and build inputs;
- dependency direction and why the responsibility belongs at this boundary;
- handwritten, maintained-snapshot, generated, or vendored status;
- legacy paths and consumers removed in the same work;
- owner README or ADR updates required by the final architecture.

Use an annotated tree when it clarifies ownership; a short file/symbol list suffices otherwise.

Choose the optimal boundary by cohesion, dependency direction, testability, and long-term ownership. Require named stable consumers before creating shared code. For a cross-owner refactor, update the contract, all consumers, manifests, aliases, tests, generated artifacts, deployment inputs, and documentation as one coordinated design.

## Types, functions, and methods

For new or changed public/cross-owner data contracts, provide precise target declarations for relevant fields, visibility, nullability, serialization, and bounds. Ordinary private types can be designed during implementation. Define invariants, identity/equality/order, serialization, invalid states, and conversions below the declaration. Distinguish domain, persistence, transport, generated, form, client-state, browser, and view-model types.

Let the integration contract own wire types. Use generated GraphQL types at GraphQL boundaries; allow a handwritten frontend derivative only when it represents a distinct form, normalized state, browser value, or view model with an explicit conversion and drift check.

For new or changed public/cross-owner operations, show the target signature when needed to fix the contract. Leave ordinary private helpers to implementation. For Rust include required trait implementations, associated types, inherent `impl` signatures, visibility, ownership/borrowing, and async bounds; for TypeScript include interfaces/types, function or hook signatures, component props/callbacks, and exported store/selectors. Describe the relevant semantics:

- callers, call frequency, input ownership, validation, and normalization;
- output, side effects, state changes, and authorization;
- runtime, browser, thread, connection, or transaction requirements;
- typed internal failures and referenced canonical Error IDs;
- retryability, idempotency, partial progress, and tests.

Resolve consequential invariants, conversions, and failure boundaries before implementation; ordinary implementation choices remain with the implementer. Use pseudocode only for behavior that cannot be expressed by declarations; do not turn the plan into full implementation bodies.

## React components and hooks

Specify changed component/hook contracts and relevant composition or state ownership. Reference unchanged props and providers in source.

Where behavior is affected, specify loading, empty, partial, validation, error, disabled, or success states; mutation completion and invalidation; effect setup/cleanup; double-submit and stale-response behavior; semantic structure, labels, keyboard, focus entry/return, ARIA relationships, screen-reader text, and responsive behavior.

Use repository instructions and the current owner documentation when selecting or changing shared UI or vendored components. Record the accessible name of icon-only controls, but do not produce a separate icon inventory.

## Routes, Zustand, and browser persistence

Distinguish routing, in-memory state, and persisted data where their lifecycles differ. A single clear description may cover their relationship.

For changed routing, identify URL/registration ownership and relevant navigation or access behavior. For changed stores, identify authoritative state, readers/writers, and relevant reset or stale-result behavior. For browser persistence, specify the literal key and serialized contract, with migration, malformed-data, and account-isolation behavior where affected.

Describe the actual changed paths. Do not require every route, store, or persisted value to acquire new lifecycle mechanisms or a separate test inventory.

## State and data authority

Assign one authoritative owner to every mutable value. Record writers, readers, derived projections, persistence, invalidation/reset, and stale behavior using prose, steps, or a diagram as appropriate. Use a table only when several homogeneous values genuinely need comparison.

Use the current repository implementation to choose among component state, URL/router state, Zustand, Apollo/server data, browser persistence, request context, service-owned resources, and PostgreSQL. Any duplicated projection needs a reason, conversion, refresh path, stale behavior, and reset boundary.

Inspect the actual cache policy rather than assuming one. Define resets caused by navigation, authentication, query variables, filter/sort/page changes, locale/theme changes, successful mutations, reload, restart, migration, or account change when applicable.

## Database writes and migrations

Specify affected schema/query contracts, consumers, and critical data invariants. For writes, establish the necessary atomicity and failure behavior; for schema or existing-data changes, include migration and rollback/loss boundaries. Do not invent distributed failure scenarios where no external action exists.

Discover migration and generation commands from their executable owners; never assume startup applies migrations. Use an explicit test database when verification needs persisted data.

## Async lifecycle and concurrency

Identify resources or results that can outlive their owner or conflict with a newer operation. Specify cancellation, timeout, cleanup, ordering, or transaction boundaries only where those risks exist in the changed path. Reuse framework/RAII/task semantics before introducing new state machines or recovery flows.

A lifecycle risk considered during design does not automatically require a new UI, subsystem, or exhaustive manual test. Verify changed critical behavior at the narrowest effective level; follow the current delivery stage for broader scenarios.

## Generated and synchronized artifacts

For affected generated artifacts, identify:

- handwritten source of truth;
- maintained snapshot or intermediate, if any;
- generated or synchronized output;
- existing owner-supported generation/synchronization entrypoint;
- expected additions, changes, and deletions;
- manual-edit and formatting policy;
- consumers and validation that detect drift.

Change the handwritten source first. Derive exact paths and commands from owner README files, manifests, generator configuration, and source. Never patch an output to bypass its source or invent an export command because a desired one is absent.

## i18n contract

For every changed user-visible label, message, validation result, error, accessibility string, title, menu item, or formatted value, define exact key ownership, all supported locale files, meaning, interpolation/plural/select variables, caller and UI state, and fallback.

Use a key table only when multiple mappings need comparison; simple changes can reference the locale files directly. Reuse an existing key only when semantics and variables match. Keep supported locale key sets and variables synchronized. Error-specific `code + safe details -> key -> UI` mapping belongs in [error-contracts.md](error-contracts.md).

## Security and observability

For changed trust boundaries, identify untrusted inputs, validation, authorization, and protected data. Specify only affected credential, origin, storage, forwarding, or disclosure rules. Do not redesign all security mechanisms because one boundary changes.

For changed diagnostic paths, inspect what is recorded and define the fields, redaction, and correlation actually needed. Do not introduce a tracing system or sampling policy for a local logging fix.

Keep real credentials, tokens, private keys, environment secrets, and internal error causes out of public responses and diagnostics exposed to clients.
