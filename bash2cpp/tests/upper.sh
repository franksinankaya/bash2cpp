upper() {
    # Usage: upper "string"
    printf '%s\n' "${1^^}"
}

upper "hello"
# HELLO

upper "HeLlO"
# HELLO

upper "HELLO"
# HELLO
