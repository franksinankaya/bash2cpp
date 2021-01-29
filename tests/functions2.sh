pidofproc () {

	# pidof output null when no program is running, so no "2>/dev/null".
	pid=`pidof $1`
	status=$?
	case $status in
	0)
		echo $pid
		return 0
		;;
	127)
		echo "ERROR: command pidof not found" >&2
		exit 127
		;;
	*)
		return $status
		;;
	esac
}

status() {
    local pid
    if [ "$#" = 0 ]; then
        echo "Usage: status {program}"
        return 1
    fi
    pid=`pidofproc $1`
    if [ -n "$pid" ]; then
        echo "$1 (pid $pid) is running..."
        return 0
    else
        echo "$1 is stopped"
    fi
    return 3
}

status python
