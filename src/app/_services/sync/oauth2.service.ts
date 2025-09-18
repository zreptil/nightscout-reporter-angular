import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {map, Observable, throwError} from 'rxjs';
import {GLOBALS} from '@/_model/globals-data';
import {DataService} from '@/_services/data.service';
import {HealthData} from '@/_model/nightscout/health-data';
import JSZip from 'jszip';
import {encode} from 'base64-arraybuffer';
import {OAuth2Data} from '@/_model/oauth2-data';
import {EnvironmentService} from '@/_services/environment.service';
import {Utils} from '@/classes/utils';
import {Log} from '@/_services/log.service';

// must be the same structure as the JSON returned from ngconfig.php
type OAuth2Type = {
  apiExplorerUrl: string;
  devAppUrl: string;
}

export type OAuth2List = { [key: string]: OAuth2Type }

@Injectable({
  providedIn: 'root'
})
export class OAuth2Service {
  oauthList: OAuth2List = {};

  constructor(private env: EnvironmentService,
              private ds: DataService) {
    this.ds.requestJson(`${this.env.backendUrl}/ngconfig.php`).then(result => {
      this.oauthList = result;
    })
  }

  extractUrlParams() {
    if (GLOBALS.user != null) {
      for (const key of Object.keys(this.oauthList ?? {})) {
        if (this.env.urlParams[key] != null) {
          try {
            const data: any = JSON.parse(Utils.decodeBase64(decodeURIComponent(this.env.urlParams[key])));
            const oauth2 = new OAuth2Data();
            oauth2.key = key;
            oauth2.accessToken = data.access_token;
            oauth2.refreshToken = data.refresh_token;
            oauth2.tokenExpires = Math.floor(new Date().getTime() / 1000) + data.expires_in;
            // userid ist set to empty when null, since the userid is checked for presence in the oauth2-data
            oauth2.userId = data.user_id ?? '';
            oauth2.scope = data.scope;
            GLOBALS.user.dataSources[oauth2.key] = oauth2;
            this.ds.save({skipReload: true});
            if (this.env.urlParams['debug'] === 'true') {
              GLOBALS.isDebug = true;
            } else {
              this.ds.reload();
            }
          } catch (ex) {
            console.log(this.env.urlParams[key]);
            console.log(Utils.decodeBase64(this.env.urlParams[key]));
            console.error('Error parsing OAuth2 data', ex);
          }
        }
      }
    }
  }
}

export abstract class OAuth2BaseService {
  abstract authKey: string;

  constructor(private http: HttpClient,
              private env: EnvironmentService,
              private ds: DataService,
              private os: OAuth2Service) {
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
    this.oauth(this.authKey).accessToken = null;
    const body = new HttpParams().set('revoke', this.oauth(this.authKey).accessToken ?? '');
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });
    this.http.post(`${this.env.backendUrl}/oauth.php?app=${this.authKey}&home=${window.location.href}`, body, {headers})
      .subscribe({
        next: (_data: any) => {
          delete (GLOBALS.user.dataSources[this.authKey]);
          this.ds.save();
        }
        , error: (error: any) => {
          console.error('something went wrong', error);
        }
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
      return null;
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

  // get data from service
  protected getData(cmd: string, params: any): Observable<any> {
    if (this.oauth(this.authKey) == null || this.os.oauthList[this.authKey] == null) {
      return throwError(() => new Error($localize`Keine OAuth2-Daten vorhanden`));
    }
    params ??= {};
    params.at = GLOBALS.user.dataSources[this.authKey]?.accessToken;
    params.rt = GLOBALS.user.dataSources[this.authKey]?.refreshToken;
    params.te = GLOBALS.user.dataSources[this.authKey]?.tokenExpires;
    const urlParams = new URLSearchParams(params).toString();
    const url = `${this.env.backendUrl}/oauth.php?app=${this.authKey}&home=${window.location.href}&cmd=${cmd}&${urlParams}`;
    Log.displayLink(this.authKey, url, {count: 0, type: 'debug'});
    return this.http.get(url).pipe(map((response: any) => {
      GLOBALS.user.dataSources[this.authKey].accessToken = response.at;
      GLOBALS.user.dataSources[this.authKey].refreshToken = response.rt;
      GLOBALS.user.dataSources[this.authKey].tokenExpires = response.te;
      this.ds.save();
      return response.response;
    }));
  }
}
