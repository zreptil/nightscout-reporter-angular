@echo off
cls
echo ------------------------------------------------------------
echo -- Diese Batch-Datei aktiviert die Schematics, die im
echo -- Projekt unter tools/schematics zur Verfuegung stehen.
echo --
echo -- Bitte eine Taste druecken, um das auszufuehren.
echo ------------------------------------------------------------
pause > nul
call npm run build
cd ..\..
call npm link tools\schematics
pause
