# dmesg -s 131072 > gen/dmesg 

echo "Learning Laravel 5"> gen/book.txt
echo "Learning Laravel 6">> gen/book.txt

cat gen/book.txt

echo "hello world" > gen/messages
echo "hello world" > gen/wtmp

cat /dev/null > gen/messages
cat /dev/null > gen/wtmp

if [ -s gen/messages ];
then
	echo "gen/messages has content"
else
	echo "gen/messages empty"
fi

if [ -s gen/wtmp ];
then
	echo "gen/wtmp has content"
else
	echo "gen/wtmp empty"
fi
