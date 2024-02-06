import {BasePrint} from '@/forms/base-print';
import {PageData} from '@/_model/page-data';
import {LiteralFormat, ParamInfo} from '@/_model/param-info';
import {PdfService} from '@/_services/pdf.service';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {EntryData} from '@/_model/nightscout/entry-data';
import {TreatmentData} from '@/_model/nightscout/treatment-data';
import {Utils} from '@/classes/utils';
import {DayData} from '@/_model/nightscout/day-data';
import {LegendData} from '@/_model/legend-data';
import {ProfileEntryData} from '@/_model/nightscout/profile-entry-data';

class PercentileData {
  _entries: EntryData[] = [];

  constructor(public time: Date) {
  }

  get max(): number {
    let ret = -1.0;
    for (const entry of this._entries) {
      if (entry.gluc > 0) {
        ret = Math.max(entry.gluc, ret);
      }
    }
    return ret;
  }

  get min(): number {
    let ret = 10000.0;
    for (const entry of this._entries) {
      if (entry.gluc > 0) {
        ret = Math.min(entry.gluc, ret);
      }
    }
    return ret;
  }

  add(entry: EntryData): void {
    const clone = entry.copy;
    clone.time = this.time;
    this._entries.push(clone);
  }

  percentile(value: number): number {
    return GlobalsData.percentile(this._entries, value);
  }
}

export class PrintPercentile extends BasePrint {
  override help = $localize`:help for percentile@@help-percentile:Dieses Formular zeigt an, wie sich die Glukosewerte im ausgewählten Zeitraum über den Tag
verteilen. Diese Verteilung kann graphisch und tabellarisch ausgegeben werden.

In der Grafik sind die Bereiche für bestimmte Abweichungen farblich markiert. Die Linie zeigt den Medianwert
an. In der Tabelle kann man diese Werte nachlesen. Wenn die Basalrate mit ausgegeben wird, dann ist das die
Basalrate, die zu Beginn des ausgewählten Zeitraums aktiv war.`;
  override baseId = 'percentile';
  override baseIdx = '03';
  isFormParam1: boolean;
  override params = [
    new ParamInfo(0, BasePrint.msgOutput,
      {
        list: [
          BasePrint.msgGraphic,
          BasePrint.msgTable,
          BasePrint.msgAll,
        ],
        thumbValue: 2
      }),
    new ParamInfo(2, PrintPercentile.msgCol1090, {boolValue: false}),
    new ParamInfo(1, PrintPercentile.msgParam1, {boolValue: false}),
    new ParamInfo(3, '', {literalFormat: new LiteralFormat(true)}),
    new ParamInfo(4, PrintPercentile.msgColCount, {boolValue: true}),
    new ParamInfo(5, PrintPercentile.msgColAverage, {boolValue: true}),
    new ParamInfo(6, PrintPercentile.msgColMin, {boolValue: true}),
    new ParamInfo(7, PrintPercentile.msgColMax, {boolValue: true}),
    new ParamInfo(8, PrintPercentile.msgColStdAbw, {boolValue: true}),
    new ParamInfo(9, PrintPercentile.msgColKH, {boolValue: false}),
    new ParamInfo(10, PrintPercentile.msgColIE, {boolValue: false})
  ];
  colBasal = '#0097a7';
  glucMax = 0.0;
  _basalHeight: number;
  _basalWidth: number;
  _profMax: number;
  _colWidth: number;
  showGPD: boolean;
  showTable: boolean;
  showCol1090: boolean;
  showBasal: boolean;
  showColKH: boolean;
  showColIE: boolean;
  showColCount: boolean;
  showColAverage: boolean;
  showColMin: boolean;
  showColMax: boolean;
  showColStdAbw: boolean;
  lineWidth: number;
  override hasDevicePages = true;

  constructor(ps: PdfService, suffix: string = null) {
    super(ps);
    this.init(suffix);
    this._title = BasePrint.titleGPD;
  }

  static get msgParam1(): string {
    return $localize`Basalrate anzeigen`;
  }

  static get msgColCount(): string {
    return $localize`Spalte Messwerte anzeigen`;
  }

  static get msgColAverage(): string {
    return $localize`Spalte Mittelwert anzeigen`;
  }

  static get msgColMin(): string {
    return $localize`Spalte Min anzeigen`;
  }

  static get msgColMax(): string {
    return $localize`Spalte Max anzeigen`;
  }

  static get msgColStdAbw(): string {
    return $localize`Spalte Std.Abw. anzeigen`;
  }

  static get msgColKH(): string {
    return $localize`Spalte KH anzeigen`;
  }

  static get msgColIE(): string {
    return $localize`Spalte IE anzeigen`;
  }

  static get msgCol1090(): string {
    return $localize`Spalten für 10% und 90% anzeigen`;
  }

  _gridHeight: number;

  get gridHeight(): number {
    return this._gridHeight;
  }

  get gridWidth(): number {
    return this.width - 7.0;
  }

  _title: string = null;

  override get title(): string {
    if (this._title != null) {
      return this._title;
    }
    return this.isPortrait ? BasePrint.titleGPDShort : BasePrint.titleGPD;
  }

  override get backsuffix(): string {
    let ret = this.params[0].intValue ?? 0;
    if (this.showBasal && ret === 0) {
      ret = 3;
    }
    if (this.showBasal && ret === 2) {
      ret = 4;
    }
    return `${ret}`;
  }

  override get estimatePageCount(): any {
    const ret: any = {count: this.showGPD && this.showTable ? 2 : 1, isEstimated: true};
    if (this.repData?.deviceFilter.length > 1 || this.repData?.deviceFilter?.[0] !== 'all') {
      ret.count = ret.count * (this.repData?.deviceFilter.length ?? 1);
    }
    return ret;
  }

  static msgBasalInfo1(unit: string): string {
    return $localize`:@@msgBasalInfo1:Diese Basalrate war am ${unit} aktiv.`;
  }

  glucY(value: number): number {
    return this.gridHeight / this.glucMax * (this.glucMax - value);
  }

  glucX(time: Date): number {
    return this.gridWidth / 1440 * (time.getHours() * 60 + time.getMinutes());
  }

  override checkValue(param: ParamInfo, value: any): void {
    if (this.params == null) {
      return;
    }
    const list = [4, 5, 6, 7, 8, 9, 10];
    for (const idx of list) {
      const p = this.params[idx];
      p.isVisible = this.params[0].intValue != 0;
    }

    this.params[1].isVisible = this.params[0].intValue !== 0;
    this.params[2].isVisible = this.params[0].intValue !== 1;
    this.params[3].isVisible = this.params[0].intValue !== 0;

    let count = 0;
    for (const idx of list) {
      const p = this.params[idx];
      if (p.boolValue) {
        count++;
      }
    }
    for (const idx of list) {
      const p = this.params[idx];
      if (count > 4) {
        if (!p.boolValue) {
          p.isDisabled = true;
        }
      } else {
        p.isDisabled = false;
      }
    }
    this.params[3].title = this.msgColumns(5 - count);
  }

  override extractParams(): void {
    this.showGPD = this.params[0].intValue === 0 || this.params[0].intValue === 2 || this.params[0].intValue == null;
    this.showTable = this.params[0].intValue === 1 || this.params[0].intValue === 2 || this.params[0].intValue == null;
    this.showCol1090 = this.params[1].boolValue;
    this.showBasal = this.params[2].boolValue;
    this.showColCount = this.params[4].boolValue;
    this.showColAverage = this.params[5].boolValue;
    this.showColMin = this.params[6].boolValue;
    this.showColMax = this.params[7].boolValue;
    this.showColStdAbw = this.params[8].boolValue;
    this.showColKH = this.params[9].boolValue;
    this.showColIE = this.params[10].boolValue;
    this.pagesPerSheet = 1;
  }

  override fillPages(pages: PageData[]): void {
    // const deviceKey = 'all';
    for (const deviceKey of this.repData.deviceFilter) {
      this.isPortrait = false;
      this._title = null;
      this.titleInfo = this.titleInfoBegEnd();
      let hasData = true;
      if (this.showGPD) {
        hasData = this.getPage(pages, deviceKey);
      }
      if (this.showTable && hasData) {
        this.getTablePage(pages, deviceKey);
      }
      if (GLOBALS.showBothUnits) {
        GLOBALS.glucMGDLIdx = 1;
        if (this.showGPD) {
          hasData = this.getPage(pages, deviceKey);
        }
        if (this.showTable && hasData) {
          this.getTablePage(pages, deviceKey);
        }
        GLOBALS.glucMGDLIdx = 2;
      }
    }
    this.isPortrait = false;
    this._title = null;
  }

  getPage(pages: PageData[], deviceKey: string): boolean {
    this.isPortrait = this.showBasal;
    // the height of the grid is calculated so that the scale of the graphic looks the same
    // in portrait and landscape mode. formula for portrait is:
    // landscapewidth / landscapeheight * portraitwidth
    this._gridHeight = this.isPortrait ? (this.width - 7) / (this.height - 7) * (this.width - 11) : this.height - 11.0;

    // this.title = this._title;
    this.subtitle = this.isPortrait ? BasePrint.titleGPD : '';
    const xo = this.xorg;
    const yo = this.yorg;
    const data = this.repData.data;
    this.lineWidth = this.cm(0.03);

    const percList: PercentileData[] = [];
    for (const entry of data.entriesFor(deviceKey)) {
      if (entry.gluc < 0) {
        continue;
      }
      const time = new Date(0, 0, 1, entry.time.getHours(), entry.time.getMinutes());
      let src = percList.find((e) => e.time.getTime() === time.getTime());
      if (src == null) {
        percList.push(new PercentileData(time));
        src = Utils.last(percList);
      }
      src.add(entry);
    }

    percList.sort((a, b) => Utils.compareDate(a.time, b.time));

    this.glucMax = 0.0;
    for (const data of percList) {
      this.glucMax = Math.max(data.percentile(90), this.glucMax);
    }

    if (GLOBALS.glucMaxValue != null) {
      this.glucMax = GLOBALS.glucMaxValues[GLOBALS.ppGlucMaxIdx];
    }

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

    const vertCvs = vertLines.canvas as any[];
    const horzCvs = horzLines.canvas as any[];
    const horzStack = horzLegend.stack as any[];
    const vertStack = vertLegend.stack as any[];

    const grid = this.drawGraphicGrid(
      this.glucMax, this.gridHeight, this.gridWidth, vertCvs, horzCvs, horzStack, vertStack,
      {horzfs: this.fs(this.isPortrait ? 6 : 8)});
    if (grid.lineHeight === 0) {
      pages.push(new PageData(this.isPortrait, [
        this.headerFooter(),
        {
          relativePosition: {x: this.cm(this.xorg), y: this.cm(this.yorg)},
          text: this.msgMissingData,
          pageBreak: '-'
        }
      ]));
      return false;
    }
    this.glucMax = grid.gridLines * grid.glucScale;
    const yHigh = this.glucY(this.targets(this.repData).low);
    const yLow = this.glucY(this.targets(this.repData).high);
    const limitLines = {
      relativePosition: {x: this.cm(xo), y: this.cm(yo)},
      canvas: [
        {
          type: 'rect',
          x: this.cm(0.0),
          y: this.cm(yHigh),
          w: this.cm(24 * grid.colWidth),
          h: this.cm(yLow - yHigh),
          color: '#00ff00',
          fillOpacity: 0.5
        },
        {
          type: 'line',
          x1: this.cm(0.0),
          y1: this.cm(yHigh),
          x2: this.cm(24 * grid.colWidth),
          y2: this.cm(yHigh),
          lineWidth: this.cm(this.lw),
          lineColor: '#00aa00'
        },
        {
          type: 'line',
          x1: this.cm(0.0),
          y1: this.cm(yLow),
          x2: this.cm(24 * grid.colWidth),
          y2: this.cm(yLow),
          lineWidth: this.cm(this.lw),
          lineColor: '#00aa00'
        },
        {
          type: 'rect',
          x: 0,
          y: 0,
          w: 0,
          h: 0,
          color: '#000000',
          fillOpacity: 1
        }
      ]
    };
    const percGraph: any = {
      relativePosition: {x: this.cm(xo), y: this.cm(yo)},
      canvas: [],
      pageBreak: '-'
    };
    const percLegend = new LegendData(
      this.cm(xo),
      this.cm(yo + grid.lineHeight * grid.gridLines + (this.showBasal ? 1.0 : 2.0)),
      this.cm(8.0),
      100);
    //    const percLegend = LegendData(this.cm(xo), this.cm(height - 5.0), this.cm(8.0), 100);
    if (this.addPercentileGraph(percGraph, percList, 10, 90, '#aaaaff')) {
      this.addLegendEntry(percLegend, '#aaaaff', this.msgPercentile1090);
    }
    if (this.addPercentileGraph(percGraph, percList, 25, 75, '#8888ff')) {
      this.addLegendEntry(percLegend, '#8888ff', this.msgPercentile2575);
    }
    this.addPercentileGraph(percGraph, percList, 50, 50, '#000000');
    this.addLegendEntry(percLegend, '#000000', this.msgMedian(deviceKey), {isArea: false});
    this.addLegendEntry(percLegend, '#00ff00',
      this.msgTargetArea(
        GLOBALS.glucFromData(this.targets(this.repData).low),
        GLOBALS.glucFromData(this.targets(this.repData).high),
        GLOBALS.getGlucInfo().unit)
    );

    let profileBasal;
    if (this.showBasal) {
      // graphic for basalrate
      this._profMax = -1000.0;
      this._basalHeight = this.gridHeight;
      this._basalWidth = this.gridWidth;
      this._colWidth = this._basalWidth / 24;
      for (const entry of Utils.first(data.days).basalData.store.listBasal) {
        this._profMax = Math.max((entry.value ?? 0) + 0.2, this._profMax);
      }

      const y = this.gridHeight + 4.0;
      this.drawScaleIE(
        xo,
        yo,
        this._basalHeight,
        y,
        0.0,
        this._profMax,
        this._colWidth,
        horzCvs,
        vertStack,
        [this.S(3, 0.5), this.S(1.5, 0.2), this.S(0, 0.1)],
        (i, step, value) =>
          `${GLOBALS.fmtNumber(value ?? i * step, 1)} ${this.msgInsulinUnit}`);
      horzCvs.push({
        type: 'line',
        x1: this.cm(0),
        y1: this.cm(y + this._basalHeight) - this.lw / 2,
        x2: this.cm(24 * this._colWidth),
        y2: this.cm(y + this._basalHeight) - this.lw / 2,
        lineWidth: this.cm(this.lw),
        lineColor: this.lcFrame
      });

      profileBasal = this.getBasalGraph(y, Utils.first(data.days), true, xo, yo);
      // draw vertical lines with times below graphic
      for (let i = 0; i < 25; i++) {
        vertCvs.push({
          type: 'line',
          x1: this.cm(i * this._colWidth),
          y1: this.cm(y),
          x2: this.cm(i * this._colWidth),
          y2: this.cm(y + this._basalHeight - this.lw / 2),
          lineWidth: this.cm(this.lw),
          lineColor: i > 0 && i < 24 ? this.lc : this.lcFrame
        });
        if (i < 24) {
          horzStack.push({
            relativePosition: {
              x: this.cm(this.xorg + i * this._colWidth),
              y: this.cm(this.yorg + y + this._basalHeight + 0.05)
            },
            text: this.fmtTime(i),
            fontSize: this.fs(6)
          });
        }
      }

      horzStack.push({
        relativePosition: {
          x: this.cm(this.xorg),
          y: this.cm(this.yorg + y + this._basalHeight + 1.0)
        },
        text: PrintPercentile.msgBasalInfo1(this.fmtDate(this.repData.begDate))
      });
    }

    pages.push(new PageData(this.isPortrait, [
        this.headerFooter(),
        profileBasal,
        vertLegend,
        vertLines,
        horzLegend,
        horzLines,
        limitLines,
        percLegend.asOutput,
        percGraph
      ]
    ));

    this._title = null;
    return true;
  }

  fillDebugRow(type: string, row: any, f1: number, hour: number,
               entryList: EntryData[], treatList: TreatmentData[], style: string): number {
    // const firstCol = `${GLOBALS.fmtNumber(hour, 0, 2)}:00`;
    const day = new DayData(
      null,
      this.repData.profile(new Date(
        this.repData.begDate.getFullYear(),
        this.repData.begDate.getMonth(),
        this.repData.begDate.getDate())).profile);
    Utils.pushAll(day.entries, entryList);
    Utils.pushAll(day.treatments, treatList);
    day.init();
    const time = new Date(0, 1, 1, hour);
    const perc = new PercentileData(time);
    for (const entry of entryList) {
      if (entry.gluc < 0) {
        continue;
      }
      perc.add(entry);
    }

    // const wid = 2.0 / 100.0;
    // let colcount = this.showCol1090 ? 10 : 8;
    let colcount = 5;
    colcount += this.showCol1090 ? 3 : 0;
    colcount += this.showColKH ? 1 : 0;
    colcount += this.showColIE ? 1 : 0;
    colcount += this.showColCount ? 1 : 0;
    colcount += this.showColAverage ? 1 : 0;
    colcount += this.showColMin ? 1 : 0;
    colcount += this.showColMax ? 1 : 0;
    colcount += this.showColStdAbw ? 1 : 0;
    const f = this.fs(this.showCol1090 ? 7 : 10);
    // const w = (this.width - 4.0 - 2.0 - wid * 100) / colcount - 0.45;
    // const h = this.showCol1090 ? 0.35 : 0.5;
    let value: any = {value: 0.0};
    let label = '';
    switch (type) {
      case 'carbs':
        value = day.avgCarbsPerDay;
        label = this.msgCarbShort;
        break;
      case 'insulin':
        value = day.avgInsulinPerDay;
        label = this.msgGluc;
        break;
    }
    let ret = 0;
    if (value.value >= 0.1) {
      const text = JSON.stringify(value.dbg);
      this.addTableRow(true, this.cm(2.0), row, {
        text: label,
        style: 'total',
        alignment: 'center',
        fontSize: f
      }, {
        text: label,
        style: 'total',
        alignment: 'left',
        fontSize: f
      });
      this.addTableRow(true, this.cm(this.width - 2.0), row, {
        text: label,
        style: 'total',
        alignment: 'center',
        fontSize: f
      }, {
        text: text,
        style: style,
        alignment: 'right',
        colSpan: colcount - 1,
        fontSize: f
      });
      ret = Math.floor(text.length / 100) + 1;
    }

    return ret;
  }

  fillRow(row: any, f1: number, hour: number, entryList: EntryData[],
          treatList: TreatmentData[], style: string, deviceKey: string): void {
    const firstCol = `${GLOBALS.fmtNumber(hour, 0, 2)}:00`;
    const day = new DayData(
      null,
      this.repData.profile(new Date(
        this.repData.begDate.getFullYear(),
        this.repData.begDate.getMonth(),
        this.repData.begDate.getDate())).profile);
    Utils.pushAll(day.entries, entryList);
    Utils.pushAll(day.treatments, treatList);
    day.init();
    const time = new Date(0, 1, 1, hour);
    const perc = new PercentileData(time);
    for (const entry of entryList) {
      if (entry.gluc < 0) {
        continue;
      }
      perc.add(entry);
    }
    // for (EntryData entry in list)
    // {
    //   if (entry.gluc > 0)
    //   {
    //     average += entry.gluc;
    //     count++;
    //     if (entry.gluc < min)min = entry.gluc;
    //     if (entry.gluc > max)max = entry.gluc;
    //   }
    // }
    // average /= count;

    const wid = 2.0 / 100.0;
    const colcount = this.showCol1090 ? 10 : 8;
    const f = this.fs(this.showCol1090 ? 7 : 10);
    const w = (this.width - 4.0 - 2.0 - wid * 100) / colcount - 0.45;
    const h = this.showCol1090 ? 0.35 : 0.5;
    this.addTableRow(true, this.cm(2.0), row, {
      text: this.msgTime,
      style: 'total',
      alignment: 'center',
      fontSize: f
    }, {
      text: firstCol,
      style: 'total',
      alignment: 'center',
      fontSize: f
    });
    let canvas = [
      {
        type: 'rect',
        color: this.colLow,
        x: this.cm(0),
        y: this.cm(0),
        w: this.cm(day.lowPrz(deviceKey) * wid),
        h: this.cm(h)
      },
      {
        type: 'rect',
        color: this.colNorm,
        x: this.cm(day.lowPrz(deviceKey) * wid),
        y: this.cm(0),
        w: this.cm(day.normPrz(deviceKey) * wid),
        h: this.cm(h),
      },
      {
        type: 'rect',
        color: this.colHigh,
        x: this.cm((day.lowPrz(deviceKey) + day.normPrz(deviceKey)) * wid),
        y: this.cm(0),
        w: this.cm(day.highPrz(deviceKey) * wid),
        h: this.cm(h)
      }
    ];
    if (day.entryCountValid(deviceKey) === 0) {
      canvas = [];
    }
    this.addTableRow(true, this.cm(wid * 100), row, {
      text: this.msgDistribution,
      style: 'total',
      alignment: 'center',
      fontSize: f
    }, {
      style: style,
      canvas: canvas
    });
    if (this.showColCount) {
      this.addTableRow(true, this.cm(w), row, {
        text: this.msgValues,
        style: 'total',
        alignment: 'center',
        fontSize: f
      }, {
        text: `${GLOBALS.fmtNumber(day.entryCountValid(deviceKey), 0)}`,
        style: style,
        alignment: 'right',
        fontSize: f
      });
    }
    if (this.showColAverage) {
      this.addTableRow(true, this.cm(w), row, {
        text: this.msgAverage,
        style: 'total',
        alignment: 'center',
        fontSize: f
      }, {
        text: `${GLOBALS.glucFromData(day.avgGluc(deviceKey), 1)}`,
        style: style,
        alignment: 'right',
        fontSize: f
      });
    }
    if (this.showColMin) {
      this.addTableRow(true, this.cm(w), row, {
        text: this.msgMin,
        style: 'total',
        alignment: 'center',
        fontSize: f
      }, {
        text: `${GLOBALS.glucFromData(day.minText(deviceKey), 1)}`,
        style: style,
        alignment: 'right',
        fontSize: f
      });
    }
    //*
    if (this.showCol1090) {
      this.addTableRow(true, this.cm(w), row, {
        text: this.msg10,
        style: 'total',
        alignment: 'center',
        fontSize: f
      }, {
        text: `${GLOBALS.glucFromData(perc.percentile(10), 1)}`,
        style: style,
        alignment: 'right',
        fontSize: f
      });
    }
    this.addTableRow(true, this.cm(w), row, {
      text: this.msg25,
      style: 'total',
      alignment: 'center',
      fontSize: f
    }, {
      text: `${GLOBALS.glucFromData(perc.percentile(25), 1)}`,
      style: style,
      alignment: 'right',
      fontSize: f
    });
    this.addTableRow(true, this.cm(w), row, {
      text: this.msgMedian(deviceKey),
      style: 'total',
      alignment: 'center',
      fontSize: f
    }, {
      text: `${GLOBALS.glucFromData(perc.percentile(50), 1)}`,
      style: style,
      alignment: 'right',
      fontSize: f
    });
    this.addTableRow(true, this.cm(w), row, {
      text: this.msg75,
      style: 'total',
      alignment: 'center',
      fontSize: f
    }, {
      text: `${GLOBALS.glucFromData(perc.percentile(75), 1)}`,
      style: style,
      alignment: 'right',
      fontSize: f
    });
    if (this.showCol1090) {
      this.addTableRow(true, this.cm(w), row, {
        text: this.msg90,
        style: 'total',
        alignment: 'center',
        fontSize: f
      }, {
        text: `${GLOBALS.glucFromData(perc.percentile(90), 1)}`,
        style: style,
        alignment: 'right',
        fontSize: f
      });
    }
    if (this.showColMax) {
      this.addTableRow(true, this.cm(w), row, {
        text: this.msgMax,
        style: 'total',
        alignment: 'center',
        fontSize: f
      }, {
        text: `${GLOBALS.glucFromData(day.maxText(deviceKey), 1)}`,
        style: style,
        alignment: 'right',
        fontSize: f
      });
    }
    if (this.showColStdAbw) {
      this.addTableRow(true, this.cm(w), row, {
        text: this.msgDeviation,
        style: 'total',
        alignment: 'center',
        fontSize: f
      }, {
        text: `${GLOBALS.fmtNumber(day.stdAbw(GLOBALS.glucMGDL, deviceKey), 1)}`,
        style: style,
        alignment: 'right',
        fontSize: f
      });
    }
    if (this.showColKH) {
      const value = day.avgCarbsPerDay;
      this.addTableRow(true, this.cm(w), row, {
        text: this.msgCarbShort,
        style: 'total',
        alignment: 'center',
        fontSize: f
      }, {
        text: value['value'] >= 0.1 ? GLOBALS.fmtNumber(value['value'], 1) : '',
        style: style,
        alignment: 'right',
        fontSize: f
      });
    }
    if (this.showColIE) {
      const value = day.avgInsulinPerDay;
      this.addTableRow(true, this.cm(w), row, {
        text: this.msgGluc,
        style: 'total',
        'alignment': 'center',
        fontSize: f
      }, {
        text: value['value'] >= 0.1 ? GLOBALS.fmtNumber(value['value'], 1) : '',
        style: style,
        alignment: 'right',
        fontSize: f
      });
    }
    this.tableHeadFilled = true;
  }

  getTablePage(pages: PageData[], deviceKey: string): void {
    const savePortrait = this.isPortrait;
    this.isPortrait = true;
    let body = [];
    let f = 3.3;
    f /= 100;

    this.tableHeadFilled = false;
    this.tableHeadLine = [];
    this.tableWidths = [];
    this.yorg -= 0.5;

    let y = this.yorg;
    for (let i = 0; i < 24; i++) {
      const entryList: EntryData[] = [];
      const treatList: TreatmentData[] = [];
      for (const day of this.repData.data.days) {
        const entries = day.entriesFor(deviceKey).filter((e) => e.time.getHours() === i);
        Utils.pushAll(entryList, entries);
        const treatments = day.treatments.filter((e) => e.createdAt.getHours() === i);
        Utils.pushAll(treatList, treatments);
      }
      let row: any[] = [];
      this.fillRow(row, f, i, entryList, treatList, 'row', deviceKey);

      if (Utils.isEmpty(body)) {
        body.push(this.tableHeadLine);
      }
      body.push(row);
      y += 0.6;

      if (GLOBALS.isDebug) {
        row = [];
        let lines = this.fillDebugRow('carbs', row, f, i, entryList, treatList, 'row');
        if (row.length > 0) {
          body.push(row);
          y += 0.6 * lines;
        }
        row = [];
        lines = this.fillDebugRow('insulin', row, f, i, entryList, treatList, 'row');
        if (row.length > 0) {
          body.push(row);
          y += 0.6 * lines;
        }
      }

      if (y > 23 && i < 23) {
        this._title = BasePrint.msgHourlyStats;
        this.subtitle = '';
        const hf = this.headerFooter();
        const content = [hf, this.getTable(this.tableWidths, body)];
        pages.push(new PageData(this.isPortrait, content));
        this._title = null;
        y = this.yorg;
        body = [];
      }
    }
    this.yorg += 0.5;

    this._title = BasePrint.msgHourlyStats;
    this.subtitle = '';
    const table = this.getTable(this.tableWidths, body);
    table.pageBreak = '-';
    pages.push(new PageData(this.isPortrait, [
      this.headerFooter(),
      table
    ]));
    this._title = null;
    this.isPortrait = savePortrait;
  }

  addPercentileGraph(percGraph: any, percList: PercentileData[], low: number,
                     high: number, color: string): boolean {
    let ret = high === low;
    const ptsLow: any[] = [];
    const ptsHigh: any[] = [];

    let x = 0.0;
    for (const entry of percList) {
      if (entry.percentile(high) != entry.percentile(low)) {
        ret = true;
      }
      x = this.glucX(entry.time);
      ptsHigh.push({x: this.cm(x), y: this.cm(this.glucY(entry.percentile(high)))});
      if (high != low) {
        ptsLow.splice(0, 0, {x: this.cm(x), y: this.cm(this.glucY(entry.percentile(low)))});
      }
    }
    x = this.glucX(new Date(0, 1, 1, 23, 59, 59));
    ptsHigh.push({x: this.cm(x), y: this.cm(this.glucY(Utils.first(percList)?.percentile(high) ?? 0))});
    if (high !== low) {
      ptsLow.splice(0, 0, {x: this.cm(x), y: this.cm(this.glucY(Utils.first(percList)?.percentile(low) ?? 0))});
    }
    const area: any = {
      type: 'polyline',
      lineWidth: this.cm(this.lw),
      closePath: high != low,
      fillOpacity: 0.5,
      points: []
    };
    Utils.pushAll(area.points, ptsHigh);
    if (high !== low) {
      area.color = color;
      Utils.pushAll(area.points, ptsLow);
    }
    percGraph.canvas.push(area);
    percGraph.canvas.push({
      type: 'rect',
      x: 0,
      y: 0,
      w: 0,
      h: 0,
      color: '#000000',
      fillOpacity: 1
    });
    percGraph.canvas.push({
      type: 'polyline',
      lineWidth: this.cm(this.lw),
      closePath: false,
      lineColor: color,
      points: ptsHigh
    });
    percGraph.canvas.push({
      type: 'polyline',
      lineWidth: this.cm(this.lw),
      closePath: false,
      lineColor: color,
      points: ptsLow
    });

    return ret;
  }

  basalX(time: Date): number {
    return this._basalWidth / 1440 * (time.getHours() * 60 + time.getMinutes());
  }

  basalY(value: number): number {
    return this._profMax != 0 && value != null
      ? this._basalHeight - (this._basalHeight / this._profMax * value)
      : 0.0;
  }

  getBasalGraph(top: number, day: DayData, useProfile: boolean, xo: number, yo: number): any {
    let data: ProfileEntryData[];
    let color: string;

    if (useProfile) {
      data = day.basalData.store.listBasal;
      color = this.colBasalProfile;
    } else {
      data = day.profile;
      color = this.colBasalProfile;
    }

    let basalCvs: any[] = [];
    const ret = {
      stack: [
        {
          relativePosition: {x: this.cm(xo), y: this.cm(yo + top)},
          canvas: basalCvs
        }
      ]
    };
    let lastY: number = null;
    const areaPoints: any[] = [];
    const area = {
      type: 'polyline',
      lineWidth: this.cm(this.lw),
      closePath: true,
      color: color,
      //blendColor(color, '#ffffff', 0.7),
      points: areaPoints,
      //      fillOpacity: opacity
    };

    const temp: ProfileEntryData[] = [];
    for (const entry of data) {
      temp.push(entry);
    }

    if (useProfile && !Utils.isEmpty(temp)) {
      temp.sort((a, b) =>
        Utils.compareDate(a.time(day.date, useProfile), b.time(day.date, useProfile)));

      if (temp[0].timeAsSeconds != -temp[0].localDiff * 60 * 60) {
        const clone = temp[0].clone(new Date(0, 1, 1, -temp[0].localDiff, 0));
        temp.splice(0, 0, clone);
      }
    }

    areaPoints.push({
      x: this.cm(this.basalX(new Date(0, 1, 1, 0, 0))),
      y: this.cm(useProfile ? this.basalY(0.0) : this._basalHeight)
    });
    for (const entry of temp) {
      const x = this.basalX(entry.time(day.date, useProfile));
      const y = useProfile
        ? this.basalY(entry.value)
        : this._basalHeight / this._profMax * (this._profMax - entry.tempAdjusted * 100);
      if (lastY != null) {
        areaPoints.push({x: this.cm(x), y: this.cm(lastY)});
      }
      areaPoints.push({x: this.cm(x), y: this.cm(y)});
      lastY = y;
    }
    if (lastY != null) {
      areaPoints.push({x: this.cm(this.basalX(new Date(0, 1, 1, 23, 59))), y: this.cm(lastY)});
    }

    areaPoints.push({
      x: this.cm(this.basalX(new Date(0, 1, 1, 23, 59))),
      y: this.cm(useProfile ? this.basalY(0.0) : this._basalHeight)
    });
    basalCvs.push(area);

    return ret;
  }
}
