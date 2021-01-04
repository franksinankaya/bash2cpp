# bashconverter

BUILD TESTS
run.cmd
wsl ./test.sh

MISSING FUNCTIONALITY
1. local variable support missing
2. echo -e missing
3. echo -n is assumed to be the first three characters
4. exec would call bash for local functions
5. variadic arguments to functions
6. # on functions return parameter count
7. dmesg.sh : exec("$LOGPATH -f /etc/logrotate-dmesg.conf");
8. checkroot.sh: while loop read from #9 file descriptor
9. checkroot.sh: exec descriptor handling
10. handle :exit 0
11. exec 0>&1
12. supports only 11 arguments
13. partial read support
14. variable.sh: dropping TIMESTAMP variables
15. redirections.sh: could be issues with /dev/null
16. functions: parameter expansion inside awk string does not work
17. if [[ ( $username == "admin" && $password == "secret" ) ]] does not work
18. if (( var1 > var2 )) doesn't work
19. pipeline issues: if echo "$word" | grep -q "$letter_sequence"
20. if [ -z "$HOSTNAME" -o "$HOSTNAME" = "(none)" -o ! -z "`echo $HOSTNAME | sed -n '/^[0-9]*\.[0-9].*/p'`" ] ; then
21. for (( ; ; ))
22. for (( c=1; c<=5; c++ ))
23. DB_AWS_ZONE=('us-east-2a' 'us-west-1a' 'eu-central-1a')  for zone in "${DB_AWS_ZONE[@]}"
24. . /etc/default/rcS
25. VALS=( 'five' 'four' 'three' 'two' 'one' ) for ITEM in "${VALS[@]}"; do
26. # ${other:-default_value}
27. echo $(( x++ ))
28. if [ -z ${VAR+x} ]; 