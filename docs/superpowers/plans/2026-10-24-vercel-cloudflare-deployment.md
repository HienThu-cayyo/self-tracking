# Vercel and Cloudflare Delivery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add repository CI and document the Vercel web and Cloudflare Worker deployment paths.

**Architecture:** GitHub Actions runs the repository's root quality commands and Playwright smoke test. Vercel Git integration owns web deployments; Cloudflare deployment is documented as a worker-specific workflow to add alongside a real worker.

**Tech Stack:** GitHub Actions, pnpm, Turborepo, Playwright, Vercel, Wrangler.

**Spec:** [Vercel and Cloudflare Delivery Design](../specs/2026-10-24-vercel-cloudflare-deployment-design.md)

## Global Constraints

- Use Node.js `22.22.2` or later and pnpm `10.32.1`.
- Keep runtime coverage thresholds at 100% for lines, statements, functions, and branches.
- Do not add deployment credentials, product environment values, or a placeholder worker.
- Keep documentation in professional English.

## Review Focus

- A missing or incorrectly filtered trigger must not skip required checks for a pull request or a push to `main`.
- The browser job must install Chromium before starting the Playwright smoke test.
- Vercel and Cloudflare deployment responsibilities must not overlap or imply that a worker exists in the starter.
- Cloudflare credentials must remain GitHub secrets and deployment must be restricted to the production branch/environment.
- Relative links and commands in the deployment docs must match this repository's paths and scripts.

---

### Task 1: Add CI and deployment guidance

**Files:**

- Create: `.github/workflows/validate.yml`
- Create: `docs/deployment.md`
- Modify: `README.md`, `AGENTS.md`, `.codex/AGENT.md`, `.codex/project-state.md`, `apps/workers/README.md`
- Verify: workflow YAML, markdown links, root quality commands, and Playwright smoke test

**Interfaces:**

- CI consumes the existing root scripts: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm test:e2e`.
- Deployment docs point Vercel to `apps/web` and explain adding a Cloudflare workflow with each real worker.

- [x] Add a pull request and `main` push workflow with read-only repository permissions, pnpm caching, a quality job, and a Playwright job that installs Chromium.
- [x] Document Vercel project setup, Git preview/production behavior, branch protection, environment-variable handling, and the Cloudflare workflow/secrets pattern.
- [x] Link the deployment guide from the root README and worker guidance; add concise agent instructions for the two deployment targets.
- [x] Validate YAML and links, run all root quality checks and E2E, then commit on `main`.
