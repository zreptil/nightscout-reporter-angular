import {EventEmitter, Injectable} from '@angular/core';
import {EnvironmentService} from '@/_services/environment.service';
import {CredentialResponse} from 'google-one-tap';
import {LogService} from '@/_services/log.service';
import {HttpClient, HttpHeaders} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class GoogleService {

  onEvent = new EventEmitter<any>();

  private _headersAccess: HttpHeaders;

  constructor(public env: EnvironmentService,
              public http: HttpClient) {
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
    return this.token?.picture;
  }

  private get token(): any {
    if (this.id_token != null) {
      return JSON.parse(atob(this.id_token?.split('.')[1]));
    }
    return null;
  }

  logout(): void {
    const id = this.token?.sub;
    sessionStorage.removeItem('token');
    this.id_token = null;
    // @ts-ignore
    google.accounts.id.revoke(id, _ => {
    });
    LogService.refreshUI();
  }

  init() {
    // @ts-ignore
    window.onGoogleLibraryLoad = () => {
      this.id_token = sessionStorage.getItem('token');

      if (this.id_token != null) {
        this.onEvent.next(null);
      } else {
        // console.log('Google\'s One-tap sign in script loaded!');
        // @ts-ignore
        google.accounts.id.initialize({
          // Ref: https://developers.google.com/identity/gsi/web/reference/js-reference#IdConfiguration
          client_id: this.env.GAPI_CLIENT_ID,
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
    };
  }
}
