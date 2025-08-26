# CI/CD Workflow (Pipeline-only Cloudflare Pages)

This repo deploys to Cloudflare Pages exclusively via GitHub Actions using wrangler. The Cloudflare
GitHub App is uninstalled/disabled to avoid duplicate builds.

## Triggers

- Production
  - Event: push
  - Branch: main
  - Workflow: `.github/workflows/ci-cd.yml`
  - Deploy: Yes (wrangler)
- Development/Staging
  - Event: push
  - Branch: dev, develop, staging
  - Workflow: `.github/workflows/dev-deploy.yml`
  - Deploy: Yes (wrangler)
- Pull Requests
  - Event: pull_request → main
  - Actions: lint, format check, type-check, build, upload `dist` as artifact, and run fast tests
    with a short summary in the job Step Summary
  - Deploy: No
- Manual
  - Event: workflow_dispatch
  - Actions: “Dry-run preflight” step summarizing secrets and gating
  - Deploy: No

## Deploy gating (safety)

- Requires: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` (repo/org secrets)
- Repo guard: Deploys only when `github.repository == and3rn3t/weather` (prevents fork deploys)
- Branch guard: main (prod), dev/develop/staging (non-prod)
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

- PRs: `dist-<sha>` artifact contains the built bundle. The job summary includes the tail of the
  fast test output for quick signal.
- Main pushes: a `dist-manifest-<sha>` artifact lists files and sizes from `dist` to help spot size
  regressions.

## Troubleshooting

- Duplicate builds: Ensure the Cloudflare GitHub App is uninstalled and the Pages project has Git
  integration disabled.
- No deploy on PRs: Expected (pipeline-only). Check PR artifact `dist-<sha>` for a built bundle.
- Secrets missing: Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in repo or org secrets.
- Fork PRs deploying: Shouldn’t happen due to repo guard.
- Broken build: The workflow falls back to esbuild; check logs for any bundler-specific errors.

## Files

- `.github/workflows/ci-cd.yml` — Production workflow
- `.github/workflows/dev-deploy.yml` — Dev/staging workflow
- `wrangler.toml` — Cloudflare pages config
