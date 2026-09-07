# Development Documentation Layout

Use this reference to choose where a durable plan lives, which document owns each detail, and how its lifecycle is recorded.

## Contents

- [Separate artifact roles](#separate-artifact-roles)
- [Choose the canonical owner](#choose-the-canonical-owner)
- [Name the plan](#name-the-plan)
- [Use canonical hubs and child plans](#use-canonical-hubs-and-child-plans)
- [Maintain indexes and links](#maintain-indexes-and-links)
- [Manage lifecycle](#manage-lifecycle)
- [Promote durable decisions to ADRs](#promote-durable-decisions-to-adrs)

## Separate artifact roles

Keep each fact in its durable owner.

| Artifact                                                                    | Owns                                                                      |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Source, manifests, migrations, schemas, configuration, and generator inputs | Executable behavior and runtime contracts                                 |
| Nearest owner `README.md`                                                   | Current stable architecture, ownership, prerequisites, and workflows      |
| `docs/dev/` plan                                                            | Proposed design, evidence, decisions, ordered work, and completion record |
| `docs/adr/` record                                                          | Long-lived decisions that constrain future work                           |
| Root `docs/dev/README.md`                                                   | Canonical-plan discovery registry                                         |
| `AGENTS.md`                                                                 | Stable repository policy and documentation routing                        |

Do not turn a plan into a second permanent runtime specification. Update the executable owner and nearest README when implementation changes stable behavior, architecture, ownership, or workflow.

## Choose the canonical owner

Identify every affected package, crate, shared module, root configuration, database, and deployment boundary. Place the canonical plan at their smallest common owner.

| Scope                                                         | Canonical location                    |
| ------------------------------------------------------------- | ------------------------------------- |
| One frontend package under `web/packages/*` or `web/common/*` | `<package>/docs/dev/<plan>/README.md` |
| Several frontend packages only                                | `web/docs/dev/<plan>/README.md`       |
| One Rust crate under `server/packages/*` or `server/common/*` | `<crate>/docs/dev/<plan>/README.md`   |
| Several Rust crates only                                      | `server/docs/dev/<plan>/README.md`    |
| Docker-only work                                              | `docker/docs/dev/<plan>/README.md`    |
| Cross-frontend/backend/database/deployment work               | `docs/dev/<plan>/README.md`           |
| Root workspace, CI, or repository-wide tooling                | `docs/dev/<plan>/README.md`           |

Create an owner-local `docs/dev` directory only when it contains a real plan. For a single-owner task, make that owner-local plan canonical; do not create an empty root hub.

## Name the plan

Use `issue-<number>/README.md` when a tracking issue already exists. Otherwise use a stable kebab-case outcome such as `unified-error-contracts/README.md`; do not create an issue merely to obtain a directory name.

Preserve an established plan path when an issue appears later unless the user explicitly requests a rename. Put the observable outcome in the document title, not changing implementation detail in the directory name.

## Use canonical hubs and child plans

Use the optional structure in [plan-template.md](plan-template.md), keeping only what the change needs.

For cross-owner work, let the canonical hub own:

- implementation status, scope, and applicable compatibility constraints;
- affected surfaces, material no-change decisions, and shared evidence;
- shared decisions, integration/error contracts, sequencing, and aggregate validation;
- the plan map and final completion evidence.

Create a child plan only when one owner needs substantial independent detail, such as several owner-specific work packages, a public package/crate API, an independent migration or generation boundary, or separately reviewable validation.

Use the compact child structure from [plan-template.md](plan-template.md). Let a child own only:

- its parent link, owner directory, assigned decision/surface/work-package IDs, and explicit boundary;
- exact owner-local files, symbols, implementation contracts, tests, and focused validation;
- owner-local deviations discovered during implementation.

Do not repeat the parent goal, status, applicability matrix, shared decisions, shared contracts, acceptance criteria, or aggregate progress in a child. Reference their stable IDs. Keep status only in the canonical plan.

Use the plan-map shape in [plan-template.md](plan-template.md#plan-map). Link every child from the hub and every child back to the hub.

## Maintain indexes and links

Register every canonical plan, including owner-local plans, in root `docs/dev/README.md`:

| Plan                             | Canonical owner | Purpose                  |
| -------------------------------- | --------------- | ------------------------ |
| `<canonical-plan Markdown link>` | `<owner>`       | `<one-sentence outcome>` |

Do not copy status, work-package progress, or child entries into the root registry. When an owner has several plans, add an owner-local `docs/dev/README.md` with a backlink to the root registry and links to documents located there.

Use repository-relative Markdown links. Keep root `README.md` and `AGENTS.md` linked to the root plan registry.

## Manage lifecycle

Use only these canonical-plan statuses:

| Status        | Meaning                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------- |
| `Draft`       | Evidence, decisions, or implementation contracts remain incomplete                                |
| `Ready`       | Implementation can proceed without unresolved material choices outside the existing authorization |
| `In progress` | Authorized implementation has started                                                             |
| `Blocked`     | A named external condition or required user decision prevents all meaningful progress             |
| `Done`        | Required implementation and validation are complete and recorded                                  |
| `Superseded`  | A linked successor replaces the plan                                                              |

Status tracks implementation and required validation. Commit, push, review, merge, Issue closure, and production rollout status do not control `Done`; keep those changing workflow facts outside the plan. A commit or PR link may be retained as optional provenance. Record deployment behavior and required deployment checks when the change actually affects them, without treating routine release operations as plan work.

Use existing authorization and repository conventions to resolve choices. A missing upstream artifact blocks only the work that actually depends on it. Do not add approval gates for ordinary implementation details or refresh unchanged evidence merely to advance a status.

At completion, summarize delivered behavior, necessary validation and known limits; update affected owner documentation and changed links once. Keep completed plans at their original paths. Later PR or Issue events require no plan edit.

When replacing a plan, preserve the old path, mark it `Superseded`, and link predecessor and successor bidirectionally.

## Promote durable decisions to ADRs

Keep issue-specific choices in the plan. Create an ADR only when a decision must constrain future work or establishes a long-lived architecture, protocol, ownership, persistence, security, or compatibility policy.

Place the ADR at the nearest common owner under `docs/adr/NNNN-<slug>.md`. Link it to the originating plan. Do not use ADRs for work-package ordering, progress, temporary release gates, or details already owned by source and README files.
