# Disable Cloudflare GitHub App (Pipeline-only Deploys)

We deploy to Cloudflare Pages using wrangler from GitHub Actions. To avoid duplicate/failed deploys
triggered by the Cloudflare GitHub App, disable the repository integration and rely solely on the CI
pipeline.

## Steps

1. In Cloudflare Dashboard:
   - Go to Pages > weather > Settings > Builds & deployments.
   - Set "Git integration" to Disabled (Disconnect GitHub) so pushes do not trigger Cloudflare App
     builds.
   - Ensure "Build command" and "Output directory" are not used by App; wrangler handles `dist`
     deploy.

2. In GitHub:
   - Settings > Integrations > Installed GitHub Apps > Cloudflare Pages.
   - Limit or remove repository access for this repo, or uninstall if unused elsewhere.

3. Secrets (keep):
   - CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID remain in repo/org secrets for wrangler.

4. Confirm pipeline-only behavior:
   - Merges to `main` run `.github/workflows/ci-cd.yml` and deploy prod via wrangler.
   - Pushes to `dev`, `develop`, or `staging` run `.github/workflows/dev-deploy.yml` and deploy
     non-prod.
   - PRs will no longer auto-deploy previews via the App; previews can be added later via wrangler
     if desired.

## Notes

- Workflows now guard deployments with `if: github.event_name == 'push'` and target branches.
- Concurrency is enabled to cancel in-progress runs per-branch.
- wrangler config is in `wrangler.toml` with `pages_build_output_dir = "dist"`.
