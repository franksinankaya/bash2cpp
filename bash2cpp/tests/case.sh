case "$1" in
        start)
            start
            ;;
         
        stop)
            stop
            ;;
         
        status)
            status anacron
            ;;
        restart)
            stop
            start
            ;;
        condrestart)
            if test "x`pidof anacron`" != x; then
                stop
                start
            fi
            ;;
         
       *)
           echo "Usage: $0 {start|stop|restart|condrestart|status}"
           exit 1
 
esac

case "$1" in
	start|"")
		test "$VERBOSE" != no && echo "Initializing random number generator..."
		# Load and then save 512 bytes, which is the size of the entropy
		# pool. Also load the current date, in case the seed file is
		# empty.
		# ( date +%s.%N; [ -f "$RANDOM_SEED_FILE" ] && cat "$RANDOM_SEED_FILE" ) \
			# >/dev/urandom
		rm -f "$RANDOM_SEED_FILE"
		umask 077
		# dd if=/dev/urandom of=$RANDOM_SEED_FILE count=1 \
			# >/dev/null 2>&1 || echo "urandom start: failed."
		umask 022
		;;
	stop)
		# Carry a random seed from shut-down to start-up;
		# see documentation in linux/drivers/char/random.c
		test "$VERBOSE" != no && echo "Saving random seed..."
		umask 077
		# dd if=/dev/urandom of=$RANDOM_SEED_FILE count=1 \
			# >/dev/null 2>&1 || echo "urandom stop: failed."
		;;
	*)
		echo "Usage: urandom {start|stop}" >&2
		exit 1
		;;
esac


# echo "Enter your lucky number"
# read n
