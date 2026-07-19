# Owner-local Implementation Contracts

Use this reference after tracing current behavior. Define only implementation owned within a package, crate, module, component, state owner, database owner, or generated-artifact owner. Put boundary contracts in [integration-contracts.md](integration-contracts.md) and error identity/propagation in [error-contracts.md](error-contracts.md).

Follow the representation rules in [plan-template.md](plan-template.md). This reference defines required semantics; it does not require those semantics to be compressed into tables.

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

For every added, modified, moved, generated, vendored, or deleted path, define:

- owning package, crate, service, deployment resource, or repository scope;
- one responsibility and explicit non-responsibilities;
- public exports, callers, consumers, configuration, and build inputs;
- dependency direction and why the responsibility belongs at this boundary;
- handwritten, maintained-snapshot, generated, or vendored status;
- legacy paths and consumers removed in the same work;
- owner README or ADR updates required by the final architecture.

Show these paths in the plan's annotated owner file trees. Put the stable F-ID, action, artifact kind, responsibility, and source-of-truth role on the tree node; put longer dependency-direction or non-responsibility reasoning immediately below the tree. Do not repeat the same path inventory in a table.

Choose the optimal boundary by cohesion, dependency direction, testability, and long-term ownership. Require named stable consumers before creating shared code. For a cross-owner refactor, update the contract, all consumers, manifests, aliases, tests, generated artifacts, deployment inputs, and documentation as one coordinated design.

## Types, functions, and methods

For every new or materially changed type, provide a language-tagged target declaration with exact fields/variants, visibility, optionality/nullability, derives or framework representation, generics and bounds when relevant. Define invariants, identity/equality/order, serialization, invalid states, and conversions below the declaration. Distinguish domain, persistence, transport, generated, form, client-state, browser, and view-model types.

Let the integration contract own wire types. Use generated GraphQL types at GraphQL boundaries; allow a handwritten frontend derivative only when it represents a distinct form, normalized state, browser value, or view model with an explicit conversion and drift check.

For every new or materially changed function, method, handler, resolver, hook, or service operation, show the exact target signature. For Rust include required trait implementations, associated types, inherent `impl` signatures, visibility, ownership/borrowing, and async bounds; for TypeScript include interfaces/types, function or hook signatures, component props/callbacks, and exported store/selectors. Then define:

- exact target signature and visibility;
- callers, call frequency, input ownership, validation, and normalization;
- output, side effects, state changes, and authorization;
- runtime, browser, thread, connection, or transaction requirements;
- typed internal failures and referenced canonical Error IDs;
- retryability, idempotency, partial progress, and tests.

Do not leave an implementer to invent a signature, invariant, conversion, or failure boundary. Use pseudocode only for behavior that cannot be expressed by declarations; do not turn the plan into full implementation bodies.

## React components and hooks

For every changed component or hook, provide the exact target props/callback/ref or hook signature, then define its owner, parent composition point, required providers, route/outlet relationship, and local/URL/Zustand/Apollo/persisted state.

Specify loading, empty, partial, validation, error, disabled, and success behavior; mutation completion and invalidation; effect setup/cleanup; double-submit and stale-response behavior; semantic structure, labels, keyboard, focus entry/return, ARIA relationships, screen-reader text, and responsive behavior.

Use repository instructions and the current owner documentation when selecting or changing shared UI or vendored components. Record the accessible name of icon-only controls, but do not produce a separate icon inventory.

## Routes, Zustand, and browser persistence

Classify routes, Zustand, and browser persistence separately in the applicability matrix. Use the separate route-tree, Zustand-contract, and browser-persistence sections in [plan-template.md](plan-template.md); do not merge them into one generic frontend-state inventory.

For each route-tree node, define `Add / Modify / Delete`, exact router or feature-registration path and symbol, URL pattern and parameters, owner/composition point, parent/outlet, menu/navigation, authentication boundary, deep-link/unknown-route behavior, route lifecycle, removed-URL compatibility or redirect, consumer cleanup, and tests. Use a route tree even though the repository uses declarative route configuration; use a filesystem tree only for a verified file-based router.

For each Zustand contract, define `Add / Modify / Delete`, exact store/hook/member symbols, authoritative owner, state/actions/selectors/subscribers/middleware, writers/readers, creation and hydration, route/auth/reload reset, stale behavior, renamed/deleted consumer cleanup, and tests. Express the store surface as exact TypeScript declarations; use concise pseudocode or a state diagram for non-trivial hydration, reset, stale-result, or cross-store behavior.

For each browser-persistence table row, define `Add / Modify / Delete`, exact owner and literal key, schema/version contract reference, missing/malformed/unknown-version handling, old-key/schema migration, deletion and interrupted-migration behavior, account/logout/reload/cross-tab lifecycle, privacy, and tests. Put the exact serialized type and parser/serializer signatures in a TypeScript contract block; use pseudocode for multi-step migration.

Do not collapse these into generic “frontend state.” Reference decision, work-package, requirement, and test IDs instead of repeating implementation prose in the inventory.

## State and data authority

Assign one authoritative owner to every mutable value. Record writers, readers, derived projections, persistence, invalidation/reset, and stale behavior through ST-labeled numbered steps or Mermaid flow/sequence/state diagrams. Use a table only when several homogeneous values genuinely need comparison.

Use the current repository implementation to choose among component state, URL/router state, Zustand, Apollo/server data, browser persistence, request context, service-owned resources, and PostgreSQL. Any duplicated projection needs a reason, conversion, refresh path, stale behavior, and reset boundary.

Inspect the actual cache policy rather than assuming one. Define resets caused by navigation, authentication, query variables, filter/sort/page changes, locale/theme changes, successful mutations, reload, restart, migration, or account change when applicable.

## Database writes and migrations

For every persistence change, provide the exact target SQL, Diesel schema/model declaration, or repository-native query signature, then define the final table/column/type/default/constraint/foreign-key/index/uniqueness design, query/filter/order/page/count impact, existing-data conversion, loss risk, rollback, and all model/service/transport/UI consumers.

For every write, name the transaction or atomicity boundary and behavior when an external action succeeds but a later database, generated-artifact, cache, or UI update fails. Discover the actual migration and schema-generation workflow from owner documentation, configuration, and source; never assume startup applies migrations or one owner's generated layout matches another's.

## Async lifecycle and concurrency

Apply lifecycle detail only when asynchronous work or mutable resources make it relevant.

For browser work, define effect/listener ownership, abort behavior, unmount/navigation behavior, stale or out-of-order results, concurrent actions, double-submit prevention, and retry owner.

For Rust work, define task and resource ownership, `Send`/`Sync`/`Clone` requirements, request cancellation, timeout/retry ownership, blocking boundaries, failure/partial-completion semantics, connection use across awaits/concurrent queries, transaction cancellation, and shutdown only for long-lived resources.

Mark these details `N/A` for ordinary synchronous work instead of inventing retry, TTL, offline, streaming, cancellation, or shutdown systems.

Use numbered steps for a single linear lifecycle, `sequenceDiagram` for interactions among participants, and `stateDiagram-v2` for recurring state transitions. Do not add a diagram for ordinary synchronous work.

## Generated and synchronized artifacts

For every affected chain, show an annotated text chain or Mermaid flowchart labeled with one G-ID, then define:

- handwritten source of truth;
- maintained snapshot or intermediate, if any;
- generated or synchronized output;
- existing owner-supported generation/synchronization entrypoint;
- expected additions, changes, and deletions;
- manual-edit and formatting policy;
- consumers and validation that detect drift.

Change the handwritten source first. Derive exact paths and commands from owner README files, manifests, generator configuration, and source. Never patch an output to bypass its source or invent an export command because a desired one is absent.

## i18n contract

For every changed user-visible label, message, validation result, error, accessibility string, title, menu item, or formatted value, define exact key ownership, all supported locale files, meaning, interpolation/plural/select variables, caller and UI state, fallback, and tests.

Keep the i18n key inventory as a table because keys share comparable fields. Reuse an existing key only when semantics and variables match. Keep supported locale key sets and variables synchronized. Error-specific `code + safe details -> key -> UI` mapping belongs in [error-contracts.md](error-contracts.md).

## Security and observability

For each affected trust boundary, define authentication and authorization inputs, credential/token/cookie/browser-storage lifecycle, CORS and header handling, secret/environment ownership, forwarded-header trust, WebAuthn or binary serialization, database authorization, public-error allowlist, and redaction.

For observable paths, define event/span owner, structured fields, severity, operation/path/upstream/status context, trace/request correlation, sampling where relevant, and tests. Inspect current logging behavior, especially headers and error sources, before changing request tracing.

When several trust boundaries or credential transitions participate, use a Mermaid flowchart or sequence diagram with exact owners and C/Error IDs; keep allowlists, redaction rules, and rationale in prose or lists.

Never persist or log real credentials, tokens, cookies, passwords, private keys, production database URLs, full environment contents, or internal causes exposed through public errors.
