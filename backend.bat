@echo off
cls
set phpDir=C:\Users\msn\PhpstormProjects\php8.3.9
set currDir=%~dp0
set src=%currDir%\src\_php\src
set dst=%currDir%\dist\nightrep\browser\backend
xcopy %src% %dst% /E /I /Y /Q > nul
xcopy %currDir%\src\build-replacements\_php\config\apps %dst%\config\apps /E /I /Y /Q > nul
%phpDir%\php.exe -S localhost:80 -t %dst%
