# Code Consistency Guardrails Design

## Intent

Make formatting and Feature-Sliced Design (FSD) import boundaries enforceable by the repository so contributors and coding agents follow the same rules.

## Goals

- Pin a repository-wide formatter configuration that matches the existing source style.
- Provide a local format command and a non-mutating format check in CI.
- Enforce FSD layer direction, sibling-slice isolation, and public entry-point imports in `apps/web/src`.
- Add focused checks proving allowed and forbidden imports behave as documented.

## Non-goals

- Add a product feature, sample domain, or new runtime dependency.
- Reformat files outside the chosen formatter scope unless required for the check to pass.
- Replace ESLint, TypeScript, the coverage gate, or the existing CI workflow.
- Add personal editor, commit-hook, or formatting-on-save settings.

## Approaches

1. **Extend the current toolchain (recommended).** Add pinned Prettier with root scripts and CI checking, then extend the existing ESLint architecture enforcement and focused tests. This keeps the workflow familiar, adds no runtime dependencies, and uses a focused boundary plugin and TypeScript-aware resolver only where the existing ESLint rules cannot express slice ownership safely.
2. **Adopt dedicated plugins for both concerns.** This can provide broader rule sets but adds dependencies and configuration surface to a small starter.
3. **Document conventions only.** This adds no tooling but cannot prevent inconsistent formatting or cross-slice imports; it does not meet the goal.

The user approved the first approach. If the existing ESLint rules cannot express slice ownership safely, implementation may use one narrowly scoped development dependency rather than a brittle custom resolver.

## Design

- Add a root Prettier configuration and ignore generated, dependency, and build output. Match the repository's prevailing TypeScript style rather than introducing a formatting rewrite unrelated to the guardrail.
- Add root `format` and `format:check` scripts. Run the check as its own step in the existing quality workflow and document the commands in English.
- Keep FSD enforcement scoped to web source slices. Imports may flow from higher layers to lower layers; slices on the same layer may not depend on one another; external imports from a slice must use its public entry point. Same-slice internal imports remain valid.
- Preserve current coverage, lint, typecheck, build, and browser-test behavior.

## Acceptance criteria

- A local format command can normalize supported repository files, and `format:check` exits non-zero for unformatted files without changing them.
- CI runs `format:check` on pull requests and pushes to `main`.
- Architecture checks accept same-slice internal imports and valid lower-layer imports, while rejecting higher-layer imports, sibling-slice imports, and external deep imports into a slice.
- Existing quality commands pass, and the new checks have focused regression coverage.

## Calls left to the implementer

- Choose the exact Prettier version and supported file scope after checking the current dependency and generated-file layout.
- Use the smallest ESLint-native or test-backed mechanism that reliably enforces the import rules; add a development dependency only if the existing toolchain cannot express them safely.
