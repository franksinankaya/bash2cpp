#!/bin/bash
input="./tests/fstab"
while read device mountpt fstype options
do
  echo "device=$device mountpt=$mountpt fstype=$fstype options=$options"
done < "$input"
