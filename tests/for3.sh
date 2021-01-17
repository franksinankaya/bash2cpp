for flag in `awk -v dir=$dir '{ if ($2 == dir) { print "FOUND"; split($4,FLAGS,",") } }; \
	END { for (f in FLAGS) print FLAGS[f] }' < /proc/mounts`; do
	[ "$flag" = "FOUND" ] && partition="read-write"
	[ "$flag" = "ro" ] && { partition="read-only"; break; }
done 
