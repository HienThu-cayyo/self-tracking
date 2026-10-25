# Deployment

Smart Base uses separate platforms for its web app and background workers:

| Workload                 | Platform           | Deployment method                                      |
| ------------------------ | ------------------ | ------------------------------------------------------ |
| Next.js web app          | Vercel             | Vercel Git integration                                 |
| A real background worker | Cloudflare Workers | Worker-specific GitHub Actions workflow using Wrangler |

GitHub Actions validates pull requests and pushes to `main` with the [`validate.yml`](../.github/workflows/validate.yml) workflow. It does not deploy the web app or a placeholder worker.

## Deploy the web app to Vercel

1. Import this Git repository as a Vercel project.
2. Set the project's **Root Directory** to `apps/web`, keep the Next.js framework and build settings on automatic detection unless the project needs a custom command, and ensure source files outside the root directory are included in the build so the app can use shared workspace packages.
3. Connect the project to the repository's Git provider. Vercel creates preview deployments for pull requests and deploys the configured production branch, which should be `main`.
4. In GitHub branch protection or repository rules, require the `Quality checks` and `Browser smoke test` status checks before merging to `main`. Require Vercel's deployment check too if a successful preview deployment must also gate merges.
5. Add runtime environment variables in the Vercel project settings for the environments that need them. For example, configure `AI_API_KEY` and `AI_MODEL` when the deployed application uses the AI service. Keep secrets out of Git and do not use `NEXT_PUBLIC_` for secret values.

No `vercel.json` is needed for Git integration. Add `apps/web/vercel.json` only for a deliberate project-specific setting, such as a function region chosen to match the application's data location and latency needs. Do not copy a region setting from another application without that decision.

Do not add a Vercel deploy job or Vercel token to GitHub Actions when Vercel Git integration owns web deployments. Keep CI as a validation gate and use GitHub branch rules to prevent unvalidated changes from merging.

## Deploy a real worker to Cloudflare

The starter has no worker package. Add a deployment workflow only when a real workload has been added under `apps/workers/<worker-name>/`. Follow the [worker setup guide](../apps/workers/README.md) for package scripts, Wrangler configuration, generated types, local development, and manual deployment.

Use one production workflow per worker with path-specific triggers. Keep the workflow inside this repository so the starter remains copyable. A worker workflow should:

1. Run only for pushes to `main` that change that worker, its actual shared package dependencies, the workspace lockfiles, or the workflow itself.
2. Use read-only repository permissions and a GitHub `Production` environment.
3. Install with `pnpm install --frozen-lockfile`, generate Worker types, then run the worker's lint, typecheck, coverage tests, and `wrangler deploy --dry-run`.
4. Deploy with the worker's local Wrangler script only after those checks pass.

Store `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in the GitHub `Production` environment and expose them only to the deploy step. Scope the token to the target account and the Workers permissions and resources the workload needs. Never put credentials in `wrangler.jsonc`, workflow source, or repository variables. See [Cloudflare Worker setup](../apps/workers/README.md#secrets) for local and deployed secret handling.

Example workflow shape for a worker named `my-worker`:

```yaml
name: Deploy my-worker

on:
  push:
    branches: [main]
    paths:
      - "apps/workers/my-worker/**"
      - "packages/<shared-package>/**" # Remove when the worker has no shared package dependency.
      - "package.json"
      - "pnpm-lock.yaml"
      - "pnpm-workspace.yaml"
      - ".github/workflows/deploy-my-worker.yml"

permissions:
  contents: read

concurrency:
  group: deploy-my-worker-production
  cancel-in-progress: false

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10.32.1
      - uses: actions/setup-node@v4
        with:
          node-version: 22.22.2
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @smart-base/my-worker run cf-typegen
      - run: pnpm --filter @smart-base/my-worker run lint
      - run: pnpm --filter @smart-base/my-worker run typecheck
      - run: pnpm --filter @smart-base/my-worker run test
      - run: pnpm --filter @smart-base/my-worker exec wrangler deploy --dry-run --config wrangler.jsonc

  deploy:
    needs: validate
    runs-on: ubuntu-latest
    environment: Production
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10.32.1
      - uses: actions/setup-node@v4
        with:
          node-version: 22.22.2
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: Deploy Worker
        run: pnpm --filter @smart-base/my-worker run deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

Replace the worker and shared-package names with the real workspace names. Keep the workflow paths aligned with every workspace package that the Worker imports. For deployment previews, add a separate non-production environment and workflow only when the application needs that release process.

## Continuous integration

The root validation workflow runs `pnpm lint`, `pnpm knip`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm test:e2e`. `pnpm test` enforces 100% global line, statement, function, and branch coverage in each current test workspace. Make both workflow jobs required status checks on `main`; GitHub branch protection must be configured in repository settings.

The web build does not need Cloudflare credentials. Worker deployment credentials are only read by a worker-specific production workflow after a real worker is added.

## Platform references

- [Vercel monorepos](https://vercel.com/docs/monorepos)
- [Vercel Git deployments](https://vercel.com/docs/git)
- [Vercel monorepo FAQ](https://vercel.com/docs/monorepos/monorepo-faq)
- [GitHub protected branches and required checks](https://docs.github.com/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [Deploy Cloudflare Workers with GitHub Actions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)
- [Wrangler deploy command](https://developers.cloudflare.com/workers/wrangler/commands/#deploy)
