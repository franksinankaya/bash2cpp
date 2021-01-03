#!/bin/bash

echo "$PWD"
LOG_DIR="$PWD/gen"
cd "$LOG_DIR"
echo "LOG_DIR=$LOG_DIR"
echo "PWD=$PWD"
if [ "$PWD" == "$LOG_DIR" ];
then
 echo "directory changed to $LOG_DIR"
 cd ..
else
 echo "Can't change to $LOG_DIR vs. $PWD ."
 cd ..
fi
