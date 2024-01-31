import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpRequest} from '@angular/common/http';
import {lastValueFrom, throwError, timeout} from 'rxjs';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {JsonData} from '@/_model/json-data';
import {Log} from '@/_services/log.service';
import {StorageService} from '@/_services/storage.service';
import {Settings} from '@/_model/settings';
import {DatepickerPeriod} from '@/_model/datepicker-period';
import {UserData} from '@/_model/nightscout/user-data';
import {Utils} from '@/classes/utils';
import {ShortcutData} from '@/_model/shortcut-data';
import {WatchElement} from '@/_model/watch-element';
import {DatePipe} from '@angular/common';
import {LangData} from '@/_model/nightscout/lang-data';
import {StatusData} from '@/_model/nightscout/status-data';
import {EntryData} from '@/_model/nightscout/entry-data';
import {TreatmentData} from '@/_model/nightscout/treatment-data';
import {WatchChangeData} from '@/_model/nightscout/watch-change-data';
import {LanguageService} from '@/_services/language.service';
import {EnvironmentService} from '@/_services/environment.service';
import {oauth2SyncType} from '@/_services/sync/oauth2pkce';
import {DropboxService} from '@/_services/sync/dropbox.service';
import {LibreLinkUpService} from '@/_services/libre-link-up.service';
import {MessageService} from '@/_services/message.service';
import {DialogResultButton, DialogType, HelpListItem} from '@/_model/dialog-data';

class CustomTimeoutError extends Error {
  constructor() {
    super('It was too slow');
    this.name = 'CustomTimeoutError';
  }
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  isLoading = false;
  onAfterLoadShared: () => void = null;
  onAfterLoadDevice: () => void = null;
  _googleLoaded = false;
  oauth2AccessToken: string = null;
  msgTextGoogleTag = $localize`Nightscout Reporter kann statistische Daten zur
Benutzung der Seite über Google Analytics auswerten lassen. Das hilft mir (dem Programmierer)
Einblicke in die Verwendung der Seite zu gewinnen und Entscheidungen über die Weiterentwicklung
und die Sprachunterstützung zu treffen. Diese Datenteilung ist vollkommen freiwillig und die
Funktionalität der Seite ist unabhängig von der hier getroffenen Entscheidung.`;
  msgConfirmGoogleTag = $localize`Bist Du damit einverstanden, dass Google Analytics Informationen zu Deiner Verwendung der Seite sammelt?`;
  msgInfoGoogleTag = $localize`Informationen zu Google Analytics`;

  constructor(public http: HttpClient,
              public ss: StorageService,
              public ls: LanguageService,
              public ms: MessageService,
              // public gds: GoogleDriveService,
              public env: EnvironmentService,
              public dbs: DropboxService,
              public llu: LibreLinkUpService
  ) {
    this.llu.updateGluc = () => {
      this.getCurrentGluc.bind(this)({force: true});
    };
    // http.head('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js').subscribe({
    //   next: data => {
    //     this.hasAdBlock = false;
    //     console.log('Kein Adblock da');
    //   }, error: error => {
    //     console.log('Aber sowas von Adblock!');
    //   }
    // });
  }

  get hasSync(): boolean {
    return this.syncType !== oauth2SyncType.none;
  }

  _syncType: oauth2SyncType = oauth2SyncType.none;

  get syncType(): oauth2SyncType {
    return this._syncType;
  }

  set syncType(value: oauth2SyncType) {
    this._syncType = value ?? oauth2SyncType.none;
    this.saveWebData();
    if (this._syncType === oauth2SyncType.none) {
      this.oauth2AccessToken = null;
      this.saveWebData();
    } else {
      this.dbs.connect();
      // this.gds.oauth2Check();
    }
  }

  get defaultWatchEntries(): any[] {
    return [
      {t: 'time', s: 3, b: true},
      {t: 'nl', s: 1},
      {t: 'gluc', s: 5, b: true},
      {t: 'arrow', s: 3},
      {t: 'target', s: 1},
      {t: 'lasttime', s: 1}
    ];
  }

  setPdfOrder(value: string): void {
    GLOBALS._pdfOrder = value;
    this.sortConfigs();
  }

  sortConfigs() {
    if (GLOBALS._pdfOrder === '' || Utils.isEmpty(GLOBALS.listConfig)) {
      return;
    }
    GLOBALS.user.saveParamsToForms();
    const srcList = [...GLOBALS.listConfig];
    GLOBALS.listConfig = [];
    const idxList: string[] = [];
    if (GLOBALS._pdfOrder.length < 48) {
      for (let i = 0; i < GLOBALS._pdfOrder.length; i += 2) {
        idxList.push(GLOBALS._pdfOrder.substring(i, i + 2));
      }
    } else {
      for (let i = 0; i < GLOBALS._pdfOrder.length; i += 3) {
        idxList.push(GLOBALS._pdfOrder.substring(i, i + 3));
      }
    }
    //    const idList = _pdfOrder.split(",");
    for (let i = 0; i < idxList.length; i++) {
      const cfg = srcList.find((cfg) => cfg.idx === idxList[i]);
      if (cfg != null) {
        const idx = srcList.findIndex((cfg) => cfg.idx === idxList[i]);
        srcList.splice(idx, 1);
        GLOBALS.listConfig.push(cfg);
      }
    }
    for (const cfg of srcList) {
      GLOBALS.listConfig.push(cfg);
    }
    GLOBALS.user.loadParamsFromForms();
    this.savePdfOrder();
  }

  savePdfOrder(updateSync = false): void {
    if (Utils.isEmpty(GLOBALS.listConfig)) {
      return;
    }
    const idList = [];
    for (const cfg of GLOBALS.listConfig) {
      idList.push(cfg.idx);
    }
    GLOBALS._pdfOrder = Utils.join(idList, '');
    this.save({updateSync: updateSync, skipReload: true});
  }

  async requestJson(url: string, params?: { method?: string, options?: any, body?: any, showError?: boolean, asJson?: boolean, timeout?: number }) {
    return this.request(url, params).then(response => {
      return response?.body;
    });
  }

  async request(url: string, params?: {
    method?: string,
    options?: any,
    body?: any,
    showError?: boolean,
    asJson?: boolean,
    timeout?: number,
    urlOnError?: string
  }) {
    params ??= {};
    params.method ??= 'get';
    params.showError ??= true;
    params.asJson ??= false;
    params.timeout ??= 1000;
    let response;
    const req = new HttpRequest(params.method, url,
      null,
      params.options);
    try {
      switch (params.method.toLowerCase()) {
        case 'post':
          response = await lastValueFrom(this.http.post(url, params.body, params.options).pipe(timeout({
            each: params.timeout,
            with: () => throwError(() => new CustomTimeoutError())
          })));
          break;
        default:
          response = await lastValueFrom(this.http.request(req).pipe(timeout({
            each: params.timeout,
            with: () => throwError(() => new CustomTimeoutError())
          })));
          break;
      }
    } catch (ex: any) {
      if (params.showError) {
        console.error(ex);
      }
      if (ex instanceof CustomTimeoutError) {
        response = $localize`Es gab keine Antwort innerhalb von ${params.timeout / 1000} Sekunden bei ${url}`;
      } else if (params.urlOnError != null && ex instanceof HttpErrorResponse) {
        this.ms.confirm($localize`Beim Zugriff auf den Server ist ein Fehler aufgetreten. Eine mögliche Ursache dafür ist, dass das Zertifikat des Servers nicht käuflich erworben wurde. Wenn Du die Speicherung der Daten auf dem Server zur Verfügung haben möchtest, dann kannst Du das tun, indem Du im Browser auf der Webseite des Servers die Berechtigung zum Zugriff erteilst. Soll die Webseite des Servers aufgerufen werden, damit Du dort die Berechtigung erteilen kannst?`)
          .subscribe(result => {
            if (result.btn === DialogResultButton.yes) {
              window.open(params.urlOnError, '_blank');
              location.reload();
            }
          });
      } else if (ex?.message != null) {
        response = ex.message;
      } else {
        response = ex;
      }
      if (params.asJson) {
        response = {body: response};
      }
    }
    /*
    .catch(ex => {
            console.error('SO NICHT!!!');
            this.ms.confirm($localize`Beim Zugriff auf den Server ist ein Fehler aufgetreten. Das liegt vermutlich daran, dass das Zertifikat des Servers nicht käuflich erworben wurde. Wenn Du die Speicherung der Daten auf dem Server zur Verfügung haben möchtest, dann kannst Du das tun, indem Du im Browser auf der Webseite des Servers die Berechtigung zum Zugriff erteilst. Soll die Webseite des Servers aufgerufen werden, damit Du dort die Berechtigung erteilen kannst?`)
              .subscribe(result => {
                if (result.btn === DialogResultButton.yes) {
                  window.open(url, '_blank');
                }
              });
          })*/
    return params.asJson ? response.body : response;
  }

  saveDeviceData(): void {
    this.ss.writeCrypt(Settings.DeviceData, GLOBALS.asDeviceString);
  }

  saveWebData(): void {
    const data = {
      w0: GLOBALS.version,
      w1: GLOBALS.language.code ?? 'de_DE',
      w2: GLOBALS.theme,
      w3: this._syncType,
      w4: this.oauth2AccessToken,
      w5: GLOBALS.ownTheme,
      w6: GLOBALS.themeChanged,
      w7: GLOBALS.allowGoogleTag
    };
    this.ss.write(Settings.WebData, data);
  }

  loadWebData(): void {
    try {
      const json = this.ss.read(Settings.WebData);
      const code = JsonData.toText(json.w1);
      GLOBALS.language = GLOBALS.languageList.find((lang) => lang.code === code);
      GLOBALS.theme = JsonData.toText(json.w2, null);
      this._syncType = JsonData.toNumber(json.w3);
      this.oauth2AccessToken = JsonData.toText(json.w4, null);
      GLOBALS.ownTheme = JsonData.toText(json.w5, null);
      GLOBALS.themeChanged = JsonData.toBool(json.w6, false);
      if (json.w7 === 'error') {
        json.w7 = false;
        setTimeout(() => this.googleTagError(), 1000);
      }
      GLOBALS.allowGoogleTag = JsonData.toBool(json.w7, null);
    } catch (ex) {
      Log.devError(ex, `Fehler bei DataService.loadWebData`);
    }
    if (this.oauth2AccessToken == null) {
      this._syncType = oauth2SyncType.none;
    }
  }

  googleTagError() {
    const msg1 = $localize`Du hattest zwar die Erlaubnis für Google Analytics erteilt,
es war aber nicht möglich, diesen Dienst zu erreichen. Möglicherweise ist ein Werbeblocker aktiv.
Die Einwilligung zu Google Analytics wurde zurückgesetzt. Falls Du trotzdem bei der Analyse helfen
möchtest, klicke hier auf`;
    const msg2 = $localize`und deaktiviere bitte das, was die Kommunikation
mit Googles Services verhindert oder erteile nach Deaktivierung die Erlaubnis im Hauptmenü erneut.`;
    const btn = $localize`Analytics erneut prüfen`;
    const list: HelpListItem[] = [
      {type: 'text', text: `${msg1} `},
      {type: 'btn', text: btn, data: () => this.checkAnalyticsAgain(), cls: 'bold'},
      {type: 'text', text: ` ${msg2}`}
    ];
    this.ms.showDialog({
      type: DialogType.confirm,
      title: $localize`Analytics ist nicht erreichbar`,
      controls: [{id: 'help', type: 'helplist', title: '', helpList: list}],
      buttons: [
        {title: $localize`Schliessen`, result: {btn: DialogResultButton.cancel}, icon: 'done'}
      ]
    }, null, true);
  }

  checkAnalyticsAgain(): void {
    GLOBALS.allowGoogleTag = null;
    this.saveWebData();
    this.reload();
  }

  async loadSettingsJson(skipSync = false) {
    try {
      let data = await this.request('assets/settings.json', {asJson: true, showError: false});
      this.extractJsonOverwrites(data);
      data = await this.request('assets/secret.json', {asJson: true, showError: false});
      this.extractJsonOverwrites(data);
    } catch (ex) {
      Log.devError(ex, `Fehler bei DataService.loadSettings`);
    }

    this.loadWebData();
    this.loadFromStorage();
    if (this.syncType !== oauth2SyncType.none && !skipSync) {
      await this._loadFromSync();
    }
    this._initAfterLoad();
  }

  extractJsonOverwrites(data: any): void {
    if (data != null) {
      if (data.urlPlayground != null) {
        GLOBALS.urlPlayground = data.urlPlayground;
      }
      if (data.urlThemeServer != null) {
        if (Array.isArray(data.urlThemeServer)) {
          GLOBALS._urlThemeServer = data.urlThemeServer;
        } else {
          GLOBALS._urlThemeServer = [data.urlThemeServer];
        }
      }
      if (data.googleClientId != null) {
        GLOBALS.googleClientId = data.googleClientId;
      }
      if (data.themeServerSecret != null) {
        GLOBALS.themeServerSecret = data.themeServerSecret;
      }
    }
  }

  _initAfterLoad(): void {
    this.changeLanguage(GLOBALS.language, {doReload: false});
    GlobalsData.updatePeriod(GLOBALS.period);
    GLOBALS.isConfigured =
      GLOBALS.lastVersion != null
      && !Utils.isEmpty(GLOBALS.lastVersion)
      && !Utils.isEmpty(GLOBALS.userList);

    if (GLOBALS.isConfigured && GLOBALS.allowGoogleTag == null) {
      this.confirmGoogleTag();
    }
  }

  confirmGoogleTag() {
    let langCode = GLOBALS.language.shortCode;
    switch (langCode) {
      case 'pt':
        langCode = 'pt-BR_br';
        break;
    }
    const list: HelpListItem[] = [
      {type: 'text', text: `${this.msgTextGoogleTag}<br><br>`},
      {type: 'text', text: `${this.msgConfirmGoogleTag}<br><br>`, cls: 'bold'},
      {type: 'btn', text: this.msgInfoGoogleTag, data: this.ls.analyticsLink(langCode), cls: 'italic'}
    ];

    this.ms.showDialog({
      type: DialogType.error,
      title: $localize`Datenanalyse`,
      controls: [{id: 'help', type: 'helplist', title: '', helpList: list}],
      buttons: [
        {title: $localize`Nein`, result: {btn: DialogResultButton.no}, focus: true, icon: 'thumb_down'},
        {title: $localize`Ja, ich helfe sehr gerne`, result: {btn: DialogResultButton.yes}, icon: 'thumb_up'}
      ]
    }, null, true)
      .subscribe(result => {
        GLOBALS.allowGoogleTag = result?.btn === DialogResultButton.yes;
        this.saveWebData();
        this.reload();
      });
  }

  // loads all settings from localStorage
  loadFromStorage(): void {
    this.isLoading = true;
    const shared = Settings.tiod(this.ss.read(Settings.SharedData, false));
    const device = Settings.tiod(this.ss.read(Settings.DeviceData, false));
    this.fromStrings(shared, device);
    this.loadLocalOnlySettings();
    this.isLoading = false;
  }

  // loads the settings that are not synchronized to google
  loadLocalOnlySettings(): void {
    GLOBALS.fmtDateForDisplay = new DatePipe(GLOBALS.language.code);
    // GLOBALS.currPeriodShift = GLOBALS.listPeriodShift[0];
  }

  // loads the settings from json-encoded strings
  fromStrings(shared: string, device: string) {
    try {
      // shared = shared.replaceAll("\"[", "[");
      // shared = shared.replaceAll("]\"", "]");
      // device = device.replaceAll("{,", "{");
      if (Utils.isEmpty(shared)) {
        shared = '{}';
      }
      if (Utils.isEmpty(device)) {
        device = '{}';
      }
      this.fromSharedJson(JSON.parse(shared));
      this.fromDeviceJson(JSON.parse(device));
    } catch (ex) {
      Log.devError(ex, `Fehler bei DataService.fromStrings`);
    }
  }

  // retrieves the device settings from a string
  fromDeviceString(src: string): void {
    try {
      const json = JSON.parse(src);
      this.fromDeviceJson(json);
    } catch (ex) {
      const msg = ex.toString();
      Log.devError(ex, `Fehler bei DataService.fromDeviceString: ${msg}`);
      console.error(src);
    }
  }

  // loads the device settings from a json stucture
  fromDeviceJson(json: any): void {
    if (GLOBALS.avoidSaveAndLoad) {
      return;
    }
    try {
      GLOBALS.ppHideNightscoutInPDF = JsonData.toBool(json.d1);
      GLOBALS.ppShowUrlInPDF = JsonData.toBool(json.d2);
      GLOBALS.ppHideLoopData = JsonData.toBool(json.d3);
      // GLOBALS.pdfCreationMaxSize = JsonData.toNumber(json.d4);
      GLOBALS.ppStandardLimits = JsonData.toBool(json.d5);
      GLOBALS.ppCGPAlwaysStandardLimits = JsonData.toBool(json.d6);
      GLOBALS.ppComparable = JsonData.toBool(json.d7);
      GLOBALS.ppLatestFirst = JsonData.toBool(json.d8);
      GLOBALS.ppGlucMaxIdx = JsonData.toNumber(json.d9);
      GLOBALS.ppBasalPrecisionIdx = JsonData.toNumber(json.d10);
      GLOBALS.ppFixAAPS30 = JsonData.toBool(json.d11);
      GLOBALS.ppPdfSameWindow = JsonData.toBool(json.d12);
      GLOBALS.ppPdfDownload = JsonData.toBool(json.d13);
      GLOBALS.isWatchColor = JsonData.toBool(json.d14);
      GLOBALS.ppSkipSensorChange = JsonData.toNumber(json.d15);
      // TODO: remove list check after version 4.1.7
      if (Utils.isEmpty(GLOBALS.watchList) && !Utils.isEmpty(json.d16)) {
        let watchEntries = json.d16;
        GLOBALS.watchList = [];
        if (Utils.isEmpty(watchEntries)) {
          watchEntries = this.defaultWatchEntries;
        }
        if (watchEntries != null) {
          for (const entry of watchEntries) {
            GLOBALS.watchList.push(WatchElement.fromJson(entry));
          }
        }
      }
      GLOBALS.lluTimeout = JsonData.toNumber(json.d17, 5);
      GLOBALS.maxGlucAge = JsonData.toNumber(json.d18, 15);
      GLOBALS.lluAutoExec = JsonData.toBool(json.d19);
      GLOBALS.ppShowDurationWarning = JsonData.toBool(json.d20, true);
    } catch (ex) {
      Log.devError(ex, `Fehler bei DataService.fromDeviceJson`);
    }
    try {
      GLOBALS.lluTimeout = Math.max(Math.min(GLOBALS.lluTimeout ?? 5, 5), 1);
      this.onAfterLoadDevice?.();
    } catch (ex) {
      Log.devError(ex, `Fehler bei DataService.fromDeviceJson (onAfterLoadDevice)`);
    }
  }

  // retrieves the shared settings from a string
  fromSharedString(src: string): void {
    try {
      const json = JSON.parse(src);
      this.fromSharedJson(json);
    } catch (ex) {
      const msg = ex.toString();
      Log.devError(ex, `Fehler bei DataService.fromSharedString: ${msg}`);
      console.error(src);
    }
  }

  // loads the shared settings from a json stucture
  fromSharedJson(json: any): void {
    if (GLOBALS.avoidSaveAndLoad) {
      return;
    }
    try {
      GLOBALS.lastVersion = JsonData.toText(json.s1);
      const users = json.s2;
      const shortcuts = json.s3;
      GLOBALS.glucMGDLIdx = JsonData.toNumber(json.s5);
      GLOBALS.editColors = JsonData.toBool(json.s6);
      // Die Speicherung der Sprache in sharedData ist
      // zunächst mal ausgeschaltet, weil das beim Start
      // Probleme mit der Zuordnung gibt
      //
      // const langId = JsonData.toText(json.s6);
      // const idx = GLOBALS.languageList.findIndex((v) => v.code === langId);
      // if (idx >= 0) {
      //   GLOBALS.language = GLOBALS.languageList[idx];
      // }
      // GLOBALS.showCurrentGluc = JsonData.toBool(json.s7);
      GLOBALS.period = new DatepickerPeriod(JsonData.toText(json.s8));
      GLOBALS._pdfOrder = JsonData.toText(json.s9);
      GLOBALS.viewType = JsonData.toText(json.s10);
      GLOBALS.timestamp = JsonData.toNumber(json.s11);
      GLOBALS.tileShowImage = JsonData.toBool(json.s12, true);
      GLOBALS.showAllTileParams = JsonData.toBool(json.s13);
      GLOBALS.userListLoaded = false;
      GLOBALS.userList = [];
      if (users != null) {
        try {
          for (const entry of users) {
            GLOBALS.userList.push(UserData.fromJson(entry));
          }
        } catch (ex) {
          Log.devError(ex, `Fehler bei DataService.fromSharedJson (users)`);
        }
      } else {
        //          saveStorage("mu", null);
      }
      /* With the following code the userlist is reduced to one testuser
            userList.clear();
            UserData u = UserData(this);
            u.name = "Testuser";
            u.birthDate = "13.2.1965";
            u.diaStartDate = "1.1.1996";
            u.insulin = "Novorapid";
            u.listApiUrl = List<UrlData>();
            u.listApiUrl.add(UrlData.fromJson(
                this, {"u": "https://diamant-ns.herokuapp.com", "t": "anditoken-a12e3472efe42759", "sd": null, "ed": null}));
            u.customData = {};
            u.formParams = {};
            userList.add(u);
      // */
      GLOBALS.sortUserList();
      GLOBALS.userListLoaded = true;
      GLOBALS.userIdx = JsonData.toNumber(json.s4);
      // get shortcuts if available
      GLOBALS.shortcutList = [];
      if (shortcuts != null) {
        try {
          for (const entry of shortcuts) {
            GLOBALS.shortcutList.push(ShortcutData.fromJson(entry));
          }
        } catch (ex) {
          Log.devError(ex, `Fehler bei DataService.fromSharedJson (shortcuts)`);
        }
      }
      GLOBALS.apiAuth = JsonData.toText(json.s14, null);
      GLOBALS.publicUsername = JsonData.toText(json.s15, null);
      if (GLOBALS.publicUsername === 'null') {
        GLOBALS.publicUsername = null;
      }
    } catch (ex) {
      Log.devError(ex, `Fehler bei DataService.fromSharedJson`);
    }
    try {
      this.onAfterLoadShared?.();
    } catch (ex) {
      Log.devError(ex, `Fehler bei DataService.fromSharedJson (onAfterLoadShared)`);
    }
  }

  reload(): void {
    if (location.href != location.origin) {
      location.href = location.origin + location.pathname;
    } else {
      location.reload();
    }
  }

  save(params?: { updateSync?: boolean, skipReload?: boolean }) {
    if (GLOBALS.avoidSaveAndLoad) {
      return;
    }
    params ??= {};
    params.updateSync ??= true;
    params.skipReload ??= false;
    if (this.isLoading) {
      return;
    }
    let oldLang: string = null;
    let oldWebTheme: string = null;
    let oldSyncType: number = null;
    let oldOauth2: string = null;
    let oldOwnTheme: string = null;
    try {
      GLOBALS.user.loadParamsFromForms();
      const json = this.ss.read(Settings.WebData);
      oldLang = JsonData.toText(json.w1);
      oldWebTheme = JsonData.toText(json.w2, null);
      oldSyncType = JsonData.toNumber(json.w3);
      oldOauth2 = JsonData.toText(json.w4, null);
      oldOwnTheme = JsonData.toText(json.w5, null);
    } catch (ex) {
      Log.devError(ex, `Fehler bei DataService.save`);
    }

    this.ss.clearStorage();

    if (Log.mayDebug) {
      this.ss.write(Settings.DebugFlag, Settings.DebugActive, false);
    }

    this._syncType = oldSyncType;
    this.oauth2AccessToken = oldOauth2;
    GLOBALS._theme = oldWebTheme;
    GLOBALS.ownTheme = oldOwnTheme;

    this.saveWebData();
    this.ss.writeCrypt(Settings.SharedData, GLOBALS.asSharedString);
    this.saveDeviceData();

    const doReload = (GLOBALS.language.code !== oldLang && GLOBALS.language.code !== null) && !params.skipReload;
    if (this.syncType !== oauth2SyncType.none && params.updateSync) {
      this._uploadToSync(doReload).then(_r => {
      });
    } else if (doReload) {
      this.reload();
    }
  }

  async _loadFromSync() {
    const result = await this.dbs.downloadFile(this.env.settingsFilename);
    if (result?.name === 'HttpErrorResponse') {
      this.dbs.disconnect();
    } else if (result != null) {
      this.fromSharedJson(result);
    }
  }

  // async _loadFromGoogle() {
  // let settings = await this.gds.findFileByName(this.env.settingsFilename, {createIfMissing: true});
  // if (settings == null) {
  //   console.log('loading settings from Nightscout Reporter 3.0');
  //   // load the settings from nightscout reporter 3.0 in the settings, if they are not there
  //   settings = await this.gds.findFileByName('nr-settings', {createIfMissing: false});
  // }
  // // console.log('from Google', settings, settings?.s11, GLOBALS.timestamp);
  // if (settings?.s11 > GLOBALS.timestamp) {
  //   // set the settings retrieved from Google Drive to the internal data
  //   this.fromSharedJson(settings);
  // }

  async _uploadToSync(_doReload: boolean) {
    await this.dbs.uploadFile(this.env.settingsFilename, GLOBALS.asSharedString);
    // if (status.status === gdsStatus.error) {
    //   Log.error(status.text);
    // }
  }

  async changeLanguage(value: LangData, params?: { doReload?: boolean, checkConfigured?: boolean }) {
    params ??= {};
    params.doReload ??= true;
    params.checkConfigured ??= false;
    GLOBALS.language = value;
    if (params.checkConfigured && !GLOBALS.isConfigured) {
      this.ss.clearStorage();
    }
    if (params.doReload) {
      if (GLOBALS.isConfigured) {
        this.save();
      } else {
        this.saveWebData();
      }
      this.reload();
    }
  }

  async setLanguage(value: LangData) {
    GLOBALS.language = value;
    this.saveWebData();
    this.save();
    this.ls.activate(value.code);
    // Intl.systemLocale = Intl.canonicalizedLocale(language.code);
    // await tz.initializeTimeZone();
    // await initializeMessages(language.code);
    // Intl.defaultLocale = language.code;
    // await initializeDateFormatting(language.code, null);
  }

  copyFromOtherStorage(): void {
    GLOBALS.isBeta = !GLOBALS.isBeta;

    this.loadSettingsJson().then((_) => {
      GLOBALS.isBeta = !GLOBALS.isBeta;
      this.save();
    });
  }

  async getCurrentGluc(params?: { force?: boolean, timeout?: number }) {
    // Log.debug('{time} fetching current gluc...');
    params ??= {};
    params.force ??= false;
    params.timeout ??= 60;
    if (GLOBALS.glucTimer != null) {
      clearTimeout(GLOBALS.glucTimer);
      GLOBALS.glucTimer = null;
    }
    // make sure the value uses the correct factor
    GLOBALS.user.adjustGluc = GLOBALS.user.adjustGluc;

    GLOBALS.currentGlucCounter++;

    if (GLOBALS.glucRunning) {
      // Log.debug('{time} glucRunning!');
      return;
    }

    GLOBALS.glucRunning = true;
    let url = GLOBALS.user.apiUrl(null, 'status.json');
    let status: StatusData = null;
    if (!GLOBALS.hasMGDL) {
      const content = await this.requestJson(url);
      if (content != null) {
        status = StatusData.fromJson(content);
        GLOBALS.setGlucMGDL(status);
        GLOBALS.targetBottom = status.settings.bgTargetBottom;
        GLOBALS.targetTop = status.settings.bgTargetTop;
      }
    }
    url = GLOBALS.user.apiUrl(null, 'entries.json', {params: 'count=20'});
    // Log.debug(`{time} waiting for ${url}`);
    let src: any[] = await this.requestJson(url);
    // Log.debug(`{time} returned`);
    if (src != null) {
      src.sort((a, b) => {
        return Utils.compare(b.date, a.date);
      });
      if (src.length != 20) {
        GLOBALS.currentGlucSrc = null;
        GLOBALS.lastGlucSrc = null;
        GLOBALS.currentGlucDiff = '';
        GLOBALS.glucDir = 360;
      } else {
        try {
          let eLast = EntryData.fromJson(src[0]);
          let ePrev: EntryData = null;
          for (let i = 1; i < src.length && ePrev == null; i++) {
            const check = EntryData.fromJson(src[i]);
            if (check.device === eLast.device) {
              ePrev = check;
            }
          }
          if (ePrev == null) {
            ePrev = eLast;
          }
          const span = Math.max(Utils.differenceInMinutes(eLast.time, ePrev.time), 1);
          GLOBALS.glucDir = 360;
          GLOBALS.currentGlucDiff = '';
          GLOBALS.currentGlucPast = Utils.differenceInMinutes(GlobalsData.now, eLast.time);
          GLOBALS.currentGlucTime = GLOBALS.msgGlucTime(GLOBALS.currentGlucPast);
          // const chk = new Date().getHours() * 100 + new Date().getMinutes();
          if (span > 15) {// || (chk >= 2100 && chk <= 2105)) {
            this.refreshCurrentTimer(params);
            return;
          }
          if (GLOBALS.currentGlucValid || GLOBALS.currentGlucSrc == null) {
            GLOBALS.currentGlucSrc = eLast;
            GLOBALS.lastGlucSrc = ePrev;
          }
          // console.log('----------------------------');
          // console.log('Lokal', GlobalsData.now);
          // console.log('Server', eLast.time);
          const diff = eLast.gluc - ePrev.gluc;
          GLOBALS.currentGlucDiff = `${eLast.gluc > ePrev.gluc ? '+' : ''}${GLOBALS.fmtNumber(diff / span / GLOBALS.glucFactor, GLOBALS.glucPrecision)}`;
          const limit = Math.floor(10 * span);
          if (diff > limit) {
            GLOBALS.glucDir = -90;
          } else if (diff < -limit) {
            GLOBALS.glucDir = 90;
          } else {
            GLOBALS.glucDir = 90 - Math.floor((diff + limit) / limit * 90);
          }
        } catch (ex) {
          GLOBALS.currentGlucSrc = null;
          GLOBALS.lastGlucSrc = null;
          GLOBALS.currentGlucDiff = '';
          GLOBALS.glucDir = 360;
        }
      }
    }

    const changes: any = {
      ampulle: new WatchChangeData('ampulle', '?', status?.extendedSettings.iage),
      katheter: new WatchChangeData('katheter', '?', status?.extendedSettings.cage),
      battery: new WatchChangeData('battery', '?', status?.extendedSettings.bage),
      sensor: new WatchChangeData('sensor', '?', status?.extendedSettings.sage)
    };
    const end = new Date();
    const beg = Utils.addDateMonths(end, -1);
    url = GLOBALS.user.apiUrl(null, 'treatments.json', {
      params: `find[created_at][$lte]=${end.toISOString()}`
        + `&find[created_at][$gte]=${beg.toISOString()}`
        + `&find[eventType][$regex]=Change`
    });
    // Log.debug(`{time} waiting for ${url}`);
    src = await this.requestJson(url);
    // Log.debug(`{time} returned`);
    if (src != null) {
      const list = [];
      for (const entry of src) {
        list.push(TreatmentData.fromJson(entry));
      }
      list.sort((a, b) => Utils.compareDate(a.createdAt, b.createdAt));
      for (const change of list) {
        const timeDisp = Utils.durationText(change.createdAt, GlobalsData.now);
        if (change.isInsulinChange) {
          changes['ampulle'].lasttime = timeDisp;
          changes['ampulle'].calcAlarm(change.createdAt);
        } else if (change.isSiteChange) {
          changes['katheter'].lasttime = timeDisp;
          changes['katheter'].calcAlarm(change.createdAt);
        } else if (change.isPumpBatteryChange) {
          changes['battery'].lasttime = timeDisp;
          changes['battery'].calcAlarm(change.createdAt);
        } else if (change.isSensorChange) {
          changes['sensor'].lasttime = timeDisp;
          changes['sensor'].calcAlarm(change.createdAt);
        }
      }
    }
    GLOBALS.currentChanges = changes;

    if (params.force) {
      this.refreshCurrentTimer(params);
    }
    GLOBALS.glucRunning = false;
  }

  refreshCurrentTimer(params: { force?: boolean, timeout?: number }): void {
    if (GLOBALS.lluAutoExec && !GLOBALS.currentGlucValid) {
      this.llu.executeOnce();
    }
    let milliseconds = params.timeout * 1000;
    // calculate the milliseconds to the next full part of the minute for the timer
    // (e.g. now is 10:37:27 and timeout is 30, will result in 3000 milliseconds
    // this is done for that the display of the time will match the current
    // time when entering a new minute
    const milliNow = GlobalsData.now.getSeconds() * 1000 + GlobalsData.now.getMilliseconds();
    const part = Math.floor(milliNow / milliseconds);
    milliseconds = (part + 1) * milliseconds - milliNow;
    // Log.debug(`{time} initiating timer ${milliseconds}`);
    GLOBALS.glucTimer = setTimeout(() => this.getCurrentGluc(params), milliseconds);
    // Log.debug(`{time} resetting glucRunning`);
    GLOBALS.glucRunning = false;
  }

  saveShortcuts(): void {
    if (GLOBALS.currShortcut != null) {
      if (GLOBALS.currShortcutIdx == null || GLOBALS.currShortcutIdx < 0) {
        GLOBALS.shortcutList.push(GLOBALS.currShortcut);
      } else {
        GLOBALS.shortcutList[GLOBALS.currShortcutIdx] = GLOBALS.currShortcut.copy;
      }
    }
    GLOBALS.currShortcut = null;
    GLOBALS.currShortcutIdx = -1;
    this.save();
  }
}
