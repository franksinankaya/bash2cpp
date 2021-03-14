# INTRODUCTION

bash2cpp converts simple bash scripts to c++ code.
It requires c++17 for file IO and expects c++ code to run in Linux.
Code also uses boost::format for printf format specifier conversion.
Though, with some effort Linux dependency can be removed but this is not
in radar at this moment.


Reasons why you may want to try bash2cpp are:
1. Faster execution time by using native binary as opposed to shell script.
2. Code obfiscuation to prevent modification.

bash2cpp is not a complete translator but does a good job for simple scripts.

![CodeQL](https://github.com/franksinankaya/bash2cpp/workflows/CodeQL/badge.svg)

![Node.js CI](https://github.com/franksinankaya/bash2cpp/workflows/Node.js%20CI/badge.svg)

# REQUIREMENTS
<pre>
sudo apt-get install -y build-essential
sudo add-apt-repository ppa:ubuntu-toolchain-r/test
sudo apt update
sudo apt install gcc-9 g++-9
sudo update-alternatives \
--install /usr/bin/gcc gcc /usr/bin/gcc-9 100 \
--slave /usr/bin/gcc-ar gcc-ar /usr/bin/gcc-ar-9 \
--slave /usr/bin/gcc-ranlib gcc-ranlib /usr/bin/gcc-ranlib-9 \
--slave /usr/bin/gcov gcov /usr/bin/gcov-9
sudo update-alternatives \
--install /usr/bin/g++ g++ /usr/bin/g++-9 100
</pre>
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -

# INSTALLATION
* git clone https://github.com/franksinankaya/bash2cpp.git
* cd bash-parser
* git submodule init
* git submodule update
* npm install --save-dev
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
* Size and speed optimization
    * g++ gen/test.cpp -o gen/test -lpcre -std=c++17 -O3 -ffunction-sections -fdata-sections -Wl,--gc-sections -flto -g
# IMPROVEMENT

<pre>
test                           bash                           native c++                     delta
----------------------------------------------------------------------------------------------------
gen/for8                       0.00696563720703125            0.007452487945556641           6.532727621728838
gen/if10                       0.00515294075012207            0.004492282867431641           -14.70650674026112
gen/local                      0.006060123443603516           0.004212141036987305           -43.87275711779023
gen/default0                   0.007678508758544922           0.005669355392456055           -35.438832583371884
gen/functions3                 0.005850553512573242           0.004854679107666016           -20.513701993910225
gen/array0                     0.006394386291503906           0.004038572311401367           -58.332841371981814
gen/array                      0.006585597991943359           0.004456758499145508           -47.76654362595624
gen/for7                       0.007401227951049805           0.005717277526855469           -29.45371142618849
gen/for5                       0.007921695709228516           0.006716728210449219           -17.939798381371574
gen/for4                       0.007215738296508789           0.0057315826416015625          -25.89434276206323
gen/echo4                      0.006974697113037109           0.0045092105865478516          -54.67667741764924
gen/showsize                   0.017104625701904297           0.010923147201538086           -56.5906362545018
gen/upper                      0.006481170654296875           0.008647441864013672           25.05100634132892
gen/echo3                      0.007898569107055664           0.00489497184753418            -61.360868929910865
gen/lower0                     0.006561279296875              0.00459742546081543            -42.71638230565783
gen/upper0                     0.007020711898803711           0.0052280426025390625          -34.2894928858081
gen/echo2                      0.005777120590209961           0.004124164581298828           -40.07977800901838
gen/special                    0.006903886795043945           0.0061266422271728516          -12.686305794450714
gen/functions1                 0.010600566864013672           0.005499362945556641           -92.75990635567501
tests/arguments.sh 1 2 3       0.006421566009521484           0.006428956985473633           0.11496384201743
tests/arguments.sh 1           0.005584239959716797           0.004723072052001953           -18.233215547703182
gen/arguments                  0.007460594177246094           0.006247282028198242           -19.42144029309621
gen/for2                       0.008064746856689453           0.005383014678955078           -49.81840729914076
gen/tildaexpansion             0.007880449295043945           0.004729509353637695           -66.62297726470736
gen/echo1                      0.007907390594482422           0.00601649284362793            -31.428571428571427
gen/redirection0               0.032849788665771484           0.02049565315246582            -60.276856860350144
gen/while0                     0.015790462493896484           0.009736776351928711           -62.17341266926223
gen/for0                       0.0326693058013916             0.02129340171813965            -53.424550167392596
gen/braceexpansion             0.007658243179321289           0.005018949508666992           -52.586575459598116
gen/redirection                0.05733919143676758            0.038558006286621094           -48.70891147881576
gen/pipeline                   0.027769088745117188           0.027825117111206055           0.20135895875997156
gen/hostname0                  0.010652780532836914           0.008131980895996094           -30.99859270552363
gen/if9                        0.010847091674804688           0.008524656295776367           -27.243742133967277
gen/redirect                   0.047963857650756836           0.039482831954956055           -21.480287192864864
gen/while0                     0.00813913345336914            0.007466793060302734           -9.004406411648253
gen/if3                        0.009643316268920898           0.004790306091308594           -101.30897869798925
gen/if0                        0.0068531036376953125          0.006569385528564453           -4.318792189881687
gen/arithmetic                 0.015211105346679688           0.013452291488647461           -13.07445545256367
gen/while                      0.012174367904663086           0.009581327438354492           -27.063478239231593
gen/if8                        0.008812904357910156           0.00737762451171875            -19.454498448810757
gen/parameterexpansion         0.0075032711029052734          0.0065996646881103516          -13.691701889382609
gen/var1                       0.03267669677734375            0.013646364212036133           -139.45350035815994
gen/var0                       0.009110450744628906           0.006860971450805664           -32.786600410049694
gen/until                      0.006417751312255859           0.004626750946044922           -38.70967741935484
gen/conditionals               0.008281469345092773           0.007395267486572266           -11.9833644980334
gen/stringconcat               0.011516094207763672           0.007983922958374023           -44.24104876519246
gen/if6                        0.013627767562866211           0.009176015853881836           -48.51508301504404
gen/if5                        0.007302045822143555           0.0069348812103271484          -5.294461443256438
gen/if4                        0.005690336227416992           0.005149364471435547           -10.50560237058987
gen/if2                        0.03353404998779297            0.014903545379638672           -125.00719884818429
gen/if1                        0.008652687072753906           0.006560087203979492           -31.89896420134472
</pre>

# BUILD TESTS
* wsl ./test.sh

# TROUBLESHOOTING
If something doesn't work, simplify your shell script and convert one at a time.
Review missing functionality list.

# MISSING FUNCTIONALITY
## HIGH PRIORITY
* echo -e missing
* checkroot.sh: while loop read from #9 file descriptor
* checkroot.sh: exec descriptor handling
* handle :exit 0
* exec 0>&1
* variable.sh: dropping TIMESTAMP variables
* functions: parameter expansion inside awk string does not work
* if [[ ( $username == "admin" && $password == "secret" ) ]] does not work
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
