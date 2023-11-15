import {ProfileEntryData} from '@/_model/nightscout/profile-entry-data';
import {ProfileStoreData} from '@/_model/nightscout/profile-store-data';
import {Utils} from '@/classes/utils';
import {TreatmentData} from '@/_model/nightscout/treatment-data';

export class ProfileParams {
  treatments: TreatmentData[];
  doMix: boolean;
  profile: ProfileGlucData;
  lastIdx: number;
  skipCache: boolean;

  constructor() {
    this.treatments = null;
    this.lastIdx = 0;
    this.doMix = true;
    this.skipCache = false;
  }
}

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

  get copy(): ProfileGlucData {
    const ret = new ProfileGlucData(this.store.copy);
    ret.day = this.day;
    ret.targetLow = this.targetLow;
    ret.targetHigh = this.targetHigh;
    ret.sens = this.sens.copy;
    ret.carbRatio = this.carbRatio.copy;
    ret.basal = this.basal.copy;
    return ret;
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
