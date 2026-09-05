# Implementation-ready Plan Template

Use the [layout reference](documentation-layout.md) for placement, ownership, indexes and lifecycle. Instantiate the relevant skeleton and remove instructional text and inapplicable sections. Shared facts have one canonical owner.

## Representation rules

Choose the smallest form that makes each part of the design unambiguous:

- Use annotated text trees for file/module ownership, route hierarchy, and other nested structures.
- Use language-tagged fenced blocks for exact target declarations and boundary shapes: Rust types, traits, impl signatures and methods; TypeScript types, interfaces, store contracts and component props; GraphQL SDL and operations; Thrift IDL; SQL/schema declarations; and HTTP/JSON contracts.
- Use pseudocode for algorithms, migrations, reset/invalidation rules, retry/rollback policy, or state transitions whose behavior must be fixed without prescribing a full implementation body.
- Use Mermaid `flowchart`, `sequenceDiagram`, or `stateDiagram-v2` for topology and projections, multi-participant ordering, branching/error propagation, or lifecycle state. Use numbered steps when a flow is simple and linear. Use PlantUML only when the repository already has a verified rendering and validation workflow.
- Use tables for homogeneous records that must be compared or mapped across the same fields, such as applicability, evidence, compatibility, browser-storage keys, error catalogs, dependencies, test coverage, and validation results.
- Use short prose or lists for rationale, invariants, non-responsibilities, security policy, and exceptional behavior.

Keep each fact in one canonical representation and reference it by stable ID elsewhere. Put IDs in headings, tree annotations, diagram nodes, list items, or table rows as appropriate; traceability does not require turning the contract body into a table. Exact declaration blocks define target contracts, not complete implementation bodies. Do not add a diagram when it would merely restate a clearer tree, declaration, table, or numbered sequence.

## Stable IDs

Use only families needed by the plan: `S` surfaces, `E` evidence, `D` decisions,
`F` files, `L` local contracts, `C` integration contracts, `Error` failures,
`EM` producer mappings, `EA` transport adapters,
`RT` routes, `ZS` stores, `BP` browser persistence, `ST` state, `DB` persistence,
`G` generated lineage, `R` requirements, `T` evidence, and `WP` work packages.
Preserve existing IDs; do not renumber surviving items after a deletion.
Each definition has one owner; children reference shared IDs and use distinct
local ranges. Work packages reference definitions rather than copying them.

## Canonical plan template

# <Issue or outcome>: <Observable result>

## Status and scope

- Status: `Draft`
- Tracking issue: `<link or None>`
- Plan ID / canonical path: `<ID and repository-relative path>`
- Canonical owner: `<scope>`
- Branch: `<branch or Not created>`
- Affected owners: `<exact owners>`
- Release gates: `<artifact, dependent WPs, future verification or None>`
- Last evidence refresh: `<YYYY-MM-DD>`
- Implementation references: `Pending`

### Goal and non-goals

State the observable outcome and excluded work. Include material breaking, destructive, security-sensitive or cross-owner effects here, with affected consumers and canonical decision IDs.

### User decisions

Record explicitly confirmed choices; keep design decisions in D-IDs and unresolved consequential questions with their dependent work.

### Compatibility and migration policy

Specify applicable compatibility, existing-data, rollout, rollback or rebuild policy, using current user decisions.

### Plan map

List documents required by [layout and ownership](documentation-layout.md).

| Scope | Document | Owns | IDs/WPs |
| ----- | -------- | ---- | ------- |

## Applicability

Use [system-surfaces.md](system-surfaces.md) as the taxonomy. Include affected surfaces and material no-change decisions; omit unrelated rows. Child/owner plans reference assigned S-IDs.

| S-ID | Surface | Current evidence | Target decision or material no-change reason | Owner/WP |
| ---- | ------- | ---------------- | -------------------------------------------- | -------- |

## Evidence

Trace the affected current flow with exact paths and symbols. Record facts needed for the design:

| E-ID | Classification | Claim | Evidence | Plan consequence |
| ---- | -------------- | ----- | -------- | ---------------- |

Classifications are current fact, upstream fact, user decision and release-gated evidence. Keep target design separate from verified facts. For dependency work, use [dependency-changes.md](dependency-changes.md); where a verified capability may replace local code, use [upstream-reuse-audit.md](upstream-reuse-audit.md).

## Decisions

| D-ID | Decision | Evidence | Material rejected alternative | Consequence/owner |
| ---- | -------- | -------- | ----------------------------- | ----------------- |

## Target design

Include only applicable sections. Local detail belongs in its owning document; shared contracts are referenced by ID.

### File and ownership tree

Use an annotated F-ID tree and [file ownership semantics](implementation-contracts.md#files-modules-and-ownership). A hub shows its own files and links to child-owned trees.

### Owner-local type and API contracts

For each L-ID, record its F-ID/symbol, native target declaration and behavior not expressed by that declaration. Use [implementation-contracts.md](implementation-contracts.md).

### Frontend routes

Use an RT-ID route tree; registration paths belong in F-IDs. Apply [route semantics](implementation-contracts.md#routes-zustand-and-browser-persistence).

### Zustand stores

Use ZS-ID blocks with exact TypeScript state/action/selector contracts and applicable transitions from [the state reference](implementation-contracts.md#routes-zustand-and-browser-persistence).

### Browser persistence

Apply [browser-persistence semantics](implementation-contracts.md#routes-zustand-and-browser-persistence). Type/parser declarations belong under the referenced L-ID.

| BP-ID | Literal key | Action | Owner/F-ID | Serialized type/parser | Migration/removal | Lifecycle/privacy | R/T IDs |
| ----- | ----------- | ------ | ---------- | ---------------------- | ----------------- | ----------------- | ------- |

### State and data flow

Use ST-IDs and [state authority semantics](implementation-contracts.md#state-and-data-authority).

### Generated and synchronized lineage

Use G-ID source-to-output chains with [lineage semantics](implementation-contracts.md#generated-and-synchronized-artifacts).

### Integration contracts

Use [integration-contracts.md](integration-contracts.md) for C-ID declarations, participants and compatibility. Reference Error IDs for failure meaning.

### Error contracts

Use [error-contracts.md](error-contracts.md) for error identity, producer/adapter mappings, recovery and validation.

### Database and migration design

Use DB-ID declarations with [persistence semantics](implementation-contracts.md#database-writes-and-migrations).

### i18n design

Apply [i18n semantics](implementation-contracts.md#i18n-contract).

| Key | Locale files | Meaning | Variables/plural/select | Caller/UI state | Fallback | R/T IDs |
| --- | ------------ | ------- | ----------------------- | --------------- | -------- | ------- |

### Configuration, security, observability, and deployment

Use [owner-local security/diagnostics](implementation-contracts.md#security-and-observability) and [integration contracts](integration-contracts.md) for affected trust and deployment boundaries.

## Work packages

Order work packages by dependency. Assign one owner and one observable outcome to each. Keep research and architecture decisions out of implementation steps.

### WP-<N>: <Outcome>

**Owner**

`<package, crate, or repository owner>`

**Prerequisites and contracts**

- `<prior WP, D-ID, S-ID, L/C/Error/DB/G ID, migration gate, or release gate>`

**File IDs**

- `<F-IDs owned by this WP>`

**Implementation sequence**

1. `<ordered source-of-truth edit and state transition>`
2. `<consumer, adapter, migration, or generated-output update>`
3. `<legacy path, dependency, workaround, or compatibility removal>`

**Applicable failure and lifecycle behavior**

Reference shared IDs, then describe only WP-specific atomicity, partial progress, cancellation, retry, rollback, or shutdown.

**Tests (reference existing R/T entries when sufficient)**

| Requirement ID | Test ID/file  | Proposed scenario | Fixture/mock | Assertions                |
| -------------- | ------------- | ----------------- | ------------ | ------------------------- |
| `<R-ID>`       | `<T-ID/path>` | `<name>`          | `<setup>`    | `<observable assertions>` |

**Focused validation (commands may reference the shared validation table)**

| Command or manual scenario          | Purpose   | Required environment | Expected evidence     |
| ----------------------------------- | --------- | -------------------- | --------------------- |
| `<repository-supported entrypoint>` | `<scope>` | `<prerequisites>`    | `<success condition>` |

**Done condition**

State the observable result, expected generated/migration/dependency diff, removed legacy paths, required evidence, and stop conditions.

## Validation

Map requirements to sufficient evidence for the actual impact and current stage. Reuse existing coverage and remove redundant checks. Aggregate validation is required when cross-owner impact, CI/hooks, or the authorized acceptance scope requires it; do not automatically stack it after every focused check.

| Requirement     | Owner / WP   | Automated or manual evidence                 | Expected result | External prerequisite          |
| --------------- | ------------ | -------------------------------------------- | --------------- | ------------------------------ |
| `<requirement>` | `<owner/WP>` | `<test, command, diff, API, or UI scenario>` | `<result>`      | `<None or exact prerequisite>` |

Discover commands from `AGENTS.md`, manifests, CLI help, owner documentation, configuration, and source. Record exact unverified boundaries when Docker, certificates, domains, databases, browsers, network, or third-party services are unavailable. Do not describe compilation as end-to-end validation.

## Completion evidence

Keep pending until implementation starts, then update continuously.

| Evidence                                                              | Result           |
| --------------------------------------------------------------------- | ---------------- |
| Implementation PR / commits                                           | `Pending`        |
| Actual added, modified, moved, deleted, generated, and vendored files | `Pending`        |
| Delivered contract, state, migration, error, and dependency IDs       | `Pending`        |
| Automated validation commands and results                             | `Pending`        |
| Manual or external scenarios and environment                          | `Pending`        |
| Generated, schema, migration, dependency, or vendored diff            | `Pending`        |
| Owner README and ADR updates                                          | `Pending`        |
| Accepted deviations                                                   | `None / Pending` |
| Unverified boundaries and reason                                      | `None / Pending` |

Status transitions follow [documentation-layout.md](documentation-layout.md#manage-lifecycle).

## Execution handoff audit

At an authorized handoff, check consistency across the affected parts: evidence supports decisions; declarations and owner boundaries agree; WPs cover those decisions in dependency order; requirements map to sufficient validation. Resolve material gaps before `Ready` under [the lifecycle rules](documentation-layout.md#manage-lifecycle). This is a consistency pass, not another copy of the field inventories.

## Compact child plan template

Use only when the canonical hub delegates substantial owner-local detail. Do not add status, a full applicability matrix, shared decisions/contracts, or aggregate completion evidence.

# <Owner>: <Delegated outcome>

## Parent and ownership

- Canonical parent: `<repository-relative link>`
- Owner directory: `<exact package/crate/config directory>`
- Assigned surface IDs: `<S-IDs>`
- Assigned decision IDs: `<D-IDs>`
- Assigned contract/error/migration IDs: `<IDs or None>`
- Assigned work packages: `<WP IDs>`
- Owns: `<exact owner-local responsibility>`
- Does not own: `<shared or sibling responsibility retained by parent/other child>`

## Owner-local evidence

Record only evidence needed for this owner's design that is not already canonical in the parent. Use stable local Evidence IDs and link shared evidence by parent ID.

## Owner-local target design

Instantiate only the applicable owner-local trees, declarations, flows, lists, and tables from the canonical template. Define local File IDs, symbols, state, lineage, tests, and validation. Reference parent S/D/C/Error/DB IDs instead of copying their meaning.

## Owner-local work packages

Use the canonical work-package shape for assigned WPs only. Reference local File IDs and parent contract IDs.

## Focused validation and handoff

List owner-local requirement-to-evidence mappings and external prerequisites. Record deviations that require a parent-plan update; keep aggregate completion status in the parent.
