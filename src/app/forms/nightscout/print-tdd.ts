import {BasePrint} from '@/forms/base-print';
import {PageData} from '@/_model/page-data';
import {ParamInfo} from '@/_model/param-info';
import {PdfService} from '@/_services/pdf.service';
import {GLOBALS} from '@/_model/globals-data';
import {Utils} from '@/classes/utils';
import {DatepickerPeriod} from '@/_model/datepicker-period';

export class PrintTDD extends BasePrint {
  override help = $localize`:help for tdd@@help-tdd:Dieses Formular zeigt
  das Gesamtinsulin (TDD) im ausgewählten Zeitraum an.`;
  override baseId = 'tdd';
  override baseIdx = '16';
  isFormParam1: boolean;
  override params = [
    new ParamInfo(0, $localize`TIR`, {boolValue: false}),
  ];

  override _isPortrait = false;
  showTIR = false;
  graphWidth: number;
  graphHeight: number;
  _colWidth: number;

  constructor(ps: PdfService, suffix: string = null) {
    super(ps);
    this.init(suffix);
  }

  static get msgParam1(): string {
    return $localize`Parameter für PrintTDD`;
  }

  override get title(): string {
    return $localize`Gesamtinsulin`;
  }

  override get isLocalOnly(): boolean {
    return true;
  }

  override get estimatePageCount(): any {
    return {count: 1, isEstimated: true};
  }

  override fillPages(pages: PageData[]): void {
    const oldLength = pages.length;
    if (this.showTIR) {
    }

    const page = new PageData(this.isPortrait, [this.headerFooter({skipFooter: true})]);
    pages.push(this.getPage());
    if (this.repData.isForThumbs && pages.length - oldLength > 1) {
      pages.splice(oldLength + 1, pages.length);
    }
  }

  override extractParams(): void {
    this.showTIR = this.params[0].boolValue;
  }

  getPage(): PageData {
    const data = this.repData.data;
    const xo = this.xorg;
    const yo = this.yorg;
    this.graphWidth = this.width - 6.7;
    this.graphHeight = (this.height - 7.0);
    this._colWidth = this.graphWidth / data.days.length;
    const vertLines: any = {
      relativePosition: {x: this.cm(xo), y: this.cm(yo)},
      canvas: []
    };
    const horzLines: any = {
      relativePosition: {x: this.cm(xo - 0.2), y: this.cm(yo)},
      canvas: []
    };
    const graphLines: any = {
      relativePosition: {x: this.cm(xo), y: this.cm(yo)},
      stack: []
    };
    const frontLines: any = {
      relativePosition: {x: this.cm(xo), y: this.cm(yo)},
      canvas: []
    };
    const horzLegend: any = {stack: []};
    const vertLegend: any = {stack: []};
    const graphTIR: any = {
      relativePosition: {x: this.cm(xo), y: this.cm(yo)},
      canvas: []
    };

    const vertCvs = vertLines.canvas;
    const horzCvs = horzLines.canvas;
    const horzStack = horzLegend.stack;
    const vertStack = vertLegend.stack;
    const graphTIRCvs = graphTIR.canvas;

    for (const i of [0, data.days.length]) {
      const line: any = {
        type: 'line',
        x1: this.cm(i * this._colWidth),
        y1: this.cm(0),
        x2: this.cm(i * this._colWidth),
        y2: this.cm(this.graphHeight),
        lineWidth: this.cm(this.lw),
        lineColor: this.lcFrame
      };
      frontLines.canvas.push(line);
    }

    const line: any = {
      type: 'line',
      x1: this.cm(0),
      y1: this.cm(this.graphHeight),
      x2: this.cm(this.graphWidth),
      y2: this.cm(this.graphHeight),
      lineWidth: this.cm(this.lw),
      lineColor: this.lcFrame
    };
    frontLines.canvas.push(line);

    let nextPos = xo;
    for (let i = 0; i < data.days.length; i++) {
      const day = data.days[i];
      const line: any = {
        type: 'line',
        x1: this.cm(i * this._colWidth),
        y1: this.cm(0),
        x2: this.cm(i * this._colWidth),
        y2: this.cm(this.graphHeight),
        lineWidth: this.cm(this.lw),
        lineColor: this.lc
      };

      vertCvs.push(line);
      const x = xo + i * this._colWidth;
      if (x >= nextPos) {
        horzStack.push({
          relativePosition: {
            x: this.cm(x),
            y: this.cm(yo + this.graphHeight + 0.05)
          },
          text: `${DatepickerPeriod.dowShortNames[Utils.getDow(day.date)]}, ${Utils.fmtDate(day.date, 'dd.MM.')}`, //this.fmtTime(i, {withMinutes: false}),
          fontSize: this.fs(7)
        });
        nextPos = x + 1.5;
        console.log(x, nextPos);
      }

      for (const bar of [
        {y: 0, h: day.lowPrz, c: 'red'},
        {y: day.lowPrz, h: day.normPrz, c: 'lime'},
        {y: 100 - day.highPrz, h: day.highPrz, c: 'yellow'}
      ] as any) {
        const h = this.graphHeight * bar.h / 100;
        const y = this.graphHeight - (this.graphHeight * bar.y / 100) - h;
        const rect: any = {
          type: 'rect',
          x: this.cm(x - xo),
          y: this.cm(y),
          w: this.cm(this._colWidth),
          h: this.cm(h),
          color: bar.c
        };
        graphTIRCvs.push(rect);
      }

      // console.log(`${Utils.fmtDate(day.date)} - ${tgHigh} / ${tgNorm} / ${tgLow}`);
    }

    for (let i = 0; i < data.days.length; i++) {
      const day = data.days[GLOBALS.ppLatestFirst ? data.days.length - 1 - i : i];
      // draw vertical lines with times below graphic
    }
    // this.title = this._titleGraphic;
    return new PageData(this.isPortrait, [
      this.headerFooter(),
      graphTIR,
      horzLegend,
      horzLines,
      vertLegend,
      vertLines,
      graphLines,
      frontLines,
    ]);
  }
}
