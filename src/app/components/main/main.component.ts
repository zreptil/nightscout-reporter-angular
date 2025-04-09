import {AfterViewInit, Component, OnInit} from '@angular/core';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {ThemeService} from '@/_services/theme.service';
import {DataService} from '@/_services/data.service';
import {PdfService} from '@/_services/pdf.service';
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
import {CloseButtonData} from '@/controls/close-button/close-button-data';
import {ColorData} from '@/_model/color-data';
import {LanguageService} from '@/_services/language.service';
import {EnvironmentService} from '@/_services/environment.service';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  standalone: false
})
export class MainComponent implements OnInit, AfterViewInit {
  sendIcon = 'send';
  menuIdx = 0;
  closeData: CloseButtonData = {
    showClose: false,
    colorKey: 'main'
  };
  msgDevWarn = $localize`Das ist eine Warnung.`;
  msgDevError = $localize`Das war ein Fehler!!`;
  svgCollection: SafeHtml;
  keepCover = false;

  constructor(public ts: ThemeService,
              public ds: DataService,
              public pdf: PdfService,
              public ss: SessionService,
              public ps: ProgressService,
              public ns: NightscoutService,
              public dbs: DropboxService,
              public ms: MessageService,
              public ls: LanguageService,
              public env: EnvironmentService,
              public sanitizer: DomSanitizer
  ) {
    // this.keepCover = this.ss.mayDebug;
  }

  get classForContent(): string[] {
    const ret = ['content'];
    if (GLOBALS.viewType === 'users') {
      ret.push('users');
    }
    return ret;
  }

  get msgThemes(): string {
    return $localize`Farbthemen`;
  }

  get hasFooterBar(): boolean {
    const list = ['tile', 'users', 'themes'];
    return list.indexOf(GLOBALS.viewType) >= 0;
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
    const ret = [];
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
    return $localize`Datenschutz-erklärung`;
  }

  test(value: number[][]): ColorData[] {
    return [...value.map(v => new ColorData(v))];
  }

  shortcutClass(data: ShortcutData): string[] {
    const ret = ['shortcut'];
    if (data.isActive) {
      ret.push('active');
    }
    return ret;
  }

  callShortcut(shortcutIdx: number) {
    const shortcut = GLOBALS.shortcutList[shortcutIdx];
    const url = `${location.origin}/shortcut?name=${shortcut.name}&user=${GLOBALS.user.name}&shift=${shortcut.periodShift}&device=`;
    window.open(url);
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
    const lng = JSON.parse(localStorage.getItem('webData'))?.w1 || 'de-DE';
    if (lng !== 'de-DE') {
      this.ls.activate(lng);
    }
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
    this.ss.addCopiedForms();
    GLOBALS.listConfigOrg = [];
    Utils.pushAll(GLOBALS.listConfigOrg, GLOBALS.listConfig);
    this.ss.checkPrint();
  }

  clickMenuButton(evt: MouseEvent, type: string) {
    evt?.stopPropagation();
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
        this.ss.navigate('watch');
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
        this.ss.navigate('tools');
        break;
      case 'googlecloud':
        this.ss.navigate('https://navid200.github.io/xDrip/docs/Nightscout/GoogleCloud.html');
        break;
      case 'analytics':
        this.ss.navigate('https://analytics.google.com/analytics/web/?utm_source=marketingplatform.google.com&utm_medium=et&utm_campaign=marketingplatform.google.com%2Fabout%2Fanalytics%2F#/p419132738/reports/reportinghub');
        break;
      case 'feedback':
        this.sendFeedback();
        break;
      case 'dropboxlink':
        window.open(`https://www.dropbox.com/home/Apps/Nightscout%20Reporter?select=${this.env.settingsFilename}`);
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
    this.ds.save();
  }

  clickTheme() {
    GLOBALS.viewType = 'tile';
    this.ds.save();
  }

  clickAddUser() {
    this.ss.showSettings(() => {
    }, {cmd: 'addUser'});
  }

  sendFeedback() {
    const params: any = {
      subject: $localize`Feedback zu Nightscout Reporter ${GLOBALS.version}`,
      body: `${GLOBALS.user.name}%0d----%0dURL zur Nightscout Instanz:%0d${GLOBALS.user.urlDataFor(new Date()).fullUrl('', '', true)}%0d----%0d`
    };
    const regex = new RegExp('(de\-|en\-).*', 'g');
    if (!regex.test(GLOBALS.language.code)) {
      const msg = 'Please note: I, the developer, can only understand German or English. '
        + 'Please use one of these languages for communication. '
        + 'This will make it easier for both of us.';
      params.body = `${msg}%0d%0d${params.body}`;
    }
    const paramList: string[] = [];
    for (const key of Object.keys(params)) {
      paramList.push(`${key}=${params[key]}`)
    }
    this.ss.navigate(`mailto:nightscoutreporter@gmail.com?${Utils.join(paramList, '&')}`);
  }

  async ngAfterViewInit() {
    let theme: any;
    if (GLOBALS.theme !== 'standard' && GLOBALS.theme !== 'xmas') {
      theme = JSON.parse(Utils.decodeBase64(GLOBALS.ownTheme)) ?? {};
    } else {
      await this.ts.setTheme(GLOBALS.theme, false, false);
      theme = this.ts.currTheme;
    }
    document.body.style.setProperty('background', theme.mainBodyBack);
    document.getElementById('cover').style.setProperty('background', theme.mainBodyBack);
//    document.getElementById('owl').style.setProperty('background', theme.mainBodyBack);
//     if (theme === 'standard' || theme === 'own' || theme === 'xmas') {
//       document.getElementById('owl')?.setAttribute('src', 'src/assets/themes/' + theme + '/owl' + suffix + '.png');
//       document.getElementById('themestyle')?.setAttribute('href', 'src/assets/themes/' + theme + '/index.css');
//       document.getElementById('favicon')?.setAttribute('href', 'src/assets/themes/' + theme + '/favicon' + suffix + '.png');
//     }
    if (this.svgCollection == null) {
      setTimeout(() => {
        this.svgCollection = {};
        this.ds.request('assets/img/owl.svg', {options: {responseType: 'text'}}).then(result => {
          this.svgCollection = this.sanitizer.bypassSecurityTrustHtml(result.body);
        });
      });
    }
  }
}
