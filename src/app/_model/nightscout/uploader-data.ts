import {JsonData} from '@/_model/json-data';

export class UploaderData extends JsonData {
  batteryVoltage: number;
  batteryPercentageRemaining: number;

  constructor() {
    super();
  }

  get copy(): UploaderData {
    const ret = new UploaderData();
    ret.fillFrom(this);
    return ret;
  }

  static fromJson(json: any): UploaderData {
    const ret = new UploaderData();
    if (json == null) {
      return ret;
    }
    ret.batteryVoltage = JsonData.toNumber(json['batteryVoltage']);
    ret.batteryPercentageRemaining = JsonData.toNumber(json['battery']);
    return ret;
  }
}
