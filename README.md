# Smart Base

A copyable Next.js starter for new applications. It includes a Feature-Sliced Design (FSD) structure, shared UI components, TanStack Query and Table, a schema-validated API client, a server-only AI text service, a lazy PostgreSQL/Drizzle package, and lint, typecheck, and test tooling. It contains no product logic from Smart Stock, Smart Idea, or Smart Shop.

## Getting started

Requires Node.js `>=22.22.2` and pnpm `10.32.1` (pinned in `packageManager`).

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`. No API key is required to run the app, build it, or run tests.

## Quality checks

```bash
pnpm format:check
pnpm lint
pnpm knip
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

`pnpm test:e2e` runs a browser smoke test with Chromium and starts the app on port `3100`. If Chromium is not installed, run `pnpm --filter @smart-base/web exec playwright install chromium`.

`pnpm test` runs Vitest with coverage in both current test workspaces, `apps/web` and `packages/database`. Each workspace enforces 100% global line, statement, function, and branch coverage for its first-party runtime TypeScript and TSX files. See the [testing guide](docs/testing.md) for the exact scope and exclusions.

## Deployment

Deploy the web app through Vercel Git integration and real background workers through worker-specific Cloudflare workflows. See the [deployment guide](docs/deployment.md) and [worker guide](apps/workers/README.md).

## Database

`@smart-base/database` creates a PostgreSQL connection only when `getDb()` is called. Add product tables under `packages/database/src/schema/`, generate and review migrations with `pnpm db:generate`, then apply them explicitly with `DATABASE_URL=... pnpm db:migrate`. See the [database guide](docs/database.md).

## Building a product

1. Read the [architecture guide](docs/architecture.md) and identify the owning route, page, widget, feature, or entity.
2. Read the [Codex workflow](docs/codex.md) and the [feature-development](.agents/skills/feature-development/SKILL.md) skill.
3. Add the first domain model under `_entities`; do not add a placeholder domain to the starter.
4. Review [UI components](docs/ui-components.md), [forms](docs/forms.md), [API](docs/api.md), [data fetching and tables](docs/data-fetching-and-tables.md), [AI service](docs/ai-service.md), [database](docs/database.md), [observability](docs/observability.md), and [testing](docs/testing.md) before adding the corresponding layer.
5. Put independent background workloads under [`apps/workers/`](apps/workers/README.md); add a worker package only when the application has a defined workload.

## Structure

```text
apps/
├── web/                    # Next.js app with FSD layers under src/
└── workers/                # Workspace convention; no worker package exists yet
packages/
└── database/               # Shared server-only PostgreSQL/Drizzle infrastructure
drizzle/                    # Migration output; no generated migrations exist yet
```

There are no additional shared packages or worker jobs in the starter. Add them only for a real consumer or workload.

The current FSD slices live under `apps/web/src/`. The starter includes `app/`, `_app/`, `_entities/ai/`, and `_shared/`; create `_pages/`, `_widgets/`, and `_features/` only when a product needs them. The dependency direction is:

```text
app → _app → _pages → _widgets → _features → _entities → _shared
```

ESLint checks import direction between layers. See [architecture.md](docs/architecture.md) for boundaries and examples.

See [apps/workers/README.md](apps/workers/README.md) for worker placement and [packages/README.md](packages/README.md) for shared-package ownership.

## Codex

`AGENTS.md` is the agent entry point. `.codex/` contains workflow guidance and the starter's current state; `.agents/skills/feature-development/` describes the feature-development process. Model, approval, and sandbox settings remain user-managed.
