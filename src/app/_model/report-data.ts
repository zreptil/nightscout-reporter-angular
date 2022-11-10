import {ProfileData} from './nightscout/profile-data';
import {UserData} from './nightscout/user-data';
import {ProfileGlucData} from '@/_model/nightscout/profile-gluc-data';
import {TreatmentData} from './nightscout/treatment-data';
import {GLOBALS, GlobalsData} from './globals-data';
import {StatusData} from './nightscout/status-data';
import {Utils} from '@/classes/utils';
import {ProfileStoreData} from '@/_model/nightscout/profile-store-data';
import {ListData} from '@/_model/nightscout/list-data';

export class ReportData {
  error: Error;
  dayCount = -1;
  profiles: ProfileData[] = [];
  user: UserData;
  ns = new ListData();
  calc = new ListData();
  lastTempBasal: TreatmentData;
  status: StatusData;
  isForThumbs = false;
  isValid = false;

  constructor(public begDate: Date, public endDate: Date) {
  }

  get data(): ListData {
    return GLOBALS == null
      ? this.calc
      : GLOBALS.isDataSmoothing
        ? this.calc
        : this.ns;
  }

  isInPeriod(check: Date): boolean {
    if (Utils.isBefore(check, new Date(this.begDate.getFullYear(), this.begDate.getMonth(), this.begDate.getDate()))) {
      return false;
    }
    return Utils.isBefore(check, new Date(this.endDate.getFullYear(), this.endDate.getMonth(), this.endDate.getDate() + 1));
  }

  namedProfile(name: string): ProfileGlucData {
    const time = GlobalsData.now;
    let ret;
    let profile;
    for (let i = 0; i < this.profiles.length; i++) {

      for (const key of Object.keys(this.profiles[i].store)) {
        // print('$key - $name - ${profiles.length}');
        if (key === name) {
          profile = this.profiles[i].store[key];
        }
      }
    }
    if (profile != null) {
      const date = new Date(time.getFullYear(), time.getMonth(), time.getDate());
      ret = new ProfileGlucData(profile);
      ret.basal = ret.find(date, time, ret.store.listBasal);
      ret.carbRatio = ret.find(date, time, ret.store.listCarbratio);
      ret.sens = ret.find(date, time, ret.store.listSens);
      ret.targetHigh = this.status.settings.bgTargetTop;
      ret.targetLow = this.status.settings.bgTargetBottom;
      // for (const data in profile.values) {
      //   data.adjustDurations();
      // }
    }
    return ret;
  }

// get profile for a specific time
  profile(time: Date, treatments: TreatmentData[] = null, doMix = true): ProfileGlucData {
//    DateTime check = DateTime(time.year, time.month, time.day);
    let ret = new ProfileGlucData(new ProfileStoreData(`${time.toISOString()}`));
    let profile: ProfileData;

    let idx = -1;
    // find last profile that starts before the given time
    for (let i = 0; i < this.profiles.length; i++) {
      if (Utils.differenceInSeconds(this.profiles[i].startDate, time) <= 0) {
        idx = i;
      }
    }

    if (idx >= 0) {
      profile = this.profiles[idx].copy;
      idx++;
      // mix following profiles in
      while (idx < this.profiles.length && doMix) {
        const d = this.profiles[idx].startDate;
        // only profiles with same day as requested
        if (d.getFullYear() === time.getFullYear()
          && d.getMonth() === time.getMonth()
          && d.getDate() === time.getDate()) {
          profile.mixWith(this.profiles[idx]);
        }
        idx++;
      }
      if (treatments != null) {
        for (const t of treatments) {
          if (t.createdAt.getFullYear() === time.getFullYear()
            && t.createdAt.getMonth() === time.getMonth()
            && t.createdAt.getDate() === time.getDate()) {
            profile.includeTreatment(t);
          }
        }
      }
    } else {
      ret.targetHigh = 180.0;
      ret.targetLow = 70.0;
    }

    if (profile != null) {
      const date = new Date(time.getFullYear(), time.getMonth(), time.getDate());
      ret = new ProfileGlucData(profile.current);
      ret.basal = ret.find(date, time, ret.store.listBasal);
      ret.carbRatio = ret.find(date, time, ret.store.listCarbratio);
      ret.sens = ret.find(date, time, ret.store.listSens);
      ret.targetHigh = this.status.settings.bgTargetTop;
      ret.targetLow = this.status.settings.bgTargetBottom;
      for (const key of Object.keys(profile.store)) {
        profile.store[key].adjustDurations();
      }
    }

    return ret;
  }

  targetValue(time: Date): number {
    const profile = this.profile(time);
    const date = new Date(time.getFullYear(), time.getMonth(), time.getDate());
    let high = 180.0;
    if (!Utils.isEmpty(profile.store.listTargetHigh)) {
      for (let i = profile.store.listTargetHigh.length - 1; i >= 0; i--) {
        const tgt = profile.store.listTargetHigh[i];
        if (tgt.time(date).getTime() < time.getTime()) {
          high = tgt.value;
          break;
        }
      }
    }
    let low = 70.0;
    if (!Utils.isEmpty(profile.store.listTargetLow)) {
      for (let i = profile.store.listTargetLow.length - 1; i >= 0; i--) {
        const tgt = profile.store.listTargetLow[i];
        if (tgt.time(date).getTime() < time.getTime()) {
          low = tgt.value;
          break;
        }
      }
    }
    return (high + low) / 2;
  }
}
