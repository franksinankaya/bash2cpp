! [[ 0 -eq 1 || 1 -eq 1 ]] && echo yes || echo no

[[ ! 0 -eq 1 || 1 -eq 1 ]] && echo yes || echo no

! [[ 0 -eq 1 || 1 -eq 1 ]] && echo yes || echo no


[ "$ROOTFS_READ_ONLY" = "no" ] || echo 1
[ "$ROOTFS_READ_ONLY" = "no" ] && echo 0

[ -f /etc/default/urandom ] && . /etc/default/urandom

test -c /dev/urandom || echo 0

#
#	Create multiplexor device.
#
test -c /dev/ptmx || echo "ptmx device does not exist"

[ -x /sbin/swapon ] && echo "swap on is executable"
