gprof $1 gmon.out > main.gprof
gprof2dot < main.gprof | dot -Tsvg -o output.svg
gprof -b $1 gmon.out > output.txt
