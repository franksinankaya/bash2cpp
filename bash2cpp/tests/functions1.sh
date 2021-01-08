testecho()
(
	time="/bin/date"
	d=$(${time})
	echo $d
	echo "hello world"
)

testecho

