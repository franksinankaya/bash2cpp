# INTRODUCTION
bash2cpp converts simple bash scripts to c++ code.
It requires c++17 for file IO and expects c++ code to run in Linux.
Though, with some effort Linux dependency can be removed but this is not
in radar at this moment.

Reasons why you may want to try bash2cpp are:
1. Faster execution time by using native binary as opposed to shell script.
2. Code obfiscuation to prevent modification.

bash2cpp is not a complete translator but does a good job for simple scripts.

# INSTALLATION
* git submodule init
* git submodule update
* cd bash2cpp
* cd bash2cpp/bashparser
* npm install --save-dev
* npm run build
* cd ..
* npm install --save-dev typescript
* npm install
* npm run build

# USAGE
* mkdir -p gen
* node app.js test.sh gen/test.cpp
* optional (beautify code)
	* astyle -q -n gen/%test.cpp
* if you have WSL
	* wsl g++ gen/test.cpp -o gen/test -lpcre -std=c++17 -g 
* if you are on linux
	* g++ gen/test.cpp -o gen/test -lpcre -std=c++17 -g

# IMPROVEMENT

run0 uses linux native binary
run1 uses bash script

<pre>
lower0.sh: run0 = 0.0140154361725 run1 = 0.0182049274445 diff=-0.004189491272 percent=-29.8919792466
upper0.sh: run0 = 0.012749671936 run1 = 0.0150246620178 diff=-0.0022749900818 percent=-17.8435185879
echo2.sh: run0 = 0.0164489746094 run1 = 0.0165512561798 diff=-0.0001022815704 percent=-0.621811224279
functions1.sh: run0 = 0.0168263912201 run1 = 0.0202934741974 diff=-0.0034670829773 percent=-20.6050301098
arguments.sh 1 2 3: run0 = 0.0136415958405 run1 = 0.0141408443451 diff=-0.0004992485046 percent=-3.65975147217
arguments.sh 1: run0 = 0.0130071640015 run1 = 0.0136947631836 diff=-0.0006875991821 percent=-5.28631131291
arguments.sh: run0 = 0.0135478973389 run1 = 0.0147869586945 diff=-0.0012390613556 percent=-9.14578347182
for2.sh: run0 = 0.0144755840302 run1 = 0.0177223682404 diff=-0.0032467842102 percent=-22.4293831836
tildaexpansion.sh: run0 = 0.0122911930084 run1 = 0.0157957077026 diff=-0.0035045146942 percent=-28.5124047097
echo1.sh: run0 = 0.0147280693054 run1 = 0.0197041034698 diff=-0.0049760341644 percent=-33.7860588596
redirection0.sh: run0 = 0.0345783233643 run1 = 0.0373227596283 diff=-0.002744436264 percent=-7.93686910463
while0.sh: run0 = 0.018049955368 run1 = 0.0152213573456 diff=0.0028285980224 percent=15.6709419205
for0.sh: run0 = 0.0391194820404 run1 = 0.0389342308044 diff=0.000185251236 percent=0.473552374259
braceexpansion.sh: run0 = 0.0169141292572 run1 = 0.018251657486 diff=-0.0013375282288 percent=-7.90775693186
redirection.sh: run0 = 0.0523011684418 run1 = 0.0503361225128 diff=0.001965045929 percent=3.75717405088
pipeline.sh: run0 = 0.0604181289673 run1 = 0.0462172031403 diff=0.014200925827 percent=23.5044117879
hostname0.sh: run0 = 0.0220210552216 run1 = 0.0239837169647 diff=-0.0019626617431 percent=-8.91265983101
if9.sh: run0 = 0.0242140293121 run1 = 0.0195469856262 diff=0.0046670436859 percent=19.2741308179
redirect.sh: run0 = 0.0451996326447 run1 = 0.0497801303864 diff=-0.0045804977417 percent=-10.133926923
while0.sh: run0 = 0.0175714492798 run1 = 0.0181803703308 diff=-0.000608921051 percent=-3.46540027122
if3.sh: run0 = 0.0138075351715 run1 = 0.0186288356781 diff=-0.0048213005066 percent=-34.9178940826
if0.sh: run0 = 0.0153212547302 run1 = 0.0154278278351 diff=-0.0001065731049 percent=-0.695589929002
case0.sh: run0 = 0.0127594470978 run1 = 0.0152704715729 diff=-0.0025110244751 percent=-19.6797279369
arithmetic.sh: run0 = 0.0226256847382 run1 = 0.0219755172729 diff=0.0006501674653 percent=2.87358138692
while.sh: run0 = 0.0164201259613 run1 = 0.0178897380829 diff=-0.0014696121216 percent=-8.95006606565
if8.sh: run0 = 0.015323638916 run1 = 0.0165522098541 diff=-0.0012285709381 percent=-8.0174881752
parameterexpansion.sh: run0 = 0.0136113166809 run1 = 0.0155839920044 diff=-0.0019726753235 percent=-14.4929059381
var1.sh: run0 = 0.0398073196411 run1 = 0.0424032211304 diff=-0.0025959014893 percent=-6.52116623954
var0.sh: run0 = 0.0146417617798 run1 = 0.0165762901306 diff=-0.0019345283508 percent=-13.2124014848
until.sh: run0 = 0.0147159099579 run1 = 0.0163896083832 diff=-0.0016736984253 percent=-11.3733940347
conditionals.sh: run0 = 0.01473736763 run1 = 0.0164484977722 diff=-0.0017111301422 percent=-11.6108262015
stringconcat.sh: run0 = 0.0185527801514 run1 = 0.0212399959564 diff=-0.002687215805 percent=-14.4841677801
if6.sh: run0 = 0.0233027935028 run1 = 0.0225877761841 diff=0.0007150173187 percent=3.06837598082
if5.sh: run0 = 0.0270199775696 run1 = 0.017284154892 diff=0.0097358226776 percent=36.0319421159
if4.sh: run0 = 0.0146927833557 run1 = 0.0172016620636 diff=-0.0025088787079 percent=-17.0755849805
if2.sh: run0 = 0.021769285202 run1 = 0.0248246192932 diff=-0.0030553340912 percent=-14.0350685052
if1.sh: run0 = 0.0122225284576 run1 = 0.0169756412506 diff=-0.004753112793 percent=-38.8881303037
</pre>

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
* regex string match in substring.sh does not work

## LOW PRIORITY
* supports only 11 arguments
* partial read support
* echo -n is assumed to be the first three characters
