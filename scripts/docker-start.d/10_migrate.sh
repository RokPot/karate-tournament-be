#!/bin/bash

# Run TypeORM migrations before starting the app.
# Uses compiled data source (dist/database/data-source.js) and env vars (e.g. DATABASE_URL on Railway).
if [ -d "dist/database/migrations" ]; then
  echo ">> Running database migrations..."
  node node_modules/typeorm/cli.js migration:run -d dist/database/data-source.js
else
  echo ">> No dist/database/migrations found, skipping migrations"
fi
