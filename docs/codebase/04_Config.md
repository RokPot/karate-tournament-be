# Config and Environment Variables

## Core principles

A Stage is a set of configurations that define the environment in which the application is running. The stage is
defined by the `STAGE` environment variable. Usually we name it as an abbreviation of the project name and the
environment (e.g. `myapp-dev`).

To guarantee reproducibility, we always define all the variables in the current stage inside a configuration file,
that is generated at runtime and before booting the app. This config file is then read at runtime and used to set
the environment.

The application is expected to fail fast if the configuration is not present or is invalid. This is to prevent
the application from running in an unknown state.

### Environment variables

Environment variables are fully resolved at `bootstrap` and written into a temporary file.

_Preferably, no other environments variables should be used_.

The following files are used to generate the configuration:

 - `.config/${process.env.STAGE}.api.template.yaml`
   - serves as a base, includes interpolation variables, and is commited to the repository
   - to interpolate a variable from the system environment, use the `${env:VARIABLE_NAME}` syntax
 - `.config/${process.env.STAGE}.api.resolved.yaml`
   - generated at `bootstrap`, with all variables resolved, never committed
 - `.config/${process.env.STAGE}.api.override.yaml`
   - strictly manually created, never committed

Locally, the `local` and `test` STAGE is used by default.

### Validation

Each module should validate the configuration at boot. For this purpose, a `~common/config` module is available that
can be used to extract the configuration and validate it. General purpose validation is in `~common/validate`.

## Providers

All providers should inject into the `bootstrap` scripts:

```bash
yarn bootstrap --stage myapp-dev
```

_For alternative setups, not described below, stick to the core principles described above._

### AWS ECS

By default, we use [ecs-deploy-cli](https://github.com/poviolabs/ecs-deploy-cli) to deploy to AWS ECS. The configuration
is defined in `.config/${process.env.STAGE}.ecs-deploy.yaml` - this includes:

- environment variables generation at boot, that can be sourced from AWS Secrets Manager or SSM
- ECS task definition generation, that is based of a base task definition (defined in SSM)
- Dockerfile build and push to ECR

```bash
yarn ecs-deploy build api --stage myapp-dev
yarn ecs-deploy deploy api --stage myapp-dev
yarn ecs-deploy bootstrap --stage myapp-dev
```



