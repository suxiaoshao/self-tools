# Dependency Changes

Use this reference for dependency, toolchain, generator, runtime-pin, or resolution changes. Research depth follows the actual compatibility risk and local usage.

## Baseline and evidence

Identify the current declaration/resolution, target source/version, affected uses, and coupled artifacts. Use manifests, lockfiles, owner documentation, and primary upstream sources. A short note is sufficient for a simple addition or removal; use a table when several dependencies need comparison.

- For version upgrades, inspect release/migration information across the changed interval for relevant API and behavior changes. Verify uncertain local behavior in current documentation or source.
- Check features, peers, runtime/MSRV, native/TLS, serialization, or generator constraints when affected. Investigate material transitive changes, not every leaf resolution.
- Reusing an already resolved package requires evidence for its intended API and feature compatibility, not a fresh full release audit.
- For Git sources without release notes, use the relevant compare range and source. Record material evidence gaps.

Let the package manager update lockfiles. Verify unfamiliar command options before relying on them.

## Migration and compatibility

Map relevant upstream changes to local edits, removals, consumers, and verification. Include behavior changes that compile successfully, such as defaults, serialization, retry, and caching. Preserve unaffected dependencies and avoid unrelated cleanup.

Document incompatible targets, pins, or unavailable artifacts only when encountered, with the concrete constraint and affected work. Do not invent intermediate migrations when the requested target is unavailable; continue authorized independent work.

For generated or vendored artifacts, identify the source, existing update entrypoint, local customizations, and expected diff. Change handwritten inputs first and regenerate. Follow the verified managing tool's provenance/format rules for official vendored content; do not overwrite customizations or claim a failed manager operation succeeded. Repository-owned skills need changes only where the dependency invalidates their guidance.

Use [upstream-reuse-audit.md](upstream-reuse-audit.md) for a concrete replacement candidate relevant to this migration. Dependency work does not automatically include a subsystem redesign or a repository-wide reuse audit.

## Completion

Confirm the resolved dependency and affected consumers match the chosen contract, generated artifacts are synchronized where needed, and focused compatibility checks pass. Record unresolved constraints and relevant removals in the plan's existing validation/completion sections; no separate inventory-completion gate is needed.
