# INTRODUCTION

# BUILD TESTS
* run.cmd
* wsl ./test.sh

# MISSING FUNCTIONALITY
* local variable support missing
* echo -e missing
* echo -n is assumed to be the first three characters
* exec would call bash for local functions
* variadic arguments to functions
* dmesg.sh : exec("$LOGPATH -f /etc/logrotate-dmesg.conf");
* checkroot.sh: while loop read from #9 file descriptor
* checkroot.sh: exec descriptor handling
* handle :exit 0
* exec 0>&1
* supports only 11 arguments
* partial read support
* variable.sh: dropping TIMESTAMP variables
* redirections.sh: could be issues with /dev/null
* functions: parameter expansion inside awk string does not work
* if [[ ( $username == "admin" && $password == "secret" ) ]] does not work
* if (( var1 > var2 )) doesn't work
* pipeline issues: if echo "$word" | grep -q "$letter_sequence"
* if [ -z "$HOSTNAME" -o "$HOSTNAME" = "(none)" -o ! -z "`echo $HOSTNAME | sed -n '/^[0-9]*\.[0-9].*/p'`" ] ; then
* for (( ; ; ))
* for (( c=1; c<=5; c++ ))
* DB_AWS_ZONE=('us-east-2a' 'us-west-1a' 'eu-central-1a')  for zone in "${DB_AWS_ZONE[@]}"
* . /etc/default/rcS
* VALS=( 'five' 'four' 'three' 'two' 'one' ) for ITEM in "${VALS[@]}"; do
* ${other:-default_value}
* echo $(( x++ ))
* if [ -z ${VAR+x} ]; 
