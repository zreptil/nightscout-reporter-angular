import {JsonData} from '@/_model/json-data';

export class PumpStatusData extends JsonData {
  status: string;
  bolusing: boolean;
  suspended: boolean;
  timestamp: Date;

  constructor() {
    super();
  }

  get copy(): PumpStatusData {
    const ret = new PumpStatusData();
    ret.fillFrom(this);
    return ret;
  }

  static fromJson(json: any): PumpStatusData {
    const ret = new PumpStatusData();
    if (json == null) {
      return ret;
    }
    ret.status = JsonData.toText(json.status);
    ret.bolusing = JsonData.toBool(json.bolusing);
    ret.suspended = JsonData.toBool(json.suspended);
    ret.timestamp = JsonData.toDate(json.timestamp);
    return ret;
  }
}
