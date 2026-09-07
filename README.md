# Karate App

Follow the instructions below to get started.

## Prerequisite

- Install [Node.JS](https://nodejs.org/en/download)
- Install [Yarn Package Manager](https://classic.yarnpkg.com/lang/en/docs/install)
- Install Docker
  - [Mac](https://docs.docker.com/desktop/setup/install/mac-install/)
  - [Windows](https://docs.docker.com/desktop/setup/install/mac-install/)
  - [Linux (Ubuntu)](https://docs.docker.com/desktop/setup/install/linux/ubuntu/)

## Local development

### 1. Packages

```bash
# Use the version of Node.js specified in the .nvmrc file
nvm use

# Set up package manager
corepack enable
```

### 2. Setup project
```bash
# Install project packages
yarn

# Start the dependent services in docker (PostgreSQL)
# This will start PostgreSQL and create the database automatically
docker compose -p tournament-app-be up -d

# Wait for PostgreSQL to be ready (usually takes 5-10 seconds)
# You can check with: docker compose -p tournament-app-be ps

# Stop services
docker compose -p tournament-app-be stop

# Stop and remove containers/volumes
docker compose -p tournament-app-be down -v
```

### 3. Setup database

> **Important**: The database must be running before starting the backend application.

The database is automatically created when you start Docker Compose. The default database name is `tournament-app`.

> [TypeORM Migration Overview](https://typeorm.io/migrations)

```bash
# Create a new migration
yarn migration:create src/database/migrations/MigrationName

# Generate a migration from entity changes
yarn migration:generate src/database/migrations/MigrationName

# Run pending migrations
yarn migration:run

# Revert the last migration
yarn migration:revert
```

**Note**: For local development, you can set `autoMigrate: true` in `.config/local.api.template.yml` to automatically run migrations on startup.

### 4. Build and Start

**Important**: Make sure PostgreSQL is running before starting the backend. If the database isn't available, the application will fail to start with a connection error.

```bash
# Verify PostgreSQL is running
docker compose -p tournament-app-be ps

# Start the application in watch mode for development
yarn start:dev
```

**Troubleshooting**: If you see database connection errors:
1. Ensure Docker Compose is running: `docker compose -p tournament-app-be ps`
2. Check PostgreSQL logs: `docker compose -p tournament-app-be logs postgres`
3. Verify the database name matches your config (default: `tournament-app`)
4. Wait a few seconds after starting Docker Compose for PostgreSQL to fully initialize

# Other

## Testing

### Initial Setup
Ensure PostgreSQL for tests is running. Database migrations run automatically if autoMigrate is enabled.

### Run tests

```bash
# Will run tests on all files that are *.unit.ts and *.e2e.ts
yarn test
```

## Contributing

```bash
# Lint and fix the project files
yarn lint:fix

# Commit changes using semantic commit messages
git commit -m "feat: my new feature"
```

## Documentation

```bash
# Generate Project Documentation
yarn docs
```

## Usage

### Swagger

Swagger API documentation can be accessed at route [/docs](http://localhost:3000/docs)

## OpenAPI codegen

Install package: `yarn add @povio/openapi-codegen-cli`

Add to package.json the following script: `"openapi:lint": "yarn openapi-codegen check --input http://localhost:3002/docs-json"`
Replace the port to the port where this project is running.

Run command `yarn openapi:lint`