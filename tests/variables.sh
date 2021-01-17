# !/bin/bash

seq 1 5
echo $(seq 1 5)
mkdir $(seq 1 5)
n=0
echo "n = $n" # n = 0

ROOTFS_READ_ONLY="yes"
ROOTFS_READ_ONLY=yes
value="sinan"

# https://linuxhint.com/30_bash_script_examples/
echo "Printing text with newline"
echo -n "Printing text without newline"
# echo -e "\nRemoving \t backslash \t characters\n"

val=$(greeting)
echo "Return value of the function is $val"


# echo "Wait command" &
# process_id=$!
# wait $process_id
# echo "Exited with status $?"

# subStr=$(echo $Str| cut -d ' ' -f 1-3)
# echo $subStr


LOG_DIR=/var/log
cd $LOG_DIR

# space=`df -h | awk '{print $5}' | grep % | grep -v Use | sort -n | tail -1 | cut -d "%" -f1 -`

HOSTNAME=$(/bin/hostname)


SYSTEMDATE=`date -u +%4Y%2m%2d%2H%2M%2S`
# format the timestamp as date expects it (2m2d2H2M4Y.2S)
TS_YR=${TIMESTAMP%??????????}
TS_SEC=${TIMESTAMP#????????????}
TS_FIRST12=${TIMESTAMP%??}
TS_MIDDLE8=${TS_FIRST12#????}
date -u ${TS_MIDDLE8}${TS_YR}.${TS_SEC}
test -x /etc/init.d/hwclock.sh && /etc/init.d/hwclock.sh stop
