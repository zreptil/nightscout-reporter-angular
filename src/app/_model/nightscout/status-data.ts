import {JsonData} from '@/_model/json-data';
import {ExtendedSettingsData} from '@/_model/extended-settings-data';
import {SettingsData} from '@/_model/settings-data';

export class StatusData extends JsonData {
  raw: any;
  status: string;
  name: string;
  version: string;
  serverTime: Date;
  serverTimeEpoch: number;
  apiEnabled: boolean;
  careportalEnabled: boolean;
  boluscalcEnabled: boolean;
  head: string;
  settings: SettingsData;
  extendedSettings: ExtendedSettingsData;

  constructor() {
    super();
  }

  static fromJson(json: any): StatusData {
    const ret = new StatusData();
    ret.raw = json;
    ret.settings = new SettingsData();
    ret.extendedSettings = new ExtendedSettingsData();
    if (json == null) {
      return ret;
    }
    ret.status = JsonData.toText(json['status']);
    if (ret.status == '401') {
      return ret;
    }
    ret.name = JsonData.toText(json['name']);
    ret.version = JsonData.toText(json['version']);
    ret.serverTime = JsonData.toDate(json['serverTime']);
    ret.serverTimeEpoch = JsonData.toNumber(json['serverTimeEpoch']);
    ret.apiEnabled = JsonData.toBool('apiEnabled');
    ret.careportalEnabled = JsonData.toBool('careportalEnabled');
    ret.boluscalcEnabled = JsonData.toBool('boluscalcEnabled');
    ret.head = JsonData.toText(json['head']);
    if (json['settings'] != null) {
      ret.settings = SettingsData.fromJson(json['settings']);
    }
    if (json['extendedSettings'] != null) {
      ret.extendedSettings = ExtendedSettingsData.fromJson(json['extendedSettings']);
    }
    return ret;
  }
}
