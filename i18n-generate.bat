@echo off
cls
set deDExlf=src\locale\messages.de-DE.xlf
set enGBxlf=temp\en-GB\messages.en-GB.xlf
set unzip="%ProgramFiles%\WinRAR\winrar.exe" e
rd /s/q temp
md temp
%unzip% "nightrep (translations).zip" temp
%unzip% "nightrep (english) (translations).zip" temp
copy %deDExlf% temp

rem call tsc tools/dev-localizer.ts 
echo compiling dev-localizer...
call npx --package typescript tsc tools/dev-localizer.ts 
call node tools/dev-localizer.js
pause