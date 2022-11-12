import {JsonData} from '../json-data';
import {ProfileStoreData} from './profile-store-data';
import {Utils} from '@/classes/utils';
import {ProfileTimezone} from '@/_model/nightscout/profile-timezone-data';
import {ProfileEntryData} from '@/_model/nightscout/profile-entry-data';
import {TreatmentData} from '@/_model/nightscout/treatment-data';

export class ProfileData extends JsonData {
  raw: any;
  id: string;
  defaultProfile: string;
  enteredBy: string;
  duration: number; // duration in seconds
  store: { [key: string]: ProfileStoreData } = {};
  startDate: Date;
  units: string;
  createdAt: Date;
  maxPrecision = 0;
  isFromNS = false;

  constructor() {
    super();
  }

  get storeHash(): string {
    const ret: string[] = [];
    for (const key of Object.keys(this.store)) {
      ret.push(this.store[key].hash);
    }
    return Utils.join(ret, '');
    // return this.store.keys.reduce((value, element) => value + store[element].hash);
  }

  get copy(): ProfileData {
    const ret = new ProfileData();
    ret.fillFrom(this);

    ret.store = {};
    for (const key of Object.keys(this.store)) {
      ret.store[key] = this.store[key].copy;
    }
    return ret;
  }

  get mills(): number {
    return this.startDate?.getTime() ?? 0;
  }

  get current(): ProfileStoreData {
    return this.store[this.defaultProfile];
  }

  static fromJson(json: any, isFromNS = false): ProfileData {
    const ret = new ProfileData();
    ret.raw = json;
    ret.isFromNS = isFromNS;
    if (json == null) {
      return ret;
    }
    ret.id = json.int;
    ret.enteredBy = JsonData.toText(json.enteredBy);
    ret.defaultProfile = json.defaultProfile;
    ret.startDate = JsonData.toDate(json.startDate);
    const timeshift = JsonData.toNumber(json.timeshift);
    ret.units = JsonData.toText(json.units);
    ret.createdAt = JsonData.toDate(json.created_at);
    ret.duration = JsonData.toNumber(json.duration) * 60; // duration is saved as minutes
    const src = json.store;
    ret.maxPrecision = 0;
    for (const key of Object.keys(src)) {
      const temp = src[key];
      if (temp != null) {
        let percentage = JsonData.toNumber(json.percentage);
        if (percentage == null || percentage === 0.0) {
          percentage = 1.0;
        } else {
          percentage /= 100.0;
        }
//        ret.store[key] = ProfileStoreData.fromJson(key, temp.value, percentage, timeshift, ret.startDate);
        ret.store[key] = ProfileStoreData.fromJson(key, temp, percentage, timeshift, ret.startDate);
        ret.maxPrecision = Math.max(ret.maxPrecision, ret.store[key].maxPrecision);
      }
    }
    return ret;
  }

  includeTreatment(t: TreatmentData): void {
    if (t.isTempTarget && t.duration > 0) {
      const time = ((t.createdAt.getHours() + t.timeshift) * 60 + t.createdAt.getMinutes()) * 60;
      for (const key of Object.keys(this.store)) {
        const data = this.store[key];
        this._mixStore(data.listTargetHigh, data.timezone, time, t.duration, t.targetTop);
        this._mixStore(data.listTargetLow, data.timezone, time, t.duration, t.targetBottom);
        data.listTargetHigh.sort((a, b) => Utils.compare(a.timeForCalc, b.timeForCalc));
        data.listTargetLow.sort((a, b) => Utils.compare(a.timeForCalc, b.timeForCalc));
      }
    }
  }

  _mixStore(list: ProfileEntryData[], timezone: ProfileTimezone, time: number, duration: number, value: number): void {
    const entry = new ProfileEntryData(timezone);
    entry.timeForCalc = time;
    entry.duration = duration;
    entry.value = value;

    if (Utils.isEmpty(list)) {
      let e = new ProfileEntryData(timezone);
      e.timeForCalc = 0;
      e.duration = time;
      list.push(e);
      list.push(entry);
      e = new ProfileEntryData(timezone);
      e.timeForCalc = time + duration;
      e.duration = 86400 - e.timeForCalc;
      list.push(e);
      return;
    }

    // list = [];
    // const e = ProfileEntryData(timezone);
    // e.timeForCalc = 0;
    // e.duration = 86400;
    // e.value = 120;
    // list.add(e);
    // list.add(entry);

    let idx = list.findIndex((e) => e.timeForCalc >= time);
    // there is no profile entry after the mixin
    if (idx < 0) {
      idx = list.findIndex((e) => e.timeForCalc + e.duration >= time);
      if (idx < 0) {
        Utils.last(list).duration = time - Utils.last(list).timeForCalc;
        if (Utils.last(list).duration < 0) {
          list.splice(list.length - 1, 1);
        }
        entry.duration = 86400 - entry.timeForCalc;
        list.push(entry);
        return;
      }
      list.splice(idx, 0, entry);
      // if the nextentry begins before the inserted entry the next entry
      // is copied before the current entry.
      if (list[idx + 1].timeForCalc < entry.timeForCalc) {
        const e = list[idx + 1].copy;
        e.duration = entry.timeForCalc - e.timeForCalc;
        list.splice(idx, 0, e);
        idx++;
      }
      // if the inserted entry ends before the next entry starts
      // add the same entry before the inserted entry after the entry
      if (entry.timeForCalc + entry.duration < list[idx + 1].timeForCalc) {
        const e = list[idx - 1].copy;
        e.timeForCalc = entry.timeForCalc + entry.duration;
        e.duration = list[idx + 1].timeForCalc - e.timeForCalc;
        list.splice(idx + 1, 0, e);
        return;
      }
        // if the inserted entry ends after the next entry starts
      // change the main of the next entry
      else if (entry.timeForCalc + entry.duration > list[idx + 1].timeForCalc) {
        list[idx + 1].duration -= entry.timeForCalc + entry.duration - list[idx + 1].timeForCalc;
        list[idx + 1].timeForCalc = entry.timeForCalc + entry.duration;
      }
    } else if (idx > 0) {
      list[idx - 1].duration = time - list[idx - 1].timeForCalc;
      // there is a profile entry after the mixin
      let nextIdx = list.findIndex((e) => e.timeForCalc + e.duration >= time);
      while (nextIdx > idx + 1) {
        list.splice(idx, 1);
        nextIdx = list.findIndex((e) => e.timeForCalc + e.duration >= time);
      }
      list.splice(idx, 0, entry);
      // if the nextentry begins before the inserted entry the next entry
      // is copied before the current entry.
      if (list[idx + 1].timeForCalc < entry.timeForCalc) {
        const e = list[idx + 1].copy;
        e.duration = entry.timeForCalc - e.timeForCalc;
        list.splice(idx, 0, e);
        idx++;
      }
      // if the inserted entry ends before the next entry starts
      // add the same entry before the inserted entry after the entry
      if (entry.timeForCalc + entry.duration < list[idx + 1].timeForCalc) {
        const e = list[idx - 1].copy;
        e.timeForCalc = entry.timeForCalc + entry.duration;
        e.duration = list[idx + 1].timeForCalc - e.timeForCalc;
        list.splice(idx + 1, 0, e);
        return;
      }
        // if the inserted entry ends after the next entry starts
      // change the main of the next entry
      else if (entry.timeForCalc + entry.duration > list[idx + 1].timeForCalc) {
        list[idx + 1].duration -= entry.timeForCalc + entry.duration - list[idx + 1].timeForCalc;
        list[idx + 1].timeForCalc = entry.timeForCalc + entry.duration;
      }
    }
  }

  // include data from src in current profile
  mixWith(src: ProfileData): void {
    for (const key of Object.keys(this.store)) {
      // the store will be mixed with the same store from the source,
      // unless the key of the store is unknown. In this case the store
      // 'default' is used, if available.
      let srcKey = key;
      if (src.store[srcKey] == null) {
        srcKey = src.defaultProfile;
      }
      //      store[key].name = 'Hurz';

      if (src.store[srcKey] != null) {
        // remove all settings from given time up to duration.
        // if duration is 0 then remove all after given time.
        this.store[key].removeFrom(src.startDate.getHours(), src.startDate.getMinutes(), src.startDate.getSeconds(), src.duration);
        // add all settings after the given time from src.
        this.store[key].addFrom(src, src.store[srcKey]);
        //        store[key].name = '${store[key].name} - ${src.store[srcKey].name}';
      }
    }
  }
}
