# Shared packages

Add code here only when multiple applications need to share it. The starter includes `@smart-base/database` for server-only PostgreSQL and Drizzle infrastructure. Keep product models and workflows in their owning app until another application has a clear need to share them.

`packages/database` is the only package currently included. There are no placeholder shared packages. Add a package only with a real consumer, a clear owner, and a documented public API.

## Testing and coverage

Every package that adds runtime code must expose a Turbo-discoverable `test` script that runs Vitest coverage, add `@vitest/coverage-v8` at the same version as its Vitest dependency, and explicitly include all runtime TypeScript and TSX files under `src/`. Exclude test/spec files, `src/test/**`, declarations, and generated files. Set global `lines`, `statements`, `functions`, and `branches` thresholds to `100` so the root `pnpm test` command enforces the same gate in every workspace. See the [testing guide](../docs/testing.md) for the full coverage contract.
