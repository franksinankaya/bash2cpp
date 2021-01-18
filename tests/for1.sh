array=('klk' 'ioioi' 'tj')

for item in ${array[*]}; do
  echo ${item}
done

# Echo array
array=('klk' 'ioioi' 'tj')
for item in ${array[@]}; do
  echo ${item}
done
