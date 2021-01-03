NUMBER_TWO=$(( 1 + 1 ))                         # addition

echo The Number Two: $NUMBER_TWO
NUMBER_SIX=$(( $NUMBER_TWO * 3 ))               # multiplication
NUMBER_THREE=$(( $NUMBER_SIX / 2 ))             # division
NUMBER_FOUR=$(( $NUMBER_SIX - $NUMBER_TWO ))    # subtraction
NUMBER_ONE=$(( $NUMBER_FOUR % $NUMBER_THREE ))  # modulo

echo The Number Six: $NUMBER_SIX
echo The Number Three: $NUMBER_THREE
echo The Number Four: $NUMBER_FOUR
echo The Number One: $NUMBER_ONE

# Initialize variables. Variable assigments cannot have spaces between '='.
greeting="Welcome"
user=$(whoami)
day=$(date +%A)

# Echo strings using variables.
echo "$greeting $user! Today is $day."

a="Hello"
b="world"

# echo $a", "$b"!"
echo "$a, $b!"
echo "${a}, ${b}!"

str=$a
# str+=", "
# str+=$b
# str+="!"
echo $str


# the output can also be assigned to another variable.
BASH_BIN=$( which bash )

# the which command returns the whole path for the given executable.
echo the bash binary is located at $BASH_BIN
# echo the bash binary is located at $( which bash )  # same output as above.

# you can even embed a command inside of another command.
# echo the bash binary is located at $( dirname $( which bash ) )

# VAR_ONE="value\n"    #
# VAR_TWO='value\n'
# VAR_THREE=value\\n

# command output can be piped to an inline string,
# just like a declared variable using $( ... )

# this line will inject the output of the printf command into the string.
# echo This is VAR_ONE: $( printf $VAR_ONE ), VAR_TWO: $( printf $VAR_TWO ), VAR_THREE: $( printf $VAR_THREE )


Year=`date +%Y`
Month=`date +%m`
Day=`date +%d`
Hour=`date +%H`
Minute=`date +%M`
Second=`date +%S`
echo `date`
# echo "Current Date is: $Day-$Month-$Year"
# echo "Current Time is: $Hour:$Minute:$Second"
