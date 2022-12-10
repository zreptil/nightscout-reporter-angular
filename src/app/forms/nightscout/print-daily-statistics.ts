import {BasePrint} from '@/forms/base-print';
import {LiteralFormat, ParamInfo} from '@/_model/param-info';
import {PdfService} from '@/_services/pdf.service';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {DayData} from '@/_model/nightscout/day-data';
import {PageData} from '@/_model/page-data';
import {ProfileStoreData} from '@/_model/nightscout/profile-store-data';
import {ProfileGlucData} from '@/_model/nightscout/profile-gluc-data';
import {Utils} from '@/classes/utils';

export class PrintDailyStatistics extends BasePrint {
  override help = $localize`:help for daystats@@help-daystats:Dieses Formular zeigt die statistischen Werte für die Tage des ausgewählten Zeitraums
an. Für jeden Tag wird eine Zeile erzeugt. Die Spalten kann man teilweise konfigurieren. Auch hier wird der geschätzte
HbA1c ausgegeben. Dieser hat wie auch im Formular @01@ nur sehr wenig Aussagekraft, weshalb er auch hier nur mit
schwächerer Schrift angezeigt wird.`;
  override baseId = 'daystats';
  override baseIdx = '04';
  isFormParam1: boolean;
  override params = [
    new ParamInfo(4, this.msgParamColCount, {boolValue: true}),
    new ParamInfo(7, this.msgParamColStdAbw, {boolValue: true}),
    new ParamInfo(9, this.msgParamColPercentile, {boolValue: true}),
    new ParamInfo(10, this.msgParamHbA1c, {boolValue: true}),
    new ParamInfo(8, this.msgParamColVarK, {boolValue: false}),
    new ParamInfo(1, this.msgParamColBasal, {
      boolValue: false, subParams: [
        new ParamInfo(1, BasePrint.msgUseDailyBasalrate,
          {boolValue: true, isLoopValue: true})
      ]
    }),
    new ParamInfo(6, this.msgParamColKH, {boolValue: false}),
    new ParamInfo(5, this.msgParamColMinMax, {boolValue: false}),
    new ParamInfo(2, this.msgParamColBolus, {boolValue: false}),
    new ParamInfo(3, this.msgParamColTDD, {boolValue: false}),
    new ParamInfo(0, '', {literalFormat: new LiteralFormat(true)}),
  ];
  showHbA1c: boolean;
  showStdabw: boolean;
  showCount: boolean;
  showValueStats: boolean;
  showPercentile: boolean;
  showVarK: boolean;
  showBasal: boolean;
  useDailyBasalrate: boolean;
  showCarbs: boolean;
  showBolus: boolean;
  showTDD: boolean;
  _maxTDD = 0.0;
  _basalSum = 0.0;
  override scale = 1.0;

  constructor(ps: PdfService, suffix: string = null) {
    super(ps);
    this.init(suffix);
  }

  override get title(): string {
    return $localize`Tagesstatistik`;
  }

  override get estimatePageCount(): any {
    let count = GLOBALS.period?.dayCount ?? 0;
    count = Math.ceil(count / 19);
    return {count: count, isEstimated: false};
  }

  get msgParamColCount(): string {
    return $localize`Spalte Messwerte`;
  }

  get msgParamColStdAbw(): string {
    return $localize`Spalte Standardabweichung`;
  }

  get msgParamColPercentile(): string {
    return $localize`Spalten Perzentile`;
  }

  get msgParamHbA1c(): string {
    return $localize`Spalte HbA1c`;
  }

  get msgParamColVarK(): string {
    return $localize`Spalte Variationskoeffizient`;
  }

  get msgParamColBasal(): string {
    return $localize`Spalte Basal anzeigen`;
  }

  get msgParamColKH(): string {
    return $localize`Spalte Kohlenhydrate anzeigen`;
  }

  get msgParamColMinMax(): string {
    return $localize`Spalten Min / Max anzeigen`;
  }

  get msgParamColBolus(): string {
    return $localize`Spalte Bolus anzeigen`;
  }

  get msgParamColTDD(): string {
    return $localize`TDD anzeigen`;
  }

  override get isPortrait(): boolean {
    return false;
  }

  override extractParams(): void {
    this.showCount = this.params[0].boolValue;
    this.showStdabw = this.params[1].boolValue;
    this.showPercentile = this.params[2].boolValue;
    this.showHbA1c = this.params[3].boolValue;
    this.showVarK = this.params[4].boolValue;
    this.showBasal = this.params[5].boolValue;
    this.useDailyBasalrate = this.params[5].subParams[0].boolValue;
    this.showCarbs = this.params[6].boolValue;
    this.showValueStats = this.params[7].boolValue;
    this.showBolus = this.params[8].boolValue;
    this.showTDD = this.params[9].boolValue;
  }

  override checkValue(param: ParamInfo, value: any): void {
    const list = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    let count = 0;
    for (const idx of list) {
      const p = this.params[idx];
      if (p.boolValue) {
        count++;
        if (idx === 2) {
          count += 2;
        }
      }
    }

    for (const idx of list) {
      const p = this.params[idx];
      if (count > 6) {
        if (!p.boolValue) {
          p.isDisabled = true;
        }
      } else {
        p.isDisabled = false;
      }
    }
    if (count > 4 && !this.params[2].boolValue) {
      this.params[2].isDisabled = true;
    }
    this.params[10].title = this.msgColumns(7 - count);
  }

  override getTable(widths: any, body: any): any {
    return {
      columns: [
        {
          margin: [this.cm(2.2), this.cmy(this.yorg - 0.6), this.cm(2.2), this.cmy(0.0)],
          width: this.cm(this.width),
          fontSize: this.fs(10),
          table: {widths: widths, body: body},
        }
      ],
      pageBreak: ''
    };
  }

  fillRow(row: any, f: number, firstCol: string[], day: DayData, style: string, countForAverage = 1.0): void {
    this.addTableRow(
      true,
      this.cm(2.9),
      row,
      {text: this.msgDate, style: 'total', alignment: 'center'},
      this.getContent(firstCol, 'total', 'center'));
    let text = this.msgDistribution;
    if (this.showTDD) {
      text = `${text}\n${this.msgTDD}`;
    }
    const tdd = day.ieBasalSum(!this.useDailyBasalrate) + day.ieBolusSum;
    this.addTableRow(true, this.cm(f * 100), row, {
      text: text,
      style: 'total',
      alignment: 'center'
    }, {
      style: style,
      canvas: [
        {
          type: 'rect',
          color: this.colLow,
          x: this.cm(0),
          y: this.cm(0),
          w: this.cm(day.lowPrz * f),
          h: this.cm(this.showTDD ? 0.25 : 0.5)
        },
        {
          type: 'rect',
          color: this.colNorm,
          x: this.cm(day.lowPrz * f),
          y: this.cm(0),
          w: this.cm(day.normPrz * f),
          h: this.cm(this.showTDD ? 0.25 : 0.5)
        },
        {
          type: 'rect',
          color: this.colHigh,
          x: this.cm((day.lowPrz + day.normPrz) * f),
          y: this.cm(0),
          w: this.cm(day.highPrz * f),
          h: this.cm(this.showTDD ? 0.25 : 0.5)
        },
        this.showTDD
          ? {
            type: 'rect',
            color: this.colBasalDay,
            x: this.cm(0),
            y: this.cm(0.3),
            w: this.cm((style === 'total'
                ? this._basalSum
                : day.ieBasalSum(!this.useDailyBasalrate)) *
              f *
              100 /
              tdd),
            h: this.cm(0.25)
          }
          : {},
        this.showTDD
          ? {
            type: 'rect',
            color: this.colBolus,
            x: this.cm((style === 'total'
                ? this._basalSum
                : day.ieBasalSum(!this.useDailyBasalrate)) *
              f *
              100 /
              tdd),
            y: this.cm(0.3),
            w: this.cm(day.ieBolusSum * f * 100 / tdd),
            h: this.cm(0.25)
          }
          : {},
      ]
    });
    this.addTableRow(true, '*', row, {
      text: this.msgLow(this.targets(this.repData).low),
      style: 'total',
      alignment: 'center',
      fillColor: this.colLowBack
    }, {
      text: `${GLOBALS.fmtNumber(day.lowPrz, 0)} %`,
      style: style,
      alignment: 'right',
      fillColor: style === 'total' ? this.colLowBack : null
    });
    this.addTableRow(true, '*', row, {
      text: this.msgNormal,
      style: 'total',
      alignment: 'center',
      fillColor: this.colNormBack
    }, {
      text: `${GLOBALS.fmtNumber(day.normPrz, 0)} %`,
      style: style,
      alignment: 'right',
      fillColor: style === 'total' ? this.colNormBack : null
    });
    this.addTableRow(true, '*', row, {
      text: this.msgHigh(this.targets(this.repData).high),
      style: 'total',
      alignment: 'center',
      fillColor: this.colHighBack
    }, {
      text: `${GLOBALS.fmtNumber(day.highPrz, 0)} %`,
      style: style,
      alignment: 'right',
      fillColor: style === 'total' ? this.colHighBack : null
    });
    this.addTableRow(
      this.showBasal,
      'auto',
      row,
      {
        text: `${this.msgBasal} ${this.msgInsulinUnit}`,
        style: 'total',
        alignment: 'center'
      },
      this.getRowAverage(day.ieBasalSum(!this.useDailyBasalrate), countForAverage,
        style, 'right'));
    this.addTableRow(
      this.showBolus,
      'auto',
      row,
      {
        text: `${this.msgBolus} ${this.msgInsulinUnit}`,
        style: 'total',
        alignment: 'center'
      },
      this.getRowAverage(day.ieBolusSum, countForAverage, style, 'right'));
    this.addTableRow(
      this.showTDD,
      'auto',
      row,
      {
        text: `${this.msgTDD} ${this.msgInsulinUnit}`,
        style: 'total',
        alignment: 'center'
      },
      this.getRowAverage(day.ieBolusSum + day.ieBasalSum(!this.useDailyBasalrate),
        countForAverage, style, 'right'));
    this.addTableRow(this.showCount, 'auto', row, {
      text: this.msgValues,
      style: 'total',
      alignment: 'center'
    }, {
      text: `${GLOBALS.fmtNumber(day.entryCountValid, 0)}`,
      style: style,
      alignment: 'right'
    });
    this.addTableRow(this.showValueStats, 'auto', row, {
      text: this.msgMin,
      style: 'total',
      alignment: 'center'
    }, {
      text: `${GLOBALS.glucFromData(day.min)}`,
      style: style,
      alignment: 'right'
    });
    this.addTableRow(this.showValueStats, 'auto', row, {
      text: this.msgMax,
      style: 'total',
      alignment: 'center'
    }, {
      text: `${GLOBALS.glucFromData(day.max)}`,
      style: style,
      alignment: 'right'
    });
    this.addTableRow(this.showValueStats, 'auto', row, {
      text: this.msgAverage,
      style: 'total',
      alignment: 'center'
    }, {
      text: `${GLOBALS.glucFromData(day.mid, 1)}`,
      style: style,
      alignment: 'right'
    });
    this.addTableRow(
      this.showCarbs,
      'auto',
      row,
      {text: 'KH\nin g', style: 'total', alignment: 'center'},
      this.getRowAverage(day.carbs, countForAverage, style, 'right'));
    this.addTableRow(this.showCarbs, 'auto', row, {
      text: this.msgKHPerMeal,
      style: 'total',
      alignment: 'center'
    }, {
      text: `${this.carbFromData(day.avgCarbs)}`,
      style: style,
      alignment: 'right'
    });
    this.addTableRow(this.showStdabw, 'auto', row, {
      text: this.msgDeviation,
      style: 'total',
      alignment: 'center'
    }, {
      text: `${GLOBALS.fmtNumber(day.stdAbw(GLOBALS.glucMGDL), 1)}`,
      style: style,
      alignment: 'right'
    });
    this.addTableRow(this.showVarK, 'auto', row, {
      text: this.msgVarK,
      style: 'total',
      alignment: 'center'
    }, {
      text: `${GLOBALS.fmtNumber(day.varK, 1)}`,
      style: style,
      alignment: 'right'
    });
    this.addTableRow(this.showPercentile, this.cm(1.5), row, {
      text: this.msg25,
      style: 'total',
      alignment: 'center'
    }, {
      text: `${this.percentileFor(GlobalsData.percentile(day.entries, 25))}`,
      style: style,
      alignment: 'right'
    });
    this.addTableRow(this.showPercentile, this.cm(1.5), row, {
      text: this.msgMedian,
      style: 'total',
      alignment: 'center'
    }, {
      text: `${this.percentileFor(GlobalsData.percentile(day.entries, 50))}`,
      style: style,
      alignment: 'right'
    });
    this.addTableRow(this.showPercentile, this.cm(1.5), row, {
      text: this.msg75,
      style: 'total',
      alignment: 'center'
    }, {
      text: `${this.percentileFor(GlobalsData.percentile(day.entries, 75))}`,
      style: style,
      alignment: 'right'
    });
    this.addTableRow(this.showHbA1c, this.cm(1.5), row, {
      text: this.msgHbA1C,
      style: 'total',
      alignment: 'center',
      color: this.colHbA1c
    }, {
      text: `${this.hba1c(day.mid)} %`,
      style: style,
      alignment: 'right',
      color: this.colHbA1c
    });
    this.tableHeadFilled = true;
  }

  getRowAverage(value: number, countForAverage: number, style: string, alignment: string): any {
    const list = [`${GLOBALS.fmtNumber(value, 1)}`];
    if (countForAverage > 1.0) {
      list.push(`${GLOBALS.fmtNumber(value / countForAverage, 1)}`);
    }
    return this.getContent(list, style, alignment);
  }


  getContent(list: string[], style: string, alignment: string): any {
    if (list.length === 1) {
      return {text: list[0], style: style, alignment: alignment};
    }

    const ret: any = {style: style, stack: []};
    for (let i = 0; i < list.length; i++) {
      const text = i === 0
        ? {text: list[i], alignment: alignment}
        : {text: list[i], fontSize: this.fs(8), alignment: alignment};
      ret.stack.push(text);
    }
    return ret;
  }

  percentileFor(value: number): string {
    if (value === -1) {
      return '';
    }
    return GLOBALS.glucFromData(value, 1);
  }

  override fillPages(pages: PageData[]): void {
    const oldLength = pages.length;
    this._fillPages(pages);
    if (GLOBALS.showBothUnits) {
      GLOBALS.glucMGDLIdx = 1;
      this._fillPages(pages);
      GLOBALS.glucMGDLIdx = 2;
    }

    if (this.repData.isForThumbs && pages.length - oldLength > 1) {
      pages.splice(oldLength + 1, pages.length);
    }
  }

  _fillPages(pages: PageData[]): void {
    this.tableHeadFilled = false;
    this.tableHeadLine = [];
    this.tableWidths = [];
    this.titleInfo = this.titleInfoBegEnd();
    let f = 3.3;
    let body: any[] = [];
    // maybe later the margins will work properly, up to now it
    // doesn't work beacause of hardcoded margins in the tablecells
    // this code has to be moved to addRow for operating correctly

    // number colCount = 6;
    // number wid = width - 4.4 - f - 2.0;
    // const widths = [this.cm(2.0), this.cm(f), w, w, w];
    // if (showCount)widths.add(w);
    // widths.add(w);
    // widths.add(w);
    // widths.add(w);
    // if (showStdabw)widths.add(w);
    // if (showPercentile)
    // {
    //   widths.add(this.cm(1.5));
    //   widths.add(this.cm(1.5));
    //   widths.add(this.cm(1.5));
    // }
    // if (showHbA1c)widths.add(this.cm(1.5));

    f /= 100;

    let prevProfile: ProfileGlucData = null;
    let lineCount = 0;
    let page: any[] = [];
    const totalDay = new DayData(null, new ProfileGlucData(new ProfileStoreData('Intern')));
    totalDay.basalData.store.listBasal = [];
    totalDay.basalData.targetHigh = 0;
    totalDay.basalData.targetLow = 1000;
    let totalDays = 0;
    let _maxTDD = 0.0;
    let _basalSum = 0.0;

    for (let i = 0; i < this.repData.data.days.length; i++) {
      const day = this.repData.data.days[GLOBALS.ppLatestFirst ? this.repData.data.days.length - 1 - i : i];
      day.init();
      if (day.entryCountValid == 0) {
        continue;
      }
      _basalSum += day.ieBasalSum(!this.useDailyBasalrate);
      _maxTDD =
        Math.max(_maxTDD, day.ieBasalSum(!this.useDailyBasalrate) + day.ieBolusSum);
    }

    for (let i = 0; i < this.repData.data.days.length; i++) {
      const day = this.repData.data.days[GLOBALS.ppLatestFirst ? this.repData.data.days.length - 1 - i : i];
      if (day.entryCountValid == 0) {
        continue;
      }
      totalDays++;
      Utils.pushAll(totalDay.entries, day.entries);
      Utils.pushAll(totalDay.bloody, day.bloody);
      Utils.pushAll(totalDay.treatments, day.treatments);
      Utils.pushAll(totalDay.profile, day.profile);
      Utils.pushAll(totalDay.basalData.store.listBasal, day.basalData.store.listBasal);
      totalDay.basalData.targetHigh =
        Math.max(totalDay.basalData.targetHigh, day.basalData.targetHigh);
      totalDay.basalData.targetLow =
        Math.min(totalDay.basalData.targetLow, day.basalData.targetLow);
      const row: any[] = [];
      this.fillRow(row, f, [this.fmtDate(day.date, {withShortWeekday: true})], day, 'row');
      const profile = this.repData.profile(new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate()));
      if (prevProfile == null ||
        profile.targetLow != prevProfile.targetLow ||
        profile.targetHigh != prevProfile.targetHigh) {
        body.push(this.tableHeadLine);
        lineCount += 2;
      }
      prevProfile = profile;

      body.push(row);
      lineCount++;
      if (lineCount == 21) {
        page.push(this.headerFooter());
        page.push(this.getTable(this.tableWidths, body));
        lineCount = 0;
        pages.push(new PageData(this.isPortrait, page));
        page = [];
        body = [];
        prevProfile = null;
      }
    }
    const row: any[] = [];
    totalDay.init(null, true);
    this.fillRow(row, f, [`${this.msgDaySum(totalDays)}`, this.msgDayAverage], totalDay, 'total', totalDays);
    body.push(row);

    if (prevProfile != null) {
      page.push(this.headerFooter());
      page.push(this.getTable(this.tableWidths, body));
      pages.push(new PageData(this.isPortrait, page));
    } else {
      const test = Utils.last(Utils.last(pages).content);
      Utils.last(test.columns as any[]).table.body.push(Utils.last(body));
    }
  }
}
