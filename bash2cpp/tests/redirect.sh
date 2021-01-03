RANDOM_SEED_FILE=./tests/random-seed
dd if=/dev/urandom of=$RANDOM_SEED_FILE count=1 \
			>/dev/null 2>&1 || echo "urandom start: failed." 

echo "urandom started"
