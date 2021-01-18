for day in Mon Tue Wed Thu Fri
do
 echo "Weekday : $day"
done

FILES=/path/to/*
for f in $FILES
do
  echo "Processing $f file..."
  ##take action on each file. $f store current file name
  echo $f
done

for file in /etc/*
do
	if [ "${file}" == "/etc/resolv.conf" ]
	then
		countNameservers=$(grep -c nameserver /etc/resolv.conf)
		echo "Total  ${countNameservers} nameservers defined in ${file}"
		break
	fi
done

for f in $(ls test/*.sh)
do
  print "File $f"
done

for i in 1 2 3 4 5
do
   echo "Welcome $i times"
done
