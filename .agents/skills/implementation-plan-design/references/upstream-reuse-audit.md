# Upstream Reuse and Local-code Audit

Use this reference after dependency/framework research or whenever an established repository/upstream capability may replace custom code.

## Inventory

Search affected packages and crates for local components, adapters, wrappers, state projections, protocol parsers, validators, retry/serialization helpers, compatibility layers, generated workarounds, and vendored source. Compare their semantics with verified upstream API documentation, migration guides, source, tests, examples, and registry content.

Do not limit the audit to files already expected to change. Upstream may remove the reason for local code through new APIs, error types, configuration, accessibility behavior, or defaults.

## Decisions

Include this table in the canonical plan and give every affected local implementation one decision:

| Local implementation | Upstream capability/evidence | Semantic differences | Decision                                  | Files deleted or changed | Regression tests |
| -------------------- | ---------------------------- | -------------------- | ----------------------------------------- | ------------------------ | ---------------- |
| `<path/symbol>`      | `<verified capability>`      | `<differences>`      | `Reuse directly / Adapt / Retain / Defer` | `<paths>`                | `<test IDs>`     |

- `Reuse directly`: delete the local implementation and use upstream.
- `Adapt`: keep a thin repository-specific adapter while delegating generic behavior upstream.
- `Retain`: preserve local code because a verified requirement remains unmet; state the exact gap.
- `Defer`: keep replacement outside the current scope with an explicit reason and follow-up condition.

Record upstream evidence, semantic differences, changed/deleted files, and regression tests for every row. A same-named upstream feature is not equivalent until behavior, state ownership, accessibility, serialization, and platform requirements match.

## Audit questions

- Does upstream now own an API, error type, validator, state helper, protocol driver, generator, or component the repository planned to build?
- Did upstream remove the reason for a wrapper, fallback, compatibility package, or manual parser?
- Can local serialization, retry, pagination, cache, accessibility, or native-platform code be deleted?
- Does a breaking change invalidate the local abstraction rather than merely make it fail to compile?
- Can duplicated frontend state return to the established component, router, Apollo, or server source of truth?

## Deletion-first result

List removals before additions. Narrow every retained adapter to repository-specific responsibility and name the upstream API it delegates to. The plan is not `Ready` until every affected local subsystem has an explicit decision and no hidden migration work remains.
