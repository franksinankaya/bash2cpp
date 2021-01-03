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

# for (( c=1; c<=5; c++ ))
# do  
   # echo "Welcome $c times"
# done

# for (( ; ; ))
# do
   # echo "infinite loops [ hit CTRL+C to stop]"
# done

# DB_AWS_ZONE=('us-east-2a' 'us-west-1a' 'eu-central-1a') 
# for zone in "${DB_AWS_ZONE[@]}"
# do
  # echo "Creating rds (DB) server in $zone, please wait ..."
# done

# for day in Mon Tue Wed Thu Fri
# do
 # echo "Weekday $((i++)) : $day"
# done

# FILES="file1
# /path/to/file2
# /etc/resolv.conf"
# for f in $FILES
# do
	# echo "Processing $f"
# done


# for (( counter=10; counter>0; counter-- ))
# do
# echo -n "$counter "
# done
# printf "\n"

# for (( counter=1; counter<=10; counter++ ))
# do
# echo -n "$counter "
# done

