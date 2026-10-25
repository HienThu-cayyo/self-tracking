# Smart Base Coverage and Structure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align repository guidance with the implemented workspace structure and make `pnpm test` enforce 100% line, statement, function, and branch coverage for all first-party runtime TypeScript and TSX.

**Architecture:** Keep the existing workspace boundaries and runtime behavior. Add colocated behavior-focused tests for currently uncovered modules, then configure each Vitest workspace to include all runtime source and enforce the four global thresholds from its existing test script. Update the repository's English documentation and agent guidance to make the structure and gate discoverable.

**Tech Stack:** pnpm 10.32.1, Turborepo 2.11.5, Vitest 4.1.11 with `@vitest/coverage-v8` 4.1.11, React Testing Library, jsdom, TypeScript, Drizzle.

**Spec:** `docs/superpowers/specs/2026-10-24-smart-base-coverage-and-structure-design.md`

## Global Constraints

- Enforce `100%` line, statement, function, and branch coverage over first-party runtime TypeScript and TSX in each current Vitest workspace.
- Include every runtime file under `apps/web/src/` and `packages/database/src/`, including files not imported by current tests.
- Exclude tests, `src/test/**` harness code, declarations, generated files, configuration files, stylesheets, and dependencies.
- `pnpm test` remains the single local unit/component-test command and runs coverage in both current test workspaces.
- Disable Turbo caching for `test` so every `pnpm test` invocation executes both suites and evaluates fresh coverage.
- API and AI tests use injected `fetch` and fake models; database tests do not connect to a live database.
- Preserve runtime behavior; add no product behavior, worker job, shared package, live-service test, or CI workflow.
- Keep all repository documentation in professional English.
- Add only the matching Vitest coverage provider required to run coverage.

## Review Focus

- **Transport and response failures:** `fetchJson` must preserve caller cancellation and transport errors while returning only the caller's safe message for HTTP, JSON, and schema failures. Pin each case in `fetch-json.test.ts`.
- **AI configuration and provider output:** missing or whitespace credentials, unsafe URLs, optional base URLs, abort signals, and non-text provider content must follow their explicit contracts. Pin these in the AI config and provider adapter tests.
- **Optional UI states:** controls with optional close buttons, labels, icons, helper text, selected values, and error messages must render correctly both present and absent. Pin both sides in the owning component tests.
- **Sidebar state and input:** controlled/uncontrolled state, mobile/desktop presentation, keyboard shortcuts, pointer resizing, and ignored pointer events must not diverge. Pin each state family in `sidebar.test.tsx`.
- **Chart and calendar data:** empty or malformed chart payloads, config fallbacks, date navigation, range modifiers, and alternate navigation orientation must not throw or lose accessible controls. Pin these paths in `chart.test.tsx` and `calendar.test.tsx`.

---

## File Structure

- Vitest setup: `apps/web/package.json`, `apps/web/vitest.config.mts`, `packages/database/package.json`, `packages/database/vitest.config.ts`, and `pnpm-lock.yaml`.
- Service tests: extend API/AI/database tests and add focused AI and server-entry tests next to their source modules.
- Shared utility and UI tests: add colocated tests under `apps/web/src/_shared/`; extend existing button, calendar, dialog, toggle-group, and app page tests where appropriate.
- App-shell coverage: add `apps/web/src/app/layout.test.tsx` for the root layout and exported metadata.
- Structure and agent guidance: update `README.md`, `docs/architecture.md`, `docs/testing.md`, `docs/codex.md`, `AGENTS.md`, `.codex/AGENT.md`, `.codex/project-state.md`, `.agents/skills/feature-development/SKILL.md`, `apps/workers/README.md`, and `packages/README.md`; audit the remaining repository Markdown for language and structural accuracy.

## Tasks

### Task 1: Complete API, AI, and database boundary tests

**Files:**

- Modify: `apps/web/src/_shared/api/fetch-json.test.ts`
- Modify: `apps/web/src/_entities/ai/server/ai-text-service.test.ts`
- Create: `apps/web/src/_entities/ai/server/ai-provider-model.test.ts`
- Create: `apps/web/src/_entities/ai/index.server.test.ts`
- Modify: `packages/database/src/client.test.ts`
- Create: `packages/database/src/index.server.test.ts`

**Interfaces:**

- Consumes: `fetchJson<T>(FetchJsonOptions<T>)`, `readAiConfig(AiEnv)`, `createConfiguredAiTextService(AiEnv, AiTextModelFactory)`, and the existing `@smart-base/database/server` entry point.
- Produces: deterministic tests for success, rejection, validation, cancellation, provider adapter, lazy database initialization, and server exports; no runtime API changes.

- [x] Add `fetchJson` cases asserting default GET headers, optional `cache`, PUT and body handling, composed caller/timeout signals, rejected fetch propagation, and safe errors for non-OK, invalid JSON, and invalid schema results.
- [x] Extend AI config cases for whitespace values, omitted/blank base URL, HTTPS normalization, all supported loopback hosts, and rejected credentials, malformed URLs, and non-loopback HTTP.
- [x] Add a mocked `ChatOpenAI` adapter suite asserting constructor options, system/user message order, optional abort signal, returned string content, rejection of non-string content, and the default environment/model-factory path.
- [x] Exercise the AI server barrel and the database server barrel through imports and public exports; keep database URL missing/present and cached-instance cases isolated with `vi.resetModules()`.
- [x] Run `pnpm --filter @smart-base/web exec vitest run src/_shared/api/fetch-json.test.ts src/_entities/ai/server/ai-text-service.test.ts src/_entities/ai/server/ai-provider-model.test.ts src/_entities/ai/index.server.test.ts` and `pnpm --filter @smart-base/database exec vitest run src/client.test.ts src/database-url.test.ts src/index.server.test.ts`.
- [x] Confirm both focused commands pass without network access, credentials, or a live database.

### Task 2: Cover shared utilities and basic UI primitives

**Files:**

- Create: `apps/web/src/_shared/lib/cn.test.ts`
- Create: `apps/web/src/_shared/lib/hooks/use-mobile.test.tsx`
- Create: `apps/web/src/_shared/ui/avatar.test.tsx`
- Create: `apps/web/src/_shared/ui/badge.test.tsx`
- Create: `apps/web/src/_shared/ui/card.test.tsx`
- Create: `apps/web/src/_shared/ui/input.test.tsx`
- Create: `apps/web/src/_shared/ui/label.test.tsx`
- Create: `apps/web/src/_shared/ui/separator.test.tsx`
- Create: `apps/web/src/_shared/ui/skeleton.test.tsx`
- Create: `apps/web/src/_shared/ui/spinner.test.tsx`
- Modify: `apps/web/src/_shared/ui/button.test.tsx`
- Modify: `apps/web/src/_shared/ui/table.test.tsx`
- Modify: `apps/web/src/_shared/ui/toggle-group.test.tsx`
- Create: `apps/web/src/_shared/ui/toggle.test.tsx`

**Interfaces:**

- Consumes: the existing `cn`, `useIsMobile`, and exported shared UI components.
- Produces: accessible, colocated tests that cover each module's default and optional/variant branches without changing component APIs.

- [x] Test `cn` merging of conditional classes and conflicting Tailwind utilities.
- [x] Test `useIsMobile` at 767px and 768px, update after a media-query change event, and listener cleanup on unmount.
- [x] Render a server snapshot of `useIsMobile` and assert it is `false` without reading the browser media query.
- [x] Test avatar image/fallback, optional badge, and grouped/count states; badge variants and polymorphic rendering; and both card sizes and all card slots.
- [x] Test input type and disabled forwarding, label association, both separator orientations, skeleton class forwarding, and spinner's accessible label.
- [x] Extend table tests to render every export, including `TableFooter` and `TableCaption`, and assert semantic footer/caption content.
- [x] Expand button and toggle/toggle-group tests to cover supported variants/sizes, pressed/disabled state, and inherited versus local group variant/size values.
- [x] Run the focused utility and primitive test files with Vitest and assert behavior through roles, accessible names, state, and rendered semantics.

### Task 3: Cover forms, menus, and overlay components

**Files:**

- Create: `apps/web/src/_shared/ui/field.test.tsx`
- Modify: `apps/web/src/_shared/ui/dialog.test.tsx`
- Create: `apps/web/src/_shared/ui/dropdown-menu.test.tsx`
- Create: `apps/web/src/_shared/ui/popover.test.tsx`
- Create: `apps/web/src/_shared/ui/sheet.test.tsx`
- Create: `apps/web/src/_shared/ui/tooltip.test.tsx`

**Interfaces:**

- Consumes: the current Base UI-backed component exports and their existing props.
- Produces: tests for each exported wrapper, optional branch, and primary keyboard/pointer interaction; no new abstraction or runtime behavior.

- [x] Test every `Field*` export plus `FieldError` with no errors, one error, duplicate messages, multiple messages, and message-less entries; test `FieldSeparator` with and without children.
- [x] Extend dialog tests to cover its close button enabled/disabled, accessible description, trigger, and Escape close behavior.
- [x] Test dropdown menu open/select behavior, item disabled state, label/separator/shortcut, submenu, checkbox and radio selection, and portal content.
- [x] Test popover open/close behavior, accessible title/description, and default plus alternate positioning props.
- [x] Test sheet open/close behavior for each supported side and both `showCloseButton` values, with accessible title/description.
- [x] Test tooltip provider delay forwarding, trigger accessibility, and content visibility from keyboard focus and pointer hover.
- [x] Run these focused component suites and verify all portals are cleaned up between tests.

### Task 4: Cover stateful and data-driven UI components

**Files:**

- Modify: `apps/web/src/_shared/ui/calendar.test.tsx`
- Create: `apps/web/src/_shared/ui/chart.test.tsx`
- Create: `apps/web/src/_shared/ui/sidebar.test.tsx`
- Create: `apps/web/src/_shared/ui/theme-provider.test.tsx`
- Create: `apps/web/src/_shared/ui/sonner.test.tsx`

**Interfaces:**

- Consumes: current calendar, chart, sidebar, theme, and toast provider APIs.
- Produces: deterministic tests for component-specific branches and interactive states; no charting/network services or product behavior.

- [x] Extend calendar tests for single and range selection, selected/outside/disabled days, focus movement, locale and custom formatter options, week-number/class options, caption modes, and each supported navigation orientation.
- [x] Test chart context success and missing-provider error plus generated theme styles; test tooltip and legend empty states, visible states, hide flags, formatter/icon/config fallbacks, and payload lookup for direct, nested, missing, and malformed values.
- [x] Test sidebar context misuse, controlled and uncontrolled open state, desktop/mobile and `collapsible`/`variant` paths, keyboard shortcut, resize keyboard bounds, pointer start/move/end/cancel thresholds and ignored events, tooltip forms, skeleton icon option, and every exported structural component.
- [x] Test theme initialization from document class, server rendering without `document`, light/dark changes, storage failures, and the `useTheme` missing-provider error.
- [x] Test `Toaster` renders inside a theme context with theme-derived defaults and explicit prop overrides, and throws the documented context error outside a provider.
- [x] Run the focused stateful/data-driven suites; use assertions on accessible UI, state attributes, resulting widths/themes, and visible values rather than implementation-only snapshots.

### Task 5: Cover app composition and server entry points

**Files:**

- Create: `apps/web/src/app/layout.test.tsx`
- Modify: `apps/web/src/app/page.test.tsx`

**Interfaces:**

- Consumes: `RootLayout`, exported `metadata`, `Page`, and the app/package server barrels.
- Produces: direct coverage for route/layout wiring and public server entry points.

- [x] Test root metadata values and render `RootLayout` with a child, asserting the document language, root layout shell, child, and provider-owned toaster presence.
- [x] Assert the starter page's heading and supporting copy through semantic queries.
- [x] Confirm the Task 1 barrel tests cover every current public server export without connecting to an external service.
- [x] Run the app shell and entry-point focused tests in their owning workspaces.

### Task 6: Enforce coverage from the default test command

**Files:**

- Modify: `apps/web/package.json`
- Modify: `apps/web/vitest.config.mts`
- Modify: `packages/database/package.json`
- Modify: `packages/database/vitest.config.ts`
- Modify: `turbo.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**

- Consumes: passing workspace suites from Tasks 1–5.
- Produces: `pnpm test` coverage enforcement for each Vitest workspace.

- [x] Add `@vitest/coverage-v8` version `4.1.11` as a dev dependency to each workspace that runs Vitest and update the lockfile with `pnpm install --lockfile-only`.
- [x] Set both workspace test scripts to `vitest run --coverage` so the existing root `turbo run test` command cannot bypass coverage.
- [x] Set the Turbo `test` task to `cache: false`; the baseline showed cached test results, which would otherwise skip the requested per-run coverage gate.
- [x] Configure provider `v8`, explicitly include `src/**/*.{ts,tsx}`, exclude `**/*.test.{ts,tsx}`, `**/*.spec.{ts,tsx}`, `src/test/**`, `**/*.d.ts`, and `**/*.generated.{ts,tsx}`, and set global `lines`, `statements`, `functions`, and `branches` thresholds to `100`.
- [x] Run `pnpm test` twice and confirm both invocations execute the web and database suites, both coverage reports show 100% for all four metrics, and no excluded harness/config files are measured.
- [x] Run `pnpm exec turbo run test --force` to confirm the complete test suite still passes with a forced uncached run.

### Task 7: Align English documentation and agent guidance

**Files:**

- Modify: `README.md`
- Modify: `docs/architecture.md`
- Modify: `docs/testing.md`
- Modify: `docs/codex.md`
- Modify: `AGENTS.md`
- Modify: `.codex/AGENT.md`
- Modify: `.codex/project-state.md`
- Modify: `.agents/skills/feature-development/SKILL.md`
- Modify: `apps/workers/README.md`
- Modify: `packages/README.md`

**Interfaces:**

- Consumes: actual paths from the current workspace, the coverage contract from Task 6, and the approved design spec.
- Produces: professional English instructions that accurately describe app, worker, package, database, migration, test, and coverage ownership.

- [x] Reconcile README and architecture tree/tables with the actual `apps/web`, future `apps/workers/*`, `packages/database`, and root `drizzle/` structure; state that no empty worker or shared package is included.
- [x] Document the exact coverage scope, excluded files, four 100% thresholds, and that `pnpm test` runs the gate in each current workspace.
- [x] Update agent and feature guidance to require behavior-focused tests for every runtime path, retain the coverage gate for future workspaces, and use mocks/injection for external boundaries.
- [x] Update worker/package guidance so a future workspace adds a Turbo-visible `test` script, the matching coverage provider, runtime inclusion, and the same thresholds.
- [x] Audit all repository Markdown under root, `docs/`, `.codex/`, `.agents/`, `apps/`, and `packages/` for professional English; update only pages that contain translated text or stale structure/coverage guidance.
- [x] Review changed Markdown for accurate relative links and consistency with the source tree.
- [x] Run `git diff --check`, inspect every changed Markdown file, and verify all referenced paths exist.

### Final verification and integration

**Files:** all files listed above.

- [x] Run `pnpm exec turbo run lint --force`.
- [x] Run `pnpm exec turbo run typecheck --force`.
- [x] Run `pnpm exec turbo run test --force` and record all four coverage metrics for both workspaces.
- [x] Run `pnpm exec turbo run build --force`.
- [x] Run `git diff --check` and inspect the complete diff for unintended runtime changes, Vietnamese documentation, and inaccurate structure references.
- [x] Stage only the files listed in this plan, then run `git diff --cached --check` and inspect the staged summary.
- [x] Commit the verified changes with message `test: enforce complete runtime coverage` and fast-forward them to `main`.
