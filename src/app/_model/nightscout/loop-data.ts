import {JsonData} from '@/_model/json-data';
import {IOBData} from '@/_model/nightscout/iob-data';

export class LoopData extends JsonData {
  iob: IOBData;

  constructor() {
    super();
  }

  get copy(): LoopData {
    const ret = new LoopData();
    ret.fillFrom(this);
    return ret;
  }

  static fromJson(json: any): LoopData {
    const ret = new LoopData();
    if (json == null) {
      return ret;
    }
    ret.iob = IOBData.fromJson(JsonData.ensureJson(json['iob']));
    return ret;
  }
}
