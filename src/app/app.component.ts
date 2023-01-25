import {ChangeDetectorRef, Component} from '@angular/core';
import {GLOBALS} from '@/_model/globals-data';
import {LogService} from '@/_services/log.service';
import {EnvironmentService} from '@/_services/environment.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(cr: ChangeDetectorRef,
              // gds: GoogleDriveService,
              // gots: GoogleOneTapService,
              // ds: DataService,
              // ss: SessionService,
              public env: EnvironmentService) {
    LogService.cr = cr;
//     gds.OAUTH2_CLIENT_ID = env.OAUTH2_CLIENT_ID;
//     gds.GOOGLE_API_KEY = env.GOOGLE_API_KEY;
//     gds.getOAuth2FromStorage = () => {
//       ds.loadWebData();
//       return ds.oauthToken;
//     };
//
//     gds.setOAuth2ToStorage = (value: string) => {
//       if (!ds.syncWithGoogle) {
//         value = null;
//       }
//       if (value != null) {
//         ds.oauthToken = value;
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
//           console.log('oauthToken', gots.oauthToken);
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
}
