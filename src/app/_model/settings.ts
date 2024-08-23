import {GlobalsData} from '@/_model/globals-data';
import {LangData} from '@/_model/nightscout/lang-data';
import {Utils} from '@/classes/utils';
import {CrowdinData} from '@/_model/nightscout/crowdin-data';

export class Settings {
  static SharedData = 'sharedData';
  static DeviceData = 'deviceData';
  static WebData = 'webData';
  static DebugFlag = 'debug';
  static DebugActive = 'yes';
  static skipStorageClear = false;
  static showDebugInConsole = false;
  static betaPrefix: string = '@';
  /// ***********************************************
  /// Zentraler Faktor für die Kalibrierung
  /// der Werte anhand eines vom Laber ermittelten
  /// HbA1C im Vergleich zu einem im gleichen
  /// 3 Monatszeitraum berechneten HbA1C
  /// ***********************************************
  static adjustFactor: number = 1.0;
  static refTimezone: string = null;
  static stdLow: number = 70;
  static stdHigh: number = 180;
  static stdVeryLow: number = 54;
  static stdVeryHigh: number = 250;
  static PDFUNLIMITED: number = 4000000;
  static PDFDIVIDER: number = 100000;
  lastVersion: string;
  urlPlayground = 'http://pdf.zreptil.de/playground.php';
  urlThemeServerIdx = 0;
  googleClientId = '939975570793-i9kj0rp6kgv470t45j1pf1hg3j9fqmbh';
  themeServerSecret: string;
  dsgvoAccepted = false;
  themeChanged = false;
  allowGoogleTag = false;
  themeList: any = {
    null: Settings.msgThemeAuto,
    standard: Settings.msgThemeStandard,
    xmas: Settings.msgThemeXmas,
    own: Settings.msgThemeOwn,
  }
  // images were retrieved using https://findicons.com/files/icons/2758/flag_icons/32/*.png
  languageList: LangData[] = [
    new LangData('de-DE', `Deutsch`, 'de', null, ''),
    new LangData('en-GB', `English (GB)`, 'gb', CrowdinData.factoryGerman(), 'en-GB'),
    new LangData('en-US', `English (USA)`, 'us', CrowdinData.factoryGerman(), 'en-US'),
    new LangData('sk-SK', `Slovenský`, 'sk', CrowdinData.factoryGerman(), 'sk'),
    new LangData('es-ES', `Español`, 'es', CrowdinData.factoryGerman(), 'es-ES'),
    new LangData('pl-PL', `Polski`, 'pl', CrowdinData.factoryEnglish(), 'pl'),
    new LangData('ja-JP', `日本の`, 'jp', CrowdinData.factoryEnglish(), 'ja'),
    new LangData('fr-FR', `Français`, 'fr', CrowdinData.factoryEnglish(), 'fr'),
    new LangData('pt-PT', `Português`, 'pt', CrowdinData.factoryEnglish(), 'pt-PT'),
    new LangData('nl-NL', `Dansk`, 'nl', CrowdinData.factoryEnglish(), 'nl'),
    new LangData('no-NO', `Norsk`, 'no', CrowdinData.factoryEnglish(), 'no'),
    new LangData('ru-RU', `Русский`, 'ru', CrowdinData.factoryEnglish(), 'ru'),
    new LangData('cs-CZ', `čeština`, 'cz', CrowdinData.factoryEnglish(), 'cs', 'cs'),
  ];
  ownTheme: any;
  publicUsername: string;
  isConfigured = false;
  // subVersion is added to version to have a unique version number without changing the current version
  private _subVersion = '1';

  static _msgThemeOwn = $localize`:theme selection - own|:Eigenes`;

  static get msgThemeOwn(): string {
    return Settings._msgThemeOwn;
  }

  static set msgThemeOwn(value: string) {
    Settings._msgThemeOwn = value;
  }

  static get hastiod(): boolean {
    return localStorage.getItem(Settings.DebugFlag) !== Settings.DebugActive;
  }

  static get msgThemeAuto(): string {
    return $localize`:theme selection - automatic|:Automatisch`;
  }

  static get msgThemeStandard(): string {
    return $localize`:theme selection - standard|:Standard`;
  }

  static get msgThemeXmas(): string {
    return $localize`:theme selection - christmas|:Weihnachten`;
  }

  static get msgUnitMGDL(): string {
    return $localize`mg/dL`;
  }

  static get msgUnitMMOL(): string {
    return $localize`mmol/L`;
  }

  static get msgUnitBoth(): string {
    return $localize`Beide`;
  }

  _urlThemeServer = ['https://nightrep.zreptil.de/php/index.php'];

  get urlThemeServer(): string {
    if (this.urlThemeServerIdx < 0) {
      this.urlThemeServerIdx = 0;
    }
    if (this.urlThemeServerIdx >= this._urlThemeServer.length) {
      this.urlThemeServerIdx = this._urlThemeServer.length - 1;
    }
    return this._urlThemeServer[this.urlThemeServerIdx];
  }

  _apiAuth: string;

  get apiAuth(): string {
    return this._apiAuth ?? '';
  }

  set apiAuth(value) {
    this._apiAuth = value;
  }

  private _version = '4.4.0';

  get version(): string {
    return `${this._version}-${this._subVersion}`;
  }

  get displayVersion(): string {
    return this._version;
  }

  get lblGlucUnits(): string {
    return $localize`Einheit der Glukosemessung`;
  }

  get themeListKeys(): string[] {
    return Object.keys(this.themeList);
  }

  get msgUnlimited(): string {
    return $localize`Unbegrenzt`;
  }

  get appTitle(): string {
    return document.querySelector('head>title').innerHTML;
  }

  _language: LangData;

  get language(): LangData {
    return this._language ?? this.languageList[0];
  }

  set language(value: LangData) {
    this._language = value;
  }

  _theme: string;

  get theme(): string {
    let ret = this.baseThemeName(this._theme);
    if (ret === 'own') {
      return Settings.msgThemeOwn;
    }
    return ret;
  }

  set theme(value: string) {
    if (this.themeList[value] != null) {
      this._theme = value;
    } else {
      this._theme = 'own';
      Settings.msgThemeOwn = value;
    }
  }

  get themeName(): string {
    return this.themeList[this._theme];
  }

  get themeKey(): string {
    if (Utils.isEmpty(this._theme)) {
      const ret = this.baseThemeName(this._theme);
      if (!Utils.isEmpty(ret)) {
        return ret;
      }
    }
    if (this.themeList[this._theme] != null) {
      return this._theme;
    }
    return 'own';
  }

  static tiod(src: string): string {
    let ret = '';
    if (Utils.isEmpty(src)) {
      return ret;
    }
    if (src.startsWith('{')) {
      return src;
    }
    // let pos = Math.floor(src.length / 2);
    // src = `${src.substring(pos + 1)}${src.substring(0, pos - 1)}`;
    ret = Utils.decodeBase64(src, '');
    return ret;
  }

  static doit(src: string): string {
    if (!this.hastiod) {
      return src;
    }
    return Utils.encodeBase64(src, '');
    /*
        let ret = Utils.encodeBase64(src, '');
        const pos = Math.floor(ret.length / 2);
        String.fromCharCode(Utils.rnd(26) + 64);
        ret = `${ret.substring(pos)}${String.fromCharCode(Utils.rnd(26) + 64)}${String.fromCharCode(Utils.rnd(26) + 48)}${ret.substring(0, pos)}`;
        return ret;
    */
  }

  baseThemeName(name: string): string {
    if (Utils.isEmpty(name)) {
      if (GlobalsData.now.getMonth() === 11) {
        return 'xmas';
      } else {
        return 'standard';
      }
    }
    return name;
  }
}
