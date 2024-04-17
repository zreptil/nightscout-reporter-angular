import {GLOBALS, GlobalsData} from '../globals-data';
import {JsonData} from '../json-data';
import {Log} from '@/_services/log.service';
import {Utils} from '@/classes/utils';

export class UrlData {
  url: string;
  token: string;
  startDate: Date;
  endDate: Date;
  startDateEditString: string;
  timeout: number;
  apiSecret: string;
  linkupUsername: string;
  linkupPassword: string;
  linkupRegion: string;
  linkupPatientId: string;

  constructor() {
  }

  get asJson(): any {
    return {
      u: this.url,
      t: this.token,
      sd: JsonData.fromDate(this.startDate, '19700101'),
      ed: JsonData.fromDate(this.endDate),
      as: this.apiSecret,
      lun: this.linkupUsername,
      lup: this.linkupPassword,
      lur: this.linkupRegion,
      lupid: this.linkupPatientId,
      ti: this.timeout
    };
  }

  get startDateEdit(): string {
    try {
      return this.startDate == null ? null : GLOBALS.fmtDateForDisplay.transform(this.startDate);
    } catch (ex) {
      Log.devError(ex, 'startDateEdit');
    }
    return null;
  }

  set startDateEdit(v: string) {
    this.startDate = new Date(v);
  }

  get endDateEdit(): string {
    try {
      return this.endDate == null ? null : GLOBALS.fmtDateForDisplay.transform(this.endDate);
    } catch (ex) {
      Log.devError(ex, 'endDateEdit');
    }
    return null;
  }

  set endDateEdit(v: string) {
    this.endDate = new Date(v);
  }

  static fromString(g: GlobalsData, src: string): UrlData {
    try {
      return UrlData.fromJson(JSON.parse(src));
    } catch (ex) {
      return new UrlData();
    }
  }

// creates an instance and fills it with data from a json-structure
  static fromJson(json: any): UrlData {
    const ret = new UrlData();
    try {
      ret.url = JsonData.toText(json.u);
      ret.token = JsonData.toText(json.t);
      ret.startDate = json.sd == null ? new Date(1970, 0, 1) : JsonData.parseDate(json.sd);
      ret.endDate = JsonData.parseDate(json.ed);
      ret.apiSecret = JsonData.toText(json.as);
      ret.linkupUsername = JsonData.toText(json.lun);
      ret.linkupPassword = JsonData.toText(json.lup);
      ret.linkupRegion = JsonData.toText(json.lur) ?? 'DE';
      ret.linkupPatientId = JsonData.toText(json.lupid);
      ret.timeout = JsonData.toNumber(json.ti, 7000);
    } catch (ex) {
      Log.devError(ex, `Fehler bei UrlData.fromJson`);
    }
    return ret;
  }

  fullUrl(cmd: string, params = '', noApi = false, noToken = false): string {
    let ret = this.url;
    if (ret == null) {
      return ret;
    }
    if (ret.startsWith('@')) {
      return ret.substring(1);
    }
    if (!ret.endsWith('/')) {
      ret = `${ret}/`;
    }
    if (!noApi) {
      if (!ret.endsWith('/api/v1/')) {
        ret = `${ret}api/v1/`;
      }
    }
    if (Utils.isEmpty(cmd)) {
      ret = ret.substring(0, ret.length - 1);
    } else {
      ret = `${ret}${cmd}`;
    }
    if (this.token != null && !Utils.isEmpty(this.token) && !noToken) {
      ret = `${ret}?token=${this.token}&`;
    } else {
      ret = `${ret}?`;
    }
    if (Utils.isEmpty(params)) {
      ret = ret.substring(0, ret.length - 1);
    } else {
      ret = `${ret}${params}`;
    }
    return ret;
  }
}
