cat /proc/filesystems | tail -n 1

if ! cat /proc/filesystems | tail -n 1 ; then
	echo "sysfs not supported"
fi 

if ! cat /proc/filesystems | tail -n 1 | grep "^sysfs" ; then
	echo "sysfs not supported"
fi 

if cat /proc/filesystems | tail -n 1 | grep "btrfs" ; then
	echo "btrfs supported"
fi 