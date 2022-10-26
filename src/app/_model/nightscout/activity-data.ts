import {JsonData} from '@/_model/json-data';

export class ActivityData extends JsonData {
  raw: any;
  createdAt: Date;
  type: string;
  id: string;
  steps: number;
  bpm: number;
  accuracy: number;

  constructor() {
    super();
  }

  get copy(): ActivityData {
    const ret = new ActivityData();
    ret.fillFrom(this);
    return ret;
  }

  static fromJson(json: any): ActivityData {
    var ret = new ActivityData();
    if (json == null) {
      return ret;
    }
    ret.raw = json;
    ret.id = JsonData.toText(json['_id']);
    ret.createdAt = JsonData.toDate(json['created_at']);
    ret.type = JsonData.toText(json['type']);
    ret.steps = JsonData.toNumber(json['steps']);
    ret.bpm = JsonData.toNumber(json['bpm']);
    ret.accuracy = JsonData.toNumber(json['accuracy']);
    return ret;
  }

  equals(a: ActivityData): boolean {
    return this.createdAt.getTime() == a.createdAt.getTime() &&
      this.type == a.type &&
      this.steps == a.steps &&
      this.bpm == a.bpm &&
      this.accuracy == a.accuracy;
  }
}
