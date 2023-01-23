import {Injectable} from '@angular/core';
import {environment} from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {
  isProduction: boolean = environment.production;
  OAUTH2_CLIENT_ID: string = environment.OAUTH2_CLIENT_ID;
  GOOGLE_API_KEY: string = environment.GOOGLE_API_KEY;
  settingsFilename: string = environment.settingsFilename;

  constructor() {
  }
}
