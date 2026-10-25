# Architecture

Smart Base uses the Next.js App Router with Feature-Sliced Design (FSD). Routes are thin composition roots; domains and user workflows live in separate layers so they are easier to change and test.

## Layers and ownership

| Layer        | What belongs here                                                        | Location or guidance                |
| ------------ | ------------------------------------------------------------------------ | ----------------------------------- |
| `app/`       | Routes, metadata, root layout, and connections between pages and URLs    | `apps/web/src/app`                  |
| `_app/`      | App-level providers and composition logic                                | `apps/web/src/_app/providers.tsx`   |
| `_pages/`    | Route-level screen content composed from widgets, features, and entities | Create for the first product page   |
| `_widgets/`  | Large UI blocks that compose lower-level layers                          | Create when composition needs reuse |
| `_features/` | User actions/workflows that can be expressed as verbs                    | Create as product needs arise       |
| `_entities/` | Domain-related models, schemas, and data operations                      | `apps/web/src/_entities/ai`         |
| `_shared/`   | Domain-independent UI, API clients, and libraries                        | `apps/web/src/_shared`              |

Higher layers may import lower layers: `app → _app → _pages → _widgets → _features → _entities → _shared`. `app/` and `_app/` are composition layers; `app/` is a Next.js-specific exception and should only contain route/layout wiring. Within `_pages`, `_widgets`, `_features`, and `_entities`, slices on the same layer cannot import from one another. Imports into another slice must use its public entry point (`index.ts`, `index.tsx`, `index.server.ts`, or `index.server.tsx`); internal imports within the same slice remain allowed. `_shared/` is one shared element with `ui`, `api`, and `lib` segments. ESLint enforces layer direction for static and dynamic imports, sibling-slice isolation, and public entry points in the web app.

Create product FSD layers only when a feature needs them. `_app/` already contains the root providers. Add other shared packages only when they have a real consumer; keep code used in one place with its owner. The starter's `packages/database` is pre-provided infrastructure, not a pattern for adding unused product code. The `_app`, `_pages`, and similar folder names avoid collisions with Next.js route conventions.

## Workspace layout

FSD applies to the Next.js app under `apps/web/src/`. The monorepo also has separate deployment and infrastructure areas:

```text
apps/
├── web/                    # Current Next.js application
└── workers/README.md       # Worker convention; no worker package is included
packages/
└── database/               # Current shared PostgreSQL/Drizzle infrastructure
drizzle/                    # Migration output and metadata; no migrations exist yet
```

| Path                   | Ownership                                                                                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/`            | Next.js routes, UI, and product FSD slices                                                                                                                                             |
| `apps/workers/<name>/` | Future independently deployed Cloudflare Worker packages for real background workloads; see [`apps/workers/README.md`](../apps/workers/README.md). No worker package currently exists. |
| `packages/database/`   | Shared server-only PostgreSQL connection and Drizzle schema entry point                                                                                                                |
| `packages/<name>/`     | Future shared code only when it has real consumers in multiple apps. `packages/database` is the only package currently included.                                                       |
| `drizzle/`             | Generated SQL migrations and Drizzle snapshots. The directory currently contains guidance and metadata only.                                                                           |

The database package contains infrastructure only; `packages/database/src/schema/` has no product tables yet. Add tables after the application defines its domain, then generate and review a migration. Do not put worker jobs or product workflows in shared packages.

## Adding a feature

1. A route in `app/` calls the corresponding page; routes contain no queries or business logic.
2. A page composes widgets, features, and entities without owning them.
3. Put user actions in features. Put domain schemas, models, and data in entities.
4. Move reusable code to `_shared` only when it is independent of the domain.
5. Keep tests close to their modules. Test API and AI behavior through dependency injection or mocks; unit tests must not call live services.
6. Keep persistence schemas in `packages/database`; keep repositories and domain behavior in their owning FSD slices. Keep background jobs in their own `apps/workers/<name>/` workspace.

Every runtime module must have behavior-focused tests for its success, error, and relevant optional paths. The default `pnpm test` command enforces the 100% coverage gate in each current test workspace; see the [testing guide](testing.md).

A product list screen might use `app/products/page.tsx`, `_pages/products/ui/products-page.tsx`, `_widgets/product-list/`, `_features/search-products/`, `_entities/product/`, and `_shared/ui/data-table`. This is a structural example; the starter does not include this product behavior. Use `_shared/ui/table` directly for tables that do not need TanStack Table state.
