import {AgeData} from '@/_model/nightscout/age-data';
import {GlobalsData} from '@/_model/globals-data';
import {Utils} from '@/classes/utils';

export class WatchChangeData {
  public alarm = 0;

  constructor(public type: string,
              public lasttime: string,
              private age: AgeData) {
    if (age == null) {
      this.age = AgeData.fromJson({
        info: 0,
        warn: 0,
        urgent: 0,
        enableAlerts: false
      });
    }
    // age.info = 34;
    // age.warn = 39;
    // age.urgent = 64;
    // console.log(type, age);
  }

  getAlarm(key: string): number {
    return (this.age as any)[key] ?? -1;
  }

  calcAlarm(createdAt: Date): void {
    const hours = Utils.differenceInHours(GlobalsData.now, createdAt);
    this.alarm = 0;
    if (this.age?.info > 0 && hours > this.age?.info) {
      this.alarm = 3;
    }
    if (this.age?.warn > 0 && hours > this.age?.warn) {
      this.alarm = 2;
    }
    if (this.age?.urgent > 0 && hours > this.age?.urgent) {
      this.alarm = 1;
    }
  }
}
