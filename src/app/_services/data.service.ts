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

  constructor(public http: HttpClient,
              public ss: StorageService
  ) {
  }

  _syncWithGoogle = false;

  get syncWithGoogle(): boolean {
    return this._syncWithGoogle;
  }

  set syncWithGoogle(value: boolean) {
    this._syncWithGoogle = value ?? false;
    this.saveWebData();
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
      w2: GLOBALS.theme,
      w3: (this._syncWithGoogle ?? false) ? 'true' : 'false'
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
      GLOBALS.theme = JsonData.toText(json.w2);
      this._syncWithGoogle = JsonData.toBool(json.w3);
    } catch (ex) {
      Log.devError(ex, `Fehler bei DataService.loadWebData`);
    }
  }

  async loadSettingsJson(skipSyncGoogle = false) {
    try {
      const data = await this.request('settings.json', {showError: false});
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
    if (this.syncWithGoogle && !skipSyncGoogle) {
      await this._loadFromGoogle();
    }
    this.loadFromStorage();
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

  _loadFromGoogle(): void {
    Log.todo('DataService._loadFromGoogle ist noch nicht implementiert');
    /*
        if (_client == null || drive == null) return;

        const query = 'name="${settingsFilename}" and not trashed';
        _searchDocuments(1, query).then((gd.FileList list) {
          if (list?.files?.isNotEmpty ?? false) {
            settingsFile = list.files[0];
          } else {
            settingsFile = gd.File()
              ..name = settingsFilename
              ..parents = [driveParent]
              ..mimeType = 'text/json';
            drive.files.generateIds(count: 1, space: driveParent).then((gd.GeneratedIds ids) {
              settingsFile.id = ids.ids[0];
              drive.files.create(settingsFile).then((file) {
                _getFromGoogle();
              }).catchError((error) {
                showDebug('Fehler in _loadFromGoogle: ${error}');
              });
              return;
            });
    //        if (driveParent != null)settingsFile.parents = [driveParent];
          }
          _getFromGoogle();
        }).catchError((error) {
          showDebug('Fehler bei _loadFromGoogle: ${error}');
          loadFromStorage();
          _initAfterLoad();
        });
     */
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
      GLOBALS.pdfCreationMaxSize = JsonData.toNumber(json.d4);
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
      GLOBALS.userList.sort((a, b) => Utils.compare(a.display, b.display));
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
      this._uploadToGoogle(doReload);
    } else if (doReload) {
      this.reload();
    }
  }

  // noinspection JSUnusedLocalSymbols
  _uploadToGoogle(doReload: boolean): void {
    Log.todo('DataService._uploadToGoogle ist noch nicht implementiert');
    /*
      if (!_googleLoaded) return;
      if (drive == null) {
      syncGoogle = false;
      return;
    }

    settingsFile ??= gd.File()
      ..name = settingsFilename
      ..parents = [driveParent]
      ..mimeType = 'text/json'
      ..id = null;

    const controller = StreamController<String>();
    const content = asSharedString;
    controller.add(content);
    const media =
      commons.Media(controller.stream.transform(convert.Utf8Encoder()), content.length, contentType: 'text/json');
    if (settingsFile.id == null) {
      drive.files.generateIds(count: 1, space: driveParent).then((gd.GeneratedIds ids) {
        settingsFile.id = ids.ids[0];
        drive.files.create(settingsFile, uploadMedia: media).then((_) {});
      });
    } else {
      const file = gd.File();
      file.trashed = false;
      drive.files.update(file, settingsFile.id, uploadMedia: media).then((gd.File file) {
        if (doReload) reload();
    //        showDebug("Datei ${file.name} gespeichert");
      })?.catchError((error) {
        const msg = error.toString();
        showDebug('Fehler beim Upload zu Google (${settingsFile.name}): $msg');
      }, test: (error) => true);
    }
    controller.close();
    */
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
          if (eNow.device != ePrev.device) {
            url = GLOBALS.user.apiUrl(null, 'entries.json', {params: 'count=10'});
            src = await this.requestJson(url);
            eNow = EntryData.fromJson(src[0]);
            ePrev = null;
            for (let i = 1; i < src.length && ePrev == null; i++) {
              const check = EntryData.fromJson(src[i]);
              if (check.device == eNow.device) {
                ePrev = check;
              }
            }
          }
          if (ePrev == null) {
            ePrev = eNow;
          }
          const span = Utils.differenceInMinutes(eNow.time, ePrev.time);
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
          GLOBALS.currentGlucDiff = `${eNow.gluc > ePrev.gluc ? '+' : ''}`
            + `${GLOBALS.fmtNumber((eNow.gluc - ePrev.gluc) * 5 / span / GLOBALS.glucFactor, GLOBALS.glucPrecision)}`;
          const diff = eNow.gluc - ePrev.gluc;
          const limit = Math.floor(10 * span / 5);
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
