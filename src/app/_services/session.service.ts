import {Injectable} from '@angular/core';
import {StorageService} from './storage.service';
import {Observable, of} from 'rxjs';
import {DialogData, DialogResult, DialogResultButton, DialogType, IDialogDef} from '@/_model/dialog-data';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {DialogComponent} from '@/components/dialog/dialog.component';
import {Log} from '@/_services/log.service';
import {BaseData} from '@/_model/base-data';
import {WhatsNewComponent} from '@/components/whats-new/whats-new.component';
import {ComponentType} from '@angular/cdk/overlay';
import {ImpressumComponent} from '@/components/impressum/impressum.component';
import {DsgvoComponent} from '@/components/dsgvo/dsgvo.component';
import {SettingsComponent} from '@/components/settings/settings.component';
import {HelpviewComponent} from '@/components/helpview/helpview.component';
import {UserData} from '@/_model/nightscout/user-data';
import {DataService} from '@/_services/data.service';
import {GLOBALS} from '@/_model/globals-data';
import {WelcomeComponent} from '@/components/welcome/welcome.component';

class GlobalData extends BaseData {
  get asJson(): any {
    return {};
  }

  _fillFromJson(json: any, def?: any): void {
  }
}

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  public data: GlobalData;
  private dlgRef: MatDialogRef<any>;
  private dlgList: { [key: string]: ComponentType<any> } = {
    welcome: WelcomeComponent,
    whatsnew: WhatsNewComponent,
    impressum: ImpressumComponent,
    dsgvo: DsgvoComponent,
    settings: SettingsComponent,
    helpview: HelpviewComponent
  }

  constructor(public ss: StorageService,
              public ds: DataService,
              private dialog: MatDialog) {
  }

  get mayDebug(): boolean {
    return Log.mayDebug;
  }

  showVideo(id: string): void {
    const videos: { [key: string]: string } = {
      intro: 'eYq9lJRAWao'
    };
    window.open(`https://www.youtube.com/watch?v=${videos[id]}`);
  }

  showPopup(id: string): Observable<DialogResult> {
    if (this.dlgList[id] != null) {
      const dlgRef = this.dialog.open(this.dlgList[id], {panelClass: 'dialog-box', disableClose: true});
      return dlgRef.afterClosed();
    } else {
      Log.todo(`Der Dialog mit der Id ${id} muss noch in SessionService implementiert werden.`);
    }
    return of(null);
  }

  info(content: string | string[], type = DialogType.info): Observable<DialogResult> {
    return this.showDialog(type, content);
  }

  confirm(content: string | string[], type = DialogType.confirm): Observable<DialogResult> {
    return this.showDialog(type, content);
  }

  ask(content: string | string[], type: IDialogDef): Observable<DialogResult> {
    return this.showDialog(type, content);
  }

  showDialog(type: DialogType | IDialogDef, content: string | string[], disableClose = false): Observable<DialogResult> {
    // console.error(content);
    if (content == null || content === '' || content.length === 0) {
      const ret = new DialogResult();
      ret.btn = DialogResultButton.cancel;
      console.error('Es soll ein leerer Dialog angezeigt werden');
      return of(ret);
    }
    if (this.dlgRef?.componentInstance == null) {
      this.dlgRef = this.dialog.open(DialogComponent, {
        data: new DialogData(type, content),
        disableClose
      });
      this.dlgRef.keydownEvents().subscribe(event => {
        if (event.code === 'Escape') {
          this.dlgRef.close({btn: DialogResultButton.abort});
          this.dlgRef = null;
        }
      });
      if (!disableClose) {
        this.dlgRef.backdropClick().subscribe(_ => {
          this.dlgRef.close({btn: DialogResultButton.abort});
          this.dlgRef = null;
        });
      }
    } else {
      (this.dlgRef.componentInstance as DialogComponent).update(content);
    }

    return this.dlgRef.afterClosed();
  }

  // checks if the url of the user is valid
  async isUserValid(user: UserData) {
    if (user.apiUrl(null, '') == null) {
      return $localize`Die URL wurde noch nicht festgelegt`;
    }
    let ret: string = null;
    const check = user.apiUrl(null, 'status');
    await this.ds.request(check).then(response => {
      if (response.body.status != 'ok') {
        ret = GLOBALS.msgUrlFailure(check);
      }
    }).catch(_ => {
      ret = GLOBALS.msgUrlFailure(check);
    });
    return ret;
  }
}
