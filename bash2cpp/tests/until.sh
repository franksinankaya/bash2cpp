counter=0

until [ $counter -gt 5 ]
do
  echo Counter: $counter
  counter=$((counter + 1))
  # ((counter++))
done
