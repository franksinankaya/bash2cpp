if [ -r ${FOO} ]; then
   echo "foo exists 1"
fi

if [ -w ${FOO} ]; then
   echo "foo exists 1"
fi

if [ -b ${FOO} ]; then
   echo "foo exists 1"
fi

if [ -c ${FOO} ]; then
   echo "foo exists 2"
fi

if [ -x ${FOO} ]; then
   echo "foo exists 3"
fi

FOO=""
if [ -r ${FOO} ]; then
   echo "foo exists 1"
fi

if [ -w ${FOO} ]; then
   echo "foo exists 1"
fi

if [ -b ${FOO} ]; then
   echo "foo exists 1"
fi

if [ -c ${FOO} ]; then
   echo "foo exists 2"
fi

if [ -x ${FOO} ]; then
   echo "foo exists 3"
fi

