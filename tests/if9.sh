if [ -f /etc/hostname ];then
	echo "hostname `cat /etc/hostname`"
# elif [ -z "$HOSTNAME" -o "$HOSTNAME" = "(none)" -o ! -z "`echo $HOSTNAME | sed -n '/^[0-9]*\.[0-9].*/p'`" ] ; then
	# echo "hostname localhost"
fi 

if [ -f /etc/hostname ];then
	echo "hostname `cat /etc/hostname`"
elif [ -z "$HOSTNAME" -o "$HOSTNAME" = "(none)" -o ! -z "`echo $HOSTNAME`" ] ; then
	echo "hostname localhost"
fi 
