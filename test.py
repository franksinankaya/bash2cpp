#!/usr/bin/python3
import sys
import os
import time
import subprocess

repeat=0
profile=0

def execcommand(cmd):
	list_files = subprocess.run(cmd, stdout=subprocess.PIPE)
	return list_files.stdout.decode('utf-8'), list_files.returncode, list_files.stderr

buildonly = [
"async.sh",
"9.1.sh",
"3.4.sh",
# "banner.sh",
"logic.sh",
# Object.doubleQuoting
# "populate-volatile.sh",
# terminates in ConvertBash.convertStdRedirects
# "checkroot.sh",
"9.9.sh",
# quote issue,
# "9.8.sh",
# quote problem,
# "9.7.sh",
# quote problem,
# "9.6.sh",
"9.5.sh",
# crashes,
# "9.4.sh",
"9.3.sh",
"9.2.sh",
"8.5.sh",
# parse problem,
# Cannot parse arithmetic expression "36#zz": Unexpected character '#' (1:
# "8.4.sh",
"8.3.sh",
#  TypeError: Cannot read property 'start' of undefined
# parse problem,
# "8.2.sh",
"8.1.sh",
"7.7.sh",
"7.6.sh",
"7.5.sh",
"7.4.sh",
# divide by zero,
# "7.3.sh",
"7.2.sh",
"7.1.sh",
"6.2.sh",
"6.1.sh",
# Cannot read property 'singleQuoting' of undefined
# parse problem,
# "5.3.sh",
# parse problem",
# Cannot read property 'singleQuoting' of undefined
# "5.2.sh",
# quote issues,
# "5.1.sh",
"4.7.sh",
"4.6.sh",
"4.5.sh",
"4.4.sh",
"4.3.sh",
"4.2.sh",
"4.1.sh",
"3.3.sh",
"3.2.sh",
"3.1.sh",
"2.1.sh",
"2.2.sh",
"2.3.sh",
"for3.sh",
"urandom",
"logic.sh",
"read-only-rootfs-hook.sh",
"hostname.sh",
"if.sh",
"functions",
"dmesg.sh",
"mountnfs.sh",
"redirect.sh",
"umountnfs.sh",
"while0.sh",
"read.sh",
"variables.sh",
"redirection.sh",
"functions0.sh",
"case.sh",
"if7.sh",
"for.sh",
"alignment.sh",
"bootmisc.sh",
"checkfs.sh",
"devpts.sh",
"halt",
"mountall.sh",
"reboot",
"rmnologin.sh",
"save-rtc.sh",
"sendsigs",
"single",
"sushell",
"sysfs.sh",
"umountfs"
]

buildandexec = [
# "4.1.sh",
# "3.3.sh",
"env.sh",
"pipeline0.sh",
"emptyvar.sh",
"for8.sh",
"if10.sh",
"local.sh",
"default0.sh",
"functions3.sh",
"array0.sh",
"array.sh",
"for7.sh",
"for5.sh",
"for4.sh",
"echo4.sh",
"showsize.sh",
"upper.sh",
"echo3.sh",
"functions2.sh",
"lower0.sh",
"upper0.sh",
#"catinput.sh",
#"substring.sh",
"echo2.sh",
"special.sh",
# "regex.sh",
# "split.sh",
# "dirname.sh",
# "replacement.sh",
"functions1.sh",
"arguments.sh 1 2 3",
"arguments.sh 1",
"arguments.sh",
"for2.sh",
"tildaexpansion.sh",
"echo1.sh",
"redirection0.sh",
"while0.sh",
"for0.sh",
"braceexpansion.sh",
"redirection.sh",
"pipeline.sh",
"hostname0.sh",
"if9.sh",
"redirect.sh",
"while0.sh",
"if3.sh",
# "expansions.sh",
# "for1.sh",
"if0.sh",
"case0.sh",
"arithmetic.sh",
"while.sh",
"if8.sh",
"parameterexpansion.sh",
"var1.sh",
"var0.sh",
"until.sh",
"conditionals.sh",
"stringconcat.sh",
"if6.sh",
"if5.sh",
"if4.sh",
"if2.sh",
"if1.sh"
       ]
 
os.makedirs("gen", exist_ok=True)

def convertlist(cmd):
    cmds=cmd.split()
    list = []
    for a in cmds:
        list.append(a)
    return list

def buildtest(testname=''):
    for i in buildonly:
        if testname!='' and i!=testname:
            continue
        f=os.path.splitext(i)[0]
        cmd0="node app.js tests/" + i.split()[0] + " gen/" + f + ".cpp gen/" + f + ".log"
        list=convertlist(cmd0)
        out, result, err = execcommand(list)
        if result!=0:
            print(out)
            print(err)
            sys.exit(result)
        cmd1="g++ gen/" + f + ".cpp -o gen/" + f + " " + opt + " -ffunction-sections -fdata-sections -Wl,--gc-sections -flto -fno-exceptions -lpcre -lpthread -std=c++17"
        if profile:
            cmd1 += " -pg"
        list=convertlist(cmd1)
        out0, result, err = execcommand(list)
        if result!=0:
            sys.exit(result)
        print("%-30s" % (f))

def buildandexectestone(i):
        f=os.path.splitext(i)[0]
        cmd0="node app.js tests/" + i.split()[0] + " gen/" + f + ".cpp gen/" + f + ".log"
        list=convertlist(cmd0)
        out, result, err = execcommand(list)
        if result!=0:
            sys.exit(result)
        cmd1="g++ gen/" + f + ".cpp -o gen/" + f + " " + opt + " -ffunction-sections -fdata-sections -Wl,--gc-sections -fno-exceptions -flto -lpcre -lpthread -std=c++17"
        if profile:
            cmd1 += " -pg"
        list=convertlist(cmd1)
        out0, result, err = execcommand(list)
        if result!=0:
            sys.exit(result)
        args=i.split()
        args.pop(0)
        l="tests/{}".format(i)
        if args:
            list = []
            list.append("bash")
            list.append(l.split()[0])
            for a in args:
               list.append(a)
            start_time = time.time()
            out0, result, err = execcommand(list)
        else:
            start_time = time.time()
            out0, result, err = execcommand(["bash", l])
        elapsed_time0 = time.time() - start_time
    
        if args:
            list = []
            list.append("gen/{}".format(os.path.splitext(i)[0]))
            for a in args:
               list.append(a)
            start_time = time.time()
            out1, result, err = execcommand(list)
        else:
            l="gen/{}".format(os.path.splitext(i)[0])
            start_time = time.time()
            out1, result, err = execcommand([l])
    
        elapsed_time1 = time.time() - start_time
        print("%-30s %-30s %-30s %-30s" % (l, elapsed_time0, elapsed_time1, ((elapsed_time1 - elapsed_time0) * 100) / elapsed_time1))
        if out0 != out1:
            text_file = open("out0.txt", "wt")
            text_file.write(out0)
            text_file.close()
            text_file = open("out1.txt", "wt")
            text_file.write(out1)
            text_file.close()
            print("{} failed".format(l))
            sys.exit(1)
        return (l, elapsed_time0, elapsed_time1, ((elapsed_time1 - elapsed_time0) * 100) / elapsed_time1)

def buildandexectest(repeat, testname=''):
    for i in buildandexec:
        if testname!='' and i!=testname:
            continue
        if repeat:
            while repeat:
                buildandexectestone(i)
        else:
            buildandexectestone(i)

opt="-O3"
runmeasuretest=0
runbuildtest=0
for a in sys.argv:
	if a == "-O0":
		opt="-g -O0"
	if a == "-n":
		repeat=1
	if a == "-p":
		profile=1
	if a == "-e":
		runmeasuretest=1
	if a == "-b":
		runbuildtest=1
	if a == "-h":
		print("test.py -n run the same test continuously")
		print("test.py -p enable profiling")
		print("test.py -e to run build and exec tests only")
		print("test.py -b to run build tests only")
		print("test.py -O0 to reduce optimization level")
		print("test.py -e -O0 for8.sh to run for8.sh with reduced optimization level")
		sys.exit(0)

if len(sys.argv) == 2:
	if runbuildtest:
		buildtest()
		sys.exit()

if len(sys.argv) > 2:
	if runbuildtest:
		buildtest(sys.argv[len(sys.argv) - 1])
		sys.exit()

if len(sys.argv) == 2:
	if runmeasuretest:
		buildandexectest(repeat)
		sys.exit()

if len(sys.argv) > 2:
	if runmeasuretest:
		buildandexectest(repeat, sys.argv[len(sys.argv) - 1])
		sys.exit()

buildtest()
buildandexectest(repeat)
