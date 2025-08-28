# Pre-commit checks

This repo runs quality gates automatically on git commit.

What runs

- Prettier format check
- ESLint (no warnings allowed)
- Stylelint (non-blocking warnings; errors fail)
- TypeScript type-check
- Vitest fast run (no coverage)

Usage

- Manual run:
  - npm run precommit
- Auto-fix then run:
  - npm run precommit:fix

Git hook

- Installed via simple-git-hooks on npm install (prepare script).
- Hook path/config lives in package.json under "simple-git-hooks".

IDE run configs

- Pre-commit (All checks)
- Pre-commit Fix

Troubleshooting

- If the hook doesn’t fire: run npm run prepare to reinstall hooks.
- To see verbose output: node scripts/pre-commit-hook.ts --verbose
