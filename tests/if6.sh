if [ -e /sys ] && grep -q sysfs /proc/filesystems && ! [ -e /sys/class ]; then
	echo "mounting"
fi 

if grep -q sysfs /proc/filesystems; then
	echo "sysfs supported"
fi

if [ -e /sys ]; then
	echo "sysfs exists"
fi

if ! [ -e /sys/class ]; then
	echo "sysfs class not supported"
else
	echo "sysfs class supported"
fi

#
#	Mount /dev/pts if needed.
#
if ! grep -q devpts /proc/mounts
then
	echo "devpts not mounted"
else
	echo "devpts mounted"
fi
