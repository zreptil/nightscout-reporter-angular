import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpRequest} from '@angular/common/http';
import {lastValueFrom, Observable, of} from 'rxjs';

export class SigninConfirmation {
  doSignin: boolean;
  debug: boolean;
}

export enum gdsStatus {
  ok,
  error,
  info
}

export class GDSStatus {
  constructor(public status?: gdsStatus,
              public text?: string) {
  }
}

/**
 * created by zreptil
 *
 * Service for access to Google Drive. This service requests access to google drive
 * and has methods to read and write data from Google Drive.
 *
 * This service should be injected in the AppComponent and should be initialized there.
 * The minimum requirement is to set OAUTH2_CLIENT_ID to the client id from Google that is
 * connected with this app. This can be found in the section OAuth 2.0-Client-IDs here:
 * https://console.cloud.google.com/apis/credentials
 *
 * Also, the GOOGLE_API_KEY must be set, which can be obtained from the same page.
 *
 * The credentials are stored in localStorage in the key oauth2 by default. If this
 * is not the place where it should be stored, just overwrite the methods getOAuth2FromStorage
 * and setOAuth2ToStorage to manage the key whereever you want.
 *
 * The method beforeSignin is called before the OAuth Signin from Google is called. If you want
 * to present the user with a dialog or want to do some stuff before calling the Google
 * OAuth workflow, you can overwrite this method and return an intance of SigninConfirmation
 * with the neccessary data. If debug is set to true, then the form that is injected in
 * the document is shown with a button to submit it. If debug is false then the form is
 * submitted as soon as it was inserted in the document. The class of the form is oauth2. With
 * this you can style it as you wish.
 *
 * In the constructor of AppComponent you should call checkUrl of this service. This ensures
 * that the callback of Google is handled properly. When the callback succeeds and the
 * accesstoken is saved then the page is reloaded again so that the url is clean and
 * without the information from Google that was neccessary to validate the login.
 */
@Injectable({
  providedIn: 'root'
})
export class GoogleDriveService {

  OAUTH2_CLIENT_ID: string;
  GOOGLE_API_KEY: string;
  msgInvalid = $localize`GoogleDriveService kann nur benutzt werden, wenn OAUTH2_CLIENT_ID und GOOGLE_API_KEY gesetzt sind.`;
  lastStatus: GDSStatus = new GDSStatus();

  constructor(// public gots: GoogleOneTapService,
    public http: HttpClient) {
  }

  get isValid(): boolean {
    const ret = this.OAUTH2_CLIENT_ID != null && this.GOOGLE_API_KEY != null;
    if (!ret) {
      console.error(this.msgInvalid);
      this.lastStatus = new GDSStatus(gdsStatus.error, this.msgInvalid);
    }
    return ret;
  }

  private get accessToken(): string {
    return this.getOAuth2FromStorage();
  }

  getOAuth2FromStorage(): string {
    return localStorage.getItem('oauth2');
  }

  setOAuth2ToStorage(value: string): void {
    localStorage.setItem('oauth2', value);
  }

  beforeSignin(): Observable<SigninConfirmation> {
    return of({doSignin: true, debug: false});
  }

  /**
   * Get file contents by filename. Only returns contents of the file, if it is one single file that can
   * be found. If there is more or less than one file then the return value will be null.
   *
   * @param filename  name of the file
   * @param params    parameters for the request, object with following entries
   *                  responseType    = responseType for the request, has to be valid for HttpClient.request, json by default
   *                  spaces          = spaces of Google Drive to be queried, appDataFolder by default
   *                  createIfMissing = if true the file will be created if it could not be found
   * @returns content of file or null if not available. lastStatus contains the status of the operation.
   */
  async findFileByName(filename: string, params?: { responseType?: 'arraybuffer' | 'blob' | 'json' | 'text', spaces?: 'drive' | 'appDataFolder', createIfMissing?: boolean }) {
    params ??= {};
    params.responseType ??= 'json';
    params.spaces ??= 'appDataFolder';
    params.createIfMissing ??= false;
    this.lastStatus = new GDSStatus();
    if (!this.isValid) {
      return of(null);
    }
    let url = `https://www.googleapis.com/drive/v3/files?q=name="${filename}" and not trashed&spaces=${params.spaces}&fields=files(id)&key=${this.GOOGLE_API_KEY}`;
    let ret = null;
    try {
      let req = new HttpRequest('GET', url, {
        headers: new HttpHeaders({authorization: `Bearer ${this.accessToken}`})
      });
      let response: any = await lastValueFrom(this.http.request(req));
      console.log('RESPONSE', response);
      if (response?.body?.files?.length === 1) {
        const id = response.body.files[0].id;
        url = `https://www.googleapis.com/drive/v3/files/${id}?alt=media&key=${this.GOOGLE_API_KEY}`;
        req = new HttpRequest('GET', url, {
          headers: new HttpHeaders({authorization: `Bearer ${this.accessToken}`}),
          responseType: params.responseType
        });
        console.log('REQ', req);
        response = await lastValueFrom(this.http.request(req));
        ret = response?.body;
        this.lastStatus = new GDSStatus(gdsStatus.ok);
      } else if (response?.files?.length === 0 && params.createIfMissing) {
        // create the file
        await this.createFile(filename, {mimeType: params.responseType, spaces: params.spaces});
      } else if (response?.files?.length === 0) {
        this.lastStatus = new GDSStatus(gdsStatus.error, $localize`Die Datei ${filename} wurde nicht in Google Drive gefunden.`);
      } else {
        this.lastStatus = new GDSStatus(gdsStatus.error, $localize`Es wurden ${response?.files?.length} Dateien mit dem Namen ${filename} in Google Drive gefunden.`);
      }
    } catch (ex) {
      console.error('error when searching file on Google Drive', ex);
      console.log('removing accesstoken for Google Drive');
      this.lastStatus = new GDSStatus(gdsStatus.error, $localize`Es gab einen Fehler beim Zugriff auf Google Drive: ${ex}`);
      this.setOAuth2ToStorage(null);
    }
    return ret;
  }

  /**
   * Create a file.
   *
   * @param filename  name of the file
   * @param params    parameters for the request, object with following entries
   *                  mimeType    = mimeType for the file
   *                  spaces      = spaces of Google Drive where the file will be available after creation
   * @returns the id of the created file. lastStatus contains the status of the operation.
   */
  async createFile(filename: string, params?: { mimeType?: string, spaces?: 'drive' | 'appDataFolder' }) {
    params ??= {};
    params.mimeType ??= 'text/json';
    params.spaces ??= 'appDataFolder';
    this.lastStatus = new GDSStatus();
    let url = `https://www.googleapis.com/drive/v3/files/generateIds?count=1&space=${params.spaces}&access_token=${this.accessToken}`;
    let ret = null;
    try {
      let response: any = await lastValueFrom(this.http.get(url));
      if (response?.ids?.length === 1) {
        const id = response.ids[0];
        url = `https://www.googleapis.com/drive/v3/files?access_token=${this.accessToken}`;
        const body = {
          id: id,
          name: filename,
          parents: [params.spaces],
          mimeType: params.mimeType
        };
        const req = new HttpRequest('POST', url, body, {
          headers: new HttpHeaders({authorization: `Bearer ${this.accessToken}`})
        });
        response = await lastValueFrom(this.http.request(req));
        this.lastStatus = new GDSStatus(gdsStatus.info, $localize`Die Datei ${filename} wurde auf Google Drive erzeugt.`);
        ret = id;
      } else {
        this.lastStatus = new GDSStatus(gdsStatus.error, $localize`Die Datei ${filename} konnte nicht auf Google Drive erzeugt werden.`);
      }
    } catch (ex) {
      console.error('error when searching file on Google Drive', ex);
      console.log('removing accesstoken for Google Drive');
      this.lastStatus = new GDSStatus(gdsStatus.error, $localize`Es gab einen Fehler beim Zugriff auf Google Drive: ${ex}`);
      this.setOAuth2ToStorage(null);
    }

    return ret;
  }

  async uploadFile(filename: string, content: any, params?: { mimeType?: string, spaces?: 'drive' | 'appDataFolder' }) {
    params ??= {};
    params.mimeType ??= 'text/json';
    params.spaces ??= 'appDataFolder';
    this.lastStatus = new GDSStatus();
    let url = `https://www.googleapis.com/drive/v3/files?q=name="${filename}" and not trashed&spaces=${params.spaces}&fields=files(id)&access_token=${this.accessToken}`;
    let ret = null;
    try {
      let response: any = await lastValueFrom(this.http.get(url));
      let id = response?.files?.[0]?.id;
      if (response?.files?.length > 1) {
        this.lastStatus = new GDSStatus(gdsStatus.error, $localize`Es wurden mehrere Dateien mit dem Namen ${filename} auf Google Drive gefunden. Es wurde kein Upload durchgeführt.`);
        return this.lastStatus;
      } else if (response?.files?.length === 0) {
        id = await this.createFile(filename, {mimeType: params.mimeType, spaces: params.spaces});
      }
      if (id == null) {
        this.lastStatus = new GDSStatus(gdsStatus.error, $localize`Die Datei ${filename} konnte nicht auf Google Drive gefunden werden. Es wurde kein Upload durchgeführt.`);
        return this.lastStatus;
      }
      url = `https://www.googleapis.com/upload/drive/v3/files/${id}?uploadType=media&access_token=${this.accessToken}`;
      const req = new HttpRequest('PATCH', url, content, {
        headers: new HttpHeaders({authorization: `Bearer ${this.accessToken}`})
      });
      await lastValueFrom(this.http.request(req));
      this.lastStatus = new GDSStatus(gdsStatus.ok);
    } catch (ex) {
      console.error('error when uploading file on Google Drive', ex);
      this.lastStatus = new GDSStatus(gdsStatus.error, $localize`Es gab einen Fehler beim Zugriff auf Google Drive.`);
    }
    return this.lastStatus;
  }

  checkUrl(): void {
    if (!this.isValid || true) {
      return;
    }
    const params: any = {};
    const fragmentString = location.hash.substring(1);
    const regex = /([^&=]+)=([^&]*)/g;
    let m;
    while (m = regex.exec(fragmentString)) {
      params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
    }

    if (Object.keys(params).length > 0) {
      this.setOAuth2ToStorage(params.access_token);
      window.location.href = window.origin;
    }
  }

  oauth2Check(): void {
    const access_token = this.getOAuth2FromStorage();
    if (access_token == null) {
      this.oauth2SignIn();
    }
  }

  oauth2SignIn(): void {
    if (!this.isValid || true) {
      return;
    }
    this.beforeSignin?.().subscribe(signinConfirmation => {
      if (!signinConfirmation.doSignin) {
        return;
      }
      // Google's OAuth 2.0 endpoint for requesting an access token
      const oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';

      // Create element to open OAuth 2.0 endpoint
      const form = document.createElement('form');
      form.setAttribute('method', 'GET'); // Send as a GET request.
      form.setAttribute('action', oauth2Endpoint);
      form.className = 'oauth2';

      // Aarameters to pass to OAuth 2.0 endpoint.
      const params: { [key: string]: string } = {
        client_id: this.OAUTH2_CLIENT_ID,
        redirect_uri: window.origin.replace(/\/$/, ''),
        scope: 'https://www.googleapis.com/auth/drive.metadata.readonly',
        state: 'try_sample_request',
        include_granted_scopes: 'true',
        response_type: 'token'
      };

      // Add form parameters as input values.
      for (const key of Object.keys(params)) {
        const input = document.createElement('input');
        input.setAttribute('type', signinConfirmation.debug ? 'text' : 'hidden');
        input.setAttribute('name', key);
        input.setAttribute('value', params[key]);
        form.appendChild(input);
      }

      document.body.appendChild(form);
      if (signinConfirmation.debug) {
        const button = document.createElement('button');
        button.type = 'submit';
        button.className = 'mat-raised-button';
        button.textContent = 'Submit';
        form.appendChild(button);
      } else {
        form.submit();
      }
    });
  }
}
