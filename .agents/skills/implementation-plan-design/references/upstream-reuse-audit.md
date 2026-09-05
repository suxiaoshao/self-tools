# Upstream Reuse and Local-code Audit

Use this reference after dependency/framework research or whenever an established repository/upstream capability may replace custom code.

## Inventory

Start from the local implementation or upstream change relevant to the task. Follow its consumers and semantic dependencies far enough to establish whether replacement is viable. Broader repository inventory requires a task that calls for it.

Compare behavior, state ownership, error handling, serialization, accessibility and platform requirements where relevant. Verify source/API behavior when release notes or component-document changes do not establish it.

## Decisions

Record one decision per candidate in the canonical plan:

| Local implementation | Upstream capability/evidence | Semantic differences | Decision                                  | Files deleted or changed | Regression tests |
| -------------------- | ---------------------------- | -------------------- | ----------------------------------------- | ------------------------ | ---------------- |
| `<path/symbol>`      | `<verified capability>`      | `<differences>`      | `Reuse directly / Adapt / Retain / Defer` | `<paths>`                | `<test IDs>`     |

- `Reuse directly`: delete the local implementation and use upstream.
- `Adapt`: keep a thin repository-specific adapter while delegating generic behavior upstream.
- `Retain`: preserve local code because a verified requirement remains unmet; state the exact gap.
- `Defer`: keep replacement outside the current scope with an explicit reason and follow-up condition.

A same-named upstream feature alone does not establish semantic equivalence.

## Audit questions

- Does upstream now own an API, error type, validator, state helper, protocol driver, generator, or component the repository planned to build?
- Did upstream remove the reason for a wrapper, fallback, compatibility package, or manual parser?
- Can local serialization, retry, pagination, cache, accessibility, or native-platform code be deleted?
- Does a breaking change invalidate the local abstraction rather than merely make it fail to compile?
- Can duplicated frontend state return to the established component, router, Apollo, or server source of truth?

## Deletion-first result

List removals before additions. Narrow every retained adapter to repository-specific responsibility and name the upstream API it delegates to. Resolve the selected candidates and their migration dependencies before their work packages become executable.
