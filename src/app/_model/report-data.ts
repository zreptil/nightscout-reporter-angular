import {ProfileData} from './nightscout/profile-data';
import {UserData} from './nightscout/user-data';
import {ProfileGlucData, ProfileParams} from '@/_model/nightscout/profile-gluc-data';
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
  // the profile for a given time
  timeProf: { [key: string]: ProfileGlucData } = {};
  user: UserData;
  ns = new ListData();
  calc = new ListData();
  lastTempBasal: TreatmentData;
  status: StatusData;
  isForThumbs = false;
  isValid = false;
  deviceList: string[] = [];
  deviceFilter: string[] = [];
  deviceDataList: string[] = [];
  mustReload = false;

  constructor(public begDate: Date, public endDate: Date) {
  }

  get data(): ListData {
    return GLOBALS == null
      ? this.calc
      : GLOBALS.isDataSmoothing
        ? this.calc
        : this.ns;
  }

  deviceLineConfig(key: string): any {
//    const colors = ['#000', '#444', '#666', '#888'];
    const colors = ['#000', '#648fff', '#785ef0', '#dc267f', '#fe6100', '#ffb000'];
    const lw = [0.03, 0.04, 0.05, 0.06, 0.07, 0.08];
    const idx = this.deviceList.findIndex(e => e === key);
    if (idx < 0) {
      return {color: colors[0], lw: lw[0]};
    }
    return {color: colors[idx % colors.length], lw: lw[idx % lw.length]};
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

  /**
   * Calculates the actual profile for a given time based on profile switches
   * and saved profiles.
   * @param time time to get the profile for
   * @param ret  parameters for the calculation, will be filled and returned
   */
  profile(time: Date, ret = new ProfileParams()): ProfileParams {
    const id = `${Utils.timeAsNumber(time)}${ret.treatments != null ? 't' : ''}`;
    if (!ret.skipCache) {
      const p = this.timeProf[id];
      if (p != null) {
        ret.profile = p;
        return ret;
      }
    }
    ret.profile = new ProfileGlucData(new ProfileStoreData(`${time?.toISOString()}`));
    let profile: ProfileData;

    let idx = -1;
    // find last profile that starts before the given time
    for (let i = ret.lastIdx; i < this.profiles.length; i++) {
      if (Utils.differenceInSeconds(this.profiles[i].startDate, time) <= 0) {
        idx = i;
      }
    }

    if (idx >= 0) {
      ret.lastIdx = idx > 0 ? idx - 1 : idx;
      profile = this.profiles[idx].copy;
      idx++;
      // mix following profiles in
      const check = Utils.dateAsNumber(time);
      while (idx < this.profiles.length && ret.doMix) {
        const d = this.profiles[idx].startDate;
        // only profiles with same day as requested
        if (Utils.dateAsNumber(d) === check) {
          // if (d?.getDate() === time?.getDate()
          //   && d?.getMonth() === time?.getMonth()
          //   && d?.getFullYear() === time?.getFullYear()) {
          profile.mixWith(this.profiles[idx]);
          idx++;
        } else {
          idx = this.profiles.length;
        }
      }
      if (ret.treatments != null) {
        for (const t of ret.treatments) {
          if (Utils.dateAsNumber(t.createdAt) === check) {
            profile.includeTreatment(t);
          }
        }
      }
    } else {
      ret.profile.targetHigh = 180.0;
      ret.profile.targetLow = 70.0;
    }

    if (profile != null) {
      const date = new Date(time?.getFullYear(), time?.getMonth(), time?.getDate());
      ret.profile = new ProfileGlucData(profile.current);
      ret.profile.basal = ret.profile.find(date, time, ret.profile.store.listBasal);
      ret.profile.carbRatio = ret.profile.find(date, time, ret.profile.store.listCarbratio);
      ret.profile.sens = ret.profile.find(date, time, ret.profile.store.listSens);
      ret.profile.targetHigh = this.status.settings.bgTargetTop;
      ret.profile.targetLow = this.status.settings.bgTargetBottom;
      for (const key of Object.keys(profile.store)) {
        profile.store[key].adjustDurations();
      }
    }
    if (!ret.skipCache) {
      this.timeProf[id] = ret.profile.copy;
    }
    return ret;
  }

  targetValue(time: Date): number {
    const profile = this.profile(time).profile;
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
