import {Injectable} from '@angular/core';
import {UserData} from '@/_model/nightscout/user-data';
import {GLOBALS} from '@/_model/globals-data';
import {LLU_API_ENDPOINTS} from '@/_model/libre-link-up/constants/llu-api-endpoints';
import {UrlData} from '@/_model/nightscout/url-data';
import {AuthTicket} from '@/_model/libre-link-up/interfaces/librelink/common';
import {Utils} from '@/classes/utils';
import {Log} from '@/_services/log.service';
import {HttpClient, HttpHeaders, HttpRequest} from '@angular/common/http';
import {LibreLinkUpHttpHeaders} from '@/_model/libre-link-up/interfaces/http-headers';
import {GraphData} from '@/_model/libre-link-up/interfaces/librelink/graph-response';
import {Entry} from '@/_model/libre-link-up/interfaces/nightscout/entry';
import {NIGHTSCOUT_TREND_ARROWS} from '@/_model/libre-link-up/constants/nightscout-trend-arrows';

// https://libreview-unofficial.stoplight.io/docs/libreview-unofficial/8i2x0tc4qumh2-authentication

@Injectable({
  providedIn: 'root'
})
export class LibreLinkUpService {
  authTicket: AuthTicket;
  userAgent = 'nightscout-reporter-librelinkup';
  version = '4.7';
  product = 'llu.android';
  updateGluc: () => void;
  private _timeoutHandler: any;
  private _nightscoutApiSecret: string;

  constructor(public http: HttpClient) {
    this.deleteAuthTicket();
  }

  private _isRunning: boolean;

  get isRunning(): boolean {
    return this._isRunning;
  }

  set isRunning(value: boolean) {
    this._isRunning = value;
    GLOBALS.lluAutoExec = false;
    if (value) {
      this.executeOnce();
      this.startScheduler();
    } else {
      clearTimeout(this._timeoutHandler);
      this._timeoutHandler = null;
    }
  }

  get user(): UserData {
    return GLOBALS.user;
  }

  get url(): UrlData {
    return this.user.urlDataFor(null);
  }

  get libreLinkUpUrl(): string {
    return `https://corg.zreptil.de/index.php?url=${LLU_API_ENDPOINTS[this.url.linkupRegion] ?? LLU_API_ENDPOINTS['EU']}`;
  }

  get libreLinkUpHttpHeaders(): any {
    return {
      accept: 'application/json',
      contentType: 'application/json',
      version: this.version,
      product: this.product,
      // connection: 'keep-alive',
      pragma: 'no-cache',
      cacheControl: 'no-cache',
      // acceptEncoding: 'gzip, deflate, br',
    };
  }

  get lluAuthHeaders(): LibreLinkUpHttpHeaders {
    const authenticatedHttpHeaders = this.libreLinkUpHttpHeaders;
    authenticatedHttpHeaders.Authorization = `Bearer ${this.authenticationToken}`;
    Log.debug('authenticatedHttpHeaders: ' + JSON.stringify(authenticatedHttpHeaders));
    return authenticatedHttpHeaders;
  }

  get nightscoutHttpHeaders(): any {
    return {
      'api-secret': this._nightscoutApiSecret,
      userAgent: this.userAgent,
      contentType: 'application/json'
    };
  }

  private get authenticationToken(): string | null {
    if (this.authTicket?.token == null) {
      Log.warn('LLU: no authTicket.token');
    }

    return this.authTicket?.token;
  }

  startScheduler(): void {
    let timeout = GLOBALS.lluTimeout ?? 5;
    if (timeout < 1) {
      timeout = 1;
    }
    this.initNightScoutHttpHeaders().then(_value => {
      this._timeoutHandler = setTimeout(() => {
        this.execute();
        this.startScheduler();
      }, timeout * 60000);
    });
  }

  async initNightScoutHttpHeaders() {
    this._nightscoutApiSecret = await Utils.sha1(this.url.apiSecret);
  }

  login(callback: (result: AuthTicket) => void, retry = true): void {
    try {
      const url = `${this.libreLinkUpUrl}/llu/auth/login`;
      const body = {
        email: this.url.linkupUsername,
        password: this.url.linkupPassword,
      };
      const req = new HttpRequest('POST', url, body, {
        headers: new HttpHeaders(this.libreLinkUpHttpHeaders)
      });
      let ret: any;
      this.http.request(req).subscribe({
          next: (response: any) => {
            ret = response?.body;
          }, error: (error: any) => {
            Log.error($localize`LLU: Fehler beim Login`, error);
            callback(null);
          },
          complete: () => {
            if (ret?.data?.redirect && ret?.data?.region != null) {
              this.url.linkupRegion = ret?.data?.region.toUpperCase();
              if (retry) {
                this.login(callback, false);
              } else {
                callback(null);
              }
              return;
            }
            console.log(ret);
            callback(ret?.data?.authTicket);
          }
        }
      );
    } catch (error) {
      Log.error($localize`LLU: Login war nicht möglich`, error);
      callback(null);
    }
  }

  public executeOnce(): void {
    this.initNightScoutHttpHeaders().then(_value => {
      this.execute();
    });
  }

  getGlucoseMeasurements(callback: (result: GraphData) => void): void {
    try {
      Log.debug($localize`LLU: hole Glukosedaten`);
      this.getPatientId((result: string) => {
        if (result == null) {
          callback(null);
          return;
        }
        const url = `${this.libreLinkUpUrl}/llu/connections/${result}/graph`;
        const req = new HttpRequest('GET', url, null, {
          headers: new HttpHeaders(this.lluAuthHeaders)
        });
        let ret: any;
        this.http.request(req).subscribe({
          next: (result: any) => {
            ret = result?.body?.data;
          }, error: (error) => {
            Log.error($localize`LLU: Fehler beim Ermitteln der Glukosedaten`, error);
            callback(null);
          }, complete: () => {
            callback(ret as GraphData);
          }
        });
      });
    } catch (error) {
      Log.error($localize`LLU: Fehler beim Ermitteln der Glukosedaten`, error);
      this.deleteAuthTicket();
      callback(null);
    }
  }

  getPatientId(callback: (result: string) => void): void {
    try {
      const url = `${this.libreLinkUpUrl}/llu/connections`;
      const req = new HttpRequest('GET', url, null, {
        headers: new HttpHeaders(this.lluAuthHeaders)
      });
      let ret: any;
      this.http.request(req).subscribe({
          next: (response: any) => {
            ret = response?.body?.data;
          },
          error: (_error: any) => {
          },
          complete: () => {
            const list = ret ?? [];
            if (list.length === 0) {
              Log.error($localize`LLU: Patientendaten konnte nicht ermittelt werden`);
              callback(null);
              return;
            }

            let found = list[0];
            if (list.length > 1) {
              found = list.find((e: any) => e.patiendId === this.url.linkupPatientId);
            }

            if (found != null) {
              callback(found.patientId);
              return
            }

            if (Utils.isEmpty(this.url.linkupPatientId)) {
              Log.error($localize`LLU: Es wurde keine Patienten-Id angegeben.`);
            } else {
              Log.error($localize`LLU: Die angegebene Patienten-Id wurde nicht gefunden.`);
            }

            callback(null);
          }
        }
      );
    } catch (error) {
      Log.error($localize`LLU: Fehler bei Ermittlung der Patientendaten`, error);
      this.deleteAuthTicket();
      callback(null);
    }
  }

  mapTrendArrow(value: number): string {
    switch (value) {
      case 1:
        return NIGHTSCOUT_TREND_ARROWS.singleDown;
      case 2:
        return NIGHTSCOUT_TREND_ARROWS.fortyFiveDown;
      case 3:
        return NIGHTSCOUT_TREND_ARROWS.flat;
      case 4:
        return NIGHTSCOUT_TREND_ARROWS.fortyFiveUp;
      case 5:
        return NIGHTSCOUT_TREND_ARROWS.singleUp;
      default:
        return NIGHTSCOUT_TREND_ARROWS.notComputable;
    }
  }

  lastEntryDate(callback: (result: Date) => void): void {
    const url = this.user.apiUrl(null, 'entries.json', {params: 'count=1'});
    const req = new HttpRequest('GET', url, null, {
//      headers: new HttpHeaders(this.nightscoutHttpHeaders)
    });
    let ret: any;
    this.http.request(req).subscribe({
      next: (response: any) => {
        ret = response?.body;
      }, error: (_error: any) => {

      }, complete: () => {
        console.log('lastEntryDate', ret?.[0]);
        if (ret?.[0] != null) {
          ret = new Date(ret[0].dateString);
        } else {
          ret = null;
        }
        callback(ret);
      }
    });
  }

  createFormattedMeasurements(data: GraphData, callback: (result: Entry[]) => void): void {
    const ret: Entry[] = [];
    const glucoseMeasurement = data.connection.glucoseMeasurement;
    console.log('glucoseMeasurement', glucoseMeasurement);
    const measurementDate = Utils.utcDateFromString(glucoseMeasurement.FactoryTimestamp);
    console.log('measurementDate', measurementDate);
    this.lastEntryDate((nsLastDate: Date) => {
      if (nsLastDate == null) {
        nsLastDate = new Date();
        nsLastDate.setFullYear(nsLastDate.getFullYear() - 1);
      }
      console.log('nsLastDate', nsLastDate);
      // Add the most recent measurement first
      if (measurementDate > nsLastDate) {
        ret.push({
          'type': 'sgv',
          'device': this.userAgent,
          'dateString': measurementDate.toISOString(),
          'date': measurementDate.getTime(),
          'direction': this.mapTrendArrow(glucoseMeasurement.TrendArrow),
          'sgv': glucoseMeasurement.ValueInMgPerDl
        });
      }
      console.log('data.graphData', data.graphData);
      for (const entry of data.graphData) {
        const entryDate = Utils.utcDateFromString(entry.FactoryTimestamp);
        if (entryDate > nsLastDate) {
          ret.push({
            'type': 'sgv',
            'device': this.userAgent,
            'dateString': entryDate.toISOString(),
            'date': entryDate.getTime(),
            'sgv': entry.ValueInMgPerDl
          });
        }
      }
      callback(ret);
    });
  }

  uploadToNightScout(data: GraphData): void {
    Log.debug($localize`LLU: verarbeite ${data.graphData.length} Glukosedaten`);
    this.createFormattedMeasurements(data, (entries: Entry[]) => {
      if (entries?.length > 0) {
        try {
          const url = this.user.apiUrl(null, 'entries');
          const req = new HttpRequest('POST',
            `https://corg.zreptil.de/index.php?url=${url}`,
            entries,
            {
              headers: new HttpHeaders(this.nightscoutHttpHeaders)
            });
          this.http.request(req).subscribe({
            next: (_response) => {
              // console.log('response', response);
            }, error: (error: any) => {
              Log.error($localize`LLU: Upload auf Nightscout fehlgeschlagen - ${error.message}`);
            }, complete: () => {
              const info = Utils.plural(entries.length, {
                1: $localize`einem Eintrag`,
                other: $localize`${entries.length} Einträgen`
              });
              Log.debug($localize`LLU: Upload von ${info} auf Nightscout erfolgreich`);
              this.updateGluc?.();
            }
          });
        } catch (ex: any) {
          // console.error('Mist2', ex);
          Log.error($localize`LLU: Upload auf Nightscout fehlgeschlagen - ${ex.message}`);
        }
      } else {
        Log.debug($localize`LLU: Keine Daten für den Upload vorhanden`);
      }
    });
    /*

      if (formattedMeasurements.length > 0)
      {
          logger.info("Trying to upload " + formattedMeasurements.length + " glucose measurement items to Nightscout");
          try
          {
              const url = getNightscoutUrl() + "/api/v1/entries"
              const response = await axios.post(
                  url,
                  formattedMeasurements,
                  {
                      headers: nightScoutHttpHeaders
                  });
              if (response.status !== 200)
              {
                  logger.error("Upload to NightScout failed ", response.statusText);
              }
              else
              {
                  logger.info("Upload of " + formattedMeasurements.length + " measurements to Nightscout succeeded");
              }
          } catch (error)
          {
              logger.error("Upload to NightScout failed ", error);
          }
      }
      else
      {
          logger.info("No new measurements to upload");
      }
  */
  }

  private execute(): void {
    if (!this.hasValidAuthentication()) {
      Log.debug($localize`LLU: hole neues Token`);
      this.deleteAuthTicket();
      this.login((result: AuthTicket) => {
        if (result == null) {
          Log.error($localize`LLU: Zugriff auf LibreLink Up verweigert - Bitte Konfiguration überprüfen`);
          this.deleteAuthTicket();
          return;
        }
        this.authTicket = result;
        this.executeInternal();
      });
    } else {
      this.executeInternal();
    }
  }

  private executeInternal(): void {
    this.getGlucoseMeasurements((result: GraphData) => {
      if (result != null) {
        this.uploadToNightScout(result);
      }
    });
  }

  private deleteAuthTicket(): void {
    this.authTicket = {duration: 0, expires: 0, token: ''};
  }

  private hasValidAuthentication(): boolean {
    if (this.authTicket.expires != null) {
      const currentDate = Math.round(new Date().getTime() / 1000);
      return currentDate < this.authTicket.expires;
    }

    Log.debug($localize`LLU: Authentifizierung des Zugriffs ist fehlgeschlagen`);
    return false;
  }
}
