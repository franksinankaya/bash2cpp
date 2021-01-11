PKGS="php7-openssl-7.3.19-r0  php7-common-7.3.19-r0  php7-fpm-7.3.19-r0  php7-opcache-7.3.19-r0 php7-7.3.19-r0"
for p in $PKGS
do
   echo "Installing $p package"
done

VALS="one two three four five"

# a simple For loop iterates with space separators.
for ITEM in $VALS
do

  echo "value: $ITEM"

done

users='2323dad sdad tj'
for user in ${users}; do
  echo ${user}
done


for ITEM in {10..1..-2}; do

  echo "count: $ITEM"

done

i=1
for day in Mon Tue Wed Thu Fri
do
 echo "Weekday $day"
done

for i in {a..z}
do 
echo $i
done 

for i in 1 2 3 4; do
    echo $i
done


for ITEM in {5..1}; do

  echo "count: $ITEM"

done


for ITEM in $VALS; do

  echo "value: $ITEM"

done

for i in $(seq 1 2 20)
do
   echo "Welcome $i times"
done

for i in {1..5}
do
   echo "Welcome $i times"
done


echo "Content of this directory:"
dir_content=$(ls)
for name in $dir_content; do
    echo $name
done

for f in *.ts; do echo "Processing $f file.."; done

for OUTPUT in $(ls)
do
	echo $OUTPUT
done

for f in tests/*.sh
do
	echo "Removing password for pdf file - $f"
done


# Loop current directory content which is received using ls command and then
# each line is echoed back to stdout.

# Parse error on line 92: Unexpected 'OPEN_PAREN'
# for (( counter=100; counter>=1; counter-- ));
# do 
# echo $counter
# done

# Parse error on line 92: Unexpected 'OPEN_PAREN'
# LIMIT=5
# for (( IDX = 1; IDX <= $LIMIT; IDX++ )); do
  # echo "count: $IDX"
# done


START=10
END=1
INCREMENT=-2

for ITEM in $( seq $START $INCREMENT $END ); do
  echo "count: $ITEM"
done


START=1
END=10

for ITEM in $( seq $START $END ); do
  echo "count: $ITEM"
done

# Parse error on line 92: Unexpected 'OPEN_PAREN'
# VALS=( 'five' 'four' 'three' 'two' 'one' )

# A For loop that iterates through a formal array. Note the [@] referend
# in ITEMS, this is represents *every* entry in the array, much like $@
# represents the entirety of the command line arguments. Also note that
# there can be no spaces between the array variable and the curly braces
# that surround it within the quotes.
# for ITEM in "${VALS[@]}"; do

  # echo "value: $ITEM"

# done

# bash prints on a single line
# weekdays="Mon Tue Wed Thu Fri"
# for day in "$weekdays"
# do
 # echo "Weekday $day"
# done


# Echo list with , deviced
list='2323dad,sdad,tj'
IFS=,
for item in ${list}; do
  echo ${item}
done

# Echo range numbers
for num in {1..10}; do
  echo ${num}
done
