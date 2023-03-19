import {Injectable} from '@angular/core';
import {environment} from '@environments/environment';
import {Settings} from '@/_model/settings';
import {Router} from '@angular/router';
import {Utils} from '@/classes/utils';

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

  appType: string;
  appParams: any = {};

  constructor(router: Router) {
    for (const key of Object.keys(environment)) {
      (this as any)[key] = (environment as any)[key];
    }
    const src = location.search.replace(/^\?/, '').split('&');
    for (const p of src) {
      const parts = p.split('=');
      this.urlParams[parts[0]] = parts[1];
    }
    console.log('params', this.urlParams);
    if (this.urlParams['enableDebug'] === 'true') {
      localStorage.setItem(Settings.DebugFlag, Settings.DebugActive);
    } else if (this.urlParams['enableDebug'] === 'false') {
      localStorage.removeItem(Settings.DebugFlag);
    }
    const temp = window.location.hash?.substring(1);
    this.appType = temp;
    if (Utils.isEmpty(this.appType)) {
      if (window.location.href.endsWith('/watch')) {
        this.appType = 'watch';
      }
    }
    const pos = this.appType.indexOf('?');
    if (pos > 0) {
      this.appType = temp.substring(0, pos);
      const parts = temp.substring(pos + 1).split('&');
      for (const part of parts) {
        const p = part.split('=');
        if (p.length === 1) {
          this.appParams[p[0]] = true;
        } else if (p.length === 2) {
          this.appParams[p[0]] = decodeURIComponent(p[1]);
        }
      }
    }
  }
}
