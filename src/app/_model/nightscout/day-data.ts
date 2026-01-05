import {EntryData} from '@/_model/nightscout/entry-data';
import {TreatmentData} from '@/_model/nightscout/treatment-data';
import {DeviceStatusData} from '@/_model/nightscout/device-status-data';
import {ActivityData} from './activity-data';
import {ProfileEntryData} from './profile-entry-data';
import {Utils} from '@/classes/utils';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {JsonData} from '@/_model/json-data';
import {CalcIOBData} from './calc-iob-data';
import {ProfileGlucData} from '@/_model/nightscout/profile-gluc-data';
import {ReportData} from '@/_model/report-data';
import {CalcCOBData} from '@/_model/nightscout/calc-cob-data';
import {Settings} from '@/_model/settings';

export class DeviceData {
  lowCount = 0;
  normCount = 0;
  highCount = 0;
  stdLowCount = 0;
  stdNormCount = 0;
  stdHighCount = 0;
  entryCountValid = 0;
  entryCountInvalid = 0;
  min: number;
  max: number;
  mid: number;
  varianz = 0.0;

  constructor() {
    this.init();
  }

  init(): void {
    this.min = 10000.0;
    this.max = -10000.0;
    this.mid = 0.0;
    this.entryCountValid = 0;
    this.entryCountInvalid = 0;
    this.normCount = 0;
    this.highCount = 0;
    this.lowCount = 0;
    this.stdNormCount = 0;
    this.stdHighCount = 0;
    this.stdLowCount = 0;
    this.varianz = 0.0;
  }
}

type DeviceDataList = { [key: string]: DeviceData; }

export class DayData {
  prevDay: DayData;
  deviceData: DeviceDataList = {};
  carbCount = 0;
  carbs = 0;
  entries: EntryData[] = [];
  treatments: TreatmentData[] = [];
  devicestatusList: DeviceStatusData[] = [];
  activityList: ActivityData[] = [];

  constructor(public date: Date, public basalData: ProfileGlucData) {
    if (date == null) {
      this.date = new Date(0);
    } else {
      this.date = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    const entry = new EntryData();
    entry.type = 'mbg';
    entry.mbg = 123.0;
    entry.time = GlobalsData.now;
//    bloody.add(entry);
  }

  _bloody: EntryData[] = [];

  get bloody(): EntryData[] {
    return this._bloody;
  }

  _profile: ProfileEntryData[];

  get profile(): ProfileEntryData[] {
    if (this._profile != null) {
      return this._profile;
    }
    this._profile = [];
    if (Utils.isEmpty(this.basalData.store.listBasal)) {
      return this._profile;
    }

    // fill profile with datasets representing the profile for that day
    for (const entry of this.basalData.store.listBasal) {
      const temp = new ProfileEntryData(this.basalData.store.timezone, entry.time(this.date, true));
      temp.value = entry.value;
      temp.orgValue = entry.value;
      this._profile.push(temp);
    }
    if (this._profile[0].time(this.date, false).getHours() > 0) {
      const clone = this._profile[0].clone(new Date(this.date.getFullYear(), this.date.getMonth(), this.date.getDate(), 0, 0));
      this._profile.splice(0, 0, clone);
    }

    // sort the profile to have the entries in the correct order
    this._profile.sort((a, b) => Utils.compareDate(a.time(this.date), b.time(this.date)));
    let last = this._profile[0].copy;
    let lastTime = last.time(this.date);
    // fill profile with treatments of type 'temp basal' to get the actual basalrate
    for (const t of this.treatments) {
      if (!t.isTempBasal) {
        continue;
      }
      let doAdd = true;
      if (t.duration <= 0) {
        if (t.key600.toLowerCase().startsWith('resume')) {
          t.duration = 86399 - t.timeForCalc;
          t._percent = 0;
        } else {
          doAdd = false;
        }
      }

      if (doAdd) {
        const entry = ProfileEntryData.fromTreatment(this.basalData.store.timezone, t);
        // value null means this value has to be calculated in the next loop
        entry.value = null;
        this._profile.push(entry);
      }
    }
    // sort the profile to have the entries in the correct order
    this._profile.sort((a, b) => Utils.compareDate(a.time(this.date), b.time(this.date)));

    let isInserted = false;
    // calculate the values based on the profile data
    let firstValue = true;
    for (let i = 0; i < this._profile.length; i++) {
      const entry = this._profile[i];
      entry.orgValue = entry.value;
      // only work on entry-values that are null (inserted by the code above)
      if (entry.value == null && !firstValue) {
        // entry has to be calculated and has a preceding entry
        entry.orgValue = last.orgValue;
        entry.value = entry.adjustedValue(last.orgValue);

        const endTime = Utils.addTimeSeconds(entry.time(this.date), entry.duration);
        if (i < this._profile.length - 1) {
          if (Utils.isBefore(endTime, this._profile[i + 1].time(this.date))) {
            // entry ends before next entry starts
            const temp = new ProfileEntryData(this.basalData.store.timezone, endTime);
            if (i < this._profile.length - 2) {
              temp.duration = Utils.differenceInSeconds(this._profile[i + 2]._time, endTime);
            }
            temp.value = last.orgValue;
            temp.orgValue = last.orgValue;
            if (temp.value != null || temp.orgValue != null) {
              this._profile.splice(i + 1, 0, temp);
            }
          }
        } else if (i === this._profile.length - 1 &&
          Utils.isBefore(endTime, new Date(lastTime.getFullYear(), lastTime.getMonth(), lastTime.getDate(), 23, 59, 59))) {
          const temp = new ProfileEntryData(this.basalData.store.timezone, endTime);
          temp.transferCalcValues(last);
          temp.value = last.orgValue;
          temp.orgValue = last.orgValue;
          this._profile.push(temp);
        }
        isInserted = false;
      } else {
        // entry is from the base profile
        if (last.isCalculated && !isInserted) {
          isInserted = false;
          // if the last value was calculated check if the duration is still running
          const endTime = Utils.addTimeSeconds(lastTime, last.duration);
          if (Utils.isAfter(endTime, entry.time(this.date))) {
            const duration = Utils.differenceInSeconds(endTime, entry.time(this.date));
            const clone = entry.clone(Utils.addTimeSeconds(entry.time(this.date), duration));
            // transfer the calculationdata from the last entry
            entry.transferCalcValues(last);
            // recalculate the value based on the value from the profile
            entry.value = entry.adjustedValue(entry.orgValue);
            let currDuration = entry.duration;
            if (i < this._profile.length - 1) {
              currDuration = Utils.differenceInSeconds(this._profile[i + 1].time(this.date), entry.time(this.date));
            }
            if (duration < currDuration) {
              clone.duration = currDuration - duration;
              this._profile.splice(i + 1, 0, clone);
              isInserted = true;
            }
            entry.duration = duration;
          }
        }
      }
      last = entry;
      lastTime = last.time(this.date);
      firstValue = false;
    }

    // finalize the entries by recalculating their duration
    for (let i = 1; i < this._profile.length; i++) {
      this._profile[i - 1].duration = Utils.differenceInSeconds(this._profile[i]
        .time(this.date), this._profile[i - 1].time(this.date));
    }
    Utils.last(this._profile).duration = 86399 - Utils.last(this._profile).timeForCalc;
    this._profile = this._profile.filter((p) => p.duration !== 0);

    // join all entries that have the same value to one entry
    const ret: ProfileEntryData[] = [];
    for (let i = 1; i < this._profile.length; i++) {
      const prev = this._profile[i - 1];
      const curr = this._profile[i];
      if (prev.value === curr.value) {
        curr.duration += prev.duration;
        curr._time = prev._time;
      } else {
        ret.push(prev);
      }
    }
    ret.push(Utils.last(this._profile));
    this._profile = ret;

    return this._profile;
  }

  get avgInsulinPerDay(): any {
    let ret = 0.0;
    let count = 0;
    let dayCount = 0;
    let lastTime = new Date(2000);
    let dbg: any = {};
    let dbgDay: any = {};
    for (const entry of this.treatments) {
      if (Utils.isAfter(entry.createdAt, lastTime)) {
        dayCount++;
        dbgDay = {};
        dbg[`${entry.createdAt.getFullYear()}-${entry.createdAt.getMonth() + 1}-${entry.createdAt.getDate()}`] = dbgDay;
      }
      lastTime = new Date(entry.createdAt.getFullYear(), entry.createdAt.getMonth(), entry.createdAt.getDate(), 23, 59, 59);
      if (entry.insulin > 0) {
        dbgDay[`${entry.createdAt.getHours()}:${entry.createdAt.getMinutes()}:${entry.createdAt.getSeconds()}`] = {
          'insulin': entry.insulin
        };
        ret += entry.insulin;
        count++;
      }
    }
    return {'value': dayCount >= 1 ? ret / dayCount : 0.0, 'dbg': dbg};
  }

  get avgCarbsPerDay(): any {
    let ret = 0.0;
    let count = 0;
    let dayCount = 0;
    let lastTime = new Date(2000);
    let dbg: any = {};
    let dbgDay: any = {};
    for (const entry of this.treatments) {
      if (Utils.isAfter(entry.createdAt, lastTime)) {
        dayCount++;
        dbgDay = {};
        dbg[`${entry.createdAt.getFullYear()}-${entry.createdAt.getMonth() + 1}-${entry.createdAt.getDate()}`] = dbgDay;
      }
      lastTime = new Date(entry.createdAt.getFullYear(), entry.createdAt.getMonth(), entry.createdAt.getDate(), 23, 59, 59);
      if (entry.carbs > 0) {
        dbgDay[`${entry.createdAt.getHours()}:${entry.createdAt.getMinutes()}:${entry.createdAt.getSeconds()}`] = {'carbs': entry.carbs};
        ret += entry.carbs;
        count++;
      }
    }
    return {'value': dayCount >= 1 ? ret / dayCount : 0.0, 'dbg': dbg};
  }

  get avgCarbs(): number {
    return this.carbCount > 0 ? this.carbs / this.carbCount : 0;
  }

  get ieCorrectionSum(): number {
    let ret = 0.0;
    for (const entry of this.treatments) {
      if (!entry.isCarbBolus && !entry.isSMB) {
        ret += entry.bolusInsulin;
      }
    }
    return ret;
  }

  get ieCarbSum(): number {
    let ret = 0.0;
    for (const entry of this.treatments) {
      if (entry.isCarbBolus && !entry.isSMB) {
        ret += entry.bolusInsulin;
      }
    }
    return ret;
  }

  get ieSMBSum(): number {
    let ret = 0.0;
    for (const entry of this.treatments) {
      if (entry.isSMB) {
        ret += entry.bolusInsulin;
      }
//      if (entry.microbolus > 0) ret += entry.microbolus;
    }
    return ret;
  }

  get ieBolusSum(): number {
    let ret = 0.0;
    for (const entry of this.treatments) {
      ret += (entry.bolusInsulin ?? 0);
//      ret += (entry.microbolus ?? 0);
    }
    return ret;
  }

  get basalZeroDuration(): number {
    let ret = 0;
    for (const entry of this.profile) {
      if (entry.value === 0 && entry.duration != null) {
        ret += entry.duration;
      }
    }
    return ret;
  }

  avgGluc(deviceKey: string): number {
    let ret = 0.0;
    let count = 0;
    for (const entry of this.entriesFor(deviceKey)) {
      if (!entry.isGlucInvalid) {
        ret += entry.gluc;
        count++;
      }
    }
    return count > 0 ? ret / count : 0.0;
  }

  lowPrz(deviceKey: string): number {
    return this.entryCountValid(deviceKey) === 0 ? 0 : (GLOBALS.ppStandardLimits ? this.stdLowCount(deviceKey) : this.lowCount(deviceKey)) / this.entryCountValid(deviceKey) * 100;
  }

  normPrz(deviceKey: string): number {
    return this.entryCountValid(deviceKey) === 0 ? 0 : (GLOBALS.ppStandardLimits ? this.stdNormCount(deviceKey) : this.normCount(deviceKey)) / this.entryCountValid(deviceKey) * 100;
  }

  highPrz(deviceKey: string): number {
    return this.entryCountValid(deviceKey) === 0 ? 0 : (GLOBALS.ppStandardLimits ? this.stdHighCount(deviceKey) : this.highCount(deviceKey)) / this.entryCountValid(deviceKey) * 100;
  }

  minText(deviceKey: string): string {
    return this.min(deviceKey) === 10000 ? '' : `${this.min(deviceKey)}`;
  }

  maxText(deviceKey: string): string {
    return this.max(deviceKey) === -10000 ? '' : `${this.max(deviceKey)}`;
  }

  varK(deviceKey: string): number {
    return (this.deviceData[deviceKey]?.mid ?? 0) != 0 ? this.stdAbw(true, deviceKey) / this.deviceData[deviceKey].mid * 100 : 0;
  }

  entryCountValid(deviceKey: string): number {
    return this.deviceData[deviceKey]?.entryCountValid ?? 0;
  }

  lowCount(deviceKey: string): number {
    return this.deviceData[deviceKey]?.lowCount ?? 0;
  }

  normCount(deviceKey: string): number {
    return this.deviceData[deviceKey]?.normCount ?? 0;
  }

  highCount(deviceKey: string): number {
    return this.deviceData[deviceKey]?.highCount ?? 0;
  }

  stdLowCount(deviceKey: string): number {
    return this.deviceData[deviceKey]?.stdLowCount ?? 0;
  }

  stdNormCount(deviceKey: string): number {
    return this.deviceData[deviceKey]?.stdNormCount ?? 0;
  }

  stdHighCount(deviceKey: string): number {
    return this.deviceData[deviceKey]?.stdHighCount ?? 0;
  }

  varianz(deviceKey: string): number {
    return this.deviceData[deviceKey]?.varianz ?? 0;
  }

  min(deviceKey: string): number {
    return this.deviceData[deviceKey]?.min ?? 10000;
  }

  max(deviceKey: string): number {
    return this.deviceData[deviceKey]?.max ?? -10000;
  }

  mid(deviceKey: string): number {
    return this.deviceData[deviceKey]?.mid ?? 0;
  }

  entriesFor(deviceKey: string): EntryData[] {
    if (deviceKey === 'all') {
      return this.entries;
    }
    return this.entries.filter(e => Utils.isValidDevice(e, deviceKey));
  }

  stdAbw(isMGDL: boolean, deviceKey: string): number {
    let ret = Math.sqrt(this.varianz(deviceKey));
    if (!isMGDL) {
      ret = ret / 18.02;
    }
    return ret;
  }

  isSameDay(time: Date): boolean {
    if (this.date.getFullYear() != time.getFullYear()) {
      return false;
    }
    if (this.date.getMonth() != time.getMonth()) {
      return false;
    }
    return this.date.getDate() === time.getDate();
  }

  isSameDay_(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  }

  getBolusSum(isCarbBolus: boolean): number {
    let ret = 0.0;
    for (const entry of this.treatments) {
      if (entry.isCarbBolus === isCarbBolus) {
        ret += entry.bolusInsulin;
      }
    }
    return ret;
  }

  ieBasalSum(useStore: boolean): number {
    if (useStore) {
      return this.basalData.store.ieBasalSum;
    }
    let ret = 0.0;
    for (const entry of this.profile) {
      ret += (entry.value ?? 0) * (entry.duration ?? 0) / 3600.0;
    }
    return ret;
  }

  init(nextDay: DayData = null, keepProfile = false): void {
    this.deviceData = {};

    this.carbCount = 0;
    this.carbs = 0;
    const all = new DeviceData();
    this.deviceData = {'all': all};
    for (const entry of this.entries) {
      const dst = this.getDeviceData(entry.device);
      if (!entry.isGlucInvalid) {
        all.entryCountValid++;
        dst.entryCountValid++;
        if (JsonData.isLow(entry.gluc, this.basalData.targetLow)) {
          all.lowCount++;
          dst.lowCount++;
        } else if (JsonData.isHigh(entry.gluc, this.basalData.targetHigh)) {
          all.highCount++;
          dst.highCount++;
        } else {
          all.normCount++;
          dst.normCount++;
        }

        if (JsonData.isLow(entry.gluc, Settings.stdLow)) {
          all.stdLowCount++;
          dst.stdLowCount++;
        } else if (JsonData.isHigh(entry.gluc, Settings.stdHigh)) {
          all.stdHighCount++;
          dst.stdHighCount++;
        } else {
          all.stdNormCount++;
          dst.stdNormCount++;
        }
        all.mid += entry.gluc;
        dst.mid += entry.gluc;
        all.min = Math.min(all.min, entry.gluc);
        dst.min = Math.min(dst.min, entry.gluc);
        all.max = Math.max(all.max, entry.gluc);
        dst.max = Math.max(dst.max, entry.gluc);
      } else {
        all.entryCountInvalid++;
        dst.entryCountInvalid++;
      }
    }
    for (const key of Object.keys(this.deviceData)) {
      this.deviceData[key].mid = this.deviceData[key].entryCountValid === 0
        ? 0
        : this.deviceData[key].mid / this.deviceData[key].entryCountValid;
    }
    for (const entry of this.entries) {
      const dst = this.getDeviceData(entry.device);
      if (!entry.isGlucInvalid) {
        all.varianz += Math.pow(entry.gluc - all.mid, 2);
        dst.varianz += Math.pow(entry.gluc - dst.mid, 2);
      }
    }
    for (const key of Object.keys(this.deviceData)) {
      this.deviceData[key].varianz /= this.deviceData[key].entryCountValid;
    }
    for (const t of this.treatments) {
      if (t.carbs > 0) {
        this.carbCount++;
        this.carbs += t.carbs;
      }
    }
    if (!keepProfile) {
      this._profile = null;
    }
  }

  getDeviceData(deviceKey: string): DeviceData {
    if (this.deviceData[deviceKey] == null) {
      this.deviceData[deviceKey] = new DeviceData();
    }
    return this.deviceData[deviceKey];
  }

  findNearest(eList: EntryData[], tList: TreatmentData[], check: Date,
              glucoseType?: string, maxMinuteDiff = 30): any {
    eList ??= [];
    tList ??= [];
    if (Utils.isEmpty(eList) && Utils.isEmpty(tList)) {
      return null;
    }

    let ret: any;
    let retDiff = 10000;
    for (const entry of eList) {
      if (entry.gluc <= 0) {
        continue;
      }
      const time = new Date(check.getFullYear(), check.getMonth(), check.getDate(), entry.time.getHours(), entry.time.getMinutes());
      if (time.getTime() === check.getTime()) {
        return entry;
      }
      const diff = Math.abs(Utils.differenceInSeconds(time, check));

      if (diff < retDiff && diff <= maxMinuteDiff * 60) {
        ret = entry;
        retDiff = diff;
      }
    }
    const list = tList.filter((t) => t.isBloody);
    for (const treat of list) {
      const time = new Date(check.getFullYear(), check.getMonth(), check.getDate(), treat.createdAt.getHours(), treat.createdAt.getMinutes());
      if (time.getTime() === check.getTime()) {
        return treat;
      }
      const diff = Math.abs(Utils.differenceInSeconds(time, check));

      if (diff < retDiff && diff <= maxMinuteDiff * 60) {
        ret = treat;
        retDiff = diff;
      }
    }

    return ret;
  }

  iob(data: ReportData, time: Date, yesterday: DayData): CalcIOBData {
    let totalIOB = 0.0;
    let totalActivity = 0.0;
    let lastBolus;

    if (time == null) {
      return new CalcIOBData(0, 0, null);
    } //time = DateTime(0);

//    const check = time.millisecondsSinceEpoch;
    let check = time.getTime() - GLOBALS.ppMaxInsulinEffectInMS;
    let profile = data.profile(time).profile;

    let list: TreatmentData[] = [];
    if (yesterday != null) {
      Utils.pushAll(list, yesterday.treatments);
      /*
            const temp = yesterday.iob(
                data, DateTime(yesterday.date.year, yesterday.date.month, yesterday.date.day, 23, 59, 59), null);
            const t = TreatmentData();
            t.insulin = temp.iob;
            t.createdAt = DateTime(time.year, time.month, time.day, 0, 0, 0);
            list.add(t);
      */
    }
    Utils.pushAll(list, this.treatments);

    const totalSave = totalIOB;
    for (const t of list) {
//      if (!isSameDay_(t.createdAt, time) || t.createdAt.millisecondsSinceEpoch > check) continue;
      if (t.createdAt.getTime() < check) {
        // die Treatments ignorieren, deren Wirksamkeit auf jeden Fall zum Zeitpunkt "time" abgelaufen ist
        continue;
      }
      if (t.createdAt.getTime() > time.getTime()) {
        // die Treatments, die zum Zeitpunkt "time" noch gar nicht drin sind, ignorieren
        continue;
      }
      const tIOB = t.calcIOB(profile, time);
      if (tIOB != null && tIOB.iob != null) {
        if (tIOB.iob != 0) {
          lastBolus = t;
        }
        totalIOB += tIOB.iob;
      }

      // units: BG (mg/dl or mmol/l)
      if (tIOB != null && tIOB.activity != null) {
        totalActivity += tIOB.activity;
      }
    }

    if (totalIOB === totalSave) {
//        totalIOB = 20;
    }

    return new CalcIOBData(totalIOB, totalActivity, lastBolus);
  }

  calcIobTotal(data: ReportData, time: Date, yesterday: DayData): CalcIOBData {
    time ??= GlobalsData.now;

    return this.iob(data, time, yesterday);
  }

  cob(data: ReportData, time: Date, yesterday: DayData): CalcCOBData {
    let totalCOB = 0.0;
    let lastCarbs: TreatmentData;

    let isDecaying = false;
    let lastDecayedBy: Date = null;

    const check = time.getHours() * 3600 + time.getMinutes() * 60 + time.getSeconds();
    let profile = data.profile(time).profile;

    const list: TreatmentData[] = [];
    if (yesterday != null) {
      let prev = yesterday.cob(
        data, new Date(yesterday.date.getFullYear(), yesterday.date.getMonth(), yesterday.date.getDate(), 23, 59, 59), null);
      lastCarbs = prev.lastCarbs;
      const t = new TreatmentData();
      t._carbs = prev.cob;
      t.isECarb = false;
      t.createdAt = new Date(time.getFullYear(), time.getMonth(), time.getDate(), 0, 0, 0);
      list.push(t);
    }
    Utils.pushAll(list, this.treatments);

    for (const t of list) {
      if (!this.isSameDay_(t.createdAt, time) || t.timeForCalc > check) {
        continue;
      }

      if (t.carbs != null && t.carbs > 0) {
        const temp: any = {totalCOB: totalCOB, isDecaying: isDecaying, lastDecayedBy: lastDecayedBy};
        t.calcTotalCOB(data, yesterday, temp, profile, time, this.iob.bind(this));
        totalCOB = temp.totalCOB;
        isDecaying = temp.isDecaying;
        lastDecayedBy = temp.lastDecayedBy;
        lastCarbs = t;
      }
    }

    const t = new TreatmentData();
    t.createdAt = time;
    const temp = {totalCOB: totalCOB, isDecaying: isDecaying, lastDecayedBy: lastDecayedBy};
    t.calcTotalCOB(data, yesterday, temp, profile, time, this.iob.bind(this));
    totalCOB = temp.totalCOB;
    isDecaying = temp.isDecaying;
    lastDecayedBy = temp.lastDecayedBy;

    const sens = Utils.findLast(profile.store.listSens, (e) => e.timeForCalc <= check)?.value ?? 0.0;
    const carbRatio = Utils.findLast(profile.store.listCarbratio, (e) => e.timeForCalc <= check)?.value ?? 0.0;
    const rawCarbImpact = (isDecaying ? 1 : 0) * sens / carbRatio * profile.store.carbRatioPerHour / 60;

    return new CalcCOBData(lastDecayedBy, isDecaying, profile.store.carbRatioPerHour, rawCarbImpact, totalCOB, lastCarbs);
  }
}
