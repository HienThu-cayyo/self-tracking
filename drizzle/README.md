# Drizzle migrations

Drizzle Kit writes generated SQL migrations and snapshots to this directory. Commit the SQL files and `meta/` snapshots together after reviewing them.

The starter currently has no product tables or generated migration files. Add domain tables to `packages/database/src/schema/`, then run `pnpm db:generate` and review the generated SQL before applying it.

`pnpm db:generate` only reads local schema files. `pnpm db:migrate` connects to the configured database and changes its schema; set `DATABASE_URL` explicitly and review the target before running it. Never run migrations against production as part of setup or tests.
