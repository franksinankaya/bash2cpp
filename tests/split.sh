split() {
   # Usage: split "string" "delimiter"
   IFS=$'\n' read -d "" -ra arr <<< "${1//$2/$'\n'}"
   printf '%s\n' "${arr[@]}"
}

split "apples,oranges,pears,grapes" ","
# apples
# oranges
# pears
# grapes

split "1, 2, 3, 4, 5" ", "
# 1
# 2
# 3
# 4
# 5

# Multi char delimiters work too!
split "hello---world---my---name---is---john" "---"
# hello
# world
# my
# name
# is
# john