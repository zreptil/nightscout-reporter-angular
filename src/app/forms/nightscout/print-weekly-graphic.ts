import {BasePrint} from '@/forms/base-print';
import {PageData} from '@/_model/page-data';
import {ParamInfo} from '@/_model/param-info';
import {PdfService} from '@/_services/pdf.service';
import {GLOBALS} from '@/_model/globals-data';
import {PrintCGP} from '@/forms/nightscout/print-cgp';
import {Utils} from '@/classes/utils';
import {DayData} from '@/_model/nightscout/day-data';
import {ReportData} from '@/_model/report-data';
import {LegendData} from '@/_model/legend-data';
import {EntryData} from '@/_model/nightscout/entry-data';
import {DatepickerPeriod} from '@/_model/datepicker-period';
import {PrintDailyGraphic} from '@/forms/nightscout/print-daily-graphic';

export class PrintWeeklyGraphic extends BasePrint {
  override help = $localize`:help for weekgraph@@help-weekgraph:Dieses Formular zeigt den Verlauf der Glukosekurve über eine Woche hinweg an. Der Zeitraum wird
dazu in Wochenabschnitte aufgeteilt und jede Woche wird auf einer eigenen Seite ausgegeben. Die Wochen werden
farblich markiert, so dass man sie gut unterscheiden kann. Zusätzlich kann noch das @10@ für die jeweilige
Woche erzeugt werden.`;
  override baseId = 'weekgraph';
  override baseIdx = '08';
  isFormParam1: boolean;
  override params = [
    new ParamInfo(0, BasePrint.msgGraphsPerPage, {
      list: [
        $localize`Eine`,
        $localize`Zwei`,
        $localize`Vier`,
        $localize`Acht`,
        $localize`Sechzehn`
      ]
    }),
    new ParamInfo(1, '', {boolValue: true, isDeprecated: true}),
    new ParamInfo(2, this.msgParam3, {boolValue: true}),
    new ParamInfo(3, PrintDailyGraphic.msgParam19,
      {
        boolValue: false,
        subParams: [
          new ParamInfo(0, PrintCGP.msgParamAreaLines, {boolValue: true})
        ],
        thumbValue: true
      }),
  ];
  spareBool1: boolean;
  showDaysInGraphic = true;
  showCGP: boolean;
  showCGPAreaLines: boolean;
  glucMax = 0.0;
  carbMax = 200.0;
  bolusMax = 50.0;
  graphHeight: number;
  graphBottom: number;
  graphWidth: number;
  basalTop: number;
  basalHeight = 3.0;

  constructor(ps: PdfService, suffix: string = null) {
    super(ps);
    this.init(suffix);
  }

  get msgParam3(): string {
    return $localize`Tagesnamen in Grafik anzeigen`;
  }

  override get title(): string {
    return $localize`Wochengrafik`;
  }

  override get backsuffix(): string {
    return this.showCGP ? 'cgp' : '';
  }

  override get isPortrait(): boolean {
    return false;
  }

  override get estimatePageCount(): any {
    let count = 0;
    if (GLOBALS.period != null &&
      GLOBALS.period.start != null &&
      GLOBALS.period.end != null) {
      count = 1;
      let date = Utils.addDateDays(GLOBALS.period.start, 1);
      while (Utils.isOnOrBefore(date, GLOBALS.period.end)) {
        if (Utils.getDow(date) === 1) {
          count++;
        }
        date = Utils.addDateDays(date, 1);
      }
      if (this.showCGP ?? false) {
        count *= 2;
      }
    }
    return {count: count, isEstimated: false};
  }

  get basalWidth(): number {
    return this.graphWidth;
  }

  override extractParams(): void {
    this.spareBool1 = this.params[1].boolValue;
    this.showDaysInGraphic = this.params[2].boolValue;
    this.showCGP = this.params[3].boolValue;
    this.showCGPAreaLines = this.params[3].subParams[0].boolValue;

    switch (this.params[0].intValue) {
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
    return this.graphHeight / this.bolusMax * value;
  }

  override fillPages(pages: PageData[]): void {
    const data = this.repData.data;

    if (Utils.isEmpty(data.days)) {
      return;
    }

    let list: DayData[][] = [];
    list.push([]);
    let lastDayInWeek = 1000;
    for (let i = 0; i < data.days.length; i++) {
      const day = data.days[i];
      let dayInWeek = Utils.getDow(day.date) - GLOBALS.period.firstDayOfWeek;
      if (dayInWeek < 0) {
        dayInWeek += 7;
      }
      if (dayInWeek <= lastDayInWeek && !Utils.isEmpty(Utils.last(list))) {
        list.push([]);
      }
      lastDayInWeek = dayInWeek;
      Utils.last(list).push(day);
    }
    if (GLOBALS.ppLatestFirst) {
      list = list.reverse();
    }
    for (const week of list) {
      this.graphWidth = 23.25;
      this.graphHeight = 12.5;
      this.basalTop = 2.0;
      this.graphBottom = this.graphHeight;
      pages.push(this._getPage(week, this.repData));
      if (this.showCGP) {
        pages.push(PrintCGP.getCGPPage(week, this.showCGPAreaLines, this));
      }
      if (GLOBALS.showBothUnits) {
        GLOBALS.glucMGDLIdx = 1;
        pages.push(this._getPage(week, this.repData));
        GLOBALS.glucMGDLIdx = 2;
      }
      // this.title = this._title;
      if (this.repData.isForThumbs) {
        break;
      }
    }
//    if (repData.isForThumbs && pages.length - oldLength > 1) pages.removeRange(oldLength + 1, pages.length);
  }

  glucLine(points: any, color: string): any {
    return {
      type: 'polyline',
      lineWidth: this.cm(this.lw * 2),
      closePath: false,
      lineColor: color,
      points: points
    };
  }

  /*

  string get _title => $localize('Wochengrafik');

  override
  string get title => _title;

  */
  _getPage(days: DayData[], _: ReportData): PageData {
    // title = _title;
    this.subtitle = null;
    this.footerTextAboveLine.text = '';
    const xo = this.xorg;
    const yo = this.yorg;
    this.titleInfo = this.titleInfoDateRange(days[0].date, Utils.last(days).date);
    this.glucMax = -1000.0;
    for (const day of days) {
      for (const entry of day.entries) {
        this.glucMax = Math.max(entry.gluc, this.glucMax);
      }
      for (const entry of day.bloody) {
        this.glucMax = Math.max(entry.mbg, this.glucMax);
      }
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
    const graphGlucCvs: any[] = [];
// ignore: omit_local_variable_types
    const graphGlucStack: any[] = [
      {
        relativePosition: {x: this.cm(xo), y: this.cm(yo)},
        canvas: graphGlucCvs
      }
    ];
    const graphGluc = {stack: graphGlucStack};

    const vertCvs: any[] = vertLines.canvas;
    const horzCvs: any[] = vertLines.canvas;
    const horzStack: any[] = horzLegend.stack;
    const vertStack: any[] = vertLegend.stack;

    const grid = this.drawGraphicGrid(this.glucMax, this.graphHeight, this.graphWidth, vertCvs,
      horzCvs, horzStack, vertStack,
      {glucScale: GLOBALS.glucMGDL ? 20 : 18.02 * 0.5});
    if (grid.lineHeight === 0) {
      return new PageData(this.isPortrait, [
        this.headerFooter(),
        {
          relativePosition: {x: this.cm(this.xorg), y: this.cm(this.yorg)},
          text: this.msgMissingData
        }
      ]);
    }

    this.glucMax = grid.gridLines * grid.glucScale;
    const legend = new LegendData(this.cm(xo), this.cm(yo + this.graphHeight + 0.8), this.cm(8.0), 3);
    for (const day of days) {
      const color = this.colWeekDays[Utils.getDow(day.date)];
      const size = 0.2;

      for (const entry of day.bloody) {
        const x = this.glucX(entry.time);
        const y = this.glucY(entry.mbg);
        graphGlucCvs.push({
          type: 'rect',
          x: this.cm(x),
          y: this.cm(y),
          w: this.cm(size),
          h: this.cm(size),
          color: color
        });
      }
      for (const t of day.treatments) {
        if (t.isBloody) {
          const x = this.glucX(t.createdAt);
          const y = this.glucY(GLOBALS.glucFactor * t.glucose);
          graphGlucCvs.push({
            type: 'rect',
            x: this.cm(x),
            y: this.cm(y),
            w: this.cm(size),
            h: this.cm(size),
            color: color
          });
        }
      }

      let points: any[] = [];
      const names: any[] = [];
      const nameBoxes: any[] = [];
      let last: EntryData = null;
      const colorText = this.colWeekDaysText[Utils.getDow(day.date) - 1];
      const name = DatepickerPeriod.dowShortName(day.date);
      for (const entry of day.entries) {
        const x = this.glucX(entry.time);
        const y = this.glucY(entry.gluc);
        if (entry.gluc < 0) {
          if (last != null && last.gluc >= 0) {
            graphGlucCvs.push(this.glucLine(points, color));
            points = [];
          }
        } else {
          points.push({x: this.cm(x), y: this.cm(y)});
        }

        if (this.showDaysInGraphic) {
          if ((last == null || entry.time.getHours() > last.time.getHours()) &&
            entry.gluc > 0) {
            if (entry.time.getHours() % 2 === 1) {
              nameBoxes.push({
                type: 'rect',
                x: this.cm(x - 0.25),
                y: this.cm(y - 0.2),
                w: this.cm(0.5),
                h: this.cm(0.4),
                color: color
              });
              names.push({
                relativePosition: {
                  x: this.cm(xo + x - 0.25),
                  y: this.cm(yo + y - 0.15)
                },
                columns: [
                  {
                    width: this.cm(0.5),
                    text: name,
                    fontSize: this.fs(8),
                    color: colorText,
                    alignment: 'center'
                  }
                ]
              });
            }
          }
        }
        last = entry;
      }
      graphGlucCvs.push(this.glucLine(points, color));
      Utils.pushAll(graphGlucCvs, nameBoxes);
      Utils.pushAll(graphGlucStack, names);
      this.addLegendEntry(legend, color, `${this.fmtDate(day.date, {def: null, withShortWeekday: false, withLongWeekday: true})}`,
        {isArea: false, lineWidth: this.lw * 3});
    }

    const yHigh = this.glucY(Math.min(this.glucMax, this.targets(this.repData).high));
    const yLow = this.glucY(this.targets(this.repData).low);

    const limitLines = {
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
        {
          type: 'rect',
          x: 0,
          y: 0,
          w: 0,
          h: 0,
          color: '#000',
          fillOpacity: 1
        }
      ]
    };
    return new PageData(this.isPortrait, [
      this.headerFooter(),
      vertLegend,
      vertLines,
      horzLegend,
      horzLines,
      limitLines,
      graphGluc,
      legend.asOutput,
      {text: ''}
    ]);
  }
}
