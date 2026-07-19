# Implementation-ready Plan Template

Use the canonical template for every plan registered in root `docs/dev/README.md`. Use the compact child template only when a canonical hub delegates substantial owner-local detail. Delete instructional text and inapplicable conditional sections when instantiating a plan.

Do not begin implementation while the canonical plan remains `Draft`.

## Representation rules

Choose the smallest form that makes each part of the design unambiguous:

- Use annotated text trees for file/module ownership, route hierarchy, and other nested structures.
- Use language-tagged fenced blocks for exact target declarations and boundary shapes: Rust types, traits, impl signatures and methods; TypeScript types, interfaces, store contracts and component props; GraphQL SDL and operations; Thrift IDL; SQL/schema declarations; and HTTP/JSON contracts.
- Use pseudocode for algorithms, migrations, reset/invalidation rules, retry/rollback policy, or state transitions whose behavior must be fixed without prescribing a full implementation body.
- Use Mermaid `flowchart`, `sequenceDiagram`, or `stateDiagram-v2` for topology and projections, multi-participant ordering, branching/error propagation, or lifecycle state. Use numbered steps when a flow is simple and linear. Use PlantUML only when the repository already has a verified rendering and validation workflow.
- Use tables for homogeneous records that must be compared or mapped across the same fields, such as applicability, evidence, compatibility, browser-storage keys, error catalogs, dependencies, test coverage, and validation results.
- Use short prose or lists for rationale, invariants, non-responsibilities, security policy, and exceptional behavior.

Keep each fact in one canonical representation and reference it by stable ID elsewhere. Put IDs in headings, tree annotations, diagram nodes, list items, or table rows as appropriate; traceability does not require turning the contract body into a table. Exact declaration blocks define target contracts, not complete implementation bodies. Do not add a diagram when it would merely restate a clearer tree, declaration, table, or numbered sequence.

## Canonical plan template

# <Issue or outcome>: <Observable result>

## Status and scope

- Status: `Draft`
- Tracking issue: `<link or None>`
- Canonical owner: `<repo, web, server, docker, package, or crate>`
- Canonical plan: `<repository-relative path>`
- Branch: `<branch or Not created>`
- Affected owners: `<exact package/crate/config owners>`
- Release gates: `<named gate and verification procedure or None>`
- Last evidence refresh: `<YYYY-MM-DD>`
- Implementation references: `Pending`

### Goal

State the observable product or engineering outcome.

### Non-goals

List behavior, migrations, compatibility work, and cleanup intentionally excluded from this task.

### User decisions

Record only decisions the user explicitly confirmed. Do not persist unanswered questions, inferred preferences, recommendations, or assumed answers as user decisions.

### Compatibility and migration policy

State compatibility for existing APIs, data, configuration, clients, and deployments. Define rollout, rebuild, backfill, rollback, and intentional incompatibility policies.

### Plan map

Omit for a single-document plan.

| Scope           | Document               | Owns                                                                                |
| --------------- | ---------------------- | ----------------------------------------------------------------------------------- |
| Cross-scope hub | This document          | Shared evidence, decisions, contracts, sequencing, status, and aggregate validation |
| `<owner>`       | [`<child plan>`](path) | `<owner-local responsibility and WP IDs>`                                           |

## Applicability

Copy every canonical row from [system-surfaces.md](system-surfaces.md) without merging or renaming IDs. Fill each row once with `Applicable`, `No change`, or `N/A`. Cite exact evidence for negative decisions.

| ID       | Surface               | Status    | Current evidence                     | Target decision                            | Owner / WP   |
| -------- | --------------------- | --------- | ------------------------------------ | ------------------------------------------ | ------------ |
| `<S-ID>` | `<canonical surface>` | `<value>` | `<exact paths/symbols/config/tests>` | `<decision or evidenced no-change reason>` | `<owner/WP>` |

## Evidence

### Current flow

Trace the exact current sequence from entrypoint through validation/authentication, state or data acquisition, transformation/persistence, integration boundaries, frontend state/projection, UI/i18n, failures, lifecycle, and deployment consumers. Use numbered steps for a simple linear sequence; use Mermaid flow or sequence diagrams when ownership branches or several participants interact. Label every step or node with exact paths and symbols.

### Evidence registry

| ID     | Classification  | Claim                    | Evidence                                               | Plan consequence       |
| ------ | --------------- | ------------------------ | ------------------------------------------------------ | ---------------------- |
| `E-01` | `Current fact`  | `<verified claim>`       | `<local path, symbol, config, test, or command>`       | `<consequence>`        |
| `E-02` | `Upstream fact` | `<verified claim>`       | `<official docs, release, tag, PR, commit, or source>` | `<consequence>`        |
| `E-03` | `User decision` | `<resolved decision>`    | `<conversation decision>`                              | `<consequence>`        |
| `E-04` | `Release-gated` | `<unavailable artifact>` | `<current evidence and future verification>`           | `<blocked scope only>` |

Do not present proposed names or unverified APIs as current facts. Keep stable current architecture in executable sources and owner README files; cite it here rather than copying it into multiple plan documents.

### Conditional evidence tables

- For `S-19`, insert the dependency inventory, upstream-change mapping, and coupled-artifact tables from [dependency-changes.md](dependency-changes.md).
- When upstream or shared capability may replace local code, insert the decision table from [upstream-reuse-audit.md](upstream-reuse-audit.md).

Keep these tables in the canonical plan or owning child exactly once. Reference their row IDs from decisions and work packages.

## Decisions

Assign stable IDs and reference them from contracts, work packages, and child plans.

| ID     | Decision            | Evidence                   | Material rejected alternative | Consequence and owner                   |
| ------ | ------------------- | -------------------------- | ----------------------------- | --------------------------------------- |
| `D-01` | `<selected design>` | `<E-IDs or direct source>` | `<only when useful>`          | `<behavior, maintenance, owner impact>` |

Before setting `Ready`, obtain user confirmation for every material choice not uniquely fixed by explicit repository policy. This includes choices affecting behavior, public API, schema, ownership, security, dependencies, compatibility, and long-term architecture.

## Target design

Include only applicable subsections. In a hub with children, keep shared and hub-owned detail here; place owner-local detail only in its child.

### File and ownership tree

Assign a stable `F-<number>` ID to every added, modified, moved, deleted, generated, or vendored path. Use one annotated tree per owner so hierarchy and ownership remain visible:

```text
<owner root>/
├── <path>  # F-01 [Modify, handwritten] <responsibility and source-of-truth role>
├── <path>  # F-02 [Add, generated from G-01] <consumer role>
├── <old path> -> <new path>  # F-03 [Move] <responsibility>
└── <path>  # F-04 [Delete] <removed responsibility/consumer>
```

Include source files, consumers, tests, configuration, manifests, migrations, snapshots, generated/vendored outputs, documentation, and deletions. Record non-responsibilities or dependency-direction reasons below the relevant tree when they are not obvious. In a hub with children, show only hub-owned files and child-plan documents; each child owns its local tree. Work packages reference F-IDs instead of repeating paths and actions.

### Owner-local type and API contracts

Apply [implementation-contracts.md](implementation-contracts.md).

For each local contract, add a `#### L-<number>: <symbol or operation>` subsection with:

- F-ID and exact location;
- visibility and owning module;
- callers/consumers;
- referenced Error IDs and requirement/test IDs;
- a language-tagged block containing exact target types, interfaces, traits, impl signatures, functions, methods, props, or hooks;
- invariants, validation, conversions, side effects, authorization, lifecycle, concurrency, and failure behavior that the declarations cannot express.

Do not replace a known declaration with prose or pseudocode. Do not write full method bodies unless a short fragment is the only clear way to fix a critical invariant; describe ordinary implementation sequencing in the work package.

### Frontend routes

Use a route tree, not a filesystem tree, unless the verified router is file-based. Annotate every affected node with an `RT-<number>` ID, `Add / Modify / Delete`, the exact registration F-ID/path and symbol, and its owner:

```text
/  # RT-01 <root layout; registration F-ID:symbol>
└── <segment/:param>  # RT-02 [Add] <component; owner>
    └── <child>  # RT-03 [Modify] <component; owner>
```

Below the tree, define parameters, parent/outlet, menu/navigation, authentication, loader/action/error boundaries when present, deep-link and unknown-route behavior, navigation lifecycle, removed-URL redirect/compatibility, cleanup, and tests. Include exact JSX/router configuration in a `tsx` block when hierarchy alone does not fix the contract.

### Zustand stores

For each affected store, add a `#### ZS-<number>: <store>` subsection. Include its F-ID/path, authoritative owner, middleware and creation boundary, then provide exact TypeScript declarations for state, actions, selectors, subscribers, and externally visible hooks. Name every writer and reader.

Use concise pseudocode or Mermaid `stateDiagram-v2` only when hydration, authentication, navigation, reload, stale-result handling, reset, renamed/deleted members, or cross-store synchronization is non-trivial. Reference requirement/test IDs and consumer cleanup explicitly.

### Browser persistence

Use this inventory for every affected `localStorage` or other browser-persisted value:

| BP ID   | Literal key | Action                  | Owner/F-ID | Serialized type and parser | Migration/removal                  | Lifecycle/privacy                 | Tests       |
| ------- | ----------- | ----------------------- | ---------- | -------------------------- | ---------------------------------- | --------------------------------- | ----------- |
| `BP-01` | `<key>`     | `Add / Modify / Delete` | `<owner>`  | `<L-ID/symbol>`            | `<version/old key/policy or None>` | `<account/reload/cross-tab rule>` | `<R/T IDs>` |

Provide the exact serialized TypeScript type and parser/serializer signatures under the referenced L-ID. Use pseudocode for multi-step migration or interrupted-migration recovery. Define missing, malformed, unknown-version, deletion, logout/account-switch, reload, cross-tab, privacy, and test behavior.

### State and data flow

Assign `ST-<number>` IDs to authoritative values and projections. Use the representation that exposes the real relationship:

- Mermaid `flowchart` for ownership, transformation, cache/persistence, and derived projections;
- Mermaid `sequenceDiagram` for end-to-end request/data ordering across participants;
- Mermaid `stateDiagram-v2` for lifecycle, reset, retry, cancellation, and stale-state transitions;
- numbered steps for a simple linear flow;
- an optional compact table only when several homogeneous values need field-by-field comparison.

Label diagram nodes or steps with ST/C/Error/F IDs and exact symbols. Define writers, readers, conversion, persistence/cache, invalidation/reset, stale behavior, and the reason for every duplicated projection. Do not duplicate exact type or transport shapes from their canonical declaration blocks.

### Generated and synchronized lineage

Assign one `G-<number>` ID per lineage. Use an annotated text chain for a linear lineage or Mermaid `flowchart` when it branches to several outputs or consumers. Include handwritten source F-ID, optional snapshot/intermediate F-ID, generated/synchronized output F-IDs, verified existing entrypoint, manual-edit policy, consumers, and drift checks. Use a compact table only when several homogeneous lineages are easier to compare than to draw.

### Integration contracts

For `S-06` through `S-09`, insert the contract registry, exact protocol or TypeScript declaration bodies, required trees/flows, and compatibility matrix from [integration-contracts.md](integration-contracts.md). Keep normal boundary shapes there and reference Error IDs rather than copying error semantics.

### Error contracts

For `S-10`, insert the canonical catalog and details declarations, producer-normalization mapping, normalized transport-adapter index and exact encodings, affected propagation/recovery flows, occurrence matrix, frontend-recovery index, and test coverage from [error-contracts.md](error-contracts.md). The canonical catalog and referenced details declarations alone own error meaning and safe details.

### Database and migration design

For each `DB-<number>` object or query, provide the exact target SQL, Diesel schema/model declaration, or repository-native query signature in a language-tagged block. Then record constraints, indexes, transaction/atomicity, callers, migration/backfill sequence, existing-data policy, rollback/rebuild policy, and requirement/test IDs. Use a table only for a multi-object migration ledger or old/new compatibility matrix.

### i18n design

| Key               | Locale files    | Meaning     | Interpolation/plural/select | Caller and UI state | Fallback     | Tests       |
| ----------------- | --------------- | ----------- | --------------------------- | ------------------- | ------------ | ----------- |
| `<namespace.key>` | `<exact paths>` | `<meaning>` | `<variables/rules>`         | `<caller/state>`    | `<behavior>` | `<R/T IDs>` |

### Configuration, security, observability, and deployment

Define exact configuration owners/defaults, environment and secret boundaries, auth checks, route/container/topology changes, trace/log fields and redaction, rollout order, rollback, and external prerequisites. Reference contract, state, error, and file IDs instead of repeating their definitions.

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

**Tests**

| Requirement ID | Test ID/file  | Proposed scenario | Fixture/mock | Assertions                |
| -------------- | ------------- | ----------------- | ------------ | ------------------------- |
| `<R-ID>`       | `<T-ID/path>` | `<name>`          | `<setup>`    | `<observable assertions>` |

**Focused validation**

| Command or manual scenario          | Purpose   | Required environment | Expected evidence     |
| ----------------------------------- | --------- | -------------------- | --------------------- |
| `<repository-supported entrypoint>` | `<scope>` | `<prerequisites>`    | `<success condition>` |

**Done condition**

State the observable result, expected generated/migration/dependency diff, removed legacy paths, required evidence, and stop conditions.

## Validation

Map each requirement to completion evidence. Take the union of applicable scopes and current repository policy; run focused checks before aggregate checks.

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

Set `Done` only when every required item is complete or recorded as an accurately scoped accepted limitation.

## Execution handoff audit

- [ ] Keep every implementation fact in exactly one canonical hub or owner child.
- [ ] Register the canonical plan and link children bidirectionally.
- [ ] Copy and decide every applicability row from the sole taxonomy.
- [ ] Record explicit user confirmation for every material choice not uniquely fixed by repository policy; verify every proposed upstream/local API.
- [ ] Show every affected path in an owner file tree with F-ID, action, artifact kind, responsibility, generated source when applicable, consumers, deletion, and owner docs.
- [ ] Provide native target declarations and signatures for every L/C/Error/DB contract instead of hiding exact shapes in prose or wide table cells.
- [ ] Show every affected route in a route tree, every Zustand store through exact TypeScript contracts plus needed transition logic, and every browser-persistence key in the BP inventory with migration/removal, lifecycle, privacy, and tests.
- [ ] Use numbered flow, Mermaid, pseudocode, prose, or tables according to the representation rules; label references with stable IDs and do not duplicate canonical facts.
- [ ] Assign one authority to every mutable value and an invalidation/reset rule to every projection.
- [ ] Give every integration boundary one Contract ID, authoritative definition, consumers, compatibility, and rollout.
- [ ] Inventory every changed error exactly once and connect producers, adapters, frontend parser/code, recovery, i18n/UI, compatibility, and tests.
- [ ] Define migration atomicity, rollback, generated lineage, dependency evidence, and upstream reuse when applicable.
- [ ] Map each requirement to tests and validation evidence.
- [ ] Remove broad research tasks, repeated tables, ambiguous verbs, speculative APIs, and compatibility layers without exit conditions.
- [ ] Narrow every release gate to an exact future verification procedure.
- [ ] Ensure implementation requires no invented architecture, contract, or acceptance criterion.

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
