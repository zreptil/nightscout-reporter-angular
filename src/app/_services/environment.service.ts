import {Injectable} from '@angular/core';
import {environment} from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {
  isProduction: boolean = environment.production;
  GAPI_CLIENT_ID: string = environment.GAPI_CLIENT_ID;

  constructor() {
  }
}
