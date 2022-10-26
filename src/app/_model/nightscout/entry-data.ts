import {JsonData} from '../json-data';
import {GlobalsData} from '@/_model/globals-data';

export class EntryData extends JsonData {
  raw: any;
  id: string;
  time: Date;
  rssi: number;
  device: string;
  direction: string;
  rawbg: number;
  sgv: number;
  mbg: number;
  type: string;
  slope: number;
  intercept: number;
  scale: number;
  isGap = false;
  isCopy = false;

  constructor() {
    super();
  }

  get isInvalid(): boolean {
    return false; //type != 'mbg' && direction != null && direction.toLowerCase() == 'none';
  }

  get isInvalidOrGluc0(): boolean {
    return this.isInvalid || this.gluc == null || this.gluc == 0;
  }

  get isGlucInvalid(): boolean {
    return this.gluc == null || this.gluc <= 0;
  }

  get gluc(): number {
    return this.isGap ? -1 : GlobalsData.adjustFactor * (this.type == 'sgv' ? this.sgv : this.rawbg) ?? 0;
  }

  get bloodGluc(): number {
    return (this.type == 'mbg' ? this.mbg : 0) ?? 0;
  }

  get fullGluc(): number {
    return this.isGap ? -1 : (this.type == 'mbg' ? this.mbg : this.gluc) ?? 0;
  }

  get copy(): EntryData {
    const ret = new EntryData();
    ret.fillFrom(this);
    return ret;
  }

  static fromJson(json: any): EntryData {
    const ret = new EntryData();
    ret.raw = json;
    if (json == null) {
      return ret;
    }
    ret.id = json['_id'];
    ret.time = JsonData.toDate(json['date']);
    ret.rssi = JsonData.toNumber(json['rssi']);
    ret.device = json['device'];
    ret.direction = json['direction'];
    ret.rawbg = JsonData.toNumber(json['rawbg']);
    ret.type = json['type'];
    ret.sgv = JsonData.toNumber(json['sgv']);
    ret.mbg = JsonData.toNumber(json['mbg']);
    if (ret.type == null && ret.sgv > 0) {
      ret.type = 'sgv';
    }
    if (ret.type == null && ret.mbg > 0) {
      ret.type = 'mbg';
    }
    if (ret.sgv < 20) {
      ret.sgv = 0;
      ret.isGap = true;
    }
    if (ret.sgv > 1000) {
      ret.sgv = 0;
      ret.isGap = true;
    }
    ret.slope = JsonData.toNumber(json['slope']);
    ret.intercept = JsonData.toNumber(json['intercept']);
    ret.scale = JsonData.toNumber(json['scale']);
    return ret;
  }

  slice(src: EntryData, dst: EntryData, f: number): void {
    this.sgv = GlobalsData.calc(src.sgv, dst.sgv, f);
    this.rawbg = GlobalsData.calc(src.rawbg, dst.rawbg, f);
    this.mbg = GlobalsData.calc(src.mbg, dst.mbg, f);
  }
}
