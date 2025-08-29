# CI/CD Workflow (Pipeline-only Cloudflare Pages)

This repo deploys to Cloudflare Pages exclusively via GitHub Actions using wrangler. The Cloudflare
GitHub App is uninstalled/disabled to avoid duplicate builds.

## Triggers

- Quality Gate (PR checks)
  - Event: pull_request
  - Branch: main
  - Workflow: `.github/workflows/quality.yml`
  - Actions: ESLint, Prettier check, Stylelint, TypeScript, Vitest fast, Build
  - Deploy: No

- Production
  - Event: push
  - Branch: main
  - Workflow: `.github/workflows/ci-cd.yml`
  - Deploy: Yes (wrangler)

- Preview (non-main branches)
  - Event: push
  - Branch: any branch except main
  - Workflow: `.github/workflows/dev-deploy.yml`
  - Deploy: Yes (wrangler) — to the single Cloudflare Pages project as a Preview

- SonarCloud (infrequent)
  - Event: schedule (weekly, Sunday 03:00 UTC) and manual `workflow_dispatch`
  - Workflow: `.github/workflows/sonarcloud.yml`
  - Deploy: No

- Prettier (on demand)
  - Event: manual `workflow_dispatch`
  - Workflow: `.github/workflows/prettier-check.yml`
  - Deploy: No

## Deploy gating (safety)

- Requires: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` (repo/org secrets)
- Repo guard: Deploys only when `github.repository == and3rn3t/weather` (prevents fork deploys)
- Branch guard: main (prod), any non-main branch (preview)
- Concurrency: In-progress runs per branch are auto-cancelled
- Path filters: docs and markdown changes are ignored

## Manual dry-run (no deploy)

Use this to validate the pipeline and secrets without deploying.

1. GitHub → Actions →
   - “⚡ Ultra-Fast Deploy” (prod) or “🧪 Development Deploy” (dev)
2. Click “Run workflow”
3. Open the job and view the Step Summary:
   - Should show `✅ CLOUDFLARE_API_TOKEN present` and `✅ CLOUDFLARE_ACCOUNT_ID present`
   - Confirms deploy gating (event, branch, repo)

## Deployment details

- Tool: `cloudflare/wrangler-action@v3`
- Config: `wrangler.toml` with `pages_build_output_dir = "dist"`
- Build: `vite build` with safe fallback to esbuild (`build:fallback`)
- URLs:
  - Production: [weather.andernet.dev](https://weather.andernet.dev)
  - Cloudflare Pages project: weather

### Artifacts and summaries

- PRs: Quality Gate builds the app; failures block merge. No deploy or artifact upload here.
- Main pushes: a `dist-manifest-<sha>` artifact lists files and sizes from `dist` to help spot size
  regressions.

## Troubleshooting

- Duplicate builds: Ensure the Cloudflare GitHub App is uninstalled and the Pages project has Git
  integration disabled.
- No deploy on PRs: Expected (pipeline-only). Use the Quality Gate workflow status for PRs.
- Secrets missing: Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in repo or org secrets.
- Fork PRs deploying: Shouldn’t happen due to repo guard.
- Broken build: The workflow falls back to esbuild; check logs for any bundler-specific errors.

## Files

- `.github/workflows/quality.yml` — PR quality checks
- `.github/workflows/ci-cd.yml` — Production workflow (push main)
- `.github/workflows/dev-deploy.yml` — Dev/staging workflow (push dev/develop/staging)
- `.github/workflows/sonarcloud.yml` — Weekly/manual SonarCloud analysis
- `.github/workflows/prettier-check.yml` — Manual Prettier only
- `wrangler.toml` — Cloudflare pages config

## SonarCloud cadence

- Runs weekly (Sunday 03:00 UTC) or on demand. This keeps PRs fast and avoids redundant analysis.
- See `docs/SONARCLOUD_SETUP_AND_TROUBLESHOOTING.md` for setup and troubleshooting.
