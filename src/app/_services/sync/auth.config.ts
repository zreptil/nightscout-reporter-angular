type OAuth2Type = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
  loginUrl: string;
  tokenUrl: string;
}

export type OAuth2List = { [key: string]: OAuth2Type }

export const OAuth2: OAuth2List = {
  fitbit: {
    clientId: '23Q4K9',
    clientSecret: 'f489ae66c6c999e5e8bcb290a7d9a5fa',
    redirectUri: 'https://nightrep-dev.zreptil.de/backend/fitbit.php',
    scope: 'activity', // heartrate location nutrition profile settings sleep social weight',
    loginUrl: 'https://www.fitbit.com/oauth2/authorize',
    tokenUrl: 'https://api.fitbit.com/oauth2/token',
    //
    // issuer: 'https://www.fitbit.com',
    // tokenEndpoint: 'https://api.fitbit.com/oauth2/token',
    // responseType: 'token',
    // showDebugInformation: true,
  }
}
