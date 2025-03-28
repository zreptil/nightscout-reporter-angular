const fs = require('fs-extra');

fs.copy('dist/nightrep/browser', 'dist/nightrep/zip')
  .then(() => {
    fs.copy('src/build-replacements/zip', 'dist/nightrep/zip')
      .then(() => console.log('Verzeichnis erfolgreich kopiert!'))
      .catch(err => console.error('Fehler beim Kopieren:', err));
  })
  .catch(err => console.error('Fehler beim Kopieren:', err));
