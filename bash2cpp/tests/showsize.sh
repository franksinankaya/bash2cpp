DF="/bin/df -h"
AWK="/usr/bin/awk"

show_size() {
	used=$($DF "$1" | $AWK '/^\//{print $3}')
	total=$($DF "$1" | $AWK '/^\//{print $2}')
	echo ""$1": $used/$total used"
}

show_size /dev/sda
