test() {
    local a=5
	echo $a

	local b
	b=4
}

b="bbb"
a=4
test
echo $a
echo $b
