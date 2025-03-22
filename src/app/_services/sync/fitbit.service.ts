import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {DataService} from '@/_services/data.service';
import {OAuth2Service} from '@/_services/sync/oauth2.service';
import {lastValueFrom, map, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {JsonData} from '@/_model/json-data';
import {HealthData} from '@/_model/nightscout/health-data';
import {Utils} from '@/classes/utils';

@Injectable({
  providedIn: 'root'
})
export class FitbitService extends OAuth2Service {
  authKey = 'fitbit';
  revokeUrl = 'https://api.fitbit.com/oauth2/revoke';

  constructor(http: HttpClient,
              ds: DataService) {
    super(http, ds);
  }

  public async getActivities(begDate: Date, endDate: Date): Promise<HealthData[]> {
    return this.readActivities(begDate, endDate, await this.dataFromCache());
    // let data = await this.dataFromCache();
    // console.log('data', data);
    // if (data != null) {
    //   const date = begDate.getTime();
    //   // console.log('fitbit data from localstorage', data);
    //   // console.log(data.activities.find((a: any) => JsonData.toDate(a.startTime)?.getTime() <= date));
    //   data = this.extractHealthData(data);
    //   return data;
    // }
    // const ed = Utils.fmtDate(Utils.addDateDays(endDate, 1), 'yyyy-MM-dd');
    // const url = `https://api.fitbit.com/1/user/-/activities/list.json?beforeDate=${ed}&sort=ascending&offset=0&limit=100`;
    // return lastValueFrom(this.getData(url).pipe(
    //   map(async (response: any) => {
    //     await this.dataToCache(response);
    //     data = this.extractHealthData(response);
    //     return data;
    //   }),
    //   catchError(_error => {
    //     return throwError(() => new Error('Fehler beim Abrufen der Fitbit-Daten'));
    //   })));
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

  private async readActivities(begDate: Date, endDate: Date, src?: any, healthList?: HealthData[]): Promise<HealthData[]> {
    if (src != null) {
      let data = await this.extractHealthData(src, healthList);
      // if begDate can be found in the healthdata we are done
      const date = Utils.dateAsNumber(begDate);
      if (data.some((d: HealthData) => d.startDate <= date)) {
        // console.log('src', src);
        return data;
      }
    }
    const ed = Utils.fmtDate(Utils.addDateDays(endDate, 1), 'yyyy-MM-dd');
    let url = `https://api.fitbit.com/1/user/-/activities/list.json?beforeDate=${ed}&sort=ascending&offset=0&limit=100`;
    // if src has a pagination then the next dataset has to be loaded
    if (src?.pagination != null) {
      url = src.pagination.next;
    }
    return lastValueFrom(this.getData(url).pipe(
      map(async (response: any) => {
        if (src != null) {
          // mix response in src
          src.pagination = response.pagination;
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
        return await this.readActivities(begDate, endDate, response);
      }),
      catchError(_error => {
        return throwError(() => new Error('Fehler beim Abrufen der Fitbit-Daten'));
      })));
  }
}
