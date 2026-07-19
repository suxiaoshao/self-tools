# Integration Contracts

Use this reference when two ownership boundaries must agree on data, behavior, composition, compatibility, or rollout. Keep owner-internal implementation in [implementation-contracts.md](implementation-contracts.md) and error semantics in [error-contracts.md](error-contracts.md).

## Contents

- [Contract ownership and IDs](#contract-ownership-and-ids)
- [Frontend to backend](#frontend-to-backend)
- [Backend to backend](#backend-to-backend)
- [Frontend to frontend](#frontend-to-frontend)
- [Compatibility and rollout](#compatibility-and-rollout)
- [Validation](#validation)

## Contract ownership and IDs

Assign one stable `C-<number>` ID to every affected boundary contract. Include this registry in the canonical plan:

| Contract ID | Direction                                              | Mechanism                           | Authoritative definition | Producer/owner | Consumers     | Compatibility class | Error IDs     | Contract body / WPs |
| ----------- | ------------------------------------------------------ | ----------------------------------- | ------------------------ | -------------- | ------------- | ------------------- | ------------- | ------------------- |
| `C-01`      | `<frontend-backend/backend-backend/frontend-frontend>` | `<GraphQL/HTTP/Thrift/composition>` | `<path/symbol>`          | `<owner>`      | `<consumers>` | `<class>`           | `<Error IDs>` | `<section/WPs>`     |

For every row record:

- direction and mechanism;
- authoritative handwritten definition;
- producer/owner and every consumer;
- serialization, generation, or composition chain;
- compatibility class and rollout owner;
- referenced Error IDs;
- the canonical contract body and work packages.

Do not put local-only types in the integration registry. Do not define normal response shapes in the error catalog or duplicate error meaning in transport tables. Discover current paths, commands, ports, hosts, and topology from owner README files, manifests, configuration, source, tests, and CLI help.

## Frontend to backend

### GraphQL

Treat one GraphQL change as a coordinated chain:

```text
server schema and resolver contract
  -> checked-in frontend schema input or synchronization boundary
  -> handwritten operation/fragment
  -> configured generator
  -> generated frontend transport types/documents
  -> explicit UI or state projection
```

Use the server GraphQL schema as the cross-layer business-contract owner. Synchronize the repository's client schema input, operations, and generated types through verified existing entrypoints. Do not create a parallel handwritten frontend wire contract or edit generated output manually.

For each changed GraphQL contract, add a `#### C-<number>: <operation or schema outcome>` body containing:

- the exact target server SDL in a `graphql` block, including type/field/argument names, list and item nullability, defaults, directives, unions/interfaces, and deprecation;
- the exact handwritten operation and fragments in a separate `graphql` block;
- resolver owner, validators/guards, authorization, side effects, atomicity, and referenced Error IDs;
- client schema projection and generated-document/type F/G IDs;
- exact UI/state derivative declaration and conversion when it differs from generated transport types;
- consumers, compatibility, rollout, and requirement/test IDs.

Use a Mermaid sequence diagram when a change crosses several resolvers/services, branches on partial data, or has ordering/cancellation behavior that declarations do not show. Do not restate SDL fields in a summary table.

Keep persistence and service models separate from public GraphQL types unless their invariants and visibility intentionally match. Select only required fields. Reuse fragments only for stable shared projections.

GraphQL `errors[].extensions` are outside schema/codegen typing. Reference canonical Error IDs and handle their adapters through [error-contracts.md](error-contracts.md).

### Direct HTTP

Use direct HTTP only for a verified non-GraphQL boundary such as JSON login/WebAuthn exchange, binary content, or streamed content. For each changed boundary, add a `#### C-<number>: <METHOD path>` body and classify the body mode as JSON, binary, stream, or empty. Include:

- exact request and success contracts in `http`, `json`, Rust, or TypeScript blocks as appropriate;
- each meaningful status, header, content type, credential/cookie attribute, and empty/error body rule;
- middleware, authentication/authorization, runtime validation, serialization/conversion, producer, consumer, Error IDs, and compatibility;
- separate browser/in-memory and serialized types plus exact conversions when they differ.

For streaming or proxied external content, also define target/input validation, SSRF and redirect policy, upstream request behavior, timeout and size limits, content-type policy, propagated/rewritten status and headers, streamed-body ownership, browser consumption, and cancellation. Use a sequence diagram when redirects, proxying, streaming ownership, or cancellation cross several participants. Do not force a streamed body into a GraphQL or JSON-error model.

Reference Error IDs for failure behavior; define HTTP status/envelope mapping in [error-contracts.md](error-contracts.md).

## Backend to backend

### Thrift

Treat the verified IDL as the sole wire-contract source. For each changed service boundary, add a `#### C-<number>: <service/method>` body with the exact target Thrift service, method, struct, enum, field, and exception declarations in a `thrift` block. Preserve field IDs, enum values, `required`/`optional`, defaults, return types, and `throws` clauses explicitly.

Below the IDL, define additive versus breaking classification, generator configuration and generated-binding G/F IDs, server implementation owner, every caller, serialization/conversion, Error ID mapping, service discovery/configuration, deployment order, rollback, requirement/tests, and compatibility across mixed producer/consumer versions. Use a sequence diagram when more than one backend hop, fallback, or deployment-order interaction is material.

Do not create parallel handwritten RPC wire types or edit generated bindings. Keep endpoint and topology facts in configuration, source, and owner documentation; a plan may change them only with all callers and deployment consumers included.

## Frontend to frontend

For every boundary where the portal and a feature/shared package exchange a package export, feature configuration such as `MicroConfig`, router/menu entry, provider/context requirement, shared type, event, or state, add a `#### C-<number>: <composition boundary>` body. Show the producer/consumer package relationship in an annotated tree and provide exact exported TypeScript declarations for configuration, shared types, callbacks/events, and required provider/context contracts.

Define:

- producer package and public export;
- composition mechanism and portal consumer;
- route/menu registration and ordering;
- required providers, context, aliases, styles, and build inputs;
- authoritative owner for shared or projected state;
- mount/unmount, navigation, reset, and cleanup behavior;
- compatibility and removal of stale exports, registrations, links, providers, and consumers.

Use a sequence diagram for cross-package event/callback ordering and a state diagram for mount/unmount, navigation, or shared-state reset only when those behaviors are non-trivial.

Keep component internals, Zustand members, and browser-storage schemas in [implementation-contracts.md](implementation-contracts.md). Do not introduce a second application or composition root without an explicit architecture decision in the canonical plan.

## Compatibility and rollout

Classify each changed contract as additive, behavior-compatible, deprecated, breaking, or release-gated. When independently deployed or version-skewed consumers are possible, include this table:

| Contract ID | Old producer/new consumer | New producer/old consumer | Rollout order | Temporary compatibility  | Removal condition | Rollback      |
| ----------- | ------------------------- | ------------------------- | ------------- | ------------------------ | ----------------- | ------------- |
| `<C-ID>`    | `<behavior>`              | `<behavior>`              | `<order>`     | `<owner/policy or None>` | `<condition>`     | `<procedure>` |

Record:

- old producer/new consumer behavior;
- new producer/old consumer behavior;
- deployment and migration order;
- temporary compatibility and its single owner;
- removal condition and rollback.

Keep the matrix limited to version-skew comparison. Put multi-step deployment, migration, gate, stop, rollback, and cleanup order in numbered steps or a sequence diagram referenced from the Contract ID; do not hide the executable rollout in one table cell.

Record deletions as explicitly as additions. Do not leave a compatibility layer without an exit condition.

## Validation

Map each contract ID to producer tests, consumer tests, serialization or composition tests, generation/snapshot diffs when applicable, and mixed-version or rollout checks when compatibility requires them. Use repository policy and executable sources for exact commands.

A plan is incomplete when implementation must infer the authoritative definition, discover an undocumented synchronization step, duplicate a wire type, invent a consumer, or choose compatibility behavior.
