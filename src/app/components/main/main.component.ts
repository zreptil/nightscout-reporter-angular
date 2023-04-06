import {Component, OnInit} from '@angular/core';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {ThemeService} from '@/_services/theme.service';
import {DataService} from '@/_services/data.service';
import {PdfService} from '@/_services/pdf.service';
import {FormConfig} from '@/forms/form-config';
import {Utils} from '@/classes/utils';
import {SessionService} from '@/_services/session.service';
import {ProgressService} from '@/_services/progress.service';
import {UserData} from '@/_model/nightscout/user-data';
import {NightscoutService} from '@/_services/nightscout.service';
import {ShortcutData} from '@/_model/shortcut-data';
import {oauth2SyncType} from '@/_services/sync/oauth2pkce';
import {DialogParams, DialogResultButton} from '@/_model/dialog-data';
import {DropboxService} from '@/_services/sync/dropbox.service';
import {MessageService} from '@/_services/message.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  /*
        bool dropElement(html.Element drag, html.Element drop) {
          const dragId = drag.getAttribute('id').substring(5);
          const dropId = drop.getAttribute('id').substring(5);
          if (dragId === dropId) return false;

          FormConfig dragCfg;
          const dragIdx = -1;
          const dropIdx = -1;
          for (let i = 0; i < g.listConfig.length; i++) {
            if (g.listConfig[i].id === dragId) {
              dragCfg = g.listConfig[i];
              dragIdx = i;
            }
            if (g.listConfig[i].id === dropId) dropIdx = i;
          }
          if (dragCfg != null && dropIdx >= 0) {
            g.listConfig.removeAt(dragIdx);
            g.listConfig.insert(dragIdx < dropIdx ? dropIdx - 1 : dropIdx, dragCfg);
          }
          this.ds.savePdfOrder();
          return true;
        }

        Draggable _drag;
        Dropzone _drop;
        String msgModelName = Intl.message('Max Mustermann', desc: 'modelname used in images on tiles');

        ReportData reportData;

        bool checkCfg(const cfg) => cfg.checked && (!cfg.form.isDebugOnly || g.isDebug) && (!cfg.form.isLocalOnly || g.isLocal);

        void clickMenuButton(String type) {
          drawerVisible = false;
          switch (type) {
            case 'facebook':
              navigate('https://www.facebook.com/nightrep');
              break;
            case 'autotune':
              navigate('https://autotuneweb.azurewebsites.net/');
              break;
            case 'translate':
              navigate('https://translate.google.com/toolkit/');
              break;
            case 'jsonparser':
              navigate('https://jsonformatter.org/json-parser');
              break;
            case 'nswatch':
              navigate('?watch');
              break;
            case 'nsreports':
              callNightscoutReports();
              break;
            case 'nightscout':
              callNightscout();
              break;
            case 'whatsnew':
              currPage = 'whatsnew';
              break;
            case 'nightscoutstatus':
              callNightscoutStatus();
              break;
            case 'menu':
              changeView();
              break;
            case 'settings':
              g.save();
              currPage = 'settings';
              break;
          }
        }
      */
  sendIcon = 'send';
  menuIdx = 0;

  constructor(public ts: ThemeService,
              public ds: DataService,
              public pdf: PdfService,
              public ss: SessionService,
              public ps: ProgressService,
              public ns: NightscoutService,
              public dbs: DropboxService,
              public ms: MessageService
  ) {
    // setTimeout(() => this.ss.showPopup('all').subscribe(_ => {
    //
    // }), 1000);
  }

  get hasFooterBar(): boolean {
    return GLOBALS.viewType === 'tile' || GLOBALS.viewType === 'users';
  }

  get userIdx(): number {
    return GLOBALS.userIdx;
  }

  set userIdx(value: number) {
    if (value !== GLOBALS.userIdx) {
      this.ns.reportData = null;
    }
    GLOBALS.userIdx = value;

  }

  get msgAddText(): string {
    return $localize`Hinzufügen`;
  }

  get globals(): GlobalsData {
    return GLOBALS;
  }

  get createIcon(): string {
    return GLOBALS.isDebug ? 'vertical_align_bottom' : this.sendIcon;
  }

  get classForHeader(): string[] {
    const ret = ['mat-elevation-z4'];
    if (GLOBALS.isDebug) {
      ret.push('debug');
    }
    return ret;
  }

  get drawerClass(): string[] {
    const ret = ['material-drawer-button'];
    switch (this.menuIdx) {
      case 0:
        ret.push('icon-menu');
        break;
      case 1:
        ret.push('icon-shortcut');
        break;
    }
    return ret;
  }

  get msgImpressum(): string {
    return $localize`Impressum`;
  }

  get msgDSGVO(): string {
    return $localize`Datenschutzerklärung`;
  }

  shortcutClass(data: ShortcutData): string[] {
    const ret = ['shortcut'];
    if (data.isActive) {
      ret.push('active');
    }
    return ret;
  }

  editShortcut(shortcutIdx: number): void {
    GLOBALS.currShortcutIdx = shortcutIdx;
    if (shortcutIdx >= 0 && shortcutIdx < GLOBALS.shortcutList.length) {
      GLOBALS.currShortcut = GLOBALS.shortcutList[shortcutIdx].copy;
    } else {
      GLOBALS.currShortcut = new ShortcutData();
    }
    this.ss.showPopup('shortcutedit');
  }

  sendClass(shift: number, ret: string): string {
    if (ret !== 'stop' &&
      this.ns.reportData != null &&
      GLOBALS.period.shiftStartBy(shift) === this.ns.reportData.begDate &&
      GLOBALS.period.shiftEndBy(shift) === this.ns.reportData.endDate) {
      ret = `${ret} sendMarked`;
    }
    return ret;
  }

  clickSend() {
    switch (this.sendIcon) {
      case 'send':
        this.ss.showPopup('outputparams').subscribe(_ => {

        });
        break;
      case 'close':
        this.sendIcon = 'send';
        break;
    }
  }

  classForView(def: string): string[] {
    const ret = [def];
    if (def === 'footer' && this.ps.text != null) {
      return ret;
    }
    switch (GLOBALS.viewType) {
      case 'tile':
        ret.push('is-tileview');
        break;
    }

    return ret;
  }

  userClass(user: UserData): string[] {
    const ret = ['selectItem'];
    if (!user.isReachable) {
      ret.push('unreachable');
    }
    return ret;
  }

  clickLocalTitle() {
    GLOBALS.isLocal = !GLOBALS.isLocal;
    this.ss.checkPrint();
  }

  async ngOnInit() {
    this.ds.onAfterLoadShared = this.afterLoad.bind(this);
    this.ss.initialLoad();
    // this.ds.loadWebData();
    // await this.ts.setTheme(GLOBALS.theme);
    // this.ds.onAfterLoadShared = this.afterLoad.bind(this);
    // GLOBALS.listConfig = [];
    // GLOBALS.listConfigOrg = [];
    // for (const form of this.ss.formList) {
    //   GLOBALS.listConfigOrg.push(new FormConfig(form, false));
    // }
    // Utils.pushAll(GLOBALS.listConfig, GLOBALS.listConfigOrg);
    //
    // this.ds.loadSettingsJson().then((_) => {
    //   let dlgId = GLOBALS.version === GLOBALS.lastVersion ? null : 'whatsnew';
    //   dlgId = GLOBALS.isConfigured ? dlgId : 'welcome';
    //   this.ss.showPopup(dlgId).subscribe(_ => {
    //
    //   });
    //   // if (!GLOBALS.dsgvoAccepted) {
    //   //   _currPage = 'dsgvo';
    //   // }
    //   // _lastPage = _currPage;
    //   this.ds.sortConfigs();
    //   for (const entry of GLOBALS.listConfig) {
    //     GLOBALS.user.formParams[entry.id] = entry.asString;
    //   }
    //   /*
    //
    //           try {
    //             GLOBALS.period.minDate = Date.parseLoose(GLOBALS.user.birthDate, GLOBALS.fmtDateForDisplay);
    //           } catch (ex) {
    //             GLOBALS.period.minDate = null;
    //           }
    //           GLOBALS.getCurrentGluc();
    //           if (_currPage === 'whatsnew') GLOBALS.saveWebData();
    //           checkPrint();
    //       //*/
    // });
  }

  afterLoad(): void {
    for (let i = 0; i < GLOBALS.pdfOrder.length; i += 3) {
      const idx = GLOBALS.pdfOrder.substring(i, i + 3);
      const cfg = GLOBALS.listConfig.find((e) => e.idx === idx);
      if (cfg == null) {
        const form = this.ss.formFromId(idx.substring(0, 2), idx.substring(2));
        if (form != null) {
          const newCfg = new FormConfig(form, false);
          GLOBALS.listConfig.push(newCfg);
        }
      }
    }
    GLOBALS.listConfigOrg = [];
    Utils.pushAll(GLOBALS.listConfigOrg, GLOBALS.listConfig);
    this.ss.checkPrint();
  }

  clickMenuButton(type: string) {
    switch (type) {
      case 'facebook':
        this.ss.navigate('https://www.facebook.com/nightrep');
        break;
      case 'autotune':
        this.ss.navigate('https://autotuneweb.azurewebsites.net/');
        break;
      case 'translate':
        this.ss.navigate('https://translate.google.com/toolkit/');
        break;
      case 'jsonparser':
        this.ss.navigate('https://jsonformatter.org/json-parser');
        break;
      case 'nswatch':
        this.ss.navigate('#watch');
        break;
      case 'nsreports':
        this.ss.navigate(GLOBALS.user.reportUrl);
        break;
      case 'nightscout':
        this.ss.navigate(GLOBALS.user.apiUrl(null, '', {noApi: true}));
        break;
      case 'menu':
        this.changeView();
        break;
      case 'local-tools':
        this.ss.navigate('#tools');
        break;
      case 'googlecloud':
        this.ss.navigate('https://navid200.github.io/xDrip/docs/Nightscout/GoogleCloud.html');
        break;
    }
  }

  changeView(): void {
    switch (GLOBALS.viewType) {
      case 'list':
        GLOBALS.viewType = 'tile';
        break;
      case 'tile':
        GLOBALS.viewType = 'list';
        break;
    }
    this.ds.save();
    this.ss.checkPrint();
  }

  getDrawerButtonClass(menu: number): string[] {
    const ret = [];
    switch (menu) {
      case 0:
        ret.push('menu-button');
        break;
      case 1:
        ret.push('shortcut-button');
        break;
    }

    return ret;
  }

  getDrawerClass(menu: number): string[] {
    const ret = [];
    switch (menu) {
      case 0:
        ret.push('menu-root');
        break;
      case 1:
        ret.push('shortcut-root');
        break;
    }

    if (menu != this.menuIdx) {
      ret.push('hidden');
    }

    return ret;
  }

  clickDebugTrigger() {
    this.ns.reportData = null;
    GLOBALS.isDebug = !GLOBALS.isDebug;
    this.ss.checkPrint();
  }

  toggleSync() {
    if (this.ds.syncType === oauth2SyncType.dropbox) {
      const params = new DialogParams();
      params.image = 'assets/img/dropbox.png';
      this.ms.confirm($localize`Soll die Synchronisierung mit Dropbox aufgehoben werden?`, params).subscribe(result => {
        if (result.btn == DialogResultButton.yes) {
          this.dbs.disconnect();
          this.ds.syncType = oauth2SyncType.none;
        }
      });
    } else {
      this.dbs.connect();
    }
  }

  clickUserImage() {
    this.ss.reloadUserImg = true;
    // console.log(JSON.parse(atob(this.gs?.id_token?.split('.')[1])));
  }

  clickUser() {
    GLOBALS.viewType = GLOBALS.viewType === 'users' ? 'tile' : 'users';
  }
}
