RANDOM_SEED_FILE=./gen/random-seed
dd if=/dev/urandom of=$RANDOM_SEED_FILE count=1 \
			>/dev/null 2>&1 || echo "urandom start: failed." 

echo "urandom started"

rm ./gen/urandom

( date +%s.%N; [ -f "$RANDOM_SEED_FILE" ] && cat "$RANDOM_SEED_FILE" ) \
			>./gen/urandom

if [ -f "./gen/urandom" ]; then
	echo "./gen/urandom generated"
fi