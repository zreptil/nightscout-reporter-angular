// creates from files messages.xxx.xlf the file messages.json,
// which contains all the translations
import * as fs from 'fs';
import * as path from 'path';
// @ts-ignore
import xliff from 'xliff';
import {MessageId, TargetMessage} from '@angular/localize';
import * as os from 'os';

const extract = require('extract-zip');

const outFile = '../src/assets/messages.json';

async function main() {
  try {
    const filenames = ['nightrep (translations)', 'nightrep (english) (translations)'];
    for (const filename of filenames) {
      let zipfile = getPath(`${os.homedir()}/Downloads/${filename}.zip`);
      console.log('extracting', zipfile, '...');
      await extract(zipfile, {dir: getPath('../temp')});
    }
    createJson([
      '@de-DE', 'en-GB', 'en-US', 'es-ES', 'fr/fr-FR',
      'ja/ja-JP', 'nl/nl-NL', 'no/no-NO', 'pl/pl-PL',
      'pt-PT', 'sk/sk-SK', 'ru/ru-RU', 'cs/cs-CZ'
    ], []);
    for (const filename of filenames) {
      fs.rename(
        `${os.homedir()}/Downloads/${filename}.zip`,
        `${getPath('../temp')}/${filename}.last.zip`,
        () => {
        });
    }
  } catch (ex) {
    console.error('error when creating messages', ex);
  }
}

main();
// const fileList = [];
// const lng = localStorage.getItem('language') || 'de-DE';

// createJson(['@de-DE', 'en-GB'], []);

function createJson(codes: any, list: any): void {
  let file;
  let id = codes[0];
  if (id.startsWith('@')) {
    id = id.substring(1);
    file = `../src/locale/messages.${id}.xliff`;
  } else {
    const parts = codes[0].split('/');
    let path = codes[0];
    if (parts.length === 2) {
      id = parts[1];
      path = parts[0];
    }
    file = `../temp/${path}/messages.${id}.xliff`;
  }
  const content = fs.readFileSync(getPath(file)).toString();
  parseTranslationsForLocalize(content).then((result: Record<MessageId, TargetMessage>) => {
    list.push({id: id, data: result});
    codes.splice(0, 1);
    if (codes.length === 0) {
      fs.writeFileSync(getPath(outFile), JSON.stringify(list));
      console.log(`created file ${getPath(outFile)}`);
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
    const src = parserResult.sourceLanguage;
    const dst = parserResult.targetLanguage;
    // console.log('xliff', src, dst, JSON.stringify(parserResult).substring(0, 1000));
    return Object.keys(xliffContent)
      .reduce((result: Record<MessageId, TargetMessage>, current: string) => {
        let elem = xliffContent[current].target;
        if (elem == null) {
          elem = xliffContent[current].source;
          if (elem != null && dst != null) {
            console.log(`Nicht übersetzt von ${src} nach ${dst}:`, xliffContent[current].source)
          }
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
