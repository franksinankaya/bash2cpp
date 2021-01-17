${VAR#PATTERN}	Remove shortest match of pattern from start of string.
${VAR##PATTERN}	Remove longest match of pattern from start of string.
${VAR%PATTERN}	Remove shortest match of pattern from end of string.
${VAR%%PATTERN}	Remove longest match of pattern from end of string.
${VAR/PATTERN/REPLACE}	Replace first match with string.
${VAR//PATTERN/REPLACE}	Replace all matches with string.
${VAR/PATTERN}	Remove first match.
${VAR//PATTERN}	Remove all matches.

${#VAR}	Length of var in characters.
${#ARR[@]}	Length of array in elements.
