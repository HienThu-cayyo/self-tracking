# Code Consistency Guardrails Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce consistent formatting and FSD slice boundaries in the Smart Base starter.

**Architecture:** Add a root Prettier configuration, write/check scripts, and a CI format check. Extend the web ESLint configuration with a boundary plugin and TypeScript-aware resolver so layer direction, sibling-slice isolation, and public entry points are enforced; preserve the existing native layer checks unless the focused tests prove they are redundant.

**Tech Stack:** Node.js `>=22.22.2`, pnpm `10.32.1`, Prettier `3.9.10`, ESLint `9.39.5`, `eslint-plugin-boundaries` `7.3.0`, `eslint-import-resolver-typescript` `4.4.5`, TypeScript `5.9.3`, Vitest `4.1.11`.

**Spec:** [2026-10-24-code-consistency-guardrails-design.md](../specs/2026-10-24-code-consistency-guardrails-design.md)

## Global Constraints

- Keep Node.js `>=22.22.2` and pnpm `10.32.1`.
- Preserve the existing 100% line, statement, function, and branch coverage gate.
- Add development tooling only; add no runtime dependency or product behavior.
- Scope FSD slice classification to `apps/web/src`; leave database package boundaries unchanged.
- Preserve existing no-semicolon TypeScript style; use Prettier `printWidth: 100`.
- Keep repository documentation in professional English.
- Ignore package-manager lockfiles and generated/build output from Prettier.

## Review Focus

- TypeScript alias imports must resolve as local dependencies, so they cannot bypass FSD rules as unresolved external imports. Test alias and relative import forms.
- A same-layer sibling slice must be rejected even when the import targets its public entry point. Test two entity slices.
- A higher layer may import a lower slice only through `index.ts`, `index.tsx`, `index.server.ts`, or `index.server.tsx`. Test both public and deep imports.
- Same-slice internal imports and imports from lower layers must remain valid. Test both paths to avoid over-restricting the existing codebase.
- Files outside web FSD slices and generated files must not be misclassified or reformatted. Test the web-only ESLint scope and verify formatter ignores.

---

### Task 1: Add the repository formatter gate

**Files:**

- Create: `.prettierrc.json`
- Create: `.prettierignore`
- Modify: `package.json`, `pnpm-lock.yaml`
- Modify: `.github/workflows/validate.yml`
- Modify: `AGENTS.md`, `.codex/AGENT.md`, `docs/testing.md`
- Modify: `.codex/project-state.md`, `docs/codex.md`
- Format: all supported first-party source, configuration, and Markdown files not excluded by `.prettierignore`

**Interfaces:**

- Produces root commands `pnpm format` and `pnpm format:check`.
- CI invokes `pnpm format:check` as its own quality step.

- [x] **Step 1: Record the current formatter baseline**

Run: `pnpm dlx prettier@3.9.10 --print-width 100 --no-semi --check .`

Expected before the formatter is introduced: formatting fails on the current files. The baseline observed 70 repository files before ignore rules; the active execution brief temporarily adds one more file under `.superpowers/`.

- [x] **Step 2: Add the pinned formatter and configuration**

Add exact root dev dependency `prettier@3.9.10`. Configure `semi: false` and `printWidth: 100`. Ignore `pnpm-lock.yaml`, `next-env.d.ts`, Drizzle metadata, dependency directories, build output, coverage, Playwright output, and `.superpowers/` execution scratch files.

- [x] **Step 3: Add root formatter scripts and wire CI**

Set `format` to `prettier --write .`; set `format:check` to `prettier --check .`. Add a `Format check` step running `pnpm format:check` to `.github/workflows/validate.yml`.

- [x] **Step 4: Normalize and document the formatter contract**

Run `pnpm format`, then `pnpm format:check`. Document both commands and the CI requirement in `docs/testing.md`, `docs/codex.md`, `AGENTS.md`, `.codex/AGENT.md`, and `.codex/project-state.md`.

Expected: `pnpm format:check` exits 0, does not modify files, and does not include the ignored lockfile or generated outputs.

- [x] **Step 5: Commit the formatter gate**

```bash
git add .prettierrc.json .prettierignore package.json pnpm-lock.yaml .github/workflows/validate.yml AGENTS.md .codex/AGENT.md docs/testing.md docs/superpowers/specs/2026-10-24-code-consistency-guardrails-design.md docs/superpowers/plans/2026-10-24-code-consistency-guardrails.md
git add -u
git commit -m "chore: enforce consistent formatting"
```

### Task 2: Enforce FSD slice boundaries

**Files:**

- Modify: `apps/web/package.json`, `pnpm-lock.yaml`
- Modify: `apps/web/eslint.config.mjs`
- Modify: `apps/web/src/test/fsd-boundaries.test.ts`
- Modify: `docs/architecture.md`, `AGENTS.md`, `.codex/AGENT.md`

**Interfaces:**

- ESLint enforces imports for web FSD slices and resolves `@/*` using `apps/web/tsconfig.json`.
- The existing `fsd-boundaries.test.ts` suite remains the focused regression contract.

- [x] **Step 1: Add failing ESLint boundary tests**

Extend the focused suite to assert that ESLint accepts same-slice relative imports and lower-layer public API imports, and rejects sibling-slice imports, deep imports into a lower slice, and higher-layer imports. Include both `@/` aliases and relative imports where they apply, and assert that the web-only boundary rule does not run on `packages/database/src` files.

Run: `pnpm --filter @smart-base/web exec vitest run src/test/fsd-boundaries.test.ts`

Expected: new tests fail because the current config does not enforce sibling-slice or public-entry boundaries.

- [x] **Step 2: Add explicit boundary tooling**

Add exact web dev dependencies `eslint-plugin-boundaries@7.3.0` and `eslint-import-resolver-typescript@4.4.5`. Configure TypeScript resolution against `apps/web/tsconfig.json`, and scope the plugin rules to web source only.

- [x] **Step 3: Configure slice and public API policies**

Classify `app` and `_app` as the top layer, then `_pages`, `_widgets`, `_features`, `_entities`, and `_shared` in descending order. Preserve or replace existing native rules only after the tests show the plugin covers their relative and alias cases. Reject same-layer imports between distinct slices and external deep imports into slices; accept only `index.ts`, `index.tsx`, `index.server.ts`, and `index.server.tsx` as slice entry points; keep same-slice internal imports valid.

- [x] **Step 4: Run focused and workspace checks**

Run: `pnpm --filter @smart-base/web exec vitest run src/test/fsd-boundaries.test.ts`

Expected: all existing and new boundary cases pass. Then run `pnpm lint` to confirm the rule is limited to web source and the database workspace remains unaffected.

- [x] **Step 5: Document the import contract and commit**

Document that imports between slices on the same layer are forbidden and imports into another slice must use its public entry point. Update the agent guidance to follow the same rule.

```bash
git add apps/web/package.json apps/web/eslint.config.mjs apps/web/src/test/fsd-boundaries.test.ts pnpm-lock.yaml docs/architecture.md AGENTS.md .codex/AGENT.md
git commit -m "chore: enforce FSD slice boundaries"
```

### Task 3: Verify the full starter gates

**Files:**

- Verify: all files changed by Tasks 1 and 2

- [x] **Step 1: Run the full quality suite**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e`

Expected: every command exits 0; `pnpm test` retains 100% coverage in each current workspace, and browser smoke tests pass.

- [x] **Step 2: Review generated changes and repository state**

Run: `git diff --check` and `git status --short --branch`.

Expected: no whitespace errors, no generated files left modified, and only the formatter and FSD boundary changes are present.
