import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {DataService} from '@/_services/data.service';
import {OAuth2Service} from '@/_services/sync/oauth2.service';
import {lastValueFrom, map, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {JsonData} from '@/_model/json-data';
import {HealthData} from '@/_model/nightscout/health-data';
import {Utils} from '@/classes/utils';
import {EnvironmentService} from '@/_services/environment.service';

@Injectable({
  providedIn: 'root'
})
export class FitbitService extends OAuth2Service {
  authKey = 'fitbit';

  constructor(http: HttpClient,
              env: EnvironmentService,
              ds: DataService) {
    super(http, env, ds);
  }

  public async getActivities(begDate: Date, endDate: Date): Promise<HealthData[]> {
    return this.readActivities(begDate, endDate, await this.dataFromCache());
  }

  async extractHealthData(json: any, ret: HealthData[] = []): Promise<HealthData[]> {
    for (const src of json.activities) {
      const data = new HealthData();
      data.createdAt = JsonData.toDate(src.lastModified);
      if (!ret.some((d: HealthData) => d.createdAt === data.createdAt)) {
        data.steps = src.steps;
        data.from = this.authKey;
        data.duration = src.duration;
        data.heartRate = src.averageHeartRate;
        const date = JsonData.toDate(src.startTime);
        data.startTime = date.getHours() * 60 + date.getMinutes();
        data.startDate = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
        data.distance = JsonData.toNumber(src.distance);
        ret.push(data);
      }
    }
    return ret;
  }

  private getMinMax(src: any): any {
    const ret = {min: new Date(), max: new Date(0)};
    for (const curr of src?.activities ?? []) {
      const c = new Date(curr.startTime);
      if (c < ret.min) {
        ret.min = c;
      }
      if (c > ret.max) {
        ret.max = c;
      }
    }
    return ret;
  }

  private async loadActivities(begDate: Date, endDate: Date, date: Date, dateKey: string, src: any, healthList: HealthData[]): Promise<HealthData[]> {
    switch (dateKey) {
      case 'beforeDate':
        date = Utils.addDateDays(date, 1);
        break;
      case 'afterDate':
        date = Utils.addDateDays(date, -1);
        break;
    }
    return lastValueFrom(this.getData('activities', {dateKey: dateKey, date: Utils.fmtDate(date, 'yyyy-MM-dd')}).pipe(
      map(async (response: any) => {
        const srcLimits = this.getMinMax(src);
        if (src != null) {
          // mix response in src
          for (const act of response.activities) {
            if (!src.activities.some((a: any) => a.logId === act.logId)) {
              src.activities.push(act);
            }
          }
        } else {
          src = response;
        }
        // save src to localStorage
        await this.dataToCache(src);
        const limits = this.getMinMax(src);
        if (srcLimits.min?.getTime() !== limits.min?.getTime()
          || srcLimits.max?.getTime() !== limits.max?.getTime()) {
          // console.log(srcLimits);
          // console.log(limits);
          // console.log(src);
          if (response.activities.length === 100) {
            return await this.readActivities(begDate, endDate, src);
          }
        }
        return await this.extractHealthData(src, healthList);
      }),
      catchError(_error => {
        return throwError(() => new Error('Fehler beim Abrufen der Fitbit-Daten'));
      }))
    );
  }

  private async readActivities(begDate: Date, endDate: Date, src?: any, healthList?: HealthData[]): Promise<HealthData[]> {
    if (src != null) {
      let data = await this.extractHealthData(src, healthList);
      const hasBeg = data.some((d: HealthData) => d.startDate <= Utils.dateAsNumber(begDate));
      const hasEnd = data.some((d: HealthData) => d.startDate >= Utils.dateAsNumber(endDate));
      // if begDate and endDate can be found in the healthdata we are done
      if (hasBeg && hasEnd) {
        return data;
      }
      const limits = this.getMinMax(src);
      // if begDate is not available then load previous data
      if (!hasBeg) {
        return this.loadActivities(begDate, endDate, limits.min, 'beforeDate', src, healthList);
      }
      // since endDate is not available load next data
      return this.loadActivities(begDate, endDate, limits.max, 'afterDate', src, healthList);
    }
    return this.loadActivities(begDate, endDate, endDate, 'beforeDate', src, healthList);
  }

  // https://api.fitbit.com/1/user/-/activities/tracker/distance/date/2024-03-10/2025-03-24.json
  // https://api.fitbit.com/1/user/-/activities/tracker/steps/date/2024-03-10/2025-03-24.json
  // https://dashboard.exercise.quest/
}
