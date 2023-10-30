import {BasePrint} from '@/forms/base-print';
import {PageData} from '@/_model/page-data';
import {ParamInfo} from '@/_model/param-info';
import {PdfService} from '@/_services/pdf.service';
import {Utils} from '@/classes/utils';
import {DatepickerPeriod} from '@/_model/datepicker-period';
import {LegendData} from '@/_model/legend-data';
import {GLOBALS} from '@/_model/globals-data';

export class PrintTDD extends BasePrint {
  override help = $localize`:help for tdd@@help-tdd:Dieses Formular zeigt
  Auswertungen über den gesamten Zeitraum an.`;
  override baseId = 'tdd';
  override baseIdx = '16';
  showTIR: boolean;
  showTDD: boolean;
  showCarbs: boolean;
  showLegends: boolean;
  showWeekdayNames: boolean;
  override params = [
    new ParamInfo(0, $localize`Zeit im Zielbereich (TIR)`, {boolValue: true}),
    new ParamInfo(1, $localize`Gesamtinsulin (TDD)`, {boolValue: true}),
    new ParamInfo(2, $localize`Kohlenhydrate`, {boolValue: true}),
    new ParamInfo(3, $localize`Legende`, {boolValue: true}),
    new ParamInfo(4, $localize`Wochentagsnamen`, {boolValue: true}),
  ];

  override _isPortrait = false;
  graphWidth: number;
  graphHeight: number;
  _colWidth: number;

  constructor(ps: PdfService, suffix: string = null) {
    super(ps);
    this.init(suffix);
  }

  override get title(): string {
    return $localize`Zeitraumauswertung`;
  }

  override get estimatePageCount(): any {
    return {count: 1, isEstimated: false};
  }

  override fillPages(pages: PageData[]): void {
    const oldLength = pages.length;
    const page = new PageData(this.isPortrait, [this.headerFooter({skipFooter: true})]);
    pages.push(this.getPage());
    if (this.repData.isForThumbs && pages.length - oldLength > 1) {
      pages.splice(oldLength + 1, pages.length);
    }
  }

  override extractParams(): void {
    this.showTIR = this.params[0].boolValue;
    this.showTDD = this.params[1].boolValue;
    this.showCarbs = this.params[2].boolValue;
    this.showLegends = this.params[3].boolValue;
    this.showWeekdayNames = this.params[4].boolValue;
  }

  periodGrid(grid: any, yo: number, height: number, maxValue: number, maxScale: number, fmt: (value: number) => string): any {
    const xo = this.xorg;
    const data = this.repData.data;
    this._colWidth = this.graphWidth / data.days.length;
    for (const i of [0, data.days.length]) {
      const line: any = {
        type: 'line',
        x1: this.cm(i * this._colWidth),
        y1: this.cm(yo),
        x2: this.cm(i * this._colWidth),
        y2: this.cm(yo + height),
        lineWidth: this.cm(this.lw),
        lineColor: this.lcFrame
      };
      grid.frontLines.canvas.push(line);
    }
    const line: any = {
      type: 'line',
      x1: this.cm(0),
      y1: this.cm(yo + height),
      x2: this.cm(this.graphWidth),
      y2: this.cm(yo + height),
      lineWidth: this.cm(this.lw),
      lineColor: this.lcFrame
    };
    grid.frontLines.canvas.push(line);

    let nextPos = xo;
    const diff = this.showWeekdayNames ? 1.0 : 0.6;
    for (let i = 0; i < data.days.length; i++) {
      const day = data.days[i];
      const x = xo + i * this._colWidth;
      let y2 = yo + height;
      if (x >= nextPos) {
        let text = `${DatepickerPeriod.dowShortNames[Utils.getDow(day.date)]},${Utils.fmtDate(day.date, 'dd.MM.')}`;
        if (!this.showWeekdayNames) {
          text = `${Utils.fmtDate(day.date, $localize`dd.MM.`)}`;
          ;
        }
        grid.horzLegend.stack.push({
          relativePosition: {
            x: this.cm(x + 0.05),
            y: this.cm(this.yorg + yo + height + 0.05)
          },
          text: text,
          fontSize: this.fs(7)
        });
        nextPos = x + diff;
        y2 += 0.4;
      }
      grid.vertLines.canvas.push({
        type: 'line',
        x1: this.cm(i * this._colWidth),
        y1: this.cm(yo),
        x2: this.cm(i * this._colWidth),
        y2: this.cm(y2),
        lineWidth: this.cm(this.lw),
        lineColor: this.lc
      });
    }

    if (maxValue != null && fmt != null) {
      const y = yo + height - height * maxScale;
      grid.horzLines.canvas.push({
        type: 'line',
        x1: this.cm(0),
        y1: this.cm(y),
        x2: this.cm(this.graphWidth + 0.2),
        y2: this.cm(y),
        lineWidth: this.cm(this.lw),
        lineColor: this.lc
      });
      grid.horzLegend.stack.push({
        absolutePosition: {
          x: this.cm(0),
          y: this.cm(this.yorg + y - 0.15)
        },
        columns: [
          {
            width: this.cm(xo - 0.2),
            text: `${fmt(maxValue)}`,
            fontSize: this.fs(7),
            alignment: 'right',
          }
        ]
        // absolutePosition: {
        //   x: this.cm(0),
        //   y: this.cm(this.yorg + y - 0.15)
        // },
        // text: `${maxValue}`,
        // fontSize: this.fs(7),
        // alignment: 'right',
        // width: this.cm(xo)
      });
    }
  }

  getPage(): PageData {
    this.titleInfo = this.titleInfoBegEnd();
    const data = this.repData.data;
    const xo = this.xorg;
    this.graphWidth = this.width - 6.7;
    this.graphHeight = (this.height - 7.0);
    let graphCount = 0;
    if (this.showTIR) {
      graphCount++;
    }
    if (this.showTDD) {
      graphCount++;
    }
    if (this.showCarbs) {
      graphCount++;
    }
    if (graphCount === 0) {
      return new PageData(this.isPortrait, [
        this.headerFooter()]);
    }
    this.graphHeight /= graphCount;
    this._colWidth = this.graphWidth / data.days.length;
    const grid: any = {
      vertLines: {
        relativePosition: {x: this.cm(xo), y: this.cm(this.yorg)},
        canvas: []
      }, horzLines: {
        relativePosition: {x: this.cm(xo - 0.2), y: this.cm(this.yorg)},
        canvas: []
      }, frontLines: {
        relativePosition: {x: this.cm(xo), y: this.cm(this.yorg)},
        canvas: []
      },
      horzLegend: {stack: []},
      vertLegend: {stack: []},
      graph: {
        relativePosition: {x: this.cm(xo), y: this.cm(this.yorg)},
        canvas: []
      },
      graphLegend: {
        relativePosition: {x: this.cm(xo), y: this.cm(this.yorg)},
        canvas: []
      }
    };

    let maxTDD = 0.0;
    let maxCarbs = 0.0;

    for (const day of data.days) {
      const basalSum = day.ieBasalSum(false);
      const bolusSum = day.ieBolusSum;
      maxTDD = Math.max(maxTDD, bolusSum + basalSum);
      maxCarbs = Math.max(maxCarbs, day.carbs);
    }

    let height = this.graphHeight;
    let yo = 0;
    let graphHeight = height - 0.5;
    const legendTIR = new LegendData(this.cm(xo), this.cm(yo), this.cm(7.0), 1);
    const legendTDD = new LegendData(this.cm(xo), this.cm(yo), this.cm(7.0), 1);
    const legendCarbs = new LegendData(this.cm(xo), this.cm(yo), this.cm(7.0), 1);
    // Time in Range
    if (this.showTIR) {
      graphHeight = height - 0.5 - (this.showLegends ? 1.0 : 0.0);
      legendTIR.y = this.cm(this.yorg + yo + graphHeight + 0.5);
      this.periodGrid(grid, yo, graphHeight, null, 1.0, null);
      let nextPos = xo;
      for (let i = 0; i < data.days.length; i++) {
        const day = data.days[i];
        const x = xo + i * this._colWidth;
        for (const bar of [
          {y: 0, h: day.lowPrz, c: this.colors.colLow},
          {y: day.lowPrz, h: day.normPrz, c: this.colors.colNorm},
          {y: 100 - day.highPrz, h: day.highPrz, c: this.colors.colHigh}
        ] as any) {
          const h = graphHeight * bar.h / 100;
          const y = graphHeight - (graphHeight * bar.y / 100) - h;
          const rect: any = {
            type: 'rect',
            x: this.cm(x - xo),
            y: this.cm(y),
            w: this.cm(this._colWidth),
            h: this.cm(h),
            color: bar.c
          };
          grid.graph.canvas.push(rect);
        }
      }

      if (this.showLegends) {
        this.addLegendEntry(legendTIR, this.colors.colLow, this.msgLow(this.targets(this.repData).low));
        this.addLegendEntry(legendTIR, this.colors.colNorm, this.msgNormal);
        this.addLegendEntry(legendTIR, this.colors.colHigh, this.msgHigh(this.targets(this.repData).high));
      }
      yo += height;
    }

    // Total Daily Dose
    if (this.showTDD) {
      graphHeight = height - 0.5 - (this.showLegends ? 1.0 : 0.0);
      legendTDD.y = this.cm(this.yorg + yo + graphHeight + 0.5);
      this.periodGrid(grid, yo, graphHeight, maxTDD, 0.9, (value: number) => {
        return `${GLOBALS.fmtBasal(value)} ${this.msgInsulinUnit}`;
      });
      data.days.forEach((day, idx) => {
        const x = xo + idx * this._colWidth;
        const basalSum = day.ieBasalSum(false);
        const bolusSum = day.ieBolusSum;
        const tddSum = basalSum + bolusSum;
        let h = graphHeight * (tddSum / maxTDD) * 0.9;
        let y = yo + graphHeight - h;
        grid.graph.canvas.push({
          type: 'rect',
          x: this.cm(x - xo),
          y: this.cm(y),
          w: this.cm(this._colWidth),
          h: this.cm(h),
          color: this.colors.colBolus
        });
        h = graphHeight * (basalSum / maxTDD) * 0.9;
        y = yo + graphHeight - h;
        grid.graph.canvas.push({
          type: 'rect',
          x: this.cm(x - xo),
          y: this.cm(y),
          w: this.cm(this._colWidth),
          h: this.cm(h),
          color: this.colors.colBasalProfile
        });
      });
      if (this.showLegends) {
        this.addLegendEntry(legendTDD, this.colors.colBolus, this.msgLegendTDD());
        this.addLegendEntry(legendTDD, this.colors.colBasalProfile, this.msgBasalInsulin);
      }
      yo += height;
    }
    // Carbs
    if (this.showCarbs) {
      graphHeight = height - 0.5 - (this.showLegends ? 1.0 : 0.0);
      legendCarbs.y = this.cm(this.yorg + yo + graphHeight + 0.5);
      this.periodGrid(grid, yo, graphHeight, maxCarbs, 0.9, (value: number) => {
        return `${this.carbFromData(value)}g`;
      });
      data.days.forEach((day, idx) => {
        const x = xo + idx * this._colWidth;
        const carbSum = day.carbs;
        const h = graphHeight * (carbSum / maxCarbs) * 0.9;
        const y = yo + graphHeight - h;
        const r = Math.min(this._colWidth / 4, this.graphWidth / 10);
        grid.graph.canvas.push({
          type: 'rect',
          x: this.cm(x - xo),
          y: this.cm(y),
          w: this.cm(this._colWidth),
          h: this.cm(h),
          color: this.colors.colCarbs
        });
      });
      if (this.showLegends) {
        this.addLegendEntry(legendCarbs, this.colors.colCarbs, $localize`Kohlenhydrate`);
      }
    }

    const ret = new PageData(this.isPortrait, [
      this.headerFooter(),
      grid.graph,
      grid.horzLegend,
      grid.horzLines,
      grid.vertLegend,
      grid.vertLines,
      grid.frontLines,
      grid.graphLegend
    ]);

    if (legendTIR.asOutput != null) {
      ret.content.push(legendTIR.asOutput);
      // ret.content.push(infoTable);
    }
    if (legendTDD.asOutput != null) {
      ret.content.push(legendTDD.asOutput);
    }
    if (legendCarbs.asOutput != null) {
      ret.content.push(legendCarbs.asOutput);
    }
    return ret;
  }
}
