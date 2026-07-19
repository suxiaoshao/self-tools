---
name: implementation-plan-design
description: Research, design, review, and maintain docs-first implementation plans for the self-tools frontend/backend monorepo. Use before implementing or reviewing non-trivial features, fixes, refactors, dependency or framework changes, GraphQL/HTTP/Thrift contracts, error behavior, database migrations, generated artifacts, UI flows, deployment work, or coordinated package/crate changes that need a durable executable specification.
---

# Implementation Plan Design

Produce the durable implementation specification before changing production code. Make it executable without rediscovering the repository, inventing contracts, or choosing unresolved architecture.

## Workflow

1. Read repository instructions, the nearest owner README files, manifests, entrypoints, relevant source and tests, generated-artifact configuration, existing plans, and current Git status.
2. Require a durable plan for a new feature or a non-trivial change to public behavior, ownership boundaries, schemas, persistence, security, dependencies/toolchains, generated artifacts, deployment, or multiple coordinated files. Keep a truly local behavior-preserving correction lightweight.
3. Choose the canonical owner and plan topology with [documentation-layout.md](references/documentation-layout.md). Register every canonical plan in root `docs/dev/README.md`.
4. Trace the current flow end to end and classify every planning surface with [system-surfaces.md](references/system-surfaces.md).
5. Define affected owner-local files, modules, types, functions, UI/state, persistence, lifecycle, security, i18n, and generated lineage with [implementation-contracts.md](references/implementation-contracts.md).
6. Load each conditional reference below whose trigger applies. Keep its subject matter in that reference's designated plan section instead of redefining it elsewhere.
7. Surface material product and architecture choices early. Use repository evidence and authoritative upstream sources to determine facts, constraints, and viable options, not to replace user decisions. Before continuing the design, proactively ask the user whenever intent is unclear, multiple reasonable options remain, or an assumption would affect behavior, public API, schema, ownership, security, compatibility, dependency policy, or long-term maintenance. Provide verified evidence, options, impacts, and a recommendation; do not treat the recommendation as approved. Decide independently only ordinary implementation details uniquely determined by code, repository policy, or authoritative sources.
8. Instantiate the canonical or child structure in [plan-template.md](references/plan-template.md). Name exact files, symbols, contract IDs, work packages, tests, validation evidence, deletions, and completion conditions.
9. Re-read the plan as an implementer. Remove vague verbs, repeated facts, speculative APIs, unresolved decisions disguised as steps, and details owned by another document.
10. If implementation was requested, begin only after the canonical plan is `Ready`. Keep it synchronized with material discoveries, then record actual validation, deviations, implementation references, and final `Done` evidence. Stop after the plan or review when that is the requested scope.

## Conditional references

Read a selected reference completely before using it.

| Trigger                                                                            | Reference                                                             | Sole responsibility                                                                  |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Creating, moving, splitting, completing, or superseding a plan                     | [documentation-layout.md](references/documentation-layout.md)         | Canonical location, hub/child ownership, registry, lifecycle, ADR boundary           |
| Assessing plan scope                                                               | [system-surfaces.md](references/system-surfaces.md)                   | Applicability taxonomy only                                                          |
| Designing owner-local implementation                                               | [implementation-contracts.md](references/implementation-contracts.md) | Module, API, UI/state, persistence, lifecycle, security, i18n, and lineage semantics |
| Changing a frontend/backend, backend/backend, or frontend/frontend boundary        | [integration-contracts.md](references/integration-contracts.md)       | Boundary source of truth, transport/composition contract, compatibility, rollout     |
| Adding or changing failures, codes, transport error forms, recovery, or error UI   | [error-contracts.md](references/error-contracts.md)                   | Transport-neutral error identity and end-to-end propagation                          |
| Changing dependencies, frameworks, toolchains, generators, manifests, or lockfiles | [dependency-changes.md](references/dependency-changes.md)             | Dependency evidence, compatibility, migration, coupled artifacts, stop conditions    |
| Evaluating whether upstream can replace local code                                 | [upstream-reuse-audit.md](references/upstream-reuse-audit.md)         | Reuse/adapt/retain/defer decision                                                    |
| Writing or handing off a plan                                                      | [plan-template.md](references/plan-template.md)                       | Canonical and child output skeletons plus aggregate readiness audit                  |

## Rules

- Prefer the optimal file and module boundaries for correctness, cohesion, dependency direction, testability, and long-term ownership; do not optimize for the fewest changed files.
- Match the representation to the information shape using [plan-template.md](references/plan-template.md): annotated trees for hierarchy, native declarations for exact contracts, pseudocode for behavioral rules, Mermaid for topology/sequence/state, tables for comparison and mapping, and prose for rationale. Stable IDs do not require table rows.
- Separate current facts, upstream facts, proposed design, user decisions, generated output, and release-gated assumptions. Cite stable current architecture from owner documentation or executable sources rather than copying it into this skill or multiple plans.
- Verify exact upstream APIs, versions, feature flags, configuration keys, and migration behavior before marking a plan `Ready`.
- Change handwritten sources first, use the repository's real synchronization or generation entrypoint, and inspect the resulting diff. Never invent a command or patch generated output around its source.
- Create issues, branches, commits, pushes, or pull requests only when the user explicitly requests them or repository policy makes them part of the authorized workflow.

Use the lifecycle definitions and readiness requirements in [documentation-layout.md](references/documentation-layout.md) and the final handoff audit in [plan-template.md](references/plan-template.md). If materially incompatible implementations still satisfy the document, the plan is not `Ready`.
