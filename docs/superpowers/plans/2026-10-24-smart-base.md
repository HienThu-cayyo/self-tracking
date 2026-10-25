# Smart Base Implementation Plan

> **Implementation workflow:** Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan one task at a time. Track progress with the checkboxes below.

**Goal:** Build a copyable Next.js starter repository with reusable UI, API, and AI foundations, a documented FSD structure, and a ready-to-use Codex workflow.

**Initial architecture:** A pnpm/Turborepo workspace containing one Next.js app under `apps/web`. The app follows the Smart Stock and Smart Idea FSD layers; shared UI and API helpers live in `_shared`, while the server-only AI service lives in `_entities/ai`. The initial scope excluded product behavior, authentication, and database infrastructure. The worker workspace and PostgreSQL/Drizzle foundation are documented in the [follow-up plan](2026-10-24-smart-base-workers-database.md).

**Technology stack:** Node.js 22.22.2+, pnpm 10.32.1, Turborepo 2.11.5, Next.js 16.3.2, React 19.2.8, TypeScript 5.9.3, Tailwind CSS 4.3.3, shadcn component patterns with Base UI, ESLint 9, Vitest, Testing Library, and Playwright.

**Spec:** `docs/superpowers/specs/2026-10-24-smart-base-design.md`

## Initial-scope constraints

- Node.js `>=22.22.2`; pnpm `10.32.1`; Turborepo `2.11.5`.
- Next.js `16.3.2`; React `19.2.8`; TypeScript `5.9.3`; Tailwind CSS `4.3.3`.
- Keep Next routes thin and follow `app`, `_app`, `_pages`, `_widgets`, `_features`, `_entities`, `_shared` dependency direction.
- Keep AI keys and model construction server-side; do not add a public unauthenticated AI endpoint.
- Tests use fake `fetch` and fake AI models; never make a live provider request.
- Do not add authentication, database infrastructure, migrations, product-domain code, or provider-management code within this initial scope.
- Do not set repository model, sandbox, or approval preferences in Codex config.

## Review Focus

1. Malformed JSON and responses that fail schema validation must produce a safe error without exposing response data; cover both cases in Task 4.
2. Missing AI credentials or an unsafe/invalid provider URL must fail before constructing a model; cover in Task 5 tests.
3. Provider errors and aborted AI calls must remain observable to callers; cover with fake-model tests in Task 5.
4. Core interactive UI must preserve keyboard behavior and accessible names; cover dialog/button interactions in Task 3 tests.
5. A lower FSD layer must not import from a higher layer; prove the ESLint rule rejects a temporary forbidden import in Task 2.

---

## File map

- Root manifests and `turbo.json`: workspace membership and root commands.
- `apps/web/`: Next.js app, lint, typecheck, and test configuration, plus an end-to-end smoke test.
- `apps/web/src/app/`: route entry points, root layout, and global CSS.
- `apps/web/src/_app/` and `apps/web/src/_pages/`: app shell and the small starter home page.
- `apps/web/src/_shared/ui/`: the reusable Smart Stock UI primitive set.
- `apps/web/src/_shared/api/`: typed `fetchJson` helper and focused tests.
- `apps/web/src/_entities/ai/`: server-only env config and injectable AI text service.
- `AGENTS.md`, `.codex/`, `.agents/skills/`: repository guidance, current template state, and one feature-development skill.
- `docs/`: English architecture, UI, API, AI, Codex, and testing guides.

## Task 1: Create the workspace and minimal Next.js app

**Files:**

- Create: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.json`, `.gitignore`, `pnpm-lock.yaml`
- Create: `apps/web/package.json`, `apps/web/next.config.ts`, `apps/web/tsconfig.json`, `apps/web/postcss.config.mjs`
- Create: `apps/web/src/app/layout.tsx`, `apps/web/src/app/page.tsx`, `apps/web/src/app/globals.css`
- Create: `apps/web/vitest.config.mts`, `apps/web/src/test/setup.ts`, `apps/web/src/app/page.test.tsx`

**Interfaces:**

- Root scripts: `dev`, `build`, `start`, `lint`, `typecheck`, and `test` delegate to `@smart-base/web` or Turborepo. Add `test:e2e` with the Playwright task.
- Workspace app name: `@smart-base/web`.

- [x] **Step 1: Add the root and web manifests** with the pinned framework and unit-test versions from the spec, workspace globs `apps/*` and `packages/*`, and Turborepo tasks for build, lint, typecheck, test, and dev.
- [x] **Step 2: Install and lock dependencies** with `pnpm install`; verify the lockfile can be reused with `pnpm install --frozen-lockfile`.
- [x] **Step 3: Configure Vitest and Testing Library**, then write the starter page test for a `main` landmark and an `h1` named “Smart Base”.
- [x] **Step 4: Run `pnpm --filter @smart-base/web exec vitest run src/app/page.test.tsx`**; confirm the test fails because the page is missing.
- [x] **Step 5: Add the minimal App Router shell** with a neutral “Smart Base” heading, metadata, and Tailwind 4 PostCSS setup. Do not add product navigation or sample business data.
- [x] **Step 6: Verify the page test and shell** with the focused Vitest command and `pnpm --filter @smart-base/web build`; expected result: both succeed without environment secrets.

## Task 2: Add quality gates and FSD boundaries

**Files:**

- Create: `apps/web/eslint.config.mjs`
- Create: `apps/web/src/test/fsd-boundaries.test.ts`
- Modify: root and web `package.json`, `turbo.json`, `apps/web/tsconfig.json`

**Interfaces:**

- `pnpm lint`, `pnpm typecheck`, and `pnpm test` are root checks.
- `apps/web` uses strict TypeScript and Vitest with jsdom and Testing Library.
- ESLint blocks aliased and relative imports from lower FSD layers into higher layers, including Next route imports.

- [x] **Step 1: Add ESLint, strict typecheck, and FSD import rules** to the web configuration. Keep global ignores limited to generated and dependency directories.
- [x] **Step 2: Run `pnpm lint`, `pnpm typecheck`, and `pnpm test`**; expected result: the starter test and quality gates pass.
- [x] **Step 3: Probe the FSD boundary** with regression tests that reject aliased and relative imports of higher-layer modules, including `@/app` route modules imported from `_shared` and `_app` code.

## Task 3: Add reusable UI components

**Files:**

- Create under `apps/web/src/_shared/ui/`: `avatar.tsx`, `badge.tsx`, `button.tsx`, `calendar.tsx`, `card.tsx`, `chart.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `field.tsx`, `input.tsx`, `label.tsx`, `popover.tsx`, `separator.tsx`, `sheet.tsx`, `sidebar.tsx`, `skeleton.tsx`, `sonner.tsx`, `spinner.tsx`, `table.tsx`, `theme-provider.tsx`, `toggle.tsx`, `toggle-group.tsx`, `tooltip.tsx`
- Create: `apps/web/src/_shared/lib/cn.ts` and `apps/web/src/_shared/lib/hooks/use-mobile.ts` for the copied wrappers
- Create: `apps/web/components.json`
- Create tests: `button.test.tsx`, `dialog.test.tsx`, `table.test.tsx`, `calendar.test.tsx`, and `toggle-group.test.tsx` beside their components
- Modify: `apps/web/package.json`, `apps/web/src/app/layout.tsx`, `apps/web/src/app/globals.css`

**Interfaces:**

- Components are imported from `@/_shared/ui/<component>` and keep the API of the Smart Stock wrappers.
- Styling uses Tailwind 4 tokens, `cn`, and Base UI; no second component framework is introduced.

- [x] **Step 1: Write component tests** for button accessible names and disabled state, keyboard dialog interactions, semantic table markup, calendar keyboard navigation, and toggle-group arrow-key navigation.
- [x] **Step 2: Run the focused tests** with `pnpm --filter @smart-base/web exec vitest run src/_shared/ui/button.test.tsx src/_shared/ui/dialog.test.tsx src/_shared/ui/table.test.tsx src/_shared/ui/calendar.test.tsx src/_shared/ui/toggle-group.test.tsx`; confirm they fail because the components are not present.
- [x] **Step 3: Port the 23 reusable wrappers** from Smart Stock, remove brand/product imports, add only dependencies referenced by those components, and include `cn` plus the mobile hook at the source paths. Keep theme storage under a neutral Smart Base key.
- [x] **Step 4: Run focused component tests, `pnpm lint`, and `pnpm typecheck`**; expected result: all pass with no app-specific dependency imports.

## Task 4: Add the typed API fetch pattern

**Files:**

- Create: `apps/web/src/_shared/api/fetch-json.ts`
- Create: `apps/web/src/_shared/api/fetch-json.test.ts`
- Modify: `apps/web/package.json` only if a required schema dependency is not already present

**Interfaces:**

- `fetchJson<T>(options: FetchJsonOptions<T>): Promise<T>`
- Options: `url`, `schema.parse(unknown)`, `errorMessage`, optional `method` (`GET | POST | PUT`), `body`, injected `fetchImpl`, `signal`, `cache`, and `acceptResponse`.

- [x] **Step 1: Write tests** for a successful typed response, JSON request body and content-type, non-OK response rejection, accepted status override, invalid JSON, schema rejection, injected abort signal, and the 5-second default timeout.
- [x] **Step 2: Run `pnpm --filter @smart-base/web exec vitest run src/_shared/api/fetch-json.test.ts`**; confirm the tests fail because `fetchJson` is missing.
- [x] **Step 3: Implement `fetchJson`** with the source pattern's 5-second default timeout, injected `fetch`, JSON parsing, and schema validation; normalize parse failures to the caller's safe error message without including response contents.
- [x] **Step 4: Re-run the focused API tests and all three quality commands**; expected result: pass without network access.

## Task 5: Add a server-only AI text service

**Files:**

- Create: `apps/web/src/_entities/ai/server/ai-config.ts`, `apps/web/src/_entities/ai/server/ai-text-service.ts`, `apps/web/src/_entities/ai/index.server.ts`
- Create: `apps/web/src/_entities/ai/server/ai-text-service.test.ts`
- Create: `.env.example`
- Modify: `apps/web/package.json`, `apps/web/vitest.config.mts`

**Interfaces:**

- `readAiConfig(env: AiEnv): AiConfig` requires non-empty `AI_API_KEY` and `AI_MODEL` values and validates `AI_BASE_URL` when it is supplied.
- `createAiTextService(model: AiTextModel)` returns `generateText({ systemPrompt, userPrompt, signal? }): Promise<string>`.
- `createConfiguredAiTextService(env?: AiEnv, modelFactory?)` validates config before constructing a model; the default factory uses `ChatOpenAI` from `@langchain/openai`, and tests inject a fake model factory/model.

- [x] **Step 1: Write tests** for missing credentials, invalid/unsafe base URL, model factory not called on invalid config, successful fake-model output, provider rejection, and abort propagation.
- [x] **Step 2: Run `pnpm --filter @smart-base/web exec vitest run src/_entities/ai/server/ai-text-service.test.ts`**; confirm the tests fail before the service is implemented.
- [x] **Step 3: Implement env validation and the injectable server-only service**. Permit HTTPS provider URLs and loopback HTTP only for local development; reject URL-embedded credentials; never expose the key or model object to client modules.
- [x] **Step 4: Alias Next's `server-only` test stub in Vitest** so tests can import guarded server modules without weakening the production boundary.
- [x] **Step 5: Add placeholder values for the AI variables to `.env.example`** and document that no key is required for build or tests.
- [x] **Step 6: Run focused AI tests, lint, and typecheck**; expected result: all pass with fake models and no provider request.

## Task 6: Add Codex guidance and English documentation

**Files:**

- Create: `AGENTS.md`
- Create: `.codex/AGENT.md`, `.codex/project-state.md`, `.codex/README.md`
- Create: `.agents/skills/feature-development/SKILL.md`
- Create: `docs/architecture.md`, `docs/ui-components.md`, `docs/api.md`, `docs/ai-service.md`, `docs/codex.md`, `docs/testing.md`
- Modify: root `README.md`, `apps/web/package.json`, `pnpm-lock.yaml`

**Interfaces:**

- Root `AGENTS.md` is the durable repository entry point and links to the docs and focused skill.
- `.codex/AGENT.md` owns implementation workflow details; `.codex/project-state.md` describes the product-neutral starter state.
- The feature-development skill triggers only when adding a product feature to this starter.

- [x] **Step 1: Write the root README and architecture guide** with quick start, exact commands, FSD layer ownership, and the rule to add packages only when shared code exists.
- [x] **Step 2: Document UI, API, and AI patterns** with imports and examples that match the implemented interfaces; document the server-only requirements, authentication, and rate limits for any future AI endpoint.
- [x] **Step 3: Add Codex files and one concise skill**. Keep model, approval, and sandbox choices user-owned; do not add an empty config or plugin marketplace.
- [x] **Step 4: Review all Markdown links, paths, commands, and examples** against the final tree; run `git diff --check`.

## Task 7: Add a browser smoke test and verify the complete base

**Files:**

- Create: `apps/web/playwright.config.ts`, `apps/web/e2e/home.spec.ts`
- Modify: root and web `package.json`, `pnpm-lock.yaml`, `turbo.json`, `README.md`, `docs/testing.md`

**Interfaces:**

- `pnpm test:e2e` runs separately from the fast unit and component test suite and starts the app without a database or AI credentials.

- [x] **Step 1: Write the Playwright smoke test** that opens `/` and checks the “Smart Base” heading and main landmark.
- [x] **Step 2: Run `pnpm test:e2e`**; install Chromium with `pnpm --filter @smart-base/web exec playwright install chromium` only if the browser is missing.
- [x] **Step 3: Run final checks**: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, and `pnpm build`.
- [x] **Step 4: Inspect the full tree and run `git diff --check`**; confirm that no `.env` file, product-domain code, database or authentication code, or live AI requests were added.
