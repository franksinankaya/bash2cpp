if [ -n "$v" ]
# Test whether command-line argument is present (non-empty).
then
 echo "variable not defined"
else
 echo "variable defined"
fi 

n=10
if [ $n -lt 10 ];
then
echo "It is a one digit number"
else
echo "It is a two digit number"
fi

n=101
if [ $n -eq 101 ];
then
echo "You got 1st prize"
elif [ $n -eq 510 ];
then
echo "You got 2nd prize"
elif [ $n -eq 999 ];
then
echo "You got 3rd prize"
else
echo "Sorry, try for the next time"
fi

n=510
if [ $n -eq 101 ];
then
echo "You got 1st prize"
elif [ $n -eq 510 ];
then
echo "You got 2nd prize"
elif [ $n -eq 999 ];
then
echo "You got 3rd prize"
else
echo "Sorry, try for the next time"
fi

n=999
if [ $n -eq 101 ];
then
echo "You got 1st prize"
elif [ $n -eq 510 ];
then
echo "You got 2nd prize"
elif [ $n -eq 999 ];
then
echo "You got 3rd prize"
else
echo "Sorry, try for the next time"
fi

n=0
if [ $n -eq 101 ];
then
echo "You got 1st prize"
elif [ $n -eq 510 ];
then
echo "You got 2nd prize"
elif [ $n -eq 999 ];
then
echo "You got 3rd prize"
else
echo "Sorry, try for the next time"
fi

if ! wget -q --spider --tries=10 --timeout=20 google.com
then
  echo 'Sorry you are Offline'
else
  echo "you are online"
fi

VAR=''
# if [ -z ${VAR+x} ]; 
# then 
  # echo "CHECK 1: variable 'VAR' is unset"; 
# else 
  # echo "CHECK 1: variable 'VAR' is set, its content is '$VAR'"; 
# fi

ROOT_UID=0
if [ "$UID" -ne "$ROOT_UID" ];
then
 echo "Must be root to run this script."
fi

file=/etc/passwd
if [[ -e $file ]]
then
 echo "Password file exists."
fi


if [ $xyz ] # Tests if $xyz is null, but...
# it's only an uninitialized variable.
then
 echo "Uninitialized variable is true."
else
 echo "Uninitialized variable is false."
fi # Uninitialized variable is false.

if [ ] # zero
then
 echo "empty is true."
else # Or else ...
 echo "empty is false."
fi # empty is false.

if [ 0 ] # zero
then
 echo "0 is true."
else # Or else ...
 echo "0 is false."
fi # 0 is true.

if [ "" ] # zero
then
 echo "0 is true."
else # Or else ...
 echo "0 is false."
fi # 0 is true.

if [ -n "$xyz" ] # More pedantically correct.
then
 echo "Uninitialized variable is true."
else
 echo "Uninitialized variable is false."
fi # Uninitialized variable is false.

if [ "true" ] # It seems that "false" is just a string ...
then
 echo "true is true." #+ and it tests true.
else
 echo "true is false."
fi # "false" is true.

if [ "$UID" -eq "$ROOT_UID" ]
then
echo "You are root."
else
echo "You are not root"
fi

num=0
if [[ $num -gt 10 ]]
then
echo "Number is greater than 10."
elif [[ $num -eq 10 ]]
then
echo "Number is equal to 10."
else
echo "Number is less than 10."
fi

num=11
if [[ $num -gt 10 ]]
then
echo "Number is greater than 10."
elif [[ $num -eq 10 ]]
then
echo "Number is equal to 10."
else
echo "Number is less than 10."
fi

num=10
if [[ $num -gt 10 ]]
then
echo "Number is greater than 10."
elif [[ $num -eq 10 ]]
then
echo "Number is equal to 10."
else
echo "Number is less than 10."
fi

n=15
if [[ $n -eq 15 || $n -eq 45 ]]
then
echo "You won"
else
echo "You lost!"
fi

n=45
if [[ $n -eq 15 || $n -eq 45 ]]
then
echo "You won"
else
echo "You lost!"
fi

n=30
if [[ $n -eq 15 || $n -eq 45 ]]
then
echo "You won"
else
echo "You lost!"
fi

filename="app.js"
if [ -f "$filename" ]; then
echo "File exists"
else
echo "File does not exist"
fi

filename="app.js1"
if [ -f "$filename" ]; then
echo "File exists"
else
echo "File does not exist"
fi

ndir="gen"
if [ -d "$ndir" ]
then
	echo "Directory exist"	
else
	echo "Directory does not exit"
fi

ndir="gen1"
if [ -d "$ndir" ]
then
	echo "Directory exist"	
else
	echo "Directory does not exit"
fi
