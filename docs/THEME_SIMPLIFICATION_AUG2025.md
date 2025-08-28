# Theme Simplification (August 2025)

The project now supports only two themes: light and dark. The experimental “horror” theme and all
related overlays, quotes, and effects were retired to simplify development and avoid UI conflicts.

## What changed

- Removed all `.horror-*` CSS selectors from active stylesheets.
- Removed UI toggles, activators, and test buttons for the horror theme.
- Cleaned early-boot and rescue CSS; no legacy overlays remain.
- Consolidated styling into `src/index.css` and focused enhancement files.
- Tests, type-check, lint, and builds pass without horror code paths.

## Developer guidance

- Only `light` and `dark` are valid values for `weather-app-theme`.
- Do not add `horror-theme` classes or selectors; they are not recognized.
- If you find references in “archive” docs, treat them as historical.

## Migration notes

- Any stored theme value other than `light`/`dark` is mapped to `dark` automatically.
- Components should rely on the ThemeProvider and avoid custom body class logic.

Status: Complete. Reach out if you discover any lingering references in edge docs.
