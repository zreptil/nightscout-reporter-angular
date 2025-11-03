import {FormConfig} from '@/forms/form-config';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {UserData} from '@/_model/nightscout/user-data';
import {Utils} from '@/classes/utils';
import {ParamInfo} from '@/_model/param-info';
import {PageData} from '@/_model/page-data';
import {ReportData} from '@/_model/report-data';
import {DayData} from '@/_model/nightscout/day-data';
import {GridData} from '@/_model/grid-data';
import {LegendData} from '@/_model/legend-data';
import {PdfService} from '@/_services/pdf.service';
import {map, Observable} from 'rxjs';
import {Settings} from '@/_model/settings';
import emojiRegex from 'emoji-regex';

export class StepData {
  constructor(public min: number, public step: number) {
  }
}

export class SubNeeded {
  constructor(public current: boolean, public anybody: boolean) {
  }

  get needed(): boolean {
    return this.current || this.anybody;
  }

  mix(src: SubNeeded): void {
    this.current ||= src.current;
    this.anybody ||= src.anybody;
  }
}

export class DataNeeded {
  status = new SubNeeded(false, false);
  data = new SubNeeded(true, false);

  constructor(statusCurr = false, statusAny = false, dataCurr = true, dataAny = false) {
    this.status.current = statusCurr;
    this.status.anybody = statusAny;
    this.data.current = dataCurr;
    this.data.anybody = dataAny;
  }

  get needsStatus(): boolean {
    return this.status.needed;
  }

  get needsData(): boolean {
    return this.data.needed;
  }

  mix(src: DataNeeded): void {
    this.status.mix(src.status);
    this.data.mix(src.data);
  }
}

class HelpItem {
  constructor(public type: string, public text: string, public cfg?: FormConfig) {
  }
}

/**
 * Base class for printing forms.
 */
export abstract class BasePrint extends FormConfig {
  baseId: string;
  baseIdx: string;
  suffix = '-';
  subtitle: string = null; // must not be undefined else the output will be invalid
  needed = new DataNeeded();
  help: string;
  titleInfo: string;
  titleInfoSub = '';
  footerTextAboveLine = {x: 0, y: 0, fs: 12, text: ''};
  pagesPerSheet = 1;
  params: ParamInfo[] = [];
  colors = {
    colText: '#008800',
    colInfo: '#606060',
    colSubTitle: '#a0a0a0',
    colLine: '#606060',
    colValue: '#000000',
    colBasalProfile: '#0097a7',
    colBasalFont: '#fff',
    colProfileSwitch: '#8080c0',
    colBolus: '#0060c0',
    colBolusExt: '#60c0ff',
    colCarbBolus: '#c000c0',
    colLow: '#ff6666',
    colNormLow: '#809933',
    colNorm: '#00cc00',
    colNormHigh: '#aacc00',
    colHigh: '#cccc00',
    colTargetArea: '#00a000',
    colTargetValue: '#3333aa',
    colCarbs: '#ffa050',
    colCarbsText: '#ff6f00',
    colDurationNotes: '#ff00ff',
    colDurationNotesLine: '#ff50ff',
    colDurationNotesBar: '#ff80ff',
    colDurationNotesText: '#000000',
    colNotes: '#000000',
    colNotesLine: '#666666',
    colGlucValues: '#000000',
    colBloodValues: '#ff0000',
    colHbA1c: '#505050',
    colWeekDays: ['#1b9e77', '#d95f02', '#7570b3', '#e7298a', '#66a61e', '#e6ab02', '#a6761d'],
    colWeekDaysText: ['#ffffff', '#ffffff', '#000000', '#ffffff', '#ffffff', '#000000', '#ffffff'],
    colExercises: '#c0c0c0',
    colExerciseText: '#000000',
    colTempOverrides: '#f8f',
    colTempOverridesText: '#000000',
    colCGPLine: '#a0a0a0',
    colCGPHealthyLine: '#008000',
    colCGPHealthyFill: '#00e000',
    colCGPPatientLine: '#808000',
    colCGPPatientFill: '#e0e000',
    colIOBFill: '#a0a0ff',
    colIOBLine: '#a0a0ff',
    colCOBFill: '#ffa050',
    colCOBLine: '#ffa050',
    colTrendCrit: '#f59595',
    colTrendWarn: '#f2f595',
    colTrendNorm: '#98f595',
    colCOBDaily: '#ffe090',
    colIOBDaily: '#d0d0ff',
    colWarning: '#ff0000'
  };
  xorg = 3.35;
  yorg = 3.9;
  xframe = 2.2;
  lw = 0.03;
  lc = '#c0c0c0';
  lcFrame = '#000000';
  isPortraitParam = true;
  _pages: PageData[] = [];
  _fileSize = 0;
  scale = 1.0;
  offsetX = 0.0;
  offsetY = 0.0;
  tableHeadFilled = false;
  tableHeadLine: any[] = [];
  tableWidths: any[] = [];
  m0: any[] = [];
  repData: ReportData;
  images: { [key: string]: string } = {};
  // true if there is a page for every selected device for glucosevalues
  hasDevicePages = false;
  collectedImages: string[] = [];
  emojiReplacements: any = {};

  protected constructor(public ps: PdfService) {
    super(null, false);
    this.form = this;
  }

  static get msgOutput(): string {
    return $localize`Ausgabe`;
  };

  static get msgGraphic(): string {
    return $localize`Grafik`;
  };

  static get msgTable(): string {
    return $localize`Tabelle`;
  };

  static get msgAll(): string {
    return $localize`Alles`;
  };

  static get titleGPD(): string {
    return $localize`Glukose Perzentil Diagramm`;
  };

  static get titleGPDShort(): string {
    return $localize`GPD`;
  };

  static get msgHourlyStats(): string {
    return $localize`Stündliche Statistik`;
  };

  static get msgUseDailyBasalrate(): string {
    return $localize`Tagesbasalrate verwenden`;
  };

  static get msgGraphsPerPage(): string {
    return $localize`Grafiken pro Seite`;
  }

  static get msgOverrides(): string {
    return $localize`Temporäre Overrides`;
  }

  static get msgOrientation(): string {
    return $localize`Ausrichtung`;
  }

  static get msgChange(): string {
    return $localize`Wechsel`;
  }

  static get msgDay(): string {
    return $localize`Tag (08:00 - 17:59)`;
  }

  static get msgDawn(): string {
    return $localize`Dämmerung (06:00 - 07:59, 18:00 - 20:59)`;
  }

  static get msgNight(): string {
    return $localize`Nacht (21:00 - 05:59)`;
  }

  get isVisible(): boolean {
    if (this.isDebugOnly && !GLOBALS.isDebug) {
      return false;
    }
    if (this.isLocalOnly && !GLOBALS.isLocal) {
      return false;
    }
    // noinspection RedundantIfStatementJS
    if (this.isBetaOrLocal && !(GLOBALS.isBeta || GLOBALS.isLocal)) {
      return false;
    }

    return true;
  }

  abstract get title(): string;

  override get id(): string {
    return `${this.baseId}${this.suffix}`;
  }

  override get dataId(): string {
    return `${this.baseId}${this.suffix === '-' ? '' : this.suffix}`;
  }

  override get idx(): string {
    return `${this.baseIdx}${this.suffix}`;
  }

  get helpStrings(): HelpItem[] {
    const ret: HelpItem[] = [];
    let text = Utils.cvtMultilineText(this.help);
    // let text = this.help?.replace(/\n/g, 'µ') ?? '';
    // text = text.replace(/µµ/g, '<br><br>');
    // text = text.replace(/µ/g, ' ');
    let pos = text.indexOf('@');
    while (pos >= 0) {
      if (pos > 0) {
        ret.push(new HelpItem('text', text.substring(0, pos)));
        text = text.substring(pos);
        pos = 0;
      }
      text = text.substring(1);
      const pos1 = text.indexOf('@');
      if (pos1 >= 0) {
        const id = text.substring(0, pos1);
        const cfg = GLOBALS.listConfig.find((cfg) => cfg.form.baseIdx === id);
        if (cfg != null) {
          ret.push(new HelpItem('btn', cfg.form.title, cfg));
        }
        text = text.substring(pos1 + 1);
      }
      pos = text.indexOf('@');
    }
    if (!Utils.isEmpty(text)) {
      ret.push(new HelpItem('text', text));
    }
    return ret;
  }

  get display(): string {
    let ret = this.title;
    if (this.isLocalOnly) {
      ret = `${ret} (local)`;
    }
    if (this.suffix !== '-') {
      ret = `${ret} ${+this.suffix + 1}`;
    }
    return ret;
  }

  get isLocalOnly(): boolean {
    return false;
  }

  get isDebugOnly(): boolean {
    return false;
  }

  get isBetaOrLocal(): boolean {
    return false;
  }

  get backsuffix(): string {
    return '';
  }

  get backimage(): string {
    this.extractParams();
    return `assets/img/thumbs/${GLOBALS.language.img}/${this.baseId}${this.backsuffix === '' ? '' : `-${this.backsuffix}`}.png`;
  }

  get sortedParams(): ParamInfo[] {
    const ret: ParamInfo[] = [];
    Utils.pushAll(ret, this.params.filter((p) => !p.isDeprecated))
    ret.sort((a, b) => Utils.compare(a.sort, b.sort));
    return ret;
  }

  get colText(): string {
    return this.colors.colText;
  }

  get colInfo(): string {
    return this.colors.colInfo;
  }

  get colSubTitle(): string {
    return this.colors.colSubTitle;
  }

  get colLine(): string {
    return this.colors.colLine;
  }

  get colValue(): string {
    return this.colors.colValue;
  }

  get colBasalProfile(): string {
    return this.colors.colBasalProfile;
  }

  get colBasalDay(): string {
    return this.blendColor(this.colBasalProfile, '#ffffff', 0.5);
  }

  get colBasalFont(): string {
    return this.colors.colBasalFont;
  }

  get colProfileSwitch(): string {
    return this.colors.colProfileSwitch;
  }

  get colBolus(): string {
    return this.colors.colBolus;
  }

  get colBolusExt(): string {
    return this.colors.colBolusExt;
  }

  get colCarbBolus(): string {
    return this.colors.colCarbBolus;
  }

  get colLow(): string {
    return this.colors.colLow;
  }

  get colNormLow(): string {
    return this.colors.colNormLow;
  }

  get colNorm(): string {
    return this.colors.colNorm;
  }

  get colNormHigh(): string {
    return this.colors.colNormHigh;
  }

  get colHigh(): string {
    return this.colors.colHigh;
  }

  get colLowBack(): string {
    return this.blendColor(this.colLow, '#ffffff', 0.4);
  }

  get colNormLowBack(): string {
    return this.blendColor(this.colNormLow, '#ffffff', 0.4);
  }

  get colNormBack(): string {
    return this.blendColor(this.colNorm, '#ffffff', 0.4);
  }

  get colNormHighBack(): string {
    return this.blendColor(this.colNormHigh, '#ffffff', 0.4);
  }

  get colHighBack(): string {
    return this.blendColor(this.colHigh, '#ffffff', 0.4);
  }

  get colTargetArea(): string {
    return this.colors.colTargetArea;
  }

  get colTargetValue(): string {
    return this.colors.colTargetValue;
  }

  get colCarbs(): string {
    return this.colors.colCarbs;
  }

  get colCarbsText(): string {
    return this.colors.colCarbsText;
  }

  get colDurationNotes(): string {
    return this.colors.colDurationNotes;
  }

  get colDurationNotesText(): string {
    return this.colors.colDurationNotesText;
  }

  get colDurationNotesBar(): string {
    return this.colors.colDurationNotesBar;
  }

  get colDurationNotesLine(): string {
    return this.colors.colDurationNotesLine;
  }

  get colNotes(): string {
    return this.colors.colNotes;
  }

  get colNotesLine(): string {
    return this.colors.colNotesLine;
  }

  get colGlucValues(): string {
    return this.colors.colGlucValues;
  }

  get colBloodValues(): string {
    return this.colors.colBloodValues;
  }

  get colHbA1c(): string {
    return this.colors.colHbA1c;
  }

  get colWeekDays(): string[] {
    return this.colors.colWeekDays;
  }

  get colWeekDaysText(): string[] {
    return this.colors.colWeekDaysText;
  }

  get colExercises(): string {
    return this.colors.colExercises;
  }

  get colExerciseText(): string {
    return this.colors.colExerciseText;
  }

  get colTempOverrides(): string {
    return this.colors.colTempOverrides;
  }

  get colTempOverridesText(): string {
    return this.colors.colTempOverridesText;
  }

  get colCGPLine(): string {
    return this.colors.colCGPLine;
  }

  get colCGPHealthyLine(): string {
    return this.colors.colCGPHealthyLine;
  }

  get colCGPHealthyFill(): string {
    return this.colors.colCGPHealthyFill;
  }

  get colCGPPatientLine(): string {
    return this.colors.colCGPPatientLine;
  }

  get colCGPPatientFill(): string {
    return this.colors.colCGPPatientFill;
  }

  get colIOBFill(): string {
    return this.colors.colIOBFill;
  }

  get colIOBLine(): string {
    return this.colors.colIOBLine;
  }

  get colCOBFill(): string {
    return this.colors.colCOBFill;
  }

  get colCOBLine(): string {
    return this.colors.colCOBLine;
  }

  get colTrendCrit(): string {
    return this.colors.colTrendCrit;
  }

  get colTrendWarn(): string {
    return this.colors.colTrendWarn;
  }

  get colTrendNorm(): string {
    return this.colors.colTrendNorm;
  }

  get colCOBDaily(): string {
    return this.colors.colCOBDaily;
  }

  get colIOBDaily(): string {
    return this.colors.colIOBDaily;
  }

  get colWarning(): string {
    return this.colors.colWarning;
  }

  _isPortrait = true;

  //String _hba1c(double avgGluc)
  //=> g.fmtNumber((avgGluc + 86) / 33.3, 1, false);
  //(avgGluc / 18.02 + 2.645) / 1.649;

  get isPortrait(): boolean {
    return this._isPortrait;
  }

  public set isPortrait(value: boolean) {
    this._isPortrait = value;
  }

  get width(): number {
    return this.isPortrait ? 21.0 : 29.7;
  }

  get height(): number {
    return this.isPortrait ? 29.7 : 21.0;
  }

  abstract get estimatePageCount(): any;

  get msgInsulinUnit(): string {
    return $localize`:@@msgInsulinUnit:IE`;
  }

  get msgUntil(): string {
    return $localize`:@@msgUntil:bis`;
  }

  get msgAdjustGlucHint(): string {
    if (Settings.adjustFactor > 1) {
      return this._msgRaiseGlucHint(GLOBALS.fmtNumber((Settings.adjustFactor - 1) * 100, 2));
    }
    return this._msgLowerGlucHint(GLOBALS.fmtNumber((1 - Settings.adjustFactor) * 100, 2));
  }

  get msgMealBolus(): string {
    return $localize`:|bolus to handle a meal@@msgMealBolus:Mahlzeitenbolus`;
  }

  get msgBolusWizard(): string {
    return $localize`:|bolus calculated by the bolus wizard@@msgBolusWizard:Bolus Rechner`;
  }

  get msgBolusExtInsulin(): string {
    return $localize`:@@msgBolusExtInsulin:Verzögerter Bolus`;
  }

  get msgBasalrate(): string {
    return $localize`Basalrate`;
  }

  get msgTDD(): string {
    return $localize`TDD`;
  }

  get msgMissingData(): string {
    return $localize`Es sind keine Daten für den Ausdruck vorhanden`;
  }

  get msgServerNotReachable(): string {
    return GLOBALS.msgUrlFailure('')?.msg.replace('<br>', '\n');
  }

  get msgCatheterChange(): string {
    return $localize`Katheterwechsel`;
  }

  get msgSensorChange(): string {
    return $localize`Sensorwechsel`;
  }

  get msgAmpulleChange(): string {
    return $localize`Reservoirwechsel`;
  }

  get msgCollectedValues(): string {
    return $localize`Aufsummierte Werte`;
  }

  get msgCarbIE(): string {
    return $localize`Berechnete IE für Kohlenhydrate`;
  }

  get msgKHTitle(): string {
    return $localize`KH`;
  }

  get msgBirthday(): string {
    return $localize`Geburtstag`;
  }

  get msgDiabSince(): string {
    return $localize`Diabetes seit`;
  }

  get msgInsulin(): string {
    return $localize`Insulin`;
  }

  get msgDays(): string {
    return $localize`Ausgewertete Tage`;
  }

  get msgReadingsCount(): string {
    return $localize`Anzahl Messungen`;
  }

  get msgReservoirCount(): string {
    return $localize`Anzahl Ampullenwechsel`;
  }

  get msgCatheterCount(): string {
    return $localize`Anzahl Katheterwechsel`;
  }

  get msgSensorCount(): string {
    return $localize`Anzahl Sensorenwechsel`;
  }

  get msgReportDevices(): string {
    return $localize`Verwendete Glukosequellen`;
  }

  get msgHbA1C(): string {
    return $localize`gesch. HbA1c`;
  }

  get msgHbA1CLong(): string {
    return $localize`Geschätzter HbA1c`;
  }

  get msgLowestValue(): string {
    return $localize`Niedrigster Wert im Zeitraum`;
  }

  get msgHighestValue(): string {
    return $localize`Höchster Wert im Zeitraum`;
  }

  get msgGlucoseValue(): string {
    return $localize`Ø Zuckerwert`;
  }

  // https://bionicwookiee.com/2020/02/26/cgm-metrics-gvi-pgs/
  get msgGVIFull(): string {
    return $localize`Glykämischer Variabilitäts Index (GVI)`;
  }

  get msgPGSFull(): string {
    return $localize`Patient Glykämischer Status (PGS)`;
  }

  get msgGRIFull(): string {
    return $localize`Glykämischer Risiko Index (GRI)`;
  }

  get msgKHPerDay(): string {
    return $localize`Ø KH pro Tag`;
  }

  get msgKHPerMeal(): string {
    return $localize`Ø KH pro Mahlzeit`;
  }

  get msgInsulinPerDay(): string {
    return $localize`Ø Insulin pro Tag`;
  }

  get msgBolusPerDay(): string {
    return $localize`Ø Bolus pro Tag`;
  }

  get msgBasalPerDay(): string {
    return $localize`Ø Basal pro Tag`;
  }

  get msgMicroBolusPerDay(): string {
    return $localize`Ø Microbolus pro Tag`;
  }

  get msgInsulinRatio(): string {
    return $localize`Ø Insulinverhältnis`;
  }

  get msgBolus(): string {
    return $localize`Bolus`;
  }

  get msgBasal(): string {
    return $localize`Basal`;
  }

  get msgBasalProfile(): string {
    return $localize`Basalrate\nIE / Stunde`;
  }

  get msgNone(): string {
    return $localize`Keine`;
  }

  get msgOwnLimits(): string {
    return $localize`Eigene Grenzwerte`;
  }

  get msgStandardLimits(): string {
    return $localize`Standardgrenzwerte`;
  }

  get msgTreatments(): string {
    return $localize`Behandlungen`;
  }

  get msgPeriod(): string {
    return $localize`Zeitraum`;
  }

  get msgTotal(): string {
    return $localize`Ges.`;
  }

  get msgTimeShort(): string {
    return $localize`Uhr-\nzeit`;
  }

  get msgTime(): string {
    return $localize`Uhrzeit`;
  }

  get msgIEHr(): string {
    return $localize`IE/std`;
  }

  get msgSum(): string {
    return $localize`Summe`;
  }

  get msgTrend(): string {
    return $localize`Trend`;
  }

  get msgNote(): string {
    return $localize`Notiz`;
  }

  get msgAdjustment(): string {
    return $localize`Anpas-\nsung`;
  }

  get msgGlucLow(): string {
    return $localize`Glukose zu niedrig`;
  }

  get msgGlucNorm(): string {
    return $localize`Glukose im Zielbereich`;
  }

  get msgSource(): string {
    return $localize`Quelle: Vigersky, R. A., Shin, J., Jiang, B., Siegmund, T., McMahon, C., & Thomas, A. (2018). The Comprehensive Glucose Pentagon: A Glucose-Centric Composite Metric for Assessing Glycemic Control in Persons With Diabetes. Journal of Diabetes Science and Technology, 12(1), 114-123. (https://doi.org/10.1177/1932296817718561)`;
  }

  get msgGlucHigh(): string {
    return $localize`Glukose zu hoch`;
  }

  get msgNormal(): string {
    return `${$localize`Normal`}\n${GLOBALS.getGlucInfo()['unit']}`;
  }

  get msgPercentile1090(): string {
    return $localize`10% - 90% der Werte`;
  }

  get msgPercentile2575(): string {
    return $localize`25% - 75% der Werte`
  };

  get msgICRTitle(): string {
    return $localize`Insulin Kohlenhydrate Verhältnis (ICR)`;
  }

  get msgISFTitle(): string {
    return $localize`Insulin Sensitivitäts Faktoren (ISF)`;
  }

  get msgBasalTitle(): string {
    return $localize`Basalrate`;
  }

  get msgBasalSum(): string {
    return $localize`Gesamt`;
  }

  get msgTargetTitle(): string {
    return $localize`Zielbereich`;
  }

  get msgICRSum(): string {
    return $localize`Ø ICR/Stunde`;
  }

  get msgISFSum(): string {
    return $localize`Ø ISF/Stunde`;
  }

  get msgICR(): string {
    return $localize`Insulin Kohlenhydrate Verhältnis (ICR)\nX g Kohlenhydrate für 1 IE`;
  }

  get msgProfile(): string {
    return $localize`Profileinstellungen`;
  }

  get msgDIA(): string {
    return $localize`Dauer der Insulinaktivität (DIA)`;
  }

  get msgDIAUnit(): string {
    return $localize`Stunden`;
  }

  get msgKHA(): string {
    return $localize`Dauer der Kohlenhydrataktivität`;
  }

  get msgTimezone(): string {
    return $localize`Zeitzone`;
  }

  get msgKHAUnit(): string {
    return $localize`g / Stunde`;
  }

  get msgDate(): string {
    return $localize`Datum`;
  }

  get msgDistribution(): string {
    return $localize`Verteilung`;
  }

  get msgValues(): string {
    return $localize`Mess-\nwerte`;
  }

  get msgMin(): string {
    return $localize`Min`;
  }

  get msgMax(): string {
    return $localize`Max`;
  }

  get msgGluc(): string {
    return $localize`IE`;
  }

  get msgCarbShort(): string {
    return $localize`KH`;
  }

  get msgAverage(): string {
    return $localize`Mittel-\nwert`;
  }

  get msgDeviation(): string {
    return $localize`Std.\nAbw.`;
  }

  get msgVarK(): string {
    return $localize`VarK\nin %`;
  }

  get msg10(): string {
    return $localize`10%`;
  }

  get msg25(): string {
    return $localize`25%`;
  }

  get msg75(): string {
    return $localize`75%`;
  }

  get msg90(): string {
    return $localize`90%`;
  }

  get msgDayAverage(): string {
    return $localize`Durchschnitt`;
  }

  get msgStandardDeviation(): string {
    return $localize`Standardabweichung`;
  }

  get footerText(): any {
    return null;
  }

  get footerTextDayTimes(): any {
    return [
      {
        table: {
          widths: [this.cm(6.0)],
          body: [
            [
              {text: BasePrint.msgDay, style: 'timeDay', alignment: 'center'}
            ],
            [
              {text: BasePrint.msgDawn, style: 'timeLate', alignment: 'center'}
            ],
            [
              {text: BasePrint.msgNight, style: 'timeNight', alignment: 'center'}
            ]
          ]
        },
        fontSize: this.fs(7),
        layout: 'noBorders'
      }
    ];
  }

  get imgList(): string[] {
    return ['nightscout-pale', 'nightscout'];
  }

  get msgBasalInsulin(): string {
    return $localize`Basal Insulin`;
  }

  get pdfWarnings(): string[] {
    const ret = GLOBALS.pdfWarnings.clone();
    if (this.hasDevicePages && this.repData.deviceFilter?.[0] !== 'all') {
      ret.showGlucSources = false;
    }
    return ret.text;
  }

  static msgTimeOfDay24(time: string): string {
    return $localize`${time} Uhr`;
  }

  static msgTimeOfDayAM(time: string): string {
    return $localize`${time} am`;
  }

  static msgTimeOfDayPM(time: string): string {
    return $localize`${time} pm`;
  }

  static msgCalibration(scale: string, intercept: string, slope: string): string {
    return $localize`Kalibrierung (scale ${scale} / intercept ${intercept} / slope ${slope})`;
  }

  hba1cUnit(withSpacer = false): string {
    const ret = GLOBALS.ppShowHbA1Cmmol ? $localize`mmol/mol` : '%';
    if (withSpacer) {
      return `${GLOBALS.ppShowHbA1Cmmol ? '\n' : ' '}${ret}`;
    }
    return ret;
  }

  msgMedian(deviceKey: string): string {
    let ret = $localize`:@@msgMedian:Median`;
    if (deviceKey != null && this.repData.deviceList?.[0] !== 'all') {
      const idx = this.repData.deviceList.indexOf(deviceKey);
      if (idx >= 0) {
        ret += ' ' + this.repData.deviceList[idx];
      }
    }
    return ret;
  }

  msgGlucosekurve(key: string): string {
    return key === 'all' ? $localize`:@@msgGlucosekurve:Glukosekurve` : key;
  };

  mm(value: number): number {
    return value / 0.35277;
  }

  cm(value: number): number {
    return isNaN(value) ? 0 : value / 0.035277 * this.scale;
  }

  cmx(value: number): number {
    return this.cm(this.offsetX + value);
  }

  cmy(value: number): number {
    return this.cm(this.offsetY + value);
  }

  fs(size: number): number {
    return size * this.scale;
  }

  async loadUserData(_: UserData) {
  }

  hba1c(avgGluc: number): string {
    return avgGluc == null ? '' : this.hba1cDisplay(avgGluc);
  }

  hba1cValue(avgGluc: number): number {
    return avgGluc == null ? null : (avgGluc + 46.7) / 28.7;
  }

  blendColor(from: string, to: string, factor: number): string {
    if (from.length === 7) {
      from = from.substring(1);
    }
    if (to.length === 7) {
      to = to.substring(1);
    }
    const rf = parseInt(from.substring(0, 2) ?? '0', 16);
    const gf = parseInt(from.substring(2, 4) ?? '0', 16);
    const bf = parseInt(from.substring(4, 6) ?? '0', 16);
    const rt = parseInt(to.substring(0, 2) ?? '0', 16);
    const gt = parseInt(to.substring(2, 4) ?? '0', 16);
    const bt = parseInt(to.substring(4, 6) ?? '0', 16);

    const r = Math.floor(rf + (rt - rf) * factor);
    const g = Math.floor(gf + (gt - gf) * factor);
    const b = Math.floor(bf + (bt - bf) * factor);

    return `#${this.radixString(r)}${this.radixString(g)}${this.radixString(b)}`;
  }

  radixString(value: number): string {
    let ret = (value ?? 0).toString(16);
    while (ret.length < 2) {
      ret = `0${ret}`;
    }
    return ret;
  }

  pageCountDisplay(forceEstimate: boolean): string {
    let ret = {count: GLOBALS?.period?.dayCount ?? 0, isEstimated: true};
    if (!forceEstimate && this._pages != null && this._pages.length > 0) {
      ret.count = this._pages.length;
      ret.isEstimated = false;
    } else {
      this.extractParams();
      ret = this.estimatePageCount;
    }

    ret.count = Math.ceil(ret.count / this.pagesPerSheet);
    return this.msgPageCount(ret.count, ret.isEstimated);
  }

  _msgPageCountEst(count: number): string {
    return Utils.plural(count, {
      0: '',
      1: $localize`1 Seite oder mehr`,
      other: $localize`${count} Seiten oder mehr`
    });
  }

  _msgPageCount(count: number): string {
    return Utils.plural(count, {
      0: '',
      1: $localize`1 Seite`,
      other: $localize`${count} Seiten`
    });
  }

  msgPageCount(count: number, isEstimated: boolean): any {
    return isEstimated ? this._msgPageCountEst(count) : this._msgPageCount(count);
  }

  msgKW(week: number): string {
    return $localize`:@@msgKW:KW${week}`;
  }

  msgValidRange(begDate: string, endDate: string): string {
    return $localize`:@@msgValidRange:gültig von ${begDate} bis ${endDate}`;
  }

  msgValidFrom(begDate: string): string {
    return $localize`:@@msgValidFrom:gültig ab ${begDate}`;
  }

  msgValidTo(endDate: string): string {
    return $localize`:@@msgValidTo:gültig bis ${endDate}`;
  }

  msgDuration(hours: number, minutes: number): string {
    return $localize`:@@msgDuration:${hours} Std ${minutes} Min`;
  }

  msgTargetArea(min: string, max: string, units: string): string {
    return $localize`:@@msgTargetArea:Zielbereich (${min} - ${max} ${units})`;
  }

  msgTargetValue(_: string): string {
    return $localize`:@@msgTargetValue:Zielwert`;
  }

  _msgLowerGlucHint(factor: string): string {
    return $localize`:@@_msgLowerGlucHint:Alle sensorischen Glukosewerte wurden um ${factor} % verringert`;
  }

  _msgRaiseGlucHint(factor: string): string {
    return $localize`:@@_msgRaiseGlucHint:Alle sensorischen Glukosewerte wurden um ${factor} % erhöht`;
  }

  msgCarbs(value: string): string {
    return $localize`:@@msgCarbs:Kohlenhydrate (${value}g)`;
  }

  msgBolusInsulin(value: string): string {
    return $localize`:@@msgBolusInsulin:Bolus Insulin (${value})`;
  }

  msgCorrectBolusInsulin(value: string): string {
    return $localize`:@@msgCorrectBolusInsulin:Korrektur Bolus (${value})`;
  }

  checkValue(_: ParamInfo, __: any): void {
  }

  msgCarbBolusInsulin(value: string): string {
    return $localize`Mahlzeiten Bolus (${value})`;
  }

  msgSMBInsulin(value: string): string {
    return $localize`SMB (${value})`;
  }

  msgBasalrateDay(value: string): string {
    return $localize`Basalrate für den Tag (${value})`;
  }

  msgBasalrateProfile(value: string): string {
    return $localize`Basalrate aus dem Profil (${value})`;
  }

  msgLegendTDD(value?: string): string {
    const ret = $localize`Gesamtinsulin`;
    return value != null ? `${ret} (${value})` : ret;
  }

  msgKH(value: any): string {
    return $localize`${value}g`;
  }

  msgReadingsPerDay(howMany: number, fmt: string): string {
    return Utils.plural(howMany, {
      0: $localize`Keine Messwerte vorhanden`,
      1: $localize`1 Messung am Tag`,
      other: $localize`${fmt} Messungen am Tag`
    });
  }

  msgReadingsPerHour(howMany: number, fmt: string): string {
    return Utils.plural(howMany,
      {
        0: $localize`Keine Messwerte vorhanden`,
        1: $localize`1 Messung pro Stunde`,
        other: $localize`${fmt} Messungen pro Stunde`
      });
  }

  msgReadingsInMinutes(howMany: number, fmt: string): string {
    return Utils.plural(howMany, {
      0: $localize`Keine Messwerte vorhanden`,
      1: $localize`1 Messung pro Minute`,
      other: $localize`Messung alle ${fmt} Minuten`
    });
  }

  msgValuesIn(low: string, high: string): string {
    return $localize`Werte zwischen ${low} und ${high}`;
  }

  msgValuesBelow(low: string): string {
    return $localize`Werte unter ${low}`;
  }

  msgValuesAbove(high: string): string {
    return $localize`Werte über ${high}`;
  }

  msgValuesVeryHigh(value: string): string {
    return $localize`Sehr hohe Werte ( > ${value})`;
  }

  msgValuesNormHigh(value: string): string {
    return $localize`Hohe Werte (${value})`;
  }

  msgValuesNorm(low: string, high: string): string {
    return $localize`Zielbereich (${low} - ${high})`;
  }

  msgValuesNormLow(value: string): string {
    return $localize`Niedrige Werte (${value})`;
  }

  msgValuesVeryLow(value: string): string {
    return $localize`Sehr niedrige Werte (< ${value})`;
  }

  msgKHBE(value: string): string {
    return $localize`g KH (${value} BE)`;
  }

  msgReservoirDays(count: number, txt: string): string {
    return Utils.plural(count, {
      0: ``,
      1: $localize`(${txt} Tag pro Ampulle)`,
      other: $localize`(${txt} Tage pro Ampulle)`
    });
  }

  msgCatheterDays(count: number, txt: string): string {
    return Utils.plural(count, {
      0: ``,
      1: $localize`(${txt} Tag pro Katheter)`,
      other: $localize`(${txt} Tage pro Katheter)`
    });
  }

  msgSensorDays(count: number, txt: string): string {
    return Utils.plural(count, {
      0: ``,
      1: $localize`(${txt} Tag pro Sensor)`,
      other: $localize`(${txt} Tage pro Sensor)`
    });
  }

  msgLow(value: string): string {
    value = `\n<${GLOBALS.glucFromData(value)}`;
    return $localize`Tief${value}`;
  }

  msgCount(count: number): string {
    return Utils.plural(count, {
      0: $localize`Kein Wert`,
      1: $localize`1 Wert`,
      other: $localize`${count} Werte`
    });
  }

  msgStdAbw(value: number): string {
    const text = GLOBALS.fmtNumber(value, 1, 0, '0.0');
    return $localize`(StdAbw ${text})`;
  }

  msgHigh(value: number): string {
    const text = `\n>=${GLOBALS.glucFromData(value)}`;
    return $localize`Hoch${text}`;
  }

  msgISF(unit: string): string {
    return $localize`Insulin Sensitivitäts Faktoren (ISF)\n1 IE senkt BG um X ${unit}`;
  }

  msgTarget(unit: string): string {
    return $localize`Glukose-Zielbereich\n${unit}`;
  }

  msgFactorEntry(beg: string, end: string): string {
    return $localize`${beg} - ${end}`;
  }

  msgDaySum(value: number): string {
    return $localize`${value} Tage`;
  }

  msgGVINone(min: number): string {
    const text = GLOBALS.fmtNumber(min, 1);
    return $localize`nicht vorhanden (kleiner ${text})`;
  }

  msgGVIVeryGood(min: number, max: number): string {
    const txtMin = GLOBALS.fmtNumber(min, 1);
    const txtMax = GLOBALS.fmtNumber(max, 1);
    return $localize`sehr gut (${txtMin} bis ${txtMax})`;
  }

  msgGVIGood(min: number, max: number): string {
    const txtMin = GLOBALS.fmtNumber(min, 1);
    const txtMax = GLOBALS.fmtNumber(max, 1);
    return $localize`gut (${txtMin} bis ${txtMax})`;
  }

  msgGVIBad(max: number): string {
    const txtMax = GLOBALS.fmtNumber(max, 1);
    return $localize`schlecht (grösser ${txtMax})`;
  }

  gviQuality(gvi: number): string {
    if (gvi < 1.0) {
      return this.msgGVINone(1.0);
    } else if (gvi <= 1.2) {
      return this.msgGVIVeryGood(1.0, 1.2);
    } else if (gvi <= 1.5) {
      return this.msgGVIGood(1.2, 1.5);
    }
    return this.msgGVIBad(1.5);
  }

  msgPGSVeryGood(min: number): string {
    const txtMin = GLOBALS.fmtNumber(min);
    return $localize`exzellent (kleiner ${txtMin})`;
  }

  msgPGSGood(min: number, max: number): string {
    const txtMin = GLOBALS.fmtNumber(min);
    const txtMax = GLOBALS.fmtNumber(max);
    return $localize`gut (${txtMin} bis ${txtMax})`;
  }

  msgPGSBad(min: number, max: number): string {
    const txtMin = GLOBALS.fmtNumber(min);
    const txtMax = GLOBALS.fmtNumber(max);
    return $localize`schlecht (${txtMin} bis ${txtMax})`;
  }

  msgPGSVeryBad(max: number): string {
    const txtMax = GLOBALS.fmtNumber(max);
    return $localize`sehr schlecht (grösser ${txtMax})`;
  }

  pgsQuality(pgs: number): string {
    if (pgs < 35.0) {
      return this.msgPGSVeryGood(35);
    } else if (pgs <= 100.0) {
      return this.msgPGSGood(35, 100);
    } else if (pgs <= 150.0) {
      return this.msgPGSBad(100, 150);
    }
    return this.msgPGSVeryBad(150);
  }

  msgGRIZone(zone: string, min: number, max?: number): string {
    const txtMin = GLOBALS.fmtNumber(min);
    const txtMax = GLOBALS.fmtNumber(max);
    if (max != null) {
      return $localize`Zone ${zone} (${txtMin} bis ${txtMax})`;
    }
    return $localize`Zone ${zone} (über ${txtMin})`;
  }

  griData(gri: number): any {
    if (gri <= 20.0) {
      return {
        quality: this.msgGRIZone('A', 0, 20),
        color: '#79BF7A'
      };
    } else if (gri <= 40.0) {
      return {
        quality: this.msgGRIZone('B', 20, 40),
        color: '#F6F27E'
      };
    } else if (gri <= 60.0) {
      return {
        quality: this.msgGRIZone('C', 40, 60),
        color: '#FFD079'
      };
    } else if (gri <= 80.0) {
      return {
        quality: this.msgGRIZone('D', 60, 80),
        color: '#F2787A'
      };
    }
    return {
      quality: this.msgGRIZone('E', 80),
      color: '#CF9390'
    };
  }

  msgHistorical(value: string): string {
    return $localize`Historisch ${value}`;
  }

  /**
   * Returns a localized string based on the count of columns.
   * The localized string will indicate the number of available
   * columns or provide instructions on how to select columns.
   *
   * @param {number} count - The count of columns.
   *
   * @return {string} - The localized string.
   */
  msgColumns(count: number): string {
    return Utils.plural(count, {
      0: $localize`Eine Spalte abwählen, um eine@nl@andere aktivieren zu können`,
      1: $localize`Noch eine Spalte verfügbar`,
      other: $localize`Noch ${count} Spalten verfügbar`
    }).replace('@nl@', '<br>');
  }

  fmtTime(date: Date | number, params?: { def?: string, withUnit?: boolean, withMinutes?: boolean, withSeconds?: boolean }): string {
    return GLOBALS.fmtTime(date, params);
  }

  fmtDate(date: Date | any, params?: { def?: string, withShortWeekday?: boolean, withLongWeekday?: boolean }): string {
    return GLOBALS.fmtDate(date, params);
  }

  fmtDateTime(date: Date | any, params?: { def?: string, withSeconds?: boolean }): string {
    return GLOBALS.fmtDateTime(date, params);
  }

  /**
   * Formats a date according to the specified format.
   *
   * @param {Date} date - The date to format.
   * @param {string} format - The format to use. Possible values are 'day', 'week', and 'month'.
   * @returns {string} The formatted date.
   */
  fmtDateShort(date: Date, format: string) {
    switch (format.toLowerCase()) {
      case 'day':
        return GLOBALS.fmtDateForDisplay.transform(date, GLOBALS.language.dateShortFormat);
      case 'week':
        const d = new Date(+date);
        d.setHours(0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const ys = new Date(d.getFullYear(), 0, 1);
        const nr = Math.ceil((((d.valueOf() - ys.valueOf()) / 86400000) + 1) / 7);
        return this.msgKW(nr);
      case 'month':
        return GLOBALS.fmtDateForDisplay.transform(date, 'MMMM');
    }
    return '';
  }

  /**
   * Returns the title information based on the given start and end dates.
   *
   * @param {Date} startDate - The start date.
   * @param {Date} endDate - The end date. If null, only the start date will be considered.
   *
   * @return {string} The title information based on the provided dates.
   */
  titleInfoForDates(startDate: Date, endDate: Date): string {
    let ret: string;
    if (endDate == null) {
      ret = this.msgValidFrom(this.fmtDate(startDate));
    } else if (startDate.getFullYear() === 1970) {
      ret = this.msgValidTo(this.fmtDate(endDate));
    } else {
      ret = this.msgValidRange(this.fmtDate(startDate), this.fmtDate(endDate));
    }
    return ret;
  }

  targets(repData: ReportData): any {
    const ret = {low: Settings.stdLow, high: Settings.stdHigh};
    if (!GLOBALS.ppStandardLimits) {
      ret.low = repData.status.settings.bgTargetBottom;
      ret.high = repData.status.settings.bgTargetTop;
    }
    return ret;
  }

  headerFooter(params?: { skipFooter?: boolean, date?: Date }): any {
    params ??= {};
    params.skipFooter ??= false;
    const isInput = false;
    const stack: any[] = [];
    const ret = {stack: stack, 'pageBreak': ''};
    // header
    if (this.isPortrait) {
      if (isInput) {
        stack.push({
          'relativePosition': {'x': this.cm(0), 'y': this.cm(0)},
          'canvas': [
            {type: 'rect', x: this.cm(0.0), y: this.cm(0), w: this.cm(1.6), h: this.cm(0.55), color: '#d69a2e'},
            {type: 'rect', x: this.cm(1.6), y: this.cm(0), w: this.cm(1.6), h: this.cm(0.55), color: '#2e4736'},
            {type: 'rect', x: this.cm(3.2), y: this.cm(0), w: this.cm(1.6), h: this.cm(0.55), color: '#662c40'},
            {type: 'rect', x: this.cm(4.8), y: this.cm(0), w: this.cm(1.6), h: this.cm(0.55), color: '#343a49'},
            {type: 'rect', x: this.cm(6.4), y: this.cm(0), w: this.cm(1.6), h: this.cm(0.55), color: '#528c8e'},
            {type: 'rect', x: this.cm(8.0), y: this.cm(0), w: this.cm(1.6), h: this.cm(0.55), color: '#362946'},
            {type: 'rect', x: this.cm(9.6), y: this.cm(0), w: this.cm(1.6), h: this.cm(0.55), color: '#6b8133'},
            {type: 'rect', x: this.cm(11.2), y: this.cm(0), w: this.cm(1.6), h: this.cm(0.55), color: '#2a3b56'},
            {type: 'rect', x: this.cm(12.8), y: this.cm(0), w: this.cm(1.6), h: this.cm(0.55), color: '#862d2e'},
            {type: 'rect', x: this.cm(14.4), y: this.cm(0), w: this.cm(1.6), h: this.cm(0.55), color: '#607f6e'},
            {type: 'rect', x: this.cm(16.0), y: this.cm(0), w: this.cm(1.6), h: this.cm(0.55), color: '#273d3f'},
            {type: 'rect', x: this.cm(17.6), y: this.cm(0), w: this.cm(1.6), h: this.cm(0.55), color: '#a5916d'}
          ]
        });
      }
    } else {
      if (isInput) {
        stack.push({
          relativePosition: {x: this.cm(0), y: this.cm(0)},
          'canvas': [
            {type: 'rect', x: this.cm(0.0), y: this.cm(0), w: this.cm(2.2), h: this.cm(0.55), color: '#d69a2e'},
            {type: 'rect', x: this.cm(2.2), y: this.cm(0), w: this.cm(2.3), h: this.cm(0.55), color: '#2e4736'},
            {type: 'rect', x: this.cm(4.5), y: this.cm(0), w: this.cm(2.3), h: this.cm(0.55), color: '#662c40'},
            {type: 'rect', x: this.cm(6.8), y: this.cm(0), w: this.cm(2.25), h: this.cm(0.55), color: '#343a49'},
            {type: 'rect', x: this.cm(9.05), y: this.cm(0), w: this.cm(2.3), h: this.cm(0.55), color: '#528c8e'},
            {type: 'rect', x: this.cm(11.35), y: this.cm(0), w: this.cm(2.25), h: this.cm(0.55), color: '#362946'},
            {type: 'rect', x: this.cm(13.6), y: this.cm(0), w: this.cm(2.3), h: this.cm(0.55), color: '#6b8133'},
            {type: 'rect', x: this.cm(15.9), y: this.cm(0), w: this.cm(2.25), h: this.cm(0.55), color: '#2a3b56'},
            {type: 'rect', x: this.cm(18.15), y: this.cm(0), w: this.cm(2.3), h: this.cm(0.55), color: '#862d2e'},
            {type: 'rect', x: this.cm(20.45), y: this.cm(0), w: this.cm(2.3), h: this.cm(0.55), color: '#607f6e'},
            {type: 'rect', x: this.cm(22.75), y: this.cm(0), w: this.cm(2.3), h: this.cm(0.55), color: '#273d3f'},
            {type: 'rect', x: this.cm(25.05), y: this.cm(0), w: this.cm(2.3), h: this.cm(0.55), color: '#a5916d'},
          ],
        });
      }
    }
    stack.push({
      relativePosition: {x: this.cm(this.xframe), y: this.cm(1.0)},
      columns: [
        {width: 'auto', text: `${this.title}`, fontSize: this.fs(36), color: this.colText, bold: true},
        {
          width: 'auto',
          text: this.subtitle,
          fontSize: this.fs(12),
          color: this.colSubTitle,
          bold: true,
          margin: [this.cm(0.5), this.cm(0.78), 0, 0]
        }
      ]
    });
    if (!GLOBALS.ppHideNightscoutInPDF) {
      stack.push({
        relativePosition: {x: this.cm(this.xframe), y: this.cm(2.5)},
        text: `nightscout reporter ${GLOBALS.displayVersion}`,
        fontSize: this.fs(8),
        color: this.colSubTitle,
      });
    }
    const y = this.titleInfoSub === '' ? 2.4 : 2.0;

    if (GLOBALS.currPeriodShift.months != 0) {
      stack.push({
        relativePosition: {x: this.cm(this.xframe), y: this.cm(y - 0.5)},
        columns: [
          {
            width: this.cm(this.width - 4.4),
            text: this.msgHistorical(GLOBALS.currPeriodShift.title),
            fontSize: this.fs(10),
            color: this.colInfo,
            bold: true,
            alignment: 'right'
          }
        ]
      });
    }
    if (!Utils.isEmpty(this.titleInfo)) {
      stack.push({
        relativePosition: {x: this.cm(this.xframe), y: this.cm(y)},
        columns: [
          {
            width: this.cm(this.width - 4.4),
            text: this.titleInfo,
            fontSize: this.fs(10),
            color: this.colInfo,
            bold: true,
            alignment: 'right'
          }
        ]
      });
    }
    if (!Utils.isEmpty(this.titleInfoSub)) {
      stack.push({
        relativePosition: {x: this.cm(this.xframe), y: this.cm(2.4)},
        columns: [
          {
            width: this.cm(this.width - 4.4),
            text: this.titleInfoSub,
            fontSize: this.fs(8),
            color: this.colInfo,
            bold: true,
            alignment: 'right'
          }
        ]
      });
    }
    let listWarn: string[ ] = [...this.pdfWarnings];
    // listWarn.push('Das ist eine Warnung für alle, die keine Ahnung haben und für alle, die denken, eine Warnung wäre nicht nötig, aber ÜBERRASCHUNG!!!!! Sie ist nötig!!!!');
    if (GlobalsData.user.adjustGluc) {
      listWarn.push(this.msgAdjustGlucHint);
    }
    const msgWarn = Utils.join(listWarn, '\n');
    if (msgWarn != null) {
      const xPos = (this.width - this.xframe) / 2;
      stack.push({
        relativePosition: {x: this.cm(xPos), 'y': this.cm(1.0)},
        columns: [
          {
            width: this.cm(this.width - this.xframe - xPos),
            text: msgWarn,
            fontSize: this.fs(8),
            color: this.colWarning,
            bold: true,
            alignment: 'right'
          }
        ]
      });
    }
    stack.push({
      relativePosition: {x: this.cm(this.xframe), y: this.cm(2.95)},
      canvas: [
        {
          type: 'line',
          x1: this.cm(0),
          y1: this.cm(0),
          x2: this.cm(this.width - 4.4),
          y2: this.cm(0),
          lineWidth: this.cm(0.2),
          lineColor: this.colText
        }
      ]
    });
    // footer
    if (params.skipFooter) {
      return ret;
    }
    let rightText = '';
    if (Utils.isEmpty(this.repData.user.name)) {
      if (!Utils.isEmpty(this.repData.user.birthDate)) {
        rightText = `*${this.repData.user.birthDate}`;
      }
    } else {
      if (!Utils.isEmpty(this.repData.user.birthDate)) {
        rightText = `${this.repData.user.name}, *${this.repData.user.birthDate}`;
      } else {
        rightText = this.repData.user.name;
      }
    }

    stack.push([
      {
        relativePosition: {x: this.cm(this.xframe), y: this.cm(this.height - 2.0)},
        canvas: [
          {
            type: 'line',
            x1: this.cm(0),
            y1: this.cm(0),
            x2: this.cm(this.width - 4.4),
            y2: this.cm(0),
            lineWidth: this.cm(0.05),
            lineColor: this.colText
          }
        ]
      },
      this.footerTextAboveLine.text === ''
        ? null
        : {
          relativePosition: {
            x: this.cm(this.xframe + this.footerTextAboveLine.x),
            y: this.cm(this.height - 2.0 - this.footerTextAboveLine.y)
          },
          columns: [
            {
              width: this.cm(this.width - 2 * this.xframe),
              text: this.footerTextAboveLine.text,
              fontSize: this.fs(this.footerTextAboveLine.fs)
            }
          ]
        },
      GLOBALS.ppHideNightscoutInPDF ? null : this._getFooterImage('nightscout', {x: this.xframe, y: this.height - 1.7, width: 0.7}),
      GLOBALS.ppHideNightscoutInPDF
        ? null
        : {
          relativePosition: {x: this.cm(3.1), y: this.cm(this.height - 1.7)},
          text: 'http://www.nightscout.info',
          color: this.colInfo,
          fontSize: this.fs(10)
        },
      this.footerText == null
        ? null
        : {
          relativePosition: {x: this.cm(GLOBALS.ppHideNightscoutInPDF ? this.xframe : 7.5), y: this.cm(this.height - 1.7)},
          stack: this.footerText,
          fontSize: this.fs(10)
        },
      isInput ? this._getFooterImage('input', {x: this.width - 5.6, y: this.height - 3.3, width: 4.0}) : {},
      {
        relativePosition: {x: this.cm(this.xframe), y: this.cm(this.height - 1.7)},
        columns: [
          {
            width: this.cm(this.width - 2 * this.xframe),
            stack: [
              {text: rightText, color: this.colInfo, fontSize: this.fs(10)},
              !GLOBALS.ppShowUrlInPDF ? null : {text: GlobalsData.user.urlDataFor(params.date).url, color: this.colInfo, fontSize: this.fs(8)}
            ],
            alignment: 'right'
          }
        ]
      }
    ]);
    return ret;
  }

  addTableRow(check: boolean, width: any, dst: any, head: any, content: any): void {
    if (!check) {
      return;
    }
    if (!this.tableHeadFilled) {
      this.tableHeadLine.push(head);
      this.tableWidths.push(width);
    }
    dst.push(content);
  }

  getTable(widths: any, body: any): any {
    return {
      columns: [
        {
          margin: [this.cm(2.2), this.cmy(this.yorg), this.cm(2.2), this.cmy(0.0)],
          width: this.cm(this.width),
          fontSize: this.fs(10),
          table: {widths: widths, body: body},
        }
      ],
      pageBreak: ''
    };
  }

  init(suffix: string): void {
    this.suffix = suffix ?? '-';
    this.isPortraitParam = this.isPortrait;
  }

  titleInfoBegEnd(): string {
    return this.titleInfoDateRange(this.repData.begDate, this.repData.endDate);
  }

  titleInfoDateRange(begDate: Date, endDate: Date): string {
    this.titleInfoSub = GLOBALS.period.dowActiveText;
    if (Utils.isSameDay(begDate, endDate)) {
      return this.fmtDate(begDate);
    }
    return `${this.fmtDate(begDate)} ${this.msgUntil} ${this.fmtDate(endDate)}`;
  }

  titleInfoTimeRange(begDate: Date, endDate: Date): string {
    const beg = `${this.fmtDate(begDate)}, ${this.fmtTime(begDate, {withUnit: true})}`;
    const end = `${this.fmtDate(endDate)}, ${this.fmtTime(endDate, {withUnit: true})}`;
    if (endDate == null) {
      return this.msgValidFrom(beg);
    }
    return this.msgValidRange(beg, end);
  }

  extractParams(): void {
  };

  _getFooterImage(id: string, params: { x: number, y: number, width: number, height?: number }) {
    if (params.height == null) {
      params.height = 0.0;
    }
    let ret: any = {
      relativePosition: {x: this.cm(params.x), y: this.cm(params.y)},
      image: id
    };

    if (this.imgList.indexOf(id) >= 0) {
      if (params.width != 0 && params.height != 0) {
        ret.fit = [this.cm(params.width), this.cm(params.height)];
      } else if (params.width != 0) {
        ret.width = this.cm(params.width);
      } else if (params.height != 0) {
        ret.height = this.cm(params.height);
      }
    } else {
      ret = {
        stack: [
          {
            relativePosition: {x: this.cm(params.x), y: this.cm(params.y)},
            canvas: [
              {
                type: 'rect',
                x: this.cm(0),
                y: this.cm(0),
                w: this.cm(Math.max(params.width, 0.01)),
                h: this.cm(Math.max(params.height, 0.01)),
                lineWidth: this.cm(0.01),
                lineColor: '#f00'
              }
            ]
          },
          {
            relativePosition: {x: this.cm(params.x), y: this.cm(params.y)},
            text: `bild\n${id}\nfehlt`,
            color: '#f00'
          }
        ]
      };
    }
    return ret;
  }

  hasData(src: ReportData): boolean {
    return (src.dayCount > 0 && (src.data.countValid > 0 || src.data.treatments?.length > 0)) || this.needed.needsStatus;
  }

  getEmptyForm(isPortrait: boolean, status: string, params?: { skipFooter?: boolean }): PageData {
    return new PageData(isPortrait, [
      this.headerFooter({skipFooter: params?.skipFooter ?? false}),
      {
        margin: [this.cm(2), this.cm(3.5), this.cm(2), this.cm(0)],
        text: status === '401' ? this.msgServerNotReachable : this.msgMissingData,
        color: 'red',
        fontSize: this.fs(10),
        alignment: 'justify'
      },
    ]);
  }

  countObjects(src: any): number {
    let ret = 1;
    if (Array.isArray(src)) {
      for (const entry of src) {
        ret += this.countObjects(entry);
      }
    }
    if (Object.keys(src).length > 0) {
      for (const key of Object.keys(src)) {
        ret += this.countObjects(src[key]);
      }
    }
    return ret;
  }

  _addPageBreak(page: PageData): void {
    if (page.content[page.content.length - 1].pageBreak === '-') {
      return;
    }
    page.content[page.content.length - 1].pageBreak = 'after';
    // int cnt = countObjects(page);
    // print(page.content);
    const text = JSON.stringify(page.content);
    this._fileSize += text.length;
  }

  abstract fillPages(pages: PageData[]): void;

  fmtGluc(value: number): string {
    return GLOBALS.fmtNumber(value, GLOBALS.glucMGDL ? 0 : 1);
  }

  styleForTime(time: Date): string {
    if (time.getHours() < 6 || time.getHours() > 20) {
      return 'timeNight';
    }
    if (time.getHours() < 8 || time.getHours() > 17) {
      return 'timeLate';
    }
    return 'timeDay';
  }

  colForGluc(day: DayData, gluc: number): string {
    if (gluc == null) {
      return '';
    }
    if (gluc < this.targets(this.repData).low) {
      return this.colLow;
    } else if (gluc > this.targets(this.repData).high) {
      return this.colHigh;
    }
    return this.colNorm;
  }

  colForGlucBack(day: DayData, gluc: number): string {
    if (gluc == null) {
      return '';
    }
    if (gluc < this.targets(this.repData).low) {
      return this.colLowBack;
    } else if (gluc > this.targets(this.repData).high) {
      return this.colHighBack;
    }
    return this.colNormBack;
  }

  /// draws a graphic grid
  ///
  /// it uses [horzfs] as the fontsize of the horizontal scale and [vertfs] as the fontsize for the vertical

  carbFromData(carb: any, precision = 0): string {
    return GLOBALS.fmtNumber(carb, precision);
  }

  /// scale.
  drawGraphicGrid(glucMax: number, graphHeight: number, graphWidth: number, vertCvs: any[], horzCvs: any[],
                  horzStack: any[], vertStack: any[], params?:
                  { glucScale?: number, graphBottom?: number, horzfs?: number, vertfs?: number }): GridData {
    params ??= {};
    params.glucScale ??= 0.0;
    params.graphBottom ??= 0.0;
    params.horzfs ??= this.fs(8);
    params.vertfs ??= this.fs(8);
    const ret = new GridData();
    if (params.graphBottom === 0.0) {
      params.graphBottom = graphHeight;
    }
    ret.glucScale = params.glucScale === 0.0
      ? GLOBALS.glucMGDL
        ? 50
        : 18.02
      : params.glucScale;
    ret.gridLines = Math.ceil(glucMax / ret.glucScale);

    ret.lineHeight = ret.gridLines === 0 ? 0 : graphHeight / ret.gridLines;
    ret.colWidth = graphWidth / 24;

    // draw vertical lines with times below graphic
    for (let i = 0; i < 25; i++) {
      vertCvs.push({
        type: 'line',
        x1: this.cm(i * ret.colWidth),
        y1: this.cm(0),
        x2: this.cm(i * ret.colWidth),
        y2: this.cm(params.graphBottom - this.lw / 2),
        lineWidth: this.cm(this.lw),
        lineColor: i > 0 && i < 24 ? this.lc : this.lcFrame
      });
      if (i < 24) {
        horzStack.push({
          relativePosition: {x: this.cm(this.xorg + i * ret.colWidth), y: this.cm(this.yorg + params.graphBottom + 0.05)},
          text: this.fmtTime(i),
          fontSize: params.horzfs
        });
      }
    }

    if (ret.lineHeight === 0) {
      return ret;
    }

    let lastY = null;
    for (let i = 0; i <= ret.gridLines; i++) {
      let y = (ret.gridLines - i) * ret.lineHeight - this.lw / 2;
      if (lastY != null && lastY - y < 0.5) {
        continue;
      }

      lastY = y;
      horzCvs.push({
        type: 'line',
        x1: this.cm(i > 0 ? -0.2 : 0.0),
        y1: this.cm(y),
        x2: this.cm(24 * ret.colWidth + (i > 0 ? 0.2 : 0.0)),
        y2: this.cm(y),
        lineWidth: this.cm(this.lw),
        lineColor: i > 0 ? this.lc : this.lcFrame
      });

      if (i > 0) {
        //        String text = '${glucFromData(GLOBALS.fmtNumber(i * glucScale, 0))}\n${getGlucInfo()['unit']}';
        const text = `${GLOBALS.glucFromData(GLOBALS.fmtNumber(i * ret.glucScale, 0))}`;
        vertStack.push({
          relativePosition: {'x': this.cm(this.xorg - 1.5), y: this.cm(this.yorg + (ret.gridLines - i) * ret.lineHeight - 0.2)},
          columns: [
            {width: this.cm(1.2), text: text, fontSize: this.fs(8), alignment: 'right'}
          ]
        });
        vertStack.push({
          relativePosition: {
            x: this.cm(this.xorg + 24 * ret.colWidth + 0.3),
            y: this.cm(this.yorg + (ret.gridLines - i) * ret.lineHeight - 0.2)
          },
          text: text,
          fontSize: params.vertfs
        });
      } else {
        const text = `${GLOBALS.getGlucInfo().unit}`;
        vertStack.push({
          relativePosition: {x: this.cm(this.xorg - 1.5), y: this.cm(this.yorg + (ret.gridLines - i) * ret.lineHeight - 0.2)},
          columns: [
            {width: this.cm(1.2), text: text, fontSize: params.vertfs, alignment: 'right'}
          ]
        });
        vertStack.push({
          relativePosition: {
            x: this.cm(this.xorg + 24 * ret.colWidth + 0.3),
            y: this.cm(this.yorg + (ret.gridLines - i) * ret.lineHeight - 0.2)
          },
          text: text,
          fontSize: params.vertfs
        });
      }
    }
    return ret;
  }

  calcX(width: number, time: Date): number {
    return width / 1440 * (time.getHours() * 60 + time.getMinutes());
  }

  calcY(height: number, max: number, value: number): number {
    return height / max * (max - value);
  }

  S(min: number, step: number): StepData {
    return new StepData(min, step);
  }

  addLegendEntry(legend: LegendData, color: string, text: string, params?: {
    isArea?: boolean,
    image?: string,
    imgWidth?: number,
    imgOffsetY?: number,
    lineWidth?: number,
    graphText?: string,
    newColumn?: boolean,
    points?: { x: number, y: number }[],
    colGraphText?: string,
    colLegendText?: string
  }) {
    params ??= {};
    params.isArea ??= true;
    params.imgWidth ??= 0.6;
    params.imgOffsetY ??= 0.0;
    params.lineWidth ??= 0.0;
    params.newColumn ??= false;
    params.colGraphText ??= 'black';
    params.colLegendText ??= 'black';
    const dst = legend.current(params.newColumn);
    if (params.lineWidth === 0.0) {
      params.lineWidth = this.lw;
    }
    if (params.points != null) {
      for (const pt of params.points) {
        pt.x = this.cm(pt.x * 0.8);
        pt.y = this.cm(pt.y * 0.8);
      }
      dst.push({
        columns: [
          {
            width: this.cm(0.8),
            canvas: [
              {
                type: 'polyline',
                closePath: true,
                color: color,
                lineWidth: this.cm(0),
                points: params.points,
              }
            ],
          },
          {text: text, color: params.colLegendText, fontSize: this.fs(10)}
        ]
      });
    } else if (params.image != null) {
      dst.push({
        columns: [
          {
            width: this.cm(0.8),
            stack: [
              {
                margin: [this.cm(0.4 - params.imgWidth / 2), this.cm(params.imgOffsetY), this.cm(0), this.cm(0)],
                image: params.image,
                width: this.cm(params.imgWidth)
              }
            ],
          },
          {text: text, color: params.colLegendText, fontSize: this.fs(10)}
        ]
      });
    } else if (params.isArea && params.graphText != null) {
      dst.push({
        columns: [
          {
            width: this.cm(0.8),
            layout: 'noBorders',
            margin: [this.cm(0.0), this.cm(0), this.cm(0), this.cm(0.1)],
            table: {
              widths: [this.cm(0.6)],
              body: [
                [
                  {
                    text: params.graphText,
                    color: params.colGraphText,
                    fontSize: this.fs(6),
                    alignment: 'center',
                    fillColor: color
                  }
                ]
              ]
            }
          },
          {text: text, color: params.colLegendText, fontSize: this.fs(10)}
        ]
      });
    } else if (params.isArea) {
      dst.push({
        columns: [
          {
            width: this.cm(0.8),
            canvas: [
              {
                type: 'rect',
                x: this.cm(0),
                y: this.cm(0.1),
                w: this.cm(0.5),
                h: this.cm(0.3),
                color: color,
                fillOpacity: 0.3
              },
              {type: 'rect', x: 0, y: 0, w: 0, h: 0, color: params.colGraphText, fillOpacity: 1},
              {
                type: 'line',
                x1: this.cm(0),
                y1: this.cm(0.1),
                x2: this.cm(0.5),
                y2: this.cm(0.1),
                lineWidth: this.cm(params.lineWidth),
                lineColor: color
              },
              {
                type: 'line',
                x1: this.cm(0),
                y1: this.cm(0.4),
                x2: this.cm(0.5),
                y2: this.cm(0.4),
                lineWidth: this.cm(params.lineWidth),
                lineColor: color
              }
            ]
          },
          {text: text, color: params.colLegendText, fontSize: this.fs(10)}
        ]
      });
    } else {
      dst.push({
        columns: [
          {
            width: this.cm(0.8),
            canvas: [
              {
                type: 'line',
                x1: this.cm(0),
                y1: this.cm(0.25),
                x2: this.cm(0.5),
                y2: this.cm(0.25),
                lineWidth: this.cm(params.lineWidth),
                lineColor: color
              }
            ]
          },
          {text: text, color: params.colLegendText, fontSize: this.fs(10)}
        ]
      });
    }
  }

  getFormPages(repData: ReportData, currentSize: number): Observable<PageData[]> {
    this.repData = repData;
    if (!this.hasData(repData)) {
      return this.ps.collectBase64Images(this.imgList).pipe(map(list => {
        for (const entry of list) {
          this.images[entry.id] = entry.url;
        }
        return [this.getEmptyForm(this.isPortrait, repData.status?.status)];
      }));
    }

    let ret: PageData[] = [];
    for (const param of this.params) {
      param.isForThumbs = repData.isForThumbs;
    }
    this.extractParams();
    for (const param of this.params) {
      param.isForThumbs = false;
    }
    this._pages = [];
    this._fileSize = currentSize;
    try {
      this.scale = 1.0;
      let colCount = 1;
      let rowCount = 1;
      switch (this.pagesPerSheet) {
        case 2:
          this.scale = 21 / 29.7;
          colCount = 1;
          rowCount = 2;
          break;
        case 4:
          this.scale = 0.5;
          colCount = 2;
          rowCount = 2;
          break;
        case 8:
          this.scale = 21 / 29.7 / 2;
          colCount = 2;
          rowCount = 4;
          break;
        case 16:
          this.scale = 0.25;
          colCount = 4;
          rowCount = 4;
          break;
        case 32:
          this.scale = 21 / 29.7 / 4;
          colCount = 4;
          rowCount = 8;
          break;
      }
      this.offsetX = 0.0;
      this.offsetY = 0.0;
      this.collectedImages = [];
      this.fillPages(this._pages);
      let column = 0;
      let row = 0;
      for (let i = 0; i < this._pages.length; i++) {
        const page = this._pages[i];
        switch (this.pagesPerSheet) {
          case 2:
          case 8:
          case 32:
            page.isPortrait = !page.isPortrait;
            break;
        }
        this.offsetX = column * this.width;
        this.offsetY = row * this.height;
        page.offset(this.cmx(0), this.cmy(0));
        if (column === 0 && row === 0) {
          ret.push(page);
        } else {
          ret[ret.length - 1].content.push(page.asElement);
        }
        column++;

        if (column >= colCount) {
          column = 0;
          row++;
          if (row >= rowCount && i < this._pages.length - 1) {
            row = 0;
            this._addPageBreak(page);
          }
        }
        //        ret.pushAll(page);
        //        if(page != _pages.last)
        //          addPageBreak(ret.last);
      }
    } catch (ex) {
      this.offsetX = 0.0;
      this.offsetY = 0.0;
      // ret = {
      //   'pageSize': 'a4',
      //   'pageOrientation': 'portrait',
      //   'pageMargins': [cmx(1), cmy(1), cmx(1), cmy(1)],
      //   'content': [
      //     {'text': 'Fehler bei Erstellung von \'${title}\'', 'fontSize': fs(20), 'alignment': 'center', 'color': 'red'},
      //     {'text': '\n$ex', 'fontSize': fs(10), 'alignment': 'left'},
      //     {'text': '\n$s', 'fontSize': fs(10), 'alignment': 'left'}
      //   ]
      // };
      ret = [
        new PageData(this.isPortrait, [
          {
            margin: [this.cmx(1.0), this.cmy(0.5), this.cmx(1.0), this.cmy(0)],
            text: `Fehler bei Erstellung von "${this.title}"`,
            fontSize: this.fs(20),
            alignment: 'center',
            color: 'red'
          },
          {
            margin: [this.cmx(1.0), this.cmy(0.0), this.cmx(1.0), this.cmy(0)],
            text: `\n${ex}`,
            fontSize: this.fs(10),
            alignment: 'left'
          },
          {
            margin: [this.cmx(1.0), this.cmy(0.5), this.cmx(1.0), this.cmy(0)],
            text: `\n${(ex as any)?.stack}`,
            fontSize: this.fs(10),
            alignment: 'left'
          }
        ])
      ];
    }
    return this.ps.collectBase64Images([...this.imgList, ...this.collectedImages]).pipe(map(list => {
      for (const entry of list) {
        this.images[entry.id] = entry.url;
      }
      this.verifyPages(ret);
      return ret;
    }));
  }

  verifyPages(pages: PageData[]) {
    for (const page of pages) {
      page.content = this.verifyPageContent(page.content);
    }
  }

  verifyPageContent(content: any[]): any[] {
    const ret: any[] = [];
    for (const entry of content) {
      if (entry == null) {
      } else if (Array.isArray(entry)) {
        ret.push(this.verifyPageContent(entry));
      } else {
        ret.push(this.verifyImages(entry));
      }
    }
    return ret;
  }

  verifyImages(data: any): any {
    if (typeof data !== 'object') {
      return data;
    }
    const ret: any = {};
    for (const key of Object.keys(data)) {
      if (data[key] == null) {
        ret[key] = '';
      } else if (Array.isArray(data[key])) {
        ret[key] = this.verifyPageContent(data[key]);
      } else if (key === 'image' && Utils.isEmpty(this.images[data[key]])) {
        delete this.images[data[key]];
        return this.emojiReplacements[data[key]];
        // return {image: 'nightscout', width: data.width, margins: data.margins};
        // return {text: 'W', width: 'auto'};
      } else {
        ret[key] = this.verifyImages(data[key]);
      }
    }
    return ret;
  }

  drawScaleIE(xo: number, yo: number, graphHeight: number, top: number, min: number, max: number, colWidth: number,
              horzCvs: any[], vertStack: any[], steps: StepData[], display: (i: number, step: number, value?: number) => string) {
    let step = 0.1;
    for (const entry of steps) {
      if (max - min > entry.min) {
        step = entry.step;
        break;
      }
    }
    const gridLines = Math.floor(((max - min) / step) + 1);
    const lineHeight = gridLines === 0 ? 0 : graphHeight / gridLines;

//    top += 0.1 * (lineHeight / step);
    for (let i = 1; i < gridLines; i++) {
      const y = top + (gridLines - i) * lineHeight;
      horzCvs.push({
        type: 'line',
        x1: this.cm(-0.2),
        y1: this.cm(y) - this.lw / 2,
        x2: this.cm(24 * colWidth + 0.2),
        y2: this.cm(y) - this.lw / 2,
        lineWidth: this.cm(this.lw),
        lineColor: i > 0 ? this.lc : this.lcFrame
      });
//      double value = min + (max - min) / step * i;
//      vertCvs.push({'relativePosition': {'x': this.cm(xo - 0.7), 'y': this.cm(yo + (gridLines - i) * lineHeight - 0.15)},
//      'text': GLOBALS.fmtNumber(i / 10, 1), 'fontSize': fs(8)});
      const text = display(i, step);
//      String text = '${GLOBALS.fmtNumber(i * step, 1)} ${msgInsulinUnit}';
      vertStack.push({
        relativePosition: {x: this.cm(xo - 3.0), y: this.cm(y + yo - 0.15)},
        columns: [
          {width: this.cm(2.7), text: text, fontSize: this.fs(8), alignment: 'right'}
        ]
      });
      vertStack.push({
        relativePosition: {x: this.cm(xo + colWidth * 24 + 0.3), y: this.cm(y + yo - 0.15)},
        text: text,
        fontSize: this.fs(8)
      });
    }
    return (gridLines - 1) * lineHeight;
  }

  getIobCob(xo: number, yo: number, graphWidth: number, graphHeight: number, horzCvs: any[], vertStack: any[],
            day: DayData, upperIob = 0, upperCob = 0): any {
    const colWidth = graphWidth / 24;
    // graphic for iob and cob
    const ptsIob = [
      {x: this.cm(this.calcX(graphWidth, new Date(0, 0, 1, 0, 0))), y: this.cm(0)}
    ];
    const ptsCob = [
      {x: this.cm(this.calcX(graphWidth, new Date(0, 0, 1, 0, 0))), y: this.cm(0)}
    ];
    let time = new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate());
    let diff = 5;
    let maxIob = -1000.0;
    let minIob = 0.0;
    let maxCob = -1000.0;
    let lastX = 0.0;
    let i = 0;
    let currentDay = day.date.getDate();
    let maxTime = 1440;
    if (Utils.isSameDay(day.date, GlobalsData.now)) {
      maxTime = GlobalsData.now.getHours() * 60 + GlobalsData.now.getMinutes();
    }
    while (i < maxTime) {
      if (currentDay !== time.getDate()) {
        i += diff;
        continue;
      }
      if (i + diff >= maxTime && i !== maxTime - 1) {
        diff = maxTime - 1 - i;
      }
      if (i < maxTime) {
        let x = this.calcX(graphWidth, time);
        let y = day.iob(this.repData, time, day.prevDay).iob;
        maxIob = Math.max(maxIob, y);
        minIob = Math.min(minIob, y);
        ptsIob.push({x: this.cm(x), y: y});
        y = day.cob(this.repData, time, day.prevDay).cob;
        maxCob = Math.max(maxCob, y);
        ptsCob.push({x: this.cm(x), y: y});
        lastX = x;
        time = Utils.addTimeMinutes(time, diff);
      }
      i += diff;
    }
    if (upperIob === 0) {
      minIob = minIob * 1.1;
      maxIob = maxIob * 1.1;
    } else {
      maxIob = upperIob;
    }
    const iobHeight = this.drawScaleIE(
      xo,
      yo,
      graphHeight,
      3 * graphHeight,
      minIob,
      maxIob,
      colWidth,
      horzCvs,
      vertStack,
      [this.S(10, 2.0), this.S(7, 1.0), this.S(3, 0.5), this.S(1.5, 0.2), this.S(0, 0.1)],
      (i, step, value): string => {
        return `${GLOBALS.fmtNumber(value ?? minIob + i * step, 1)} ${this.msgInsulinUnit}`
      });
    for (let i = 0; i < ptsIob.length; i++) {
      if (maxIob - minIob > 0) {
        const y = ptsIob[i].y;
        if (upperIob > 0) {
          ptsIob[i].y = this.cm(iobHeight / maxIob * (y + minIob));
        } else {
          ptsIob[i].y = this.cm(iobHeight / (maxIob - minIob) * (maxIob - y));
        }
      } else {
        ptsIob[i].y = this.cm(iobHeight);
      }
    }

    const cobHeight = this.drawScaleIE(
      xo,
      yo,
      graphHeight,
      4 * graphHeight,
      0.0,
      maxCob,
      colWidth,
      horzCvs,
      vertStack,
      [this.S(100, 20), this.S(50, 10), this.S(20, 5), this.S(0, 1)],
      (i, step, value) => `${GLOBALS.fmtNumber(value ?? i * step, 0)} g`);

    if (upperCob === 0) {
      maxCob = maxCob * 1.1;
    } else {
      maxCob = upperCob;
    }
    for (let i = 0; i < ptsCob.length; i++) {
      if (maxCob > 0) {
        ptsCob[i].y = this.cm(cobHeight / maxCob * (maxCob - ptsCob[i]['y']));
      } else {
        ptsCob[i].y = this.cm(cobHeight);
      }
    }

    if (lastX != null) {
      const y = 0.0;
      if (upperIob > 0) {
        ptsIob.push({x: this.cm(lastX), y: this.cm(iobHeight / maxIob * (y + minIob))});
      } else if (maxIob - minIob > 0) {
        ptsIob.push({x: this.cm(lastX), y: this.cm(iobHeight / (maxIob - minIob) * (maxIob - y))});
      } else {
        ptsIob.push({x: this.cm(lastX), y: this.cm(iobHeight)});
      }
      ptsCob.push({x: this.cm(lastX), y: this.cm(cobHeight)});
    }

    return {
      iob: ptsIob,
      cob: ptsCob,
      iobHeight: iobHeight,
      cobHeight: cobHeight,
      iobTop: iobHeight / maxIob * minIob,
      maxCob: maxCob
    };
  }

  // String get helpHtml {
  //   if (help == null) return null;
  //
  //   let ret = help.replaceAll('\n', 'µ');
  //   ret = ret.replaceAll('µµ', '<br><br>');
  //   ret = ret.replaceAll('µ', ' ');
  //   let list = RegExp('@([^@]*)@').allMatches(ret);
  //   let links = <String>[];
  //   for (const match of list) {
  //     const part = match.group(1);
  //     const cfg =
  //         GLOBALS.listConfig.firstWhere((cfg) => cfg.idx === part, orElse: () => null);
  //     if (cfg != null) {
  //       links.push(
  //           '</span><material-button (trigger)="GLOBALS.show(\'Oleole\')">${cfg.form.title}</material-button><span>');
  //     }
  //   }
  //   ret += links.toString();
  //   return ret;
  // }

  getTimeConsumingParts(data: ReportData, ret: string[]): void {
  }

  /**
   * takes an array of pdfmake-objects and updates the attributes so
   * that it can be used in a pdfmake-document within a columns-attribute.
   * @param list list of objects, mixed text and image
   */
  mixTextImage(list: any[]): any[] {
    const ret: any[] = [];
    for (let i = 0; i < list.length; i++) {
      if (typeof list[i] === 'string') {
        list[i] = {text: list[i]};
      }
      if (list[i].image != null) {
        if (typeof list[i + 1] === 'string') {
          list[i + 1] = {text: list[i + 1]};
        }
        if (i < list.length - 1 && list[i + 1].text != null) {
          list[i + 1].text = ` ${list[i + 1].text}`;
          list[i + 1].preserveLeadingSpaces = true;
        }
        if (i > 0 && list[i - 1].text != null) {
          list[i - 1].text = `${list[i - 1].text} `;
          list[i - 1].preserveTrailingSpaces = true;
        }
      } else if (list[i].width == null) {
        list[i].width = 'auto';
      }
      ret.push(list[i]);
    }
    return ret;
  }

  /**
   * Processes a string to replace emoji characters with placeholders or image objects,
   * based on the provided settings, and returns an array of text and emoji objects.
   *
   * @param {string} s - The input string containing text and emojis.
   * @param {number} width - The width parameter applied to the emoji image objects, when applicable.
   * @param {boolean} [useImages=true] - Determines whether to use emoji image objects or text-based replacements.
   * @return {any[]} An array containing processed text parts and emoji objects or image objects.
   */
  getTextWithEmojiObjects(s: string, width: number, useImages = true): any[] {
    let hasUnicodeProp = true;
    let regEx: RegExp = null;
// Extended_Pictographic
    try {
      regEx = new RegExp('\\p{Emoji_Presentation}', 'ug');
      regEx.test('');  // force compiling
    } catch (e) {
      hasUnicodeProp = false;
    }

    let emojis: string[] = [];
    let text: string[];

    const sep = '[[EMOJI_PLACEHOLDER]]';
    if (hasUnicodeProp && regEx != null) {
      const stringWithPlaceholders = s.replaceAll(
        regEx,
        (emoji: string) => {
          emojis.push(emoji);
          return sep;
        }
      );
      text = stringWithPlaceholders.split(sep);
    } else {
      regEx = emojiRegex();

      let lastIdx = 0;
      const parts: string[] = [];
      emojis = [];

      for (const match of s.matchAll(regEx)) {
        const emoji = match[0];
        const idx = match.index!;
        parts.push(s.substring(lastIdx, idx));
        parts.push(sep);
        emojis.push(emoji);
        lastIdx = idx + emoji.length;
      }
      parts.push(s.substring(lastIdx));
      text = parts.filter((_, i) => i % 2 === 0);
    }
    const ret: any[] = [];
    for (let i = 0; i < text.length; i++) {
      const textPart = text[i];
      if (textPart !== '') {
        ret.push(textPart);
      }
      if (i < emojis.length) {
        const cp = emojis[i].codePointAt(0).toString(16).toLowerCase();
        this.emojiReplacements[`emoji${cp}`] = {
          font: 'NotoEmoji',
          text: emojis[i],
          color: 'maroon',
          width: 'auto'
        };
        if (useImages) {
          const pngUrl = `@emoji${cp}@https://raw.githubusercontent.com/googlefonts/noto-emoji/refs/tags/v2.034/png/32/emoji_u${cp}.png`;
          ret.push({
            image: `emoji${cp}`,
            width: this.cm(width),
            margin: [0, this.cm(width / 3), 0, 0]
          });
          if (!this.collectedImages.includes(pngUrl)) {
            this.collectedImages.push(pngUrl);
          }
        } else {
          ret.push(this.emojiReplacements[`emoji${cp}`]);
        }
      }
    }
    return ret;
  }

  private hba1cDisplay(avgGluc: number): string {
    if (GLOBALS.ppShowHbA1Cmmol) {
      return GLOBALS.fmtNumber((this.hba1cValue(avgGluc) - 2.15) * 10.929, 2);
    }
    return GLOBALS.fmtNumber(this.hba1cValue(avgGluc), 1);
  }
}
