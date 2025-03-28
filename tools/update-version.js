const fs = require('fs');
const path = require('path');

// Pfade zu den Dateien
const versionFilePath = path.join(`${__dirname}/../src/app/_model`, 'settings.ts');
const packageJsonPath = path.join(`${__dirname}/..`, 'package.json');
// TypeScript-Datei einlesen
const content = fs.readFileSync(versionFilePath, 'utf8');
const match = content.match(/_version = '(.*)';/);
if (match?.[1] == null) {
  console.error('Konnte _version nicht aus settings.ts extrahieren.');
  process.exit(1);
}
const appVersion = match?.[1];
// package.json einlesen
const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
const packageJson = JSON.parse(packageJsonContent);

// Versionsnummer aktualisieren
packageJson.version = appVersion;
packageJson.scripts.rename = `node -e "require('fs').rename('dist/nightrep/nightscout-reporter_${appVersion}.zip', 'dist/nightrep/browser/nightscout-reporter_local.zip', function(err) { if (err) console.log(err); console.log('File successfully renamed!') })"`;

// Aktualisierte package.json zurückschreiben
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log(`Die Versionsnummer wurde erfolgreich auf ${appVersion} aktualisiert.`);
