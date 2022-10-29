import {Injectable} from '@angular/core';
import {HttpClient, HttpRequest} from '@angular/common/http';
import {lastValueFrom, throwError, timeout} from 'rxjs';
import {GLOBALS} from '@/_model/globals-data';
import {JsonData} from '@/_model/json-data';
import {Log} from '@/_services/log.service';
import {StorageService} from '@/_services/storage.service';
import {Settings} from '@/_model/settings';
import {DatepickerPeriod} from '@/_model/datepicker-period';
import {UserData} from '@/_model/nightscout/user-data';
import {Utils} from '@/classes/utils';
import {ShortcutData} from '@/_model/shortcut-data';
import {WatchElement} from '@/_model/watch-element';

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

  constructor(public http: HttpClient,
              public ss: StorageService
  ) {
  }

  _syncGoogle = false;

  get syncGoogle(): boolean {
    return this._syncGoogle;
  }

  set syncGoogle(value: boolean) {
    this._syncGoogle = value ?? false;
    this.saveWebData();
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
    return response;
  }

  saveWebData(): void {
    this.ss.write(
      Settings.WebData,
      {
        w0: GLOBALS.version,
        w1: GLOBALS.language.code ?? 'de_DE',
        w2: GLOBALS.theme,
        w3: (this._syncGoogle ?? false) ? 'true' : 'false'
      });
    // `{"w0":"${GLOBALS.version}"`
    // + `,"w1":"${GLOBALS.language.code ?? 'de_DE'}"`
    // + `,"w2":"${GLOBALS.theme}"`
    // + `,"w3":${(this._syncGoogle ?? false) ? 'true' : 'false'}`
    // + '}');
  }

  loadWebData(): void {
    try {
      const json = this.ss.read(Settings.WebData);
      const code = JsonData.toText(json['w1']);
      GLOBALS.language = GLOBALS.languageList.find((lang) => lang.code === code);
      GLOBALS.theme = JsonData.toText(json['w2']);
      this._syncGoogle = JsonData.toBool(json['w3']);
    } catch (ex) {
      var msg = ex.toString();
      Log.debug(`Fehler bei DataService.loadWebData: ${msg}`);
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
      var msg = ex.toString();
      Log.debug(`Fehler bei DataService.loadSettings: ${msg}`);
    }

    this.loadWebData();
    if (this.syncGoogle && !skipSyncGoogle) {
      await this._loadFromGoogle();
    }
    this.loadFromStorage();
    this._initAfterLoad();
  }

  _initAfterLoad(): void {
    Log.debug('DataService._initAfterLoad ist noch nicht implementiert');
    /*
        changeLanguage(language, doReload: false);
        Settings.updatePeriod(period);
        isConfigured = lastVersion != null && lastVersion.isNotEmpty && userList.isNotEmpty;
    */
  }

  _loadFromGoogle(): void {
    Log.debug('DataService._loadFromGoogle ist noch nicht implementiert');
    /*
        if (_client == null || drive == null) return;

        var query = 'name="${settingsFilename}" and not trashed';
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
    Log.debug('DataService.loadLocalOnlySettings ist noch nicht implementiert');
    /*
        canDebug = loadStorage(Settings.DebugFlag) == 'yes';
        fmtDateForDisplay = DateFormat(language.dateformat);
        currPeriodShift = listPeriodShift[0];
    */
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
      var msg = ex.toString();
      Log.debug(`Fehler bei DataService.fromStrings: ${msg}`);
    }
  }

  // loads the device settings from a json stucture
  fromDeviceJson(json: any): void {
    try {
      GLOBALS.ppHideNightscoutInPDF = JsonData.toBool(json['d1']);
      GLOBALS.ppShowUrlInPDF = JsonData.toBool(json['d2']);
      GLOBALS.ppHideLoopData = JsonData.toBool(json['d3']);
      GLOBALS.pdfCreationMaxSize = JsonData.toNumber(json['d4']);
      GLOBALS.ppStandardLimits = JsonData.toBool(json['d5']);
      GLOBALS.ppCGPAlwaysStandardLimits = JsonData.toBool(json['d6']);
      GLOBALS.ppComparable = JsonData.toBool(json['d7']);
      GLOBALS.ppLatestFirst = JsonData.toBool(json['d8']);
      GLOBALS.ppGlucMaxIdx = JsonData.toNumber(json['d9']);
      GLOBALS.ppBasalPrecisionIdx = JsonData.toNumber(json['d10']);
      GLOBALS.ppFixAAPS30 = JsonData.toBool(json['d11']);
      GLOBALS.ppPdfSameWindow = JsonData.toBool(json['d12']);
      GLOBALS.ppPdfDownload = JsonData.toBool(json['d13']);
      GLOBALS.isWatchColor = JsonData.toBool(json['d14']);
    } catch (ex) {
      const msg = ex.toString();
      Log.debug(`Fehler bei DataService.fromDeviceJson: ${msg}`);
    }
  }

  // retrieves the shared settings from a string
  fromSharedString(src: string): void {
    try {
      const json = JSON.parse(src);
      this.fromSharedJson(json);
    } catch (ex) {
      const msg = ex.toString();
      Log.debug(`Fehler bei DataService.fromSharedString: ${msg}`);
    }
  }

  // loads the shared settings from a json stucture
  fromSharedJson(json: any): void {
    Log.debug('DataService.fromSharedJson ist noch nicht implementiert');
    try {
      GLOBALS.lastVersion = JsonData.toText(json['s1']);
      const users = json['s2'];
      const shortcuts = json['s3'];
      GLOBALS.glucMGDLIdx = JsonData.toNumber(json['s5']);
      const langId = JsonData.toText(json['s6']);
      const idx = GLOBALS.languageList.findIndex((v) => v.code === langId);
      if (idx >= 0) {
        GLOBALS.language = GLOBALS.languageList[idx];
      }
      GLOBALS.showCurrentGluc = JsonData.toBool(json['s7']);
      GLOBALS.period = new DatepickerPeriod(JsonData.toText(json['s8']));
      GLOBALS._pdfOrder = JsonData.toText(json['s9']);
      GLOBALS.viewType = JsonData.toText(json['s10']);
      GLOBALS.timestamp = JsonData.toNumber(json['s11']);
      GLOBALS.tileShowImage = JsonData.toBool(json['s12'], true);
      GLOBALS.showAllTileParams = JsonData.toBool(json['s13']);
      let watchEntries = json['s14'];
      GLOBALS.period.fmtDate = GLOBALS.language.dateformat;
      GLOBALS.userListLoaded = false;
      GLOBALS.userList = [];
      if (users != null) {
        try {
          for (const entry of users) {
            GLOBALS.userList.push(UserData.fromJson(entry));
          }
        } catch (ex) {
          const msg = ex.toString();
          Log.devError(ex, `Fehler beim laden der User in Settings.fromSharedJson: ${msg}`);
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
      GLOBALS.userIdx = JsonData.toNumber(json['s4']);
      // get shortcuts if available
      GLOBALS.shortcutList = [];
      if (shortcuts != null) {
        try {
          for (var entry in shortcuts) {
            GLOBALS.shortcutList.push(ShortcutData.fromJson(entry));
          }
        } catch (ex) {
          var msg = ex.toString();
          Log.debug(`Fehler bei Settings.fromSharedJson (shortcuts): ${msg}`);
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
          const msg = ex.toString();
          Log.debug(`Fehler bei Settings.fromSharedJson (watchEntries): ${msg}`);
        }
      }
      if (this.onAfterLoad != null) {
        this.onAfterLoad();
      }
    } catch (ex) {
      const msg = ex.toString();
      Log.debug(`Fehler bei DataService.fromSharedJson: ${msg}`);
    }
  }
}


