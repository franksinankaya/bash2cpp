DF="/bin/df -h"
AWK="/usr/bin/awk"

show_size() {
	local used=$($DF "$1" | $AWK '/^\//{print $3}')
	local total=$($DF "$1" | $AWK '/^\//{print $2}')
	echo ""$1": $used/$total used"
}

show_size /dev/sda
