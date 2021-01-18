# As mentioned in man bash:
# If the word is double-quoted, ${name[*]} expands to a single word
# with the value of each array member separated by the first character
# of the IFS special variable, and ${name[@]} expands each element of
# name to a separate word.

# Examples:

IFS=","
array=("1" "2" "3")
echo "${array[*]}"
# '1 2 3'
echo "${array[@]}"
# '1''2''3'

