valid=true
count=1
while [ $valid ]
do
echo $count
if [ $count -eq 5 ];
then
break
fi
((count++))
# count=$((count + 1))
done

a=0
b=5

while (( $a < $b ))
do
 echo $a
 a=$(( a + 1 ))
done


i=0

while [ $i -le 2 ]
do
echo Number: $i
# ((i++))
i=$((i + 1))
done

valid=true
count=1
while [ $valid ]
do
echo $count
if [ $count -eq 5 ];
then
break
fi
# ((count++))
count=$((count + 1))
done

# file='book.txt'
# while read line; do
# echo $line
# done < $file


n=1
while (( $n <= 5 ))
do 
echo "Welcome $n times."
	n=$(( n+1 ))	
done


n=2

while [ $n -le 5 ]
do
echo "Welcome $n times."
n=$((n+1))

done


b=8
while [ $b -lt 12 ]
do
echo "Welcome $b times."
b=$((b+1))
done
