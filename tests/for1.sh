array=('klk' 'ioioi' 'tj')

for item in ${array[*]}; do
  echo ${item}
done

# Echo array
array=('klk' 'ioioi' 'tj')
for item in ${array[@]}; do
  echo ${item}
done


# As mentioned in man bash:
# If the word is double-quoted, ${name[*]} expands to a single word
# with the value of each array member separated by the first character
# of the IFS special variable, and ${name[@]} expands each element of
# name to a separate word.

# Examples:

array=("1" "2" "3")
printf "'%s'\n" "${array[*]}"
# '1 2 3'
printf "'%s'\n" "${array[@]}"
# '1''2''3'
