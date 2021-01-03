@echo off

REM terminates in app.ts
REM banner.sh

REM won't compile
REM checkroot.sh

REM terminates in app.ts
REM dmesg.sh

REM terminates in app.ts
REM functions

REM terminates in app.ts
REM hostname.sh

REM won't compile
REM logic.sh

REM won't parse
REM populate-volatile.sh

REM won't compile
REM read-only-rootfs-hook.sh

REM won't compile
REM urandom

IF NOT EXIST gen GOTO mkdir gen

for %%x in (
		mountnfs.sh
		umountnfs.sh
        while0.sh
        read.sh
        variables.sh
        redirection.sh
        functions.sh
        case.sh
        if7.sh
        if.sh
        for.sh
        alignment.sh
        bootmisc.sh
        checkfs.sh
        devpts.sh
        halt
        mountall.sh
        reboot
        rmnologin.sh
        save-rtc.sh
        sendsigs
        single
        sushell
        sysfs.sh
        umountfs
) do (
	if exist gen\%%~nx.cpp (
		del gen\%%~nx.cpp
	)
	node app.js tests/%%x gen/%%~nx.cpp
	if not exist gen\%%~nx.cpp (
		echo Error
		goto :eof
	)
	astyle -q -n gen/%%~nx.cpp
	echo "compiling gen/%%~nx.cpp"
	wsl g++ gen/%%~nx.cpp -o gen/%%~nx -lpcre -std=c++17
)
