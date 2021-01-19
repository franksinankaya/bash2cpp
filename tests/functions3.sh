in_func()
{
	echo "$1" "$2"
}

# Offline memory sections from ${1} to ${2}
# Return 0 on success and 1 on failure
func()
{
	for ((i = ${1}; i <= ${2}; i++)); do
		in_func ${1} $(($i - 1))
	done
}


func 1 10
