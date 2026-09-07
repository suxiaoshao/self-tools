---
name: implementation-plan-design
description: Create or revise implementation-ready plans for substantial self-tools changes requiring durable coordination; review existing plans read-only when requested. Excludes routine local fixes and ordinary code review.
---

# Implementation Plan Design

A plan resolves decisions needed to implement the requested change. Scale detail to the ambiguity, affected owners, and consequences; routine fixes do not need a new plan.

## Plan contract

- Reuse the owning plan. Change the affected design and work packages without reopening settled, unaffected decisions. Remove obsolete requirements and redundant detail; existing text has no presumption of correctness.
- Record the goal, scope, relevant evidence, target behavior, ownership, implementation order, and sufficient validation. Specify public or cross-owner contracts precisely; leave ordinary private implementation choices to the implementer.
- Use the references as design aids for affected areas, not as a mandatory inventory. Omit irrelevant sections, empty tables, and `N/A` records. Use IDs only where cross-references help.
- Resolve material ambiguity using the user's instructions, existing decisions, and repository conventions. Ask only when a remaining choice materially changes scope, product behavior, public contracts, data, or security boundaries; continue independent authorized work.
- Plan status describes implementation and necessary validation. `Done` does not depend on committing, pushing, PR approval/merge, Issue closure, or production deployment. Those workflows belong in GitHub or the task response. Deployment verification matters only when it is part of the authorized implementation acceptance.
- Distinguish designed behavior from checks required for the current deliverable. For a trial handoff, perform basic checks and directly relevant critical regressions, then hand it over; user feedback or explicit acceptance requests determine further work. Do not turn every risk considered in design into a mechanism or immediate test.
- Record material design changes and completion evidence, not a running work log. Optional commit/PR links provide provenance, never a completion gate. Stop when the requested deliverable is complete.

## Reference routing

Read only references needed by the current change.

| Need                                                   | Reference                                                             |
| ------------------------------------------------------ | --------------------------------------------------------------------- |
| Plan location, ownership, lifecycle                    | [documentation-layout.md](references/documentation-layout.md)         |
| Optional writing structure                             | [plan-template.md](references/plan-template.md)                       |
| Find affected areas                                    | [system-surfaces.md](references/system-surfaces.md)                   |
| Owner-local behavior and invariants                    | [implementation-contracts.md](references/implementation-contracts.md) |
| Changed producer/consumer contracts                    | [integration-contracts.md](references/integration-contracts.md)       |
| Changed public errors and recovery                     | [error-contracts.md](references/error-contracts.md)                   |
| Dependencies, tooling, generated or vendored artifacts | [dependency-changes.md](references/dependency-changes.md)             |
| A concrete upstream replacement candidate              | [upstream-reuse-audit.md](references/upstream-reuse-audit.md)         |
