if ! cat /proc/filesystems | tail -n 1 | grep "^sysfs" >> /dev/null; then
	echo "sysfs not supported"
fi 