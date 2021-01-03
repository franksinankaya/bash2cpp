decimal=15
octal=017 # = 15 (decimal)
hex=0x0f # = 15 (decimal)
if [ "$decimal" -eq "$octal" ]
then
 echo "$decimal equals $octal"
else
 echo "$decimal is not equal to $octal" # 15 is not equal to 017
fi # Doesn't evaluate within [ single brackets ]!
if [[ "$decimal" -eq "$octal" ]]
then
 echo "$decimal equals $octal" # 15 equals 017
else
 echo "$decimal is not equal to $octal"
fi # Evaluates within [[ double brackets ]]!
if [[ "$decimal" -eq "$hex" ]]
then
 echo "$decimal equals $hex" # 15 equals 0x0f
else
 echo "$decimal is not equal to $hex"
fi # [[ $hexadecimal ]] also evaluates!


if test ! -f /fastboot
then
	echo "file doesnot exist"
fi

if test -f /forcefsck
then
	force="-f"
else
	force=""
fi

echo $force

if test "$FSCKFIX"  = yes
then
fix="-y"
else
fix="-a"
fi

echo $fix
