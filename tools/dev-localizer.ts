import * as fs from 'fs';
import * as path from 'path';
// @ts-ignore
import xliff from 'xliff';
import {MessageId, TargetMessage} from '@angular/localize';

// const fileList = [];
// const lng = localStorage.getItem('language') || 'de-DE';
const outFile = '../src/assets/messages.json';

// Erzeugt aus den Dateien messages.xxx.xlf die Datei messages.json,
// die dann sämtliche Übersetzungen beinhaltet.
// createJson(['@de-DE', 'en-GB'], []);

createJson(['@de-DE', 'en-GB', 'en-US', 'es-ES', 'fr-FR', 'ja-JP', 'nl-NL', 'no-NO', 'pl-PL', 'pt-PT', 'sk-SK', 'ru-RU'], []);

function createJson(codes: any, list: any): void {
  let file;
  let id = codes[0];
  if (id.startsWith('@')) {
    id = id.substring(1);
    file = `../src/locale/messages.${id}.xliff`;
  } else {
    file = `../temp/messages.${id}.xliff`;
  }
  const content = fs.readFileSync(getPath(file)).toString();
  parseTranslationsForLocalize(content).then((result: Record<MessageId, TargetMessage>) => {
    list.push({id: id, data: result});
    codes.splice(0, 1);
    if (codes.length === 0) {
      fs.writeFileSync(getPath(outFile), JSON.stringify(list));
      console.log(`Die Datei ${getPath(outFile)} wurde erstellt`);
    } else {
      createJson(codes, list);
    }
//  console.log('Geladene Übersetzungen', result);
//  loadTranslations(parsedTranslations);
  });
}

function getPath(dir: string, file?: string): string {
  if (dir.startsWith('.') || dir.startsWith('/')) {
    return file ? path.join(__dirname, dir, file) : path.join(__dirname, dir);
  }

  return file ? path.join(dir, file) : dir;
}

function parseTranslationsForLocalize(xml: string): Promise<Record<MessageId, TargetMessage>> {
  return xliff.xliff12ToJs(xml).then((parserResult: any) => {
    const xliffContent: any = parserResult.resources['ng2.template'];
//    console.log('xliff', xliffContent);
    return Object.keys(xliffContent)
      .reduce((result: Record<MessageId, TargetMessage>, current: string) => {
        let elem = xliffContent[current].target;
        if (elem == null) {
          elem = xliffContent[current].source;
        }
        if (typeof elem === 'string') {
          result[current] = elem;
        } else {
          if (elem != null) {
            if (elem.map == null) {
              console.error('Fehler bei', elem);
            }
            result[current] = elem.map?.((entry: string | { [key: string]: any }) => {
              return typeof entry === 'string' ? entry : '{$' + entry['Standalone'].id + '}';
//              return typeof entry === 'string' ? entry : '{$' + entry.Standalone['equiv-text'] + '}';
            }).map((entry: string) => {
              return entry;
//                .replace('{{', '{$')
//                .replace('}}', '}');
            }).join('');
          }
        }
        return result;
      }, {});
  });
}
