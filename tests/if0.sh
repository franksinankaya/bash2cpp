VAR="variable"

# variables can also be used within the
# conditional statements.
case "variable" in

  $VAR)
    echo "You should see this text!"
    ;;

  *)
    echo "You should NOT see this text!"
    ;;

esac

# this conditional tests that the given variable
# is not an empty string.
if [ ! -z $VAR ]; then    # the -z stands for zero, as in zero content.

  echo "You should see this text!"

else

  echo "You should NOT see this text!"

fi


if [ ! -e /proc ]; then
	mount -t proc proc /proc
	echo "proc not mounted"
else
	echo "proc already mounted"
fi


count=100

if [ $count -eq 100 ];
then 
	echo "Count is $count"
fi

count=120

if [ $count -eq 100 ]
then
  echo "Count is 100"
else
  if [ $count -gt 100 ]
  then
    echo "Count is greater than 100"
  else
  echo "Count is less than 100"
  fi
fi

count=12

if [ $count -eq 100 ]
then
  echo "Count is 100"
elif [ $count -gt 100 ]
then
  echo "Count is greater than 100"
else
  echo "Count is less than 100"
fi

aNumber="2"
if [ $aNumber -lt 3 ]
then
 echo "$aNumber is less than 3"
else
 echo "$aNumber is greater than or equal to 3"
fi

aNumber="4"
if (($aNumber < 3))
then
 echo "$aNumber is less than 3"
else
 echo "$aNumber is greater than or equal to 3"
fi


VAR="variable"

# In each of the statements below, note the space between
# the 'if' and the '[' as well as the space before the ']'
# this spacing is REQUIRED!

# verify that $VAR equals 'variable'
if [ $VAR == "variable" ]
then

  echo "You should see this text!"

fi

# this is the same IF statement.
# The comma after the ']' is usee to separate the conditional from
# the 'then' keyword, which is ecpected to be on a different line.
if [ $VAR == "variable" ]; then

  echo "You should see this text!"

fi

# Also, if no operation is to be performed, a placeholder
# must be used, otherwise an exception will be thrown.
if [ $VAR == "variable" ]; then
  :
fi


# -------------------------------------


# an ELSE statement can be added as well.
if [ $VAR == "variable" ]; then

  echo "You should see this text!"

else

  echo "You should NOT see this text!"

fi


# -------------------------------------


# inequality can be tested as such.
if [ $VAR != "variable" ]; then

  echo "You should NOT see this text!"

else

  echo "You should see this text!"

fi


# -------------------------------------


# Special flags can also be used. For example,
# this conditional tests that the given variable
# is an empty string.
if [ -z $VAR ]; then    # the -z stands for zero, as in zero content.

  echo "You should NOT see this text!"

else

  echo "You should see this text!"

fi

# this conditional tests that the given variable
# is a file and actually exists.
if [ -e $VAR ]; then    # the -e stands for EXISTS..

  echo "You should NOT see this text!"

else

  echo "You should see this text!"

fi

# this conditional tests that the given variable
# is a directory and actually exists.
if [ -d $VAR ]; then    # the -e stands for EXISTS..

  echo "You should NOT see this text!"

else

  echo "You should see this text!"

fi


# -------------------------------------


# this conditional tests that the given variable
# is not an empty string.
if [ ! -z $VAR ]; then    # the -z stands for zero, as in zero content.

  echo "You should see this text!"

else

  echo "You should NOT see this text!"

fi


# -------------------------------------


# conditionals can also be expressed in the form
# of 'case' statements, much like the switch-case
# statements used in many programming languages.

# note that each condition ends in ';;'. This is
# the equivalent of a 'break' statement, as used
# in other programming languages like C, Java, etc.

echo "$VAR"

case "$VAR" in

  "var")
    echo "You should NOT see this text!"
    ;;

  "value")
    echo "You should NOT see this text!"
    ;;

  "variable")
    echo "You should see this text!"
    ;;

esac

exit 0

# also, see that the quotes around each
# string condition are optional.

# additionally, a default catch-all condition can
# be added for situations where none of the explict
# conditions meet the expected conditions.

case "$VAR" in

  var)
    echo "You should NOT see this text!"
    ;;

  value)
    echo "You should NOT see this text!"
    ;;

  *)
    echo "You should see this text!"
    ;;

esac

# variables can also be used within the
# conditional statements.
case "variable" in

  $VAR)
    echo "You should see this text!"
    ;;

  *)
    echo "You should NOT see this text!"
    ;;

esac

# as with 'if' statements, blocks can be used
# in cases where no operation is to be executed.
case "$VAR" in

  *)
    :

esac
