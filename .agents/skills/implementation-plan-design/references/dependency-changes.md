# Dependency Changes

Use this reference for additions, removals, upgrades, downgrades, source changes, pins, framework/toolchain changes, generator changes, runtime-pin changes, manifest changes, or lockfile-only resolution changes. Treat them as source and behavior migrations, not version-string churn.

## Contents

- [Baseline and target inventory](#baseline-and-target-inventory)
- [Evidence scope](#evidence-scope)
- [Compatibility and release gates](#compatibility-and-release-gates)
- [Breaking and behavioral migration](#breaking-and-behavioral-migration)
- [Coupled skills, generated artifacts, and vendored source](#coupled-skills-generated-artifacts-and-vendored-source)
- [Upstream reuse](#upstream-reuse)
- [Stop conditions and completion evidence](#stop-conditions-and-completion-evidence)

## Baseline and target inventory

Capture the baseline before mutating manifests or lockfiles. Use current read-only package-manager inspection, resolved lockfiles, manifests, runtime pins, features, generator configuration, CI, and container inputs. Verify command help before relying on a package-manager option; record exact commands in the plan work packages instead of freezing a universal update command here.

Include this dependency inventory in the canonical plan. Add one row for every changed direct dependency and every material transitive dependency. For ordinary leaf lockfile churn, name the owning direct dependency and resolution reason without requiring a separate release audit.

| Dependency | Scope and kind | Current declaration/resolution | Target source/version | Authoritative evidence | Local uses and coupled artifacts | Runtime/platform constraints | Classification and migration decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `<name>` | `<direct/transitive; runtime/dev/build/etc.>` | `<manifest and resolved source>` | `<exact target/range/SHA>` | `<primary sources>` | `<paths, APIs, config, generators>` | `<features/peer/MSRV/native/TLS/etc.>` | `<state and exact action>` |

For each row, define:

- direct/transitive scope and runtime/dev/build/generator/framework/toolchain kind;
- current declaration plus resolved registry, Git, or path source;
- exact target version, range/pin policy, tag, or full Git SHA;
- authoritative evidence and complete crossed interval;
- exact local imports, APIs, configuration, features, generators, CI/Docker consumers, and coupled artifacts;
- peer, duplicate-major, runtime/MSRV, platform, native, TLS, and serialization constraints;
- compatibility classification and exact migration, pin, rejection, or gate decision.

Use the package manager to update lockfiles and preserve its format. Never hand-edit a lockfile as a substitute for dependency resolution.

## Evidence scope

For every changed direct dependency, inspect:

1. the current declaration and resolved source;
2. the target release, tag, commit, and published contents;
3. official release notes/changelog across the complete interval;
4. applicable migration guides;
5. current public API, configuration, examples, and source for locally used behavior;
6. default/enabled features, peer ranges, runtime/MSRV, platform, native, and TLS requirements;
7. dependency-tree changes and high-risk transitives.

Use primary sources. Record exact URLs, tags, full SHAs, changelog headings, pull requests, and repository paths; do not write only “review changelog.”

When a Git dependency lacks complete release notes, use the pinned-to-target compare range, merged pull requests, manifests, public source, tests, and documentation, and state that the upstream release record is incomplete.

Research material transitive changes for native/database/TLS/network/runtime/proc-macro/serialization/framework/generator dependencies and changes that create duplicate `links`, peer/runtime/TLS conflicts, or multiple major API surfaces. Do not require full changelog review for ordinary leaf churn.

## Compatibility and release gates

Assign every proposed target one state:

- `Compatible`: migrate and verify in the current batch.
- `Incompatible`: record the exact blocker and defer only this dependency while independent compatible work continues.
- `Pinned`: retain an exact source/version with its constraint and removal condition.
- `Release-gated`: name the unavailable artifact and exact future verification procedure.
- `Rejected`: record why the target is unsuitable and leave no exploratory manifest churn.

Do not infer compatibility from a successful build. Verify the complete local usage and behavioral surface.

For an unreleased final target, split work into a `Known migration` from the current version to the latest published version and a `Release-gated delta` from that version to the awaited artifact. Do not postpone known migration research solely because a later target is unavailable.

If registry or upstream state changes after research, refresh the affected evidence and decision before accepting a materially different resolution.

## Breaking and behavioral migration

Include this upstream-change mapping for every relevant breaking or behavioral change:

| Upstream change     | Old local use        | Exact call sites  | New API or behavior | Required edit or deletion | Tests        |
| ------------------- | -------------------- | ----------------- | ------------------- | ------------------------- | ------------ |
| `<verified change>` | `<current behavior>` | `<paths/symbols>` | `<target behavior>` | `<edit/delete>`           | `<test IDs>` |

Include changes that can compile while altering defaults, ordering, serialization, error variants, retry behavior, caching, persistence, code generation, feature defaults, peer constraints, or platform behavior.

Search every affected import, configuration key, plugin, feature, CLI call, generated artifact, test, CI job, Docker input, and documentation consumer. Apply the verified current API/configuration, remove deprecated names and obsolete adapters, regenerate with upgraded tools, inspect outputs, and search explicitly for old paths afterward.

Compilation does not prove migration completeness or recommended API usage. List deletions of compatibility packages, options, helpers, and workarounds as explicit work.

## Coupled skills, generated artifacts, and vendored source

Include this table for generator output, version-coupled repository skills, registry source, and vendored code:

| Dependency/target | Coupled artifact | Ownership/provenance | Required synchronization | Adaptation or deletion | Evidence and focused check |
| ----------------- | ---------------- | -------------------- | ------------------------ | ---------------------- | -------------------------- |
| `<target>`        | `<artifact>`     | `<owner/source>`     | `<verified entrypoint>`  | `<action>`             | `<evidence>`               |

For an official vendored skill, synchronize the complete verified upstream directory including additions and deletions, preserve upstream bytes, refresh provenance/hash with the managing tool's documented algorithm, compare directories, and run its validator. Do not apply repository formatters to third-party official skill content.

For a repository-owned skill, update only guidance invalidated by the dependency change and validate metadata and references.

If a managing tool fails after retrieval, use manual directory synchronization only when the source and hash algorithm were independently verified. Record the failed command and independent verification; never claim the manager completed successfully.

Treat registry-derived UI or other locally customized vendored source according to repository policy. Compare upstream with local ownership and decide item by item; never overwrite a customized subsystem blindly.

## Upstream reuse

After selecting the target, apply [upstream-reuse-audit.md](upstream-reuse-audit.md) to every affected wrapper, adapter, compatibility layer, parser, helper, state projection, workaround, and vendored subsystem.

A dependency plan is not `Ready` until each affected local subsystem has a `Reuse directly`, `Adapt`, `Retain`, or `Defer` decision. List removals before additions.

## Stop conditions and completion evidence

Stop only the affected dependency when its target API is unavailable, incompatible, product-sensitive, or unsupported by required runtime/platform constraints. Record the exact blocker, affected call sites, retained source/version, removal or retry condition, and future verification procedure. Continue independent compatible work.

Dependency-specific completion evidence must show:

- manifests and lockfile resolution match every decision;
- all direct and material-transitive inventory rows are complete;
- features, peers, duplicates, runtime/MSRV, platform, native, and TLS constraints are resolved;
- each upstream-change row has matching code/config edits, deletions, and tests;
- old imports/configuration/compatibility paths were searched;
- coupled generated, skill, and vendored artifacts were synchronized or evidenced as unaffected;
- upstream-reuse decisions were executed;
- pins, reversions, rejections, release gates, and stop conditions are accurately recorded.

Use the canonical plan's validation and completion sections for repository-wide commands, status, README updates, and aggregate evidence; do not duplicate them here.
