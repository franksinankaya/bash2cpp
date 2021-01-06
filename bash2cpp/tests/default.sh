Default Value
Parameter	What does it do?
${VAR:-STRING}	If VAR is empty or unset, use STRING as its value.
${VAR-STRING}	If VAR is unset, use STRING as its value.
${VAR:=STRING}	If VAR is empty or unset, set the value of VAR to STRING.
${VAR=STRING}	If VAR is unset, set the value of VAR to STRING.
${VAR:+STRING}	If VAR is not empty, use STRING as its value.
${VAR+STRING}	If VAR is set, use STRING as its value.
${VAR:?STRING}	Display an error if empty or unset.
${VAR?STRING}	Display an error if unset.
