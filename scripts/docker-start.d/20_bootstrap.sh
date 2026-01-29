#!/bin/bash

# set up environment (skip on Railway; config uses runtime ${env:VAR} from railway.api.template.yml)
if [ "${STAGE}" != "railway" ]; then
  ./scripts/execute.sh bootstrap
fi
