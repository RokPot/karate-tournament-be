# Architecture

## General folder structure

The general structure builds on NestJS standards and promotes reusability between projects.

```yml

# All the buildable code of the application
src:

    # The main module(s) of the application that configures and combines modules together, exposes the API,
    #  and is the entry point of the application.
    main.ts:
    app.module.ts:
    worker.module.ts:

    # The glue of the application, where all the common utilities and services are defined
    #  and imported to all the other modules. These do not expose an API or similar interface.
    # They can import `~vendors`.
    common:

        # App settings, configuration, and shared helpers for the whole codebase
        core:
              # Global configuration for the application, used in health-checks
              core.config.ts:

        # Http adapters
        http:
              # OpenAPI documentation (Swagger)
              openapi:

              # Health check endpoint
              health:

        # Configuration module for validation and loading of environment variables
        # See ./02_Config.md
        config:

        # Observability, Logging, metrics and tracing
        # See ./05_Observability.md
        logging:

        # Object validation and sanitization.
        validation:


    # Project specific modules that define the API and the business logic of the application
    # They can import `~common` and `~vendors`.
    modules:
        # A module that logically groups part of the app
        [module]:


    # Shared libraries with their own development cycle and versioning
    # A vendor can import other `~vendors` but not anything outside `~vendors`.
    # See ./03_Vendors.md
    vendors:
        [vendor]:
            CHANGELOG.md:
            index.ts:


# End-to-end tests using the application as a black box
test:
    # todo, test config layout

    # Module specific tests
    [module]:


# Documentation
docs:
    # Module specific documentation
    [module]:

    # Guidelines and best practices carried over from the NestJS template
    template:


# Executable scripts used in the project lifecycle
scripts:

# Files that are not part of the source code but are used in the project lifecycle including production
resources:

# Build and deploy tools
tools:

# Configuration and Environment variables
# AWS specific, see ./02_Config.md
.config:
    # Deployment and env prep definitions
    '[STAGE].ecs-deploy.yml':
    # Configuration
    '[STAGE].api.template.yml': # template for configuration
    '[STAGE].api.resolved.yml': # generated at boot
    '[STAGE].api.override.yml': # local override

```


## Monolith structure (using Clean Architecture)

todo

## Microservices structure

Microservices loosely follow the General structure but modules:

  - can **not** import/use shared `~database` infrastructure
  - can **not** import other modules directly, they must use a service discovery mechanism to bind them

See https://docs.nestjs.com/microservices/basics for more information
