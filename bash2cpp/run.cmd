@echo off

REM terminates in app.ts
REM banner.sh

REM won't compile
REM logic.sh

REM won't parse
REM populate-volatile.sh
REM	checkroot.sh

IF NOT EXIST gen GOTO mkdir gen

for %%x in (
		urandom
		logic.sh
		read-only-rootfs-hook.sh
		hostname.sh
        if.sh
		functions
		dmesg.sh
		mountnfs.sh
		redirect.sh
		umountnfs.sh
        while0.sh
        read.sh
        variables.sh
        redirection.sh
        functions0.sh
        case.sh
        if7.sh
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
	wsl g++ gen/%%~nx.cpp -o gen/%%~nx -lpcre -std=c++17 -g
)
