import {EventEmitter, Injectable} from '@angular/core';
import {EnvironmentService} from '@/_services/environment.service';
import {CredentialResponse} from 'google-one-tap';
import {LogService} from '@/_services/log.service';
import {HttpClient, HttpHeaders} from '@angular/common/http';

declare let gapi: any;
declare let google: any;

@Injectable({
  providedIn: 'root'
})
export class GoogleOneTapService {
  onEvent = new EventEmitter<any>();
  scopes = [
    'https://www.googleapis.com/auth/drive.appdata',
    'https://www.googleapis.com/auth/drive.file'
  ];
  driveApiLoaded = false;
  gisLoaded = false;
  oauthToken?: any;
  isActive = false;
  private _headersAccess: HttpHeaders;

  constructor(public env: EnvironmentService,
              public http: HttpClient) {
    // @ts-ignore
    window.onGoogleLibraryLoad = () => {
      this.login();
      gapi.load('client', this.initializeGapiClient.bind(this));
      this.gisInitialized();
    };
  }

  _id_token: string;

  get id_token(): string {
    return this._id_token;
  }

  set id_token(value: string) {
    this._id_token = value;
    if (value != null) {
      this._headersAccess = new HttpHeaders({
        Authorization: `Bearer ${this._id_token}`
      });
    } else {
      this._headersAccess = null;
    }
  }

  get userImage(): string {
    if (this.token != null) {
      return this.token.picture;
    }
    return null;
  }

  private _token: any;

  private get token(): any {
    if (this.id_token == null) {
      this._token = null;
      return null;
    }
    if (this._token != null) {
      return this._token;
    }
    this._token = JSON.parse(atob(this.id_token?.split('.')[1]));
    // this.drive = new TsGoogleDrive({oAuthCredentials: {access_token: this._id_token}});
    // console.log(this.drive);
    // this.drive = gapi.drive({ version: 'v3', new google.auth.JWT(this._token.client_email, null, this._token.private_key, this.scopes) });
    // console.log(this._token, this.id_token?.split('.'));
    return this._token;
  }

  async initializeGapiClient() {
    await gapi.client.init({
      apiKey: this.env.GOOGLE_API_KEY,
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    });
    this.driveApiLoaded = true;
    this.apiLoaded();
  }

  gisInitialized() {
    this.oauthToken = google.accounts.oauth2.initTokenClient({
      client_id: this.env.OAUTH2_CLIENT_ID,
      scope: this.scopes.join(' '),
      callback: '', // defined later
    });
    this.gisLoaded = true;
    this.apiLoaded();
  }

  /**
   * Called when api was loaded. Will not do anything before every api was loaded.
   */
  apiLoaded(): void {
    if (!this.driveApiLoaded || !this.gisLoaded) {
      return;
    }
    this.oauthToken.callback = this.oauthTokenReceived.bind(this);

    if (gapi.client.getToken() == null) {
      // Prompt the user to select a Google Account and ask for consent to share their data
      // when establishing a new session.
      this.oauthToken.requestAccessToken({prompt: 'consent'});
    } else {
      // Skip display of account chooser and consent dialog for an existing session.
      this.oauthToken.requestAccessToken({prompt: ''});
    }
    this.isActive = true;
  }

  async oauthTokenReceived(resp: any) {
    if (resp.error !== undefined) {
      throw (resp);
    }
    let response;
    try {
      response = await gapi.client.drive.files.list({
        pageSize: 10,
        q: `name="${this.env.settingsFilename}"`,
        spaces: 'appDataFolder',
        fields: 'files(id, name)',
      });
    } catch (err: any) {
      console.log('Fählär', err);
      return;
    }
    const files = response.result.files;
    if (!files || files.length == 0) {
      console.log('Keine Dateien vorhanden');
      return;
    }
    console.log('gfunna', files);
    if (files.length === 1) {
      try {
        response = await gapi.client.drive.files.get({
          fileId: files[0].id,
          alt: 'media'
        });
      } catch (err: any) {
        console.log('Hatte was, aber nix!!!', err);
        return;
      }
      console.log('hab was', response.result);
    }
  }

  logout(): void {
    if (this.token != null) {
      const id = this.token.sub;
      sessionStorage.removeItem('token');
      this.id_token = null;
      // @ts-ignore
      google.accounts.id.revoke(id, _ => {
      });
    }
    LogService.refreshUI();
  }

  login(): void {
    this.id_token = sessionStorage.getItem('token');
    if (this.id_token != null) {
      this.onEvent.next(null);
    } else {
      // console.log('Google\'s One-tap sign in script loaded!');
      // @ts-ignore
      google.accounts.id.initialize({
        // Ref: https://developers.google.com/identity/gsi/web/reference/js-reference#IdConfiguration
        client_id: this.env.OAUTH2_CLIENT_ID,
        auto_select: true,
        cancel_on_tap_outside: false,
        callback: (response: CredentialResponse) => {
          this.id_token = response?.credential;
          sessionStorage.setItem('token', this.id_token);
          this.onEvent.next(null);
        }
      });

      // OPTIONAL: In my case I want to redirect the user to an specific path.
      // @ts-ignore
      google.accounts.id.prompt((notification: PromptMomentNotification) => {
//        console.log('Google prompt event triggered...', notification);
        if (notification.getDismissedReason() === 'credential_returned') {
          // this.ngZone.run(() => {
          //   this.router.navigate(['myapp/somewhere'], {replaceUrl: true});
          //   console.log('Welcome back!');
          // });
        }
      });
    }
  }
}
