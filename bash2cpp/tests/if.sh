if LOGPATH=$(which logrotate); then
	$LOGPATH -f /etc/logrotate-dmesg.conf
else
	mv -f /var/log/dmesg /var/log/dmesg.old
fi


if [ -z "$HOSTNAME" -o "$HOSTNAME" = "(none)" -o ! -z "`echo $HOSTNAME | sed -n '/^[0-9]*\.[0-9].*/p'`" ] ; then
    echo "hello"
fi

if [ -z ${Var+x} ]; 
then 
  echo "CHECK 2: variable 'Var' is unset"; 
else 
  echo "CHECK 2: variable 'Var' is set, its content is '$Var'"; 
fi

# CHECK 1: variable ‘VAR’ is set, its content is ‘’
# CHECK 2: variable ‘Var’ is unset

# if LOGPATH=$(which logrotate); then
	$LOGPATH -f /etc/logrotate-dmesg.conf
# else
	mv -f /var/log/dmesg /var/log/dmesg.old
# fi

# if [[ ( $username == "admin" && $password == "secret" ) ]]; then
# echo "valid user"
# else
# echo "invalid user"
# fi


# echo "Enter any number"
# read n

# if [[ ( $n -eq 15 || $n  -eq 45 ) ]]
# then
# echo "You won the game"
# else
# echo "You lost the game"
# fi


# if [[ ( $num -lt 10 ) && ( $num%2 -eq 0 ) ]]; then
# echo "Even Number"
# else
# echo "Odd Number"
# fi


if cmp a b &> /dev/null # Suppress output.
then echo "Files a and b are identical."
else echo "Files a and b differ."
fi
##The very useful "if-grep" construct:
##-----------------------------------
if grep -q Bash file
 then echo "File contains at least one occurrence of Bash."
fi
word=Linux
letter_sequence=inu
if echo "$word" | grep -q "$letter_sequence"
##The "-q" option to grep suppresses output.
then
 echo "$letter_sequence found in $word"
else
 echo "$letter_sequence not found in $word"
fi
# if COMMAND_WHOSE_EXIT_STATUS_IS_0_UNLESS_ERROR_OCCURRED
 # then echo "Command succeeded."
 # else echo "Command failed."
# fi


# var1=5
# var2=4
# if (( var1 > var2 ))
# then #^ ^ Note: Not $var1, $var2. Why?
 # echo "$var1 is greater than $var2"
# fi # 5 is greater than 4
# exit 0

hostname -b -F /etc/hostname 2> /dev/null
if [ $? -eq 0 ]; then
	exit
fi


# if [ -z "$HOSTNAME" -o "$HOSTNAME" = "(none)" -o ! -z "`echo $HOSTNAME | sed -n '/^[0-9]*\.[0-9].*/p'`" ] ; then
	# hostname localhost
#fi 


read TIMESTAMP < "$TIMESTAMP_FILE"
if [ ${TIMESTAMP} -gt $SYSTEMDATE ]; then
	echo "hello"
fi

