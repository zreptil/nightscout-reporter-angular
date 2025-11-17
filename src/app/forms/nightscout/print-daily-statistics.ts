import {BasePrint} from '@/forms/base-print';
import {LiteralFormat, ParamInfo} from '@/_model/param-info';
import {PdfService} from '@/_services/pdf.service';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {DayData} from '@/_model/nightscout/day-data';
import {PageData} from '@/_model/page-data';
import {ProfileStoreData} from '@/_model/nightscout/profile-store-data';
import {ProfileGlucData} from '@/_model/nightscout/profile-gluc-data';
import {Utils} from '@/classes/utils';
import {DatepickerPeriod} from '@/_model/datepicker-period';

enum GroupType {
  None = 0,
  Week = 1,
  Month = 2
}

class FillParams {
  style: string;
}

export class PrintDailyStatistics extends BasePrint {
  override help = $localize`:help for daystats@@help-daystats:Dieses Formular zeigt die statistischen Werte für die Tage des ausgewählten Zeitraums
an. Für jeden Tag wird eine Zeile erzeugt. Die Spalten kann man teilweise konfigurieren. Auch hier wird der geschätzte
HbA1c ausgegeben. Dieser hat wie auch im Formular @01@ nur sehr wenig Aussagekraft, weshalb er auch hier nur mit
schwächerer Schrift angezeigt wird.`;
  override baseId = 'daystats';
  override baseIdx = '04';
  isFormParam1: boolean;
  override params = [
    new ParamInfo(6, this.msgParamColCount, {boolValue: true}),
    new ParamInfo(9, this.msgParamColStdAbw, {boolValue: true}),
    new ParamInfo(11, this.msgParamColPercentile, {boolValue: true}),
    new ParamInfo(12, this.msgParamHbA1c, {boolValue: true}),
    new ParamInfo(10, this.msgParamColVarK, {boolValue: false}),
    new ParamInfo(3, this.msgParamColBasal, {
      boolValue: false, subParams: [
        new ParamInfo(1, BasePrint.msgUseDailyBasalrate,
          {boolValue: true, isLoopValue: true})
      ]
    }),
    new ParamInfo(8, this.msgParamColKH, {boolValue: false}),
    new ParamInfo(7, this.msgParamColMinMax, {boolValue: false}),
    new ParamInfo(4, this.msgParamColBolus, {boolValue: false}),
    new ParamInfo(5, this.msgParamColTDD, {boolValue: false}),
    new ParamInfo(2, '', {literalFormat: new LiteralFormat(true)}),
    new ParamInfo(0, PrintDailyStatistics.msgParam1, {
      list: [
        $localize`Keine`,
        $localize`1 Woche`,
        $localize`1 Monat`
      ],
      subParams: [new ParamInfo(1, PrintDailyStatistics.msgParam2, {boolValue: true})]
    }),
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
  groupType: GroupType;
  hideGroupDays: boolean;
  override scale = 1.0;

  constructor(ps: PdfService, suffix: string = null) {
    super(ps);
    this.init(suffix);
  }

  static get msgParam1(): string {
    return $localize`Gruppierung der Tage`;
  }

  static get msgParam2(): string {
    return $localize`Zeilen für Tage ausblenden`;
  }

  override get title(): string {
    return $localize`Tagesstatistik`;
  }

  override get estimatePageCount(): any {
    let count = GLOBALS.period?.dayCount ?? 0;
    switch (this.groupType) {
      case GroupType.Week:
        count = count / 7;
        break;
      case GroupType.Month:
        count = count / 30;
        break;
    }
    count = Math.ceil(count / 19);
    return {count: count, isEstimated: this.groupType === GroupType.None};
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
    switch (this.params[11].intValue) {
      case 1:
        this.groupType = GroupType.Week;
        break;
      case 2:
        this.groupType = GroupType.Month;
        break;
      default:
        this.groupType = GroupType.None;
        break;
    }
    this.params[11].subParams[0].isVisible = this.groupType !== GroupType.None;
    this.hideGroupDays = this.params[11].subParams[0].boolValue;
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

  fillRow(row: any, f: number, firstCol: string[], day: DayData, params: FillParams, countForAverage = 1.0): void {
    const deviceKey = 'all';
    this.addTableCol(
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
    this.addTableCol(true, this.cm(f * 100), row, {
      text: text,
      style: 'total',
      alignment: 'center'
    }, {
      style: params.style,
      canvas: [
        {
          type: 'rect',
          color: this.colLow,
          x: this.cm(0),
          y: this.cm(0),
          w: this.cm(day.lowPrz(deviceKey) * f),
          h: this.cm(this.showTDD ? 0.25 : 0.5)
        },
        {
          type: 'rect',
          color: this.colNorm,
          x: this.cm(day.lowPrz(deviceKey) * f),
          y: this.cm(0),
          w: this.cm(day.normPrz(deviceKey) * f),
          h: this.cm(this.showTDD ? 0.25 : 0.5)
        },
        {
          type: 'rect',
          color: this.colHigh,
          x: this.cm((day.lowPrz(deviceKey) + day.normPrz(deviceKey)) * f),
          y: this.cm(0),
          w: this.cm(day.highPrz(deviceKey) * f),
          h: this.cm(this.showTDD ? 0.25 : 0.5)
        },
        this.showTDD
          ? {
            type: 'rect',
            color: this.colBasalDay,
            x: this.cm(0),
            y: this.cm(0.3),
            w: this.cm(day.ieBasalSum(!this.useDailyBasalrate) *
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
            x: this.cm(day.ieBasalSum(!this.useDailyBasalrate) *
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
    this.addTableCol(true, '*', row, {
      text: this.msgLow(this.targets(this.repData).low),
      style: 'total',
      alignment: 'center',
      fillColor: this.colLowBack
    }, {
      text: `${GLOBALS.fmtNumber(day.lowPrz(deviceKey), 0)} %`,
      style: params.style,
      alignment: 'right',
      fillColor: params.style === 'total' ? this.colLowBack : null
    });
    this.addTableCol(true, '*', row, {
      text: this.msgNormal,
      style: 'total',
      alignment: 'center',
      fillColor: this.colNormBack
    }, {
      text: `${GLOBALS.fmtNumber(day.normPrz(deviceKey), 0)} %`,
      style: params.style,
      alignment: 'right',
      fillColor: params.style === 'total' ? this.colNormBack : null
    });
    this.addTableCol(true, '*', row, {
      text: this.msgHigh(this.targets(this.repData).high),
      style: 'total',
      alignment: 'center',
      fillColor: this.colHighBack
    }, {
      text: `${GLOBALS.fmtNumber(day.highPrz(deviceKey), 0)} %`,
      style: params.style,
      alignment: 'right',
      fillColor: params.style === 'total' ? this.colHighBack : null
    });
    this.addTableCol(
      this.showBasal,
      'auto',
      row,
      {
        text: `${this.msgBasal} ${this.msgInsulinUnit}`,
        style: 'total',
        alignment: 'center'
      },
      this.getRowAverage(day.ieBasalSum(!this.useDailyBasalrate), countForAverage,
        params.style, 'right'));
    this.addTableCol(
      this.showBolus,
      'auto',
      row,
      {
        text: `${this.msgBolus} ${this.msgInsulinUnit}`,
        style: 'total',
        alignment: 'center'
      },
      this.getRowAverage(day.ieBolusSum, countForAverage, params.style, 'right'));
    this.addTableCol(
      this.showTDD,
      'auto',
      row,
      {
        text: `${this.msgTDD} ${this.msgInsulinUnit}`,
        style: 'total',
        alignment: 'center'
      },
      this.getRowAverage(day.ieBolusSum + day.ieBasalSum(!this.useDailyBasalrate),
        countForAverage, params.style, 'right'));
    this.addTableCol(this.showCount, 'auto', row, {
      text: this.msgValues,
      style: 'total',
      alignment: 'center'
    }, {
      text: `${GLOBALS.fmtNumber(day.entryCountValid(deviceKey), 0)}`,
      style: params.style,
      alignment: 'right'
    });
    this.addTableCol(this.showValueStats, 'auto', row, {
      text: this.msgMin,
      style: 'total',
      alignment: 'center'
    }, {
      text: `${GLOBALS.glucFromData(day.min(deviceKey))}`,
      style: params.style,
      alignment: 'right'
    });
    this.addTableCol(this.showValueStats, 'auto', row, {
      text: this.msgMax,
      style: 'total',
      alignment: 'center'
    }, {
      text: `${GLOBALS.glucFromData(day.max(deviceKey))}`,
      style: params.style,
      alignment: 'right'
    });
    this.addTableCol(this.showValueStats, 'auto', row, {
      text: this.msgAverage,
      style: 'total',
      alignment: 'center'
    }, {
      text: `${GLOBALS.glucFromData(day.mid(deviceKey), 1)}`,
      style: params.style,
      alignment: 'right'
    });
    this.addTableCol(
      this.showCarbs,
      'auto',
      row,
      {text: 'KH\nin g', style: 'total', alignment: 'center'},
      this.getRowAverage(day.carbs, countForAverage, params.style, 'right'));
    this.addTableCol(this.showCarbs, 'auto', row, {
      text: this.msgKHPerMeal,
      style: 'total',
      alignment: 'center'
    }, {
      text: `${this.carbFromData(day.avgCarbs)}`,
      style: params.style,
      alignment: 'right'
    });
    this.addTableCol(this.showStdabw, 'auto', row, {
      text: this.msgDeviation,
      style: 'total',
      alignment: 'center'
    }, {
      text: `${GLOBALS.fmtNumber(day.stdAbw(GLOBALS.glucMGDL, deviceKey), 1)}`,
      style: params.style,
      alignment: 'right'
    });
    this.addTableCol(this.showVarK, 'auto', row, {
      text: this.msgVarK,
      style: 'total',
      alignment: 'center'
    }, {
      text: `${GLOBALS.fmtNumber(day.varK(deviceKey), 1)}`,
      style: params.style,
      alignment: 'right'
    });
    this.addTableCol(this.showPercentile, this.cm(1.5), row, {
      text: this.msg25,
      style: 'total',
      alignment: 'center'
    }, {
      text: `${this.percentileFor(GlobalsData.percentile(day.entries, 25))}`,
      style: params.style,
      alignment: 'right'
    });
    this.addTableCol(this.showPercentile, this.cm(1.5), row, {
      text: this.msgMedian('all'),
      style: 'total',
      alignment: 'center'
    }, {
      text: `${this.percentileFor(GlobalsData.percentile(day.entries, 50))}`,
      style: params.style,
      alignment: 'right'
    });
    this.addTableCol(this.showPercentile, this.cm(1.5), row, {
      text: this.msg75,
      style: 'total',
      alignment: 'center'
    }, {
      text: `${this.percentileFor(GlobalsData.percentile(day.entries, 75))}`,
      style: params.style,
      alignment: 'right'
    });
    this.addTableCol(this.showHbA1c, this.cm(1.5), row, {
      text: this.msgHbA1C,
      style: 'total',
      alignment: 'center',
      color: this.colHbA1c
    }, {
      text: `${this.hba1c(day.mid(deviceKey))}${this.hba1cUnit(true)}`,
      style: params.style,
      alignment: 'right',
      color: this.colHbA1c,
      fontSize: this.fs(10 / (GLOBALS.ppShowHbA1Cmmol ? 1.5 : 1))
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

  fillTotal(totalDay: DayData, day: DayData): void {
    Utils.pushAll(totalDay.entries, day.entries);
    Utils.pushAll(totalDay.bloody, day.bloody);
    Utils.pushAll(totalDay.treatments, day.treatments);
    Utils.pushAll(totalDay.profile, day.profile);
    Utils.pushAll(totalDay.basalData.store.listBasal, day.basalData.store.listBasal);
    totalDay.basalData.targetHigh =
      Math.max(totalDay.basalData.targetHigh, day.basalData.targetHigh);
    totalDay.basalData.targetLow =
      Math.min(totalDay.basalData.targetLow, day.basalData.targetLow);
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
    const deviceKey = 'all';

    let groupDay = new DayData(null, new ProfileGlucData(new ProfileStoreData('Intern')));
    groupDay.basalData.store.listBasal = [];
    groupDay.basalData.targetHigh = 0;
    groupDay.basalData.targetLow = 1000;
    let groupStart: DayData = null;

    const appendRow =
      (rowTitle: string, rowDay: DayData, params: FillParams, count: number) => {
        const row: any[] = [];
        this.fillRow(row, f, [rowTitle], rowDay, params);
        body.push(row);
        lineCount += count;
        if (lineCount >= 22) {
          page.push(this.headerFooter());
          page.push(this.getTable(this.tableWidths, body));
          lineCount = 0;
          pages.push(new PageData(this.isPortrait, page));
          page = [];
          body = [];
          prevProfile = null;
        }
      };

    let firstDayOfWeek = GLOBALS.period.firstDayOfWeek;
    while (firstDayOfWeek > 6) {
      firstDayOfWeek -= 7;
    }

    for (let i = 0; i < this.repData.data.days.length; i++) {
      const day = this.repData.data.days[GLOBALS.ppLatestFirst ? this.repData.data.days.length - 1 - i : i];
      if (day.entryCountValid(deviceKey) == 0) {
        continue;
      }
      groupStart ??= day;
      totalDays++;
      this.fillTotal(totalDay, day);
      this.fillTotal(groupDay, day);
      const profile = this.repData.profile(new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate())).profile;
      if (prevProfile == null ||
        profile.targetLow != prevProfile.targetLow ||
        profile.targetHigh != prevProfile.targetHigh) {
        body.push(this.tableHeadLine);
        lineCount += 2;
      }
      prevProfile = profile;
      if (this.groupType === GroupType.None || !this.hideGroupDays) {
        appendRow(this.fmtDate(day.date, {withShortWeekday: true}), day, {style: 'row'}, 1);
      }
      if (this.groupType !== GroupType.None && groupStart != null) {
        const nextDay = i < this.repData.data.days.length - 1
          ? this.repData.data.days[GLOBALS.ppLatestFirst ? this.repData.data.days.length - 1 - i - 1 : i + 1]
          : null;
        let title: string[] = [];
        switch (this.groupType) {
          case GroupType.Week:
            // show group row when next day is monday
            if (nextDay == null || Utils.getDow(nextDay?.date) === firstDayOfWeek) {
              title.push(this.fmtDate(groupStart.date, {withShortWeekday: true}));
              title.push(this.fmtDate(day.date, {withShortWeekday: true}));
            }
            break;
          case GroupType.Month:
            // show group row when month of next day is different from month of current day
            if (nextDay?.date?.getMonth() !== day.date.getMonth()) {
              title.push(DatepickerPeriod.monthName(groupStart.date));
              if (groupStart.date.getDate() > 1) {
                title.splice(0, 0, this.fmtDate(groupStart.date, {withShortWeekday: true}));
              }
              if (day.date.getDate() < DatepickerPeriod.daysInMonth(groupStart.date)) {
                title.push(this.fmtDate(day.date, {withShortWeekday: true}));
              }
            }
            break;
        }
        if (title.length > 0) {
          groupDay.init(null, true);
          appendRow(Utils.join(title, '\n'), groupDay, {style: 'total'}, 1.75);
          groupDay = new DayData(null, new ProfileGlucData(new ProfileStoreData('Intern')));
          groupDay.basalData.store.listBasal = [];
          groupDay.basalData.targetHigh = 0;
          groupDay.basalData.targetLow = 1000;
          groupStart = null;
        }
      }
    }
    const row: any[] = [];
    totalDay.init(null, true);
    this.fillRow(row, f, [`${this.msgDaySum(totalDays)}`, this.msgDayAverage], totalDay, {style: 'total'}, totalDays);
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
