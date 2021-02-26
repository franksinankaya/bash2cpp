test () {
	if ! cat tests/fstab >> /dev/null; then
		echo "cat tests"
		return 1
	fi
	return 0
}
test
echo $?

