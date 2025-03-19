import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {DataService} from '@/_services/data.service';
import {OAuth2Service} from '@/_services/sync/oauth2.service';
import {map, Observable, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';

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

  getSteps(): Observable<any> {
    let url = 'https://api.fitbit.com/1/user/-/activities/steps/date/{startDate}/{endDate}.json';
    const sd = new Date().toISOString().split('T')[0];
    const ed = new Date().toISOString().split('T')[0];
    url = url.replace('{startDate}', sd);
    url = url.replace('{endDate}', ed);
    return this.getData(url).pipe(
      map(response => response.activities),
      catchError(_error => {
        return throwError(() => new Error('Fehler beim Abrufen der Fitbit-Daten'));
      }));
  }

  // apiUrls: {
  //   profile: 'https://api.fitbit.com/1/user/-/profile.json',
  //   steps: ,
  //   distance: 'https://api.fitbit.com/1/user/-/activities/distance/date/{startDate}/{endDate}.json',
  //   calories: 'https://api.fitbit.com/1/user/-/activities/calories/date/{startDate}/{endDate}.json',
  //   trainings: 'https://api.fitbit.com/1/user/-/activities/date/{startDate}.json'
  // }

}
