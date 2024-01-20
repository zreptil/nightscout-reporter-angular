import {Injectable} from '@angular/core';
import {StorageService} from './storage.service';
import {Observable, of} from 'rxjs';
import {DialogParams, DialogResult, DialogResultButton} from '@/_model/dialog-data';
import {MatDialog} from '@angular/material/dialog';
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
import {LangData} from '@/_model/nightscout/lang-data';
import {OutputParamsComponent} from '@/components/output-params/output-params.component';
import {DatepickerDialogComponent} from '@/controls/datepicker/datepicker-dialog/datepicker-dialog.component';
import {ShortcutEditComponent} from '@/components/shortcut-edit/shortcut-edit.component';
import {PrintBasalrate} from '@/forms/nightscout/print-basalrate';
import {PrintDailyAnalysis} from '@/forms/nightscout/print-daily-analysis';
import {PrintDailyGluc} from '@/forms/nightscout/print-daily-gluc';
import {PrintDailyGraphic} from '@/forms/nightscout/print-daily-graphic';
import {PrintDailyStatistics} from '@/forms/nightscout/print-daily-statistics';
import {PrintPercentile} from '@/forms/nightscout/print-percentile';
import {PrintProfile} from '@/forms/nightscout/print-profile';
import {PrintDailyLog} from '@/forms/nightscout/print-daily-log';
import {PrintWeeklyGraphic} from '@/forms/nightscout/print-weekly-graphic';
import {PrintDailyProfile} from '@/forms/nightscout/print-daily-profile';
import {PrintDailyHours} from '@/forms/nightscout/print-daily-hours';
import {PrintGlucDistribution} from '@/forms/nightscout/print-gluc-distribution';
import {PrintUserData} from '@/forms/nightscout/print-user-data';
import {PrintTest} from '@/forms/nightscout/print-test';
import {PrintCGP} from '@/forms/nightscout/print-cgp';
import {FormParamsDialogComponent} from '@/components/form-params-dialog/form-params-dialog.component';
import {ThemeService} from '@/_services/theme.service';
import {WatchSettingsComponent} from '@/components/watch-settings/watch-settings.component';
import {MessageService} from '@/_services/message.service';
import {PrintTDD} from '@/forms/nightscout/print-tdd';
import {PrintTemplate} from '@/forms/nightscout/print-template';
import {ColorCfgDialogComponent} from '@/controls/color-cfg/color-cfg-dialog/color-cfg-dialog.component';

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

  public activeCfgCount = 0;
  public data: GlobalData;
  formList = [
    new PrintTest(this.pdf),
    new PrintAnalysis(this.pdf),
    new PrintProfile(this.pdf),
    new PrintPercentile(this.pdf),
    new PrintDailyStatistics(this.pdf),
    new PrintDailyGraphic(this.pdf),
    new PrintDailyAnalysis(this.pdf),
    new PrintDailyLog(this.pdf),
    new PrintWeeklyGraphic(this.pdf),
    new PrintBasalrate(this.pdf),
    new PrintCGP(this.pdf),
    new PrintDailyProfile(this.pdf),
    new PrintDailyGluc(this.pdf),
    new PrintDailyHours(this.pdf),
    new PrintUserData(this.pdf, this.ds),
    new PrintGlucDistribution(this.pdf),
    new PrintTDD(this.pdf)
  ];
  reloadUserImg = true;
  private dlgList: { [key: string]: ComponentType<any> } = {
    welcome: WelcomeComponent,
    whatsnew: WhatsNewComponent,
    impressum: ImpressumComponent,
    dsgvo: DsgvoComponent,
    settings: SettingsComponent,
    helpview: HelpviewComponent,
    outputparams: OutputParamsComponent,
    datepickerdialog: DatepickerDialogComponent,
    shortcutedit: ShortcutEditComponent,
    formparamsdialog: FormParamsDialogComponent,
    watchsettings: WatchSettingsComponent,
    colorcfgdialog: ColorCfgDialogComponent
  }

  constructor(public ss: StorageService,
              public ds: DataService,
              private dialog: MatDialog,
              public ns: NightscoutService,
              public pdf: PdfService,
              public ts: ThemeService,
              public ms: MessageService) {
    GLOBALS.onPeriodChange.subscribe(_ => {
      this.checkPrint();
    });
  }

  public get msgAriaPlay(): string {
    return $localize`${this.activeCfgCount} erzeugen`;
  }

  get mayDebug(): boolean {
    return Log.mayDebug;
  }

  checkPrint(): void {
    let maySend = false;
    let count = 0;
    // if (GLOBALS.period.isEmpty) {
    //   this.sendDisabled = !maySend;
    //   return;
    // }
    for (const cfg of GLOBALS.listConfig) {
      if (cfg.checked) {
        if (cfg.form.isDebugOnly) {
          if (GLOBALS.isDebug) {
            maySend = true;
            count++;
          }
        } else if (cfg.form.isLocalOnly) {
          if (GLOBALS.isLocal) {
            maySend = true;
            count++;
          }
        } else {
          maySend = true;
          count++;
        }
      }
    }
    this.activeCfgCount = count;
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

  showSettings(afterPopup?: () => void, data?: any): void {
    const sharedOrg = GLOBALS.asSharedString;
    const deviceOrg = GLOBALS.asDeviceString;
    this.showPopup('settings', data).subscribe((result: DialogResult) => {
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
      afterPopup?.();
    });
  }

  formFromId(id: string, suffix: string): BasePrint {
    if (id === '00' || id === 'test') {
      return new PrintTest(this.pdf, suffix);
    } else if (id === '01' || id === 'analysis') {
      return new PrintAnalysis(this.pdf, suffix);
    } else if (id === '02' || id === 'profile') {
      return new PrintProfile(this.pdf, suffix);
    } else if (id === '03' || id === 'percentile') {
      return new PrintPercentile(this.pdf, suffix);
    } else if (id === '04' || id === 'daystats') {
      return new PrintDailyStatistics(this.pdf, suffix);
    } else if (id === '05' || id === 'daygraph') {
      return new PrintDailyGraphic(this.pdf, suffix);
    } else if (id === '06' || id === 'dayanalysis') {
      return new PrintDailyAnalysis(this.pdf, suffix);
    } else if (id === '07' || id === 'daylog') {
      return new PrintDailyLog(this.pdf, suffix);
    } else if (id === '08' || id === 'weekgraph') {
      return new PrintWeeklyGraphic(this.pdf, suffix);
    } else if (id === '09' || id === 'basal') {
      return new PrintBasalrate(this.pdf, suffix);
    } else if (id === '10' || id === 'cgp') {
      return new PrintCGP(this.pdf, suffix);
    } else if (id === '11' || id === 'dayprofile') {
      return new PrintDailyProfile(this.pdf, suffix);
    } else if (id === '12' || id === 'daygluc') {
      return new PrintDailyGluc(this.pdf, suffix);
    } else if (id === '13' || id === 'dayhours') {
      return new PrintDailyHours(this.pdf, suffix);
    } else if (id === '14' || id === 'userdata') {
      return new PrintUserData(this.pdf, this.ds, suffix);
    } else if (id === '15' || id === 'glucdist') {
      return new PrintGlucDistribution(this.pdf, suffix);
    } else if (id === '16' || id === 'tdd') {
      return new PrintTDD(this.pdf, suffix);
    } else if (id === '17' || id === 'template') {
      return new PrintTemplate(this.pdf, suffix);
    }
    Log.todo('In StartComponent.formFromId fehlen noch Formulare');
    return null;
  }

  showPopup(id: string, data?: any): Observable<DialogResult> {
    if (id == null) {
      return of(null);
    }
    let parts = id?.split('|');
    let cssId = parts[0];
    if (parts.length > 1) {
      id = parts[0];
      cssId = parts[1];
    }

    if (this.dlgList[id] != null) {
      const dlgRef = this.dialog.open(this.dlgList[id], {data: data, panelClass: ['dialog-box', cssId], disableClose: true});
      return dlgRef.afterClosed();
    } else if (id === 'all') {
      for (const key of Object.keys(this.dlgList)) {
        this.dialog.open(this.dlgList[key], {data: data, panelClass: ['dialog-box', key], disableClose: true});
      }
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

  // checks if the url of the user is valid
  async isUserValid(user: UserData) {
    if (user.apiUrl(null, '') == null) {
      return {msg: $localize`Die URL wurde noch nicht festgelegt`};
    }
    let ret = null;
    const check = user.apiUrl(null, 'status');
    await this.ds.request(check).then(response => {
      if (response?.body?.status !== 'ok') {
        ret = GLOBALS.msgUrlFailure(check);
      }
    }).catch(_ => {
      ret = GLOBALS.msgUrlFailure(check);
    });
    return ret;
  }

  async changeLanguage(value: LangData, params?: { doReload?: boolean, checkConfigured?: boolean }) {
    params ??= {};
    params.doReload ??= true;
    params.checkConfigured ??= false;
    GLOBALS.language = value;
    // this.ls.activate(value);
    if (params.checkConfigured && !GLOBALS.isConfigured) {
      this.ss.clearStorage();
    }
    if (params.doReload) {
      if (GLOBALS.isConfigured) {
        this.ds.save({updateSync: false});
      } else {
        this.ds.saveWebData();
      }
      this.ds.reload();
    }
  }

  languageClass(item: LangData): string[] {
    const ret = ['themelogo'];
    if (GLOBALS.language != null && item.code === GLOBALS.language.code) {
      ret.push('currLang');
    }
    return ret;
  }

  activateUser(idx: number): void {
    GLOBALS.userIdx = idx;
    this.ns.reportData = null;
    this.ds.save();
    this.ds.getCurrentGluc();
    this.checkPrint();
    this.ds._initAfterLoad();
  }

  deleteUser(): void {
    this.ms.confirm($localize`Soll der Benutzer ${GLOBALS.user.name} wirklich gelöscht werden?`,
      new DialogParams({theme: 'settings', icon: 'delete'})).subscribe(result => {
      switch (result.btn) {
        case DialogResultButton.yes:
          GLOBALS.userList.splice(GLOBALS.userIdx, 1);
          break;
      }
    });
  }

  handleMissingImage(_evt: ErrorEvent) {
    this.reloadUserImg = false;
    // (evt.target as HTMLImageElement).src = src;
    // (evt.target as HTMLImageElement).style.display = 'none';
  }

  async initialLoad() {
    this.ds.loadWebData();
    await this.ts.setTheme(GLOBALS.theme, false, false);
    this.ts.restoreTheme();
    GLOBALS.listConfig = [];
    GLOBALS.listConfigOrg = [];
    for (const form of this.formList) {
      GLOBALS.listConfigOrg.push(new FormConfig(form, false));
    }
    Utils.pushAll(GLOBALS.listConfig, GLOBALS.listConfigOrg);

    await this.ds.loadSettingsJson();
    let dlgId = GLOBALS.version === GLOBALS.lastVersion ? null : 'whatsnew';
    dlgId = GLOBALS.isConfigured ? dlgId : 'welcome';
    this.showPopup(dlgId).subscribe(_ => {

    });
    // if (!GLOBALS.dsgvoAccepted) {
    //   _currPage = 'dsgvo';
    // }
    // _lastPage = _currPage;
    this.ds.sortConfigs();
    for (const entry of GLOBALS.listConfig) {
      GLOBALS.user.formParams[entry.id] = entry.asString;
    }
  }

  activateShortcut(shortcutIdx: number): void {
    if (shortcutIdx != null) {
      const data = GLOBALS.shortcutList[shortcutIdx];
      this.fillFormsFromShortcut(data);
      this.checkPrint();
      this.ds._initAfterLoad();
    }
  }

  addCopiedForms(): void {
    for (let i = 0; i < GLOBALS.pdfOrder.length; i += 3) {
      const idx = GLOBALS.pdfOrder.substring(i, i + 3);
      const cfg = GLOBALS.listConfig.find((e) => e.idx === idx);
      if (cfg == null) {
        const form = this.formFromId(idx.substring(0, 2), idx.substring(2));
        if (form != null) {
          const newCfg = new FormConfig(form, false);
          GLOBALS.listConfig.push(newCfg);
        }
      }
    }
  }
}
