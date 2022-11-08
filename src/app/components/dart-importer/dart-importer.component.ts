import {Component, OnInit} from '@angular/core';
import {DataService} from '@/_services/data.service';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {LangData} from '@/_model/nightscout/lang-data';
import {Log} from '@/_services/log.service';
import {Utils} from '@/classes/utils';
import {SessionService} from '@/_services/session.service';

@Component({
  selector: 'app-dart-importer',
  templateUrl: './dart-importer.component.html',
  styleUrls: ['./dart-importer.component.scss']
})
export class DartImporterComponent implements OnInit {

  translations: any;
  messages: any;
  xliff: any;
  code: string;

  constructor(public ds: DataService,
              public ss: SessionService) {
  }

  get sourceData(): any {
    return this.messages?.[0].data;
  }

  get globals(): GlobalsData {
    return GLOBALS;
  }

  async ngOnInit() {
    let url = `assets/messages.json`;
    this.messages = await this.ds.request(url, {asJson: true});
    url = `assets/messages.xlf.json`;
    this.xliff = await this.ds.request(url, {asJson: true});
  }

  async clickLanguage(lang: LangData) {
    const filename = `intl_${lang.code.replace(/-/g, '_')}.arb`;
    const url = `assets/old-dart/${filename}`;
    this.translations = await this.ds.request(url, {asJson: true});
    console.log(lang.code, this.translations);
    Log.clear();
    GLOBALS.isDebug = true;
    for (const key of Object.keys(this.sourceData)) {
      const parts = this.sourceData[key].trim().split('\n');
      const cvtKey = Utils.join(parts, ' ', text => {
        return text?.trim().replace(/<br>/g, '\n');
      });
      const trans = this.translations[cvtKey];
      if (trans == null) {
        if (key === '4562561451144140468') {
          console.log(key, cvtKey);
        }
        const src = this.xliff.file.body['trans-unit'] ?? [];
        const entry = src.find((e: any) => e['@id'] === key && e.note?.['@from'] === 'description');
        let showError = true;
        if (entry != null) {
          const keyList = Object.keys(this.translations);
          let found: string = null;
          for (let i = 0; i < keyList.length && found == null; i++) {
            if (this.translations[keyList[i]].description === entry.note?.['#text']) {
              found = keyList[i];
            }
          }
          if (found != null) {
            const id = found.substring(1);
            if (this.translations[id] != null) {
              Log.warn(`${key} ${this.translations[id]}`);
              showError = false;
            }
          }
        }
        if (showError) {
          Log.error(`${key} ${this.sourceData[key]}`);
        }
      } else {
        Log.info(`${key} ${trans}`);
      }
    }
  }

  replaceCode() {
    this.code = this.code.replace(/([\s{(])g\./g, '$1GLOBALS.');
    this.code = this.code.replace(/([\s{(])var(.*) in /g, '$1const$2 of ');
    this.code = this.code.replace(/([\s{(])var(\s)/g, '$1const$2');
    this.code = this.code.replace(/@override/g, 'override');
    this.code = this.code.replace(/Intl\.message/g, '\$localize');
    this.code = this.code.replace(/(\b)bool(\b)/g, '$1boolean$2');
    this.code = this.code.replace(/(\b)String(\b)/g, '$1string$2');
    this.code = this.code.replace(/(\b)double(\b)/g, '$1number$2');
    this.code = this.code.replace(/(\b)int(\b)/g, '$1number$2');
    this.code = this.code.replace(/(\b)num(\b)/g, '$1number$2');
    this.code = this.code.replace(/(\b)dynamic(\b)/g, '$1any$2');
    this.code = this.code.replace(/(\b)math(\b)/g, '$1Math$2');
    this.code = this.code.replace(/(\b)Globals(\b)/g, '$1GlobalsData$2');
    // this.code = this.code.replace(/(\b)cm(\b)/g, '$1this.cm$2');
    // this.code = this.code.replace(/(\b)cmx(\b)/g, '$1this.cmx$2');
    // this.code = this.code.replace(/(\b)cmy(\b)/g, '$1this.cmy$2');
    let repList = ['x', 'y', 'color', 'colSpan', 'lineWidth', 'type', 'points', 'closePath',
      'relativePosition', 'columns', 'width', 'text', 'fontSize', 'alignment', 'stack', 'canvas',
      'x1', 'x2', 'y1', 'y2', 'lineColor', 'margin', 'w', 'h', 'lineHeight', 'bold', 'layout',
      'table', 'widths', 'headerRows', 'body', 'style', 'fillOpacity'];
    for (const entry of repList) {
      const re = new RegExp(`'${entry}':`, 'g');
      this.code = this.code.replace(re, `${entry}:`);
    }
    repList = ['cm', 'cmx', 'cmy', 'xorg', 'yorg', 'lcFrame', 'fs', 'lw', 'lc'];
    for (const entry of repList) {
      const re = new RegExp(`(\\b)${entry}(\\b)`, 'g');
      this.code = this.code.replace(re, `$1this.${entry}$2`);
    }
    repList = ['ParamInfo'];
    for (const entry of repList) {
      const re = new RegExp(`(\\b)${entry}(\\b)`, 'g');
      this.code = this.code.replace(re, `$1new ${entry}$2`);
    }
  }
}
