---
name: implementation-plan-design
description: Create or revise implementation-ready plans for substantial self-tools changes requiring durable coordination; review existing plans read-only when requested. Excludes routine local fixes and ordinary code review.
---

# Implementation Plan Design

Substantial changes need a durable specification of ownership, exact contracts, work packages and completion evidence. Routine local fixes without material contract, ownership or dependency changes do not need a plan. A plan-only request delivers the plan; a review delivers findings.

## Plan contract

- Reuse the plan that already owns the change. Revisions affect changed work packages, decisions, dependencies and indexes while preserving settled structure and evidence.
- Place the canonical plan at its smallest complete owner scope and register it in root `docs/dev/README.md`; use child plans for separate owners according to the layout reference. Implementation starts when the canonical plan is `Ready`.
- Identify affected surfaces with the applicability reference. Specify affected files, symbols, stable IDs, interfaces, lifecycle, dependencies, tests, deletions and acceptance criteria; keep each fact in one canonical location.
- Separate current facts, verified upstream facts, design decisions, user decisions, release-gated assumptions and implementation evidence. Verify proposed API names, versions, feature flags, configuration and generation/migration entrypoints before marking `Ready`.
- `Ready` means work packages can be implemented without inventing missing contracts or resolving material product/architecture choices. Material discoveries update the plan; completion records actual validation, deviations, implementation references, owner-document updates, unverified boundaries and `Done` evidence.

## Reference routing

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

Representation and handoff consistency belong to `plan-template.md`; location, indexes and lifecycle belong to `documentation-layout.md`.
