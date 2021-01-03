echo "Hello world and good day." | cut -d " " -f 1    #Result: Hello
echo "Hello-world-and-good-day." | cut -d "-" -f 2    #Result: world

echo "Hello" | tr 'el' 'x'    #Result: Hxxxo
echo "Hello" | tr 'el' 'ay'   #Result: Hayyo

echo "Hello" | tr '[:lower:]' '[:upper:]'   #Result: HELLO
echo "Hello" | tr '[:upper:]' '[:lower:]'   #Result: hello

echo "Hello" | tr -d "el" #Result: Ho

echo "The quick brown fox" | sed 's/brown/red/' #Result: The quick red fox

echo "Hello, hello, hello" | sed 's/hello/goodbye/' #Result: Hello, goodbye, hello