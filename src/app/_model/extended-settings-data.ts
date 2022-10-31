import {JsonData} from '@/_model/json-data';
import {AgeData} from '@/_model/nightscout/age-data';

export class ExtendedSettingsData extends JsonData {
  upbatEnableAlerts: boolean;
  upbatWarn: number;
  cage: AgeData;
  sage: AgeData;
  pumpFields: string[] = [];
  advancedDeviceStatus: boolean;

  constructor() {
    super();
  }

  static fromJson(json: any): ExtendedSettingsData {
    const ret = new ExtendedSettingsData();
    if (json == null) {
      return ret;
    }
    if (json.pump != null) {
      for (const entry of JsonData.toText(json.pump.fields).toString().split(' ')) {
        ret.pumpFields.push(entry);
      }
    }
    if (json.upbat != null) {
      ret.upbatEnableAlerts = JsonData.toBool(json.upbat.enableAlerts);
      ret.upbatWarn = JsonData.toNumber(json.upbat.warn);
    }
    ret.cage = AgeData.fromJson(json.cage);
    ret.cage = AgeData.fromJson(json.sage);
    ret.advancedDeviceStatus = JsonData.toBool(json.advancedDeviceStatus);
    return ret;
  }
}
