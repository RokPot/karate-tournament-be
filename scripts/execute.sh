#!/bin/bash

set -e

# move to parent directory of this script, if not already there
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [ "$(pwd)" != "$ROOT_DIR" ] ; then
  echo "> cd $ROOT_DIR"
  cd "$ROOT_DIR"
fi

# all arguments except the first one
ARGS="${@:2}"

execute_in_order() {
  # run all scripts in alphabetical order
  scripts=$(find "$1" -type f -maxdepth 1 -name "*.sh" -o -name "*.js" | sort)

  for script in $scripts; do
    echo ">> $script"
    if [ "${script##*.}" = "js" ]; then
      yarn node "$script" $ARGS
    else
      # execute the script, passing all arguments and allowing environment to be set
      . "$script" $ARGS
    fi
  done
}

## set up project STAGE/environment
# default to local stage
export STAGE="${STAGE:-local}"
# match --stage <stage>
if [[ "$*" =~ --stage\ ([^\b]+) ]]; then
  export STAGE="${BASH_REMATCH[1]}"
fi

case "$1" in

  bootstrap)
    execute_in_order "scripts/bootstrap.d"
    ;;

  build)
    ## run on package build
    ##  should not contain STAGE specific configurations

    # run all scripts in alphabetical order
    execute_in_order "scripts/build.d"
    ;;

  docker-install)
    ## run on docker install
    ##  should not contain STAGE specific configurations

    # run all scripts in alphabetical order
    execute_in_order "scripts/docker-install.d"
    ;;

  docker-start)
    ## run on docker entrypoint
    ##  this is run each time the container is started

    # run pre-start scripts
    execute_in_order "scripts/docker-start.d"
    ;;

  test)
    export STAGE=test
    execute_in_order "scripts/test.d"
    ;;

  *)
    execute_in_order "scripts/$1.d"
    ;;
esac
