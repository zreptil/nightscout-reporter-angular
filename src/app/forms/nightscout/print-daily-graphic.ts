import {BasePrint} from '@/forms/base-print';
import {ParamInfo} from '@/_model/param-info';
import {PdfService} from '@/_services/pdf.service';
import {BaseDaily} from './base-daily';
import {PrintCGP} from './print-cgp';
import {Utils} from '@/classes/utils';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {DayData} from '@/_model/nightscout/day-data';
import {PageData} from '@/_model/page-data';
import {TreatmentData} from '@/_model/nightscout/treatment-data';
import {ReportData} from '@/_model/report-data';
import {EntryData} from '@/_model/nightscout/entry-data';
import {LegendData} from '@/_model/legend-data';
import {ProfileData} from '@/_model/nightscout/profile-data';
import {ProfileEntryData} from '@/_model/nightscout/profile-entry-data';
import {ProfileTimezone} from '@/_model/nightscout/profile-timezone-data';

class CollectInfo {
  end: Date;
  max1 = -1.0;
  max2 = -1.0;
  count = 0;

  constructor(public start: Date, public sum1 = 0.0, public sum2 = 0.0) {
    this.end = new Date(start.getFullYear(), start.getMonth(), start.getDate(), start.getHours(), start.getMinutes(), start.getSeconds());
    this.count = sum1 > 0.0 ? 1 : 0;
    this.max1 = sum1;
    this.max2 = sum2;
  }

  fill(date: Date, value1: number, value2: number): void {
    this.end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
    this.sum1 += value1;
    this.sum2 += value2;
    this.max1 = Math.max(value1, this.max1);
    this.max2 = Math.max(value2, this.max2);
    this.count++;
  }
}

export class PrintDailyGraphic extends BaseDaily {
  graphWidth: number;
  notesTop = 0.4;
  notesHeight = 0.3;
  basalTop: number;
  basalHeight = 3.0;
  override help = $localize`:help for daygraph@@help-daygraph:Dieses Formular zeigt den Verlauf der Glukosekurve für einen Tag. Pro Tag im ausgewählten
Zeitraum wird eine Seite erzeugt. Es gibt sehr viele Optionen, mit denen dieses Formular angepasst werden kann.
Die Optionen, die auf einen Loop hinweisen sind andersfarbig markiert, um sie schneller identifizieren zu
können. Die Optionen COB und IOB verlangsamen die Ausgabe teilweise erheblich, weshalb man diese nur dann
verwenden sollte, wenn sie wirklich von Interesse sind.

Unter der Grafik kann die Basalrate angezeigt werden. Ein laufender Loop wird diese immer wieder hoch und runter
setzen. Deshalb kann man sowohl die tatsächliche Basalrate als auch die im Profil eingestellte Basalrate
anzeigen lassen. Für die Basalrate gibt es noch die Formulare @09@, @11@ und @02@, auf denen man sie genauer
analysieren kann. Man kann auch das @10@ für den Tag erzeugen lassen. Das wird dann auf einer neuen Seite ausgegeben.

Dieses Formular ist eines der seitenintensivsten Formulare in Nightscout Reporter. Deshalb gibt es hier
die Möglichkeit, mehrere Tagesgrafiken auf einer Seite ausgeben zu lassen. Darunter leidet natürlich die Lesbarkeit,
aber für einen Überblick über den Verlauf ist das ganz nützlich.`;
  override baseId = 'daygraph';
  override baseIdx = '05';
  isFormParam1: boolean;
  override params = [
    new ParamInfo(0, this.msgParam1, {boolValue: true}),
    new ParamInfo(1, this.msgParam2, {boolValue: true}),
    new ParamInfo(4, this.msgParam3, {boolValue: true}),
    new ParamInfo(6, this.msgParam4,
      {
        boolValue: true, isLoopValue: true, subParams: [new ParamInfo(0, this.msgParam20, {
          boolValue: false, isLoopValue: true
        })]
      }),
    new ParamInfo(8, this.msgParam5, {boolValue: true}),
    new ParamInfo(9, this.msgParam6, {boolValue: false, isDeprecated: true}),
    new ParamInfo(12, BasePrint.msgGraphsPerPage, {
      list: [
        $localize`Eine`,
        $localize`Zwei`,
        $localize`Vier`,
        $localize`Acht`,
        $localize`Sechzehn`
      ]
    }),
    new ParamInfo(9, this.msgParam8, {boolValue: true}),
    new ParamInfo(10, this.msgParam9,
      {
        boolValue: true,
        subParams: [new ParamInfo(0, this.msgParam13, {
          boolValue: false
        }), new ParamInfo(1, this.msgParam21, {
          boolValue: false
        })]
      }),
    new ParamInfo(11, '', {boolValue: false, isDeprecated: true}),
    new ParamInfo(13, this.msgParam11, {boolValue: true}),
    new ParamInfo(14, this.msgParam14, {boolValue: true}),
    new ParamInfo(3, BaseDaily.msgDaily1, {
      boolValue: true,
      subParams: [new ParamInfo(0, BaseDaily.msgDaily2, {boolValue: true, isLoopValue: true})],
      isLoopValue: true
    }),
    new ParamInfo(15, this.msgParam16, {boolValue: false}),
    new ParamInfo(16, this.msgParam17, {boolValue: false}),
    new ParamInfo(5, this.msgParam18, {boolValue: false}),
    new ParamInfo(18, PrintDailyGraphic.msgParam19, {boolValue: false, subParams: [new ParamInfo(0, PrintCGP.msgParamAreaLines, {boolValue: true})]}),
    new ParamInfo(19, this.msgParam22, {boolValue: false}),
    new ParamInfo(2, this.msgParam23, {boolValue: true}),
    new ParamInfo(20, this.msgParam24, {boolValue: false}),
    new ParamInfo(21, this.msgParam25, {boolValue: false}),
    new ParamInfo(22, this.msgParam26, {boolValue: true, isLoopValue: true}),
    new ParamInfo(17, BasePrint.msgOverrides, {boolValue: false, isLoopValue: true}),
    new ParamInfo(6, this.msgParam27, {
      list: ['200 g', '300 g', '400 g', '500 g', '600 g']
    })
  ];
  showPictures: boolean;
  showInsulin: boolean;
  showCarbs: boolean;
  showBasalDay: boolean;
  showBasalProfile: boolean;
  showLegend: boolean;
  isPrecise: boolean;
  showNotes: boolean;
  showGlucTable: boolean;
  showNoteLinesAtGluc: boolean;
  sumNarrowValues: boolean;
  splitBolus: boolean;
  showExercises: boolean;
  showCarbIE: boolean;
  showCGP: boolean;
  showProfileStart: boolean;
  showHTMLNotes: boolean;
  showZeroBasal: boolean;
  showCOB: boolean;
  showIOB: boolean;
  roundToProfile: boolean;
  spareBool1: boolean;
  showTargetValue: boolean;
  showTempOverrides: boolean;
  showCGPAreaLines: boolean;
  carbMax: number;
  lineWidth: number;
  glucMax = 0.0;
  profMax = 0.0;
  bolusMax = 50.0;
  ieMax = 0.0;
  graphBottom: number;
  glucTableHeight = 0.6;
  glucTableTop: number;
  glucExerciseHeight = 0.6;
  glucExerciseTop: number;
  tempOverridesTop: number;
  tempOverridesHeight = 0.6;
  collInsulin: CollectInfo[] = [];
  collCarbs: CollectInfo[] = [];
  hasExercises: boolean;
  hasTempOverrides: boolean;

  constructor(ps: PdfService, suffix: string = null) {
    super(ps);
    this.init(suffix);
  }

  static get msgParam19(): string {
    return $localize`Glukose Pentagon erzeugen`;
  }

  get basalWidth(): number {
    return this.graphWidth;
  }

  override get estimatePageCount(): any {
    let count = GLOBALS.period?.dayCount ?? 0;
    if (this.showCGP ?? false) {
      count *= 2;
    }
    return {count: count, isEstimated: false};
  }

  get msgParam1(): string {
    return $localize`Symbole (Katheter etc.)`;
  }

  get msgParam2(): string {
    return $localize`Insulin`;
  }

  get msgParam3(): string {
    return $localize`Kohlenhydrate`;
  }

  get msgParam4(): string {
    return $localize`Tages-Basalrate`;
  }

  get msgParam5(): string {
    return $localize`Profil-Basalrate`;
  }

  get msgParam6(): string {
    return $localize`Basal mit zwei Nachkommastellen`;
  }

  get msgParam8(): string {
    return $localize`Legende`;
  }

  get msgParam9(): string {
    return $localize`Notizen`;
  }

//  get msgParam10(): string{return $localize(`Neuester Tag zuerst`);
  get msgParam11(): string {
    return $localize`Tabelle mit Glukosewerten`;
  }

  get msgParam13(): string {
    return $localize`Notiz-Linien bis zur Kurve zeichnen`;
  }

//  override
//  number get scale
//  => isSmall ?? false ? (GLOBALS.isLocal ? 0.25 : 0.5) : 1.0;

  get msgParam14(): string {
    return $localize`Nahe zusammen liegende Werte aufsummieren`;
  }

  get msgParam16(): string {
    return $localize`Bolusarten anzeigen`;
  }

  get msgParam17(): string {
    return $localize`Bewegung anzeigen`;
  }

  get msgParam18(): string {
    return $localize`Berechnete IE für Kohlenhydrate anzeigen`;
  }

  get msgParam20(): string {
    return $localize`Tagesstartprofil anzeigen`;
  }

  get msgParam21(): string {
    return $localize`HTML-Notizen anzeigen`;
  }

  get msgParam22(): string {
    return $localize`Dauer der abgeschalteten Basalrate anzeigen`;
  }

  get msgParam23(): string {
    return $localize`Insulin auf maximale Stellen im Profil runden`;
  }

  get msgParam24(): string {
    return $localize`COB (Carbs On Board) anzeigen`;
  }

  get msgParam25(): string {
    return $localize`IOB (Insulin On Board) anzeigen`;
  }

  get msgParam26(): string {
    return $localize`Zielwert anzeigen`;
  }

  get msgParam27(): string {
    return $localize`Maximalwert für Kohlenhydrate`;
  }

  override get backsuffix(): string {
    return this.showCGP ? 'cgp' : '';
  }

  get _titleGraphic(): string {
    return $localize`Tagesgrafik`;
  }

  override get title(): string {
    return this._titleGraphic;
  }

  override get msgBasalSum(): string {
    return $localize`Basal ges.`;
  }

  get msgBolusSum(): string {
    return $localize`Bolus ges.`;
  }

  get msgBasalZero(): string {
    return $localize`Basal 0%`;
  }

  get msgExercises(): string {
    return $localize`Bewegung`;
  }

  get msgBloody(): string {
    return $localize`Blutige Messung`;
  }

  override get imgList(): string[] {
    return ['nightscout', 'katheter.print', 'sensor.print', 'ampulle.print', 'steps.print'];
  }

  override get isPortrait(): boolean {
    return false;
  }

  override extractParams(): void {
    this.showPictures = this.params[0].boolValue;
    this.showInsulin = this.params[1].boolValue;
    this.showCarbs = this.params[2].boolValue;
    this.showBasalDay = this.params[3].boolValue;
    this.showProfileStart = this.params[3].subParams[0].boolValue;
    this.showBasalProfile = this.params[4].boolValue;
    this.isPrecise = this.params[5].boolValue;
    this.showLegend = this.params[7].boolValue;
    this.showNotes = this.params[8].boolValue;
    this.showNoteLinesAtGluc = this.params[8].subParams[0].boolValue;
    this.showHTMLNotes = this.params[8].subParams[1].boolValue;
    this.spareBool1 = this.params[9].boolValue;
    this.showGlucTable = this.params[10].boolValue;
    this.sumNarrowValues = this.params[11].boolValue;
    this.showSMB = this.params[12].boolValue;
    this.showSMBAtGluc = this.params[12].subParams[0].boolValue;
    this.splitBolus = this.params[13].boolValue;
    this.showExercises = this.params[14].boolValue;
    this.showCarbIE = this.params[15].boolValue;
    this.showCGP = this.params[16].boolValue;
    this.showCGPAreaLines = this.params[16].subParams[0].boolValue;
    this.showZeroBasal = this.params[17].boolValue;
    this.roundToProfile = this.params[18].boolValue;
    this.showCOB = this.params[19].boolValue;
    this.showIOB = this.params[20].boolValue;
    this.showTargetValue = this.params[21].boolValue;
    this.showTempOverrides = this.params[22].boolValue;
    this.carbMax = Utils.parseNumber(this.params[23].listValue.substring(0, 3));

    switch (this.params[6].intValue) {
      case 1:
        this.pagesPerSheet = 2;
        break;
      case 2:
        this.pagesPerSheet = 4;
        break;
      case 3:
        this.pagesPerSheet = 8;
        break;
      case 4:
        this.pagesPerSheet = 16;
        break;
      default:
        this.pagesPerSheet = 1;
        break;
    }
  }

  glucX(time: Date): number {
    return this.graphWidth / 1440 * (time.getHours() * 60 + time.getMinutes());
  }

  glucY(value: number): number {
    return this.graphHeight / this.glucMax * (this.glucMax - value);
  }

  carbY(value: number): number {
    return this.graphHeight / this.carbMax * (this.carbMax - value);
  }

  bolusY(value: number): number {
    return this.graphHeight / 4 * value / this.ieMax;
  }

  basalX(time: Date): number {
    return this.basalWidth / 1440 * (time.getHours() * 60 + time.getMinutes());
  }

  basalY(value: number): number {
    return this.profMax != 0 && value != null ? this.basalHeight / this.profMax * (this.profMax - value) : 0.0;
  }

  override fillPages(pages: PageData[]): void {
    //    scale = height / width;
    const data = this.repData.data;

    this.graphWidth = 23.25;
    this.graphHeight = 6.5;
    if (!this.showBasalDay && !this.showBasalProfile) {
      this.graphHeight += this.basalHeight + 1;
    }
    if (!this.showLegend) {
      this.graphHeight += 2.5;
    }
    this.basalTop = 2.0;
    if (!this.showNotes) {
      this.basalTop -= this.notesHeight;
    }
    this.graphBottom = this.graphHeight;
    if (this.showGlucTable) {
      this.graphHeight -= this.glucTableHeight;
    } else {
      this.basalTop -= this.glucTableHeight;
    }
    this.glucTableTop = this.graphHeight;

    this.lineWidth = this.cm(0.03);
    for (let i = 0; i < data.days.length; i++) {
      const day = data.days[GLOBALS.ppLatestFirst ? data.days.length - 1 - i : i];
      if (GLOBALS.period.isDowActive(Utils.getDow(day.date))) {
        if (!Utils.isEmpty(day.entries) || !Utils.isEmpty(day.treatments)) {
          pages.push(this.getPage(day));
          if (this.showCGP || this.repData.isForThumbs) {
            pages.push(PrintCGP.getCGPPage(day, this.showCGPAreaLines, this));
          }
          if (GLOBALS.showBothUnits) {
            GLOBALS.glucMGDLIdx = 1;
            pages.push(this.getPage(day));
            if (this.showCGP) {
              pages.push(PrintCGP.getCGPPage(day, this.showCGPAreaLines, this));
            }
            GLOBALS.glucMGDLIdx = 2;
          }
        } else {
          pages.push(this.getEmptyForm(this.isPortrait, this.repData.status.status));
        }
      }
      if (this.repData.isForThumbs) {
        i = data.days.length;
      }
    }
    // this.title = this._titleGraphic;
    this.subtitle = null;
  }

  glucLine(points: any): any {
    return {type: 'polyline', lineWidth: this.cm(this.lw), closePath: false, lineColor: this.colValue, points: points};
  }

  getPage(day: DayData): PageData {
    // this.title = this._titleGraphic;
    this.subtitle = null;
    this.footerTextAboveLine.text = '';
    const graphHeightSave = this.graphHeight;
    const basalTopSave = this.basalTop;
    this.hasExercises = day.treatments.find((t) => t.isExercise) != null;
    this.hasExercises ||= day.activityList.reverse().find((ac) => ac.type === 'steps-total') != null;
    if (this.showExercises && this.hasExercises) {
      this.graphHeight -= this.glucExerciseHeight;
      this.basalTop += this.glucExerciseHeight;
    }
    this.glucExerciseTop = this.graphHeight;
    this.hasTempOverrides = day.treatments.find((t) => t.isTempOverride) != null;
    if (this.showTempOverrides && this.hasTempOverrides) {
      this.graphHeight -= this.tempOverridesHeight;
      this.basalTop += this.tempOverridesHeight;
    }
    this.tempOverridesTop = this.graphHeight;
    const ret = this._getPage(day, this.repData);
    this.graphHeight = graphHeightSave;
    this.basalTop = basalTopSave;

    return ret;
  }

  carbsForIE(src: ReportData, t: TreatmentData): number {
    if (t.boluscalc != null) {
      return t.boluscalc.insulinCarbs;
    }
    const check = (t.createdAt.getHours() * 60 + t.createdAt.getMinutes()) * 60;
    let ret = 0.0;
    for (const entry of src.profile(t.createdAt).store.listCarbratio) {
      if (entry.timeForCalc < check) {
        ret = entry.value != 0 ? t.carbs / entry.value : 0.0;
      }
    }
    return ret;
  }

  _getPage(day: DayData, src: ReportData): PageData {
    // this.title = _titleGraphic;
    const collMinutes = this.sumNarrowValues ? 60 : -1;
    const xo = this.xorg;
    const yo = this.yorg;
    this.titleInfo = this.fmtDate(day.date, {withShortWeekday: false, withLongWeekday: true});
    this.glucMax = -1000.0;
    this.ieMax = 0.0;
    this.collInsulin = [];
    this.collCarbs = [];
    this.collInsulin.push(new CollectInfo(new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate(), 0, 0, 0)));
    this.collCarbs.push(new CollectInfo(new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate(), 0, 0, 0)));
    // Math.Random rnd = Math.Random();
    // for (number i = 0; i < 1440; i += 5)
    // {
    //   TreatmentData t = TreatmentData();
    //   t.createdAt = DateTime(day.date.year, day.date.month, day.date.day, 0, i);
    //   t.eventType = "meal bolus";
    //   t.insulin = 1.0 + rnd.nextInt(6);
    //   t.carbo(5.0 + rnd.nextInt(12));
    //   t.glucoseType = "norm";
    //   t.isSMB = false;
    //   day.treatments.add(t);
    // }
    // day.treatments.sort((a, b)
    // => a.createdAt.compareTo(b.createdAt));
    for (const entry of day.entries) {
      this.glucMax = Math.max(entry.gluc, this.glucMax);
    }
    for (const entry of day.bloody) {
      this.glucMax = Math.max(entry.gluc, this.glucMax);
    }

    this.profMax = -1000.0;
    if (this.showBasalProfile) {
      for (const entry of day.basalData.store.listBasal) {
        this.profMax = Math.max(entry.value ?? 0, this.profMax);
      }
    }
    if (this.showBasalDay) {
      for (const entry of day.profile) {
        this.profMax = Math.max(entry.value ?? 0, this.profMax);
      }
    }
    for (const entry of day.treatments) {
      if (entry.isBloody) {
        this.glucMax = Math.max(entry.glucose, this.glucMax);
      }
      this.ieMax = Math.max(entry.bolusInsulin, this.ieMax);
    }

    if (GLOBALS.glucMaxValue != null) {
      this.glucMax = GLOBALS.glucMaxValues[GLOBALS.ppGlucMaxIdx];
    }
    this.ieMax = Math.max(this.ieMax, 3.0);

    const vertLines: any = {
      relativePosition: {x: this.cm(xo), y: this.cm(yo)},
      canvas: []
    };
    const horzLines: any = {
      relativePosition: {x: this.cm(xo), y: this.cm(yo)},
      canvas: []
    };
    const horzLegend: any = {stack: []};
    const vertLegend: any = {stack: []};
    const graphGluc: any = {
      relativePosition: {x: this.cm(xo), y: this.cm(yo)},
      canvas: []
    };
    const graphLegend: any = {
      relativePosition: {x: this.cm(xo), y: this.cm(yo)},
      stack: []
    };
    const glucTable: any = {
      relativePosition: {x: this.cm(xo), y: this.cm(yo + this.glucTableTop)},
      stack: []
    };
    const glucTableCvs: any = {
      relativePosition: {x: this.cm(xo), y: this.cm(yo + this.glucTableTop)},
      canvas: []
    };
    const exerciseCvs: any = {
      relativePosition: {x: this.cm(xo), y: this.cm(yo + this.glucExerciseTop)},
      canvas: []
    };
    const tempOverridesCvs: any = {
      relativePosition: {x: this.cm(xo), y: this.cm(yo + this.tempOverridesTop)},
      canvas: []
    };
    const graphCarbs: any = {
      stack: [
        {
          relativePosition: {x: this.cm(xo), y: this.cm(yo)},
          canvas: []
        },
        {
          relativePosition: {x: this.cm(xo), y: this.cm(yo)},
          stack: []
        }
      ]
    };
    const graphInsulin: any = {
      stack: [
        {
          relativePosition: {x: this.cm(xo), y: this.cm(yo)},
          canvas: []
        },
        {
          relativePosition: {x: this.cm(xo), y: this.cm(yo)},
          stack: []
        }
      ]
    };
    const pictures: any = {
      relativePosition: {x: this.cm(xo), y: this.cm(yo)},
      stack: []
    };

    const vertCvs: any[] = vertLines.canvas;
    const horzCvs: any[] = horzLines.canvas;
    const horzStack: any[] = horzLegend.stack;
    const vertStack: any[] = vertLegend.stack;
    // noinspection JSMismatchedCollectionQueryUpdate
    const graphGlucCvs: any[] = graphGluc.canvas;
    const grid = this.drawGraphicGrid(this.glucMax, this.graphHeight, this.graphWidth, vertCvs, horzCvs, horzStack, vertStack,
      {graphBottom: this.graphBottom});
    if (grid.lineHeight == 0) {
      return new PageData(this.isPortrait, [
        this.headerFooter({date: day.date}),
        {
          relativePosition: {x: this.cm(this.xorg), y: this.cm(this.yorg)},
          text: this.msgMissingData
        }
      ]);
    }

    this.glucMax = grid.gridLines * grid.glucScale;

    let hasBloody = false;
    for (const entry of day.bloody) {
      const x = this.glucX(entry.time);
      let y = this.glucY(entry.mbg);
      y = this.glucY(entry.mbg);
      graphGlucCvs.push({type: 'rect', x: this.cm(x), y: this.cm(y), w: this.cm(0.1), h: this.cm(0.1), color: this.colBloodValues});
      hasBloody = true;
    }

    for (const t of day.treatments) {
      if (t.isBloody) {
        const x = this.glucX(t.createdAt);
        const y = this.glucY(GLOBALS.glucFactor * t.glucose);
        graphGlucCvs.push({type: 'rect', x: this.cm(x), y: this.cm(y), w: this.cm(0.1), h: this.cm(0.1), color: this.colBloodValues});
        hasBloody = true;
      }
    }

    let points: any = [];
    let last: EntryData = null;
    for (const entry of day.entries) {
      const x = this.glucX(entry.time);
      const y = this.glucY(entry.gluc);
      if (entry.gluc < 0) {
        if (last != null && last.gluc >= 0) {
          graphGlucCvs.push(this.glucLine(points));
          points = [];
        }
      } else {
        points.push({x: this.cm(x), y: this.cm(y)});
      }
      last = entry;
    }
    graphGlucCvs.push(this.glucLine(points));
    let hasLowGluc = false;
    let hasNormGluc = false;
    let hasHighGluc = false;

    if (this.showGlucTable) {
      for (let i = 0; i < 48; i++) {
        const hours = Math.floor(i / 2);
        const minutes = (i % 2) * 30;
        const check = new Date(0, 1, 1, hours, minutes);
        const entry = day.findNearest(day.entries, null, check, null, 15);
        const x = this.glucX(check) + 0.02;
        if (entry != null) {
          let col = this.colNormBack;
          if (entry.gluc > this.targets(this.repData)['high']) {
            col = this.colHighBack;
            hasHighGluc = true;
          } else if (entry.gluc < this.targets(this.repData)['low']) {
            col = this.colLowBack;
            hasLowGluc = true;
          } else {
            hasNormGluc = true;
          }
          glucTableCvs.canvas.push({
            type: 'rect',
            x: this.cm(this.glucX(check)),
            y: this.cm(0),
            w: this.cm(this.graphWidth / 1440 * 30),
            h: this.cm(this.glucTableHeight),
            color: col
          });
          glucTable.stack.push({
            relativePosition: {x: this.cm(x), y: this.cm(i % 2 == 0 ? 0 : this.glucTableHeight / 2)},
            text: GLOBALS.glucFromData(entry.gluc),
            color: this.colGlucValues,
            fontSize: this.fs(7)
          });
        }
        if (i % 2 == 1) {
          glucTableCvs.canvas.push({
            type: 'line',
            x1: this.cm(this.glucX(check)),
            y1: this.cm(this.glucTableHeight * 0.75),
            x2: this.cm(this.glucX(check)),
            y2: this.cm(this.glucTableHeight),
            lineWidth: this.cm(this.lw),
            lineColor: this.lc
          });
        }
        if (entry != null) {
          const found = day.findNearest(day.bloody, day.treatments, check, null, 15);
          if (found instanceof EntryData) {
            glucTable.stack.push({
              relativePosition: {x: this.cm(x), y: this.cm(i % 2 != 0 ? 0 : this.glucTableHeight / 2)},
              text: GLOBALS.glucFromData(found.mbg),
              color: this.colBloodValues,
              fontSize: this.fs(7)
            });
          } else if (found instanceof TreatmentData) {
            const value = GLOBALS.glucFactor * found.glucose;
            glucTable.stack.push({
              relativePosition: {x: this.cm(x), y: this.cm(i % 2 != 0 ? 0 : this.glucTableHeight / 2)},
              text: GLOBALS.glucFromData(value),
              color: this.colBloodValues,
              fontSize: this.fs(7)
            });
          }
        }
      }
      glucTableCvs.canvas.push({
        type: 'line',
        x1: this.cm(0),
        y1: this.cm(this.glucTableHeight),
        x2: this.cm(this.graphWidth),
        y2: this.cm(this.glucTableHeight),
        lineWidth: this.cm(this.lw),
        lineColor: this.lcFrame
      });
    }
    let hasCatheterChange = false;
    let hasSensorChange = false;
    let hasAmpulleChange = false;
    let hasCarbs = false;
    let hasBolus = false;
    let hasCarbBolus = false;
    let hasCollectedValues = false;
    let hasCarbIE = false;
    let hasBolusExt = false;
    const noteLines: number[] = [];
    for (const t of day.treatments) {
      let x: number;
      let y: number;
      // string type = t.eventType.toLowerCase();
      // if (showSMB && t.microbolus > 0) {
      //   EntryData entry = day.findNearest(day.entries, null, t.createdAt);
      //   x = glucX(t.createdAt);
      //   if (entry != null && showSMBAtGluc) {
      //     y = glucY(entry.gluc);
      //   } else {
      //     y = glucY(src.targetValue(t.createdAt)) + this.lw / 2;
      //   }
      //   paintSMB(t.microbolus, x, y,
      //   graphInsulin['stack'][0]['canvas'] as List);
      // }
      if (t.isTempBasal) {
        continue;
      }
      if ((t.carbs > 0 || t.eCarbs > 0) && this.showCarbs) {
        x = this.glucX(t.createdAt);
        if (t.isECarb) {
          this.paintECarbs(t.eCarbs, x, this.graphHeight - this.lw, graphCarbs.stack[0].canvas);
        } else {
          y = this.carbY(t.carbs);
          graphCarbs.stack[0].canvas.push({
            type: 'line',
            x1: this.cm(x),
            y1: this.cm(y),
            x2: this.cm(x),
            y2: this.cm(this.graphHeight - this.lw),
            lineColor: this.colCarbs,
            lineWidth: this.cm(0.1),
          });
          const carbsIE = this.carbsForIE(src, t);
          if (Utils.differenceInMinutes(t.createdAt, Utils.last(this.collCarbs).start) < collMinutes) {
            Utils.last(this.collCarbs).fill(t.createdAt, t.carbs, carbsIE);
          } else {
            this.collCarbs.push(new CollectInfo(t.createdAt, t.carbs, carbsIE));
          }
        }
        hasCarbs = true;
      }
      if (this.showInsulin) {
        if (t.bolusInsulin > 0 && !t.isSMB) {
          let insulin = t.bolusInsulin;
          let insulinExt = 0.0;
          if (t.splitExt > 0 || t.splitNow > 0) {
            insulinExt = t.splitExt * insulin / 100.0;
            insulin = t.splitNow * insulin / 100.0;
          }

          x = this.glucX(t.createdAt);
          y = this.bolusY(insulin);
          if (insulin > 0) {
            graphInsulin.stack[0].canvas.push({
              type: 'line',
              x1: this.cm(x),
              y1: this.cm(0),
              x2: this.cm(x),
              y2: this.cm(y),
              lineColor: this.splitBolus && t.isCarbBolus ? this.colCarbBolus : this.colBolus,
              lineWidth: this.cm(0.1),
            });
          }
          if (insulinExt > 0) {
            let w = this.glucX(Utils.addTimeSeconds(t.createdAt, t.duration)) - x;
            if (w < 0) {
              w = this.graphWidth - x;
            }
            const h = this.bolusY(insulinExt);
            graphInsulin.stack[0].canvas.push({
              type: 'rect',
              x: this.cm(x),
              y: this.cm(0),
              w: this.cm(w),
              h: this.cm(h),
              color: this.colBolusExt,
            });
            hasBolusExt = true;
          }

          if (Utils.differenceInMinutes(t.createdAt, Utils.last(this.collInsulin).start) < collMinutes) {
            Utils.last(this.collInsulin).fill(t.createdAt, t.bolusInsulin, 0.0);
          } else {
            this.collInsulin.push(new CollectInfo(t.createdAt, t.bolusInsulin));
          }

          if (this.splitBolus && t.isCarbBolus) {
            hasCarbBolus = true;
          } else {
            hasBolus = true;
          }
        }
        if (this.showSMB && t.isSMB && t.insulin > 0) {
          const entry = day.findNearest(day.entries, null, t.createdAt);
          x = this.glucX(t.createdAt);
          if (entry != null && this.showSMBAtGluc) {
            y = this.glucY(entry.gluc);
          } else {
            y = this.glucY(src.targetValue(t.createdAt)) + this.lw / 2;
          }
          this.paintSMB(t.insulin, x, y, graphInsulin.stack[0].canvas);
        }
      }

      if (t.isSiteChange && this.showPictures) {
        const x = this.glucX(t.createdAt) - 0.3;
        const y = this.graphHeight - 0.6;
        pictures.stack.push({
          relativePosition: {x: this.cm(x), y: this.cm(y)},
          image: 'katheter.print',
          width: this.cm(0.8)
        });
        pictures.stack.push({
          relativePosition: {x: this.cm(x + 0.33), y: this.cm(y + 0.04)},
          text: `${this.fmtTime(t.createdAt)}`,
          fontSize: this.fs(5),
          color: 'white'
        });
        hasCatheterChange = true;
      } else if (t.isSensorChange && this.showPictures) {
        const x = this.glucX(t.createdAt) - 0.3;
        const y = this.graphHeight - 0.6;
        pictures.stack.push({
          relativePosition: {x: this.cm(x), y: this.cm(y)},
          image: 'sensor.print',
          width: this.cm(0.6)
        });
        pictures.stack.push({
          relativePosition: {x: this.cm(x), y: this.cm(y + 0.34)},
          columns: [
            {
              width: this.cm(0.6),
              text: `${this.fmtTime(t.createdAt)}`,
              fontSize: this.fs(5),
              color: 'white',
              alignment: 'center'
            }
          ]
        });
        hasSensorChange = true;
      } else if (t.isInsulinChange && this.showPictures) {
        const x = this.glucX(t.createdAt) - 0.3;
        const y = this.graphHeight - 0.6;
        pictures.stack.push({
          relativePosition: {x: this.cm(x), y: this.cm(y)},
          image: 'ampulle.print',
          width: this.cm(0.8)
        });
        pictures.stack.push({
          relativePosition: {x: this.cm(x + 0.33), y: this.cm(y + 0.1)},
          text: `${this.fmtTime(t.createdAt)}`,
          fontSize: this.fs(5),
          color: 'white'
        });
        hasAmpulleChange = true;
      }

      if (t.isTempOverride && this.showTempOverrides) {
        const x = this.glucX(t.createdAt);
        const wid = this.glucX(new Date(0, 0, 0, 0, 0, t.duration));
        tempOverridesCvs.canvas.push({
          type: 'rect',
          x: this.cm(x),
          y: this.cm(0.1),
          w: this.cm(wid),
          h: this.cm(this.tempOverridesHeight - 0.25),
          color: this.colTempOverrides
        });
        if (!Utils.isEmpty(t.reason ?? '-')) {
          graphLegend.stack.push({
            relativePosition: {x: this.cm(x + 0.05), y: this.cm(this.tempOverridesTop + this.tempOverridesHeight / 2 - 0.14)},
            text: t.reason,
            fontSize: this.fs(6),
            alignment: 'left',
            color: this.colTempOverridesText
          });
        }
      }

      if (t.isExercise && this.showExercises) {
        const x = this.glucX(t.createdAt);
        const wid = this.glucX(new Date(0, 0, 0, 0, 0, t.duration));
        exerciseCvs.canvas.push({
          type: 'rect',
          x: this.cm(x),
          y: this.cm(0.1),
          w: this.cm(wid),
          h: this.cm(this.glucExerciseHeight - 0.25),
          color: this.colExercises
        });
        if (!Utils.isEmpty(t.notes ?? '')) {
          graphLegend.stack.push({
            relativePosition: {x: this.cm(x + 0.05), y: this.cm(this.glucExerciseTop + this.glucExerciseHeight / 2 - 0.14)},
            text: t.notes,
            fontSize: this.fs(6),
            alignment: 'left',
            color: this.colExerciseText
          });
        }
      } else if (this.showNotes && !Utils.isEmpty(t.notes ?? '') && !t.isECarb) {
        let notes = t.notes;
        if (!this.showHTMLNotes) {
          notes = t.notes.replace(/<.*>/, '');
        }
        let x = this.glucX(t.createdAt);
        // *** line length estimation ***
        // the following code is used to estimate the length of the note-lines for
        // trying to avoid overlapping.
        let idx = noteLines.findIndex((v) => v < x);
        const posNL = notes.indexOf('\n');
        const isMultiline = posNL > 0;
        const len = posNL > 0 ? posNL : notes.length;
        let pos = x + len * 0.15;
        if (idx < 0) {
          noteLines.push(pos);
          idx = noteLines.length - 1;
        } else {
          noteLines[idx] = pos;
        }

        if (isMultiline) {
          const lines = notes.split('\n');
          for (let i = 0; i < lines.length; i++) {
            pos = x + lines[i].length * 0.15;
            if (idx + i >= noteLines.length) {
              noteLines.push(0);
            }
            noteLines[idx + i] = Math.max(noteLines[idx + i], pos);
          }
        }
        // *** end of linelength estimation ***
        if (idx < (isMultiline ? 1 : 3)) {
          let y = this.graphBottom + this.notesTop + idx * this.notesHeight;
          let top = this.graphBottom;
          if (this.showNoteLinesAtGluc) {
            const e = day.findNearest(day.entries, null, t.createdAt);
            if (e != null) {
              top = this.glucY(e.gluc);
            }
          }
          graphGlucCvs.push({
            type: 'line',
            x1: this.cm(x),
            y1: this.cm(top),
            x2: this.cm(x),
            y2: this.cm(y + this.notesHeight),
            lineWidth: this.cm(this.lw),
            lineColor: t.duration > 0 ? this.colDurationNotesLine : this.colNotesLine
          });
          graphLegend.stack.push({
            relativePosition: {x: this.cm(x + 0.05), y: this.cm(y + this.notesHeight - 0.25)},
            text: notes,
            fontSize: this.fs(8),
            alignment: 'left',
            color: t.duration > 0 ? this.colDurationNotes : this.colNotes
          });
          if (t.duration > 0) {
            x = this.glucX(Utils.addTimeSeconds(t.createdAt, t.duration));
            graphGlucCvs.push({
              type: 'line',
              x1: this.cm(x),
              y1: this.cm(this.graphBottom + 0.35),
              x2: this.cm(x),
              y2: this.cm(y + 0.1),
              lineWidth: this.cm(this.lw),
              lineColor: this.colDurationNotesLine
            });
          }
        }
      }
      // if (cobPoints.length > 0)cobPoints.push({x: cobPoints.last['x'],
      // y: cobPoints.first['y']});
      // graphCvs.push(cob);
    }
    // this code can be removed, as soon as i know, what i smoked,
    // when i added it.
    // const bpm = day.activityList.find(ac => ac.type == 'hr-bpm');
    const ac = day.activityList.reverse().find(ac => ac.type == 'steps-total');
    if (this.showExercises && ac != null) {
      const x = this.glucX(ac.createdAt);
      pictures.stack.push({
        relativePosition: {x: this.cm(x - this.glucExerciseHeight / 2), y: this.cm(this.glucExerciseTop + 0.1)},
        image: 'steps.print',
        width: this.cm(this.glucExerciseHeight - 0.25)
      });
      graphLegend.stack.push({
        relativePosition: {x: this.cm(x + 0.05), y: this.cm(this.glucExerciseTop + this.glucExerciseHeight / 2 - 0.14)},
        text: `${ac.steps}`,
        fontSize: this.fs(6),
        alignment: 'left',
        color: this.colExerciseText
      });
    }
    if (this.showExercises && this.hasExercises) {
      exerciseCvs.canvas.push({
        type: 'line',
        x1: this.cm(0),
        y1: this.cm(this.glucExerciseHeight),
        x2: this.cm(this.graphWidth),
        y2: this.cm(this.glucExerciseHeight),
        lineWidth: this.cm(this.lw),
        lineColor: this.lcFrame
      });
    }
    if (this.showTempOverrides && this.hasTempOverrides) {
      tempOverridesCvs.canvas.push({
        type: 'line',
        x1: this.cm(0),
        y1: this.cm(this.tempOverridesHeight),
        x2: this.cm(this.graphWidth),
        y2: this.cm(this.tempOverridesHeight),
        lineWidth: this.cm(this.lw),
        lineColor: this.lcFrame
      });
    }
    for (const info of this.collInsulin) {
      if (info.sum1 == 0.0) {
        continue;
      }
      const y = this.sumNarrowValues ? -0.5 : this.bolusY(info.max1);
      let text = `${GLOBALS.fmtBasal(info.sum1, {dontRound: !this.roundToProfile})} ${this.msgInsulinUnit}`;
      if (info.count > 1) {
        text = `[${text}]`;
        hasCollectedValues = true;
      }
      // (graphInsulin.stack[1].stack.push({
      //   relativePosition: {x: this.cm(x - 0.3), y: this.cm(y + 0.05),},
      //   text: text,
      //   fontSize: this.fs(8),
      //   color: colBolus
      // });
      graphInsulin.stack[1].stack.push({
        relativePosition: {
          x: this.cm(this.glucX(info.start) - 0.05),
          y: this.cm(y),
        },
        text: text,
        fontSize: this.fs(GLOBALS.basalPrecision > 2 ? 7 : 8),
        color: this.colBolus
      });
    }
    for (const info of this.collCarbs) {
      if (info.sum1 == 0.0) {
        continue;
      }
      let y = this.carbY(info.max1);
      let text = `${this.msgKH(GLOBALS.fmtNumber(info.sum1))}`;
      if (info.count > 1) {
        text = `[${text}]`;
        hasCollectedValues = true;
      }
      y -= 0.35;

      if (this.showCarbIE && info.sum2 > 0.0) {
        let text1 = `${GLOBALS.fmtBasal(info.sum2, {dontRound: !this.roundToProfile})} ${this.msgInsulinUnit}`;
        if (info.count > 1) {
          text1 = `[${text1}]`;
        }
        graphCarbs.stack[1].stack.push({
          relativePosition: {x: this.cm(this.glucX(info.start) - 0.05), y: this.cm(y)},
          text: text1,
          fontSize: this.fs(7),
          color: this.colCarbsText
        });
        hasCarbIE = true;
        y -= 0.35;
      }

      graphCarbs.stack[1].stack.push({
        relativePosition: {x: this.cm(this.glucX(info.start) - 0.05), y: this.cm(y)},
        text: text,
        fontSize: this.fs(8)
      });
    }
    const date = new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate());
    const profile = src.profile(date, day.treatments);
    const targetValues: any[] = [];
    let lastTarget = -1.0;
    const yHigh = this.glucY(Math.min(this.glucMax, this.targets(this.repData).high));
    const yLow = this.glucY(this.targets(this.repData).low);
    for (let i = 0; i < profile.store.listTargetLow.length; i++) {
      if (i < profile.store.listTargetHigh.length) {
        let low = profile.store.listTargetLow[i].value;
        let high = profile.store.listTargetHigh[i].value;
        if (!GLOBALS.glucMGDLFromStatus) {
          low *= 18.02;
          high *= 18.02;
        }
        const x = this.glucX(profile.store.listTargetLow[i].time(day.date));
        const y = this.glucY((low + high) / 2);
        if (lastTarget >= 0) {
          targetValues.push({x: this.cm(x), y: this.cm(lastTarget)});
        }
        targetValues.push({x: this.cm(x), y: this.cm(y)});
        lastTarget = y;
      }
    }
    targetValues.push({x: this.cm(this.glucX(new Date(0, 1, 1, 23, 59, 59, 999))), y: this.cm(lastTarget)});

    const limitLines: any = {
      relativePosition: {x: this.cm(xo), y: this.cm(yo)},
      canvas: [
        {
          type: 'rect',
          x: this.cm(0.0),
          y: this.cm(yHigh),
          w: this.cm(24 * grid.colWidth),
          h: this.cm(yLow - yHigh),
          color: this.colTargetArea,
          fillOpacity: 0.3
        },
        {
          type: 'line',
          x1: this.cm(0.0),
          y1: this.cm(yHigh),
          x2: this.cm(24 * grid.colWidth),
          y2: this.cm(yHigh),
          lineWidth: this.cm(this.lw),
          lineColor: this.colTargetArea
        },
        {
          type: 'line',
          x1: this.cm(0.0),
          y1: this.cm(yLow),
          x2: this.cm(24 * grid.colWidth),
          y2: this.cm(yLow),
          lineWidth: this.cm(this.lw),
          lineColor: this.colTargetArea
        },
        {type: 'rect', x: 0, y: 0, w: 0, h: 0, color: '#000', fillOpacity: 1}
      ]
    };
    if (this.showTargetValue) {
      limitLines.canvas.push({
        type: 'polyline',
        lineWidth: this.cm(this.lw * 2),
        closePath: false,
        lineColor: this.colTargetValue,
        points: targetValues
      });
    }
    let y = yo + grid.lineHeight * grid.gridLines;
    if (this.showBasalProfile || this.showBasalDay) {
      y += 1.2 + this.basalHeight + this.basalTop;
    } else {
      y += this.basalTop;
    }

    const legend = new LegendData(this.cm(xo), this.cm(y), this.cm(7.0), 6);
    const tdd = day.ieBasalSum(!this.showBasalDay) + day.ieBolusSum;
    let infoTable: any = {};

    if (this.showLegend) {
      this.addLegendEntry(legend, this.colValue, this.msgGlucosekurve, {isArea: false});
      if (hasBloody) {
        this.addLegendEntry(legend, this.colBloodValues, this.msgBloody,
          {
            points: [
              {x: 0.3, y: 0.2},
              {x: 0.4, y: 0.2},
              {x: 0.4, y: 0.3},
              {x: 0.3, y: 0.3}
            ],
            isArea: false
          });
      }
      let text: string;
      if (hasCarbs) {
        text = `${GLOBALS.fmtNumber(day.carbs, 0)}`;
        this.addLegendEntry(legend, this.colCarbs, this.msgCarbs(text), {isArea: false, lineWidth: 0.1});
      }
      if (hasCarbIE) {
        this.addLegendEntry(legend, '', this.msgCarbIE, {graphText: '1,0 IE', colGraphText: this.colCarbsText});
      }
      if (this.splitBolus) {
        let sum = day.ieCorrectionSum;
        if (!this.showSMB) {
          sum += day.ieSMBSum;
        }
        if (sum > 0.0) {
          this.addLegendEntry(legend, this.colBolus,
            this.msgCorrectBolusInsulin(`${GLOBALS.fmtBasal(sum, {dontRound: !this.roundToProfile})} ${this.msgInsulinUnit}`),
            {isArea: false, lineWidth: 0.1});
        }
        if (hasCarbBolus) {
          this.addLegendEntry(legend, this.colCarbBolus,
            this.msgCarbBolusInsulin(`${GLOBALS.fmtBasal(day.ieCarbSum, {dontRound: !this.roundToProfile})} ${this.msgInsulinUnit}`),
            {isArea: false, lineWidth: 0.1});
        }
        if (this.showSMB && day.ieSMBSum > 0.0) {
          this.addLegendEntry(legend, this.colBolus,
            this.msgSMBInsulin(`${GLOBALS.fmtBasal(day.ieSMBSum, {dontRound: !this.roundToProfile})} ${this.msgInsulinUnit}`),
            {
              points: [
                {x: 0.1, y: 0.1},
                {x: 0.5, y: 0.1},
                {x: 0.3, y: 0.4}
              ],
              isArea: false,
              lineWidth: 0.1
            });
        }
      } else if (hasBolus) {
        this.addLegendEntry(legend, this.colBolus,
          this.msgBolusInsulin(`${GLOBALS.fmtBasal(day.ieBolusSum, {dontRound: !this.roundToProfile})} ${this.msgInsulinUnit}`),
          {isArea: false, lineWidth: 0.1});
      }
      if (hasBolusExt) {
        this.addLegendEntry(legend, this.colBolusExt, this.msgBolusExtInsulin, {isArea: false, lineWidth: 0.1});
      }
      if (this.showExercises && this.hasExercises) {
        this.addLegendEntry(legend, this.colExercises, this.msgExercises, {isArea: false, lineWidth: 0.3});
      }
      if (this.showTempOverrides && this.hasTempOverrides) {
        this.addLegendEntry(legend, this.colTempOverrides, BasePrint.msgOverrides, {isArea: false, lineWidth: 0.3});
      }
      if (this.showBasalDay) {
        text = `${GLOBALS.fmtBasal(day.ieBasalSum(!this.showBasalDay), {dontRound: !this.roundToProfile})} ${this.msgInsulinUnit}`;
        this.addLegendEntry(legend, this.colBasalDay, this.msgBasalrateDay(text), {isArea: true});
      }
      if (this.showBasalProfile) {
        text = `${GLOBALS.fmtBasal(day.basalData.store.ieBasalSum, {dontRound: !this.roundToProfile})} ${this.msgInsulinUnit}`;
        this.addLegendEntry(legend, this.colProfileSwitch, this.msgBasalrateProfile(text), {isArea: false});
      }
      text = `${GLOBALS.fmtBasal(tdd, {dontRound: !this.roundToProfile})} ${this.msgInsulinUnit}`;
      this.addLegendEntry(legend, '', this.msgLegendTDD(text), {graphText: this.msgTDD});
      const v1 = GLOBALS.glucFromData(this.targets(this.repData).low);
      const v2 = GLOBALS.glucFromData(this.targets(this.repData).high);
      this.addLegendEntry(legend, this.colTargetArea, this.msgTargetArea(v1, v2, GLOBALS.getGlucInfo().unit));
      if (this.showTargetValue) {
        this.addLegendEntry(
          legend,
          this.colTargetValue,
          this.msgTargetValue(
            `${GLOBALS.glucFromData((profile.targetHigh + profile.targetLow) / 2)} ${GLOBALS.getGlucInfo().unit}`),
          {isArea: false});
      }
      if (hasCollectedValues) {
        this.addLegendEntry(legend, '', this.msgCollectedValues, {graphText: '[0,0]'});
      }
      if (hasCatheterChange) {
        this.addLegendEntry(legend, '', this.msgCatheterChange, {image: 'katheter.print', imgWidth: 0.5, imgOffsetY: 0.15});
      }
      if (hasSensorChange) {
        this.addLegendEntry(legend, '', this.msgSensorChange, {image: 'sensor.print', imgWidth: 0.5, imgOffsetY: -0.05});
      }
      if (hasAmpulleChange) {
        this.addLegendEntry(legend, '', this.msgAmpulleChange, {image: 'ampulle.print', imgWidth: 0.4, imgOffsetY: 0.1});
      }
      if (this.showGlucTable) {
        if (hasLowGluc) {
          this.addLegendEntry(legend, this.colLowBack, this.msgGlucLow,
            {graphText: GLOBALS.glucFromData(day.basalData.targetLow), newColumn: legend.columns.length < 3});
        }
        if (hasNormGluc) {
          this.addLegendEntry(legend, this.colNormBack, this.msgGlucNorm, {
            graphText: GLOBALS.glucFromData((day.basalData.targetLow + day.basalData.targetHigh) / 2),
            newColumn: !hasLowGluc && legend.columns.length < 3
          });
        }
        if (hasHighGluc) {
          this.addLegendEntry(legend, this.colHighBack, this.msgGlucHigh,
            {
              graphText: GLOBALS.glucFromData(day.basalData.targetHigh),
              newColumn: !hasLowGluc && !hasNormGluc && legend.columns.length < 3
            });
        }
      }

      const infoBody: any[] = [];
      infoTable = {
        relativePosition: {x: this.cm(xo + this.graphWidth - 4.5), y: this.cm(y - 0.1)},
        table: {
          margins: [0, 0, 0, 0],
          widths: [this.cm(2.3), this.cm(2.2)],
          body: infoBody
        },
        layout: 'noBorders'
      };

      infoBody.push([
        {text: this.msgHbA1C, fontSize: this.fs(10)},
        {text: `${this.hba1c(day.mid)} %`, color: this.colHbA1c, fontSize: this.fs(10), alignment: 'right'}
      ]);
      let prz = day.ieBasalSum(!this.showBasalDay) / (day.ieBasalSum(!this.showBasalDay) + day.ieBolusSum) * 100;
      infoBody.push([
        {text: this.msgBasalSum, fontSize: this.fs(10)},
        {text: `${GLOBALS.fmtNumber(prz, 1)} %`, color: this.colBasalDay, fontSize: this.fs(10), alignment: 'right'}
      ]);
      prz = day.ieBolusSum / (day.ieBasalSum(!this.showBasalDay) + day.ieBolusSum) * 100;
      infoBody.push([
        {text: this.msgBolusSum, fontSize: this.fs(10)},
        {text: `${GLOBALS.fmtNumber(prz, 1)} %`, color: this.colBolus, fontSize: this.fs(10), alignment: 'right'}
      ]);
      if (this.showZeroBasal) {
        const duration = day.basalZeroDuration / 60;
        infoBody.push([
          {text: this.msgBasalZero, fontSize: this.fs(10)},
          {
            text: `${this.msgDuration(Math.floor(duration / 60), Math.floor(duration % 60))}`,
            color: this.colBasalDay,
            fontSize: this.fs(10),
            alignment: 'right'
          }
        ]);
      }
    }
    const profileBasal = this.showBasalProfile ? this.getBasalGraph(day, true, this.showBasalDay, xo, yo) : null;
    const dayBasal = this.showBasalDay ? this.getBasalGraph(day, false, false, xo, yo) : null;

    if (this.showBasalProfile) {
      profileBasal.stack.push(
        {
          relativePosition: {x: this.cm(xo), y: this.cm(yo + this.graphHeight + this.basalHeight + this.basalTop + 0.2)},
          columns: [
            {
              width: this.cm(this.basalWidth),
              text: `${this.msgTDD} ${GLOBALS.fmtBasal(tdd, {dontRound: !this.roundToProfile})} ${this.msgInsulinUnit}`,
              fontSize: this.fs(20),
              alignment: 'center',
              color: this.colBasalDay
            }
          ]
        },
      );
    }
    let stack: any[];
    if (this.showBasalProfile) {
      stack = profileBasal.stack;
    } else if (this.showBasalDay) {
      stack = dayBasal.stack;
    }

    if (stack != null) {
      let startDate = new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate());
      startDate = Utils.addTimeMinutes(startDate, -1);
      let startProfile: ProfileData;
      let lastProfile: ProfileData = null;
      for (const p of src.profiles) {
        if (Utils.isBefore(p.startDate, startDate)) {
          startProfile = p;
        }
        if (Utils.isAfter(p.startDate, startDate) && day.isSameDay(p.startDate)) {
          this.showProfileSwitch(src, p, lastProfile, stack, xo, yo);
          lastProfile = p;
        }
      }
      if (startProfile != null && this.showProfileStart) {
        this.showProfileSwitch(src, startProfile, lastProfile, stack, xo, yo, this.glucX(new Date(0)));
      }
    }

    let error: string = null;

    // if (!g.checkJSON(glucTableCvs))error = 'glucTableCvs';
    // if (!g.checkJSON(vertLegend))error = 'vertLegend';
    // if (!g.checkJSON(vertLines))error = 'vertLines';
    // if (!g.checkJSON(horzLegend))error = 'horzLegend';
    // if (!g.checkJSON(horzLines))error = 'horzLines';
    // noinspection PointlessBooleanExpressionJS
    if (error != null) {
      return new PageData(this.isPortrait, [
        this.headerFooter({date: day.date}),
        {
          relativePosition: {x: this.cm(xo), y: this.cm(yo)},
          text: `Fehler bei ${error}`,
          color: 'red'
        }
      ]);
    }

    //    number cobHeight = 0;
    let graphIob: any = {};
    let graphCob: any = {};

    if (this.showCOB || this.showIOB) {
      const hc: any[] = [];
      const vs: any[] = [];
      const pts = this.getIobCob(xo, yo, this.graphWidth, this.graphHeight, hc, vs, day, this.ieMax * 4, this.carbMax);

      if (this.showIOB) {
        graphIob = {
          //          relativePosition: {x: this.cm(xo), y: this.cm(yo + graphHeight - pts['iobHeight'] + pts['iobTop'])},
          relativePosition: {x: this.cm(xo), y: this.cm(yo - pts['iobTop'])},
          canvas: []
        };
        const graphIobCvs = graphIob.canvas;
        graphIobCvs.push(this.graphArea(pts.iob, this.colIOBDaily, this.colIOBDaily));
      }
      if (this.showCOB) {
        graphCob = {
          relativePosition: {x: this.cm(xo), y: this.cm(yo + this.graphHeight - pts.cobHeight)},
          canvas: []
        };
        const graphCobCvs = graphCob.canvas;
        graphCobCvs.push(this.graphArea(pts.cob, this.colCOBDaily, this.colCOBDaily));
      }
    }
    const ret = new PageData(this.isPortrait, [
      this.headerFooter({date: day.date}),
      graphIob,
      graphCob,
      glucTableCvs,
      tempOverridesCvs,
      exerciseCvs,
      vertLegend,
      vertLines,
      horzLegend,
      horzLines,
      limitLines,
      pictures,
      graphGluc,
      graphInsulin,
      graphCarbs,
      glucTable,
      dayBasal,
      profileBasal,
      graphLegend,
    ]);

    if (legend.asOutput != null) {
      ret.content.push(legend.asOutput);
      ret.content.push(infoTable);
    }

    return ret;
  }

  showProfileSwitch(src: ReportData, p: ProfileData, last: ProfileData, stack: any[], xo: number, yo: number, x: number = null): void {
    if (last != null && p.storeHash == last.storeHash) {
      return;
    }
    x ??= this.glucX(p.startDate);
    const y = this.graphHeight + this.basalTop + this.basalHeight;
    if (x < this.width) {
      stack[0].canvas.push({
        type: 'line',
        x1: this.cm(x),
        y1: this.cm(0),
        x2: this.cm(x),
        y2: this.cm(this.basalHeight + 0.25),
        lineWidth: this.cm(this.lw),
        lineColor: this.colProfileSwitch
      });
      stack.push({
        relativePosition: {x: this.cm(xo + x + 0.1), y: this.cm(yo + y)},
        text: src.profile(p.startDate).store.name,
        fontSize: this.fs(8),
        color: this.colProfileSwitch
      });
    }
  }

  getBasalGraph(day: DayData, useProfile: boolean, displayProfile: boolean, xo: number, yo: number): any {
    let data: ProfileEntryData[];
    let basalSum: number;
    let color: string;

    if (useProfile) {
      data = day.basalData.store.listBasal;
      color = this.colProfileSwitch; //colBasalProfile;
    } else {
      data = day.profile;
      color = this.colBasalDay;
    }

    basalSum = day.ieBasalSum(!useProfile);
    const basalCvs: any[] = [];
    const ret: any = {
      stack: [
        {
          relativePosition: {x: this.cm(xo), y: this.cm(yo + this.graphHeight + this.basalTop)},
          canvas: basalCvs
        }
      ]
    };
    if (basalSum != 0) {
      ret.stack.push(
        {
          relativePosition: {x: this.cm(xo), y: this.cm(yo + this.graphHeight + this.basalHeight + this.basalTop + 0.2)},
          columns: [
            {
              width: this.cm(this.basalWidth),
              text: `${GLOBALS.fmtBasal(basalSum, {dontRound: !this.roundToProfile})} ${this.msgInsulinUnit}`,
              fontSize: this.fs(20),
              alignment: displayProfile ? 'right' : 'left',
              color: color
            }
          ]
        },
      );
    }
    let lastY = -1.0;
    const areaPoints: any[] = [];
    const area: any = {
      type: 'polyline',
      lineWidth: this.cm(this.lw),
      closePath: !displayProfile,
      color: !displayProfile ? this.blendColor(color, '#ffffff', 0.7) : null,
      lineColor: color,
      points: areaPoints,
      //      fillOpacity: opacity
    };
    if (displayProfile) {
      area.dash = {length: this.cm(0.1), space: this.cm(0.05)};
    }

    const temp: ProfileEntryData[] = [];
    for (const entry of data) {
      temp.push(entry);
    }
    if (useProfile) {
      temp.sort((a, b) =>
        Utils.compareDate(a.time(day.date, useProfile), b.time(day.date, useProfile))
      );

      if (Utils.isEmpty(temp)) {
        temp.push(new ProfileEntryData(new ProfileTimezone(GlobalsData.refTimezone)));
      }
      if (temp[0].timeAsSeconds != -temp[0].localDiff * 60 * 60) {
        const clone = temp[0].clone(new Date(0, 1, 1, -temp[0].localDiff, 0));
        temp.splice(0, 0, clone);
      }
    }

    if (!displayProfile) {
      areaPoints.push({x: this.cm(this.basalX(new Date(0, 1, 1, 0, 0))), y: this.cm(this.basalY(0.0))});
    }
    for (const entry of temp) {
      const time = entry.time(day.date, useProfile);
      let x = this.basalX(time);
      if (Utils.isBefore(time, day.date)) {
        x -= this.basalWidth;
      }
      const y = this.basalY(entry.value); //basalY(entry.adjustedValue(entry.value));
      if (x >= 0) {
        if (lastY >= 0) {
          areaPoints.push({x: this.cm(x), y: this.cm(lastY)});
        }
        areaPoints.push({x: this.cm(x), y: this.cm(y)});
      }
      lastY = y;
    }
    if (lastY >= 0) {
      areaPoints.push({x: this.cm(this.basalX(new Date(0, 1, 1, 23, 59))), y: this.cm(lastY)});
    }
    if (!displayProfile) {
      areaPoints.push({x: this.cm(this.basalX(new Date(0, 1, 1, 23, 59))), y: this.cm(this.basalY(0.0))});
    }
    basalCvs.push(area);
    //    basalCvs.push({"type": "rect", "x": 0, "y": 0, "w": 1, "h": 1, "fillOpacity": 1});
    return ret;
  }

  paintECarbs(eCarbs: number, x: number, y: number, cvs: any[]): void {
    const h = this.graphHeight - this.carbY(eCarbs);
    cvs.push({
      type: 'polyline',
      closePath: true,
      _lineColor: '#000000',
      color: this.colCarbs,
      lineWidth: this.cm(0),
      points: [
        {x: this.cm(x), y: this.cm(y - h - 0.1)},
        {x: this.cm(x + 0.1), y: this.cm(y)},
        {x: this.cm(x - 0.1), y: this.cm(y)}
      ],
    });
  }

  graphArea(points: any, colLine: string, colFill: string): any {
    return {
      type: 'polyline',
      lineWidth: this.cm(this.lw),
      closePath: true,
      color: colFill,
      lineColor: colLine,
      points: points
    };
  }
}
