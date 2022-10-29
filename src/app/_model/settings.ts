import {GlobalsData} from '@/_model/globals-data';
import {LangData} from '@/_model/nightscout/lang-data';
import {Log} from '@/_services/log.service';
import {Utils} from '@/classes/utils';

export class Settings {
  static SharedData = 'sharedData';
  static DeviceData = 'deviceData';
  static WebData = 'webData';
  static DebugFlag = 'debug';
  static skipStorageClear = false;
  static showDebugInConsole = false;
  static betaPrefix: string = '@';
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
  subVersion = '1';
  languageList: LangData[] = [
    new LangData('de_DE', $localize`Deutsch`, 'de'),
    new LangData('en_US', $localize`English (USA)`, 'us'),
    new LangData('en_GB', $localize`English (GB)`, 'gb'),
    new LangData('es_ES', $localize`Español`, 'es'),
    new LangData('pl_PL', $localize`Polski`, 'pl'),
    new LangData('ja_JP', $localize`日本の`, 'jp'),
    new LangData('sk_SK', $localize`Slovenský`, 'sk'),
    new LangData('fr_FR', $localize`Français`, 'fr'),
    new LangData('pt_PT', $localize`Português`, 'pt'),
    new LangData('nl_NL', $localize`Dansk`, 'nl')
  ];

  static get hastiod(): boolean {
    return localStorage[Settings.DebugFlag] != 'yes';
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

  // subversion is used nowhere. It is just there to trigger another signature

  static get msgUnlimited(): string {
    return $localize`Unbegrenzt`;
  }

  static get lblGlucUnits(): string {
    return $localize`Einheit der Glukosemessung`;
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
    if (this._theme == null) {
      if (GlobalsData.now.getMonth() === 12) {
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
    try {
      const decoder = new TextDecoder();
      const dst = atob(src);
      const buf = new ArrayBuffer(dst.length);
      const bufView = new Uint8Array(buf);
      for (let i = 0; i < dst.length; i++) {
        bufView[i] = dst.charCodeAt(i);
      }
      ret = decoder.decode(bufView);
    } catch (ex) {
      Log.devError(ex, `Fehler bei Settings.tiod(${src}) => ${ret}`);
      ret = '';
    }
    return ret;
  }

  static doit(src: string): string {
    if (!this.hastiod) {
      return src;
    }
    const encoder = new TextEncoder();
    const bytes = new Uint8Array(encoder.encode(src));
    let ret = btoa(bytes.reduce((data, byte) => data + String.fromCharCode(byte), ''));
    const pos = Math.floor(ret.length / 2);
    String.fromCharCode(Utils.rnd(26) + 64);
    ret = `${ret.substring(pos)}${String.fromCharCode(Utils.rnd(26) + 64)}${String.fromCharCode(Utils.rnd(26) + 48)}${ret.substring(0, pos)}`;
    // console.log(src);
    // console.log(ret);
    return ret;
  }
}
