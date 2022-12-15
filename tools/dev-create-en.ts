import * as fs from 'fs';
import * as path from 'path';

const file = `../temp/messages.en-GB.xliff`;
let content = fs.readFileSync(getPath(file)).toString();
content = content.replace(/<source.*>(.*)<\/source>/g, '');
content = content.replace(/<target.*>(.*)<\/target>/g, '<source>$1</source>');
content = content.replace(/source-language="de"/, 'source-language="en-GB"');
content = content.replace(/target-language="en-GB"/, '');
content = content.replace(/\n^\s+$/gm, '');
fs.writeFileSync(getPath('../src/locale/messages.en-GB.xliff'), content);

function getPath(dir: string, file?: string): string {
  if (dir.startsWith('.') || dir.startsWith('/')) {
    return file ? path.join(__dirname, dir, file) : path.join(__dirname, dir);
  }

  return file ? path.join(dir, file) : dir;
}
