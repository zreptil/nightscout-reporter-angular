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

type OAuth2Type = {
  apiExplorerUrl: string;
  devAppUrl: string;
}

export type OAuth2List = { [key: string]: OAuth2Type }

@Injectable({
  providedIn: 'root'
})
export abstract class OAuth2Service {
  abstract authKey: string;
  oauthList: OAuth2List = {};

  constructor(private http: HttpClient,
              private env: EnvironmentService,
              private ds: DataService) {
    this.ds.requestJson(`${this.env.backendUrl}/ngconfig.php`).then(result => {
      this.oauthList = result;
      this.extractUrlParams();
    })
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

  extractUrlParams() {
    if (GLOBALS.user != null) {
      for (const key of Object.keys(this.oauthList)) {
        if (this.env.urlParams[key] != null) {
          try {
            const data: any = JSON.parse(Utils.decodeBase64(decodeURIComponent(this.env.urlParams[key])));
            // {
            // "access_token":"eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyM1E0SzkiLCJzdWIiOiJCN0pCMloiLCJpc3MiOiJGaXRiaXQiLCJ0eXAiOiJhY2Nlc3NfdG9rZW4iLCJzY29wZXMiOiJyYWN0IiwiZXhwIjoxNzQyNDI0NTQ2LCJpYXQiOjE3NDIzOTU3NDZ9.PSHHBcMw9Q0mbpmjtJI1bRDUfzWtwqeh1rF9875l4G8",
            // "expires_in":28800,
            // "refresh_token":"c58c12a76ecf7baf07c40f89133a5264b5423e438055f86709e4b33a4712295b",
            // "scope":"activity",
            // "token_type":"Bearer",
            // "user_id":"B7JB2Z"
            // }
            /*{"access_token":"eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyM1E0SzkiLCJzdWIiOiJCN0pCMloiLCJpc3MiOiJGaXRiaXQiLCJ0eXAiOiJhY2Nlc3NfdG9rZW4iLCJzY29wZXMiOiJyc29jIHJzZXQgcmFjdCBybG9jIHJ3ZWkgcmhyIHJudXQgcnBybyByc2xlIiwiZXhwIjoxNzQzMTE1Nzg3LCJpYXQiOjE3NDMwODY5ODd9.x1OcqQ2ZTyCmfycT5sbcC9qpBfffuWqoTCwEdtwTQR0",
            "expires_in":28800,
            "refresh_token":"b2c65651cc1e5da3b4ffe6e9c59fa5a1017a6e95fb9fbc18e382840ec06ccd20",
            "scope":"nutrition social profile weight location sleep heartrate settings activity",
            "token_type":"Bearer",
            "user_id":"B7JB2Z"}
            * */
            const oauth2 = new OAuth2Data();
            oauth2.key = key;
            oauth2.accessToken = data.access_token;
            oauth2.refreshToken = data.refresh_token;
            oauth2.tokenExpires = Math.floor(new Date().getTime() / 1000) + data.expires_in;
            oauth2.userId = data.user_id;
            oauth2.scope = data.scope;
            GLOBALS.user.dataSources[oauth2.key] = oauth2;
            this.ds.save();
            this.ds.reload();
          } catch (ex) {
            console.log(this.env.urlParams[key]);
            console.log(Utils.decodeBase64(this.env.urlParams[key]));
            console.error('Error parsing OAuth2 data', ex);
          }
        }
      }
    } else {
      this.ds.reload();
    }
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
    this.http.post(`${this.env.backendUrl}/oauth.php?app=${this.authKey}`, body, {headers})
      .subscribe({
        next: (_data: any) => {
          delete (GLOBALS.user.dataSources[this.authKey]);
          this.ds.save();
        }
        , error: (error: any) => {
          console.error('Was ne Scheisse!', error);
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
    if (this.oauth(this.authKey) == null || this.oauthList[this.authKey] == null) {
      return throwError(() => new Error($localize`Keine OAuth2-Daten vorhanden`));
    }
    params ??= {};
    params.at = GLOBALS.user.dataSources[this.authKey]?.accessToken;
    params.rt = GLOBALS.user.dataSources[this.authKey]?.refreshToken;
    params.te = GLOBALS.user.dataSources[this.authKey]?.tokenExpires;
    const urlParams = new URLSearchParams(params).toString();
    const url = `${this.env.backendUrl}/oauth.php?app=${this.authKey}&cmd=${cmd}&${urlParams}`;
    return this.http.get(url).pipe(map((response: any) => {
      GLOBALS.user.dataSources[this.authKey].accessToken = response.at;
      GLOBALS.user.dataSources[this.authKey].refreshToken = response.rt;
      GLOBALS.user.dataSources[this.authKey].tokenExpires = response.te;
      this.ds.save();
      return response.response;
    }));
  }
}
