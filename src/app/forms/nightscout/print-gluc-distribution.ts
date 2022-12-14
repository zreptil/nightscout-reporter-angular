import {BasePrint} from '@/forms/base-print';
import {PageData} from '@/_model/page-data';
import {ParamInfo} from '@/_model/param-info';
import {PdfService} from '@/_services/pdf.service';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {Utils} from '@/classes/utils';

class GlucDist {
  count = 0;

  constructor(public from: number,
              public to: number,
              public color: string) {
  }
}

export class PrintGlucDistribution extends BasePrint {
  override help = $localize`:help for glucdist@@help-glucdist:Dieses Formular zeigt die Verteilung der Glukosewerte
im ausgewählten Zeitraum an.`;

  override baseId = 'glucdist';
  override baseIdx = '15';
  isFormParam1: boolean;
  override params = [
    new ParamInfo(0, PrintGlucDistribution.msgParam1, {boolValue: false, thumbValue: false}),
    new ParamInfo(1, PrintGlucDistribution.msgParam2, {list: ['5', '10', '20', '50']})
  ];
  startAt0: boolean;
  glucSpan: number;
  graphWidth: number;
  graphHeight: number;

  constructor(ps: PdfService, suffix: string = null) {
    super(ps);
    this.init(suffix);
  }

  static get msgParam1(): string {
    return $localize`Bei 0 beginnen`;
  }

  static get msgParam2(): string {
    return $localize`Schritte`;
  }

  override get title(): string {
    return $localize`Verteilung der Glukosewerte`;
  }

  override get estimatePageCount(): any {
    return {count: 1, isEstimated: false};
  }

  override get isPortrait(): boolean {
    return false;
  }

  override extractParams(): void {
    this.startAt0 = this.params[0].boolValue;
    this.glucSpan = Utils.parseNumber(this.params[1].listValue, 10);
  }

  override fillPages(pages: PageData[]): void {
    pages.push(this.getPage());
    if (GLOBALS.showBothUnits) {
      GLOBALS.glucMGDLIdx = 1;
      pages.push(this.getPage());
      GLOBALS.glucMGDLIdx = 2;
    }
  }

  getArea(points: any, color: string): any {
    return {
      type: 'polyline',
      lineWidth: this.cm(this.lw),
      closePath: true,
      lineColor: color,
      color: color,
      points: points
    };
  }

  getPage(): PageData {
    this.titleInfo = this.titleInfoBegEnd();
    const data = this.repData.data;

    this.graphWidth = 23.25;
    this.graphHeight = 12.5;
    let glucMax = 0.0;
    let glucMin = 100000.0;
    // const glucSpan = 1.0;
    // const startDate = new Date(this.repData.begDate.getFullYear(),
    //   this.repData.begDate.getMonth(),
    //   this.repData.begDate.getDate());
    // const endDate = new Date(this.repData.endDate.getFullYear(),
    //   this.repData.endDate.getMonth(),
    //   this.repData.endDate.getDate() + 1);

    for (const day of data.days) {
      for (const entry of day.entries) {
        if (entry.gluc > 0) {
          glucMin = Math.min(entry.gluc, glucMin);
          glucMax = Math.max(entry.gluc, glucMax);
          //          print('${entry.gluc} ${entry.time}');
        }
      }
    }
    // glucMin = this.startAt0 ? 0 : glucMin;
    glucMax = glucMax + this.glucSpan;
    // print('glucMin  ${glucMin}');
    // print('glucMax  ${glucMax}');
    // print('glucSpan ${glucSpan}');
    const values: GlucDist[] = [];
    //.filled((glucMax / glucSpan).toInt() + 1, null);
    const low = GLOBALS.ppStandardLimits ? GlobalsData.stdLow : this.repData.status.settings.bgTargetBottom;
    const high = GLOBALS.ppStandardLimits ? GlobalsData.stdHigh : this.repData.status.settings.bgTargetTop;
    let lowCount = 0;
    let highCount = 0;
    for (let g = 0.0; g <= glucMax; g += this.glucSpan) {
      let from = g;
      const to = g + this.glucSpan;
      if (from < low && to > low) {
        values.push(new GlucDist(from, low, this.colLow));
        from = low;
      }
      if (from < high && to > high) {
        values.push(new GlucDist(from, high, this.colNorm));
        from = high;
      }
      const color = from < low ? this.colLow : (from >= high ? this.colHigh : this.colNorm);
      values.push(new GlucDist(from, to, color));
    }
    // values.clear();
    // values.add(GlucDist(0, 120, '#00ff00'));
    // values.add(GlucDist(120, 135, '#00ff00'));
    // values.add(GlucDist(135, 300, '#00ff00'));
    // values.add(GlucDist(300, 820, '#00ff00'));
    let count = 0;
    let countMax = 0;
    for (const day of data.days) {
      for (const entry of day.entries) {
        if (entry.gluc > 0) {
          const v = values.find((e) => e.from < entry.gluc && e.to >= entry.gluc);
          if (v != null) {
            v.count++;
            if (v.from < low) {
              lowCount++;
            } else if (v.from >= high) {
              highCount++;
            }
            countMax = Math.max(countMax, v.count);
          }
          count++;
        }
      }
    }

    const xo = this.xorg;
    const yo = this.yorg;
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
    // const grid = drawGraphicGrid(glucMax, graphHeight, graphWidth, vertCvs,
    //     horzCvs, horzStack, vertStack,
    //     graphBottom: 0);

    const graphBottom = this.graphHeight;
    const horzfs = this.fs(8);
    const vertfs = this.fs(8);
    const valueMax = Math.ceil(countMax / count * 100) + 1;
    const xf = this.graphWidth / (glucMax);
    const yf = this.graphHeight / (valueMax / 100);

    let points: any[] = [
      {x: this.cm(0), y: this.cm(graphBottom)}
    ];
    const graphGluc: any = {
      relativePosition: {x: this.cm(xo), y: this.cm(yo)},
      canvas: []
    };
    let idx = 0;
    const checks = [low, high - 1, 999999];
    const colors = [this.colLow, this.colNorm, this.colHigh];
    let lastX = -100.0;
    for (let i = 0; i < values.length; i++) {
      const x = values[i].from * xf;
      const y = graphBottom - values[i].count / count * yf;
      const v = values[i].from;
      // print('v = ${v} => ${idx} ${glucMax} ${glucSpan}');
      const c = checks[idx];
      if (v >= c) {
        points.push({x: this.cm(x), y: this.cm(graphBottom)});
        (graphGluc['canvas'] as any[]).push(this.getArea(points, colors[idx]));
        points = [
          {x: this.cm(x), y: this.cm(graphBottom)}
        ];
        idx++;
      }
      points.push({x: this.cm(x), y: this.cm(y)});
      points.push({x: this.cm(values[i].to * xf), y: this.cm(y)});
      vertCvs.push({
        type: 'line',
        x1: this.cm(x),
        y1: this.cm(0),
        x2: this.cm(x),
        y2: this.cm(i > 0 ? graphBottom - this.lw / 2 : graphBottom + 0.4),
        lineWidth: this.cm(this.lw),
        lineColor: i > 0 ? this.lc : this.lcFrame
      });
      if (i < values.length && x - lastX > 1) {
        // legend at horizontal axis
        horzStack.push({
          relativePosition: {x: this.cm(this.xorg + x), y: this.cm(this.yorg + graphBottom + 0.5)},
          text: GLOBALS.glucFromData(values[i].from),
          fontSize: horzfs
        });
        lastX = x;
      }
    }

    horzStack.push({
      relativePosition: {x: this.cm(this.xorg), y: this.cm(this.yorg + graphBottom + 1.0)},
      columns: [
        {width: this.cm(this.graphWidth), text: GLOBALS.getGlucInfo()['unit'], fontSize: horzfs * 2, alignment: 'center'}
      ]
    });

    let lastY = 100.0;
    for (let i = 0.0; i < valueMax / 100; i += 0.01) {
      const y = graphBottom - i * yf;
      if (lastY - y > 0.5) {
        horzCvs.push({
          type: 'line',
          x1: this.cm(-0.1),
          y1: this.cm(y),
          x2: this.cm(this.graphWidth + 0.2),
          y2: this.cm(y),
          lineWidth: this.cm(this.lw),
          lineColor: i === 0.0 ? this.lcFrame : this.lc
        });
        vertStack.push({
          relativePosition: {x: this.cm(this.xorg - 1.3), y: this.cm(this.yorg + y - 0.15)},
          columns: [
            {width: this.cm(1), text: `${GLOBALS.fmtNumber(i * 100)} %`, fontSize: vertfs, alignment: 'right'}
          ]
        });
        // legend at vertical axis
        vertStack.push({
          relativePosition: {x: this.cm(this.xorg + this.graphWidth + 0.4), y: this.cm(this.yorg + y - 0.15)},
          columns: [
            {
              width: this.cm(1),
              text: `${GLOBALS.fmtNumber(i * 100)} %`,
              fontSize: vertfs,
            }
          ]
        });
        lastY = y;
      }
    }

    points.push({x: this.cm(this.graphWidth), y: this.cm(graphBottom)});
    (graphGluc['canvas'] as any[]).push(this.getArea(points, colors[idx]));

    // vertical line at the right side
    const x = this.graphWidth;
    vertCvs.push({
      type: 'line',
      x1: this.cm(x),
      y1: this.cm(0),
      x2: this.cm(x),
      y2: this.cm(graphBottom + 0.4),
      lineWidth: this.cm(this.lw),
      lineColor: this.lcFrame
    });

    const bottomBar = {
      stack: [
        {
          relativePosition: {x: this.cm(this.xorg), y: this.cm(this.yorg + graphBottom)},
          columns: [
            {
              canvas: [
                {
                  type: 'rect',
                  x: this.cm(0),
                  y: this.cm(0),
                  w: this.cm(low * xf),
                  h: this.cm(0.4),
                  color: this.colLowBack
                },
                {
                  type: 'rect',
                  x: this.cm(low * xf),
                  y: this.cm(0),
                  w: this.cm((high - low) * xf),
                  h: this.cm(0.4),
                  color: this.colNormBack
                },
                {
                  type: 'rect',
                  x: this.cm(high * xf),
                  y: this.cm(0),
                  w: this.cm(this.graphWidth - high * xf),
                  h: this.cm(0.4),
                  color: this.colHighBack
                }
              ]
            }
          ]
        },
        {
          relativePosition: {x: this.cm(this.xorg), y: this.cm(this.yorg + graphBottom + 0.05)},
          columns: [
            {
              width: this.cm(low * xf),
              text: `${GLOBALS.fmtNumber(lowCount / count * 100, 1)} %`,
              alignment: 'center',
              fontSize: vertfs,
              bold: true
            },
            {
              width: this.cm((high - low) * xf),
              text: `${GLOBALS.fmtNumber((count - lowCount - highCount) / count * 100, 1)} %`,
              alignment: 'center',
              fontSize: vertfs,
              bold: true
            },
            {
              width: this.cm((glucMax - high) * xf),
              text: `${GLOBALS.fmtNumber(highCount / count * 100, 1)} %`,
              alignment: 'center',
              fontSize: vertfs,
              bold: true
            }
          ]
        }
      ]
    };

    const ret = [this.headerFooter(), bottomBar, graphGluc, horzLines, vertLines, vertLegend, horzLegend];

    // ret.add({type: 'text', text: '${valueMax}'});

    return new PageData(this.isPortrait, ret);
  }
}
