echo "foo $((42 * 42)) baz"
echo '$((42 * 42))'
echo="ciao mondo"
echo TEST=1
! echo run | echo cry
variable=$(echo \\`echo ciao\\`)
echo $variable
echo world

variable=$((42 + 43)) $ciao
echo $variable

echoword=$#
echoword=$@

(echo)
( ls )

TEST1=1 TEST2=2 echo world

until true; do sleep 1; done

ls $var > gen/res.txt

variable=$((42 + 43))
echo \'$((42 * 42))\'
echo "\\$(\\(42 * 42))"
variable=$((42 + 43)) $ciao
echo $((42 + 43))
variable=$((42 + 43))
echo world
echo \\\n\\\n\\\n\\\nthere

TEST=1 echo run
TEST=1

echo run && echo stop
echo run || echo cry
echo run | echo cry
! echo run | echo cry
echo TEST=1

TEST1=1 TEST2=2 echo world
echo; echo nls;
{ echo; ls; }
{ echo; ls; } > file.txt
echo world > file.txt < input.dat
{ echo; ls; } > file.txt < input.dat
echo;ls
echo&ls
echo && ls &
echo && ls & echo ciao


ls > file.txt
command foo --lol
ls 2> file.txt
( ls )
text=$(ls)
echo ${text:2:4}
echo ${!text*}
echo ${!text@}
echo ${text:2}
echo ${var/a/b}
echo ${var//a/b}
echo ${!text[*]}
echo ${!text[@]}
echo ${text^t}
echo ${text^^t}
echo ${text,t}
echo ${text,,t}
echo ${text^}
echo ${text^^}
echo ${text,}
echo ${text,,}
echo ${text@Q}
echo ${text@E}
echo ${text@P}
echo ${text@A}
echo ${text@a}
echo ${!text}


variable=$(echo ciao)
echo \'`echo ciao`\'
echo $(echo ciao)
echo `echo ciao`

variable=$(echo ciao)
variable=`echo ciao`
variable=$(echo \\`echo ciao\\`)
echo () { printf %s\\n "$*" ; }

for x in a b c; do echo $x; done
for x in; do echo $x; done
if true; then echo 1; fi
if true; then echo 1; else echo 2; fi
if true; then echo 1; elif false; then echo 3; else echo 2; fi

a=1 b=2 echo
echo
ls | grep *.js
echo 42 43

echo > 43
echo 2> 43
a=1 b=2 echo 42 43
until true || 1; do sleep 1;echo ciao; done
echo
(echo)
echo; echo ciao;
echo 42
echoword=${other}test
echo "\\$ciao"
echo "\\${ciao}"
echo foo ${other} bar baz
echo word${other}test
echo word${other}t$est
$other

echoword=$@
echoword=$*
echoword=$#
echoword=$?
echoword=$-
echoword=$$
echoword=$!
echoword=$0
default_value=1
value=2
# other=
# ${other:-default_value}
# ${other-default_value}
# ${#default_value}
# ${other:=default_value}
# ${other=default_value}
# ${other:=default$value}
# ${other:?default_value}
# ${other?default_value}
# ${other:+default_value}
# ${other+default_value}
# ${other%default$value}
# ${other#default$value}
# ${other%%default$value}
# ${other##default$value}

echo say ${other} plz
echo say "${other} plz"
echo
a=echo
echoword=$1ciao
echoword=${11}test
echoword=$1
echoword=$11