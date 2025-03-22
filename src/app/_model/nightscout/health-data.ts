import {JsonData} from '@/_model/json-data';

export class HealthData extends JsonData {
  raw: any;
  createdAt: Date;
  startDate: number;
  startTime: number;
  from: string;
  id: string;
  steps: number;
  duration: number;
  heartRate: number;
  distance: number;
  bpm: number;

  constructor() {
    super();
  }

  get copy(): HealthData {
    const ret = new HealthData();
    ret.fillFrom(this);
    return ret;
  }

  static fromJson(json: any): HealthData {
    const ret = new HealthData();
    if (json == null) {
      return ret;
    }
    ret.raw = json;
    ret.id = JsonData.toText(json._id);
    ret.createdAt = JsonData.toDate(json.created_at);
    ret.from = JsonData.toText(json.type);
    ret.steps = JsonData.toNumber(json.steps);
    ret.bpm = JsonData.toNumber(json.bpm);
    ret.startDate = JsonData.toNumber(json.startDate);
    ret.startTime = JsonData.toNumber(json.startTime);
    ret.duration = JsonData.toNumber(json.duration);
    ret.heartRate = JsonData.toNumber(json.heartRate);
    ret.distance = JsonData.toNumber(json.distance);
    return ret;
  }

  equals(a: HealthData): boolean {
    return this.createdAt.getTime() === a.createdAt.getTime() &&
      this.from === a.from &&
      this.steps === a.steps &&
      this.bpm === a.bpm &&
      this.startDate === a.startDate &&
      this.startTime === a.startTime &&
      this.duration === a.duration &&
      this.heartRate === a.heartRate &&
      this.distance === a.distance;
  }
}
