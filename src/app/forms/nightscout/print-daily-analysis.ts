import {BasePrint} from '@/forms/base-print';
import {LiteralFormat, ParamInfo} from '@/_model/param-info';
import {PdfService} from '@/_services/pdf.service';
import {PageData} from '@/_model/page-data';
import {BaseDaily} from '@/forms/nightscout/base-daily';
import {GLOBALS} from '@/_model/globals-data';
import {Utils} from '@/classes/utils';
import {DayData} from '@/_model/nightscout/day-data';
import {ProfileEntryData} from '@/_model/nightscout/profile-entry-data';
import {EntryData} from '@/_model/nightscout/entry-data';

export class PrintDailyAnalysis extends BaseDaily {
  override help = $localize`:help for dailyanalysis@@help-daily-analysis:Dieses Formular zeigt eine Übersicht für einen Tag. Hier
  werden die Tagesgrafik, die Basalrate, die Basalratenanpassungen, Insulin On
  Board und Carbs On Board angezeigt.`;
  override baseId = 'dayanalysis';
  override baseIdx = '06';
  isFormParam1: boolean;
  override params = [
    new ParamInfo(0, BasePrint.msgOrientation, {list: [$localize`Hochformat`, $localize`Querformat`]}),
    new ParamInfo(1, '', {literalFormat: new LiteralFormat(true)}),
    new ParamInfo(2, this.msgParamAreaGluc, {
        boolValue: true,
        subParams: [new ParamInfo(0, BaseDaily.msgDaily1,
          {
            boolValue: true,
            subParams: [
              new ParamInfo(0, BaseDaily.msgDaily2, {boolValue: true, isLoopValue: true})
            ],
            isLoopValue: true
          })]
      }
    ),
    new ParamInfo(3, this.msgParamAreaProfilBasal, {boolValue: true}),
    new ParamInfo(4, this.msgParamAreaDayProfile, {boolValue: true}),
    new ParamInfo(5, this.msgParamAreaIOB, {boolValue: true}),
    new ParamInfo(6, this.msgParamAreaCOB, {boolValue: true}),
  ];
  showGlucose: boolean;
  showProfileBasal: boolean;
  showDayBasal: boolean;
  showIOB: boolean;
  showCOB: boolean;
  lineWidth: number;
  glucMax = 0.0;
  profMax = 0.0;
  basalMax = 0.0;
  carbMax = 200.0;
  bolusMax = 50.0;
  ieMax = 0.0;
  graphWidth: number;
  notesTop = 0.4;
  notesHeight = 0.3;
  basalHeight: number;
  basalWidth: number;
  _vertLines: any;
  _horzLines: any;
  _graphLines: any;
  _vertCvs: any;
  _horzCvs: any;
  _vertStack: any[];
  _horzStack: any[];
  _colWidth: number;
  graphCount: number;

  constructor(ps: PdfService, suffix: string = null) {
    super(ps);
    this.init(suffix);
  }

  get msgParamAreaGluc(): string {
    return $localize`Glukosewerte`;
  }

  get msgParamAreaProfilBasal(): string {
    return $localize`Basalrate aus dem Profil`;
  }

  get msgParamAreaDayProfile(): string {
    return $localize`Basalrate für den Tag`;
  }

  get msgParamAreaIOB(): string {
    return $localize`Insulin On Board`;
  }

  get msgParamAreaCOB(): string {
    return $localize`Carbs On Board`;
  }

  override _isPortrait = true;

  override get isPortrait(): boolean {
    return this._isPortrait;
  }

  override get title(): string {
    return this._titleGraphic;
  }

  override get estimatePageCount(): any {
    return {count: GLOBALS.period?.dayCount ?? 0, isEstimated: false};
  }

  override get backsuffix(): string {
    return this.isPortraitParam ? '' : 'landscape';
  }

  get _titleGraphic(): string {
    return $localize`Tagesanalyse`;
  }

  override get imgList(): string[] {
    return ['nightscout', 'katheter.print', 'sensor.print', 'ampulle.print'];
  }

  override checkValue(_param: ParamInfo, _value: any): void {
    this.checkList([2, 3, 4, 5, 6], 5, 1);
  }

  override extractParams(): void {
    switch (this.params[0].intValue) {
      case 0:
        this.isPortraitParam = true;
        break;
      case 1:
        this.isPortraitParam = false;
        break;
    }
    this.showGlucose = this.params[2].boolValue;
    this.showSMB = this.params[2].subParams[0].boolValue;
    this.showSMBAtGluc = this.params[2].subParams[0].subParams[0].boolValue;
    this.showProfileBasal = this.params[3].boolValue;
    this.showDayBasal = this.params[4].boolValue;
    this.showIOB = this.params[5].boolValue;
    this.showCOB = this.params[6].boolValue;
  }

  glucX(time: Date): number {
    return this.calcX(this.graphWidth, time);
  }

  glucY(value: number): number {
    return this.calcY(this.graphHeight, this.glucMax, value);
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

  basalY(value: number, max: number): number {
    return max != 0 && value != null
      ? this.graphHeight - (this.basalHeight / max * value) : 0.0;
  }

  override fillPages(pages: PageData[]): void {
    this.graphCount = [
      this.showGlucose,
      this.showProfileBasal,
      this.showDayBasal,
      this.showIOB,
      this.showCOB].reduce((a, b) => a + (b ? 1 : 0), 0);

    if (this.graphCount === 0) {
      pages.push(this.getEmptyForm(this.isPortrait, this.repData.status?.status,
        {msg: $localize`In den Formularparametern muss mindestens ein Bereich für diese Seite ausgewählt werden.`}));
      return;
    }
    //    scale = height / width;
    this._isPortrait = this.isPortraitParam;
    const data = this.repData.data;
    this.graphWidth = this.width - 6.7;
    this.basalWidth = this.graphWidth;
    this.graphHeight = (this.height - 7.0) / this.graphCount;
    this.lineWidth = this.cm(0.03);

    for (let i = 0; i < data.days.length; i++) {
      const day = data.days[GLOBALS.ppLatestFirst ? data.days.length - 1 - i : i];
      if (!Utils.isEmpty(day.entries) || !Utils.isEmpty(day.treatments)) {
        pages.push(this.getPage(day));
        if (this.repData.isForThumbs) {
          i = data.days.length;
        }
      } else {
        pages.push(this.getEmptyForm(this._isPortrait, this.repData.status.status));
      }
    }
    // this.title = this._titleGraphic;
  }

  glucLine(points: any): any {
    return {
      type: 'polyline',
      lineWidth: this.cm(this.lw),
      closePath: false,
      lineColor: this.colValue,
      points: points
    };
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

  getPage(day: DayData): PageData {
    // this.title = this._titleGraphic;
    this.basalHeight = this.graphHeight;
    const xo = this.xorg;
    const yo = this.yorg;
    this.titleInfo = this.fmtDate(day.date, {withShortWeekday: false, withLongWeekday: true});
    this.glucMax = -1000.0;
    this.ieMax = 0.0;
    for (const entry of day.entries) {
      this.glucMax = Math.max(entry.gluc, this.glucMax);
    }
    for (const entry of day.bloody) {
      this.glucMax = Math.max(entry.mbg, this.glucMax);
    }
    for (const entry of day.treatments) {
      if (entry.isBloody) {
        this.glucMax = Math.max(GLOBALS.glucFactor * entry.glucose, this.glucMax);
      }
      this.ieMax = Math.max(entry.bolusInsulin, this.ieMax);
    }

    if (GLOBALS.glucMaxValue != null) {
      this.glucMax = GLOBALS.glucMaxValues[GLOBALS.ppGlucMaxIdx];
    }

    const glucScale = GLOBALS.glucMGDL ? 50 : 18.02;
    let gridLines = Math.ceil(this.glucMax / glucScale);

    //    number gridLines = (glucMax / 50).ceil();
    let lineHeight = gridLines == 0 ? 0 : this.graphHeight / gridLines;
    this._colWidth = this.graphWidth / 24;
    this._vertLines = {
      relativePosition: {x: this.cm(xo), y: this.cm(yo)},
      canvas: []
    };
    this._horzLines = {
      relativePosition: {x: this.cm(xo - 0.2), y: this.cm(yo)},
      canvas: []
    };
    this._graphLines = {
      relativePosition: {x: this.cm(xo), y: this.cm(yo)},
      stack: []
    };
    const frontLines: any = {
      relativePosition: {x: this.cm(xo), y: this.cm(yo)},
      canvas: []
    };
    const horzLegend: any = {stack: []};
    const vertLegend: any = {stack: []};
    const graphics: any[] = [];
    const graphLegend: any = {
      relativePosition: {x: this.cm(xo), y: this.cm(yo)},
      stack: []
    };
    this._vertCvs = this._vertLines.canvas;
    this._horzCvs = this._horzLines.canvas;
    this._horzStack = horzLegend.stack;
    this._vertStack = vertLegend.stack;

    // draw vertical lines with times below graphic
    for (let i = 0; i < 25; i++) {
      const line = {
        type: 'line',
        x1: this.cm(i * this._colWidth),
        y1: this.cm(0),
        x2: this.cm(i * this._colWidth),
        y2: this.cm(this.graphHeight * this.graphCount),
        lineWidth: this.cm(this.lw),
        lineColor: i == 0 || i == 24 ? this.lcFrame : this.lc
      };

      if (i == 0 || i == 24) {
        frontLines.canvas.push(line);
      } else {
        this._vertCvs.push(line);
      }
      if (i < 24) {
        this._horzStack.push({
          relativePosition: {
            x: this.cm(xo + i * this._colWidth),
            y: this.cm(yo + this.graphHeight * this.graphCount + 0.05)
          },
          text: this.fmtTime(i, {withMinutes: false}),
          fontSize: this.fs(7)
        });
      }
    }

    if (lineHeight == 0) {
      return new PageData(this.isPortrait, [
        this.headerFooter(),
        {
          relativePosition: {x: this.cm(xo), y: this.cm(yo)},
          text: this.msgMissingData
        }
      ]);
    }

    let yGraph = 0;

    // graphic for glucose
    if (this.showGlucose) {
      for (let i = 0; i <= gridLines; i++) {
        this._horzCvs.push({
          type: 'line',
          x1: this.cm(0),
          y1: this.cm((gridLines - i) * lineHeight - this.lw / 2),
          x2: this.cm(24 * this._colWidth + 0.4),
          y2: this.cm((gridLines - i) * lineHeight - this.lw / 2),
          lineWidth: this.cm(this.lw),
          lineColor: this.lc
        });

        if (i > 0) {
          //        string text = '${glucFromData(GLOBALS.fmtNumber(i * 50, 0))}\n${getGlucInfo()['unit']}';
          const text = `${GLOBALS.glucFromData(GLOBALS.fmtNumber(i * glucScale, 0))}`;
          this._vertStack.push({
            relativePosition: {
              x: this.cm(xo - 1.1),
              y: this.cm(yo + (gridLines - i) * lineHeight - 0.25)
            },
            text: text,
            fontSize: this.fs(8)
          });
          this._vertStack.push({
            relativePosition: {
              x: this.cm(xo + 24 * this._colWidth + 0.3),
              y: this.cm(yo + (gridLines - i) * lineHeight - 0.25)
            },
            text: text,
            fontSize: this.fs(8)
          });
        } else {
          const text = `${GLOBALS.getGlucInfo().unit}`;
          this._vertStack.push({
            relativePosition: {
              x: this.cm(xo - 1.5),
              y: this.cm(yo + (gridLines - i) * lineHeight - 0.25)
            },
            columns: [
              {
                width: this.cm(1.2),
                text: text,
                fontSize: this.fs(8),
                alignment: 'right'
              }
            ]
          });
          this._vertStack.push({
            relativePosition: {
              x: this.cm(xo + 24 * this._colWidth + 0.3),
              y: this.cm(yo + (gridLines - i) * lineHeight - 0.25)
            },
            text: text,
            fontSize: this.fs(8)
          });
        }
      }

      const date = new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate());
      const profile = this.repData.profile(date).profile;
      const yHigh = this.glucY(Math.min(this.glucMax, this.repData.status.settings.bgTargetTop));
      const yLow = this.glucY(this.repData.status.settings.bgTargetBottom);
      const targetValues: any[] = [];
      let lastTarget = -1.0;
      for (let i = 0; i < profile.store.listTargetLow.length; i++) {
        const low = profile.store.listTargetLow[i].value * GLOBALS.glucFactor;
        const high = profile.store.listTargetHigh[i].value * GLOBALS.glucFactor;
        const x = this.glucX(profile.store.listTargetLow[i].time(day.date));
        const y = this.glucY((low + high) / 2);
        if (lastTarget >= 0) {
          targetValues.push({x: this.cm(x), y: this.cm(lastTarget)});
        }
        targetValues.push({x: this.cm(x), y: this.cm(y)});
        lastTarget = y;
      }
      targetValues.push({
        x: this.cm(this.glucX(new Date(0, 1, 1, 23, 59, 59, 999))),
        y: this.cm(lastTarget)
      });

      const graph: any = {
        relativePosition: {x: this.cm(xo), y: this.cm(yo + yGraph)},
        canvas: [
          {
            type: 'rect',
            x: this.cm(0.0),
            y: this.cm(yHigh),
            w: this.cm(24 * this._colWidth),
            h: this.cm(yLow - yHigh),
            color: this.colTargetArea,
            fillOpacity: 0.3
          },
          {
            type: 'line',
            x1: this.cm(0.0),
            y1: this.cm(yHigh),
            x2: this.cm(24 * this._colWidth),
            y2: this.cm(yHigh),
            lineWidth: this.cm(this.lw),
            lineColor: this.colTargetArea
          },
          {
            type: 'polyline',
            lineWidth: this.cm(this.lw),
            closePath: false,
            lineColor: this.colTargetValue,
            points: targetValues
          },
          {
            type: 'line',
            x1: this.cm(0.0),
            y1: this.cm(yLow),
            x2: this.cm(24 * this._colWidth),
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
      const graphCvs = graph.canvas;
      this.glucMax = gridLines * glucScale;
      for (const entry of day.bloody) {
        const x = this.glucX(entry.time);
        const y = this.glucY(entry.mbg);
        graphCvs.push({
          type: 'rect',
          x: this.cm(x),
          y: this.cm(y),
          w: this.cm(0.1),
          h: this.cm(0.1),
          color: this.colBloodValues
        });
      }
      for (const t of day.treatments) {
        if (t.isBloody) {
          const x = this.glucX(t.createdAt);
          const y = this.glucY((GLOBALS.glucFactor) * t.glucose);
          graphCvs.push({
            type: 'rect',
            x: this.cm(x),
            y: this.cm(y),
            w: this.cm(0.1),
            h: this.cm(0.1),
            color: this.colBloodValues
          });
        }
      }
      let points: any[] = [];
      let last: EntryData = null;
      for (const entry of day.entries) {
        const x = this.glucX(entry.time);
        const y = this.glucY(entry.gluc);
        if (entry.gluc < 0) {
          if (last != null && last.gluc >= 0) {
            graphCvs.push(this.glucLine(points));
            points = [];
          }
        } else {
          points.push({x: this.cm(x), y: this.cm(y)});
        }
        last = entry;
      }
      graphCvs.push(this.glucLine(points));
      for (const t of day.treatments) {
        let x: number;
        let y: number;
        if (this.showSMB && t.isSMB && t.insulin > 0) {
          const entry = day.findNearest(day.entries, null, t.createdAt);
          x = this.glucX(t.createdAt);
          if (entry != null && this.showSMBAtGluc) {
            y = this.glucY(entry.gluc);
          } else {
            y = this.glucY(this.repData.targetValue(t.createdAt)) + this.lw / 2;
          }
          this.paintSMB(t.insulin, x, y, graphCvs);
        }
      }
      graphics.push(graph);
      yGraph += this.graphHeight;
    }

    // graphic for profile basalrate
    if (this.showProfileBasal) {
      // graphic for basalrate
      this.basalMax = -1000.0;
      for (const entry of day.basalData.store.listBasal) {
        this.basalMax = Math.max((entry.value ?? 0) + 0.2, this.basalMax);
      }

      this.basalHeight = this.drawScaleIE(
        xo,
        yo,
        this.graphHeight,
        yGraph,
        0.0,
        this.basalMax,
        this._colWidth,
        this._horzCvs,
        this._vertStack,
        [this.S(3, 0.5), this.S(1.5, 0.2), this.S(0, 0.1)],
        (i, step, value) =>
          `${GLOBALS.fmtNumber(value ?? i * step, 1)} ${this.msgInsulinUnit}`);
      const profileBasal = this.getBasalGraph(yGraph, day, true, xo, yo);
      graphics.push(profileBasal);
      yGraph += this.graphHeight;
    }

    // graphic for day basalrate
    if (this.showDayBasal) {
      this.profMax = -1000.0;
      for (const entry of day.profile) {
        this.profMax = Math.max((entry.tempAdjusted ?? 0), this.profMax);
      }
      this.profMax = this.profMax * 100.0;
      const step = this.profMax + 100 > 300 ? 50 : this.profMax + 100 > 150 ? 20 : 10;
      gridLines = Math.floor(((this.profMax + 100) / step) + 1);
      lineHeight = gridLines == 0 ? 0 : this.graphHeight / gridLines;
      let top = yGraph + this.graphHeight - (gridLines - 1) * lineHeight;
      this.basalHeight = (yGraph + this.graphHeight - top) - (100 / step) * lineHeight;
      top -= this.lw * 3;
      for (let i = 1; i < gridLines; i++) {
        const y = yGraph + this.graphHeight - i * lineHeight - this.lw / 2 - this.lw * 3;
        this._horzCvs.push({
          type: 'line',
          x1: this.cm(0),
          y1: this.cm(y),
          x2: this.cm(24 * this._colWidth + 0.2),
          y2: this.cm(y),
          lineWidth: this.cm(this.lw),
          lineColor: i > 0 ? this.lc : this.lcFrame
        });
        //      vertCvs.push({relativePosition: {x: this.cm(xo - 0.7), y: this.cm(yo + (gridLines - i) * lineHeight - 0.15)}, text: GLOBALS.fmtNumber(i / 10, 1), fontSize: this.fs(8)});
        const text = `${GLOBALS.fmtNumber(-100 + i * step)} %`;
        this._vertStack.push({
          relativePosition: {x: this.cm(xo - 1.0), y: this.cm(yo + y - 0.15)},
          text: text,
          fontSize: this.fs(8)
        });
        this._vertStack.push({
          relativePosition: {
            x: this.cm(xo + this._colWidth * 24 + 0.3),
            y: this.cm(yo + y - 0.15)
          },
          text: text,
          fontSize: this.fs(8)
        });
      }
      const dayBasal = this.getBasalGraph(top, day, false, xo, yo);
      graphics.push(dayBasal);
      yGraph += this.graphHeight;
    }

    // for (BoluscalcData entry in listIobCob)
    // {
    //   number x = glucX(entry.eventTime);
    //   number y;
    //   if (entry.iob > 0)
    //   {
    //     y = graphHeight / maxIob * (maxIob - entry.iob);
    //     ptsIob.push({x: this.cm(x), y: this.cm(y)});
    //     lastIobX = x;
    //   }
    //   if (entry.carbs > 0)
    //   {
    //     y = graphHeight / maxCob * (maxCob - entry.carbs);
    //     ptsCob.push({x: this.cm(x), y: this.cm(y)});
    //     lastCobX = x;
    //   }
    // }

    const topIob = this.showIOB ? yGraph : -1;
    const topCob = this.showCOB ? (this.showIOB ? yGraph + this.graphHeight : yGraph) : -1;

    const pts = this.getIobCob(xo, yo, topIob, topCob, this.graphWidth, this.graphHeight,
      this._horzCvs, this._vertStack, day);
    if (this.showIOB) {
      const graphIob: any = {
        relativePosition: {
          x: this.cm(xo),
          y: this.cm(yo + yGraph + this.graphHeight - pts['iobHeight'])
        },
        canvas: []
      };
      graphIob.canvas.push(this.graphArea(pts.iob, this.colIOBLine, this.colIOBFill));
      graphics.push(graphIob);
      yGraph += this.graphHeight;
    }
    if (this.showCOB) {
      const graphCob: any = {
        relativePosition: {
          x: this.cm(xo),
          y: this.cm(yo + yGraph + this.graphHeight - pts['cobHeight'])
        },
        canvas: []
      };
      graphCob.canvas.push(this.graphArea(pts.cob, this.colCOBLine, this.colCOBFill));
      graphics.push(graphCob);
      // yGraph += this.graphHeight;
    }

    // horizontal lines between regions
    for (let i = 1; i <= this.graphCount; i++) {
      frontLines.canvas.push({
        type: 'line',
        x1: this.cm(-0.2),
        y1: this.cm(this.graphHeight * i - this.lw / 2),
        x2: this.cm(24 * this._colWidth + 0.2),
        y2: this.cm(this.graphHeight * i - this.lw / 2),
        lineWidth: this.cm(this.lw),
        lineColor: this.lcFrame
      });
    }

    const ret = [
      this.headerFooter(),
      horzLegend,
      vertLegend,
    ];
    for (const graph of graphics) {
      ret.push(graph);
    }
    ret.push(...[frontLines, graphLegend, this._horzLines, this._vertLines, this._graphLines]);
    return new PageData(this.isPortrait, ret);
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

    const basalCvs: any[] = [];
    const ret = {
      stack: [
        {
          relativePosition: {x: this.cm(xo), y: this.cm(yo + top)},
          canvas: basalCvs
        }
      ]
    };
    let lastY = null;
    const areaPoints: any[] = [];
    const area = {
      type: 'polyline',
      lineWidth: this.cm(this.lw),
      closePath: true,
      color: this.blendColor(color, '#ffffff', 0.7),
      points: areaPoints,
      //      fillOpacity: opacity
    };

    const temp: ProfileEntryData[] = [];
    for (const entry of data) {
      temp.push(entry);
    }

    if (useProfile) {
      temp.sort((a, b) =>
        Utils.compareDate(a.time(day.date, useProfile), b.time(day.date, useProfile)));

      if (temp.length > 0 && temp[0].timeAsSeconds != -temp[0].localDiff * 60 * 60) {
        const clone = temp[0].clone(new Date(0, 1, 1, -temp[0].localDiff, 0));
        temp.splice(0, 0, clone);
      }
    }

    areaPoints.push({
      x: this.cm(this.basalX(new Date(0, 1, 1, 0, 0))),
      y: this.cm(useProfile ? this.basalY(0.0, this.basalMax) : this.basalHeight)
    });
    for (const entry of temp) {
      const x = this.basalX(entry.time(day.date, useProfile));
      const y = useProfile
        ? this.basalY(entry.value, this.basalMax)
        : this.basalHeight / this.profMax * (this.profMax - entry.tempAdjusted * 100);
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
      y: this.cm(useProfile ? this.basalY(0.0, this.basalMax) : this.basalHeight)
    });
    basalCvs.push(area);

    this._graphLines.stack.push({
      relativePosition: {x: this.cm(0), y: this.cm(top)},
      canvas: [
        {
          type: 'polyline',
          lineWidth: this.cm(this.lw),
          closePath: true,
          lineColor: color,
          points: areaPoints
        }
      ]
    });
//    basalCvs.push({type: 'rect', x: 0, y: 0, w: 1, h: 1, fillOpacity: 1});
    return ret;
  }

}
