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
    whatsnew: WhatsNewComponent,
    impressum: ImpressumComponent,
    dsgvo: DsgvoComponent,
    settings: SettingsComponent,
    helpview: HelpviewComponent
  }

  constructor(public ss: StorageService,
              private dialog: MatDialog) {
  }

  get mayDebug(): boolean {
    return Log.mayDebug;
  }

  showPopup(id: string): Observable<DialogResult> {
    if (this.dlgList[id] != null) {
      const dlgRef = this.dialog.open(this.dlgList[id], {panelClass: 'dialog-box'});
      return dlgRef.afterClosed();
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
}
