# INTRODUCTION

# BUILD TESTS
* run.cmd
* wsl ./test.sh

# MISSING FUNCTIONALITY
## HIGH PRIORITY
* local variable support missing
* echo -e missing
* exec would call bash for local functions
* checkroot.sh: while loop read from #9 file descriptor
* checkroot.sh: exec descriptor handling
* handle :exit 0
* exec 0>&1
* variable.sh: dropping TIMESTAMP variables
* functions: parameter expansion inside awk string does not work
* if [[ ( $username == "admin" && $password == "secret" ) ]] does not work
* if (( var1 > var2 )) doesn't work
* nested pipes over 2 level not supported
* for (( ; ; ))
* for (( c=1; c<=5; c++ ))
* DB_AWS_ZONE=('us-east-2a' 'us-west-1a' 'eu-central-1a')  for zone in "${DB_AWS_ZONE[@]}"
* . /etc/default/rcS
* VALS=( 'five' 'four' 'three' 'two' 'one' ) for ITEM in "${VALS[@]}"; do
* ${other:-default_value}
* echo $(( x++ ))
* if [ -z ${VAR+x} ]; 
* dmesg -s 131072 > gen/dmesg  doesn't work
* echo {A..Z}{0..9} does not work
* echo 1.{1..9}

## LOW PRIORITY
* supports only 11 arguments
* partial read support
* echo -n is assumed to be the first three characters
