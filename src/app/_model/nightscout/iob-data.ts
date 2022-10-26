import {JsonData} from '@/_model/json-data';

export class IOBData extends JsonData {
  iob: number;
  basalIob: number;
  activity: number;
  time: Date;

  constructor() {
    super();
  }

  get copy(): IOBData {
    const ret = new IOBData();
    ret.fillFrom(this);
    return ret;
  }

  static fromJson(json: any): IOBData {
    // ignore: omit_local_variable_types
    const ret = new IOBData();
    if (json == null) {
      return ret;
    }
    ret.iob = JsonData.toNumber(json['iob']);
    ret.basalIob = JsonData.toNumber(json['basaliob']);
    ret.activity = JsonData.toNumber(json['activity']);
    ret.time = JsonData.toDate(json['time']);
    return ret;
  }
}
