# Smart Base Workers and Database Implementation Plan

> **Implementation workflow:** Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan one task at a time. Track progress with the checkboxes below.

**Goal:** Add a workspace for background workers and reusable, product-neutral PostgreSQL/Drizzle infrastructure.

**Architecture:** Add `apps/workers/*` to the pnpm workspace as a home for future independent Cloudflare Worker packages, without shipping a no-op job. Add `packages/database` with lazy server-only PostgreSQL.js/Drizzle access, root Drizzle Kit commands, and an empty schema entry point; keep generated migrations in `drizzle/`.

**Technology stack:** Node.js `>=22.22.2`, pnpm `10.32.1`, TypeScript `5.9.3`, Drizzle ORM `0.45.x`, Drizzle Kit `0.31.x`, PostgreSQL.js `3.4.x`, Vitest `4.1.x`, and Turborepo `2.11.5`.

**Spec:** `docs/superpowers/specs/2026-10-24-smart-base-workers-database-design.md`

## Global Constraints

- Builds and tests must not require `DATABASE_URL`. Read it only when `getDb()` or a migration command needs a connection.
- Do not add domain tables, migration files, seeds, authentication, worker jobs, or deployment secrets.
- Keep package exports server-only and keep the schema entry point empty until a product adds real tables.
- Preserve the existing English documentation and update it only where needed to describe the new structure and workflows.

## Review Focus

1. An eager database connection could break static builds that lack secrets; tests must verify lazy configuration and confirm that importing the package does not open a connection.
2. A missing or blank URL must produce a clear error before creating a PostgreSQL.js client.
3. Drizzle schema discovery must work without tables or `DATABASE_URL`.
4. Migration commands must never connect to a live database during validation.
5. The workspace glob must include a future package nested under `apps/workers/`.

## File Map

- `packages/database/`: package manifest, lazy connection, schema entry point, tests, and type/lint config.
- `drizzle.config.ts`, `drizzle/README.md`: migration input/output and operational instructions.
- `apps/workers/README.md`, `pnpm-workspace.yaml`: per-worker workspace convention.
- Root scripts, `.env.example`, architecture/testing/README/agent docs: expose the new workflows and boundaries.

## Task 1: Add the lazy database package

**Interfaces:** `getDb(): Database`; `readDatabaseUrl(env): string` throws `DATABASE_URL is not configured` when missing or blank and trims valid values.

- [x] Add `packages/database/package.json`, `tsconfig.json`, and a Vitest config with `typecheck`, `lint`, and `test` scripts.
- [x] Write tests for missing, whitespace-only, and trimmed `DATABASE_URL`; run them and confirm the expected failures before implementation.
- [x] Implement the pure URL reader, lazy singleton client, `server-only` boundary, and `index.server.ts` export. Configure PostgreSQL.js with `max: 1` and `prepare: false`.
- [x] Run the package tests, typecheck, and lint; confirm no database connection is opened.

## Task 2: Add Drizzle migration tooling

**Files:** root `package.json`, `pnpm-lock.yaml`, `.env.example`; create `drizzle.config.ts`, `packages/database/src/schema/index.ts`, and `drizzle/README.md`.

- [x] Add root `db:generate` and `db:migrate` scripts and Drizzle Kit as a root development dependency.
- [x] Configure PostgreSQL schema discovery under `packages/database/src/schema/`, root output at `drizzle/`, and optional credentials for schema generation.
- [x] Add an empty schema entry point and explain that generated SQL/snapshots are committed once real product tables exist.
- [x] Run `pnpm db:generate` without `DATABASE_URL`; verify it exits successfully and creates no domain migration. Run `pnpm db:migrate` without `DATABASE_URL`; verify a clear failure occurs before any connection attempt.

## Task 3: Add the worker workspace location

**Files:** `pnpm-workspace.yaml`; create `apps/workers/README.md`.

- [x] Include `apps/workers/*` in workspace globs.
- [x] Document one package per concrete Cloudflare Worker, each owning Wrangler config, handler, tests, and deployment scripts; explain why no sample job is included and why Node PostgreSQL.js cannot be imported into Workers.
- [x] Verify that `pnpm-workspace.yaml` parses and its workspace glob matches packages under `apps/workers/*`.

## Task 4: Update onboarding and architecture documentation

**Files:** `README.md`, `AGENTS.md`, `.codex/AGENT.md`, `.codex/project-state.md`, `.codex/README.md`, `.agents/skills/feature-development/SKILL.md`, `docs/architecture.md`, `docs/codex.md`, `docs/testing.md`; create `docs/database.md`.

- [x] Document package ownership, worker placement, schema ownership, and migration commands in English.
- [x] Update the project state to distinguish generic database infrastructure from the still-empty product domain.
- [x] Run focused package checks, `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, `pnpm build`, and `git diff --check`.
