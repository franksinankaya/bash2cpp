RANDOM_SEED_FILE="tests/random-seed"
( date +%s.%N; [ -f "$RANDOM_SEED_FILE" ] && cat "$RANDOM_SEED_FILE" )
