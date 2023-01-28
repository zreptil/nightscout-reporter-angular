import {Injectable} from '@angular/core';
import {EnvironmentService} from '@/_services/environment.service';
import {HttpClient, HttpHeaders, HttpRequest} from '@angular/common/http';
import {encode as base64encode} from 'base64-arraybuffer';
import {Oauth2pkce} from '@/_services/sync/oauth2pkce';
import {lastValueFrom, Observable, of} from 'rxjs';

enum oauthStatus {
  none,
  accessDenied,
  accessToken,
  hasAccessToken
}

export enum dbsStatus {
  ok,
  error,
  info
}

export class DBSStatus {
  constructor(public status?: dbsStatus,
              public text?: string) {
  }
}

@Injectable({
  providedIn: 'root'
})
export class DropboxService {
  // the status is used to enable or disable methods
  // depending on the work that has to be done
  // during oauth-workflow
  status: oauthStatus = oauthStatus.none;
  lastStatus: DBSStatus = new DBSStatus();
  private oauth2Url: string;

  constructor(public env: EnvironmentService,
              public http: HttpClient) {
    this.checkUrlParams();
  }

  requestHeader(headers: any): HttpHeaders {
    return new HttpHeaders({
      authorization: `Bearer ${this.loadCredentials().at}`,
      ...headers
    });
  }

  /**
   * reads the credentials from storage.
   * can be overwritten from outside of this component
   * to retrieve the accesss_token from elsewhere.
   */
  getCredentialsFromStorage(): string {
    return localStorage.getItem('oauth2');
  }

  /**
   * writes the credentials to storage.
   * can be overwritten from outside of this component
   * to place the accesss_token elsewhere.
   */
  setCredentialsToStorage(value: string): void {
    localStorage.setItem('oauth2', value);
  }

  disconnect(): void {
    this.setCredentialsToStorage(null);
  }

  connect(): void {
    if (this.status !== oauthStatus.none) {
      return;
    }
    let codeVerifier = '';
    // codeVerfier has to be a random sequence and has to match
    // regex [0-9a-zA-Z\-\.\_\~], {43,128}
    const len = Math.floor(Math.random() * (128 - 43) + 43);
    const src = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-._~';
    for (let i = 0; i < len; i++) {
      const pos = Math.floor(Math.random() * src.length);
      codeVerifier += src[pos];
    }
    this.generateCodeChallenge(codeVerifier).then(code_challenge => {
      const params = [
        `client_id=${this.env.DROPBOX_APP_KEY}`,
        `redirect_uri=${location.origin}`,
        `response_type=code`,
        // `reject_cors_preflight=true`,
        `code_verifier=${codeVerifier}`,
        `code_challenge=${code_challenge}`,
        'code_challenge_method=S256'
      ];
      const url = `https://www.dropbox.com/oauth2/authorize?${params.join('&')}`;
      const oauth2 = new Oauth2pkce();
      this.startOauth2Workflow().subscribe(oauth2 => {
        if (oauth2.doSignin) {
          location.href = url;
        }
      });
    });
  }

  /**
   * get information for the start of the oauth2 workflow.
   * can be overwritten from outside of this component
   * to show the user information before leaving the
   * current page and to provide this component with
   * the information needed.
   */
  startOauth2Workflow(): Observable<Oauth2pkce> {
    const ret = new Oauth2pkce();
    ret.doSignin = true;
    return of(ret);
  }

  /**
   * download a file from dropbox.
   *
   * @param filename name of the file to upload (containig path)   */
  async downloadFile(filename: string) {
    let ret: any = null;
    try {
      let url = 'https://content.dropboxapi.com/2/files/download';
      const req = new HttpRequest('POST', url, null, {
        headers: this.requestHeader({
          'Dropbox-API-Arg': JSON.stringify({
            path: `/${filename}`
          }),
          'content-type': 'application/octet-stream'
        })
      });
      const response: any = await lastValueFrom(this.http.request(req));
      ret = response?.body;
      this.lastStatus = new DBSStatus(dbsStatus.info, $localize`Die Datei ${filename} wurde von Dropbox heruntergeladen.`);
    } catch (ex) {
      console.error('error when downloading file from Dropbox', ex);
    }
    return ret;
  }

  isSameContent(src: any, dst: any): boolean {
    return src === dst;
  }

  /**
   * upload a file to dropbox. it will try to see, if the file is already there and if the
   * content is different before uploading. the method isSameContent of this instance can
   * be overwritten to implement an own logic for the comparison.
   *
   * @param filename name of the file to upload (containig path)
   * @param content content of the file to upload
   */
  async uploadFile(filename: string, content: string) {
    try {
      const check = await this.downloadFile(filename);
      if (this.isSameContent(check, content)) {
        this.lastStatus = new DBSStatus(dbsStatus.info, $localize`Die Datei ${filename} wurde nicht hochgeladen, da sich der Inhalt nicht geändert hat.`);
        console.log(this.lastStatus.text);
        return;
      }
      let url = `https://content.dropboxapi.com/2/files/upload`;
      const req = new HttpRequest('POST', url, content, {
        headers: this.requestHeader({
          'Dropbox-API-Arg': JSON.stringify({
            autorename: false,
            mode: 'overwrite',
            mute: true, // no notification of the user for a change in dropbox
            path: `/${filename}`, strict_conflict: false
          }),
          'content-type': 'application/octet-stream'
        })
      });
      const response: any = await lastValueFrom(this.http.request(req));
      this.lastStatus = new DBSStatus(dbsStatus.info, $localize`Die Datei ${filename} wurde auf Dropbox hochgeladen.`);
    } catch (ex) {
      console.error('error when uploading file to Dropbox', ex);
    }
  }

  /**
   * loads the credentials from storage and converts them
   * to a datastructure that can be used internal by this
   * component.
   *
   * @private
   */
  private loadCredentials(): any {
    const src = this.getCredentialsFromStorage();
    // const src = '9JyaVRHcFpHNSlEOnhje1x0Y54WdpJ1VkFVUrB1bZlHNRRlQMlUe24GUU'
    // + 'ZDbEZjc510TzEVZIlUT2N1QSl0UJNUcPd2TPtWQQNEZp52QIF3QXhUUYZ2cyIDbfNWd'
    // + '3EXZwpXNjZVWFNkTXt2N2ZVaItkUsZkd4JGW0kHdSVFMOJFMB9WYihleYJkLsNnI6IC'
    // + 'dhJCLigDcYhENC50aEBVLXlHN1tWOFVjUUtkNB5nVSlDcMB3azoERJJHSzRGdzxWONJ'
    // + 'Xewhmaph3TZF0N3QTZH5yQVplZxhXTPxmI6IidjJCLiQzZjhULLJzRkVESGljbvBlNq'
    // + 'FmeQ90dZJUQBFUQBFUQzVTZFpUW1oWRl9lI6IyYhJye';
    let ret: any = null;
    try {
      ret = JSON.parse(atob(this.reverse(src)));
    } catch (ex) {
      ret = {};
      this.setCredentialsToStorage(null);
    }
    return ret;
  }

  /**
   * converts the credentials from the internal structure
   * to a string and saves them to storage.
   *
   * @param value credentials in datastructure
   * @private
   */
  private saveCredentials(value: any): void {
    let dst = this.reverse(btoa(JSON.stringify(value)));
    console.log('saveCredentials', value, dst);
    // const ret = {
    //   ac: 'authorization_code',
    //   cv: 'codeVerifier',
    //   at: 'access_token'
    // }
    this.setCredentialsToStorage(dst);
  }

  private reverse(value: string): string {
    let ret = '';
    for (let i = value?.length - 1; i >= 0; i--) {
      ret += value[i];
    }
    return ret;
  }

  /**
   * generate the code_challenge that will be used
   * by the server together with the code_verfier
   * to create the token that must be sent back to
   * the server.
   *
   * @param codeVerifier the code-verifier for the request
   * @private
   */
  private async generateCodeChallenge(codeVerifier: string) {
    sessionStorage.setItem('cv', codeVerifier);
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    const base64Digest = base64encode(digest);
    // you can extract this replacing code to a function
    return base64Digest
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Checks the url-params to work with the redirects from
   * oauth2-workflow.
   */
  private checkUrlParams(): void {
    if (this.env.urlParams.error === 'access_denied') {
      this.status = oauthStatus.accessDenied;
      location.href = location.origin;
    } else if (this.env.urlParams.code != null) {
      this.status = oauthStatus.accessToken;
      this.getAccessToken(this.env.urlParams.code);
    } else if (this.getCredentialsFromStorage() != null) {
      this.status = oauthStatus.hasAccessToken;
    }
  }

  private getAccessToken(authorization_code: string): void {
    const codeVerifier = sessionStorage.getItem('cv');
    const params = [
      `grant_type=authorization_code`,
      `code=${authorization_code}`,
      `client_id=${this.env.DROPBOX_APP_KEY}`,
      `code_verifier=${codeVerifier}`,
      `redirect_uri=${location.origin}`
    ];
    const url = `https://api.dropbox.com/oauth2/token?${params.join('&')}`;
    const req = new HttpRequest('POST', url, new HttpHeaders({
      responseType: 'text'
    }));
    this.http.request(req).subscribe((response: any) => {
      if (response?.body?.access_token != null) {
        const data = {
          ac: authorization_code,
          cv: codeVerifier,
          at: response.body.access_token
        }
        this.saveCredentials(data);
        location.href = location.origin;
      }
    });
  }
}
