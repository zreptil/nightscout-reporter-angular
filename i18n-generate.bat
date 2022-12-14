@echo off
cls
set deDExlf=src\locale\messages.de-DE.xlf
set enGBxlf=temp\en-GB\messages.en-GB.xlf
set unzip="%ProgramFiles%\WinRAR\winrar.exe" x
rd /s/q temp
md temp
%unzip% "nightrep (translations).zip" temp
copy %deDExlf% temp

rem call tsc tools/dev-localizer.ts 
echo compiling dev-localizer...
npx --package typescript tsc tools/dev-localizer.ts 
node tools/dev-localizer.js
