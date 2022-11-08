import {PageData} from '@/_model/page-data';
import {ParamInfo} from '@/_model/param-info';
import {PdfService} from '@/_services/pdf.service';
import {GLOBALS} from '@/_model/globals-data';
import {BaseProfile, CalcData} from './base-profile';
import {ProfileGlucData} from '@/_model/nightscout/profile-gluc-data';

export class PrintBasalrate extends BaseProfile {
  static gridHeight = 11.5;
  static gridWidth = 24.0;
  static graphWidth = PrintBasalrate.gridWidth / 25.0 * 24.0;
  override help = $localize`:help for basal@@help-basal:Dieses Formular zeigt die Basalrate, die im Profil eingestellt ist in graphischer Form an.
Es werden normalerweise alle Basalraten des ausgewählten Zeitraums ausgegeben. Wenn sich in dem Zeitraum
die Basalrate geändert hat, wird eine neue Seite erzeugt.

Es gibt aber eine Option, welche nur die letzte Basalrate des Zeitraums ausgibt.`;
  override baseId = 'basal';
  override baseIdx = '09';
  override params = [
    new ParamInfo(0, PrintBasalrate.msgParam1, {boolValue: false}),
    new ParamInfo(1, BaseProfile.msgNamedProfile(BaseProfile.namedProfileName), {boolValue: false}),
  ];
  override mayShowBothUnits = false;
  lineWidth: number;

  constructor(ps: PdfService, suffix: string = null) {
    super(ps, suffix);
  }

  static get msgParam1(): string {
    return $localize`Nur letzte Basalrate ausgeben`;
  }

  override get isLocalOnly(): boolean {
    return true;
  }

  override get title(): string {
    return this.msgBasalrate;
  }

  override get estimatePageCount(): any {
    return {count: 1, isEstimated: !this.onlyLast};
  }

  override get imgList(): string[] {
    return ['nightscout'];
  }

  override get isPortrait(): boolean {
    return false;
  }

  glucX(time: Date): number {
    return PrintBasalrate.graphWidth / 1440 * (time.getHours() * 60 + time.getMinutes());
  }

  override extractParams(): void {
    this.onlyLast = this.params[0].boolValue;
    this.namedProfile = this.params[1].boolValue;
  }

  getPage(page: number, profile: ProfileGlucData, calc: CalcData): PageData {
    if (page > 0) {
      return null;
    }
    this.subtitle = profile.store.name;
    // titleInfo = titleInfoTimeRange(profStartTime, profEndTime);
    this.titleInfo = this.msgValidFrom(GLOBALS.fmtDateTime(profile.store.startDate));
    //    getPage(ProfileGlucData profile, CalcData calc)
    //  {
    let xo = this.xorg;
    let yo = this.yorg;
    //    titleInfo = titleInfoForDates(profile.startDate, calc.endDate);

    let brMax = 0.0;
    const brtimes = profile.store.listBasal;
    for (let i = 0; i < brtimes.length; i++) {
      brMax = Math.max(brtimes[i].value, brMax);
    }

    const step = brMax > 6 ? 0.5 : brMax > 3 ? 0.2 : 0.1;

    const gridLines = Math.floor((brMax / step) + 1);
    let lineHeight = PrintBasalrate.gridHeight / gridLines;
    const colWidth = PrintBasalrate.gridWidth / 25;

    const lw = this.cm(0.03);
    const lc = '#a0a0a0';
    const vertLines: any = {
      relativePosition: {x: this.cm(xo), y: this.cm(yo)},
      canvas: []
    };
    let horzLines: any = {
      relativePosition: {x: this.cm(xo - 0.2), y: this.cm(yo)},
      canvas: []
    };
    let horzLegend: any = {stack: []};

    const vertCvs = vertLines.canvas as any[];
    const horzCvs = vertLines.canvas as any[];
    const horzStack = horzLegend.stack;
    for (let i = 0; i < 25; i++) {
      vertCvs.push({
        type: 'line',
        x1: this.cm(i * colWidth),
        y1: this.cm(0),
        x2: this.cm(i * colWidth),
        y2: this.cm(lineHeight * gridLines + 0.25),
        lineWidth: lw,
        lineColor: i > 0 && i < 24 ? lc : this.lcFrame
      });
      if (i < 24) {
        vertCvs.push({
          type: 'line',
          x1: this.cm((i + 0.5) * colWidth),
          y1: this.cm(lineHeight * gridLines),
          x2: this.cm((i + 0.5) * colWidth),
          y2: this.cm(lineHeight * gridLines + 0.1),
          lineWidth: lw,
          lineColor: lc
        });
        horzCvs.push({
          relativePosition: {x: this.cm(xo + i * colWidth), y: this.cm(yo + gridLines * lineHeight + 0.3)},
          text: GLOBALS.fmtNumber(i, 0),
          fontSize: this.fs(8)
        });
        horzStack.push({
          relativePosition: {x: this.cm(xo + i * colWidth), y: this.cm(yo + gridLines * lineHeight + 0.3)},
          text: this.fmtTime(i, {def: '0'}),
          fontSize: this.fs(8)
        });
      }
    }
    const vertLegend: any = {stack: []};
    const vertStack: any = vertLegend.stack as any[];
    for (let i = 0; i <= gridLines; i++) {
      horzCvs.push({
        type: 'line',
        x1: this.cm(-0.2),
        y1: this.cm((gridLines - i) * lineHeight) - lw / 2,
        x2: this.cm(24 * colWidth + 0.2),
        y2: this.cm((gridLines - i) * lineHeight) - lw / 2,
        lineWidth: lw,
        lineColor: i > 0 ? lc : this.lcFrame
      });
      //      vertCvs.add({relativePosition: {x: this.cm(xo - 0.7), y: this.cm(yo + (gridLines - i) * lineHeight - 0.15)},
      //      text: GLOBALS.fmtNumber(i / 10, 1), fontSize: fs(8)});
      let text = `${GLOBALS.fmtNumber(i * step, 1)} ${this.msgInsulinUnit}`;
      vertStack.push({
        relativePosition: {x: this.cm(xo - 1.0), y: this.cm(yo + (gridLines - i) * lineHeight - 0.15)},
        text: text,
        fontSize: this.fs(8)
      });
      vertStack.push({
        relativePosition: {x: this.cm(xo + colWidth * 24 + 0.3), y: this.cm(yo + (gridLines - i) * lineHeight - 0.15)},
        text: text,
        fontSize: this.fs(8)
      });
    }
    const testArea: any = {
      relativePosition: {x: this.cm(xo), y: this.cm(yo)},
      canvas: []
    };
    const glucArea: any = {
      relativePosition: {x: this.cm(xo), y: this.cm(yo)},
      canvas: []
    };
    const glucValues: any = {stack: []};
    const brArea: any = {
      relativePosition: {x: this.cm(xo), y: this.cm(yo)},
      canvas: []
    };
    let brAreaCvs = brArea.canvas as any[];
    let date = new Date(this.profStartTime.getFullYear(),
      this.profStartTime.getMonth(),
      this.profStartTime.getDate());
    for (let i = 0; i < brtimes.length; i++) {
      let x = this.glucX(brtimes[i].time(date));
      let w = 0.0;
      if (i < brtimes.length - 1) {
        w = this.glucX(brtimes[i + 1].time(date)) - x;
      } else {
        w = PrintBasalrate.graphWidth - x;
      }

      let showBar = true;
      // if (isSingleDay)
      // {
      //   DateTime startTime = brtimes[i].time(date);
      //   DateTime endTime = brtimes[i].time(date).add(Duration(minutes: 59));
      //   showBar = isSingleDayRange(startTime, endTime);
      // }
      if (showBar) {
        brAreaCvs.push({
          type: 'rect',
          x: this.cm(x),
          y: this.cm(lineHeight * gridLines),
          w: this.cm(w),
          h: this.cm(-brtimes[i].value / step * lineHeight),
          color: this.colBasalProfile,
        });
      }
    }
    xo -= 1.0;
    yo += lineHeight * gridLines + 1.5;

    lineHeight = 0.7;
    let brTable: any = {
      relativePosition: {x: this.cm(xo), y: this.cm(yo)},
      canvas: []
    };
    let brTableCvs = brTable.canvas as any[];
    brTableCvs.push({
      type: 'rect',
      x: this.cm(0),
      y: this.cm(0),
      w: this.cm(24 * colWidth + 2.0),
      h: this.cm(lineHeight),
      color: this.colBasalProfile,
    });
    brTableCvs.push({
      type: 'rect',
      x: this.cm(0),
      y: this.cm(lineHeight),
      w: this.cm(24 * colWidth + 2.0),
      h: this.cm(lineHeight),
      color: this.blendColor(this.colBasalProfile, '#ffffff', 0.5)
    });
    brTableCvs.push({
      type: 'line',
      x1: this.cm(0),
      y1: this.cm(0),
      x2: this.cm(0),
      y2: this.cm(2 * lineHeight),
      lineWidth: lw,
      lineColor: lc
    });
    brTableCvs.push({
      type: 'line',
      x1: this.cm(24 * colWidth + 2.0),
      y1: this.cm(0),
      x2: this.cm(24 * colWidth + 2.0),
      y2: this.cm(2 * lineHeight),
      lineWidth: lw,
      lineColor: lc
    });
    for (let i = 0; i < 3; i++) {
      brTableCvs.push({
        type: 'line',
        x1: this.cm(0),
        y1: this.cm(i * lineHeight),
        x2: this.cm(24 * colWidth + 2.0),
        y2: this.cm(i * lineHeight),
        lineWidth: lw,
        lineColor: lc
      });
    }
    // let pureLayout = {'hlineWidth': 0, 'vlineWidth': 0, 'hlineColor': 0, 'vlineColor': 0, 'paddingLeft': 0,
    // 'paddingRight': 0, 'paddingTop': 0, 'paddingBottom': 0};
    // let brLegend = {
    //   relativePosition: {x: this.cm(xo), y: this.cm(yo)},
    //   'table': {
    //     'body': [
    //       [{margin: [0, this.cm(0.05), 0, 0], text: 'Uhr-\nzeit', color: colorBasalFont, alignment: 'center'}],
    //       [{margin: [0, this.cm(0.175), 0, 0], text: msgInsulinUnit, alignment: 'center'}],
    //       [{margin: [0, this.cm(0.17), 0, 0], text: 'Anpas-\nsung', alignment: 'center'}]
    //     ],
    //     'widths': [this.cm(1)]
    //   },
    //   'layout': pureLayout,
    // };
    let brLegend: any = {
      lineHeight: lineHeight,
      stack: [
        {
          relativePosition: {x: this.cm(xo), y: this.cm(yo + 0.05)},
          columns: [
            {width: this.cm(1), text: this.msgTimeShort, fontSize: this.fs(8), color: this.colBasalFont, alignment: 'center'}
          ]
        },
        {
          relativePosition: {x: this.cm(xo), y: this.cm(yo + lineHeight + 0.2)},
          columns: [
            {width: this.cm(1), text: this.msgInsulinUnit, fontSize: this.fs(8), alignment: 'center'},
          ]
        },
        //        {
        //          relativePosition: {x: this.cm(xo), y: this.cm(yo + 2 * lineHeight + 0.05)},
        //          columns: [ {width: this.cm(1), text: msgAdjustment, fontSize: fs(8), alignment: 'center'}],
        //        },
      ],
    };
    const legendTime = (brLegend.stack as any[])[0].columns as any[];
    const legendIE = (brLegend.stack as any[])[1].columns as any[];
    //    let legendAdjust = (brLegend.stack as any[])[2].columns as any[];

    let ieSum = 0.0;
    const m = [this.cm(0.1), this.cm(0.17), this.cm(0), this.cm(0)];
    for (let i = 0; i < 25; i++) {
      m[0] = this.cm(0.5);
      brTableCvs.push({
        type: 'line',
        x1: this.cm(1 + i * colWidth),
        y1: this.cm(0),
        x2: this.cm(1 + i * colWidth),
        y2: this.cm(2 * lineHeight),
        lineWidth: lw,
        lineColor: lc
      });
      let text = {
        width: this.cm(colWidth),
        margin: [i < 24 ? this.cm(0.15) : this.cm(0), this.cm(0.15), this.cm(0), this.cm(0)],
        text: (i < 24 ? GLOBALS.fmtNumber(i) : this.msgTotal),
        fontSize: this.fs(8),
        color: this.colBasalFont,
        alignment: i < 24 ? 'left' : 'center'
      };
      legendTime.push(text);
    }

    const m1 = [this.cm(0), this.cm(0), this.cm(0), this.cm(0)];
    const m2 = [this.cm(0), this.cm(0.15), this.cm(0), this.cm(0)];

    let lastHour = 0;
    for (let i = 0; i < brtimes.length; i++) {
      let hour = brtimes[i].time(date).getHours();
      let w = 0;
      m1[0] = hour - lastHour;
      m2[0] = m1[0];
      lastHour = hour;
      if (i < brtimes.length - 1) {
        w = brtimes[i + 1].time(date).getHours() - brtimes[i].time(date).getHours();
      } else {
        w = 24 - brtimes[i].time(date).getHours();
      }
      legendIE.push({
        width: this.cm(w * colWidth),
        margin: m1,
        text: GLOBALS.fmtBasal(brtimes[i].value),
        fontSize: this.fs(8),
        alignment: 'left'
      });
      // string text = '';
      // if (i < calc.nextBRTimes.length && brtimes[i].value != calc.nextBRTimes[i].value) {
      //   text = GLOBALS.fmtBasal(calc.nextBRTimes[i].value);
      //   hasAdjustment = true;
      // }
      //  //   legendAdjust.add({width: this.cm(w * colWidth), margin: m2, text: text, fontSize: fs(8), alignment: 'left'});
      ieSum += brtimes[i].value * w;
    }
    //    legendAdjust.add({width: cml(colWidth), text: '', fontSize: fs(8)});

    legendIE.push(
      {width: this.cm(colWidth), margin: this.m0, text: GLOBALS.fmtBasal(ieSum), fontSize: this.fs(8), alignment: 'center'});

    //    if (hasAdjustment) legendAdjust.add(
    //      {width: this.cm(colWidth), margin: m2, text: GLOBALS.fmtBasal(ieSumNext), fontSize: fs(8), alignment: 'center'});
    let content = [
      this.headerFooter(),
      // {relativePosition: {x: this.cm(2.2), y: this.cm(1.0)}, text: 'Basalrate', fontSize: fs(36), color: colText,
      // 'bold': true},
      // {
      //   relativePosition: {x: this.cm(20.5), y: this.cm(1.85)},
      //   text: 'gültig ${calc.endDate == null ? 'ab' : 'von'} ${fmtDate(profile.startDate)}${calc.endDate == null
      //   ? ''
      //   : ' bis${fmtDate(calc.endDate)}'} ',
      //   fontSize: fs(10),
      //   color: '#c0c0c0',
      //   'bold': true
      // },
      // {relativePosition: {x: this.cm(2.2), y: this.cm(2.95)}, canvas: [ {type: 'line', x1: 0, y1: 0,
      // x2: this.cm(25.2), y2: 0, lineWidth: this.cm(0.2), lineColor: colText}]},
      brArea,
      testArea,
      vertLegend,
      vertLines,
      horzLegend,
      horzLines,
      glucArea,
      glucValues,
      {
        relativePosition: {x: this.cm(13.5), y: this.cm(PrintBasalrate.gridHeight + 4.65)},
        text: this.msgTime,
        fontSize: this.fs(12)
      },
      brTable,
      brLegend
    ];

    return new PageData(this.isPortrait, content);
  }

  getIllegalMark(xo: number, yo: number, x: number, y: number): any {
    return [
      {
        relativePosition: {x: this.cm(xo), y: this.cm(yo)},
        type: 'ellipse',
        x: this.cm(x),
        y: this.cm(y),
        'r1': 3,
        'r2': 3
      }
    ];
  }

  getBRMark(xo: number, yo: number, x: number, y: number, gluc: number, calc: CalcData): any {
    const ret: any[] = [
      {
        relativePosition: {x: this.cm(xo), y: this.cm(yo)},
        type: 'ellipse',
        x: this.cm(x),
        y: this.cm(y),
        'r1': 3,
        'r2': 3,
        color: '#f15741'
      }
    ];
    if (Math.abs(gluc - calc.firstGluc) > 30) {
      ret[0].color = '#f00';
      ret.push({
        type: 'line',
        x1: this.cm(x - 0.1),
        y1: this.cm(y - 0.1),
        x2: this.cm(x + 0.1),
        y2: this.cm(y + 0.1),
        lineColor: '#000',
        lineWidth: this.cm(0.01)
      });
      ret.push({
        type: 'line',
        x1: this.cm(x + 0.1),
        y1: this.cm(y - 0.1),
        x2: this.cm(x - 0.1),
        y2: this.cm(y + 0.1),
        lineColor: '#000',
        lineWidth: this.cm(0.01)
      });
    }

    return ret;
  }
}
