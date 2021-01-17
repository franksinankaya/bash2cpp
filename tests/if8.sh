# -z option will test that string length is zero.
if [ -z "" ]; then
    echo "length of the string is zero"
fi

# -n option will test that string length is nonzero.
if [ -n "hoot" ]; then
    echo "length of the sting is nonzero"
fi

# ! option will negate boolean result.
if [ ! -z "hoot" ]; then
    echo "boolean expression is negated to true even string length check returns false"
fi

# -d option is used to test if file is a directory.
if [ -d . ]; then
    echo ". is a directory"
fi
