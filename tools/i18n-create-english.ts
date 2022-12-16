import * as fs from 'fs';
import * as path from 'path';
const extract = require('extract-zip');
async function main() {
  try {
    const zipfile = getPath('../nightrep (translations).zip');
    console.log('extracting', zipfile, '...');
    await extract(zipfile, {dir: getPath('../temp')});
    console.log('converting english to source...');
    const file = `../temp/en-GB/messages.en-GB.xliff`;
    let content = fs.readFileSync(getPath(file)).toString();
    content = content.replace(/<source[^>]*>(.*)<\/source>/g, '');
    content = content.replace(/<target[^>]*>(.*)<\/target>/g, '<source>$1</source>');
    content = content.replace(/source-language="de"/, 'source-language="en-GB"');
    content = content.replace(/target-language="en-GB"/, '');
    content = content.replace(/\n^\s+$/gm, '');
    fs.writeFileSync(getPath('../src/locale/messages.en-GB.xliff'), content);
    console.log('wrote sourcefile to src/locale/messages.en-GB.xliff');
  } catch (ex) {
    console.error('error when creating english source', ex);
  }
}

main();

function getPath(dir: string, file?: string): string {
  if (dir.startsWith('.') || dir.startsWith('/')) {
    return file ? path.join(__dirname, dir, file) : path.join(__dirname, dir);
  }

  return file ? path.join(dir, file) : dir;
}
