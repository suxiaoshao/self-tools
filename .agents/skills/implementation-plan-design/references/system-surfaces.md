# Product and System Surfaces

Use this reference only to decide what the canonical plan must assess. Put implementation semantics in the routed contract reference and concrete output in [plan-template.md](plan-template.md).

## Applicability rules

Give every row one status in the canonical plan:

- `Applicable`: the task adds, modifies, deletes, migrates, or deliberately preserves behavior on this surface; expand it in the designated plan section and work packages.
- `No change`: the surface exists in the traced flow but the design intentionally leaves it unchanged; cite exact inspected evidence and the reason.
- `N/A`: the surface is absent from the traced flow; cite enough evidence to support that conclusion.

Use exact paths, symbols, configuration owners, and contract IDs. Record each negative decision once in the canonical matrix. Child plans reference assigned surface IDs and do not copy the matrix.

## Canonical taxonomy

This table is the sole source of applicability rows. Copy every row into the canonical plan; do not merge or invent competing categories in the template.

| ID     | Surface                                                         | Apply when the task touches                                                                                                                  | Required target decision                                                                                  |
| ------ | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `S-01` | Workspace and owner boundaries                                  | Packages, crates, modules, exports, aliases, shared code, manifests, file moves, or ownership                                                | Optimal boundary, public/private API, consumers, additions/moves/deletions, owner documentation           |
| `S-02` | UI composition, interaction, accessibility, responsive behavior | Components, hooks, forms, dialogs, tables, loading/empty/error states, keyboard, focus, ARIA, or layout                                      | Composition owner, state behavior, reused primitives, accessibility and responsive contract               |
| `S-03` | Frontend routes and navigation                                  | Router or feature registration, URL patterns, parameters, outlets, menus, deep links, redirects, or route removal                            | `Add / Modify / Delete`, route owner, lifecycle, compatibility/redirect, consumer cleanup, tests          |
| `S-04` | Zustand and client projections                                  | Store, state/action/selector, middleware, hydration, readers/writers, reset, or deletion                                                     | `Add / Modify / Delete`, authoritative owner, synchronization, reset/cleanup, tests                       |
| `S-05` | Browser persistence                                             | `localStorage` or another browser-persisted key/schema, migration, account boundary, or removal                                              | `Add / Modify / Delete`, literal key owner, schema/version, migration, lifecycle, privacy, tests          |
| `S-06` | Frontend to backend GraphQL                                     | Server schema, resolver, operation, fragment, SDL snapshot, code generation, or generated consumer                                           | Authoritative chain, exact contract change, derived projection, compatibility, rollout                    |
| `S-07` | Frontend to backend direct HTTP                                 | Login/WebAuthn JSON, streamed/binary content, or another non-GraphQL browser/service boundary                                                | Request/response/body-mode contract, validation, credentials/status/headers, consumer, compatibility      |
| `S-08` | Backend to backend contract                                     | Thrift IDL, generated bindings, service call, exception, service discovery, or deployment order                                              | Authoritative definition, field/optionality stability, callers, conversion, compatibility, rollout        |
| `S-09` | Frontend to frontend composition                                | Portal/feature package exports, feature configuration, router/menu registration, providers, shared context, or removal                       | Producer/consumer boundary, composition mechanism, provider/state ownership, lifecycle, compatibility     |
| `S-10` | Error identity and propagation                                  | New/changed/removed error, validation failure, error envelope, transport mapping, parser, recovery, or error UI                              | Canonical error ID, safe details, producer mapping, adapters, recovery/i18n/UI, compatibility, tests      |
| `S-11` | Database and migrations                                         | Tables, columns, constraints, indexes, queries, transactions, models, schema generation, backfill, or rollback                               | Final schema/query, migration and existing-data policy, atomicity, rollback, consumers, tests             |
| `S-12` | Generated, synchronized, or vendored artifacts                  | Generator input/output, maintained snapshot, registry source, vendored code, or derived schema                                               | Handwritten source, actual entrypoint, expected diff, ownership, manual-edit policy                       |
| `S-13` | State, cache, pagination, and async lifecycle                   | Mutable server/client state, cache policy, pagination, long requests, listeners, tasks, concurrency, retry, cancellation, or shutdown        | Authority, projections, invalidation/reset, limits/order, resource and cancellation ownership             |
| `S-14` | Security, privacy, and secrets                                  | Authentication, authorization, browser storage, credentials, cookies, CORS, headers, WebAuthn, secrets, database access, or trust boundaries | Validation, least exposure, secret owner, redaction, data lifecycle, abuse/failure behavior               |
| `S-15` | Observability                                                   | Request path, middleware, dependency failure, trace propagation, logs, metrics, or operational diagnosis                                     | Event/span ownership, structured fields, severity, correlation, sampling/redaction, verification          |
| `S-16` | Runtime configuration and deployment                            | Environment, gateway routes, TLS, Docker image, Compose, xtask, ports, volumes, networks, certificates, or rollout                           | Config owner/default, topology, ordering, rebuild/recreate behavior, prerequisites, rollback              |
| `S-17` | CI and release automation                                       | Workflow trigger, path filter, build/test matrix, artifact/image publication, secret, or release gate                                        | Exact workflow change, affected artifacts, evidence, compatibility and release condition                  |
| `S-18` | i18n                                                            | User-visible copy, error/validation text, labels, accessibility text, interpolation, plural/select, or formatting                            | Key owner, all supported locales, variables, caller/UI state, fallback, tests                             |
| `S-19` | Dependencies, frameworks, and toolchains                        | Package/crate add/remove/update, feature/source/pin, runtime, generator, manifest, or lockfile                                               | Evidence-backed target, compatibility class, migration, coupled artifacts, upstream reuse, stop condition |
| `S-20` | External data acquisition                                       | Crawler, third-party HTTP, browser authentication, parsing, normalization, rate/size limit, or partial data                                  | Source/identity, auth, validation, timeout/retry/cancel policy, persistence, deterministic fixtures       |
| `S-21` | Owner documentation and ADRs                                    | Stable architecture, ownership, workflow, prerequisite, public contract, or long-lived decision changes                                      | README/ADR owner, exact update, links, facts that remain in executable sources                            |
| `S-22` | Validation and completion evidence                              | Every durable plan                                                                                                                           | Requirements-to-evidence map, focused and aggregate checks, external prerequisites, unverified boundaries |

## Expansion routing

- Use [implementation-contracts.md](implementation-contracts.md) for `S-01` through `S-05`, `S-11` through `S-15`, `S-18`, and owner-local parts of `S-16` or `S-20`.
- Use [integration-contracts.md](integration-contracts.md) for `S-06` through `S-09` and cross-owner parts of `S-16` or `S-20`.
- Use [error-contracts.md](error-contracts.md) for `S-10`; reference Error IDs from integration and work-package sections instead of restating error semantics.
- Use [dependency-changes.md](dependency-changes.md) and [upstream-reuse-audit.md](upstream-reuse-audit.md) for `S-19`.
- Use [documentation-layout.md](documentation-layout.md) for `S-21` and [plan-template.md](plan-template.md) for `S-17` and `S-22` output.
- Use owner README files, manifests, CLI help, configuration, source, tests, and CI as current evidence for every row. Do not copy changing repository facts into this taxonomy.

Do not introduce a new architecture surface merely to make a plan appear comprehensive. Do not require an icon inventory; for an icon-only control, record its accessible name as part of `S-02`.
