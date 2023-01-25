import {Injectable} from '@angular/core';
import {HttpClient, HttpRequest} from '@angular/common/http';
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
  onAfterLoad: () => void = null;
  _googleLoaded = false;
  settingsFilename = 'nightrep-settings';
  oauthToken: string = null;

  constructor(public http: HttpClient,
              public ss: StorageService,
              public ls: LanguageService,
              // public gds: GoogleDriveService,
              public env: EnvironmentService
  ) {
    // http.head('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js').subscribe({
    //   next: data => {
    //     this.hasAdBlock = false;
    //     console.log('Kein Adblock da');
    //   }, error: error => {
    //     console.log('Aber sowas von Adblock!');
    //   }
    // });
  }

  _syncWithGoogle = false;

  get syncWithGoogle(): boolean {
    return this._syncWithGoogle;
  }

  set syncWithGoogle(value: boolean) {
    this._syncWithGoogle = value ?? false;
    this.saveWebData();
    if (this._syncWithGoogle) {
      // this.gds.oauth2Check();
    } else {
      this.oauthToken = null;
      this.saveWebData();
    }
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

  savePdfOrder(): void {
    if (Utils.isEmpty(GLOBALS.listConfig)) {
      return;
    }
    const idList = [];
    for (const cfg of GLOBALS.listConfig) {
      idList.push(cfg.idx);
    }
    GLOBALS._pdfOrder = Utils.join(idList, '');
    this.save({updateSync: false});
  }

  async requestJson(url: string, params?: { method?: string, options?: any, body?: any, showError?: boolean, asJson?: boolean, timeout?: number }) {
    return this.request(url, params).then(response => {
      return response?.body;
    });
  }

  async request(url: string, params?: { method?: string, options?: any, body?: any, showError?: boolean, asJson?: boolean, timeout?: number }) {
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
      if (ex instanceof CustomTimeoutError) {
        response = $localize`Es gab keine Antwort innerhalb von ${params.timeout / 1000} Sekunden bei ${url}`;
      } else if (ex?.messge != null) {
        response = ex.message;
      } else {
        response = ex;
      }
    }
    return params.asJson ? response.body : response;
  }

  saveWebData(): void {
    const data = {
      w0: GLOBALS.version,
      w1: GLOBALS.language.code ?? 'de_DE',
      w2: GLOBALS._theme,
      w3: (this._syncWithGoogle ?? false) ? 'true' : 'false',
      w4: this.oauthToken
    };
    this.ss.write(Settings.WebData, data);
    // `{"w0":"${GLOBALS.version}"`
    // + `,"w1":"${GLOBALS.language.code ?? 'de_DE'}"`
    // + `,"w2":"${GLOBALS.theme}"`
    // + `,"w3":${(this._syncGoogle ?? false) ? 'true' : 'false'}`
    // + '}');
  }

  loadWebData(): void {
    try {
      const json = this.ss.read(Settings.WebData);
      const code = JsonData.toText(json.w1);
      GLOBALS.language = GLOBALS.languageList.find((lang) => lang.code === code);
      GLOBALS.theme = JsonData.toText(json.w2, null);
      this._syncWithGoogle = JsonData.toBool(json.w3);
      this.oauthToken = JsonData.toText(json.w4, null);
    } catch (ex) {
      Log.devError(ex, `Fehler bei DataService.loadWebData`);
    }
  }

  async loadSettingsJson(skipSyncGoogle = false) {
    try {
      const data = await this.request('assets/settings.json', {showError: false});
      if (data != null) {
        if (data.urlPlayground != null) {
          GLOBALS.urlPlayground = data.urlPlayground;
        }
        if (data.googleClientId != null) {
          GLOBALS.googleClientId = data.googleClientId;
        }
      }
    } catch (ex) {
      Log.devError(ex, `Fehler bei DataService.loadSettings`);
    }

    this.loadWebData();
    this.loadFromStorage();
    if (this.syncWithGoogle && !skipSyncGoogle) {
      await this._loadFromGoogle();
    }
    this._initAfterLoad();
  }

  _initAfterLoad(): void {
    this.changeLanguage(GLOBALS.language, {doReload: false});
    GlobalsData.updatePeriod(GLOBALS.period);
    GLOBALS.isConfigured =
      GLOBALS.lastVersion != null
      && !Utils.isEmpty(GLOBALS.lastVersion)
      && !Utils.isEmpty(GLOBALS.userList);
  }

  async _loadFromGoogle() {
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
    GLOBALS.currPeriodShift = GLOBALS.listPeriodShift[0];
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
    } catch (ex) {
      Log.devError(ex, `Fehler bei DataService.fromDeviceJson`);
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
    try {
      GLOBALS.lastVersion = JsonData.toText(json.s1);
      const users = json.s2;
      const shortcuts = json.s3;
      GLOBALS.glucMGDLIdx = JsonData.toNumber(json.s5);
      const langId = JsonData.toText(json.s6);
      const idx = GLOBALS.languageList.findIndex((v) => v.code === langId);
      if (idx >= 0) {
        GLOBALS.language = GLOBALS.languageList[idx];
      }
      GLOBALS.showCurrentGluc = JsonData.toBool(json.s7);
      GLOBALS.period = new DatepickerPeriod(JsonData.toText(json.s8));
      GLOBALS._pdfOrder = JsonData.toText(json.s9);
      GLOBALS.viewType = JsonData.toText(json.s10);
      GLOBALS.timestamp = JsonData.toNumber(json.s11);
      GLOBALS.tileShowImage = JsonData.toBool(json.s12, true);
      GLOBALS.showAllTileParams = JsonData.toBool(json.s13);
      let watchEntries = json.s14;
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
      // get watch entries if available
      GLOBALS.watchList = [];
      if (Utils.isEmpty(watchEntries)) {
        watchEntries = [
          {t: 'time', s: 3, b: true},
          {t: 'nl', s: 1},
          {t: 'gluc', s: 5, b: true},
          {t: 'arrow', s: 3},
          {t: 'target', s: 1},
          {t: 'lasttime', s: 1}
        ];
      }
      if (watchEntries != null) {
        try {
          for (const entry of watchEntries) {
            GLOBALS.watchList.push(WatchElement.fromJson(entry));
          }
        } catch (ex) {
          Log.devError(ex, `Fehler bei DataService.fromSharedJson (watchEntries)`);
        }
      }
    } catch (ex) {
      Log.devError(ex, `Fehler bei DataService.fromSharedJson`);
    }
    try {
      if (this.onAfterLoad != null) {
        this.onAfterLoad();
      }
    } catch (ex) {
      Log.devError(ex, `Fehler bei DataService.fromSharedJson (onAfterLoad)`);
    }
  }

  reload(): void {
    const pos = window.location.href.indexOf('?');
    if (pos > 0) {
      window.location.href = window.location.href.substring(0, pos - 1);
    } else {
      window.location.reload();
    }
  }

  save(params?: { updateSync?: boolean, skipReload?: boolean }) {
    params ??= {};
    params.updateSync ??= true;
    params.skipReload ??= false;
    if (this.isLoading) {
      return;
    }
    let oldLang: string = null;
    let oldWebTheme: string = null;
    let oldGoogle: boolean = null;
    try {
      GLOBALS.user.loadParamsFromForms();
      const json = this.ss.read(Settings.WebData);
      oldLang = JsonData.toText(json.w1);
      oldWebTheme = JsonData.toText(json.w2);
      oldGoogle = JsonData.toBool(json.w3);
    } catch (ex) {
      Log.devError(ex, `Fehler bei DataService.save`);
    }

    this.ss.clearStorage();

    if (Log.mayDebug) {
      this.ss.write(Settings.DebugFlag, Settings.DebugActive, false);
    }

    this.syncWithGoogle = oldGoogle;
    GLOBALS._theme = oldWebTheme;

    this.saveWebData();
    this.ss.writeCrypt(Settings.SharedData, GLOBALS.asSharedString);
    this.ss.writeCrypt(Settings.DeviceData, GLOBALS.asDeviceString);

    const doReload = (GLOBALS.language.code !== oldLang && GLOBALS.language.code !== null) && !params.skipReload;
    if (this.syncWithGoogle && params.updateSync) {
      this._uploadToGoogle(doReload).then(_r => {
      });
    } else if (doReload) {
      this.reload();
    }
  }

  // noinspection JSUnusedLocalSymbols
  async _uploadToGoogle(doReload: boolean) {
    // const status = await this.gds.uploadFile(this.env.settingsFilename, GLOBALS.asSharedString);
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
        this.reload();
      }
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
    params ??= {};
    params.force ??= false;
    params.timeout ??= 60;
    let ret = '';
    if (GLOBALS.glucTimer != null) {
      clearTimeout(GLOBALS.glucTimer);
      GLOBALS.glucTimer = null;
    }
    // make sure the value uses the correct factor
    GLOBALS.user.adjustGluc = GLOBALS.user.adjustGluc;

    GLOBALS.currentGlucCounter++;

    if (GLOBALS.glucRunning) {
      return '';
    }

    if (!params.force && !GLOBALS.showCurrentGluc) {
      return '';
    }
    GLOBALS.glucRunning = true;
    let url = GLOBALS.user.apiUrl(null, 'status.json');
    if (!GLOBALS.hasMGDL) {
      const content = await this.requestJson(url);
      if (content != null) {
        const status = StatusData.fromJson(content);
        GLOBALS.setGlucMGDL(status);
        GLOBALS.targetBottom = status.settings.bgTargetBottom;
        GLOBALS.targetTop = status.settings.bgTargetTop;
      }
    }
    url = GLOBALS.user.apiUrl(null, 'entries.json', {params: 'count=2'});
    let src = await this.requestJson(url);
    if (src != null) {
      if (src.length != 2) {
        GLOBALS.currentGlucSrc = null;
        GLOBALS.lastGlucSrc = null;
        GLOBALS.currentGlucDiff = '';
        GLOBALS.glucDir = 360;
      } else {
        try {
          let eNow = EntryData.fromJson(src[0]);
          let ePrev = EntryData.fromJson(src[1]);
          if (eNow.device !== ePrev.device) {
            url = GLOBALS.user.apiUrl(null, 'entries.json', {params: 'count=10'});
            src = await this.requestJson(url);
            eNow = EntryData.fromJson(src[0]);
            ePrev = null;
            for (let i = 1; i < src.length && ePrev == null; i++) {
              const check = EntryData.fromJson(src[i]);
              if (check.device === eNow.device) {
                ePrev = check;
              }
            }
          }
          if (ePrev == null) {
            ePrev = eNow;
          }
          const span = Math.max(Utils.differenceInMinutes(eNow.time, ePrev.time), 1);
          GLOBALS.glucDir = 360;
          GLOBALS.currentGlucDiff = '';
          GLOBALS.currentGlucTime = '';
          if (span > 15) {
            return GLOBALS.currentGluc;
          }
          const time = Utils.differenceInMinutes(GlobalsData.now, eNow.time);
          GLOBALS.currentGlucTime = GLOBALS.msgGlucTime(time);

          GLOBALS.currentGlucSrc = eNow;
          GLOBALS.lastGlucSrc = ePrev;
          const diff = eNow.gluc - ePrev.gluc;
          GLOBALS.currentGlucDiff = `${eNow.gluc > ePrev.gluc ? '+' : ''}${GLOBALS.fmtNumber(diff / span / GLOBALS.glucFactor, GLOBALS.glucPrecision)}`;
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
      ampulle: new WatchChangeData('ampulle', '?'),
      katheter: new WatchChangeData('katheter', '?'),
      battery: new WatchChangeData('battery', '?'),
      sensor: new WatchChangeData('sensor', '?')
    };
    const end = new Date();
    const beg = Utils.addDateMonths(end, -1);
    url = GLOBALS.user.apiUrl(null, 'treatments.json', {
      params: `find[created_at][$lte]=${end.toISOString()}`
        + `&find[created_at][$gte]=${beg.toISOString()}`
        + `&find[eventType][$regex]=Change`
    });
    src = await this.requestJson(url);
    if (src != null) {
      const list = [];
      for (const entry of src) {
        list.push(TreatmentData.fromJson(entry));
      }
      list.sort((a, b) => Utils.compareDate(a.createdAt, b.createdAt));
      for (const change of list) {
        const time = Utils.durationText(change.createdAt, GlobalsData.now);
        if (change.isInsulinChange) {
          changes['ampulle'].lasttime = time
        } else if (change.isSiteChange) {
          changes['katheter'].lasttime = time
        } else if (change.isPumpBatteryChange) {
          changes['battery'].lasttime = time
        } else if (change.isSensorChange) {
          changes['sensor'].lasttime = time
        }
      }
    }
    GLOBALS.currentChanges = changes;

    if (GLOBALS.currentGlucVisible || params.force) {
      let milliseconds = params.timeout * 1000;
      //  calculate the milliseconds to the next full part of the minute for the timer
      // (e.g. now is 10:37:27 and timeout is 30, will result in 3000 milliseconds
      // this is done for that the display of the time will match the current
      // time when entering a new minute
      const milliNow = GlobalsData.now.getSeconds() * 1000 + GlobalsData.now.getMilliseconds();
      const part = Math.floor(milliNow / milliseconds);
      milliseconds = (part + 1) * milliseconds - milliNow;
      GLOBALS.glucTimer = setTimeout(() => this.getCurrentGluc(params), milliseconds);
    }
    GLOBALS.glucRunning = false;
    return ret;
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
