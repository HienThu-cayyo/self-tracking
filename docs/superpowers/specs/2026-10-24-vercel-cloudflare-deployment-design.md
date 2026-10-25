# Vercel and Cloudflare Delivery Design

## Intent

Make Smart Base's checks automatic while documenting the user's deployment split: the Next.js web app runs on Vercel, and real background workers run on Cloudflare Workers.

## Goals

- Run lint, typecheck, 100% coverage tests, build, and the existing browser smoke test on pull requests and pushes to `main`.
- Document Vercel's Git-based preview and production deployments for `apps/web`.
- Document the per-worker Cloudflare deployment workflow and secret requirements.
- Keep the starter free of provider credentials, product configuration, and placeholder worker packages.

## Non-goals

- Do not deploy the web app through GitHub Actions or add Vercel credentials to GitHub.
- Do not deploy a Cloudflare Worker until a real worker package exists.
- Do not create or change Vercel project settings, GitHub branch protection, Cloudflare accounts, or secrets from the repository.

## Approaches

1. **Vercel Git integration plus GitHub validation, and a documented per-worker Cloudflare workflow (selected).** Vercel owns web builds and deployments; GitHub Actions validates the repository. A real worker gets a path-scoped Wrangler deployment workflow when it is added. This matches the deployment boundary and the existing Smart Stock workflow pattern without adding unused credentials or deployment jobs.
2. **Deploy both platforms from GitHub Actions.** This centralizes workflow configuration but duplicates Vercel's Git integration and requires extra Vercel secrets. It is unnecessary for the selected web deployment path.
3. **Manual deployment only.** This avoids automation but leaves quality checks dependent on a developer remembering to run them.

## Constraints and decisions

- Use Node.js `22.22.2` or later and pnpm `10.32.1`, matching repository requirements.
- Run the existing root commands so future workspaces participate in the same quality gate.
- Store Cloudflare credentials in a GitHub Actions environment, never in tracked files.
- Do not copy Smart Stock's `sin1` Vercel region without a product-specific latency or data-location requirement.
