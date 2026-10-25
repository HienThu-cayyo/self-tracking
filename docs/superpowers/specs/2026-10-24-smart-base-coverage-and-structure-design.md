# Smart Base Structure and Coverage Design

## Intent

Audit the starter's implemented workspace structure, align its onboarding and agent documentation with the source tree, and make the default test command enforce complete coverage of first-party runtime code. This gives future product work a clear place to live and makes untested behavior visible before changes are considered complete.

## Goals

- Enforce 100% line, statement, function, and branch coverage for first-party runtime TypeScript and TSX in every current test workspace.
- Cover all current runtime modules under `apps/web/src/` and `packages/database/src/` with deterministic unit or component tests.
- Keep tests independent of live APIs, AI providers, credentials, and databases.
- Align the README, architecture guide, testing guide, and agent guidance with the actual workspace layout and coverage gate.
- Document how future worker and shared-package workspaces join the same test and coverage standard.

## Non-goals

- Add product-domain behavior, a worker job, a shared package, or a new runtime abstraction.
- Add live-provider, live-database, or deployment tests.
- Add a CI provider or workflow; the repository currently has none.
- Count generated files, declarations, test files, test harnesses, framework configuration, CSS, or dependencies as runtime coverage.

## Approaches

1. **Enforce coverage from `pnpm test` — selected.** Add the Vitest V8 coverage provider at the version already used by Vitest, include every first-party runtime source file, and set all four thresholds to 100%. This makes the existing default quality command fail whenever coverage drops. The trade-off is that the complete component suite runs with instrumentation.
2. **Add a separate `pnpm test:coverage` command.** This keeps the regular test command faster but allows the main quality gate to pass while runtime coverage falls below target.
3. **Enforce coverage only for core services.** This is cheaper to reach but does not satisfy the requested whole-runtime coverage and leaves shared UI and application modules outside the gate.

## Coverage policy

- Each Vitest-enabled workspace measures its own `src/**/*.{ts,tsx}` runtime files, including files not imported by existing tests.
- Set `lines`, `statements`, `functions`, and `branches` to `100` in each workspace's Vitest configuration.
- Exclude test files, `src/test/**` harness code, TypeScript declaration files, generated files, configuration files, stylesheets, and dependencies.
- `pnpm test` remains the single local unit/component-test command and must run coverage in both `@smart-base/web` and `@smart-base/database`.
- Disable Turbo caching for the `test` task so each `pnpm test` invocation executes both suites and evaluates fresh coverage rather than replaying a cached result.
- A future worker package must add its test script to the Turbo workspace graph and enforce the same four thresholds over its runtime source.
- API and AI tests use injected `fetch` and fake models. Database tests must not connect to a live database.

## Structure and documentation decisions

- Keep the existing FSD app structure under `apps/web/src/`; keep routes as wiring and retain domain-independent primitives in `_shared`.
- Keep database infrastructure in `packages/database`; keep future shared packages conditional on real consumers.
- Keep each real background workload in its own `apps/workers/<name>/` workspace; do not add an empty worker package.
- Update the root structure overview and architecture/testing guides to show the implemented paths, test ownership, and coverage gate.
- Update `AGENTS.md`, `.codex/AGENT.md`, `.codex/project-state.md`, the feature-development skill, and the worker/package guidance so agents preserve the coverage threshold when changing or adding workspaces.
- Keep all repository documentation in professional English.

## Constraints

- Preserve runtime behavior; this work adds tests and coverage enforcement rather than product behavior.
- Use the repository's pinned pnpm, Vitest, and TypeScript versions. Add only the matching Vitest coverage provider required to run coverage.
- Keep UI tests focused on user-visible behavior, semantics, keyboard access, and meaningful conditional states.
- Treat a 100% threshold as a regression gate, not as proof that tests are well-designed; tests must assert behavior rather than implementation details.

## Open implementation choices

- The builder may group component tests by existing module boundaries, provided every included runtime module is exercised and assertions remain behavior-focused.
- The builder may use shared test helpers only when they remove real duplication and do not hide the behavior under test.
