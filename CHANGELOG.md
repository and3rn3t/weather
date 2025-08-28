# Changelog

All notable changes to this project will be documented in this file.

## [1.0.1] - 2025-08-28

### Added

- Documentation quick links in root README, including Networking Usage Guide and Production
  Networking Strategy.
- Networking Best Practices note in `.github/copilot-instructions.md`.
- Lessons learned section in `docs/technical/PRODUCTION_NETWORKING_STRATEGY.md`.

### Fixed

- Build failure in `enhancedUSSearch.ts` by ensuring `name` is always a string for
  `EnhancedUSSearchResult` mapping.

### Deployment

- Built and deployed to Cloudflare Pages (production project: `weather`).

## [1.0.0] - 2025-08-21

- Initial production-ready release with iOS26 UI kit, advanced search, comprehensive tests, and
  Cloudflare Pages CI/CD.
