var_a="Hello World"
wh_domain='http://www.whitehouse.gov'
wh_path='/briefing-room/press-briefings?page='
wh_base_url="$wh_domain$wh_path"

echo my username is `whoami`

echo "$wh_base_url"
if [ "$wh_base_url" == "http://www.whitehouse.gov/briefing-room/press-briefings?page=" ]; then
	echo "wh_base_url matched"
else
	echo "wh_base_url not matched"
fi

another_var=42
echo $var_a
echo "$var_a$another_var"

if [ "$var_a$another_var" != "Hello World42" ]; then
	echo "string match"
else
	echo "no match"
fi

# curl -so 10.html "$wh_base_url=10"
# curl -so 20.html "$wh_base_url=20"
# curl -so 30.html "$wh_base_url=30"
BASE_BOT='R2'

var3=$V3
str="Hello, $name"

echo hello
echo my username is `whoami`

var1=21 var2=22 var3=$V3
# echo
echo "var1=$var1 var2=$var2 var3=$var3"


var_a="Hello World"
another_var=42
echo $var_a
echo "$var_a$another_var"


string1="Linux"
string2="Hint"
echo "$string1$string2"
string3=$string1+$string2
