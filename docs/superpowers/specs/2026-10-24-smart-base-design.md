# Smart Base — Design

## Intent

Build a copyable starter repository for new applications and Codex-assisted development. Preserve reusable engineering patterns from Smart Stock, Smart Idea, and Smart Shop while leaving product behavior out, so each application can add its domain without first rebuilding its UI, API, AI, testing, and repository-guidance foundations.

## Goals

- Start a Next.js App Router application from a pnpm/Turborepo workspace.
- Keep the Feature-Sliced Design layout used by Smart Stock and Smart Idea: `app`, `_app`, `_pages`, `_widgets`, `_features`, `_entities`, `_shared`.
- Keep the reusable UI primitives from Smart Stock's `_shared/ui`, based on shadcn components and Base UI.
- Provide a schema-checked API fetch helper and document the route, query, and service boundaries.
- Provide a server-only, environment-configured AI text service using the OpenAI-compatible LangChain adapter pattern, with an injectable model for tests. Do not add a public, unauthenticated AI endpoint.
- Provide a shared, lazy PostgreSQL/Drizzle connection package and a root migration workflow without product tables or migrations.
- Reserve `apps/workers/` for independent background-worker apps and document patterns from the source repositories without adding a placeholder job.
- Include strict TypeScript, ESLint with FSD import-boundary rules, Vitest with Testing Library, and a small Playwright smoke test.
- Include English-language onboarding and architecture documentation, plus repository-local Codex guidance and one feature-development skill.

## Non-goals

- No Smart Stock, Smart Idea, or Smart Shop domain behavior, data, branding, routes, or fixtures.
- No authentication, product-domain database schema or data, applied migrations, deployment credentials, or production observability stack.
- No provider-management UI, stored credentials, OAuth, agent runtime, or public AI endpoint.
- No Storybook or duplicate component catalog application; component usage is documented and covered by focused tests.
- No project-level Codex model, approval, or sandbox overrides. Those settings belong to each user's Codex configuration.

## Approaches

1. **Copyable starter repository — selected.** A pnpm/Turborepo workspace with one Next.js app, a location for independent worker apps, and reusable UI, API, AI, database, testing, and Codex patterns. Copying it gives each product independent ownership and avoids shared-package release work.
2. **Shared-package monorepo.** Split UI, configs, and services into packages for several apps to import. This improves cross-app reuse but adds package boundaries and version maintenance before there are multiple consumers.
3. **Codex harness only.** Add repository instructions and prompts without an application foundation. This option does not provide the reusable UI, API, and AI patterns required by the design.

The selected approach preserves the general structure of Smart Stock and Smart Idea while removing product logic.

## Architecture decisions

- Use `apps/web` for the Next.js application. Keep route files in `apps/web/src/app` thin; compose route screens from `_pages` and lower FSD layers.
- Use `apps/workers/` as a group for independently deployable worker workspaces under `apps/workers/*`. Smart Stock uses separate Wrangler packages for scheduled jobs; Smart Idea has no worker app. Do not create a no-op worker or copy product-specific jobs.
- Use `packages/database` for the shared server-only PostgreSQL connection. Keep it lazy so builds and tests do not require `DATABASE_URL`; add database schemas only when a product has defined data requirements.
- Keep Drizzle Kit configuration at the repository root and generated SQL and metadata under `drizzle/`. Do not commit a placeholder table or migration.
- Keep other packages out of `packages/*` until reusable code has a clear consumer.
- Follow the source repositories' observed stack for pnpm `10.32.1`, Turborepo `2.11.5`, Next.js `16.3.2`, React `19.2.8`, TypeScript `5.9.3`, Tailwind CSS `4.3.3`, and ESLint 9. Set Node.js `>=22.22.2` to satisfy the selected LangChain and jsdom package engines; this replaces the source repositories' `>=20.18` baseline. Commit `pnpm-lock.yaml` to keep dependency versions reproducible.
- Keep the generic Smart Stock shared UI set under `_shared/ui`: avatar, badge, button, calendar, card, chart, dialog, dropdown menu, field, input, label, popover, separator, sheet, sidebar, skeleton, sonner, spinner, table, theme provider, toggle, toggle group, and tooltip. Use Base UI and existing project dependencies; do not add a new UI framework.
- Keep API calls small and explicit: a shared `fetchJson` helper accepts a response schema, timeout and cancellation options, a method and body, and an injected `fetch` implementation for tests. Keep request schemas and query hooks in their owning slices; keep Next.js route handlers as adapters.
- Keep the AI service server-only. Read the API key, model, and base URL from environment variables; validate configuration before constructing a model; expose a small text-generation service; and allow a fake model to be injected. Tests must never call a live provider. Add `.env.example`, never real credentials.
- Use Drizzle ORM with PostgreSQL.js for the database connection, following the lazy connection pattern from Smart Idea and the single-connection serverless configuration from Smart Stock. Require `DATABASE_URL` only when the database is first used or migrations are applied.
- Use Vitest, jsdom, Testing Library, and user-event for unit, component, and route tests. Keep Playwright as a separate smoke-test command so the fast suite does not require a browser installation.
- Add root `AGENTS.md`, `.codex/AGENT.md`, `.codex/project-state.md`, `.codex/README.md`, and one focused skill under `.agents/skills/`. Explain that repository-local skills live under `.agents/skills`; keep Codex model and safety preferences user-owned. Do not create an empty `.codex/config.toml` or configure a plugin without an actual project need.
- Write `README.md` and focused English documentation for architecture, UI, API, AI, database, workers, Codex setup, and testing. Keep each file scoped to the decisions and workflow it owns.

## Constraints and safety

- Preserve server and client boundaries; API keys and model construction stay in server-only modules.
- Keep database credentials and connections server-side. Never apply migrations to a real database during base setup or tests.
- Do not ship an anonymous endpoint that can spend the operator's AI budget. A future product must add its own authorization and rate limits before exposing AI generation.
- Avoid copying product-specific labels, routes, database schemas, agents, and test fixtures from the source repositories.
- Keep the package set limited to what the base examples actually use.

## Acceptance criteria

- A fresh `pnpm install` followed by `pnpm dev` starts the starter app without product secrets.
- `pnpm lint`, `pnpm typecheck`, and `pnpm test` each run successfully; `pnpm test:e2e` has a separate smoke-test path.
- Tests cover API response validation and error behavior, AI configuration and fake-model behavior, and representative UI interactions and rendering.
- FSD lint rules reject imports of higher-layer modules from lower-layer modules.
- Documentation explains where code belongs, how to add UI, API, or AI use cases, how to run checks, and what the repository's Codex files do.
- No product-domain feature, schema, or data; applied database migration; authentication flow; or live AI call is included.
- `pnpm db:generate` can load the empty starter schema without a database connection; `pnpm db:migrate` clearly requires `DATABASE_URL`.
