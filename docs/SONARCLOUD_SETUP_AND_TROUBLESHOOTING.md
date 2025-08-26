# SonarCloud: Setup, Workflow, and Troubleshooting

This project uses SonarCloud for code quality. On pull requests, analysis is strict (must pass). On
main pushes, analysis is non-blocking to keep deployments flowing.

## Badges

- PR Quality Gate: add in README if desired (replace org/key if you fork)
  - Quality Gate:
    <https://sonarcloud.io/api/project_badges/measure?project=and3rn3t_weather_ci&metric=alert_status>
  - Coverage:
    <https://sonarcloud.io/api/project_badges/measure?project=and3rn3t_weather_ci&metric=coverage>

## Configuration

- Project key: `and3rn3t_weather_ci`
- Organization: `and3rn3t`
- Properties file: `sonar-project.properties`
- Workflow: `.github/workflows/sonarcloud.yml`
- Token: `SONAR_TOKEN` GitHub secret (org or repo scope)

Important:

- Keep `sonar.projectKey` in `sonar-project.properties` aligned with the workflow args.
- Vitest writes `coverage/lcov.info` for coverage import.

## Workflow behavior

- Pull requests:
  - SonarCloud job is strict (must pass).
- Push to main:
  - SonarCloud job uses `continue-on-error` to avoid blocking deployments on transient Sonar issues.

## Common issues and fixes

1. Project not found

- Symptoms: Sonar step ends with "Project not found" even though ensure-project step prints "Project
  exists."
- Checks:
  - Verify `sonar.projectKey` matches exactly in both places:
    - `sonar-project.properties`
    - workflow args `-Dsonar.projectKey`
  - Ensure `SONAR_TOKEN` has access to org `and3rn3t` and the project.
  - Confirm default branch on SonarCloud is set to `main` and GitHub ALM binding is enabled.

1. Coverage = 0%

- Ensure `coverage/lcov.info` exists before the scan. The workflow prints a warning if not found.
- Make sure Vitest ran with coverage in CI (we run `test:ci` with coverage and fallbacks).

1. CSS parse errors

- If Sonar flags parse errors on certain CSS, exclude the file temporarily in `sonar.exclusions` and
  track a follow-up to clean it up.

## Maintenance tips

- If SonarCloud Automatic Analysis is enabled on the project, disable it to avoid conflicts with CI.
- If you rename branches, update SonarCloud default branch accordingly.
- For deep debugging, rerun the scanner with `-X` (enable in the workflow temporarily).

## Links

- Project: <https://sonarcloud.io/project/overview?id=and3rn3t_weather_ci>
- Docs: <https://docs.sonarcloud.io/>
