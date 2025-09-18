@echo off
cls
rem netstat -ano | findstr :443
rem goto :EOF
rem set phpDir=C:\Users\msn\PhpstormProjects\php8.3.9
set currDir=%~dp0
set src=%currDir%src\_php\src
set dst=%currDir%dist\nightrep\browser\backend
xcopy %src% %dst% /E /I /Y /Q > nul
xcopy %currDir%\src\build-replacements\_php\config\apps %dst%\config\apps /E /I /Y /Q > nul
rem use xampp as backend server
set xamppDir=C:\xampp
set xamppHostFile=%xamppDir%\apache\conf\extra\httpd-vhosts.conf
echo ^<VirtualHost *:443^> > %xamppHostFile%
echo    DocumentRoot "%dst%" >> %xamppHostFile%
echo    ServerName localhost >> %xamppHostFile%
echo    SSLEngine on >> %xamppHostFile%
echo    SSLCertificateFile "C:/xampp/apache/conf/ssl.crt/server.crt" >> %xamppHostFile%
echo    SSLCertificateKeyFile "C:/xampp/apache/conf/ssl.key/server.key" >> %xamppHostFile%
echo    ^<Directory "%dst%"^> >> %xamppHostFile%
echo        Options Indexes FollowSymLinks >> %xamppHostFile%
echo        AllowOverride All >> %xamppHostFile%
echo        Require all granted >> %xamppHostFile%
echo    ^</Directory^> >> %xamppHostFile%
echo ^</VirtualHost^> >> %xamppHostFile%
cd %xamppDir%
rem start https://localhost/oauth.php?app=info
cmd /k apache_start.bat
rem start mysql_start.bat
rem use php as backend server
rem cmd /k %phpDir%\php-cgi.exe -S localhost:30020 -t %dst%

