cd $1
echo $PWD
ls bash-parser
ls bash-parser/src
ls bash-parser/src/utils
mgb bash-parser/src/modes posix && mgb bash-parser/src/modes bash && mgb bash-parser/src/modes word-expansion
