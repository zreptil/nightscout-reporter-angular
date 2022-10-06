/*
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
    let ret = ProfileEntryData(this.store.timezone);
    const check = new Date(date.getFullYear(), date.getMonth(), date.getDay(), time.getHours(), time.getMinutes(), time.getSeconds());
    for (const entry in list) {
      if (!entry.time(date).isAfter(check)) ret = entry;
    }
    return ret;
  }
}
*/
