#!/bin/bash

SCRIPTS_TEMPORARY_DEPENDENCY_CRUISER=false

# install dependency-cruiser
if ! yarn info dependency-cruiser > /dev/null; then
  yarn add -D dependency-cruiser@^16.6.0
  SCRIPTS_TEMPORARY_DEPENDENCY_CRUISER=true
fi

export SCRIPTS_TEMPORARY_DEPENDENCY_CRUISER
