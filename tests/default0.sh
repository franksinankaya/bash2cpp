######### testing + ###########
# If VAR is set, use STRING as its value.
echo "testing +"
other=1
echo ${other+default_value}
echo $other
echo ${othermy+default_value}
echo $othermy

# echo "testing ?"
# echo ${other4?default_value}

# echo "testing :?"
# echo ${other4:?default_value}

######### testing := ###########
# If VAR is empty or unset, set the value of VAR to STRING. 
server="s"
echo ${server:=localhost} 
server=""
echo ${server:=localhost} 

######### testing :+ ###########
# If VAR is not empty, use STRING as its value. 
default_value="def"
other=1
echo ${other:+default_value}
echo $other
other=""
echo ${other:+default_value}
echo $other

######### testing :- ###########
# If VAR is empty or unset, use STRING as its value.
echo "testing :-"
other=1
echo ${other:-default_value}
echo $other
other=""
echo ${other:-default_value}
echo $other

######### testing = ###########
# If VAR is unset, set the value of VAR to STRING.
echo ${unset=default_value}
echo $unset
unset=1
echo ${unset=default_value}

######### testing - ###########
# If VAR is unset, use STRING as its value.
echo "testing -"
other=1
echo ${other2-default_value}
echo $other2
other2="1"
echo ${other2-default_value}
echo $other2

######### testing = ###########
# If VAR is unset, set the value of VAR to STRING.
echo "testing ="
echo ${other3=default_value}
echo $other3
other3="1"
echo ${other3=default_value}
echo $other3

######### testing ? ###########
# Display an error if unset.
