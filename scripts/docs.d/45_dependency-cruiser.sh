#!/bin/bash

# Examples
## dependency structure
##   --collapse "^(node_modules/(@[^/]+/[^/]+|[^/]+))"

yarn depcruise \
  -c ./scripts/docs.d/assets/.dependency-cruiser.js \
  --output-type mermaid \
  --exclude "^node_modules|^src/common|^src/modules/(admin)|^src/database|\.(dto|repository|types|constants|interface)\.ts|dtos/index.ts$" \
  --collapse "^src/(modules/[^/]+/[^/]+/)" \
  --ts-config './tsconfig.json' \
  -f ./docs/module-structure.mmd \
  src/main.ts


yarn depcruise \
  -c ./scripts/docs.d/assets/.dependency-cruiser.js \
  --output-type mermaid \
  --exclude "^node_modules|\.(e2e|unit|test|mock).ts|^src/common/(core|utils|config|validate|exceptions|logger)|\.(dto|repository|types|constants|interface)\.ts|^(path|fs|crypto)$|dtos/index.ts$" \
  --collapse "^src/(modules|common/(([^/]+)/providers/[^/]+|[^/]+)|database)" \
  --ts-config './tsconfig.json' \
  -f ./docs/common-structure.mmd \
  src/main.ts
