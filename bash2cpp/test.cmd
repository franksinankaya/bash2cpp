@echo off

REM node app.js tests/arithmetic.sh gen/arithmetic.c > gen/arithmetic.log

REM call :validate "test"
REM call :validate "arithmetic"
call :validate "variables"

exit /b 0

:Validate
set test=%~1
node app.js tests/%test%.sh gen/%test%.c > gen/%test%.log
wsl gcc gen/%test%.c -o gen/%test%

EXIT /B 0
