((sum=25+35))
echo $sum

(( b += 3 ))
echo $b
(( b = b + 1 ))
echo $b

echo $(( 20 + 5 ))
echo $(( 20 - 5 ))
echo $(( 20 / 5 ))
echo $(( 20 * 5 ))
echo $(( 20 % 3 ))
x=5
# echo $(( x++ ))
echo $x
# echo $(( x++ ))

x=5
# echo $(( x-- ))
x=2
y=3
# echo $(( x ** y ))
a=$(( 4 - 5 ))
a=$(( 4 / 5 ))
a=$(( 4 * 5 ))
a=$(( 4 + 5 ))
echo $a # 9
a=$((3+5))

echo $a # 8
b=$(( a + 3 ))
echo $b # 11
b=$(( $a + 4 ))
echo $b # 12
(( b++ ))
echo $b # 13
(( b += 3 ))
echo $b # 16
a=$(( 4 * 5 ))
echo $a # 20

value=$(echo "$a")
value=$(echo "$a")
value=$(echo "$a")
value=$(echo "$a")
value=$(echo $a)
value=$(echo 4)

b=$(( $a + 4 ))
a=$(( 4 + 5 ))

