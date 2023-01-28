export enum oauth2SyncType {
  none,
  dropbox
}

/**
 * class with information for the oauth2 workflow
 * using pkce
 */
export class Oauth2pkce {
  doSignin: boolean;
  isDebug = false;
}


