import {AuthConfig} from 'angular-oauth2-oidc';

export class OAuth {
  static fitbit: AuthConfig = {
    issuer: 'https://www.fitbit.com',
    loginUrl: 'https://www.fitbit.com/oauth2/authorize',
    tokenEndpoint: 'https://api.fitbit.com/oauth2/token',
    redirectUri: 'https://nightrep.zreptil.de',
    clientId: '23Q4GR',
    responseType: 'token',
    scope: 'activity heartrate location nutrition profile settings sleep social weight',
    showDebugInformation: true,
  };
}
