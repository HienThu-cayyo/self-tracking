# Agent Instructions

Smart Base is a product-neutral starter with no product domain yet. Read [project state](.codex/project-state.md) and the [Codex documentation](docs/codex.md) before making major changes.

- Preserve FSD dependency direction: higher layers may import lower layers only. Slices on the same layer cannot import one another; imports into another slice must use its public entry point (`index.ts`, `index.tsx`, `index.server.ts`, or `index.server.tsx`). `app/` handles route and layout wiring; do not put business logic there.
- Add shared UI to `apps/web/src/_shared/ui` only when it is domain-independent. Check for an existing component before creating another one.
- Call external APIs from server-side code and validate responses at trust boundaries with schemas. Never expose credentials to the client.
- The AI service is server-only. Add authentication, rate limiting, and budget limits before creating a public route.
- Keep PostgreSQL connections and credentials server-side; use `packages/database` for PostgreSQL access. Review generated Drizzle SQL before applying it; never run migrations against production as part of setup or tests.
- Put each real background workload in its own package under `apps/workers/`; do not add placeholder jobs.
- Add behavior-focused tests for each runtime module, including success, error, and relevant optional branches. For behavior changes, write a regression test first. `pnpm test` enforces 100% global line, statement, function, and branch coverage in `apps/web` and `packages/database`; run it before finishing.
- Run `pnpm format` to apply the pinned Prettier rules and `pnpm format:check` to verify them; CI enforces the check.
- Before finishing, run the relevant checks: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`. Keep new runtime files inside the coverage include scope unless they are genuinely generated or test harness code.
- Every future worker or shared package with runtime code must add a Turbo-visible `test` script, the matching Vitest coverage provider, an explicit runtime include, and the same four 100% thresholds. Follow [worker guidance](apps/workers/README.md) or [package guidance](packages/README.md).
- Deploy the web app through Vercel Git integration and deploy each real Cloudflare Worker through its own GitHub Actions workflow. Follow [deployment guidance](docs/deployment.md); do not add a Vercel deploy action or a placeholder Worker.
- Do not add product logic, environment variables, dependencies, or abstractions "for later" when the current feature does not need them.
- If the repository has `.codegraph/`, use CodeGraph to trace symbols/call paths before using grep or reading many files. Do not initialize an index yourself.
- Read the [feature-development](.agents/skills/feature-development/SKILL.md) skill when adding a new product workflow.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
