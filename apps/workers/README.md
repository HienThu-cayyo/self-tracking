# Background workers

Create one independently deployable Cloudflare Worker package under `apps/workers/<worker-name>/` for each real background workload. The `apps/workers/*` workspace glob is already configured, so pnpm and Turbo discover new packages placed directly under this directory.

The starter does not include a worker package or deploy a sample job. Use the examples below as a starting point only after the application has a real workload.

For production CI and deployment, follow the [deployment guide](../../docs/deployment.md#deploy-a-real-worker-to-cloudflare). Add the path-scoped GitHub Actions workflow alongside the real worker package; do not configure a no-op deployment job in the starter.

## Package structure

Keep each worker's runtime, configuration, dependencies, tests, and deployment scripts in its own package:

```text
apps/workers/my-worker/
├── package.json
├── wrangler.jsonc
├── eslint.config.mjs
├── tsconfig.json
├── vitest.config.ts
└── src/
    ├── index.ts
    └── index.test.ts
```

## Minimal HTTP Worker example

This HTTP handler exposes a small health endpoint that can be used to verify a newly created Worker locally and after deployment:

```ts
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (request.method !== "GET" || url.pathname !== "/health") {
      return new Response("Not found", { status: 404 })
    }

    return Response.json({ status: "ok" })
  },
} satisfies ExportedHandler
```

Wrangler-generated declarations provide the `ExportedHandler` type. Keep the handler focused on its workload; do not create a package that only returns this health response.

## Create and configure a package

1. Create the source directory:

   ```bash
   mkdir -p apps/workers/my-worker/src
   ```

   Add a private `apps/workers/my-worker/package.json` with the scripts the root quality gates need:

   ```json
   {
     "name": "@smart-base/my-worker",
     "private": true,
     "type": "module",
     "scripts": {
       "dev": "wrangler dev",
       "cf-typegen": "wrangler types",
       "deploy": "wrangler deploy",
       "lint": "eslint src",
       "typecheck": "tsc --noEmit",
       "test": "vitest run --coverage"
     }
   }
   ```

2. Install Wrangler locally in that package and use the same TypeScript, ESLint, Vitest, and `@vitest/coverage-v8` versions as the existing workspaces. Keep the Vitest and coverage-provider versions aligned. For example:

   ```bash
   pnpm --filter @smart-base/my-worker add -D wrangler typescript@5.9.3 eslint@9.39.5 vitest@4.1.11 @vitest/coverage-v8@4.1.11
   ```

   Commit the resolved Wrangler version in `pnpm-lock.yaml`. Cloudflare recommends a project-local Wrangler installation so each worker has a reproducible CLI version.

3. Add `wrangler.jsonc` next to `package.json`:

   ```jsonc
   {
     "$schema": "node_modules/wrangler/config-schema.json",
     "name": "smart-base-my-worker",
     "main": "src/index.ts",
     "compatibility_date": "2026-10-24",
     "observability": { "enabled": true },
   }
   ```

   Set `compatibility_date` to the date the Worker is created, then keep it pinned until you intentionally upgrade its runtime compatibility. Treat `wrangler.jsonc` as the source of truth for bindings and deployment configuration.

4. Add an ESLint flat config and a TypeScript configuration extending the repository's strict root config. For example, use this `tsconfig.json` so the generated Worker declarations are included:

   ```json
   {
     "extends": "../../../tsconfig.json",
     "include": ["src/**/*.ts", "worker-configuration.d.ts"]
   }
   ```

   Add a package-local Vitest config that includes all runtime files under `src/`, excludes tests and generated files, and enforces 100% global lines, statements, functions, and branches. See the [testing guide](../../docs/testing.md), the [database TypeScript config](../../packages/database/tsconfig.json), and the [database Vitest config](../../packages/database/vitest.config.ts) for repository conventions.

5. Generate and commit the Worker runtime and binding declarations after creating or changing `wrangler.jsonc`:

   ```bash
   pnpm --filter @smart-base/my-worker run cf-typegen
   ```

   Re-run this command whenever the configuration's bindings or compatibility settings change.

## Develop locally

Run these commands from the repository root:

```bash
pnpm install
pnpm --filter @smart-base/my-worker run cf-typegen
pnpm --filter @smart-base/my-worker run dev
```

Wrangler runs the Worker in its local Cloudflare runtime and serves a local URL. With the example handler, request `GET /health` to see `{"status":"ok"}`. Local development does not require a Cloudflare login unless the Worker uses remote resources.

For local-only credentials, keep names and placeholders in a tracked `apps/workers/my-worker/.dev.vars.example`:

```dotenv
UPSTREAM_API_TOKEN=replace-me
```

Copy it to `.dev.vars` and replace the placeholder. The root `.gitignore` ignores `.dev.vars*` and Wrangler's `.wrangler/` state while allowing `.dev.vars.example` to be committed. Never put secret values in `wrangler.jsonc`, `vars`, source files, or committed examples.

```bash
cp apps/workers/my-worker/.dev.vars.example apps/workers/my-worker/.dev.vars
```

## Deploy to Cloudflare

You need a Cloudflare account with permission to deploy Workers. Wrangler is installed in the package so all commands use its pinned version.

The sample configuration uses the default `workers.dev` route because it declares no custom route. Configure a `workers.dev` subdomain on the Cloudflare account before expecting a public URL. For production traffic, use a custom domain or Workers route.

1. Authenticate once in an interactive terminal:

   ```bash
   pnpm --filter @smart-base/my-worker exec wrangler login
   ```

2. Preview locally and verify `GET /health`. Stop the local server before continuing:

   ```bash
   pnpm --filter @smart-base/my-worker run dev
   ```

3. Run the worker's lint, typecheck, and coverage-gated tests, then deploy:

   ```bash
   pnpm --filter @smart-base/my-worker run lint
   pnpm --filter @smart-base/my-worker run typecheck
   pnpm --filter @smart-base/my-worker run test
   pnpm --filter @smart-base/my-worker run deploy
   ```

4. Verify the deployed URL in the deploy output, then inspect live logs:

   ```bash
   pnpm --filter @smart-base/my-worker exec wrangler tail
   ```

### Secrets

Use Cloudflare secret bindings for deployed credentials. After the Worker exists, add a secret interactively so its value is not placed in shell history:

```bash
pnpm --filter @smart-base/my-worker exec wrangler secret put UPSTREAM_API_TOKEN
```

`wrangler secret put` publishes a new Worker version immediately. Make sure the first deployed version can safely handle a missing secret until you add it. For local development, use `.dev.vars`; Wrangler reads it locally and it must stay untracked. Do not store secrets in `vars` or commit credentials. For CI deployments, set the account ID in Wrangler configuration and provide `CLOUDFLARE_API_TOKEN` through the CI secret store rather than a repository file.

### Scheduled workloads

For a workload with a defined schedule, add a `scheduled(controller, env, ctx)` handler and a concrete `triggers.crons` entry to `wrangler.jsonc`. Do not configure a placeholder cron. Use [`wrangler dev`](https://developers.cloudflare.com/workers/configuration/cron-triggers/) to test scheduled invocations locally before deployment.

## Testing and coverage

Every worker package that adds runtime code must expose a Turbo-visible `test` script that runs coverage. Keep external calls injected or mocked so worker tests are deterministic and offline. Configure Vitest to include every runtime TypeScript and TSX file under `src/`, excluding test/spec files, `src/test/**`, declarations, and generated files. Set global thresholds to 100% for lines, statements, functions, and branches.

The root Turbo `test` task disables caching, so `pnpm test` runs the worker's coverage gate on every invocation. Follow the [testing guide](../../docs/testing.md) for the repository-wide contract.

## Boundaries

- Store deployment secrets with Cloudflare's secret manager. Do not commit credentials or share mutable runtime state between workers.
- Import from `packages/*` only when the code is genuinely shared with another app.
- Do not import `@smart-base/database` into a Cloudflare Worker. Its PostgreSQL.js client uses the Node server runtime and is marked `server-only`. If a worker needs persistence, choose a driver supported by both the Worker runtime and the database provider.
- Add a `triggers.crons` entry only when the workload has a defined schedule.

## Cloudflare references

- [Install and update Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [Wrangler commands](https://developers.cloudflare.com/workers/wrangler/commands/workers/)
- [Wrangler login and authentication](https://developers.cloudflare.com/workers/wrangler/commands/general/)
- [workers.dev subdomains and routes](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/)
- [Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
- [Scheduled handler](https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/)
- [Deploy with GitHub Actions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)
