import {DayData} from '@/_model/nightscout/day-data';
import {TreatmentData} from './treatment-data';
import {EntryData} from '@/_model/nightscout/entry-data';
import {ActivityData} from '@/_model/nightscout/activity-data';
import {DeviceStatusData} from '@/_model/nightscout/device-status-data';
import {StatisticData} from './statistic-data';
import {Utils} from '@/classes/utils';
import {HealthData} from '@/_model/nightscout/health-data';

export class ListData {
  days: DayData[] = [];
  entries: EntryData[] = [];
  bloody: EntryData[] = [];
  remaining: EntryData[] = [];
  treatments: TreatmentData[] = [];
  devicestatusList: DeviceStatusData[] = [];
  activityList: ActivityData[] = [];
  healthList: HealthData[] = [];
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
  gri: number;
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

  entriesFor(deviceKey: string): EntryData[] {
    if (deviceKey === 'all') {
      return this.entries;
    }
    return this.entries.filter(e => Utils.isValidDevice(e, deviceKey));
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
}
