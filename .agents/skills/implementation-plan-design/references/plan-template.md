# Implementation Plan Structure

Use the [layout reference](documentation-layout.md) for placement and lifecycle. The outline below is optional: combine or omit sections when that makes the plan clearer. Do not create placeholders for work outside the request.

## Status and scope

Record implementation status, goal, scope, and relevant owner or issue links. Distinguish proposed design from observed behavior. Include compatibility or data constraints only when affected.

## Evidence and decisions

Explain the current problem with enough source evidence to justify the design. Record consequential choices, relevant alternatives, and unresolved decisions that actually block implementation. Do not reproduce the investigation transcript or require confirmation of decisions already authorized.

## Target design

Describe affected owners, producers and consumers, behavior, and critical invariants. Provide exact declarations for new or changed public/cross-owner contracts; reference unchanged contracts in source. Private helper signatures and incidental file layout can be decided during implementation.

Use [implementation-contracts.md](implementation-contracts.md), [integration-contracts.md](integration-contracts.md), and [error-contracts.md](error-contracts.md) only for applicable details.

## Work packages

Split work only where responsibility or dependencies justify it. Each package identifies the owner, relevant files or symbols, required change, dependencies, and observable completion condition. A small cohesive change can use a short ordered list.

## Validation

Map changed behavior and critical invariants to minimal sufficient evidence. Reuse existing coverage. One check can cover several requirements or consumers; cross-package scope alone does not require another full-suite pass. Follow required CI/hooks when their triggering action occurs, without rerunning them preemptively.

Separate current delivery checks from later scenarios only where the distinction matters. User-requested trial delivery stops after basic checks and directly relevant critical regressions; do not require completion of the whole plan or an extra acceptance phase to hand it over. Security and data-integrity checks needed for that delivery remain required.

Record actual results and material unverified limits once. Rerun affected checks after relevant changes or failures; do not add browser, live-network, deployment, or final audits merely because a template mentions them.

## Completion evidence

Summarize implemented behavior, necessary validation, material deviations, and known limits. Update when those facts change, not after every action. Commit/PR references are optional; omit pending submission, merge, Issue closure, and production-release status. Completion follows the [lifecycle definition](documentation-layout.md#manage-lifecycle).

## Representation rules

- Prefer prose or short lists for simple decisions and steps.
- Use annotated trees for meaningful ownership or hierarchy, declarations for precise contracts, and pseudocode for nontrivial behavior.
- Use tables for actual comparisons or repeated mappings; use diagrams when they explain relationships or ordering more clearly than text.
- Keep each fact in one place. Stable IDs help larger plans cross-reference contracts and work packages; preserve IDs already referenced, without requiring IDs for every file, type, or test.

## Plan map

Create child plans only for substantial independent owner detail. Link parent and child in both directions; keep aggregate status in the parent. A child needs its scope, assigned work, local design, and focused validation, not a copy of the parent outline.
