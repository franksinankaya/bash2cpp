# INTRODUCTION
bash2cpp converts simple bash scripts to c++ code.
It requires c++17 for file IO and expects c++ code to run in Linux.
Though, with some effort Linux dependency can be removed but this is not
in radar at this moment.

Reasons why you may want to try bash2cpp are:
1. Faster execution time by using native binary as opposed to shell script.
2. Code obfiscuation to prevent modification.

bash2cpp is not a complete translator but does a good job for simple scripts.

# COMPILATION
* cd bash2cpp
* npm install --save-dev typescript
* npm install
* npm run build

# USAGE
* mkdir -p gen
* node app.js test.sh gen/test.cpp
* optional (beautify code)
** astyle -q -n gen/%test.cpp
* if you have WSL
** wsl g++ gen/test.cpp -o gen/test -lpcre -std=c++17 -g 
* if you are on linux
** g++ gen/test.cpp -o gen/test -lpcre -std=c++17 -g

# BUILD TESTS
* run.cmd
* wsl ./test.sh

# TROUBLESHOOTING
If something doesn't work, simplify your shell script and convert one at a time.
Review missing functionality list.

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
* if [ -z ${VAR+x} ]; 
* dmesg -s 131072 > gen/dmesg  doesn't work
* echo {A..Z}{0..9} does not work
* echo 1.{1..9}
* str+=", " doesn't work
* doesn't handle special characters well
* has problems with cat << __EOF__ .. __EOF__

## LOW PRIORITY
* supports only 11 arguments
* partial read support
* echo -n is assumed to be the first three characters
