# Config and Environment Variables

## Core principles

A Stage is a set of configurations that define the environment in which the application is running. The stage is
defined by the `STAGE` environment variable.

This app uses:

- `local` — local development (default)
- `test` — tests
- `railway` — Railway deploy

The application is expected to fail fast if the configuration is not present or is invalid. This is to prevent
the application from running in an unknown state.

### Environment variables

Config is loaded at runtime from YAML. Values matching `${env:VARIABLE_NAME}` are replaced from `process.env`.

The following files are merged in order (later wins):

 - `.config/${process.env.STAGE}.api.template.yml`
   - committed to the repository
   - interpolate from the system environment with `${env:VARIABLE_NAME}`
 - `.config/${process.env.STAGE}.api.resolved.yml`
   - optional overlay, never committed
 - `.config/${process.env.STAGE}.api.override.yml`
   - strictly manually created, never committed (use this for local secrets)

Put Auth0 and other secrets in `local.api.override.yml`, not in the committed template.

### Validation

Each module should validate the configuration at boot. For this purpose, a `~common/config` module is available that
can be used to extract the configuration and validate it. General purpose validation is in `~common/validate`.

## Railway

Set `STAGE=railway` and the env vars listed in `.config/railway.api.template.yml` (Auth0, `DATABASE_URL`, etc.).
No bootstrap step.

## Local

Set `STAGE=local` (the default). Edit `.config/local.api.template.yml` for non-secret defaults, and
`.config/local.api.override.yml` for secrets.
