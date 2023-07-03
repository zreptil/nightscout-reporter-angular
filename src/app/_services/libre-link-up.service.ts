import {Injectable} from '@angular/core';
import {UserData} from '@/_model/nightscout/user-data';
import {GLOBALS} from '@/_model/globals-data';
import {LLU_API_ENDPOINTS} from '@/_model/libre-link-up/constants/llu-api-endpoints';
import {UrlData} from '@/_model/nightscout/url-data';
import {AuthTicket} from '@/_model/libre-link-up/interfaces/librelink/common';
import {Utils} from '@/classes/utils';
import {Log} from '@/_services/log.service';
import {DataService} from '@/_services/data.service';
import {HttpClient, HttpHeaders, HttpRequest} from '@angular/common/http';
import {LibreLinkUpHttpHeaders} from '@/_model/libre-link-up/interfaces/http-headers';
import {firstValueFrom} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LibreLinkUpService {

  authTicket: AuthTicket;
  userAgent = 'LibreLink Up Uploader NR';
  version = '4.7.0';
  product = 'llu.ios';

  constructor(public http: HttpClient,
              public ds: DataService) {
    this.deleteAuthTicket();
  }

  get user(): UserData {
    return GLOBALS.user;
  }

  get url(): UrlData {
    return this.user.urlDataFor(null);
  }

  get libreLinkUpUrl(): string {
    return LLU_API_ENDPOINTS[this.url.linkupRegion] ?? LLU_API_ENDPOINTS['EU'];
  }

  get libreLinkUpHttpHeaders(): any {
    return {
      'User-Agent': this.userAgent,
      'Content-Type': 'application/json',
      'version': this.version,
      'product': this.product,
      acceptEncoding: 'gzip, deflate, br',
      'Connection': 'keep-alive',
      pragma: 'no-cache',
      'Cache-Control': 'no-cache'
      // 'Authentication': undefined
    };
  }

  get lluAuthHeaders(): LibreLinkUpHttpHeaders {
    const authenticatedHttpHeaders = this.libreLinkUpHttpHeaders;
    authenticatedHttpHeaders.Authorization = `Bearer ${this.authenticationToken}`;
    Log.debug('authenticatedHttpHeaders: ' + JSON.stringify(authenticatedHttpHeaders));
    return authenticatedHttpHeaders;
  }

  private get authenticationToken(): string | null {
    if (this.authTicket?.token == null) {
      Log.warn('LLU: no authTicket.token');
    }

    return this.authTicket?.token;
  }

  async nightScoutHttpHeaders() {
    const apiSecret = await Utils.sha1(this.url.apiSecret);
    return {
      apiSecret: apiSecret,
      userAgent: this.userAgent,
      contentType: 'application/json'
    }
  }

  async login(): Promise<AuthTicket | null> {
    try {
      const url = `https://corg.zreptil.de/index.php?url=https://${this.libreLinkUpUrl}/llu/auth/login`;
      let header: string[] = [];
      for (const key of Object.keys(this.libreLinkUpHttpHeaders)) {
        header.push(`${key}: ${this.libreLinkUpHttpHeaders[key]}`);
      }
      const body = {
        email: this.url.linkupUsername,
        password: this.url.linkupPassword,
        header: Utils.join(header, `;`)
      };
      const req = new HttpRequest('POST', url, body, {
        headers: new HttpHeaders({
          'Content-Type': 'application/json'
        }),
        responseType: 'text'
      });

      this.http.request(req).subscribe(response => {
        console.log('Da ist was', req, response);
      });

      const response: any = await firstValueFrom(this.http.request(req));
      console.log('Hab was', response);
      try {
        if (response?.data?.status !== 0) {
          Log.error(`LLU - Non-zero status code: ${JSON.stringify(response.data)}`)
          return null;
        }
        if (response?.data?.data?.redirect === true && response?.data?.data?.region) {
          const correctRegion = response.data.data.region.toUpperCase();
          Log.error(
            `LLU - Logged in to the wrong region. Switch to '${correctRegion}' region.`
          );
          return null;
        }
        Log.info('LLU: Logged in to LibreLink Up');
        return response?.data?.data?.authTicket;
      } catch (err) {
        Log.error('LLU: Invalid authentication token. Please check your LibreLink Up credentials', err);
        return null;
      }
    } catch (error) {
      Log.error('LLU: Invalid credentials', error);
      return null;
    }
  }

  public async execute() {
    if (!this.hasValidAuthentication()) {
      Log.info('LLU: renew token');
      this.deleteAuthTicket();
      const authTicket = await this.login();
      if (authTicket == null) {
        Log.error('LLU - No AuthTicket received. Please check your credentials.');
        this.deleteAuthTicket();
        return;
      }
      this.authTicket = authTicket;
      console.log('HURRA, wir haben eins!!!', authTicket);
    }
  }

  private deleteAuthTicket(): void {
    this.authTicket = {duration: 0, expires: 0, token: ''};
  }

  private hasValidAuthentication(): boolean {
    if (this.authTicket.expires != null) {
      const currentDate = Math.round(new Date().getTime() / 1000);
      return currentDate < this.authTicket.expires;
    }

    Log.info('LLU: no authTicket.expires');
    return false;
  }
}
