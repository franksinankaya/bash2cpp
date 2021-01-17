string=01234567890abcdefgh
path=${string}ij

TEXT=scripting_for_phun
echo ${TEXT:10:3}
echo ${TEXT:10}

Str="Learn Bash Commands from UbuntuPit"
subStr=${Str:0:20}
echo $subStr

Str="Learn Linux from LinuxHint"
subStr=${Str:6:5}
echo $subStr

string=01234567890abcdefgh
echo ${string:7}
echo ${string:7:2}
echo ${string:7:-2}
echo ${string: -7}
echo ${string: -7:2}

path=${string}ij
echo $path
