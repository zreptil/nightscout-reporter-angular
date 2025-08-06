import {BasePrint} from '@/forms/base-print';
import {PageData} from '@/_model/page-data';
import {ParamInfo} from '@/_model/param-info';
import {PdfService} from '@/_services/pdf.service';
import {Utils} from '@/classes/utils';
import {DatepickerPeriod} from '@/_model/datepicker-period';
import {LegendData} from '@/_model/legend-data';
import {GLOBALS} from '@/_model/globals-data';

/**
 * options for calling periodGrid
 */
class GridOptions {
  maxValue?: number;
  maxScale: number;
  fmt?: (value: number) => string;
  values?: number[];
}

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
  override hasDevicePages = true;
  graphWidth: number;
  graphHeight: number;
  _colWidth: number;

  constructor(ps: PdfService, suffix: string = null) {
    super(ps);
    this.init(suffix);
  }

  override get title(): string {
    return $localize`Zeitraum Auswertung`;
  }

  override get estimatePageCount(): any {
    return {count: 1, isEstimated: false};
  }

  override fillPages(pages: PageData[]): void {
    const oldLength = pages.length;
    for (const deviceKey of this.repData.deviceFilter) {
      pages.push(this.getPage(deviceKey));
      if (this.repData.isForThumbs && pages.length - oldLength > 1) {
        pages.splice(oldLength + 1, pages.length);
      }
    }
  }

  override extractParams(): void {
    this.showTIR = this.params[0].boolValue;
    this.showTDD = this.params[1].boolValue;
    this.showCarbs = this.params[2].boolValue;
    this.showLegends = this.params[3].boolValue;
    this.showWeekdayNames = this.params[4].boolValue;
  }

  periodGrid(grid: any, yo: number, height: number, options: GridOptions): any {
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
    const diff = this.showWeekdayNames ? 1.15 : 0.7;
    for (let i = 0; i < data.days.length; i++) {
      const day = data.days[i];
      const x = xo + i * this._colWidth;
      let y2 = yo + height;
      if (x >= nextPos) {
        let text = `${DatepickerPeriod.dowShortNames[Utils.getDow(day.date)]},${Utils.fmtDate(day.date, GLOBALS.language.dateShortFormat)}`;
        if (!this.showWeekdayNames) {
          text = `${Utils.fmtDate(day.date, $localize`dd.MM.`)}`;
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

    if (options.maxValue != null && options.fmt != null) {
      for (const value of options.values ?? [options.maxValue]) {
        const y = yo + height - height * value / options.maxValue * options.maxScale;
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
              text: `${options.fmt(value)}`,
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
  }

  getPage(deviceKey: string): PageData {
    this.titleInfo = this.titleInfoBegEnd();
    const data = this.repData.data;
    const xo = this.xorg;
    const maxScale = 0.95;
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
    const showValue = this._colWidth >= 0.7;
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
    const svg: any[] = [];

    let maxTDD = 0.0;
    let maxBasal = 0.0;
    let maxCarbs = 0.0;

    for (const day of data.days) {
      const basalSum = day.ieBasalSum(false);
      const bolusSum = day.ieBolusSum;
      maxTDD = Math.max(maxTDD, bolusSum + basalSum);
      maxBasal = Math.max(maxBasal, basalSum);
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
      this.periodGrid(grid, yo, graphHeight, {maxScale: 1.0});
      for (let i = 0; i < data.days.length; i++) {
        const day = data.days[i];
        const x = xo + i * this._colWidth;
        for (const bar of [
          {y: 0, h: day.lowPrz(deviceKey), c: this.colors.colLow},
          {y: day.lowPrz(deviceKey), h: day.normPrz(deviceKey), c: this.colors.colNorm},
          {y: 100 - day.highPrz(deviceKey), h: day.highPrz(deviceKey), c: this.colors.colHigh}
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
      this.periodGrid(grid, yo, graphHeight, {
        maxValue: maxTDD,
        maxScale: maxScale,
        values: [maxTDD, maxBasal],
        fmt: (value: number) => {
          return `${GLOBALS.fmtBasal(value)} ${this.msgInsulinUnit}`;
        }
      });
      data.days.forEach((day, idx) => {
        const x = xo + idx * this._colWidth;
        const basalSum = day.ieBasalSum(false);
        const bolusSum = day.ieBolusSum;
        const tddSum = basalSum + bolusSum;
        let h = graphHeight * (tddSum / maxTDD) * maxScale;
        let y = yo + graphHeight - h;
        grid.graph.canvas.push({
          type: 'rect',
          x: this.cm(x - xo),
          y: this.cm(y),
          w: this.cm(this._colWidth),
          h: this.cm(h),
          color: this.colors.colBolus
        });
        if (showValue) {
          grid.vertLegend.stack.push({
            relativePosition: {
              x: this.cm(x),
              y: this.cm(this.yorg + y)
            },
            columns: [{
              // x: this.cm(x),
              width: this.cm(this._colWidth),
              text: `${GLOBALS.fmtBasal(tddSum)}`,
              fontSize: this.fs(7),
              color: this.colors.colBasalFont,
              alignment: 'center'
            }]
          });
        }

        h = graphHeight * (basalSum / maxTDD) * maxScale;
        y = yo + graphHeight - h;
        grid.graph.canvas.push({
          type: 'rect',
          x: this.cm(x - xo),
          y: this.cm(y),
          w: this.cm(this._colWidth),
          h: this.cm(h),
          color: this.colors.colBasalProfile
        });
        if (showValue) {
          let h1 = h;
          if (h1 < 0.3) {
            h1 = 0.3;
          }
          const y1 = this.yorg + yo + graphHeight - h1;
          grid.vertLegend.stack.push({
            relativePosition: {
              x: this.cm(x),
              y: this.cm(y + h)
            },
            columns: [{
              // x: this.cm(x),
              width: this.cm(this._colWidth),
              text: `${GLOBALS.fmtBasal(basalSum)}`,
              fontSize: this.fs(7),
              color: this.colors.colBasalFont,
              alignment: 'center'
            }]
          });

          const svg1 = `<svg width="${this.cm(0.5)}" height="${this.cm(this._colWidth)}">
<g transform="rotate(90)">
<text fill="${this.colors.colBasalFont}" x="0" y="0" font-size="7">Hurz</text>
</g>
</svg>`;
          svg.push({
            relativePosition: {
              x: this.cm(x + this._colWidth / 2),
              y: this.cm(y1),
            },
            svg: svg1, width: this.cm(this._colWidth), height: this.cm(graphHeight),
            color: this.colors.colBasalProfile
          });
        }
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
      this.periodGrid(grid, yo, graphHeight, {
        maxValue: maxCarbs,
        maxScale: maxScale,
        fmt: (value: number) => {
          return `${this.carbFromData(value)}g`;
        }
      });
      data.days.forEach((day, idx) => {
        const x = xo + idx * this._colWidth;
        const carbSum = day.carbs;
        const h = graphHeight * (carbSum / maxCarbs) * maxScale;
        const y = yo + graphHeight - h;
        grid.graph.canvas.push({
          type: 'rect',
          x: this.cm(x - xo),
          y: this.cm(y),
          w: this.cm(this._colWidth),
          h: this.cm(h),
          color: this.colors.colCarbs
        });
        if (showValue) {
          grid.vertLegend.stack.push({
            relativePosition: {
              x: this.cm(x),
              y: this.cm(this.yorg + y - 0.3)
            },
            columns: [{
              // x: this.cm(x),
              width: this.cm(this._colWidth),
              text: `${GLOBALS.fmtBasal(carbSum)}`,
              fontSize: this.fs(7),
              color: this.colors.colCarbsText,
              alignment: 'center'
            }]
          });
        }
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
    ret.content.push(...svg);
    console.log(ret);
    return ret;
  }
}
