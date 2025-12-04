#!/bin/bash

if [ "$SCRIPTS_TEMPORARY_SCAFFOLD" = true ]; then
  # this is a big package, so we remove it after we're done
  # it needs to be installed at run due to package resolution
  if [ "$SCRIPTS_TEMPORARY_SCAFFOLD_SWC" = true ]; then
    yarn remove @povio/scaffold @swc/register
  else
    yarn remove @povio/scaffold
  fi
fi
