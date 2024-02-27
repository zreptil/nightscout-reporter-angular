import {BasePrint} from '@/forms/base-print';
import {PageData} from '@/_model/page-data';
import {ParamInfo} from '@/_model/param-info';
import {PdfService} from '@/_services/pdf.service';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {Utils} from '@/classes/utils';
import {DayData} from '@/_model/nightscout/day-data';
import {ProfileStoreData} from '@/_model/nightscout/profile-store-data';
import {ProfileGlucData} from '@/_model/nightscout/profile-gluc-data';
import {EntryData} from '@/_model/nightscout/entry-data';
import {Log} from '@/_services/log.service';
import {PentagonData} from '@/_model/nightscout/pentagon-data';

class CGPResult {
  cgp: PentagonData;
  pgr: number;
  mean: number;
  hypo: number;
  hyper: number;
  tor: number;
  vark: number;
  low: number;
  high: number;
  countValid: number;
}

export class PrintCGP extends BasePrint {
  override help = $localize`:help for print-cgp@@help-cgp:Dieses Formular zeigt das Comprehensive Glucose Pentagon an, welches die Qualität der
Glukoseeinstellung in einer schnell zu erfassenden Weise darstellt. Es wird für den ausgewählten Zeitraum angezeigt
wie lange der Glukosewert im Schnitt während des Tages ausserhalb des Zielbereichs war, wie hoch die Intensität
der Überzuckerungen und der Unterzuckerungen war, wie hoch der Mittelwert war und wie hoch die Variabilität der
Werte war.

Diese Grafik kann auch bei @05@ und @08@ ausgegeben werden.`;

  override baseId = 'cgp';
  override baseIdx = '10';
  isFormParam1: boolean;
  override params = [
    new ParamInfo(0, BasePrint.msgOrientation, {
      list: [$localize`Hochformat`, $localize`Querformat`]
    }),
    new ParamInfo(1, PrintCGP.msgParamAreaLines, {boolValue: true}),
  ];

  override subtitle = $localize`Comprehensive Glucose Pentagon`;

  override _isPortrait = true;
  showAreaLines: boolean;

  constructor(ps: PdfService, suffix: string = null) {
    super(ps);
    this.footerTextAboveLine = {x: 0, y: 1.2, fs: 8, text: this.msgSource};
    this.init(suffix);
  }

  static get msgParam1(): string {
    return $localize`Parameter für PrintCgp`;
  }

  static get msgParamAreaLines(): string {
    return $localize`Linien um Bereiche`;
  }

  override get backsuffix(): string {
    return this.isPortraitParam ? '' : 'landscape';
  }

  override get title(): string {
    return $localize`CGP`;
  }

  override get estimatePageCount(): any {
    return {count: 1, isEstimated: false};
  }

  static getCGPPage(dayList: any, showAreaLines: boolean, base: BasePrint): PageData {
    const cgpPage = new PrintCGP(base.ps);
    cgpPage.repData = base.repData;
    cgpPage.scale = base.scale;
    Log.todo('BasePrint.title muss noch überdacht werden');
    // this.title = cgpPage.title;
    base.subtitle = cgpPage.subtitle;
    const cgpSrc = cgpPage.calcCGP(dayList, 1.0, 0, 0.3, showAreaLines);
    const cgp = cgpSrc.cgp;
    base.footerTextAboveLine = cgpPage.footerTextAboveLine;
    base.footerTextAboveLine.y = 0.9;
    const x = base.xorg + 2 * cgp.axisLength / cgp.scale + 1.2;
    const y = base.yorg + 2.0;
    const ret = [
      base.headerFooter(),
      {
        relativePosition: {x: base.cm(base.xorg) + base.cm(cgp.axisLength / cgp.scale), y: base.cm(y)},
        canvas: cgp.outputCvs
      },
      {
        relativePosition: {x: base.cm(base.xorg) + base.cm(cgp.axisLength / cgp.scale), y: base.cm(y)},
        stack: cgp.outputText
      },
      cgpPage.infoTable(cgpSrc, cgp.glucInfo['unit'], x, y, 2.5, base.width - x - base.xorg - 2.5)
    ];
    return new PageData(base.isPortrait, ret);
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
    this.showAreaLines = this.params[1].boolValue;
  }

  override fillPages(pages: PageData[]): void {
    this._isPortrait = this.isPortraitParam;
    pages.push(this.getPage());
    if (GLOBALS.showBothUnits) {
      GLOBALS.glucMGDLIdx = 1;
      pages.push(this.getPage());
      GLOBALS.glucMGDLIdx = 2;
    }
  }

  getPage(): PageData {
    this.titleInfo = this.titleInfoBegEnd();
    if (!this.isPortrait) {
      return PrintCGP.getCGPPage(this.repData.data.days, this.showAreaLines, this);
    }

    const cgpSrc = this.calcCGP(this.repData.data.days, this.scale, this.width / 2 - this.xorg, 0, this.showAreaLines);
    const cgp = cgpSrc.cgp;
    const ret = [
      this.headerFooter(),
      {
        relativePosition: {x: this.cm(this.xorg), y: this.cm(this.yorg)},
        canvas: cgp.outputCvs
      },
      {
        relativePosition: {x: this.cm(this.xorg), y: this.cm(this.yorg)},
        stack: cgp.outputText
      },
      this.infoTable(
        cgpSrc,
        cgp.glucInfo.unit,
        this.xorg,
        this.yorg + cgp.ym + cgp.axisLength * cgp.scale + 1.0,
        2.5,
        this.width - 2 * this.xorg - 2.5)
    ];
    return new PageData(this.isPortrait, ret);
  }

  infoTable(cgp: any, unit: string, x: number, y: number,
            widthId: number, widthText: number): any {
    const pgr = cgp.pgr;
    return {
      relativePosition: {x: this.cm(x), y: this.cm(y)},
      //        margin: [this.cm(this.xorg), this.cm(0)],
      layout: 'noBorders',
      fontSize: this.fs(8),
      table: {
        headerRows: 0,
        widths: [this.cm(widthId), this.cm(widthText)],
        body: [
          [
            {text: PentagonData.msgGreen, colSpan: 2},
            {}
          ],
          [
            {text: PentagonData.msgYellow, colSpan: 2}, {}
            //            {text: '${cgp['countValid']}'}
          ],
          [
            {
              text: cgp.cgp.hasLimitBreakers
                ? PentagonData.msgYellowCircle
                : null,
              colSpan: 2
            }
          ],
          [
            {text: PentagonData.msgTOR(GLOBALS.fmtNumber(cgp['tor']))},
            {
              text: PentagonData.msgTORInfo(
                `${GLOBALS.glucFromData(cgp.low)} ${unit}`,
                `${GLOBALS.glucFromData(cgp.high)} ${unit}`)
            },
          ],
          [
            {text: PentagonData.msgCV(GLOBALS.fmtNumber(cgp.vark))},
            {text: PentagonData.msgCVInfo}
          ],
          [
            {text: PentagonData.msgHYPO(unit, GLOBALS.glucFromData(cgp.hypo))},
            {
              text: PentagonData.msgHYPOInfo(`${GLOBALS.glucFromData(cgp.low)} ${unit}`)
            }
          ],
          [
            {text: PentagonData.msgHYPER(unit, GLOBALS.glucFromData(cgp.hyper))},
            {
              text: PentagonData.msgHYPERInfo(`${GLOBALS.glucFromData(cgp.high)} ${unit}`)
            }
          ],
          [
            {text: PentagonData.msgMEAN(unit, GLOBALS.glucFromData(cgp.mean))},
            {
              text: PentagonData.msgMEANInfo(this.hba1c(Utils.parseNumber(GLOBALS.glucFromData(cgp.mean))))
            }
          ],
          [
            {
              margin: [this.cm(0), this.cm(0.5), this.cm(0), this.cm(0)],
              text: PentagonData.msgPGR
            },
            {
              margin: [this.cm(0), this.cm(0.5), this.cm(0), this.cm(0)],
              text: PentagonData.msgPGRInfo
            }
          ],
          [
            {text: PentagonData.msgPGR02, bold: pgr != null && pgr < 2.1},
            {
              text: PentagonData.msgPGR02Info,
              bold: pgr != null && pgr < 2.1
            }
          ],
          [
            {
              text: PentagonData.msgPGR23,
              bold: pgr != null && pgr >= 2.1 && pgr < 3.1
            },
            {
              text: PentagonData.msgPGR23Info,
              bold: pgr != null && pgr >= 2.1 && pgr < 3.1
            }
          ],
          [
            {
              text: PentagonData.msgPGR34,
              bold: pgr != null && pgr >= 3.1 && pgr < 4.1
            },
            {
              text: PentagonData.msgPGR34Info,
              bold: pgr != null && pgr >= 3.1 && pgr < 4.1
            }
          ],
          [
            {
              text: PentagonData.msgPGR45,
              bold: pgr != null && pgr >= 4.1 && pgr < 4.6
            },
            {
              text: PentagonData.msgPGR45Info,
              bold: pgr != null && pgr >= 4.1 && pgr < 4.6
            }
          ],
          [
            {text: PentagonData.msgPGR5, bold: pgr != null && pgr >= 4.6},
            {
              text: PentagonData.msgPGR5Info,
              bold: pgr != null && pgr >= 4.6
            }
          ],
        ]
      }
    };
  }

  _calcAUC(data: any, low: number, high: number): any {
    let hyperAUC = 0.0;
    let hypoAUC = 0.0;

    if (data instanceof DayData) {
      return this._calcAUCForDay(data, low, high);
    } else if (Array.isArray(data)) {
      // calculate area under curve for values >= 180 mg/dl and values <= 70 mg/dl
      // loop through every day in period
      for (const day of data) {
        const auc = this._calcAUCForDay(day, low, high);
        hyperAUC += auc.hyper;
        hypoAUC += auc.hypo;
      }

      hyperAUC /= data.length;
      hypoAUC /= data.length;
    }

    return {hyper: hyperAUC, hypo: hypoAUC};
  }

  _calcAUCForDay(day: DayData, low: number, high: number): any {
    let hyperTime = 0.0;
    let hyper = 0.0;
    let hypoTime = 0.0;
    let hypo = 0.0;
    // loop through every entry in the day
    for (const entry of day.entries) {
      if (entry.isGap) {
        continue;
      }
      // if gluc is 180 or above
      // add area under curve for 5 minutes
      if (entry.gluc >= high) {
        hyper += entry.gluc * 5;
        hyperTime += 5;
      }

      // if gluc is 70 or below
      // add area under curve for 5 minutes
      if (entry.gluc <= low) {
        hypo += (low - entry.gluc) * 5;
        hypoTime += 5;
      }
    }
    // calculate value for hyper
    hyper = Math.sqrt(hyper * hyper + hyperTime * hyperTime) / 1000;
    // calculate value for hypo
    hypo = Math.sqrt(hypo * hypo + hypoTime * hypoTime) / 1000;

    return {hyper: hyper, hypo: hypo};
  }

  calcCGP(dayData: any, scale: number, xm: number, ym: number, showAreaLines: boolean): CGPResult {
    const deviceKey = 'all';
    const ret = new CGPResult();
    ret.cgp = new PentagonData(GLOBALS.getGlucInfo(), this, {
      xm: xm, ym: ym, scale: scale, showAreaLines: showAreaLines
    });
    ret.cgp.ym += ret.cgp.axisLength * 1.1 * ret.cgp.scale;
    ret.cgp.paintPentagon(1.0, this.lw, {colLine: this.colCGPLine});
    ret.cgp.paintAxis(this.lw, this.colValue);

    ret.low = GlobalsData.stdLow;
    ret.high = GlobalsData.stdHigh;

    if (!GLOBALS.ppStandardLimits && !GLOBALS.ppCGPAlwaysStandardLimits) {
      ret.low = this.repData.status.settings.bgTargetBottom;
      ret.high = this.repData.status.settings.bgTargetTop;
    }

    const areaHealthy = ret.cgp.paintValues([0, 16.7, 0, 0, 90], this.lw, {
      colLine: this.colCGPHealthyLine,
      colFill: this.colCGPHealthyFill,
      opacity: 0.4,
      showLimitBreaks: false,
      limitValues: false
    });

    const data = this.repData.data;
    const totalDay = new DayData(null, new ProfileGlucData(new ProfileStoreData('Intern')));
    Utils.pushAll(totalDay.entries, data.entries);
    totalDay.init();
    ret.mean = 0.0;
    ret.vark = 0.0;
    ret.countValid = data.countValid;
    let countTiR = data.entries.filter((entry) => !entry.isGlucInvalid && entry.gluc >= ret.low && entry.gluc <= ret.high).length;
    // let countAll = data.entries.length;

    if (dayData instanceof DayData) {
      ret.mean = dayData.avgGluc(deviceKey);
      ret.vark = dayData.varK(deviceKey);
      ret.countValid = dayData.entryCountValid(deviceKey);
      countTiR = dayData.entriesFor(deviceKey).filter((entry: EntryData) => !entry.isGlucInvalid && entry.gluc >= ret.low && entry.gluc <= ret.high).length;
      // countAll = dayData.entries.length;
    } else if (Array.isArray(dayData)) {
      ret.countValid = 0;
      countTiR = 0;
      for (const day of dayData) {
        countTiR += day.entries.filter((entry: EntryData) => !entry.isGlucInvalid && entry.gluc >= ret.low && entry.gluc <= ret.high).length;
        for (const entry of day.entries) {
          if (!entry.isGlucInvalid) {
            ret.mean += entry.gluc;
            ret.countValid++;
          }
        }
      }
      if (ret.countValid > 0) {
        ret.mean /= ret.countValid;
        let varianz = 0.0;
        for (const day of dayData) {
          for (const entry of day.entries) {
            if (!entry.isGlucInvalid) {
              varianz += Math.pow(entry.gluc - ret.mean, 2);
            }
          }
        }
        varianz /= ret.countValid;
        if (ret.mean > 0) {
          ret.vark = Math.sqrt(varianz) / ret.mean * 100;
        }
      }
    }

    if (ret.countValid > 0 && areaHealthy > 0) {
      ret.tor = 1440 - countTiR / ret.countValid * 1440;
      const auc = this._calcAUC(dayData, ret.low, ret.high);
      ret.hyper = auc.hyper;
      ret.hypo = auc.hypo;
      const areaPatient = ret.cgp.paintValues(
        [ret.tor, ret.vark, ret.hypo, ret.hyper, ret.mean], this.lw,
        {colLine: this.colCGPPatientLine, colFill: this.colCGPPatientFill, opacity: 0.4});
      //    number areaPatient = 1.0;
      ret.pgr = areaPatient / areaHealthy;

      ret.cgp.outputText.push({
        relativePosition: {
          x: this.cm(ret.cgp.xm - 2.5),
          y: this.cm(ret.cgp.ym + ret.cgp.axisLength * ret.cgp.scale * 0.9)
        },
        columns: [
          {
            width: this.cm(5.0),
            text: `${PentagonData.msgPGR} = ${GLOBALS.fmtNumber(ret.pgr, 1)}`,
            color: this.colCGPPatientLine,
            fontSize: this.fs(12 * ret.cgp.scale),
            alignment: 'center'
          }
        ]
      });
      return ret;
    }
    return ret;
  }
}
