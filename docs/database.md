# Database

The `@smart-base/database` workspace package provides the shared PostgreSQL connection and Drizzle entry point. It contains infrastructure only: the starter has no product tables, seed data, or migrations.

## Connection

Import the database only from server-side code. Before using it in the web app, add the workspace dependency:

```bash
pnpm --filter @smart-base/web add '@smart-base/database@workspace:*'
```

```ts
import { getDb } from "@smart-base/database/server"

const db = getDb()
```

`getDb()` reads and trims `DATABASE_URL` only when first called, then creates and reuses one Drizzle/PostgreSQL.js client per process. The PostgreSQL.js client uses `max: 1` and `prepare: false` for serverless compatibility. Importing the package during build or tests does not open a database connection. Missing or blank `DATABASE_URL` fails at the first call with a clear configuration error.

The `server-only` marker protects this export from client bundles. Never pass the database URL or connection object to Client Components.

## Schema and migrations

Add Drizzle tables under `packages/database/src/schema/` after the application has a defined domain. The schema entry point is intentionally empty. Keep repositories and domain behavior in their owning FSD slices; the database package owns connection and shared schema definitions.

Generate migration files from local schema sources:

```bash
pnpm db:generate
```

Generation does not connect to a database. Review the SQL and snapshot files under `drizzle/`, then commit them together. Applying migrations changes the target database:

```bash
DATABASE_URL=postgres://user:password@localhost:5432/app pnpm db:migrate
```

Set `DATABASE_URL` explicitly for the intended environment. Do not run migrations against production during setup, tests, or routine verification. The starter's test suite does not apply migrations or need a live database.
