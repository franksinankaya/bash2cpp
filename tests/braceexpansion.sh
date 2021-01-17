# Nesting.
# echo {A..Z}{0..9}

# Syntax: {<START>..<END>}

# Print numbers 1-100.
echo {1..100}

# Print range of floats.
# echo 1.{1..9}

# Print chars a-z.
echo {a..z}
echo {A..Z}


# Print zero-padded numbers.
# CAVEAT: bash 4+
# echo {01..100}

# Change increment amount.
# Syntax: {<START>..<END>..<INCREMENT>}
# CAVEAT: bash 4+
echo {1..10..2} # Increment by 2.
