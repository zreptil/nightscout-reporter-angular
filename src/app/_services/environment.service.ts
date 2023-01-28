import {Injectable} from '@angular/core';
import {environment} from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {
  isProduction: boolean = false;
  OAUTH2_CLIENT_ID: string = null;
  GOOGLE_API_KEY: string = null;
  DROPBOX_APP_KEY: string = null;
  settingsFilename: string = null;

  urlParams: any = {};

  constructor() {
    for (const key of Object.keys(environment)) {
      (this as any)[key] = (environment as any)[key];
    }
    const src = location.search.replace(/^\?/, '').split('&');
    for (const p of src) {
      const parts = p.split('=');
      this.urlParams[parts[0]] = parts[1];
    }
  }
}
