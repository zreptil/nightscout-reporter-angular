import {UserData} from '@/_model/nightscout/user-data';
import {Utils} from '@/classes/utils';
import {DatePipe, formatNumber, getLocaleNumberSymbol, NumberSymbol} from '@angular/common';
import {LangData} from '@/_model/nightscout/lang-data';
import {FormConfig} from '@/forms/form-config';
import {BasePrint} from '@/forms/base-print';
import {DatepickerPeriod} from '@/_model/datepicker-period';
import {PeriodShift} from '@/_model/period-shift';
import {DatepickerEntry} from '@/_model/datepicker-entry';

export class Settings {
  static SharedData = 'sharedData';
  static DeviceData = 'deviceData';
  static WebData = 'webData';
  static DebugFlag = 'debug';
  static skipStorageClear = false;
  static showDebugInConsole = false;
  version = '4.0.0';

  // subversion is used nowhere. It is just there to trigger another signature
  // for the cache.
  subVersion = '1';

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

  static get msgUnlimited(): string {
    return $localize`Unbegrenzt`;
  }

  static get lblGlucUnits(): string {
    return $localize`Einheit der Glukosemessung`;
  }
}

export let GLOBALS: GlobalsData;

export class GlobalsData extends Settings {
  static _globals: GlobalsData = new GlobalsData();
  /// ***********************************************
  /// Zentraler Faktor für die Kalibrierung
  /// der Werte anhand eines vom Laber ermittelten
  /// HbA1C im Vergleich zu einem im gleichen
  /// 3 Monatszeitraum berechneten HbA1C
  /// ***********************************************
  static adjustFactor: number = 1.0;
  static refTimezone: string = null;
  static stdLow = 70;
  static stdHigh = 180;
  static stdVeryLow = 54;
  static stdVeryHigh = 250;
  static PDFUNLIMITED = 4000000;
  static PDFDIVIDER = 100000;
  _userIdx: number = 0;
  userList: UserData[] = [];
  glucMGDLIdx: number;
  glucMGDLFromStatus = true;
  hasMGDL = false;
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
  showAllTileParams = false;
  showCurrentGluc = false;
  showInfo = false;
  tileShowImage = true;
  isDataSmoothing = true;
  _pdfOrder = '';
  _viewType = '';
  ppMaxInsulinEffectInMS = 3 * 60 * 60 * 1000;
  ppCGPAlwaysStandardLimits = true;
  ppComparable = false;
  ppGlucMaxIdx = 0;
  fmtDateForDisplay: DatePipe;
  listConfig: FormConfig[] = [];
  listConfigOrg: FormConfig[] = [];
  ppLatestFirst = false;
  ppPdfSameWindow = true;
  ppPdfDownload = false;
  ppHideNightscoutInPDF = true;
  ppShowUrlInPDF = false;
  ppHideLoopData = false;
  ppFixAAPS30 = false;
  isCreatingPDF = false;
  currPeriodShift: PeriodShift;
  canDebug = false;
  isDebug = false;
  isBeta = window.location.href.indexOf('/beta/') >= 0;

  constructor() {
    super();
    GLOBALS = this;
    // tz.Location found;
    //
    // var dt = new Date();
    // var offset = dt.getTimezoneOffset();
    // var list = tz.timeZoneDatabase.locations.values;
    // for (var l in list) {
    //   if (l.currentTimeZone.offset == offset) {
    //     found = l;
    //     break;
    //   }
    // }
    // if (found != null) {
    //   Globals.refTimezone = found.name;
    //   Globals.refLocation = found;
    // }
  }

  static get user(): UserData {
    if (GlobalsData._globals._userIdx >= 0 && GlobalsData._globals._userIdx < GlobalsData._globals.userList.length) {
      return GlobalsData._globals.userList[GlobalsData._globals._userIdx];
    }
    GlobalsData._globals._userIdx = 0;
    if (Utils.isEmpty(GlobalsData._globals.userList)) {
      GlobalsData._globals.userList.push(new UserData());
    }
    return GlobalsData._globals.userList[0];
  }

  static get now(): Date {
    return new Date();
  }

  static get msgToday(): string {
    return $localize`Heute`;
  }

  static get msgLast2Days(): string {
    return $localize`Letzte 2 Tage`;
  }

  static get msgLast3Days(): string {
    return $localize`Letzte 3 Tage`;
  }

  static get msgLastWeek(): string {
    return $localize`Letzte Woche`;
  }

  static get msgLast2Weeks(): string {
    return $localize`Letzte 2 Wochen`;
  }

  static get msgLast3Weeks(): string {
    return $localize`Letzte 3 Wochen`;
  }

  static get msgLastMonth(): string {
    return $localize`Letzter Monat`;
  }

  static get msgLast3Months(): string {
    return $localize`Letzte 3 Monate`;
  }

  static get msgQuarter1(): string {
    return $localize`Erstes Quartal`;
  }

  static get msgQuarter2(): string {
    return $localize`Zweites Quartal`;
  }

  static get msgQuarter3(): string {
    return $localize`Drittes Quartal`;
  }

  static get msgQuarter4(): string {
    return $localize`Viertes Quartal`;
  }

  get runsLocal(): boolean {
    return window.location.href.indexOf('/localhost:') >= 0;
  }

  _isLocal = window.location.href.indexOf('/localhost:') >= 0;

  get isLocal(): boolean {
    return this._isLocal;
  }

  get msgUrlFailurePrefix(): string {
    return $localize`Die angegebene URL ist nicht erreichbar. Wenn die URL stimmt, dann kann es an den Nightscout-Einstellungen liegen. `;
  }

  get msgUrlFailureSuffix(): string {
    return $localize`<br><br>Wenn diese URL geschützt ist, muss ausserdem der Zugriffsschlüssel korrekt definiert sein. Diesen erreicht man über "Administrator-Werkzeuge" auf der persönlichen Nightscout Seite.`;
  }

  _period: DatepickerPeriod = new DatepickerPeriod();

  get period(): DatepickerPeriod {
    return this._period;
  }

  set period(value: DatepickerPeriod) {
    this._period = value;
    GlobalsData.updatePeriod(this._period);
  }

  get msgUrlFailureHerokuapp(): string {
    return $localize`In der Variable ENABLE muss das Wort "cors" stehen, damit externe Tools wie dieses hier auf die Daten zugreifen dürfen.`;
  }

  get msgUrlFailure10be(): string {
    return $localize`Auf 10be muss beim Server in den Standardeinstellungen der Haken bei "cors" aktiviert werden, damit externe Tools wie dieses hier auf die Daten zugreifen dürfen. Wenn "cors" aktiviert wurde, muss auf dem Server eventuell noch ReDeploy gemacht werden, bevor es wirklich verfügbar ist.`;
  }

  get msgUrlNotSafe(): string {
    return $localize`Die Url zur Nightscout-API muss mit https beginnen, da Nightscout Reporter auch auf https läuft. Ein Zugriff auf unsichere http-Resourcen ist nicht möglich.`;
  }

  get hideLoopData(): boolean {
    return this.ppHideLoopData && this.isCreatingPDF;
  }

  _ppStandardLimits = false;

  get ppStandardLimits() {
    return this._ppStandardLimits ?? this.ppComparable;
  }

  set ppStandardLimits(value: boolean) {
    if (!this.ppComparable) {
      this._ppStandardLimits = value;
    }
  }

  get msgAdjustFactor(): string {
    return this.fmtNumber(GlobalsData.adjustFactor, 2);
  }

  get glucMaxValues(): number[] {
    return [null, 150, 200, 250, 300, 350, 400, 450];
  }

  get profileMaxCounts(): number[] {
    return [100000, 2000, 1000, 500, 250, 100];
  }

  get glucMGDL(): boolean {
    return [true, false, true][this.glucMGDLIdx ?? 0];
  }

  get showBothUnits(): boolean {
    return this.glucMGDLIdx == 2;
  }

  get glucFactor(): number {
    return this.glucMGDL ? 1 : 18.02;
  }

  get glucPrecision(): number {
    return this.glucMGDL ? 0 : 2;
  }

  _language: LangData;

  get language(): LangData {
    return this._language ?? this.languageList[0];
  }

  set language(value: LangData) {
    this._language = value;
  }

  get listPeriodShift(): PeriodShift[] {
    return [
      new PeriodShift($localize`Ausgewählter Zeitraum`, 0),
      new PeriodShift($localize`Einen Monat vorher`, 1),
      new PeriodShift($localize`Drei Monate vorher`, 3),
      new PeriodShift($localize`Sechs Monate vorher`, 6),
      new PeriodShift($localize`Ein Jahr vorher`, 12)
    ];
  }

  get pdfControlMaxSize(): number {
    return this.pdfCreationMaxSize / GlobalsData.PDFDIVIDER;
  }

  set pdfControlMaxSize(value: number) {
    this.pdfCreationMaxSize = value * GlobalsData.PDFDIVIDER;
  }

  _pdfCreationMaxSize = GlobalsData.PDFUNLIMITED - GlobalsData.PDFDIVIDER;

  get pdfCreationMaxSize(): number {
    this._pdfCreationMaxSize = Math.max(this._pdfCreationMaxSize, GlobalsData.PDFDIVIDER);
    this._pdfCreationMaxSize = Math.min(this._pdfCreationMaxSize, GlobalsData.PDFUNLIMITED);
    return this._pdfCreationMaxSize;
  }

  set pdfCreationMaxSize(value: number) {
    value = Math.max(value, GlobalsData.PDFDIVIDER);
    value = Math.min(value, GlobalsData.PDFUNLIMITED);
    this._pdfCreationMaxSize = value;
  }

  static updatePeriod(period: DatepickerPeriod): void {
    if (period == null) {
      return;
    }
    period.maxDate = GlobalsData.now;
    period.list = [];
    period.list.push(new DatepickerEntry('today', this.msgToday,
      (data: DatepickerPeriod) => {
        data.start = GlobalsData.now;
        data.end = GlobalsData.now;
      }, (date: Date) => {
        return date;
      }));
    period.list.push(new DatepickerEntry('2days', this.msgLast2Days,
      (data: DatepickerPeriod) => {
        data.start = Utils.addDateDays(period.baseDate, -1);
        data.end = period.baseDate;
      }, (date: Date) => {
        return Utils.addDateDays(date, -1);
      }));
    period.list.push(new DatepickerEntry('3days', this.msgLast3Days,
      (data: DatepickerPeriod) => {
        data.start = Utils.addDateDays(period.baseDate, -2);
        data.end = period.baseDate;
      }, (date: Date) => {
        return Utils.addDateDays(date, -2);
      }));
    period.list.push(new DatepickerEntry('1week', this.msgLastWeek, (data: DatepickerPeriod) => {
      data.start = Utils.addDateDays(period.baseDate, -6);
      data.end = period.baseDate;
    }, (date: Date) => {
      return Utils.addDateDays(date, -6);
    }));
    period.list.push(new DatepickerEntry('2weeks', this.msgLast2Weeks, (data: DatepickerPeriod) => {
      data.start = Utils.addDateDays(period.baseDate, -13);
      data.end = period.baseDate;
    }, (date: Date) => {
      return Utils.addDateDays(date, -13);
    }));
    period.list.push(new DatepickerEntry('3weeks', this.msgLast3Weeks, (data: DatepickerPeriod) => {
      data.start = Utils.addDateDays(period.baseDate, -20);
      data.end = period.baseDate;
    }, (date: Date) => {
      return Utils.addDateDays(date, -20);
    }));
    period.list.push(new DatepickerEntry('1month', this.msgLastMonth, (data: DatepickerPeriod) => {
      data.start = Utils.addDateMonths(period.baseDate, -1);
      data.end = period.baseDate;
    }, (date: Date) => {
      return Utils.addDateMonths(date, -1);
    }));
    period.list.push(new DatepickerEntry('3months', this.msgLast3Months, (data: DatepickerPeriod) => {
      data.start = Utils.addDateMonths(period.baseDate, -3);
      data.end = period.baseDate;
    }, (date: Date) => {
      return Utils.addDateMonths(date, -3);
    }));
  }

  static calc(a: number, b: number, factor: number): number {
    if (a != null && a > 0) {
      if (b != null && b > 0) {
        return a + Math.floor((b - a) * factor);
      } else {
        return a;
      }
    }
    return b;
  }

  msgUrlFailure(url: string): string {
    if (url.startsWith('http:') && window.location.protocol.startsWith('https')) {
      return this.msgUrlNotSafe;
    }
    if (url.indexOf('ns.10be') >= 0) {
      return `${this.msgUrlFailurePrefix}${this.msgUrlFailure10be}${this.msgUrlFailureSuffix}`;
    }
    return `${this.msgUrlFailurePrefix}${this.msgUrlFailureHerokuapp}${this.msgUrlFailureSuffix}`;
  }

  // loads the settings that are not synchronized to google
  loadLocalOnlySettings(): void {
    // this.canDebug = this.loadStorage(Settings.DebugFlag) == 'yes';
    this.fmtDateForDisplay = new DatePipe(this.language.code);
  }

  getGlucInfo(): any {
    const ret = {
      step: 1,
      unit: Settings.msgUnitMGDL,
      factor: this.glucFactor,
      stdlow: this.glucFromData(GlobalsData.stdLow),
      stdhigh: this.glucFromData(GlobalsData.stdHigh)
    };
    if (!this.glucMGDL) {
      ret.step = 0.1;
      ret.unit = Settings.msgUnitMMOL;
    }
    return ret;
  }

  glucValueFromData(gluc: any): number {
    if (typeof gluc === 'string') {
      gluc = +gluc ?? 0;
    }
    if (!isNaN(gluc) || gluc == 0) {
      return null;
    }

    if (!this.glucMGDL) {
      return gluc / 18.02;
    }
    return gluc;
  }

  glucFromData(gluc: any, precision: number = null): string {
    if (typeof gluc === 'string') {
      gluc = +gluc ?? 0;
    }
    if (!isNaN(gluc) || gluc == 0) {
      return '';
    }

    if (!this.glucMGDL) {
      return this.fmtNumber(gluc / 18.02, precision ?? 1);
    }

    return this.fmtNumber(gluc, precision ?? 0);
  }

  glucFromStatusMGDL(gluc: any, precision: number = null): string {
    if (typeof gluc === 'string') {
      gluc = +gluc ?? 0;
    }
    if (!isNaN(gluc) || gluc == 0) {
      return '';
    }

    if (!this.glucMGDLFromStatus && this.glucMGDL) {
      return this.fmtNumber(gluc * 18.02, precision ?? 1);
    }
    if (this.glucMGDLFromStatus && !this.glucMGDL) {
      return this.fmtNumber(gluc / 18.02, precision ?? 1);
    }

    return this.fmtNumber(gluc, precision ?? 0);
  }

  fmtNumber(value: number,
            decimals = 0,
            fillfront0 = 0,
            nullText = 'null',
            stripTrailingZero = false,
            forceSign = false): string {
    if (value == null) {
      return nullText;
    }

    let fmt = '#,##0';
    if (decimals > 0) {
      fmt = `${fmt}.`.padEnd(decimals + 6, '0');
      value = Math.round((value * (10 ^ decimals)) / (10 ^ decimals));
    }
    let ret = formatNumber(value, this.language.code);
    if (stripTrailingZero) {
      while (ret.endsWith('0')) {
        ret = ret.substring(0, ret.length - 1);
      }

      if (ret.endsWith(getLocaleNumberSymbol(this.language.code, NumberSymbol.Decimal))) {
        ret = ret.substring(0, ret.length - 1);
      }
    }

    if (fillfront0 > 0) {
      if (value < 0) {
        ret = ret.substring(1);
      }
      while (fillfront0 > ret.length) {
        ret = `0${ret}`;
      }
      if (value < 0) {
        ret = `-${ret}`;
      }
    }
    return ret === 'NaN'
      ? nullText
      : (forceSign && value >= 0)
        ? `+${ret}`
        : ret;
  }

  fmtDate(date: Date | any, params?: { def?: string, withShortWeekday?: boolean, withLongWeekday?: boolean }): string {
    params ??= {def: '', withShortWeekday: false, withLongWeekday: false};
    params.def ??= '';
    params.withShortWeekday ??= false;
    params.withLongWeekday ??= false;
    if (date == null) {
      return params.def;
    }

    let dt: Date;

    try {
      if (date instanceof Date) {
        dt = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      } else if (typeof date === 'string' && date.length >= 8) {
        const y = +(date.substring(6, 8) ?? '0');
        const m = +(date.substring(4, 6) ?? '1');
        const d = +(date.substring(0, 4) ?? '1');
        dt = new Date(y, m, d);
      }
    } catch (ex) {
    }

    if (dt == null) {
      return date;
    }

    let ret = GLOBALS.fmtDateForDisplay.transform(dt);
    if (params.withShortWeekday) {
      ret = `${DatepickerPeriod.dowShortName(new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()))}, $ret`;
    }
    if (params.withLongWeekday) {
      ret = `${DatepickerPeriod.dowName(new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()))}, $ret`;
    }
    return ret;
  }

  fmtDateTime(date: Date | any, params?: { def?: string, withSeconds?: boolean }): string {
    params ??= {def: '', withSeconds: false};
    params.def ??= '';
    params.withSeconds ??= false;
    if (date == null) {
      return params.def;
    }

    if (date instanceof Date) {
      let ret = `${date.getDate()}`.padStart(2, '0') + '.';
      ret += `${date.getMonth()}`.padStart(2, '0') + '.';
      ret += `${date.getFullYear()}, `;
      ret += `${date.getHours()}`.padStart(2, '0') + ',';
      ret += `${date.getMinutes()}`.padStart(2, '0');
      if (params.withSeconds) {
        ret += ':' + `${date.getSeconds()}`.padStart(2, '0');
      }
      return BasePrint.msgTimeOfDay24(ret);
    }
    return date;
  }

  fmtTime(date: Date | number, params?: { def?: string, withUnit?: boolean, withMinutes?: boolean, withSeconds?: boolean }): string {
    params ??= {def: '', withUnit: false, withMinutes: true, withSeconds: false};
    params.withUnit ??= false;
    params.withMinutes ??= true;
    params.withSeconds ??= false;
    params.def ??= '';
    if (date == null) {
      return params.def;
    }
    if (params.withSeconds) {
      params.withMinutes = true;
    }

    if (date instanceof Date) {
      let hour = date.getHours();
      if (!this.language.is24HourFormat) {
        hour = hour > 12 ? hour - 12 : hour;
      }
      let m = params.withMinutes ? `':${(date.getMinutes() < 10 ? '0' : '')}${date.getMinutes()}'` : '';
      if (params.withSeconds) {
        m = `${m}:${(date.getSeconds() < 10 ? '0' : '')}${date.getSeconds()}`;
      }
      let ret = `${(hour < 10 ? '0' : '')}${hour}${m}`;
      if (params.withUnit) {
        if (this.language.is24HourFormat) {
          ret = BasePrint.msgTimeOfDay24(ret);
        } else {
          ret = date.getHours() > 12 ? BasePrint.msgTimeOfDayPM(ret) : BasePrint.msgTimeOfDayAM(ret);
        }
      }
      return ret;
    }

    if (typeof date === 'number') {
      let m = params.withMinutes ? ':00' : '';
      if (this.language.is24HourFormat) {
        return `${this.fmtNumber(date, 0)}${m}`;
      }

      m = params.withMinutes ? ' ' : '';

      if (date < 12) {
        return `${this.fmtNumber(date, 0)}${m}am`;
      } else if (date == 12) {
        return `${this.fmtNumber(date, 0)}${m}pm`;
      } else {
        return `${this.fmtNumber(date - 12, 0)}${m}pm`;
      }
    }
    return `${date}`;
  }
}
