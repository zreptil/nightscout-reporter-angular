import {JsonData} from '@/_model/json-data';
import {ProfileEntryData} from './profile-entry-data';
import {ProfileTimezone} from './profile-timezone-data';
import {Utils} from '@/classes/utils';
import {Log} from '@/_services/log.service';
import {ProfileData} from '@/_model/nightscout/profile-data';
import sha256 from 'fast-sha256';
import {Settings} from '@/_model/settings';

export class ProfileStoreData extends JsonData {
  dia: number;
  listCarbratio: ProfileEntryData[] = [];
  carbsHr: number;
  delay: number;
  maxPrecision: number = 0;
  listSens: ProfileEntryData[] = [];
  timezone: ProfileTimezone;
  listBasal: ProfileEntryData[] = [];
  listTargetLow: ProfileEntryData[] = [];
  listTargetHigh: ProfileEntryData[] = [];
  startDate: Date;
  units: string;

  constructor(public name: string) {
    super();
    this.timezone = new ProfileTimezone(Settings.refTimezone);
  }

  get ieBasalSum(): number {
    return this._listSum(this.listBasal);
  }

  get icrSum(): number {
    return this._listSum(this.listCarbratio);
  }

  get isfSum(): number {
    return this._listSum(this.listSens);
  }

  get carbRatioPerHour(): number {
    return (this.carbsHr ?? 0) > 0 ? this.carbsHr : 12;
  }

  get hash(): string {
    const temp = `${this.dia}-${this.carbsHr}-${this.list2String(this.listCarbratio)}-${this.list2String(this.listBasal)}-${this.list2String(this.listSens)}-` +
      `${this.list2String(this.listTargetHigh)}-${this.list2String(this.listTargetLow)}`;
    const encoder = new TextEncoder();
    const bytes = encoder.encode(temp);
    return `${sha256(bytes)}`;
    // return `${createHash('sha256').update(bytes.toString()).digest('hex')}`;
    // return `${sha1(bytes.toString())}`;
  }

  get copy(): ProfileStoreData {
    const ret = new ProfileStoreData(this.name);
    ret.fillFrom(this);
    ret.listBasal = JsonData.copyList(this.listBasal);
    ret.listCarbratio = JsonData.copyList(this.listCarbratio);
    ret.listSens = JsonData.copyList(this.listSens);
    ret.listTargetLow = JsonData.copyList(this.listTargetLow);
    ret.listTargetHigh = JsonData.copyList(this.listTargetHigh);
    return ret;
  }

  static _adjust(list: ProfileEntryData[]): void {
    list.sort((a, b) => Utils.compareDate(a._time, b._time));
    if (!Utils.isEmpty(list) && Utils.first(list)._time.getHours() != 0) {
      const first = Utils.last(list).copy;
      if (first.value === Utils.first(list).value) {
        Utils.first(list)._time = Utils.addTimeHours(Utils.first(list)._time, -first._time.getHours());
      } else {
        first._time = Utils.addTimeHours(first._time, -first._time.getHours());
        list.splice(0, 0, first);
      }
    }
    ProfileStoreData._adjustDuration(list);
  }

  static _adjustDuration(list: ProfileEntryData[]): void {
    // calculate the duration of the entries
    for (let i = 0; i < list.length; i++) {
      let end = 86400;
      if (i < list.length - 1) {
        end = list[i + 1].timeForCalc;
      }
      list[i].duration = end - list[i].timeForCalc;
    }
  }

  static fromJson(name: string, json: any, percentage: number, timeshift: number,
                  startDate: Date): ProfileStoreData {
    const ret = new ProfileStoreData(name);
    if (json == null) {
      return ret;
    }
    ret.dia = JsonData.toNumber(json.dia);
    ret.carbsHr = JsonData.toNumber(json.carbs_hr);
    ret.delay = JsonData.toNumber(json.delay);
    try {
      ret.timezone = new ProfileTimezone(JsonData.toText(json.timezone));
    } catch (ex) {
      ret.timezone = new ProfileTimezone(Settings.refTimezone);
      Log.error('fehler bei timezone');
    }
    // print('${JsonData.toText(json.timezone)} ${name} ${ret.timezone.name}');
    if (startDate.getFullYear() != 1970 || startDate.getDate() != 1 || startDate.getMonth() != 1) {
      ret.startDate = startDate;
    } else {
      ret.startDate = JsonData.toDate(json.startDate);
    }
    ret.units = JsonData.toText(json.units);
    for (const entry of json.carbratio ?? []) {
      ret.listCarbratio.push(ProfileEntryData.fromJson(entry, ret.timezone, timeshift, percentage, true));
    }
    this._adjust(ret.listCarbratio);
    for (const entry of json.sens ?? []) {
      ret.listSens.push(ProfileEntryData.fromJson(entry, ret.timezone, timeshift, percentage, true));
    }
    this._adjust(ret.listSens);
    ret.maxPrecision = 0;
    for (const entry of json.basal ?? []) {
      ret.listBasal.push(ProfileEntryData.fromJson(entry, ret.timezone, timeshift, percentage));
      ret.maxPrecision = Math.max(ret.maxPrecision, Utils.decimalPlaces(Utils.last(ret.listBasal).value));
    }
    this._adjust(ret.listBasal);
    for (const entry of json.target_low ?? []) {
      const value = ProfileEntryData.fromJson(entry, ret.timezone, timeshift);
      ret.listTargetLow.push(value);
    }
    this._adjust(ret.listTargetLow);
    for (const entry of json.target_high ?? []) {
      const value = ProfileEntryData.fromJson(entry, ret.timezone, timeshift);
      ret.listTargetHigh.push(value);
    }
    this._adjust(ret.listTargetHigh);
    return ret;
  }

  _listSum(list: ProfileEntryData[]): number {
    let ret = 0.0;
    for (const entry of list) {
      ret += (entry.value ?? 0) * (entry.duration ?? 0) / 3600;
    }
    return ret;
  }

  list2String(list: ProfileEntryData[]): string {
    const dst: string[] = [];
    for (const entry of list) {
      dst.push(entry.hash);
    }
    return Utils.join(dst, '|');
  }

  adjustDurations(): void {
    ProfileStoreData._adjustDuration(this.listCarbratio);
    ProfileStoreData._adjustDuration(this.listBasal);
    ProfileStoreData._adjustDuration(this.listTargetHigh);
    ProfileStoreData._adjustDuration(this.listTargetLow);
    ProfileStoreData._adjustDuration(this.listSens);
  }

  _importFromTime(time: Date, listSrc: ProfileEntryData[], listDst: ProfileEntryData[]): void {
    const date = new Date(time.getFullYear(), time.getMonth(), time.getDate());
    listSrc = listSrc.filter((p) => Utils.isAfter(p.endTime(date), time));
    if (Utils.isEmpty(listSrc)) {
      return;
    }
    listDst = listDst.filter((p) => Utils.isBefore(p.time(date), time));
    if (Utils.isEmpty(listDst)) {
      listDst.push(Utils.last(listSrc).copy);
    }
    Utils.last(listDst).duration = Utils.differenceInSeconds(time, Utils.last(listDst).time(date));
    Utils.first(listSrc).duration = Utils.differenceInSeconds(time, listSrc[0]._time);
    Utils.first(listSrc)._time = time;
    Utils.pushAll(listDst, listSrc);
  }

  importFromTime(time: Date, src: ProfileStoreData): void {
    this._importFromTime(time, src.listCarbratio, this.listCarbratio);
    this._importFromTime(time, src.listSens, this.listSens);
    this._importFromTime(time, src.listBasal, this.listBasal);
    this._importFromTime(time, src.listTargetLow, this.listTargetLow);
    this._importFromTime(time, src.listTargetHigh, this.listTargetHigh);
  }

  // remove all settings from given time up to duration.
  // if duration is 0 then remove all after given time.
  removeFrom(hour: number, minute: number, second: number, duration: number): void {
    const time = hour * 3600 + minute * 60 + second;
    this._removeFrom(this.listCarbratio, time, duration);
    this._removeFrom(this.listSens, time, duration);
    this._removeFrom(this.listBasal, time, duration);
    this._removeFrom(this.listTargetLow, time, duration);
    this._removeFrom(this.listTargetHigh, time, duration);
  }

  _removeFrom(list: ProfileEntryData[], time: number, duration: number): void {
    for (let i = 0; i < list.length; i++) {
      const check = list[i].timeForCalc;
      if (check >= time && (duration === 0 || check < time + duration)) {
        if (i > 0) {
          list[i - 1].duration = duration === 0
            ? 24 * 60 * 60 - list[i - 1].timeForCalc
            : duration + list[i].timeForCalc - list[i - 1].timeForCalc;
        }
        list.splice(i, 1);
        i--;
      }
    }
  }

  // remove all settings from given time up to duration.
  // if duration is 0 then remove all after given time.
  addFrom(src: ProfileData, srcStore: ProfileStoreData): void {
    this._addFrom(this.listCarbratio, src, srcStore.listCarbratio);
    this._addFrom(this.listSens, src, srcStore.listSens);
    this._addFrom(this.listBasal, src, srcStore.listBasal);
    this._addFrom(this.listTargetLow, src, srcStore.listTargetLow);
    this._addFrom(this.listTargetHigh, src, srcStore.listTargetHigh);
  }

  _addFrom(list: ProfileEntryData[], srcProfile: ProfileData, srcList: ProfileEntryData[]): void {
    const timeOfProfile =
      srcProfile.startDate.getHours() * 3600 + srcProfile.startDate.getMinutes() * 60 + srcProfile.startDate.getSeconds();
    for (let i = 0; i < srcList.length; i++) {
      const src = srcList[i].copy;
      const check = src.timeForCalc;
      if (srcProfile.duration === 0 || check < timeOfProfile + srcProfile.duration) {
        let duration = 86400 - check;
        if (i < srcList.length - 1) {
          duration = srcList[i + 1].timeForCalc - check;
        }
        if (check >= timeOfProfile) {
          if (!Utils.isEmpty(list)) {
            Utils.last(list).duration = src.timeForCalc - Utils.last(list).timeForCalc;
          }
          src.duration = 86400 - src.timeForCalc;
          list.push(src);
        } else if (check + duration > timeOfProfile) {
          src.duration -= timeOfProfile - src.timeForCalc;
          src.timeForCalc = timeOfProfile;
          list.push(src);
        }
      }
    }
  }
}
