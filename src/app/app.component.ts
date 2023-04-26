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
  constructor(public env: EnvironmentService,
              cr: ChangeDetectorRef,
              // ds: DataService,
              // ss: SessionService,
              // ms: MessageService,
              // dbs: DropboxService
  ) {
    LogService.cr = cr;
    // dbs.startOauth2Workflow = () => {
    //   const msg = this.msgOauth2Workflow($localize`Dropbox`);
    //   return ms.confirm(msg, new DialogParams({image: 'assets/img/dropbox.png'})).pipe(map(result => {
    //     const ret = new Oauth2pkce();
    //     ret.doSignin = result.btn === DialogResultButton.yes;
    //     ret.isDebug = ss.mayDebug;
    //     if (ret.doSignin) {
    //       ds._syncType = oauth2SyncType.dropbox;
    //       ds.saveWebData();
    //     }
    //     return ret;
    //   }));
    // };
    //
    // dbs.getCredentialsFromStorage = () => {
    //   ds.loadWebData();
    //   return ds.oauth2AccessToken;
    // };
    //
    // dbs.setCredentialsToStorage = (value: string, isRefreshing = false) => {
    //   ds.oauth2AccessToken = value;
    //   if (value != null) {
    //     if (!isRefreshing) {
    //       ds.syncType = oauth2SyncType.dropbox;
    //     }
    //     ds.saveWebData();
    //   } else {
    //     if (!isRefreshing) {
    //       ds.syncType = oauth2SyncType.none;
    //     }
    //   }
    // }
    //
    // dbs.isSameContent = (src: any, dst: any) => {
    //   delete (src?.s11);
    //   delete (dst?.s11);
    //   return JSON.stringify(src) === JSON.stringify(dst);
    // };
  }

  get globals() {
    return GLOBALS;
  }

  msgOauth2Workflow(serviceName: string): string {
    return $localize`Für die Verbindung mit ${serviceName} ist eine Bestätigung erforderlich, dass Nightscout Reporter die
Daten von ${serviceName} lesen und schreiben darf. Diese Bestätigung wird mit speziellen Dialogen von ${serviceName}
angefordert. Was dort alles bestätigt werden muss, entzieht sich der Kontrolle von Nightscout Reporter.
Soll der Bestätigungsablauf gestartet werden?`;
  }
}
