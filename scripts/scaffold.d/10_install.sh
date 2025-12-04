#!/bin/bash

SCRIPTS_TEMPORARY_SCAFFOLD=false
SCRIPTS_TEMPORARY_SCAFFOLD_SWC=false

# install dependencies
if ! grep -q '"@povio/scaffold":' package.json; then

  if ! grep -q '"@swc/register":' package.json; then
    SCRIPTS_TEMPORARY_SCAFFOLD_SWC=true
  fi

  yarn add -D @povio/scaffold@^1.3.3 @swc/register
  SCRIPTS_TEMPORARY_SCAFFOLD=true
fi

export SCRIPTS_TEMPORARY_SCAFFOLD
export SCRIPTS_TEMPORARY_SCAFFOLD_SWC
