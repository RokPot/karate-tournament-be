#!/bin/bash

# start long running process
#  does not exit until process is stopped

export RUN_MODE=${RUN_MODE:="server"}

if [ "$RUN_MODE" == "worker" ]; then
    yarn start:worker:prod
else
    yarn start:prod  
fi
