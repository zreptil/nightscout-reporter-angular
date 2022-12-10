import {DayData} from '@/_model/nightscout/day-data';
import {TreatmentData} from './treatment-data';
import {EntryData} from '@/_model/nightscout/entry-data';
import {ActivityData} from '@/_model/nightscout/activity-data';
import {DeviceStatusData} from '@/_model/nightscout/device-status-data';
import {StatisticData} from './statistic-data';
import {ReportData} from '@/_model/report-data';
import {JsonData} from '@/_model/json-data';
import {Utils} from '@/classes/utils';
import {Log} from '@/_services/log.service';
import {Settings} from '../settings';

export class ListData {
  days: DayData[] = [];
  entries: EntryData[] = [];
  bloody: EntryData[] = [];
  remaining: EntryData[] = [];
  treatments: TreatmentData[] = [];
  devicestatusList: DeviceStatusData[] = [];
  activityList: ActivityData[] = [];
  catheterCount: number;
  ampulleCount: number;
  sensorCount: number;
  khCount: number;
  khAdjust: number;
  khAdjustCount: number;
  ieBolusSum: number;
  ieBasalSumDaily: number;
  ieBasalSumStore: number;
  ieMicroBolusSum: number;
  gvi: number;
  gviIdeal: number;
  gviTotal: number;
  rms: number;
  pgs: number;
  stat: { [key: string]: StatisticData };
  min: number;
  max: number;
  validCount: number;
  addList: TreatmentData[] = [];

  get countValid(): number {
    return this.entries.filter((entry) => !entry.isGlucInvalid).length;
  }

  get countInvalid(): number {
    return this.entries.filter((entry) => entry.isGlucInvalid).length;
  }

  get medianGluc(): number {
    const list = [];
    for (const entry of this.entries) {
      if (!entry.isGlucInvalid) {
        list.push(entry.gluc);
      }
    }
    if (list.length % 2 === 0) {
      return (list[Math.floor(list.length / 2)] + list[Math.floor(list.length / 2 + 1)]) / 2;
    } else {
      return list[Math.floor((list.length + 1) / 2)];
    }
  }

  get avgGluc(): number {
    let ret = 0.0;
    let count = 0;
    for (const entry of this.entries) {
      if (!entry.isGlucInvalid) {
        ret += entry.gluc;
        count++;
      }
    }
    return (count > 0 ? ret / count : 0.0);
  }

  ieBasalSum(fromStore: boolean): number {
    return fromStore ? this.ieBasalSumStore : this.ieBasalSumDaily;
  }

  TDD(fromStore: boolean): number {
    return this.ieBolusSum + this.ieBasalSum(fromStore);
  }

  ieBolusPrz(fromStore: boolean): number {
    return this.TDD(fromStore) > 0 ? this.ieBolusSum / this.TDD(fromStore) * 100 : 0.0;
  }

  ieBasalPrz(fromStore: boolean): number {
    return this.TDD(fromStore) > 0 ? this.ieBasalSum(fromStore) / this.TDD(fromStore) * 100 : 0.0;
  }

  ieMicroBolusPrz(fromStore: boolean): number {
    return this.TDD(fromStore) > 0 ? this.ieMicroBolusSum / this.TDD(fromStore) * 100 : 0.0;
  }

  calcStatistics(data: ReportData): void {
    this.stat = {
      low: new StatisticData(0, 0),
      norm: new StatisticData(0, 0),
      high: new StatisticData(0, 0),
      stdLow: new StatisticData(1, Settings.stdLow),
      stdNorm: new StatisticData(Settings.stdLow, Settings.stdHigh),
      stdHigh: new StatisticData(Settings.stdHigh, 9999),
      stdVeryHigh: new StatisticData(Settings.stdVeryHigh, 9999),
      stdNormHigh: new StatisticData(Settings.stdHigh, Settings.stdVeryHigh),
      stdNormLow: new StatisticData(Settings.stdVeryLow, Settings.stdLow),
      stdVeryLow: new StatisticData(0, Settings.stdVeryLow),
    };
    this.min = 999999.0;
    this.max = -1.0;
    let last: EntryData = null;
    // calculation of gvi and rms based on
    // https://github.com/nightscout/cgm-remote-monitor/blob/master/lib/report_plugins/glucosedistribution.js#L150
    this.gvi = 0.0;
    this.gviIdeal = 0.0;
    this.gviTotal = 0.0;
    let glucTotal = 0.0;
    let rmsTotal = 0.0;
    let firstGluc: number = null;
    let lastGluc: number = null;
    let usedRecords = 0;
    this.validCount = 0;

    for (const day of this.days) {
      for (const entry of day.entries) {
        const glucData = data.profile(entry.time);
        this.stat['low'].max = glucData.targetLow; // - 0.0001;
        this.stat['norm'].min = glucData.targetLow;
        this.stat['norm'].max = glucData.targetHigh; // + 0.0001;
        this.stat['high'].min = glucData.targetHigh;
        this.stat['high'].max = 9999.9999;
        // noinspection PointlessBooleanExpressionJS
        if (glucData != null) {
          const gluc = entry.gluc;
          if (gluc > 0) {
            this.validCount++;
            for (const key of Object.keys(this.stat)) {
              // if (gluc >= stat[key].min && gluc < stat[key].max)
              if (JsonData.isNorm(gluc, this.stat[key].min, this.stat[key].max)) {
                this.stat[key].add(entry, gluc);
              }
            }
            if (gluc < this.min) {
              this.min = entry.gluc;
            }
            if (gluc > this.max) {
              this.max = entry.gluc;
            }
          }
        }

        firstGluc ??= entry.gluc;
        lastGluc = entry.gluc;
        if (last == null) {
          glucTotal += entry.gluc;
        } else {
          const timeDelta = Utils.differenceInMilliseconds(entry.time, last.time);
          if (timeDelta <= 6 * 60000 && entry.gluc > 0 && last.gluc > 0) {
            usedRecords++;
            const delta = entry.gluc - last.gluc;
//          deltaTotal += delta;
//          total += delta;
//          if (delta >= t1)t1Count++;
//          if (delta >= t2)t2Count++;
            this.gviTotal += Math.sqrt(25 + Math.pow(delta, 2));
            glucTotal += entry.gluc;
            if (entry.gluc < glucData.targetLow) {
              rmsTotal += Math.pow(glucData.targetLow - entry.gluc, 2);
            }
            if (entry.gluc > glucData.targetHigh) {
              rmsTotal += Math.pow(entry.gluc - glucData.targetHigh, 2);
            }
          }
        }
        last = entry;
      }
    }

    let gviDelta = lastGluc - firstGluc;
    this.gviIdeal = Math.sqrt(Math.pow(usedRecords * 5, 2) + Math.pow(gviDelta, 2));
    this.gvi = this.gviIdeal != 0 ? this.gviTotal / this.gviIdeal : 0.0;
    this.rms = Math.sqrt(rmsTotal / usedRecords);
    let tirMultiplier = this.validCount === 0 ? 0.0 : this.stat['stdNorm'].values.length / this.validCount;
    this.pgs = this.gvi * (glucTotal / usedRecords) * (1.0 - tirMultiplier);

    for (const key of Object.keys(this.stat)) {
      this.stat[key].varianz = 0.0;
      for (const v of this.stat[key].values) {
        this.stat[key].varianz += Math.pow(v - this.stat[key].mid, 2);
      }
      this.stat[key].varianz /= this.stat[key].values.length;
    }
  }

  extractData(data: ReportData): void {
    this.catheterCount = 0;
    this.ampulleCount = 0;
    this.sensorCount = 0;
    this.khCount = 0.0;
    this.khAdjust = 0.0;
    this.khAdjustCount = 0;
    this.ieBolusSum = 0.0;
    this.ieMicroBolusSum = 0.0;
    const allEntries: EntryData[] = [];
    Utils.pushAll(allEntries, this.entries);
    Utils.pushAll(allEntries, this.bloody);
    Utils.pushAll(allEntries, this.remaining);
    allEntries.sort((a, b) => Utils.compareDate(a.time, b.time));
    if (Utils.isEmpty(allEntries)) {
      return;
    }

    let lastDay: Date = null;
    this.days = [];
    for (const entry of allEntries) {
      if (entry.isInvalidOrGluc0) {
        continue;
      }

      const glucData = data.profile(entry.time);
      if (lastDay == null || entry.time.getDate() != lastDay.getDate()) {
        this.days.push(new DayData(entry.time, glucData));
        lastDay = entry.time;
      }
      if (entry.type === 'mbg') {
        Utils.last(this.days).bloody.push(entry);
      } else {
        Utils.last(this.days).entries.push(entry);
      }
    }

    const check = new Date(this.days[0].date.getFullYear(), this.days[0].date.getMonth(), this.days[0].date.getDate() + 1);
    this.entries = this.entries.filter((e) => !Utils.isBefore(e.time, check));
    this.bloody = this.bloody.filter((e) => !Utils.isBefore(e.time, check));
    this.remaining = this.remaining.filter((e) => !Utils.isBefore(e.time, check));

    this.khCount = 0.0;
    this.ieBolusSum = 0.0;
    this.catheterCount = 0;
    this.ampulleCount = 0;
    this.sensorCount = 0;
    let eCarbs = 0.0;
    let delay = 0;
    this.treatments.sort((a, b) => Utils.compareDate(a.createdAt, b.createdAt));

    if (Utils.isEmpty(this.addList)) {
      let lastIdx = -1;
      for (let i = 0; i < this.treatments.length; i++) {
        const t1 = this.treatments[i];
        if (!t1.isTempBasal) {
          continue;
        }
        const t = lastIdx === -1 ? data.lastTempBasal : this.treatments[lastIdx];
        if (t == null) {
          continue;
        }
        lastIdx = i;

        const duration = Utils.differenceInSeconds(t1.createdAt, t.createdAt);
        // if duration of current treatment is longer than the difference between
        // next treatment and current treatment then cut the duration of current
        // treatment to the difference
        if (duration < t.duration) {
          t.duration = duration;
        }

        // if next treatment is in the next day, cut current duration so that the
        // end is at end of the day and insert a new treatment with the duration
        // up to the next treatment
        const date = Utils.addDateDays(t.createdAt, 1);
        if (date.getDate() === t1.createdAt.getDate() && date.getMonth() === t1.createdAt.getMonth() && date.getFullYear() === t1.createdAt.getFullYear()) {
          const newTreat = t.copy;
          newTreat.createdAt = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0);
          const duration = 86399 - t.timeForCalc;
          newTreat.duration -= duration;
          if (newTreat.duration > 0) {
            t.duration = duration;
            this.addList.push(newTreat);
          }
        }
      }
      if (!Utils.isEmpty(this.addList)) {
        Utils.pushAll(this.treatments, this.addList);
        this.treatments.sort((a, b) => Utils.compareDate(a.createdAt, b.createdAt));
      }
    }

    for (let i = 0; i < this.treatments.length; i++) {
      const t = this.treatments[i];
      const type = t.eventType.toLowerCase();
      if (t.isSiteChange) {
        this.catheterCount++;
      }
      if (t.isInsulinChange) {
        this.ampulleCount++;
      }
      if (t.isSensorChange) {
        this.sensorCount++;
      }
      if (type === 'note' && t.notes.toLowerCase().startsWith('ecarb')) {
        Log.todo('ListData.extractData muss noch überprüft werden', 'Ausgewerteter Wert:', t.notes);
        // const rex = /[^0-9\-]*(-*\d*)[^0-9\-]*(-*\d*)[^0-9\-]*(-*\d*).*/g;
        const rex = /[^0-9\-]*(?<eCarbs>-*\d*)[^0-9\-]*(?<egal>-*\d*)[^0-9\-]*(?<delay>-*\d*).*/;
        const matches = t.notes.match(rex);
        if (matches?.groups != null) {
          eCarbs = Utils.parseNumber(matches.groups['eCarbs']) ?? 0;
          delay = Utils.parseNumber(matches.groups['delay']) ?? 0;
          if (delay < 0) {
            for (let j = i - 1; j >= 0 && eCarbs > 0.0; j--) {
              const t1 = this.treatments[j];
              if (t1.isMealBolus && t1.carbs < 10.0) {
                eCarbs -= t1.carbs;
                t1.isECarb = true;
              }
            }
          }
        }
      }

      if (t.isMealBolus && eCarbs != null && eCarbs > 0.0 && t.carbs < 10.0) {
        eCarbs -= t.carbs;
        t.isECarb = true;
      }

      const idx = this.days.findIndex((d) => d.isSameDay(JsonData.toLocal(t.createdAt)));
      if (idx >= 0) {
        this.days[idx].treatments.push(t);
      }

      if (!data.isInPeriod(t.createdAt)) {
        continue;
      }

      this.khCount += t.carbs;
      this.ieBolusSum += t.bolusInsulin;
      this.ieMicroBolusSum += t.microbolus; // / 3600 * t.duration;
    }
    this.ieBasalSumDaily = 0.0;
    this.ieBasalSumStore = 0.0;
    for (let i = 1; i < this.days.length; i++) {
      const day = this.days[i];
      day.prevDay = i > 0 ? this.days[i - 1] : null;
      day.init((i < this.days.length - 1 ? this.days[i + 1] : null));

      this.ieBasalSumStore += day.ieBasalSum(true);
      this.ieBasalSumDaily += day.ieBasalSum(false);
      day.devicestatusList = [];
      Utils.pushAll(day.devicestatusList, this.devicestatusList.filter((ds) => day.isSameDay(JsonData.toLocal(ds.createdAt))));
      day.activityList = [];
      Utils.pushAll(day.activityList, this.activityList.filter((ac) => day.isSameDay(JsonData.toLocal(ac.createdAt))));
    }
    // the last day before the period was added at the beginning.
    // Now it has to be removed.
    if (!Utils.isEmpty(this.days) && Utils.isBefore(this.days[0].date, data.begDate)) {
      this.days.splice(0, 1);
    }

    // injectionList = InsulinInjectionList();
    // for (const day of days) {
    //   for (const t of day.treatments) {
    //     if (t.multipleInsulin != null) {
    //       injectionList = injectionList.add2List(t.multipleInsulin);
    //     }
    //   }
    // }
    this.calcStatistics(data);
  }
}
