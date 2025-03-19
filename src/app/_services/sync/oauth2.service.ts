import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {OAuth2} from '@/_services/sync/auth.config';
import {catchError, switchMap} from 'rxjs/operators';
import {GLOBALS} from '@/_model/globals-data';
import {DataService} from '@/_services/data.service';

@Injectable({
  providedIn: 'root'
})
export abstract class OAuth2Service {
  abstract authKey: string;
  abstract revokeUrl: string

  constructor(private http: HttpClient,
              private ds: DataService) {
  }

  oauth(key: string) {
    return GLOBALS.user.dataSources[key];
  }

  public revokeToken() {
    const body = new HttpParams().set('token', this.oauth(this.authKey).accessToken);

    const headers = new HttpHeaders({
      'Authorization': `Basic ${btoa(`${OAuth2[this.authKey].clientId}:${OAuth2[this.authKey].clientSecret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    this.http.post(this.revokeUrl, body, {headers}).subscribe(
      {
        next: _ => {
          delete (GLOBALS.user.dataSources[this.authKey]);
          this.ds.save();
        },
        error: (error => {
          delete (GLOBALS.user.dataSources[this.authKey]);
          this.ds.save();
          console.error('Fehler beim Widerrufen des Tokens:', error);
          return throwError(() => new Error('Token konnte nicht widerrufen werden.'));
        })
      });
  }

  // Daten abrufen
  protected getData(url: string): Observable<any> {
    if (this.oauth(this.authKey) == null || OAuth2[this.authKey] == null) {
      return throwError(() => new Error('Keine OAuth2-Daten vorhanden'));
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.oauth(this.authKey)?.accessToken}`,
      'Content-Type': 'application/json'
    });

    return this.http.get(url, {headers}).pipe(
      catchError(error => {
        if (error.status === 401) {
          return this.refreshAccessToken().pipe(
            switchMap(() => this.getData(url))
          );
        }
        console.error('Fehler beim Abrufen der Fitbit-Daten:', error);
        return throwError(() => new Error('Fehler beim Abrufen der Fitbit-Daten'));
      })
    );
  }

  private refreshAccessToken(): Observable<any> {
    const body = new URLSearchParams();
    body.set('grant_type', 'refresh_token');
    body.set('refresh_token', this.oauth(this.authKey).refreshToken);

    const headers = new HttpHeaders({
      'Authorization': `Basic ${btoa(`${OAuth2[this.authKey].clientId}:${OAuth2[this.authKey].clientSecret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http.post(OAuth2[this.authKey].tokenUrl, body.toString(), {headers}).pipe(
      switchMap((response: any) => {
        this.oauth(this.authKey).accessToken = response.access_token;
        this.oauth(this.authKey).refreshToken = response.refresh_token;
        this.ds.save();
        return response;
      }),
      catchError(error => {
        console.error('Fehler beim Token-Refresh:', error);
        return throwError(() => new Error('Fehler beim Token-Refresh'));
      })
    );
  }
}
