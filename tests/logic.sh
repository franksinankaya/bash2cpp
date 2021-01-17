echo "Testing \"0\""
if [ 0 ] # zero
then
 echo "0 is true."
else # Or else ...
 echo "0 is false."
fi # 0 is true.

if [ 1 ] # one
then
 echo "1 is true."
else
 echo "1 is false."
fi # 1 is true.

if [ -1 ] # minus one
then
 echo "-1 is true."
else
 echo "-1 is false."
fi # -1 is true.

if [ ] # NULL (empty condition)
then
 echo "NULL is true."
else
 echo "NULL is false."
fi # NULL is false.

if [ xyz ] # string
then
 echo "Random string is true."
else
 echo "Random string is false."
fi # Random string is true.

if [ $xyz ] # Tests if $xyz is null, but...
# it's only an uninitialized variable.
then
 echo "Uninitialized variable is true."
else
 echo "Uninitialized variable is false."
fi # Uninitialized variable is false.


if [ -n "$xyz" ] # More pedantically correct.
then
 echo "Uninitialized variable is true."
else
 echo "Uninitialized variable is false."
fi # Uninitialized variable is false.

if [ "true" ] # It seems that "false" is just a string ...
then
 echo "\"true\" is true." #+ and it tests true.
else
 echo "\"true\" is false."
fi # "false" is true.

if [ "false" ] # It seems that "false" is just a string ...
then
 echo "\"false\" is true." #+ and it tests true.
else
 echo "\"false\" is false."
fi # "false" is true.


if [ "$false" ]
then
 echo "\"\$false\" is true."
else
 echo "\"\$false\" is false."
fi # "$false" is false.
# Now, we get the expected result.
