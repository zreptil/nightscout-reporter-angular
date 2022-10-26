import {JsonData} from '@/_model/json-data';

export class PumpBatteryData extends JsonData {
  status: string;
  voltage: number;

  constructor() {
    super();
  }

  get copy(): PumpBatteryData {
    const ret = new PumpBatteryData();
    ret.fillFrom(this);
    return ret;
  }

  static fromJson(json: any): PumpBatteryData {
    var ret = new PumpBatteryData();
    if (json == null) {
      return ret;
    }
    ret.status = JsonData.toText(json['status']);
    ret.voltage = JsonData.toNumber(json['voltage']);
    return ret;
  }
}
