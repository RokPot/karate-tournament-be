#!/bin/bash

if [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; then
  export NVM_DIR=$HOME/.nvm;
  . $NVM_DIR/nvm.sh;
fi

corepack enable
yarn
yarn build
