@echo off
cls
rem "i18n-extract-notworking": "ng xi18n --outFile=./src/locale/messages.de-DE.xlf --ivy",
rem "i18n-clear": "rd .\\dist\\out-i18n /s/q",
rem "i18n-extract": "npm run i18n-clear && node_modules\\.bin\\ngc -p tsconfig.i18n.json && node_modules\\.bin\\localize-extract -l de-DE -s ./dist/out-locl/**/*.js -f xlf -o src/locale/messages.de-DE.xlf",
rem "i18n-createJson": "tsc tools/dev-localizer.ts && node tools/dev-localizer.js",
rem "i18n": "npm run i18n-extract && npm run i18n-createJson",

rem call node_modules\\.bin\\ngc -p tsconfig.i18n.json 
rem call npx localize-extract --format=legacy-migrate --source=./dist/out-i18n/**/*.js --outputPath=./messages.json

rem node_modules\\.bin\\localize-extract -l de-DE -s ./dist/out-i18n/**/*.js -f xlf -o src/locale/messages.de-DE.xlf
call ng extract-i18n --output-path src/locale --out-file messages.de-DE.xlf
pause