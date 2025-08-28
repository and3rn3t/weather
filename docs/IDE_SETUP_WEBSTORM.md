# WebStorm/IntelliJ Setup (Shareable IDE assets included)

Use these steps to align your IDE with this repo’s guardrails and run configs.

Plugins

- ESLint (bundled)
- Prettier (bundled)
- Stylelint
- Vitest (bundled in recent versions)
- SonarLint (optional)
- HTTP Client (bundled)

Node & TypeScript

- Node interpreter: use 22.12.0 (repo includes .node-version).
- TypeScript: use workspace version from node_modules and enable the TS Language Service.

Actions on Save

- Run ESLint —fix
- Run Prettier
- Optional: Run Stylelint —fix for .css

Run configurations (pre-created in .run/)

- Dev (Vite) → npm run dev
- Preview (Vite) → npm run preview
- Build (Vite) → npm run build
- Tests (Vitest Fast) → npm run test:fast
- Tests (Vitest UI) → npm run test:ui
- Tests (Vitest Optimized) → npm run test:ci

Quality gates (NPM scripts)

- Lint: npm run lint
- Type check: npm run type-check
- Tests: npm run test:fast
- Stylelint: npm run stylelint

HTTP Client

- http/api-tests.http contains ready-to-run requests for Nominatim and OpenMeteo; update User-Agent
  if needed.

ESLint guardrail

- Legacy screen files are blocked: importing src/screens/HomeScreen or
  src/screens/WeatherDetailsScreen will error. Use inline screens in src/navigation/AppNavigator.tsx
  or Lazy\* screens if needed.

Stylelint

- Config lives in .stylelintrc.json with a relaxed baseline to avoid noise; iOS26 consolidated CSS
  is ignored for parsing. defaultSeverity is warning so IDE highlighting is non-blocking.

Scopes/Indexing

- Exclude: coverage/ and android/ are already large; WebStorm usually handles this automatically.
  You can also exclude archive/ and docs/archive/ for speed.

Before Commit (recommended)

- Enable: Run ESLint, Reformat code, Run tests (Vitest Fast), Analyze with SonarLint (optional).

Troubleshooting

- If CSS linting is noisy, run: npm run stylelint:fix
- If IDE doesn’t pick Node: Settings > Node.js → pick 22.12.0
- If ESLint doesn’t fire: Settings > ESLint → Automatic; ESLint config file should be
  eslint.config.js
