import {ChangeDetectorRef, Component} from '@angular/core';
import {GLOBALS} from '@/_model/globals-data';
import {LogService} from '@/_services/log.service';
import {EnvironmentService} from '@/_services/environment.service';
import {DropboxService} from '@/_services/sync/dropbox.service';
import {SessionService} from '@/_services/session.service';
import {map} from 'rxjs';
import {DataService} from '@/_services/data.service';
import {Oauth2pkce, oauth2SyncType} from '@/_services/sync/oauth2pkce';
import {DialogParams, DialogResultButton} from '@/_model/dialog-data';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(public env: EnvironmentService,
              cr: ChangeDetectorRef,
              ds: DataService,
              ss: SessionService,
              dbs: DropboxService) {
    LogService.cr = cr;
    dbs.startOauth2Workflow = () => {
      const msg = this.msgOauth2Workflow($localize`Dropbox`);
      return ss.confirm(msg, new DialogParams({image: 'assets/img/dropbox.png'})).pipe(map(result => {
        const ret = new Oauth2pkce();
        ret.doSignin = result.btn === DialogResultButton.yes;
        ret.isDebug = ss.mayDebug;
        if (ret.doSignin) {
          ds._syncType = oauth2SyncType.dropbox;
          ds.saveWebData();
        }
        return ret;
      }));
    };

    dbs.getCredentialsFromStorage = () => {
      ds.loadWebData();
      return ds.oauth2AccessToken;
    };

    dbs.setCredentialsToStorage = (value: string) => {
      ds.oauth2AccessToken = value;
      if (value != null) {
        ds.syncType = oauth2SyncType.dropbox;
        ds.saveWebData();
      } else {
        ds.syncType = oauth2SyncType.none;
      }
    }

    dbs.isSameContent = (src: any, dst: any) => {
      delete (src?.s11);
      delete (dst?.s11);
      return JSON.stringify(src) === JSON.stringify(dst);
    };
//     gds.OAUTH2_CLIENT_ID = env.OAUTH2_CLIENT_ID;
//     gds.GOOGLE_API_KEY = env.GOOGLE_API_KEY;
//     gds.getOAuth2FromStorage = () => {
//       ds.loadWebData();
//       return ds.oauth2AccessToken;
//     };
//
//     gds.setOAuth2ToStorage = (value: string) => {
//       if (!ds.syncWithGoogle) {
//         value = null;
//       }
//       if (value != null) {
//         ds.oauth2AccessToken = value;
//         ds.saveWebData();
//       }
//     }
//
//     gds.beforeSignin = () => {
//       const msg = $localize`Für die Verbindung mit Google Drive verlangt Google eine Bestätigung, dass Nightscout Reporter die
// Daten von Google Drive lesen und schreiben darf. Diese Bestätigung wird mit speziellen Dialogen von Google angefordert. Was dort
// alles bestätigt werden muss, entzieht sich der Kontrolle von Nightscout Reporter. Soll der Bestätigungsablauf gestartet werden?`;
//       return ss.confirm(msg).pipe(map(result => {
//         const ret = new SigninConfirmation();
//         ret.doSignin = result.btn === DialogResultButton.yes;
//         ret.debug = ss.mayDebug;
//         if (ret.doSignin) {
//           ds._syncWithGoogle = true;
//           ds.saveWebData();
//         }
//         return ret;
//       }));
//     }
//
//     ds.loadWebData();
//     if (ds.syncWithGoogle) {
//       gots.login();
//       gots.onEvent.subscribe(token => {
//         if (gots.id_token != null) {
//           console.log('oauth2AccessToken', gots.oauth2AccessToken);
//           console.log('id_token', gots.id_token);
//           gds.setOAuth2ToStorage(gots.id_token);
//         }
//       });
//       gds.checkUrl();
//     }
  }

  get globals() {
    return GLOBALS;
  }

  get appType(): string {
    return window.location.hash?.substring(1);
  }

  msgOauth2Workflow(serviceName: string): string {
    return $localize`Für die Verbindung mit ${serviceName} ist eine Bestätigung erforderlich, dass Nightscout Reporter die
Daten von ${serviceName} lesen und schreiben darf. Diese Bestätigung wird mit speziellen Dialogen von ${serviceName}
angefordert. Was dort alles bestätigt werden muss, entzieht sich der Kontrolle von Nightscout Reporter.
Soll der Bestätigungsablauf gestartet werden?`;
  }
}
