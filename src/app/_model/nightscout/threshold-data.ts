import {JsonData} from '@/_model/json-data';

export class ThresholdData extends JsonData {
  bgHigh: number;
  bgTargetTop: number;
  bgTargetBottom: number;
  bgLow: number;

  constructor() {
    super();
  }

  static fromJson(json: any): ThresholdData {
    const ret = new ThresholdData();
    if (json == null) {
      return ret;
    }
    ret.bgHigh = JsonData.toNumber(json.bgHigh);
    ret.bgTargetTop = JsonData.toNumber(json.bgTargetTop);
    ret.bgTargetBottom = JsonData.toNumber(json.bgTargetBottom);
    ret.bgLow = JsonData.toNumber(json.bgLow);
    return ret;
  }
}
