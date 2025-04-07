import {UserData} from '@/_model/nightscout/user-data';
import {Utils} from '@/classes/utils';
import {DatePipe, formatNumber} from '@angular/common';
import {FormConfig} from '@/forms/form-config';
import {BasePrint} from '@/forms/base-print';
import {DatepickerPeriod} from '@/_model/datepicker-period';
import {PeriodShift} from '@/_model/period-shift';
import {DatepickerEntry} from '@/_model/datepicker-entry';
import {UrlData} from '@/_model/nightscout/url-data';
import {Settings} from '@/_model/settings';
import {ShortcutData} from '@/_model/shortcut-data';
import {WatchElement} from './watch-element';
import {EntryData} from './nightscout/entry-data';
import {StatusData} from '@/_model/nightscout/status-data';
import {BehaviorSubject, Observable} from 'rxjs';
import {WatchChangeData} from '@/_model/nightscout/watch-change-data';

class SharedCheck {
  constructor(public shared?: string,
              public error?: any) {
  }
}

export class PdfWarnings {
  showGlucSources = false;
  // noinspection JSUnusedLocalSymbols
  private msgGlucSources = $localize`Die Glukosewerte stammen aus verschiedenen Quellen`;

  get text(): string[] {
    const ret: string[] = [];
    for (const key of this.showKeys) {
      if ((this as any)[key] === true) {
        ret.push((this as any)[`msg${key.substring(4)}`]);
      }
    }
    return ret;
  }

  get showKeys(): string[] {
    return Object.keys(this).filter(k => k.startsWith('show'));
  }

  init(): void {
    for (const key of this.showKeys) {
      (this as any)[key] = false;
    }
  }

  clone(): PdfWarnings {
    const ret = new PdfWarnings();
    for (const key of this.showKeys) {
      (ret as any)[key] = (this as any)[key];
    }
    return ret;
  }
}

export enum TileDisplay {
  text,
  image,
  both
}

export let GLOBALS: GlobalsData;

export class GlobalsData extends Settings {
  static _globals: GlobalsData = new GlobalsData();
  msgFixAAPS30 = $localize`Die Erstellung der PDFs kann extrem lange dauern. Das liegt an einer Flut von Profil-Switches, die
        durch ein Plugin für die Automatisierung erstellt werden. Das verursacht einen Profil-Switch alle 4 Minuten mit
        Speicherung des kompletten Profils. Wenn die Option aktiv ist, dann werden diese Profil-Switches aussortiert
        und ermöglichen dadurch die Erstellung des PDFs. Diese Profil-Switches sind dann in den PDFs nicht mehr sichtbar.`;
  sharedCheck = new SharedCheck();
  titles: any = {
    settings: $localize`Einstellungen`,
    dsgvo: $localize`Datenschutzerklärung`,
    formparams: $localize`Formularparameter`,
    help: $localize`Information`,
    impressum: $localize`Impressum`,
    outputparams: $localize`Ausgabe Parameter`,
    welcome: $localize`Willkommen bei Nightscout Reporter!`,
    whatsnew: $localize`Was bisher geschah...`
  };
  avoidSaveAndLoad = false;
  userList: UserData[] = [];
  shortcutList: ShortcutData[] = [];
  glucMGDLIdx: number;
  // true, if status has mg/dl as glucose unit
  glucMGDLFromStatus = true;
  currShortcut: ShortcutData;
  currShortcutIdx: number;
  hasMGDL = false;
  showAllTileParams = false;
  showInfo = false;
  tileDisplay: TileDisplay = TileDisplay.both;
  isDataSmoothing = true;
  ppMaxInsulinEffectInMS: number = 3 * 60 * 60 * 1000;
  ppCGPAlwaysStandardLimits = true;
  ppComparable = false;
  ppGlucMaxIdx = 0;
  fmtDateForDisplay: DatePipe = new DatePipe('de-DE');
  listConfig: FormConfig[] = [];
  listConfigOrg: FormConfig[] = [];
  ppLatestFirst = false;
  ppPdfSameWindow = true;
  ppPdfDownload = false;
  ppHideNightscoutInPDF = true;
  ppShowUrlInPDF = false;
  ppHideLoopData = false;
  ppFixAAPS30 = false;
  ppSkipSensorChange = 0;
  isCreatingPDF = false;
  isDebug = localStorage.getItem('forceDebug') === 'true';
  isBeta = window.location.href.indexOf('/beta/') >= 0;
  createTestData = false;
  basalPrecisionAuto = 1;
  ppBasalPrecisionIdx = 0;
  ppShowDurationWarning = true;
  ppShowSlowServerWarning = true;
  pp24HourFormat = true;
  isWatchColor = true;
  maxGlucAge = 14;
  timestamp = 0;
  userListLoaded = false;
  glucDir = 360;
  glucTimer: any;
  glucRunning = false;
  currentGlucCounter = 0;
  targetBottom = Settings.stdLow;
  targetTop = Settings.stdHigh;
  currentGlucSrc: EntryData;
  currentChanges: { [key: string]: WatchChangeData };
  lastGlucSrc: EntryData;
  currentGlucPast: number;
  currentGlucDiff: string;
  currentGlucTime: string;
  listGlucUnits = [GlobalsData.msgUnitMGDL, GlobalsData.msgUnitMMOL, GlobalsData.msgUnitBoth];
  public onPeriodChange: Observable<DatepickerPeriod>;
  maxLogEntries = 20;
  pdfWarnings = new PdfWarnings();
  deviceForShortcut: string = null;
  // settings for librelinkup
  lluTimeout = 5;
  lluAutoExec = false;
  nwCurrPage = '';
  editColors = false;
  dragPos: any = {};
  ppShowHbA1Cmmol = false;
  userInfo: number = 0;
  private onPeriodChangeSubject: BehaviorSubject<DatepickerPeriod>;

  constructor() {
    super();
    GLOBALS = this;
    this.onPeriodChangeSubject = new BehaviorSubject<DatepickerPeriod>(this._period);
    this.onPeriodChange = this.onPeriodChangeSubject.asObservable();
    // tz.Location found;
    //
    // const dt = new Date();
    // const offset = dt.getTimezoneOffset();
    // const list = tz.timeZoneDatabase.locations.values;
    // for (const l of list) {
    //   if (l.currentTimeZone.offset === offset) {
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

  static get msgLast2Months(): string {
    return $localize`Letzte 2 Monate`;
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

  get showTileBoth() {
    return this.tileDisplay === TileDisplay.both;
  }

  get showTileText() {
    return this.tileDisplay === TileDisplay.text || this.tileDisplay === TileDisplay.both;
  }

  get showTileImage() {
    return this.tileDisplay === TileDisplay.image || this.tileDisplay === TileDisplay.both;
  }

  get isLLUPossible(): boolean {
    const url = this.user?.urlDataFor(null);
    return !Utils.isEmpty(url?.linkupRegion)
      && !Utils.isEmpty(url?.linkupUsername)
      && !Utils.isEmpty(url?.linkupPassword)
      && !Utils.isEmpty(url?.apiSecret);
  }

  get currentGlucValid(): boolean {
    return this.currentGlucPast < GLOBALS.maxGlucAge;
  }

  _currPeriodShift: PeriodShift;

  get currPeriodShift(): PeriodShift {
    if (this._currPeriodShift == null) {
      this._currPeriodShift = this.listPeriodShift[0];
    }
    return this._currPeriodShift;
  }

  set currPeriodShift(value: PeriodShift) {
    this._currPeriodShift = value;
  }

  private static _listSkipSensorChange = [
    {idx: 0, value: 0, label: $localize`Keine`},
    {idx: 1, value: 3, label: $localize`3 Stunden`},
    {idx: 2, value: 6, label: $localize`6 Stunden`},
    {idx: 3, value: 12, label: $localize`12 Stunden`},
    {idx: 4, value: 24, label: $localize`24 Stunden`}
  ];

  get listSkipSensorChange(): any[] {
    return GlobalsData._listSkipSensorChange;
  }

  _pdfOrder = '';

  get pdfOrder(): string {
    return this._pdfOrder;
  }

  _watchList: WatchElement[] = [];

  get watchList(): WatchElement[] {
    this._watchList ??= [];
    return this._watchList;
  }

  set watchList(value: WatchElement[]) {
    this._watchList = value;
  }

  get currentFormsAsMap(): any {
    const ret: { [key: string]: any } = {};
    for (const cfg of this.listConfig) {
      if (cfg.checked) {
        ret[cfg.form.dataId] = cfg.asJson;
      }
    }
    return ret;
  }

  _userIdx: number = 0;

  get userIdx(): number {
    return this._userIdx;
  }

  set userIdx(value: number) {
    if (value != this._userIdx) {
      this.user.loadParamsFromForms();
    }
    if (value < 0 || value >= this.userList.length) {
      value = 0;
      if (Utils.isEmpty(this.userList)) {
        this.userList.push(new UserData());
      }
    }
    this.userList[value].saveParamsToForms();
    this._userIdx = value;
  }

  get userDisplay(): string {
    return this.user.display;
  }

  get user(): UserData {
    if (this._userIdx >= 0 && this._userIdx < this.userList.length) {
      return this.userList[this._userIdx];
    }
    this._userIdx = 0;
    if (Utils.isEmpty(this.userList)) {
      this.userList.push(new UserData());
    }
    return this.userList[0];
  }

  _viewType = '';

  get viewType(): string {
    return this._viewType === '' ? 'tile' : this._viewType;
  }

  set viewType(value: string) {
    // Der viewType wird aktuell immer auf tile gesetzt,
    // wenn list gesetzt werden soll.
    // Wenn Benutzer wieder die Listenansicht haben wollen,
    // wird list wieder aktiviert.
    if (value === 'list') {
      value = 'tile';
    }
    switch (value) {
      case 'tile':
      case 'users':
      case 'themes':
        break;
      default:
        value = 'tile';
        break;
    }
    this._viewType = value;
  }

  get runsLocal(): boolean {
    return window.location.href.indexOf('/localhost:') >= 0;
  }

  _isLocal = window.location.href.indexOf('/localhost:') >= 0;

  get isLocal(): boolean {
    return this._isLocal;
  }

  set isLocal(value: boolean) {
    this._isLocal = value;
  }

  get msgUrlFailurePrefix(): string {
    return $localize`Die angegebene URL ist nicht erreichbar. Wenn die URL stimmt, dann kann es an den Nightscout-Einstellungen liegen. `;
  }

  get msgUrlFailureSuffix(): string {
    return $localize`<br><br>Wenn diese URL geschützt ist (AUTH_DEFAULT_ROLES steht nicht auf "admin" oder "readable"), muss ausserdem der Zugriffsschlüssel korrekt definiert sein. Diesen erreicht man über "Administrator-Werkzeuge" auf der persönlichen Nightscout Seite.<br><br>Weitere Informationen zu den AUTH_DEFAULT_ROLES gibt es <a href="https://nightscout.github.io/nightscout/security/#how-to-turn-off-unauthorized-access" target="_blank">hier</a>.`;
  }

  _period: DatepickerPeriod = new DatepickerPeriod();

  get period(): DatepickerPeriod {
    return this._period;
  }

  set period(value: DatepickerPeriod) {
    this._period = value;
    GlobalsData.updatePeriod(this._period);
    this.onPeriodChangeSubject?.next(this._period);
  }

  get msgUrlFailureHerokuapp(): string {
    return $localize`In der Variable ENABLE muss das Wort "cors" stehen, damit externe Tools wie dieses hier auf die Daten zugreifen dürfen. Falls der Server noch über die Variable CORS_ALLOW_ORIGIN verfügt, muss sichergestellt sein, dass dort entweder die aktuelle URL (@${location.href}@) oder @*@ eingetragen ist.`;
  }

  get msgUrlFailure10be(): string {
    return $localize`Auf 10be muss beim Server in den Standardeinstellungen der Haken bei "cors" aktiviert werden, damit externe Tools wie dieses hier auf die Daten zugreifen dürfen. Wenn "cors" aktiviert wurde, muss auf dem Server eventuell noch ReDeploy gemacht werden, bevor es wirklich verfügbar ist.`;
  }

  get msgUrlFailureGoogleCloud(): string {
    return '<br><br>' + $localize`Die Servervariable ENABLE muss das Wort "cors" beinhalten, damit externe Tools wie dieses hier auf die Daten zugreifen dürfen.<br><br>Wenn sich der Server in der Google Cloud befindet, müssen die Einstellungen in einem SSH-Terminal vorgenommen werden.`;
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
    return this.fmtNumber(Settings.adjustFactor, 2);
  }

  get glucMaxValue(): number {
    return (this.ppGlucMaxIdx ?? 0) == 0
      ? null
      : this.glucValueFromData(this.glucMaxValues[this.ppGlucMaxIdx]);
  }

  get glucMaxValues(): number[] {
    return [null, 150, 200, 250, 300, 350, 400, 450];
  }

  get profileMaxCounts(): number[] {
    return [1000000, 2000, 1000, 500, 250, 100, 50, 10];
  }

  // true, if forms should show mg/dl
  get glucMGDL(): boolean {
    return [true, false, true][this.glucMGDLIdx ?? 0];
  }

  get showBothUnits(): boolean {
    return this.glucMGDLIdx === 2;
  }

  get glucFactor(): number {
    return this.glucMGDL ? 1 : 18.02;
  }

  get glucPrecision(): number {
    return this.glucMGDL ? 0 : 2;
  }

  get listPeriodShift(): PeriodShift[] {
    return [
      new PeriodShift($localize`Ausgewählter Zeitraum`, 0),
      new PeriodShift($localize`Einen Monat vorher`, 1),
      new PeriodShift($localize`Zwei Monate vorher`, 2),
      new PeriodShift($localize`Drei Monate vorher`, 3),
      new PeriodShift($localize`Sechs Monate vorher`, 6),
      new PeriodShift($localize`Ein Jahr vorher`, 12)
    ];
  }

  get basalPrecision(): number {
    return (this.ppBasalPrecisionIdx ?? 0) > 0 ? this.basalPrecisionValues[this.ppBasalPrecisionIdx] : this.basalPrecisionAuto;
  }

  // get pdfControlMaxSize(): number {
  //   return this.pdfCreationMaxSize / Settings.PDFDIVIDER;
  // }
  //
  // set pdfControlMaxSize(value: number) {
  //   this.pdfCreationMaxSize = value * Settings.PDFDIVIDER;
  // }
  //
  // _pdfCreationMaxSize = Settings.PDFUNLIMITED - Settings.PDFDIVIDER;
  //
  // get pdfCreationMaxSize(): number {
  //   this._pdfCreationMaxSize = Math.max(this._pdfCreationMaxSize, Settings.PDFDIVIDER);
  //   this._pdfCreationMaxSize = Math.min(this._pdfCreationMaxSize, Settings.PDFUNLIMITED);
  //   return this._pdfCreationMaxSize;
  // }
  //
  // set pdfCreationMaxSize(value: number) {
  //   value = Math.max(value, Settings.PDFDIVIDER);
  //   value = Math.min(value, Settings.PDFUNLIMITED);
  //   this._pdfCreationMaxSize = value;
  // }

  get basalPrecisionValues(): number[] {
    return [null, 0, 1, 2, 3];
  }

  get asDeviceString(): string {
    const temp = [];
    for (let i = 0; i < this.watchList.length; i++) {
      temp.push(`${this.watchList[i].asJsonString}`);
    }
    const watchEntries = Utils.join(temp, ',');

    return '{'
      + `"d1":"${this.ppHideNightscoutInPDF ? 'true' : 'false'}"`
      + `,"d2":"${this.ppShowUrlInPDF ? 'true' : 'false'}"`
      + `,"d3":"${this.ppHideLoopData ? 'true' : 'false'}"`
      + `,"d4":""` // was pdfCreationMaxSize
      + `,"d5":"${this._ppStandardLimits ? 'true' : 'false'}"`
      + `,"d6":"${this.ppCGPAlwaysStandardLimits ? 'true' : 'false'}"`
      + `,"d7":"${this.ppComparable ? 'true' : 'false'}"`
      + `,"d8":"${this.ppLatestFirst ? 'true' : 'false'}"`
      + `,"d9":"${this.ppGlucMaxIdx?.toString() ?? 0}"`
      + `,"d10":"${this.ppBasalPrecisionIdx?.toString() ?? 0}"`
      + `,"d11":"${this.ppFixAAPS30?.toString() ?? 0}"`
      + `,"d12":"${this.ppPdfSameWindow ? 'true' : 'false'}"`
      + `,"d13":"${this.ppPdfDownload ? 'true' : 'false'}"`
      + `,"d14":"${this.isWatchColor ? 'true' : 'false'}"`
      + `,"d15":"${this.ppSkipSensorChange?.toString() ?? 0}"`
      + `,"d16":[${watchEntries}]`
      + `,"d17":"${this.lluTimeout}"`
      + `,"d18":"${this.maxGlucAge}"`
      + `,"d19":"${this.lluAutoExec ? 'true' : 'false'}"`
      + `,"d20":"${this.ppShowDurationWarning ? 'true' : 'false'}"`
      + `,"d21":"${this.ppShowHbA1Cmmol ? 'true' : 'false'}"`
      + `,"d22":"${this.ppShowSlowServerWarning ? 'true' : 'false'}"`
      + '}';
  }

  get currentGlucDir(): string {
    return this.glucDir < 360 ? `rotate(${this.glucDir}deg)` : null;
  }

  get currentGluc(): string {
    return this.currentGlucSrc == null ? $localize`Keine Daten` : this.fmtNumber(this.currentGlucValue, this.glucPrecision);
  }

  get currentGlucOrg(): string {
    return this.currentGlucSrc == null ? $localize`Keine Daten` : this.fmtNumber(this.currentGlucValue / Settings.adjustFactor, this.glucPrecision);
  }

  get currentGlucValue(): number {
    return this.currentGlucSrc == null ? null : this.currentGlucSrc.gluc / this.glucFactor;
  }

  get lastGlucValue(): number {
    return this.lastGlucSrc == null ? null : this.lastGlucSrc.gluc / this.glucFactor;
  }

  // retrieve the settings that can be shared as json-encoded-string
  private get _asSharedString(): string {
    let users = '';
    for (let i = 0; i < this.userList.length; i++) {
      users = `${users},${this.userList[i].asJsonString}`;
    }
    if (users.length > 1) {
      users = users.substring(1);
    }
    let shortcuts = '';
    for (let i = 0; i < this.shortcutList.length; i++) {
      shortcuts = `${shortcuts},${this.shortcutList[i].asJsonString}`;
    }
    if (shortcuts.length > 1) {
      shortcuts = shortcuts.substring(1);
    }
    const timestamp = GlobalsData.now.getTime();
    return '{'
      + `"s1":"${this.version}"`
      + `,"s4":${this.userIdx ?? 0}`
      + `,"s5":${this.glucMGDLIdx ?? 0}`
      + `,"s6":${this.editColors ?? false}`
      // + `,"s6":"${this.language.code ?? 'de_DE'}"`
      // + `,"s7":"${this.showCurrentGluc ? 'yes' : 'no'}"`
      + `,"s8":"${this.period?.toString()}"`
      + `,"s9":"${this._pdfOrder}"`
      + `,"s10":"${this._viewType}"`
      + `,"s11":${timestamp}`
      + `,"s12":${this.tileDisplay}`
      + `,"s13":${this.showAllTileParams}`
      + `,"s2":[${users}]`
      + `,"s3":[${shortcuts}]`
      + `,"s14":"${GLOBALS.apiAuth}"`
      + `,"s15":"${GLOBALS.publicUsername ?? ''}"`
      + `,"s16":"${GLOBALS.userInfo ?? 0}"`
      + `,"s17":"${GLOBALS.pp24HourFormat ? 'true' : 'false'}"`
      + `}`;
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
    period.list.push(new DatepickerEntry('2months', this.msgLast2Months, (data: DatepickerPeriod) => {
      data.start = Utils.addDateMonths(period.baseDate, -2);
      data.end = period.baseDate;
    }, (date: Date) => {
      return Utils.addDateMonths(date, -2);
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

  static decimalPlaces(value: number): number {
    let v = value.toString();
    while (v.endsWith('0')) {
      v = v.substring(0, v.length - 1);
    }
    const ret = Math.max(v.length - v.lastIndexOf('.') - 1, 0);
    return Math.min(ret, 3);
  }

  static percentile(entries: EntryData[], value: number): number {
    const v = value / 100;
    const temp = [];
    // the entries must not be rearranged,
    // so we need a copy of this list
    for (const entry of entries) {
      temp.push(entry);
    }
    temp.sort((a, b) => Utils.compare(a.gluc, b.gluc));
    const N = temp.length;
    const n = (N - 1) * v + 1;
    if (n === 1) {
      return temp[0].gluc;
    } else if (n === N) {
      return temp[N - 1].gluc;
    } else {
      const k = Math.floor(n);
      const d = n - k;
      if (k > 0 && k < temp.length) {
        return temp[k - 1].gluc + d * (temp[k].gluc - temp[k - 1].gluc);
      } else {
        return 0.0;
      }
    }
  }

  showSharedError(): boolean {
    if (this.sharedCheck.error != null) {
      console.log('An error occured when trying to create json from data');
      console.error(this.sharedCheck.error);
      return true;
    }
    return false;
  }

  ensureSharedString(def: string): boolean {
    this.sharedCheck.error = null;
    try {
      this.sharedCheck.shared = this._asSharedString;
      JSON.parse(this.sharedCheck.shared);
    } catch (ex) {
      this.sharedCheck.error = ex;
      this.sharedCheck.shared = def;
      return false;
    }
    return true;
  }

  watchListForGroup(id: string): WatchElement[] {
    this._watchList ??= [];
    return this._watchList.filter(wl => (wl.groupId ?? 'center') === id);
  }

  isMGDL(status: StatusData): boolean {
    const check = status.settings.units?.trim()?.toLowerCase() ?? '';
    return check.startsWith('mg') && check.endsWith('dl');
  }

  setGlucMGDL(status: StatusData): void {
    this.glucMGDLFromStatus = this.isMGDL(status);
  }

  msgGlucTime(time: number): string {
    return Utils.plural(time, {
      0: $localize`Gerade eben`,
      1: $localize`vor ${time} Minute`,
      other: $localize`vor ${time} Minuten`
    })
  }

  findUrlDataFor(begDate: Date, endDate: Date): UrlData[] {
    const ret: UrlData[] = [];

    let d1 = Utils.addDateDays(begDate, -1);
    const d2 = Utils.addDateDays(endDate, 0);
    while (Utils.isOnOrBefore(d1, d2)) {
      const url = GlobalsData.user.urlDataFor(d1);
      if (ret.find((entry) => entry === url) == null) {
        ret.push(url);
      }
      d1 = Utils.addDateDays(d1, 1);
    }

    return ret;
  }

  msgUrlFailure(url: string): any {
    if (url.startsWith('http:') && window.location.protocol.startsWith('https')) {
      return {msg: this.msgUrlNotSafe};
    }

    const regex = new RegExp('.*\\.(chickenkiller|crabdance|ignorelist|jumpingcrab|mooo|strangled|twilightparadox)(\\.com|\\.net).*', 'g');
    if (url.indexOf('10be.de') >= 0) {
      return {
        buttons: [{title: 'ns.10be', url: 'https://ns.10be.de', icon: 'open_in_new'}],
        msg: `@<>@${this.msgUrlFailurePrefix}${this.msgUrlFailure10be}${this.msgUrlFailureSuffix}`
      };
    } else if (regex.test(url)) {
      return {
        buttons: [{title: $localize`Google Cloud Variablen`, url: 'https://navid200.github.io/xDrip/docs/Nightscout/NS_Variables', icon: 'open_in_new'}],
        msg: `@<>@${this.msgUrlFailurePrefix}${this.msgUrlFailureGoogleCloud}${this.msgUrlFailureSuffix}`
      };
    }
    return {
      msg: `@<>@${this.msgUrlFailurePrefix}${this.msgUrlFailureHerokuapp}${this.msgUrlFailureSuffix}`
    };
  }

  getGlucInfo(): any {
    const ret = {
      step: 1,
      unit: Settings.msgUnitMGDL,
      factor: this.glucFactor,
      stdlow: this.glucFromData(Settings.stdLow),
      stdhigh: this.glucFromData(Settings.stdHigh)
    };
    if (!this.glucMGDL) {
      ret.step = 0.1;
      ret.unit = Settings.msgUnitMMOL;
    }
    return ret;
  }

  glucValueFromData(gluc: any): number {
    if (typeof gluc === 'string') {
      gluc = +(gluc ?? 0);
    }
    if (isNaN(gluc) || gluc === 0) {
      return null;
    }

    if (!this.glucMGDL) {
      return gluc / 18.02;
    }
    return gluc;
  }

  glucFromData(gluc: any, precision: number = null): string {
    if (typeof gluc === 'string') {
      gluc = +(gluc ?? 0);
    }
    if (Utils.isEmpty(gluc)) {
      return '';
    }

    if (!this.glucMGDL) {
      return this.fmtNumber(gluc / 18.02, precision ?? 1);
    }

    return this.fmtNumber(gluc, precision ?? 0);
  }

  glucFromStatusMGDL(gluc: any, precision: number = null): string {
    if (typeof gluc === 'string') {
      gluc = +(gluc ?? 0);
    }
    if (isNaN(gluc) || gluc === 0) {
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

    if (decimals > 0) {
      value = Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
    }
    let ret = formatNumber(value, this.language.code, `1.${decimals}-${decimals}`);
    if (stripTrailingZero) {
      while (ret.endsWith('0')) {
        ret = ret.substring(0, ret.length - 1);
      }

      if (ret.endsWith(Utils.decimalSeparator)) {
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
    params ??= {};
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
    let ret = Utils.fmtDate(dt);
    if (params.withShortWeekday) {
      ret = `${DatepickerPeriod.dowShortName(new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()))}, ${ret}`;
    }
    if (params.withLongWeekday) {
      ret = `${DatepickerPeriod.dowName(new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()))}, ${ret}`;
    }
    return ret;
  }

  fmtDateTime(date: Date | any, params?: { def?: string, withSeconds?: boolean }): string {
    params ??= {};
    params.def ??= '';
    params.withSeconds ??= false;
    if (date == null) {
      return params.def;
    }

    if (date instanceof Date) {
      let ret = `${date.getDate()}`.padStart(2, '0') + '.';
      ret += `${date.getMonth() + 1}`.padStart(2, '0') + '.';
      ret += `${date.getFullYear()}, `;
      ret += `${date.getHours()}`.padStart(2, '0') + ':';
      ret += `${date.getMinutes()}`.padStart(2, '0');
      if (params.withSeconds) {
        ret += ':' + `${date.getSeconds()}`.padStart(2, '0');
      }
      return BasePrint.msgTimeOfDay24(ret);
    }
    return date;
  }

  // calculate a value that is saved in a unit depending

  fmtBasal(value: number, params?: { dontRound?: boolean }) {
    params ??= {};
    params.dontRound ??= false;
    let precision = this.basalPrecision;
    if (params.dontRound) {
      precision = Math.max(GlobalsData.decimalPlaces(value), precision);
    }
    return this.fmtNumber(value, precision, 0, 'null', params.dontRound);
  }

  fmtTime(date: Date | number, params?: { def?: string, withUnit?: boolean, withMinutes?: boolean, withSeconds?: boolean }): string {
    params ??= {};
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
      let m = params.withMinutes ? `:${(date.getMinutes() < 10 ? '0' : '')}${date.getMinutes()}` : '';
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
      } else if (date === 12) {
        return `${this.fmtNumber(date, 0)}${m}pm`;
      } else {
        return `${this.fmtNumber(date - 12, 0)}${m}pm`;
      }
    }
    return `${date}`;
  }

  /**
   * Convert a glucose value from one unit to another.
   *
   * @param {number} value - The glucose value to be converted.
   * @param {string} [units] - The unit of the glucose value (mmol or mg/dl). If not provided, the unit saved in the status will be used.
   * @return {number} - The glucose value converted to the specified unit.
   */
  glucForSavedUnitValue(value: number, units?: string) {
    let isMGDL = this.glucMGDLFromStatus;
    if (units != null) {
      isMGDL = units.toLowerCase().indexOf('mmol') < 0;
    }
    if (this.glucMGDL === isMGDL) {
      return value;
    }
    if (this.glucMGDL) {
      return value * 18.02;
    }
    return value / 18.02;
  }

  timeForCalc(time: Date): number {
    return time.getHours() * 3600 + time.getMinutes() * 60 + time.getSeconds();
  }

  userGroup(key: string): UserData[] {
    return this.userList.filter(user => user.display?.toLowerCase().startsWith(key));
  }

  sortUserList() {
    const user = this.user;
    this.userList.sort((a, b) => {
      if (a.isPinned === b.isPinned) {
        return Utils.compare(a.display?.toLowerCase(), b.display?.toLowerCase());
      }
      return Utils.compare(b.isPinned, a.isPinned);
    });
    this.userIdx = this.userList.findIndex(u => u.display === user.display);
  }

  indexUsers(): void {
    this.sortUserList();
    const list: UserData[] = [];
    let idx = 0;
    for (const user of this.userList) {
      user.userIdx = idx++;
      list.push(user);
    }
    GLOBALS.userList = list;
  }

  togglePin(user: UserData): void {
    user.isPinned = !user.isPinned;
    this.indexUsers();
  }
}
