import {BasePrint} from '@/forms/base-print';
import {PageData} from '@/_model/page-data';
import {ParamInfo} from '@/_model/param-info';
import {PdfService} from '@/_services/pdf.service';
import {GLOBALS} from '@/_model/globals-data';
import {ProfileGlucData} from '@/_model/nightscout/profile-gluc-data';
import {ProfileStoreData} from '@/_model/nightscout/profile-store-data';
import {DayData} from '@/_model/nightscout/day-data';
import {Utils} from '@/classes/utils';
import {EntryData} from '@/_model/nightscout/entry-data';

export class PrintAnalysis extends BasePrint {
  override help = $localize`:help for analysis@@help-analysis:
  Dieses Formular zeigt die Auswertung der Werte des ausgewählten
  Zeitraums. Dabei wird auch der durchscnittliche Verbrauch an Materialien
  rechnerisch ermittelt und angezeigt. Dieses Formular beinhaltet die meisten
  Informationen, die Diabetologen gerne wissen wollen.

  Der HbA1c wird rechnerisch aus den vorhandenen Daten ermittelt und weicht
  normalerweise nicht unerheblich von dem tatsächlich gemessenen Wert ab. Der
  Wert, der aus der Blutprobe ermittelt wird, gibt die tatsächliche Bindung
  von Glukose im Blut wieder. Da diese von zusätzlichen Faktoren abhängig ist
  und nicht nur von den hier verwendeten Messdaten, ergeben sich Unterschiede
  zum errechneten Wert. Vor allem, wenn es sich bei den gemessenen Werten nicht
  um Blutzucker, sondern um Gewebszucker handelt, wie er von CGM-Systemen
  verwendet wird.

  Trotzdem ist dieser Wert ein grober Anhaltspunkt für die Qualität der
  Glukoseeinstellung und wird in der vom Labor ermittelten Form gerne von
  Diabetologen als Richtwert verwendet, weshalb er hier angezeigt wird. Er wird
  aber in schwächerer Schrift ausgegeben, damit seine zweifelhafte Natur auch
  erkennbar ist.`;

  override baseId = 'analysis';
  override baseIdx = '01';
  isPreciseMaterial: boolean;
  isPreciseTarget: boolean;
  showStdAbw: boolean;
  showHypoGlucs: boolean;
  useDailyBasalrate: boolean;
  useFineLimits: boolean;
  showDevices: boolean;
  override params = [
    new ParamInfo(0, PrintAnalysis.msgParam1, {boolValue: true, thumbValue: false}),
    new ParamInfo(1, PrintAnalysis.msgParam2, {boolValue: false}),
    new ParamInfo(2, PrintAnalysis.msgParam3, {boolValue: false}),
    new ParamInfo(3, PrintAnalysis.msgParam4, {boolValue: false}),
    new ParamInfo(4, PrintAnalysis.msgParam5, {boolValue: false}),
    new ParamInfo(6, BasePrint.msgUseDailyBasalrate, {boolValue: true, isLoopValue: true}),
    new ParamInfo(5, PrintAnalysis.msgParam6, {boolValue: false}),
  ];

  constructor(ps: PdfService, suffix: string = null) {
    super(ps);
    this.init(suffix);
  }

  static get msgParam1(): string {
    return $localize`Material mit Nachkommastellen`;
  }

  static get msgParam2(): string {
    return $localize`Zielbereich mit Nachkommastellen`;
  }

  static get msgParam3(): string {
    return $localize`Standardabweichung statt Anzahl`;
  }

  static get msgParam4(): string {
    return $localize`Standardbereich mit feinerer Abstufung`;
  }

  static get msgParam5(): string {
    return $localize`Unterzuckerungen anzeigen`;
  }

  static get msgParam6(): string {
    return $localize`Verwendete Glukosequellen anzeigen`;
  }

  override get title(): string {
    return $localize`Auswertung`;
  }

  get _precisionMaterial(): number {
    return this.isPreciseMaterial ? 2 : 0;
  }

  get _precisionTarget(): number {
    return this.isPreciseTarget ? 1 : 0;
  }

  // override get isPortrait(): boolean {
  //   return true;
  // }
  //
  // override set isPortrait(value: boolean): boolean {
  //   this._isPortrait = value;
  // }

  override get estimatePageCount(): any {
    return {count: 1, isEstimated: false};
  }

  get msgHypoCount(): string {
    return $localize`Anzahl Unterzuckerungen`;
  }

  get msgHypoDate(): string {
    return $localize`Letzte Unterzuckerung`;
  }

  get msgNoHypo(): string {
    return $localize`Keine`;
  }

  override extractParams(): void {
    this.isPreciseMaterial = this.params[0].boolValue;
    this.isPreciseTarget = this.params[1].boolValue;
    this.showStdAbw = this.params[2].boolValue;
    this.useFineLimits = this.params[3].boolValue;
    this.showHypoGlucs = this.params[4].boolValue;
    this.useDailyBasalrate = this.params[5].boolValue;
    this.showDevices = this.params[6].boolValue;
  }

  msgHypoTitle(value: string): string {
    return $localize`Unterzuckerungen (< ${value})`;
  }

  addBodyArea(body: any[], title: string, lines: any[], showLine = true): void {
    if (showLine) {
      body.push([
        {
          canvas: [
            {
              type: 'line',
              x1: this.cm(0),
              y1: this.cm(0.2),
              x2: this.cm(13.5),
              y2: this.cm(0.2),
              lineWidth: this.cm(0.01)
            }
          ],
          colSpan: 6
        }
      ]);
    }
    body.push([
      {
        columns: [
          {
            width: this.cm(13.5),
            text: title,
            fontSize: this.fs(8),
            color: '#606060',
            alignment: 'center'
          }
        ],
        colSpan: 6,
      }
    ]);

    for (const line of lines) {
      if (line[0]['@'] != null) {
        if (line[0]['@'] === false) {
          continue;
        } else {
          line.removeAt(0);
        }
      }
      body.push(line);
    }
  }

  // getFactorBody(Date date, List<ProfileEntryData> list, msg(String a, String b))
  // {
  //   dynamic ret = [];
  //   for (int i = 0; i < list.length; i++)
  //   {
  //     ProfileEntryData entry = list[i];
  //     DateTime end = DateTime(0, 1, 1, 23, 59);
  //     if (i < list.length - 1)end = list[i + 1].time(date);
  //     ret.add([
  //       {text: msg(fmtTime(entry.time, withUnit: true), fmtTime(end, withUnit: true)), style: 'infotitle'},
  //       {text: g.fmtNumber(entry.value, 1, false), style: 'infodata'},
  //     ]);
  //   }
  //   return ret;
  // }
  fillLimitInfo(stat: any): string {
    if (this.showStdAbw) {
      return this.msgStdAbw(stat.stdAbw);
    }

    return this.msgCount(stat.values.length);
  }

  override fillPages(pages: PageData[]): void {
    pages.push(this.getPage());
    if (GLOBALS.showBothUnits) {
      GLOBALS.glucMGDLIdx = 1;
      pages.push(this.getPage());
      GLOBALS.glucMGDLIdx = 2;
    }
    // if (showInfoSheet)pages.add(getInfoPage(src));
  }

  getPage(): PageData {
    this.titleInfo = this.titleInfoBegEnd();
    const data = this.repData.data;
    const deviceKey = 'all';

    const avgGluc = data.avgGluc;
    let glucWarnColor = this.colNorm;
    const glucWarnText = '';
    //    if (hba1c > 7)glucWarnColor = blendColor("ffffff", "ff0000", (hba1c - 7) / 2);
    if (avgGluc >= this.repData.status.settings.bgTargetTop &&
      avgGluc < this.repData.status.settings.bgTargetTop) {
      glucWarnColor = this.blendColor(
        glucWarnColor,
        this.colHigh,
        (avgGluc - this.repData.status.settings.bgTargetTop) /
        (180 - this.repData.status.settings.bgTargetTop));
    } else if (avgGluc < this.repData.status.settings.bgTargetBottom) {
      glucWarnColor = this.blendColor(
        glucWarnColor,
        this.colHigh,
        (this.repData.status.settings.bgTargetBottom - avgGluc) /
        (this.repData.status.settings.bgTargetBottom));
    } else if (avgGluc > this.repData.status.settings.bgTargetTop) {
      glucWarnColor = this.colHigh;
    }
    // const pumpList = [];
    // for (const entry in config ['pumps'])
    // {
    //   const pump = {style: 'persdata'};
    //   pump['text'] = '${fmtDate(entry['since'])}, ${entry['name']}';
    //   pumpList.add(pump);
    // }
    let cntp = this.repData.dayCount > 0 ? (data.countValid / this.repData.dayCount) : 0;
    let countPeriod = this.msgReadingsPerDay(Math.round(cntp), GLOBALS.fmtNumber(cntp));
    if (cntp > 24) {
      cntp /= 24;
      countPeriod = this.msgReadingsPerHour(Math.round(cntp), GLOBALS.fmtNumber(cntp));
      if (cntp > 6) {
        cntp = 60 / cntp;
        countPeriod = this.msgReadingsInMinutes(Math.round(cntp), GLOBALS.fmtNumber(cntp, 1));
      }
    }

    const f = 1.5;
    const f1 = 2.5;

    const totalDay = new DayData(null, new ProfileGlucData(new ProfileStoreData('Intern')));
    Utils.pushAll(totalDay.entries, data.entries);
    totalDay.init();

    const count = data.validCount;
    const tgHigh = data.stat['high'].values.length / count * f;
    const tgNorm = data.stat['norm'].values.length / count * f;
    const tgLow = data.stat['low'].values.length / count * f;
    // double above180 = data.entriesAbove(180) / count * (useFineLimits ? f1 : f);
    // double in70180 = data.entriesIn(70, 180) / count * (useFineLimits ? f1 : f);
    // double below70 = data.entriesBelow(70) / count * (useFineLimits ? f1 : f);
    // double above250 = data.entriesAbove(250) / count * f1;
    // double in180250 = data.entriesIn(180, 250) / count * f1;
    // double in5470 = data.entriesIn(54, 70) / count * f1;
    // double below54 = data.entriesBelow(54) / count * f1;
    const above180 =
      data.stat['stdHigh'].values.length / count * (this.useFineLimits ? f1 : f);
    const in70180 =
      data.stat['stdNorm'].values.length / count * (this.useFineLimits ? f1 : f);
    const below70 =
      data.stat['stdLow'].values.length / count * (this.useFineLimits ? f1 : f);

    const above250 = data.stat['stdVeryHigh'].values.length / count * f1;
    const in180250 = data.stat['stdNormHigh'].values.length / count * f1;
    const in5470 = data.stat['stdNormLow'].values.length / count * f1;
    const below54 = data.stat['stdVeryLow'].values.length / count * f1;
    // above250 = (data.count / 5) / data.count * f1;
    // in180250 = above250;
    // in5470 = above250;
    // below54 = above250;
    // in70180 = above250;
    const txt = GLOBALS.fmtNumber(
      this.repData.dayCount / data.ampulleCount, this._precisionMaterial, 0, '', true);
    const ampulleCount = data.ampulleCount > 1
      ? this.msgReservoirDays(Math.round(this.repData.dayCount / data.ampulleCount), txt)
      : '';
    const tableBody: any[] = [
      [
        {text: '', style: 'infotitle'},
        {text: this.msgDays, style: 'infotitle'},
        {text: this.repData.dayCount, style: 'infodata'},
        {text: '', style: 'infounit', colSpan: 3},
        {text: '', style: 'infounit'},
      ],
      [
        {text: '', style: 'infotitle'},
        {text: this.msgReadingsCount, style: 'infotitle'},
        {text: GLOBALS.fmtNumber(count), style: 'infodata'},
        {text: `(${countPeriod})`, style: 'infounit', colSpan: 3},
        {text: '', style: 'infounit'},
      ],
      [
        {text: '', style: 'infotitle'},
        {text: this.msgReservoirCount, style: 'infotitle'},
        {text: GLOBALS.fmtNumber(data.ampulleCount), style: 'infodata'},
        {text: ampulleCount, style: 'infounit', colSpan: 3},
        {text: '', style: 'infounit'},
      ],
      [
        {text: '', style: 'infotitle'},
        {text: this.msgCatheterCount, style: 'infotitle'},
        {text: GLOBALS.fmtNumber(data.catheterCount), style: 'infodata'},
        {
          text: data.catheterCount > 1
            ? this.msgCatheterDays(
              Math.round(this.repData.dayCount / data.catheterCount),
              GLOBALS.fmtNumber(this.repData.dayCount / data.catheterCount,
                this._precisionMaterial, 0, '', true))
            : '',
          style: 'infounit',
          colSpan: 3
        },
        {text: '', style: 'infounit'},
      ],
      [
        {text: '', style: 'infotitle'},
        {text: this.msgSensorCount, style: 'infotitle'},
        {text: GLOBALS.fmtNumber(data.sensorCount), style: 'infodata'},
        {
          text: data.sensorCount > 1
            ? this.msgSensorDays(
              Math.round(this.repData.dayCount / data.sensorCount),
              GLOBALS.fmtNumber(this.repData.dayCount / data.sensorCount,
                this._precisionMaterial, 0, '', true))
            : '',
          style: 'infounit',
          colSpan: 3
        },
        {text: '', style: 'infounit'},
      ]
    ];
    if (this.showDevices) {
      tableBody.push([
          {text: '', style: 'infotitle'},
          {text: this.msgReportDevices, style: 'infotitle'},
          {text: '', style: 'infotitle'},
          {
            text: Utils.join(this.repData.deviceDataList, ', '),
            style: 'infounit',
            colSpan: 3,
            margin: [this.cm(0), this.cm(0), this.cm(2), this.cm(0)],
          },
          {text: '', style: 'infounit'}
        ]
      );
    }
    const cvsLeft = -0.5;
    const cvsWidth = 0.8;
    if ((this.repData.status.settings.bgTargetBottom != 70 ||
        this.repData.status.settings.bgTargetTop != 180) &&
      !GLOBALS.ppComparable) {
      this.addBodyArea(tableBody, this.msgOwnLimits, [
        [
          {text: '', style: 'infotitle'},
          {
            text: this.msgValuesAbove(
              `${GLOBALS.glucFromData(this.repData.status.settings.bgTargetTop)} ${GLOBALS.getGlucInfo().unit}`),
            style: 'infotitle'
          },
          {
            text:
              `${GLOBALS.fmtNumber(data.stat['high'].values.length / count * 100, this._precisionTarget)} %`,
            style: 'infodata'
          },
          {
            text: this.fillLimitInfo(data.stat['high']),
            style: 'infounit',
            colSpan: 2
          },
          {text: '', style: 'infounit'},
          {
            canvas: [
              {
                type: 'rect',
                x: this.cm(cvsLeft),
                y: this.cm(0),
                w: this.cm(cvsWidth),
                h: this.cm(tgHigh),
                color: this.colHigh
              },
              {
                type: 'rect',
                x: this.cm(cvsLeft),
                y: this.cm(tgHigh),
                w: this.cm(cvsWidth),
                h: this.cm(tgNorm),
                color: this.colNorm
              },
              {
                type: 'rect',
                x: this.cm(cvsLeft),
                y: this.cm(tgHigh + tgNorm),
                w: this.cm(cvsWidth),
                h: this.cm(tgLow),
                color: this.colLow
              },
            ],
            rowSpan: 3
          },
        ],
        [
          {text: '', style: 'infotitle'},
          {
            text: this.msgValuesIn(
              `${GLOBALS.glucFromData(this.repData.status.settings.bgTargetBottom)} ${GLOBALS.getGlucInfo().unit}`,
              `${GLOBALS.glucFromData(this.repData.status.settings.bgTargetTop)} ${GLOBALS.getGlucInfo().unit}`),
            style: 'infotitle'
          },
          {
            text:
              `${GLOBALS.fmtNumber(data.stat['norm'].values.length / count * 100, this._precisionTarget)} %`,
            style: 'infodata'
          },
          {
            text: this.fillLimitInfo(data.stat['norm']),
            style: 'infounit',
            colSpan: 2
          },
          {text: '', style: 'infounit'},
          {text: '', style: 'infounit'},
        ],
        [
          {text: '', style: 'infotitle'},
          {
            text: this.msgValuesBelow(
              `${GLOBALS.glucFromData(this.repData.status.settings.bgTargetBottom)} ${GLOBALS.getGlucInfo().unit}`),
            style: 'infotitle'
          },
          {
            text:
              `${GLOBALS.fmtNumber(data.stat['low'].values.length / count * 100, this._precisionTarget)} %`,
            style: 'infodata'
          },
          {
            text: this.fillLimitInfo(data.stat['low']),
            style: 'infounit',
            colSpan: 2
          },
          {text: '', style: 'infounit'},
          {text: '', style: 'infounit'},
        ]
      ]);
    }
    if (this.useFineLimits) {
      this.addBodyArea(tableBody, this.msgStandardLimits, [
        [
          {text: '', style: 'infotitle'},
          {
            text: this.msgValuesVeryHigh(
              `${GLOBALS.glucFromData(250)} ${GLOBALS.getGlucInfo().unit}`),
            style: 'infotitle'
          },
          {
            text:
              `${GLOBALS.fmtNumber(data.stat['stdVeryHigh'].values.length / count * 100, this._precisionTarget)} %`,
            style: 'infodata'
          },
          {
            text: this.fillLimitInfo(data.stat['stdVeryHigh']),
            style: 'infounit',
            colSpan: 2
          },
          {text: '', style: 'infounit'},
          {
            canvas: [
              {
                type: 'rect',
                x: this.cm(cvsLeft),
                y: this.cm(0),
                w: this.cm(cvsWidth),
                h: this.cm(above250),
                color: this.colHigh
              },
              {
                type: 'rect',
                x: this.cm(cvsLeft),
                y: this.cm(above250),
                w: this.cm(cvsWidth),
                h: this.cm(in180250),
                color: this.colNormHigh
              },
              {
                type: 'rect',
                x: this.cm(cvsLeft),
                y: this.cm(above250 + in180250),
                w: this.cm(cvsWidth),
                h: this.cm(in70180),
                color: this.colNorm
              },
              {
                type: 'rect',
                x: this.cm(cvsLeft),
                y: this.cm(above250 + in180250 + in70180),
                w: this.cm(cvsWidth),
                h: this.cm(in5470),
                color: this.colNormLow
              },
              {
                type: 'rect',
                x: this.cm(cvsLeft),
                y: this.cm(above250 + in180250 + in70180 + in5470),
                w: this.cm(cvsWidth),
                h: this.cm(below54),
                color: this.colLow
              },
            ],
            rowSpan: 3
          },
        ],
        [
          {text: '', style: 'infotitle'},
          {
            text: this.msgValuesNormHigh(
              `${GLOBALS.glucFromData(180)} ${GLOBALS.getGlucInfo().unit}`
              + ` - ${GLOBALS.glucFromData(250)} ${GLOBALS.getGlucInfo().unit}`),
            style: 'infotitle'
          },
          {
            text:
              `${GLOBALS.fmtNumber(data.stat['stdNormHigh'].values.length / count * 100, this._precisionTarget)} %`,
            style: 'infodata'
          },
          {
            text: this.fillLimitInfo(data.stat['stdNormHigh']),
            style: 'infounit',
            colSpan: 2
          },
          {text: '', style: 'infounit'},
          {text: '', style: 'infounit'},
        ],
        [
          {text: '', style: 'infotitle'},
          {
            text: this.msgValuesNorm(
              `${GLOBALS.glucFromData(70)} ${GLOBALS.getGlucInfo().unit}`,
              `${GLOBALS.glucFromData(180)} ${GLOBALS.getGlucInfo().unit}`),
            style: 'infotitle'
          },
          {
            text:
              `${GLOBALS.fmtNumber(data.stat['stdNorm'].values.length / count * 100, this._precisionTarget)} %`,
            style: 'infodata'
          },
          {
            text: this.fillLimitInfo(data.stat['stdNorm']),
            style: 'infounit',
            colSpan: 2
          },
          {text: '', style: 'infounit'},
          {text: '', style: 'infounit'},
        ],
        [
          {text: '', style: 'infotitle'},
          {
            text: this.msgValuesNormLow(
              `${GLOBALS.glucFromData(54)} ${GLOBALS.getGlucInfo().unit} - ${GLOBALS.glucFromData(70)} ${GLOBALS.getGlucInfo().unit}`),
            style: 'infotitle'
          },
          {
            text: `${GLOBALS.fmtNumber(data.stat['stdNormLow'].values.length / count * 100, this._precisionTarget)} %`,
            style: 'infodata'
          },
          {
            text: this.fillLimitInfo(data.stat['stdNormLow']),
            style: 'infounit',
            colSpan: 2
          },
          {text: '', style: 'infounit'},
          {text: '', style: 'infounit'},
        ],
        [
          {text: '', style: 'infotitle'},
          {
            text: this.msgValuesVeryLow(
              `${GLOBALS.glucFromData(54)} ${GLOBALS.getGlucInfo().unit}`),
            style: 'infotitle'
          },
          {
            text:
              `${GLOBALS.fmtNumber(data.stat['stdVeryLow'].values.length / count * 100, this._precisionTarget)} %`,
            style: 'infodata'
          },
          {
            text: this.fillLimitInfo(data.stat['stdVeryLow']),
            style: 'infounit',
            colSpan: 2
          },
          {text: '', style: 'infounit'},
          {text: '', style: 'infounit'},
        ],
      ]);
    } else {
      this.addBodyArea(tableBody, this.msgStandardLimits, [
        [
          {text: '', style: 'infotitle'},
          {
            text: this.msgValuesAbove(
              `${GLOBALS.glucFromData(180)} ${GLOBALS.getGlucInfo().unit}`),
            style: 'infotitle'
          },
          {
            text: `${GLOBALS.fmtNumber(data.stat['stdHigh'].values.length / count * 100, this._precisionTarget)} %`,
            style: 'infodata'
          },
          {
            text: this.fillLimitInfo(data.stat['stdHigh']),
            style: 'infounit',
            colSpan: 2
          },
          {text: '', style: 'infounit'},
          {
            canvas: [
              {
                type: 'rect',
                x: this.cm(cvsLeft),
                y: this.cm(0),
                w: this.cm(cvsWidth),
                h: this.cm(above180),
                color: this.colHigh
              },
              {
                type: 'rect',
                x: this.cm(cvsLeft),
                y: this.cm(above180),
                w: this.cm(cvsWidth),
                h: this.cm(in70180),
                color: this.colNorm
              },
              {
                type: 'rect',
                x: this.cm(cvsLeft),
                y: this.cm(above180 + in70180),
                w: this.cm(cvsWidth),
                h: this.cm(below70),
                color: this.colLow
              },
            ],
            rowSpan: 3
          },
        ],
        [
          {text: '', style: 'infotitle'},
          {
            text: this.msgValuesIn(
              `${GLOBALS.glucFromData(70)} ${GLOBALS.getGlucInfo().unit}`,
              `${GLOBALS.glucFromData(180)} ${GLOBALS.getGlucInfo().unit}`),
            style: 'infotitle'
          },
          {
            text: `${GLOBALS.fmtNumber(data.stat['stdNorm'].values.length / count * 100, this._precisionTarget)} %`,
            style: 'infodata'
          },
          {
            text: this.fillLimitInfo(data.stat['stdNorm']),
            style: 'infounit',
            colSpan: 2
          },
          {text: '', style: 'infounit'},
          {text: '', style: 'infounit'},
        ],
        [
          {text: '', style: 'infotitle'},
          {
            text: this.msgValuesBelow(
              `${GLOBALS.glucFromData(70)} ${GLOBALS.getGlucInfo().unit}`),
            style: 'infotitle'
          },
          {
            text:
              `${GLOBALS.fmtNumber(data.stat['stdLow'].values.length / count * 100, this._precisionTarget)} %`,
            style: 'infodata'
          },
          {
            text: this.fillLimitInfo(data.stat['stdLow']),
            style: 'infounit',
            colSpan: 2
          },
          {text: '', style: 'infounit'},
          {text: '', style: 'infounit'},
        ],
      ]);
    }
    if (this.showHypoGlucs) {
      let uzCount = 0;
      let lastEntry: EntryData = null;
      for (const entry of data.stat['stdVeryLow'].entries) {
        if (lastEntry == null ||
          Utils.differenceInMinutes(entry.time, lastEntry.time) > 30) {
          uzCount++;
          lastEntry = entry;
        }
      }

      this.addBodyArea(tableBody,
        this.msgHypoTitle(`${GLOBALS.glucFromData(54)} ${GLOBALS.getGlucInfo().unit}`), [
          [
            {text: '', style: 'infotitle'},
            {text: this.msgHypoCount, style: 'infotitle'},
            {text: '', style: 'infodata'},
            {text: `${uzCount}`, style: 'infounit'},
            {text: '', style: 'infotitle'},
            {text: '', style: 'infounit'},
          ],
          [
            {text: '', style: 'infotitle'},
            {text: this.msgHypoDate, style: 'infotitle'},
            {text: '', style: 'infodata'},
            {
              text:
                `${lastEntry != null ? this.fmtDateTime(lastEntry.time) : this.msgNoHypo}`,
              style: 'infounit',
              colSpan: 3
            },
            {text: '', style: 'infotitle'},
            {text: '', style: 'infounit'},
          ],
        ]);
    }
    this.addBodyArea(tableBody, this.msgPeriod, [
      [
        {text: '', style: 'infotitle'},
        {text: this.msgLowestValue, style: 'infotitle'},
        {text: `${GLOBALS.glucFromData(data.min)}`, style: 'infodata'},
        {text: GLOBALS.getGlucInfo().unit, style: 'infounit'},
        {text: '', style: 'infotitle'},
        {text: '', style: 'infounit'},
      ],
      [
        {text: '', style: 'infotitle'},
        {text: this.msgHighestValue, style: 'infotitle'},
        {text: `${GLOBALS.glucFromData(data.max)}`, style: 'infodata'},
        {text: GLOBALS.getGlucInfo().unit, style: 'infounit', colSpan: 2},
        {text: '', style: 'infotitle'},
        {text: '', style: 'infounit'},
      ],
      [
        {text: '', style: 'infotitle'},
        {text: this.msgStandardDeviation, style: 'infotitle'},
        {
          text: GLOBALS.fmtNumber(totalDay.stdAbw(GLOBALS.glucMGDL, deviceKey), 1),
          style: 'infodata'
        },
        {text: GLOBALS.getGlucInfo().unit, style: 'infounit', colSpan: 2},
        {text: '', style: 'infotitle'},
        {text: '', style: 'infounit'},
      ],
      [
        {text: '', style: 'infotitle'},
        {text: this.msgGVIFull, style: 'infotitle'},
        {text: GLOBALS.fmtNumber(data.gvi, 2), style: 'infodata'},
        {text: this.gviQuality(data.gvi), style: 'infounit', colSpan: 2},
        {text: '', style: 'infotitle'},
        {text: '', style: 'infounit'},
      ],
      [
        {text: '', style: 'infotitle'},
        {text: this.msgPGSFull, style: 'infotitle'},
        {text: GLOBALS.fmtNumber(data.pgs, 2), style: 'infodata'},
        {text: this.pgsQuality(data.pgs), style: 'infounit', colSpan: 2},
        {text: '', style: 'infotitle'},
        {text: '', style: 'infounit'},
      ],
      [
        {text: '', style: 'infotitle'},
        {text: `${this.msgGlucoseValue}${glucWarnText}`, style: 'infotitle'},
        {text: GLOBALS.glucFromData(avgGluc), style: 'infodata'},
        {
          text: `${GLOBALS.getGlucInfo().unit}`,
          style: 'infounit',
          colSpan: 2
        },
        {text: '', style: 'infotitle'},
        {
          canvas: [
            {
              type: 'rect',
              x: this.cm(cvsLeft),
              y: this.cm(0.2),
              w: this.cm(cvsWidth),
              h: this.cm(0.9),
              color: glucWarnColor
            },
          ],
          rowSpan: 3
        },
      ],
      [
        {text: '', style: 'infotitle'},
        {text: this.msgHbA1CLong, style: 'infotitle'},
        {
          text: this.hba1c(avgGluc),
          style: ['infodata', 'hba1c']
        },
        {
          text: '%',
          style: ['hba1c', 'infounit'],
          colSpan: 2
        },
        {text: '', style: 'infotitle'},
        {text: '', style: 'infounit'},
      ],
    ]);
    const treatmentsBody = <any>[
      [
        {text: '', style: 'infotitle'},
        {text: this.msgKHPerDay, style: 'infotitle'},
        {
          text: GLOBALS.fmtNumber(data.khCount / this.repData.dayCount, 1, 0),
          style: 'infodata'
        },
        {
          text:
            this.msgKHBE(GLOBALS.fmtNumber(data.khCount / this.repData.dayCount / 12, 1, 0)),
          style: 'infounit',
          colSpan: 2
        },
        {text: '', style: 'infotitle'},
        {text: '', style: 'infounit'},
      ],
      [
        {text: '', style: 'infotitle'},
        {text: this.msgInsulinPerDay, style: 'infotitle'},
        {
          text: `${GLOBALS.fmtNumber(data.TDD(!this.useDailyBasalrate) / this.repData.dayCount, 1)}`,
          style: 'infodata'
        },
        {text: `${this.msgInsulinUnit}`, style: 'infounit', colSpan: 2},
        {text: '', style: 'infotitle'},
        {text: '', style: 'infounit'},
      ]
    ];
    treatmentsBody.push([
      {text: '', style: 'infotitle'},
      {text: this.msgBolusPerDay, style: 'infotitle'},
      {
        text: GLOBALS.fmtNumber(data.ieBolusSum / this.repData.dayCount, 1),
        style: 'infodata'
      },
      {
        text:
          `bolus (${GLOBALS.fmtNumber(data.ieBolusPrz(!this.useDailyBasalrate), 1)} %)`,
        style: 'infounit',
        colSpan: 2
      },
      {text: '', style: 'infotitle'},
      {text: '', style: 'infounit'},
    ]);
    treatmentsBody.push([
      {text: '', style: 'infotitle'},
      {text: this.msgBasalPerDay, style: 'infotitle'},
      {
        text: GLOBALS.fmtNumber(
          data.ieBasalSum(!this.useDailyBasalrate) / this.repData.dayCount, 1),
        style: 'infodata'
      },
      {
        text: `basal (${GLOBALS.fmtNumber(data.ieBasalPrz(!this.useDailyBasalrate), 1)} %)`,
        style: 'infounit',
        colSpan: 2
      },
      {text: '', style: 'infotitle'},
      {text: '', style: 'infounit'},
    ]);
    treatmentsBody.push([
      {'@': data.ieMicroBolusSum > 0.0 && false},
      {text: '', style: 'infotitle'},
      {text: this.msgMicroBolusPerDay, style: 'infotitle'},
      {
        text: GLOBALS.fmtNumber(data.ieMicroBolusSum / this.repData.dayCount, 1),
        style: 'infodata'
      },
      {
        text:
          `bolus (${GLOBALS.fmtNumber(data.ieMicroBolusPrz(!this.useDailyBasalrate), 1)} %)`,
        style: 'infounit',
        colSpan: 2
      },
      {text: '', style: 'infotitle'},
      {text: '', style: 'infounit'},
    ]);
    this.addBodyArea(tableBody, this.msgTreatments, treatmentsBody);
    const ret = [
      this.headerFooter(),
      {
        margin: [this.cm(0), this.cm(this.yorg), this.cm(0), this.cm(0)],
        columns: [
          {
            width: this.cm(this.width),
            text: `${this.repData.user.name}`,
            fontSize: this.fs(20),
            alignment: 'center'
          }
        ]
      },
      {
        margin: [this.cm(5.5), this.cm(0.5), this.cm(0), this.cm(0)],
        layout: 'noBorders',
        table: {
          headerRows: 0,
          widths: [this.cm(5), this.cm(8)],
          body: [
            [
              {text: this.msgBirthday, style: 'perstitle'},
              {text: this.repData.user.birthDate, style: 'persdata'}
            ],
            [
              {text: this.msgDiabSince, style: 'perstitle'},
              {text: this.repData.user.diaStartDate, style: 'persdata'}
            ],
            [
              {text: this.msgInsulin, style: 'perstitle'},
              {text: this.repData.user.insulin, style: 'persdata'}
            ]
          ]
        }
      },
      {
        margin: [this.cm(3.7), this.cm(0.5), this.cm(0), this.cm(0)],
        layout: 'noBorders',
        fontSize: this.fs(10),
        table: {
          headerRows: 0,
          widths: [this.cm(0), this.cm(7.3), this.cm(1.5), this.cm(1.5), this.cm(1.5), this.cm(4.5)],
          body: tableBody
        }
      }
    ];
    return new PageData(this.isPortrait, ret);
  }

  /*
    // getInfoPage(src: ReportData ): any[] {
    //   this.titleInfo = null;
    //   this.subtitle = 'Erklärungen';
    //   const ret = [
    //     headerFooter(),
    //     {
    //       margin: [this.cm(0), this.cm(yorg), this.cm(0), this.cm(0)],
    //       columns: [
    //         {
    //           width: this.cm(width),
    //           text: 'Hinweise',
    //           fontSize: fs(20),
    //           alignment: 'center'
    //         }
    //       ]
    //     },
    //     {
    //       margin: [this.cm(2.2), this.cm(0.5), this.cm(2.2), this.cm(0)],
    //       text: 'Der DVI ist ein Wert, der einem Wert gleicht, der ein Wert sein soll, der hoffentlich zu einem'
    //           ' Zeilenumbruch führt, was aber nicht klar ist. Nun ist es klar und wir sind sowas von froh, dass es'
    //           ' funktioniert. Einfach Toll :)',
    //       fontSize: fs(12),
    //       alignment: 'justify'
    //     },
    //     {
    //       margin: [this.cm(2.2), this.cm(0.2), this.cm(2.2), this.cm(0)],
    //       text: 'Der DVI ist ein Wert, der einem Wert gleicht, der ein Wert sein soll, der hoffentlich zu einem'
    //           ' Zeilenumbruch führt, was aber nicht klar ist. Nun ist es klar und wir sind sowas von froh, dass es'
    //           ' funktioniert. Einfach Toll :)',
    //       fontSize: fs(12),
    //       alignment: 'justify',
    //      color: 'red'
    //     },
    //   ];
    //   return ret;
    // }
    */
}
