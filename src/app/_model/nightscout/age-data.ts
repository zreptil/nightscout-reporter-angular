import {JsonData} from '@/_model/json-data';

export class AgeData extends JsonData {
  display: string;
  warn: number;
  urgent: number;
  info: number;
  enableAlerts: boolean;

  constructor() {
    super();
  }

  static fromJson(json: any): AgeData {
    const ret = new AgeData();
    if (json == null) {
      return ret;
    }
    ret.display = JsonData.toText(json.display);
    ret.warn = JsonData.toNumber(json.warn);
    ret.urgent = JsonData.toNumber(json.urgent);
    ret.info = JsonData.toNumber(json.info);
    ret.enableAlerts = JsonData.toBool(json.enableAlerts);
    return ret;
  }
}
