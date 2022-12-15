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

  version = '4.0.0';
  lastVersion: string;
  urlPlayground = 'http://pdf.zreptil.de/playground.php';
  googleClientId = '939975570793-i9kj0rp6kgv470t45j1pf1hg3j9fqmbh';
  isConfigured = false;
  dsgvoAccepted = false;
  themeList: any = {
    null: Settings.msgThemeAuto,
    standard: Settings.msgThemeStandard,
    xmas: Settings.msgThemeXmas
  }
  // for the cache.
  // images were retrieved using https://findicons.com/files/icons/2758/flag_icons/32/*.png
  subVersion = '1';
  languageList: LangData[] = [
    new LangData('de-DE', $localize`Deutsch`, 'de', null),
    new LangData('en-GB', $localize`English (GB)`, 'gb', CrowdinData.factoryGerman()),
    new LangData('en-US', $localize`English (USA)`, 'us', CrowdinData.factoryGerman()),
    new LangData('sk-SK', $localize`Slovenský`, 'sk', CrowdinData.factoryGerman()),
    new LangData('es-ES', $localize`Español`, 'es', CrowdinData.factoryGerman()),
    new LangData('pl-PL', $localize`Polski`, 'pl', CrowdinData.factoryEnglish()),
    new LangData('ja-JP', $localize`日本の`, 'jp', CrowdinData.factoryEnglish()),
    new LangData('fr-FR', $localize`Français`, 'fr', CrowdinData.factoryEnglish()),
    new LangData('pt-PT', $localize`Português`, 'pt', CrowdinData.factoryEnglish()),
    new LangData('nl-NL', $localize`Dansk`, 'nl', CrowdinData.factoryEnglish()),
    new LangData('no-NO', $localize`Norsk`, 'no', CrowdinData.factoryEnglish()),
    new LangData('ru-RU', $localize`Русский`, 'ru', CrowdinData.factoryEnglish()),
  ];

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

  get lblGlucUnits(): string {
    return $localize`Einheit der Glukosemessung`;
  }

  // subversion is used nowhere. It is just there to trigger another signature

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
    if (Utils.isEmpty(this._theme)) {
      if (GlobalsData.now.getMonth() === 11) {
        return 'xmas';
      } else {
        return 'standard';
      }
    }
    return this._theme;
  }

  set theme(value: string) {
    if (this.themeList[value] != null) {
      this._theme = value;
    }
  }

  get themeName(): string {
    return this.themeList[this._theme];
  }

  get themeKey(): string {
    return this._theme;
  }

  static tiod(src: string): string {
    let ret = '';
    if (Utils.isEmpty(src)) {
      return ret;
    }
    if (src.startsWith('{')) {
      return src;
    }
    let pos = Math.floor(src.length / 2);
    src = `${src.substring(pos + 1)}${src.substring(0, pos - 1)}`;
    ret = Utils.decodeBase64(src, '');
    return ret;
  }

  static doit(src: string): string {
    if (!this.hastiod) {
      return src;
    }
    let ret = Utils.encodeBase64(src, '');
    const pos = Math.floor(ret.length / 2);
    String.fromCharCode(Utils.rnd(26) + 64);
    ret = `${ret.substring(pos)}${String.fromCharCode(Utils.rnd(26) + 64)}${String.fromCharCode(Utils.rnd(26) + 48)}${ret.substring(0, pos)}`;
    return ret;
  }
}
