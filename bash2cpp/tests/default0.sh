server=$1

# If VAR is empty or unset, set the value of VAR to STRING. 
echo ${server:=localhost} 

default_value="def"
other=1

# If VAR is not empty, use STRING as its value. 
echo ${other:+default_value}
