#!/usr/bin/python3
import sys
import os
import time
import subprocess
import argparse

def get_params():
    parser = argparse.ArgumentParser()
    parser.add_argument("-e", "--exectests", action='store_true', 
                        help="run build and exec tests only")
    parser.add_argument("-b", "--buildtests", action='store_true',
                        help="run build tests only")
    parser.add_argument("-O0", "--reduceoptimization", action='store_true',
                        help="reduce optimization level")
    parser.add_argument("-p", "--enableprofiling", action='store_true',
                        help="enable profiling")
    parser.add_argument("-n", '--repeattests', type=int,
                        help='repeat test')
    parser.add_argument('vars', nargs='*')
    params, unknown = parser.parse_known_args()
    return params, unknown 

params, unknown = get_params()
vars = params.vars
if unknown is not None:
    for u in unknown:
        vars.append(u)

repeat=0
profile=0
runmeasuretestonly=0
runbuildtestonly=0
opt="-O3"

if params.repeattests:
    repeat=params.repeattests

if params.enableprofiling:
    profile=params.enableprofiling

if params.reduceoptimization:
    opt="-O0 -g"

if params.exectests:
    runmeasuretestonly=params.exectests

if params.buildtests:
    runbuildtestonly=params.buildtests


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
"env3.sh",
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
        if testname and testname[0]!='' and i!=testname[0]:
            continue
        f=os.path.splitext(i)[0]
        cmd0="node app.js tests/" + i.split()[0] + " gen/" + f + ".cpp gen/" + f + ".log"
        list=convertlist(cmd0)
        out, result, err = execcommand(list)
        if result!=0:
            print(out)
            print(err)
            sys.exit(result)
        cmd1="g++ gen/" + f + ".cpp -o gen/" + f + " " + opt + " -ffunction-sections -fdata-sections -Wl,--gc-sections -flto  -lpcre -lpthread -std=c++17"
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
        cmd1="g++ gen/" + f + ".cpp -o gen/" + f + " " + opt + " -ffunction-sections -fdata-sections -Wl,--gc-sections -flto -lpcre -lpthread -std=c++17"
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
        if testname and testname[0]!='' and i!=testname[0]:
            continue
        if repeat:
            average0=0
            average1=0
            average2=0
            r=repeat
            name=""
            while r > 0:
                [name, elapsed_time0, elapsed_time1, delta,] = buildandexectestone(i)
                average0 = average0 + elapsed_time0
                average1 = average1 + elapsed_time1
                average2 = average2 + delta
                r=r-1
            print("==============================================================================================================")
            print("%-30s %-30s %-30s %-30s" % ("average:" + name, average0/repeat, average1/repeat, average2/repeat))
        else:
            buildandexectestone(i)

if runbuildtestonly:
	buildtest()
	sys.exit()

if runmeasuretestonly:
	buildandexectest(repeat, vars)
	sys.exit()

buildtest()
buildandexectest(repeat, vars)
