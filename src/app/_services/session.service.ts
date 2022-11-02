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
import {NightscoutService} from '@/_services/nightscout.service';
import {Utils} from '@/classes/utils';
import {DatepickerPeriod} from '@/_model/datepicker-period';
import {ShortcutData} from '@/_model/shortcut-data';
import {BasePrint} from '@/forms/base-print';
import {PrintAnalysis} from '@/forms/nightscout/print-analysis';
import {PdfService} from '@/_services/pdf.service';
import {FormConfig} from '@/forms/form-config';

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
              private dialog: MatDialog,
              public ns: NightscoutService,
              public pdf: PdfService) {
  }

  get mayDebug(): boolean {
    return Log.mayDebug;
  }

  getNextSuffix(cfg: FormConfig): number {
    const list = GLOBALS.listConfig.filter((c) => c.form.baseId === cfg.form.baseId);
    let ret = 0;
    while (list.find((c) => c.form.suffix === `${ret}`) != null) {
      ret++;
    }
    return ret;
  }

  showVideo(id: string): void {
    const videos: { [key: string]: string } = {
      intro: 'eYq9lJRAWao'
    };
    window.open(`https://www.youtube.com/watch?v=${videos[id]}`);
  }

  showSettings(): void {
    const sharedOrg = GLOBALS.asSharedString;
    const deviceOrg = GLOBALS.asDeviceString;
    this.showPopup('settings').subscribe((result: DialogResult) => {
      switch (result.btn) {
        case DialogResultButton.ok:
          this.ds.save({skipReload: true});
          this.ns.reportData = null;
          break;
        default:
          this.ds.fromSharedString(sharedOrg);
          this.ds.fromDeviceString(deviceOrg);
          break;
      }
    });
  }

  formFromId(id: string, suffix: string): BasePrint {
    switch (id) {
      // case '00':
      // case 'test':
      //   return PrintTest(suffix: suffix);
      case '01':
      case 'analysis':
        return new PrintAnalysis(this.pdf, suffix);
      // case '02':
      // case 'profile':
      //   return PrintProfile(suffix: suffix);
      // case '03':
      // case 'percentile':
      //   return PrintPercentile(suffix: suffix);
      // case '04':
      // case 'daystats':
      //   return PrintDailyStatistics(suffix: suffix);
      // case '05':
      // case 'daygraph':
      //   return PrintDailyGraphic(suffix: suffix);
      // case '06':
      // case 'dayanalysis':
      //   return PrintDailyAnalysis(suffix: suffix);
      // case '07':
      // case 'daylog':
      //   return PrintDailyLog(suffix: suffix);
      // case '08':
      // case 'weekgraph':
      //   return PrintWeeklyGraphic(suffix: suffix);
      // case '09':
      // case 'basal':
      //   return PrintBasalrate(suffix: suffix);
      // case '10':
      // case 'cgp':
      //   return PrintCGP(suffix: suffix);
      // case '11':
      // case 'dayprofile':
      //   return PrintDailyProfile(suffix: suffix);
      // case '12':
      // case 'daygluc':
      //   return PrintDailyGluc(suffix: suffix);
      // case '13':
      // case 'dayhours':
      //   return PrintDailyHours(suffix: suffix);
      // case '14':
      // case 'userdata':
      //   return PrintUserData(suffix: suffix);
      // case '15':
      // case 'glucdist':
      //   return PrintGlucDistribution(suffix: suffix);
    }
    Log.todo('In StartComponent.formFromId fehlen noch Formulare');
    return null;
  }

  showPopup(id: string, data?: any): Observable<DialogResult> {
    if (this.dlgList[id] != null) {
      const dlgRef = this.dialog.open(this.dlgList[id], {data: data, panelClass: ['dialog-box', id], disableClose: true});
      return dlgRef.afterClosed();
    } else if (id != null) {
      Log.todo(`Der Dialog mit der Id ${id} muss noch in SessionService implementiert werden.`);
    }
    return of(null);
  }

  navigate(url: string): void {
    window.open(url);
  }

  fillFormsFromShortcut(data: ShortcutData): void {
    GLOBALS.period = new DatepickerPeriod(data.periodData);
    for (const cfg of GLOBALS.listConfig) {
      cfg.checked = Object.keys(data.forms).includes(cfg.form.dataId);
      if (cfg.checked) {
        cfg.fillFromJson(data.forms[cfg.form.dataId]);
      }
    }
    for (const entry of GLOBALS.listConfig) {
      GLOBALS.user.formParams[entry.dataId] = entry.asString;
    }
    GLOBALS._pdfOrder = data.pdfOrder;
    GLOBALS.glucMGDLIdx = data.glucMGDLIdx;
    this.ds.sortConfigs();
  }

  donationClick() {
    const url = 'https://www.paypal.com/donate?hosted_button_id=YYMVYB8C3VAVL';
    window.open(url, 'PayPal');
  }

  isEmpty(value: any): boolean {
    return Utils.isEmpty(value);
  }

  info(content: string | string[], theme = 'main'): Observable<DialogResult> {
    return this.showDialog(DialogType.info, content, false, theme);
  }

  confirm(content: string | string[], theme = 'main'): Observable<DialogResult> {
    return this.showDialog(DialogType.confirm, content, false, theme);
  }

  ask(content: string | string[], type: IDialogDef, theme = 'main'): Observable<DialogResult> {
    return this.showDialog(type, content, false, theme);
  }

  showDialog(type: DialogType | IDialogDef, content: string | string[], disableClose = false, theme = 'standard'): Observable<DialogResult> {
    // console.error(content);
    if (content == null || content === '' || content.length === 0) {
      const ret = new DialogResult();
      ret.btn = DialogResultButton.cancel;
      console.error('Es soll ein leerer Dialog angezeigt werden');
      return of(ret);
    }
    if (this.dlgRef?.componentInstance == null) {
      this.dlgRef = this.dialog.open(DialogComponent, {
        panelClass: ['dialog-box'],
        data: new DialogData(type, content, null, theme),
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
