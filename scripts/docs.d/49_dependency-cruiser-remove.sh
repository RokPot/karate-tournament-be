#!/bin/bash

if [ "$SCRIPTS_TEMPORARY_DEPENDENCY_CRUISER" = true ]; then
  # this is a big package, so we remove it after we're done
  # it needs to be installed at run due to package resolution
  yarn remove dependency-cruiser
fi
