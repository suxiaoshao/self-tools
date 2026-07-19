# Error Contracts

Use this reference whenever a plan adds, removes, renames, remaps, or changes handling of an application, validation, transport, dependency, or client-contract failure. Treat error identity as a public end-to-end contract independent of any one transport.

## Contents

- [Canonical model and ownership](#canonical-model-and-ownership)
- [End-to-end chain](#end-to-end-chain)
- [Producer normalization](#producer-normalization)
- [Transport adapters](#transport-adapters)
- [Frontend classification and recovery](#frontend-classification-and-recovery)
- [Error classes and fallback](#error-classes-and-fallback)
- [Compatibility, security, and observability](#compatibility-security-and-observability)
- [Required tests](#required-tests)
- [Synchronization order](#synchronization-order)

## Canonical model and ownership

Use one canonical error namespace and meaning across services and transports unless the plan establishes a different single owner with evidence. Inventory every added, modified, renamed, or removed public error in this canonical catalog:

| Error ID/code   | Category  | Meaning and trigger    | Details contract     | Retry/idempotency | Compatibility |
| --------------- | --------- | ---------------------- | -------------------- | ----------------- | ------------- |
| `<ERR-ID/CODE>` | `<class>` | `<testable semantics>` | `<symbol/L-ID/None>` | `<policy>`        | `<policy>`    |

For every Error ID/code, define:

- exact stable spelling, category, meaning, and testable trigger;
- typed user-safe details schema;
- retryability, idempotency, and default recovery class;
- compatibility behavior for old/new producers and clients.

After the catalog, provide language-tagged declarations for the canonical code union/enum, each user-safe details type, and public encoder/parser signatures. Keep code spelling, field types, optionality, and unknown-field behavior exact. Do not compress a nested details schema into a table cell.

The catalog is the sole owner of error meaning and details. Operation, transport, and frontend tables reference Error IDs instead of redefining them. Do not create different codes for identical semantics merely because local producer enums or transports differ; do not collapse failures that require different user actions.

## End-to-end chain

Trace every affected failure through this model:

```text
domain, validation, database, dependency, or Thrift failure
  -> canonical application Error ID and safe details
  -> Thrift, HTTP, or GraphQL adapter
  -> frontend runtime classification
  -> state and recovery action
  -> i18n and UI presentation
```

Both a `Thrift -> HTTP -> portal` path and a `Thrift -> GraphQL -> feature UI` path may reference the same Error ID while using different adapters and occurrence rows. The semantic meaning and safe details must remain identical.

Use numbered steps for one linear path. Use a Mermaid `sequenceDiagram` when transports branch, several services or frontend consumers participate, partial data is possible, or retry/cancellation/rollback ordering matters. Label participants and messages with Contract, Mapping, Error, state, and file IDs instead of duplicating their definitions.

## Producer normalization

Include this producer-normalization table for every producer variant or condition that reaches a public boundary:

| Mapping ID | Producer boundary | Variant/condition   | Error ID     | Context/details conversion | Internal cause/log policy | Exhaustiveness test |
| ---------- | ----------------- | ------------------- | ------------ | -------------------------- | ------------------------- | ------------------- |
| `EM-01`    | `<boundary>`      | `<variant/trigger>` | `<Error ID>` | `<conversion>`             | `<policy>`                | `<test ID>`         |

Cover applicable domain/service errors, guards, validators/scalars, Thrift exceptions, database/pool failures, external HTTP failures, middleware/context lookup, and framework validation paths.

Map each producer to one canonical Error ID. Define typed details conversion, internal-cause logging, and an exhaustiveness test. Prefer structured upstream status, enum, or payload data; never classify by matching localized or debug messages.

Preserve internal causes for server logs with correlation, but return only the public allowlist. A new producer variant must not silently inherit an unrelated fallback.

## Transport adapters

Use one normalized row per Error ID and affected transport. Reference exact declarations below rather than placing several transport shapes in one wide row:

| Adapter ID | Error ID     | Transport                 | Exact representation   | Null/partial semantics | Unknown/malformed fallback | Compatibility |
| ---------- | ------------ | ------------------------- | ---------------------- | ---------------------- | -------------------------- | ------------- |
| `EA-01`    | `<Error ID>` | `Thrift / HTTP / GraphQL` | `<C/L/F-ID or symbol>` | `<behavior>`           | `<fallback>`               | `<policy>`    |

### Thrift

Provide the exact IDL exception or result representation in a `thrift` block, then define field stability, server/caller conversion, and unknown/mixed-version behavior. A Thrift exception does not own application meaning; it encodes a canonical Error ID at a backend boundary.

### HTTP

Provide the exact status-specific envelope in `http`, `json`, Rust, or TypeScript blocks, then define content type, headers, credential/token effects, empty versus structured body, and malformed/unknown fallback. Keep normal success shapes in [integration-contracts.md](integration-contracts.md).

### GraphQL

Define exact `errors[].extensions` runtime fields in TypeScript and parser/guard declarations; this object is outside GraphQL SDL and code generation. The default target contract contains a stable application `code`, optional code-specific user-safe `details`, and optional correlation `traceId`, with exact JSON types and optionality. Keep `message` as a user-safe protocol fallback; never use it for branching, i18n, retry classification, resource extraction, or authentication recovery. Define path/null/partial-data behavior for each affected operation or field.

The same Error ID may have different wire encodings, but transport adapters cannot change its meaning. Record adapter behavior once in the transport table and reference it from occurrence rows.

## Frontend classification and recovery

Maintain an explicit runtime parser/type for every frontend error boundary; GraphQL code generation does not type `errors[].extensions`. Never cast arbitrary data directly to the application error union.

For every affected Error ID, include this frontend recovery/presentation index:

| Error ID     | Parser/details contract | Handling owner | Recovery flow          | Propagate/swallow | i18n key/variables | UI action  | Unknown-code fallback |
| ------------ | ----------------------- | -------------- | ---------------------- | ----------------- | ------------------ | ---------- | --------------------- |
| `<Error ID>` | `<L-ID/type/guard>`     | `<owner>`      | `<ST/diagram/step ID>` | `<behavior>`      | `<key/args>`       | `<action>` | `<fallback>`          |

Record:

- runtime code member, details parser/type, and handling owner;
- missing, malformed, and unknown future-code fallback;
- state transitions such as auth/token handling, Zustand reset, browser-key removal, Apollo propagation/refetch behavior, navigation, retry state, or no state change;
- propagate/swallow behavior and exactly-once guarantees;
- i18n key and variables for every supported locale;
- field, form/dialog, toast, retry, reauthentication, navigation, silent cancellation, or generic-boundary UI action.

Build user copy from `code + safe details`, not a server-localized message. Keep generic forward-compatible fallback behavior. Error-triggered state transitions live here; the full store or persistence schema remains in [implementation-contracts.md](implementation-contracts.md).

Provide exact frontend code/detail/parser declarations under their L-IDs. Use numbered steps for a simple recovery and Mermaid `stateDiagram-v2` or `sequenceDiagram` when token removal, Apollo or Zustand reset, navigation, retry, concurrent failures, or exactly-once propagation has branching or ordering constraints. Keep the index as a mapping; do not place the full transition design in a cell.

## Error classes and fallback

Distinguish application errors, validation/coercion/document errors, protocol failures, network/transport failures, client parsing failures, cancellation, and unknown internal failures. Do not classify network/protocol/client failures as domain errors.

Use this operation/boundary occurrence matrix to record only occurrence-specific facts:

| Contract/operation/boundary | Producer Mapping IDs | Possible Error IDs | Side effects before failure | Rollback/partial behavior | Frontend call site     | Behavior override    |
| --------------------------- | -------------------- | ------------------ | --------------------------- | ------------------------- | ---------------------- | -------------------- |
| `<C-ID/symbol>`             | `<EM-IDs>`           | `<Error IDs>`      | `<effects or None>`         | `<behavior>`              | `<path/symbol or N/A>` | `<override or None>` |

Record Contract ID or operation, producer Mapping IDs, possible Error IDs, side effects before failure, rollback/null/partial behavior, frontend call site, and any justified behavior override.

Do not repeat code meaning, safe-details schemas, default i18n, or default UI action in the occurrence matrix.

## Compatibility, security, and observability

Treat code renaming, semantic changes, details changes, adapter changes, and recovery changes as compatibility changes. Define old/new producer and client behavior, rollout order, unknown-code fallback, temporary aliases, removal condition, and rollback.

Never expose database errors/query text, environment contents, transport debug output, stack traces, filesystem paths, internal type dumps, tokens, cookies, credentials, secrets, or raw underlying errors through a message, details field, HTTP body, GraphQL extension, or Thrift exception.

Define the public field allowlist, protected-resource disclosure policy, safe unknown/internal mapping, log location, correlation identifier, severity, and redaction. Never return a Debug representation of the underlying error.

## Required tests

Include this test-coverage table for applicable layers:

| Requirement ID | Layer                                          | Scenario     | Fixture/producer | Expected Error ID/encoding | Security/state/UI assertions |
| -------------- | ---------------------------------------------- | ------------ | ---------------- | -------------------------- | ---------------------------- |
| `<R-ID>`       | `<producer/Thrift/HTTP/GraphQL/frontend/i18n>` | `<scenario>` | `<setup>`        | `<expected>`               | `<assertions>`               |

Cover:

- producer normalization and exhaustiveness;
- Thrift, HTTP, and GraphQL adapter encoding;
- GraphQL path/null/partial-data and mutation side effects;
- frontend known/malformed/unknown parsing;
- exactly-once recovery and propagate/swallow behavior;
- i18n key/variable coverage and safe fallback;
- internal-cause and secret redaction;
- old/new compatibility behavior.

Use repository policy and executable sources for exact commands. Compilation alone does not verify the public error contract.

## Synchronization order

When an error changes:

1. Update the canonical catalog and compatibility decision.
2. Update producer normalization and exhaustive tests.
3. Update every affected transport adapter.
4. Update occurrence rows and side-effect/partial behavior.
5. Update frontend runtime code/type/parser and fallback.
6. Update recovery state transitions, i18n, and UI action.
7. Add cross-layer, security, and compatibility tests.
8. Remove stale codes, aliases, mappings, translations, and consumers when their exit condition is met.

A plan is incomplete if implementation must invent a code, infer safe details or UI behavior, parse message text, or discover an undocumented producer-to-client conversion.
