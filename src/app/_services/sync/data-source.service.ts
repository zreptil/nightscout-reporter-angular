import {Injectable} from '@angular/core';
import {FitbitService} from '@/_services/sync/fitbit.service';
import {OAuth2Data} from '@/_model/oauth2-data';
import {OAuth2BaseService, OAuth2Service} from '@/_services/sync/oauth2.service';
import {HealthData} from '@/_model/nightscout/health-data';

@Injectable({
  providedIn: 'root'
})
export class DataSourceService {

  constructor(public os: OAuth2Service,
              private fs: FitbitService) {
  }

  async getActivities(oauth: OAuth2Data, begDate: Date, endDate: Date, list: HealthData[], onError?: (error: any) => void) {
    const srv = this.getService(oauth?.key);
    if (srv == null) {
      return;
    }
    try {
      const data = await srv.getActivities(begDate, endDate);
      for (const act of data) {
        this.updateActivity(act, list)
      }
    } catch (ex: any) {
      onError?.(ex?.message ?? ex);
    }
  }

  updateActivity(value: HealthData, list: HealthData[]) {
    let exists = false;
    for (const check of list) {
      if (check.equals(value)) {
        exists = true;
      }
    }
    if (!exists) {
      list.push(value);
    }
  }

  getService(key: string): OAuth2BaseService {
    switch (key) {
      case 'fitbit':
        return this.fs;
    }
    return null;
  }

  hasValidData(_key: string, _data: any) {

  }
}
