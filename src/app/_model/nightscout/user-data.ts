import {GLOBALS} from '@/_model/globals-data';
import {UrlData} from '@/_model/nightscout/url-data';
import {StatusData} from '@/_model/nightscout/status-data';
import {EntryData} from '@/_model/nightscout/entry-data';
import {TreatmentData} from '@/_model/nightscout/treatment-data';
import {Utils} from '@/classes/utils';
import {JsonData} from '@/_model/json-data';
import {Log} from '@/_services/log.service';
import {Settings} from '@/_model/settings';
import {RequestParams} from '@/_services/data.service';

export class UserData {
  name = '';
  birthDate = '';
  isPinned = false;
  listApiUrl: UrlData[] = [];
  customData: { [key: string]: string } = {};
  formParams: any = {};
  diaStartDate = '';
  insulin = '';
  status: StatusData;
  profileMaxIdx: number = 0;
  isReachable = true;
  lastEntry: EntryData = null;
  lastTreatment: TreatmentData = null;

  // returns the adjustvalues to check them against the values that
  // were loaded. so the saving of the data can be managed depending
  // on the adjustCheck when the data was loaded
  adjustLoaded: string = null;
  adjustTarget: boolean = false;
  adjustCalc = 5.0;
  adjustLab = 5.0;

  constructor() {
    this.listApiUrl.push(new UrlData());
  }

  get iconForPin(): string {
    if (this.isPinned) {
      return 'star';
    }
    return 'star_border';
  }

  get classForPin(): string[] {
    const ret = [];
    if (this.isPinned) {
      ret.push('pinned');
    }
    return ret;
  }

  // retrieve the data as a json-encoded-string
  get asJsonString(): string {
    this.listApiUrl.sort((a, b) => Utils.compareDate(a.endDate, b.endDate));
    const urls: any[] = [];
    for (const url of this.listApiUrl) {
      urls.push(url.asJson);
    }
    return `{"n":"${this.name}"`
      + `,"bd":"${this.birthDate ?? ''}"`
      + `,"s":${JSON.stringify(urls)}`
      + `,"dd":"${this.diaStartDate ?? ''}"`
      + `,"i":"${this.insulin ?? ''}"`
      + `,"c":${JSON.stringify(this.customData)}`
      + `,"f":${JSON.stringify(this.formParams)}`
      + `,"r":${this.isReachable ? 'true' : 'false'}`
      + `,"pmi":${this.profileMaxIdx}`
      + `,"ag":${this.adjustGluc ? 'true' : 'false'}`
      + `,"ac":"${this.adjustCalc?.toString() ?? 5.0}"`
      + `,"al":"${this.adjustLab?.toString() ?? 5.0}"`
      + `,"at":${this.adjustTarget ? 'true' : 'false'}`
      + `,"p":${this.isPinned ? 'true' : 'false'}`
      + `}`;
  }

  // retrieves the text for display
  get display(): string {
    return Utils.isEmpty(this.name) ? this.apiUrl(null, '', {noApi: true}) : this.name;
  }

// retrieves the url to the reports of Nightscout
  get reportUrl(): string {
    return this.apiUrl(null, 'report', {noApi: true});
  }

  // on changes of the values
  get adjustCheck(): string {
    return `${this.adjustGluc}${this.adjustCalc}${this.adjustLab}`;
  }

  _adjustGluc: boolean = false;

  get adjustGluc(): boolean {
    return this._adjustGluc;
  }

  set adjustGluc(value: boolean) {
    this._adjustGluc = value;
    if (this._adjustGluc) {
      Settings.adjustFactor = this.hba1cAdjustFactor;
    } else {
      Settings.adjustFactor = 1.0;
    }
  }

  get hba1cAdjustFactor(): number {
    return (this.adjustLab * 28.7 - 46.7) / (this.adjustCalc * 28.7 - 46.7);
  }

  // creates an instance and fills it with data from a json-structure
  static fromJson(json: any): UserData {
    const ret = new UserData();
    try {
      ret.name = JsonData.toText(json.n);
      ret.birthDate = JsonData.toText(json.bd);
      ret.diaStartDate = JsonData.toText(json.dd);
      ret.insulin = JsonData.toText(json.i);
      ret.listApiUrl = [];
      for (const s of json.s ?? []) {
        ret.listApiUrl.push(UrlData.fromJson(s));
      }
      ret.listApiUrl.sort((a, b) => Utils.compareDate(a.endDate, b.endDate));
      ret.customData = json.c;
      ret.isReachable = JsonData.toBool(json.r);
      ret.profileMaxIdx = JsonData.toNumber(json.pmi, null);
      ret.adjustGluc = JsonData.toBool(json.ag ?? false);
      ret.adjustCalc = JsonData.toNumber(json.ac, 5.0);
      ret.adjustLab = JsonData.toNumber(json.al, 5.0);
      ret.adjustTarget = JsonData.toBool(json.at ?? false);
      ret.isPinned = JsonData.toBool(json.p ?? false);
      ret.adjustLoaded = ret.adjustCheck;
      ret.formParams = json.f;
      if (ret.formParams != null && typeof ret.formParams['analysis'] === 'boolean') {
        ret.formParams = {};
      }
    } catch (ex) {
      Log.devError(ex, `Fehler bei UserData.fromJson`);
    }
    return ret;
  }

  loadParamsFromForms(): void {
    for (const entry of GLOBALS.listConfig) {
      this.formParams[entry.dataId] = entry.asString;
    }
  }

  // retrieves the url to the api for a data
  apiUrl(date: Date, cmd: string, params?: { params?: string, noApi?: boolean, noToken?: boolean, reqParams?: RequestParams }): string {
    params ??= {};
    params.params ??= '';
    params.noApi ??= false;
    params.noToken ??= false;
    if (Utils.isEmpty(this.listApiUrl)) {
      return null;
    }
    const found = this.urlDataFor(date);
    if (params.reqParams != null) {
      params.reqParams.timeout = 10000;
      params.reqParams.onDone = found.requestDone.bind(found);
    }
    return found.fullUrl(cmd, params.params, params.noApi, params.noToken);
  }

  // retrieves the url for a date
  urlDataFor(date: Date): UrlData {
    let ret: UrlData;
    if (date != null) {
      for (const url of this.listApiUrl) {
        if (url.startDate == null || Utils.isOnOrBefore(url.startDate, date)) {
          if (url.endDate == null || Utils.isOnOrAfter(url.endDate, date)) {
            ret = url;
          }
        }
      }
    }
    ret ??= Utils.last(this.listApiUrl);
    return ret;
  }

  saveParamsToForms(): void {
    for (const entry of GLOBALS.listConfig) {
      entry.fillFromString(this.formParams[entry.dataId]);
    }
  }
}
