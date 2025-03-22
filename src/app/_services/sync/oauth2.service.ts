import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {OAuth2} from '@/_services/sync/auth.config';
import {catchError, switchMap} from 'rxjs/operators';
import {GLOBALS} from '@/_model/globals-data';
import {DataService} from '@/_services/data.service';
import {HealthData} from '@/_model/nightscout/health-data';
import JSZip from 'jszip';
import {encode} from 'base64-arraybuffer';
import {OAuth2Data} from '@/_model/oauth2-data';

@Injectable({
  providedIn: 'root'
})
export abstract class OAuth2Service {
  abstract authKey: string;
  abstract revokeUrl: string;

  constructor(private http: HttpClient,
              private ds: DataService) {
  }

  get msgErrorRefresh(): string {
    return $localize`Fehler beim Abruf der ${this.authKey}-Daten`;
  }

  get msgErrorData(): string {
    return $localize`Fehler beim Abruf der ${this.authKey}-Daten`;
  }

  get msgErrorToken(): string {
    return $localize`Fehler beim Widerruf des ${this.authKey}-Token`;
  }

  oauth(key: string) {
    GLOBALS.user.dataSources[key] ??= OAuth2Data.fromJson({
      key: key
    });
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
          delete GLOBALS.user.dataSources[this.authKey];
          GLOBALS.user.dataSources[this.authKey] = null;
          this.ds.save();
          console.error(this.msgErrorToken, error);
          return throwError(() => new Error(this.msgErrorToken));
        })
      });
  }

  public abstract getActivities(begDate: Date, endDate: Date): Promise<HealthData[]>;

  protected dataToCache(data: any, onDone?: () => any, onError?: (error: string) => void) {
    const zip = new JSZip();
    zip.file('f', JSON.stringify(data));
    zip.generateAsync({type: 'blob', compression: 'DEFLATE'})
      .then(blob => {
        blob.arrayBuffer()
          .then(buffer => {
            localStorage.setItem(this.authKey, encode(buffer));
            onDone?.();
          })
          .catch(error => {
            onError?.(error.message);
          });
      })
      .catch(error => {
        onError?.(error.message);
      });
  }

  protected async dataFromCache(onError?: (error: any) => void): Promise<any> {
    const src = localStorage.getItem(this.authKey);
    if (src == null) {
      onError?.($localize`Es gibt keine gespeicherten Daten`);
      return;
    }
    const zip = new JSZip();
    let packed: any
    try {
      packed = await zip.loadAsync(src, {base64: true});
      if (packed != null) {
        const f = await packed.file('f').async('string');
        return JSON.parse(f);
      }
    } catch (ex) {
      onError?.(ex);
    }
    return null;
  }

  // Daten abrufen
  protected getData(url: string): Observable<any> {
    if (this.oauth(this.authKey) == null || OAuth2[this.authKey] == null) {
      return throwError(() => new Error($localize`Keine OAuth2-Daten vorhanden`));
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
        console.error(this.msgErrorData, error);
        return throwError(() => new Error(this.msgErrorData));
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
        console.error(this.msgErrorRefresh, error);
        GLOBALS.user.dataSources[this.authKey] = null;
        return throwError(() => new Error(this.msgErrorRefresh));
      })
    );
  }
}
