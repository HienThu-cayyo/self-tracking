# Quality checks

## Available commands

```bash
pnpm format:check # Verify formatting without changing files
pnpm lint       # ESLint, including FSD import boundaries
pnpm knip       # Detect unused files, exports, and dependencies
pnpm typecheck  # Strict TypeScript check, no emit
pnpm test       # Vitest unit and component tests
pnpm test:e2e   # Playwright browser smoke test on Chromium
pnpm build      # Next.js production build
pnpm db:generate # Generate Drizzle SQL from local schema files; no database required
pnpm db:migrate  # Apply generated SQL to DATABASE_URL
```

Run `pnpm format` to apply the repository's pinned Prettier configuration. CI runs `pnpm format:check`, lint, and Knip before typechecking; resolve any reported issues before submitting changes.

To run one test file during development:

```bash
pnpm --filter @smart-base/web exec vitest run src/_shared/api/fetch-json.test.ts
```

Focused Vitest commands are useful while developing, but they do not run the full coverage gate. Run `pnpm test` before handing off a change.

## Coverage contract

The root `pnpm test` command runs `vitest run --coverage` in both current test workspaces:

| Workspace           | Runtime coverage scope                             |
| ------------------- | -------------------------------------------------- |
| `apps/web`          | Every first-party `src/**/*.{ts,tsx}` runtime file |
| `packages/database` | Every first-party `src/**/*.{ts,tsx}` runtime file |

Each workspace enforces 100% global coverage for lines, statements, functions, and branches. Coverage includes runtime files even when no test currently imports them. `pnpm test` fails if any threshold is missed. Turbo caching is disabled for the `test` task, so each invocation executes both suites and evaluates a fresh coverage report.

The coverage report excludes `*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx`, `src/test/**`, `*.d.ts`, and `*.generated.ts` or `*.generated.tsx`. Vitest configuration, stylesheets, dependencies, and files outside the included `src/` trees are not measured. The `src/test/` directories contain test harness code rather than runtime behavior.

Unit and component tests use Vitest, Testing Library, and jsdom. The database package uses Vitest in Node. Inject `fetchImpl` or an AI model as needed; tests do not depend on the network, secrets, a live database, or an external provider. Test UI behavior, semantics, and accessibility rather than implementation details.

If a future worker or shared package adds runtime code, add a Turbo-visible `test` script, the matching `@vitest/coverage-v8` provider, an explicit runtime include, and the same four 100% thresholds before adding the package to the workspace. See [worker guidance](../apps/workers/README.md) and [package guidance](../packages/README.md).

Playwright starts the Next.js development server on port `3100` and checks the `/` route. If Chromium is not installed on the machine, install it once:

```bash
pnpm --filter @smart-base/web exec playwright install chromium
```

## When adding code

- For behavior changes: add a regression test first, confirm it fails, then implement the change and run the test again.
- Add behavior-focused tests for each runtime module, including its success, failure, and optional branches. Keep every new runtime file inside the enforced coverage scope unless it is genuinely generated or test harness code.
- For components: check the primary interactions, keyboard behavior, accessibility, and any empty or error states the component owns.
- At data boundaries: test valid and invalid responses; errors must not expose sensitive response data.
- For database changes: test schema and repository behavior without a live database, generate and review the migration, and apply it only to an explicitly selected environment.
- Before completing a feature: run lint, typecheck, unit tests, and the production build.

The browser smoke test covers only the default app shell. Add browser scenarios for new features when they have important interactions.
