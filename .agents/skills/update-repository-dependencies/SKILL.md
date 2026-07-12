---
name: update-repository-dependencies
description: Update JavaScript and Rust dependencies in a repository from issue creation through migration and validation. Use when asked to upgrade packages, refresh lockfiles, review dependency release notes, migrate deprecated APIs or configuration, update package-specific agent skills, or perform a repository-wide dependency maintenance pass, including projects that vendor shadcn/ui components.
---

# Update Repository Dependencies

Treat a dependency update as a source migration, not a lockfile refresh. Finish compatible work first, then present incompatible upgrades separately for a decision.

## 1. Establish repository rules and baseline

1. Read repository instructions, issue templates, manifests, workspace definitions, runtime pins, CI files, Dockerfiles, and existing dependency-update policy.
2. Inspect `git status` and preserve unrelated user changes.
3. Record the current direct dependency versions, runtime versions, package managers, generated-code commands, and required validation commands.
4. Identify deliberately pinned packages and document why before changing them.

Do not copy machine-specific proxy, registry, credential, or network configuration into repository files or this workflow. If dependency retrieval fails, report the failing command and leave network remediation to the current environment.

## 2. Create the tracking issue and branch

1. Search existing issues and pull requests to avoid duplicates.
2. Read `.github/ISSUE_TEMPLATE` and use the matching repository template.
3. Create an issue that lists:
   - JavaScript and Rust update commands.
   - Documentation and migration review requirements.
   - generated-code and lockfile expectations.
   - validation commands.
   - known pins and incompatible upgrades to evaluate separately.
4. Create and switch to a branch containing the issue number. Follow repository naming rules; otherwise use `codex/issue-<number>-update-dependencies`.

Do not create the branch before the issue number is known.

## 3. Run the repository's package update commands

Use repository-local tooling and preserve its lockfile format.

For a pnpm workspace, run from the workspace root:

```bash
pnpm up -r --latest
```

For a Cargo workspace, run from the workspace root:

```bash
cargo upgrade --incompatible && cargo update
```

If the repository specifies different commands, follow the repository instructions and record the deviation. Never hand-edit a lockfile as a substitute for the package manager.

## 4. Inventory the actual update

Compare manifests and lockfiles before editing application code. Classify every changed direct dependency as:

- patch or minor;
- compatible major;
- incompatible major;
- intentionally pinned or reverted;
- tooling, runtime types, generated-code tooling, or application runtime.

Also inspect important transitive changes when they affect runtime requirements, peer dependencies, security, build output, or public behavior. Align runtime type packages such as `@types/node` with the repository's supported runtime and CI image, not merely the highest published major.

## 5. Review official documentation before migration

For every changed direct dependency, check the authoritative source in this order:

1. migration or upgrade guide;
2. release notes for all versions crossed;
3. changelog;
4. current API and configuration documentation.

Use primary sources. Note whether each package requires code changes, configuration changes, regeneration, runtime changes, or no migration. Do not infer “no migration” only because compilation succeeds.

For a major update, inspect all intermediate migration guides. For a patch update, still check security notes, behavior changes, deprecations, and raised runtime requirements.

## 6. Migrate to current recommended APIs and configuration

Search the repository for every upgraded package's imports, configuration keys, plugins, feature flags, generated artifacts, and CLI invocations.

Apply the library's current recommended form:

- replace compatibility or re-export packages with the canonical package when the library recommends it;
- remove renamed, deprecated, legacy, and compatibility-only options;
- use current entry points and framework adapters;
- regenerate generated code using the upgraded generator;
- update examples, tests, CI, Docker, and documentation that encode the old usage;
- prefer native current configuration even when the old form still compiles through a compatibility layer.

Check deprecation warnings and search explicitly for the old import path or configuration name after migration. Passing type-checks alone does not prove recommended usage.

When an upgrade is incompatible or requires a product decision, stop that package's migration, record the exact incompatibility, complete all other compatible updates, and discuss deferred items only after the rest passes validation.

## 7. Update corresponding repository skills

Dependency-specific skills are versioned maintenance inputs. Inspect `.agents/skills`, other repository skill roots, and `skills-lock.json` for skills related to upgraded libraries.

For each matching skill:

1. identify its declared official source;
2. fetch or update it from that source;
3. synchronize the complete skill directory rather than patching one visible rule;
4. include newly added and deleted official files;
5. refresh lock metadata or the computed content hash using the managing CLI's algorithm;
6. compare the installed directory with the fetched official directory;
7. run the repository's skill validator.

Do not run the repository formatter over installed third-party skill content. Preserve upstream bytes so source comparison and lock hashes remain meaningful. If the skill manager fails after retrieval, an exact official-source synchronization plus a verified lock hash is acceptable; report that fallback.

## 8. Handle shadcn/ui as vendored source

shadcn/ui is not a normal runtime library: its CLI copies component source into the repository, while primitives such as Base UI or Radix are separate dependencies. Treat generated components as vendored code owned by the repository.

When the repository has `components.json` or shadcn-managed components:

1. Read `https://ui.shadcn.com/llms.txt`, then open the relevant current component, CLI, changelog, and migration documents.
2. Inspect `components.json`, style, base library, Tailwind version, aliases, icon library, RSC setting, and installed components.
3. Run the latest official CLI for the upgrade audit, for example:

   ```bash
   pnpm dlx shadcn@latest info
   pnpm dlx shadcn@latest diff
   ```

4. Use component-specific diffs or dry runs to compare the registry with local source. Never overwrite all components blindly: preserve intentional local behavior and apply meaningful upstream API, accessibility, styling, and composition changes deliberately.
5. Check shared stylesheet or package requirements introduced by the current registry, including `shadcn/tailwind.css` when recommended.
6. Persist the `shadcn` CLI as a development dependency when the repository needs reproducible routine component management. During a dedicated upgrade audit, still compare against `shadcn@latest`, then commit the selected CLI version.
7. Review the primitive library's own migration guide separately; a Base UI or Radix update is not equivalent to a shadcn registry update.
8. Update the repository's official shadcn skill independently from component source, following the skill synchronization rules above.

Ignore registry-only differences that are inapplicable to the project, such as an unnecessary `"use client"` directive in a non-RSC Vite application, but record why they were not applied.

## 9. Validate in layers

Run the narrowest checks while migrating, then the repository-required full checks. At minimum, where applicable:

```bash
pnpm install
pnpm lint
pnpm test
pnpm build
cargo clippy --all
cargo test --workspace
git diff --check
```

Also run peer-dependency checks, type-checking, code generation, configuration parsing, and package-specific tests when available. Inspect the final diff for accidental formatter churn, generated cache files, unrelated skill changes, and lockfile-only upgrades with missing manifest changes.

Do not bypass hooks or validators. A warning is acceptable only when confirmed pre-existing and explicitly reported.

## 10. Report completion truthfully

Summarize:

- issue and branch;
- direct dependency changes and deliberate pins or reversions;
- important release and migration findings;
- recommended API and configuration migrations applied;
- corresponding skills updated and their sources;
- shadcn registry differences applied or intentionally skipped;
- incompatible updates deferred with exact blockers;
- commands actually run and their results.

Do not claim every package was reviewed unless every changed direct dependency has an explicit documentation and usage-audit result.
