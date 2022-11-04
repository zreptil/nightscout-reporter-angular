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
}
