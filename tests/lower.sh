lower() {
    # Usage: lower "string"
    printf '%s\n' "${1,,}"
}

lower "HELLO"
# hello

lower "HeLlO"
# hello

lower "hello"
# hello