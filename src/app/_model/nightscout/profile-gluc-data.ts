import {ProfileEntryData} from '@/_model/nightscout/profile-entry-data';
import {ProfileStoreData} from '@/_model/nightscout/profile-store-data';
import {Utils} from '@/classes/utils';

export class ProfileGlucData {
  day: Date;
  targetLow: number = 70;
  targetHigh: number = 180;
  sens: ProfileEntryData;
  carbRatio: ProfileEntryData;
  basal: ProfileEntryData;

  constructor(public store: ProfileStoreData) {
    this.sens = new ProfileEntryData(store.timezone);
    this.carbRatio = new ProfileEntryData(store.timezone);
    this.basal = new ProfileEntryData(store.timezone);
  }

  find(date: Date, time: Date, list: ProfileEntryData[]): ProfileEntryData {
    let ret = new ProfileEntryData(this.store.timezone);
    const check = new Date(date.getFullYear(), date.getMonth(), date.getDay(), time.getHours(), time.getMinutes(), time.getSeconds());
    for (const entry of list) {
      if (!Utils.isAfter(entry.time(date), check)) {
        ret = entry;
      }
    }
    return ret;
  }
}
