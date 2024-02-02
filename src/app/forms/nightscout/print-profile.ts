import {ParamInfo} from '@/_model/param-info';
import {PdfService} from '@/_services/pdf.service';
import {BaseProfile, CalcData} from './base-profile';
import {ReportData} from '@/_model/report-data';
import {Utils} from '@/classes/utils';
import {ProfileEntryData} from '@/_model/nightscout/profile-entry-data';
import {GLOBALS} from '@/_model/globals-data';
import {ProfileGlucData} from '@/_model/nightscout/profile-gluc-data';
import {PageData} from '@/_model/page-data';

export class PrintProfile extends BaseProfile {
  override help = $localize`:help for profile@@help-profile:Dieses Formular zeigt das Profil an. Es werden normalerweise alle Profile des ausgewählten
Zeitraums ausgegeben. Wenn sich in dem Zeitraum das Profil geändert hat, wird ein neues Blatt erzeugt.

Es gibt aber eine Option, welche nur das letzte Profil des Zeitraums ausgibt. Ausserdem gibt es eine Option,
mit der gleiche Zeilen zusammengefasst werden. Das führt zu einem kürzeren Profil, wenn mehrere Zeiten nacheinander
die gleichen Werte beinhalten.`;
  override baseId = 'profile';
  override baseIdx = '02';
  isFormParam1: boolean;
  override params = [
    new ParamInfo(0, PrintProfile.msgParam1, {boolValue: true}),
    new ParamInfo(1, PrintProfile.msgParam2, {boolValue: false}),
    new ParamInfo(2, BaseProfile.msgNamedProfile(BaseProfile.namedProfileName), {boolValue: false}),
  ];
  compressSameValues: boolean;
  _fontSize = 10;
  _fontSizeTables = 8;
  _hasFactors = false;

  constructor(ps: PdfService, suffix: string = null) {
    super(ps);
    this.init(suffix);
  }

  static get msgParam1(): string {
    return $localize`Zeilen mit gleichen Werten zusammenfassen`;
  }

  static get msgParam2(): string {
    return $localize`Nur letztes Profil ausgeben`;
  }

  override get title(): string {
    return $localize`Profil`;
  }

  override get estimatePageCount(): any {
    return {count: 1, isEstimated: true};
  }

  override extractParams(): void {
    this.compressSameValues = this.params[0].boolValue;
    this.onlyLast = this.params[1].boolValue;
    this.namedProfile = this.params[2].boolValue;
  }

  override hasData(src: ReportData): boolean {
    return !Utils.isEmpty(src.profiles);
  }

  getFactorBody(page: number, date: Date, list: ProfileEntryData[], msg: (a: string, b: string) => string,
                params?: { precision?: number, sum?: number, sumTitle?: string }): any[] {
    params ??= {};
    params.precision ??= 1;
    let currPage = 0;
    let pageEntries = 0;
    const pageSize = 27;
    if (page * pageSize >= list.length) {
      return [
        [
          {text: '', style: 'infotitle', fontSize: this.fs(this._fontSize)},
          {text: '', style: 'infodata', fontSize: this.fs(this._fontSize)},
        ]
      ];
    }

    const ret: any[] = [];
    let startTime: Date = null;
    if (currPage === page && params.sum != null && params.sumTitle != null) {
      ret.push([
        {text: params.sumTitle, style: 'infotitle', fontSize: this.fs(this._fontSize), bold: true},
        {text: GLOBALS.fmtNumber(params.sum, params.precision, 0), style: 'infodata', fontSize: this.fs(this._fontSize), bold: true},
      ]);
      this._hasFactors = true;
    }
    for (let i = 0; i < list.length; i++) {
      const entry = list[i];
      let endTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59);
      startTime ??= entry.time(date);
      if (i < list.length - 1) {
        endTime = list[i + 1].time(date);

        if (this.compressSameValues) {
          if (entry.forceText != null) {
            if (entry.forceText === list[i + 1].forceText) {
              continue;
            }
          } else if (entry.value === list[i + 1].value) {
            continue;
          }
        }
      }
      const showValue = true;
      //      if (isSingleDay)
      //        showValue = isSingleDayRange(startTime, endTime);

      if (showValue && currPage === page) {
        ret.push([
          {
            text: msg(this.fmtTime(startTime, {withUnit: true}), this.fmtTime(endTime, {withUnit: true})),
            style: 'infotitle',
            fontSize: this.fs(this._fontSize)
          },
          {
            text: entry.forceText ?? GLOBALS.fmtNumber(entry.value, params.precision, 0),
            style: 'infodata',
            fontSize: this.fs(this._fontSize)
          },
        ]);
        this._hasFactors = true;
      }
      pageEntries++;
      if (pageEntries >= pageSize) {
        currPage++;
        pageEntries = 0;
      }
      startTime = null;
    }

    if (ret.length === 0) {
      ret.push([]);
    }

    return ret;
  }

  override getPage(page: number, profile: ProfileGlucData, calc: CalcData): PageData {
    this._fontSize = this._fontSizeTables;
    this.subtitle = profile.store.name;
    // titleInfo = titleInfoTimeRange(profStartTime, profEndTime);
    this.titleInfo = this.msgValidFrom(this.fmtDateTime(profile.store.startDate));

    const tableWidths: number[] = [this.cm(2.6), this.cm(6.0), this.cm(6.1), this.cm(1.0), this.cm(1.8)];
    const tableBody: any[] = [
      [
        {text: this.msgTimezone, style: 'infotitle', alignment: 'right', fontSize: this.fs(this._fontSize)},
        {text: profile.store.timezone.name, style: 'infodata', alignment: 'left', fontSize: this.fs(this._fontSize)},
        {text: this.msgDIA, style: 'infotitle', alignment: 'right', fontSize: this.fs(this._fontSize)},
        {text: GLOBALS.fmtNumber(profile.store.dia, 2, 0), style: 'infodata', fontSize: this.fs(this._fontSize)},
        {text: this.msgDIAUnit, style: 'infounit', fontSize: this.fs(this._fontSize)},
      ],
      [
        {text: '', style: 'infotitle', alignment: 'right', fontSize: this.fs(this._fontSize)},
        {text: '', style: 'infodata', alignment: 'left', fontSize: this.fs(this._fontSize)},
        {text: this.msgKHA, style: 'infotitle', alignment: 'right', fontSize: this.fs(this._fontSize)},
        {text: GLOBALS.fmtNumber(profile.store.carbsHr, 0, 0), style: 'infodata', fontSize: this.fs(this._fontSize)},
        {text: this.msgKHAUnit, style: 'infounit', fontSize: this.fs(this._fontSize)},
      ],
    ];
    this._hasFactors = false;
    const icrIsfBody: any[] = [];
    const date = new Date(this.profStartTime.getFullYear(), this.profStartTime.getMonth(), this.profStartTime.getDate());
    const bodyICR = this.getFactorBody(page, date, profile.store.listCarbratio, this.msgFactorEntry,
      {sum: profile.store.icrSum / 24.0, sumTitle: this.msgICRSum});
    const listISF: ProfileEntryData[] = [];
    for (const entry of profile.store.listSens) {
      listISF.push(entry.copy);
      // the values for isf are saved with the unit that the user uses for his glucose measurement
      listISF[listISF.length - 1].forceText = this.fmtGluc(GLOBALS.glucForSavedUnitValue(entry.value));
    }
    const bodyISF = this.getFactorBody(page, date, listISF, this.msgFactorEntry,
      {
        precision: GLOBALS.glucMGDL ? 0 : 1,
        sum: GLOBALS.glucForSavedUnitValue(profile.store.isfSum) / 24.0,
        sumTitle: this.msgISFSum
      });

    const basalTargetBody: any[] = [];
    const bodyBasal = this.getFactorBody(page, date, profile.store?.listBasal, this.msgFactorEntry,
      {precision: GLOBALS.basalPrecision, sum: profile.store?.ieBasalSum, sumTitle: this.msgBasalSum});
    const listTarget: ProfileEntryData[] = [];
    if (profile.store.listTargetHigh.length === profile.store.listTargetLow.length) {
      for (let i = 0; i < profile.store.listTargetHigh.length; i++) {
        const high = profile.store.listTargetHigh[i];
        const low = profile.store.listTargetLow[i];
        if (Utils.compareDate(high.time(date), low.time(date)) !== 0) {
          continue;
        }
        const entry = new ProfileEntryData(profile.store.timezone, high.time(date));
        entry.forceText = `${this.fmtGluc(low.value)} - ${this.fmtGluc(high.value)}`;
        listTarget.push(entry);
      }
    }
    const bodyTarget = this.getFactorBody(page, date, listTarget, this.msgFactorEntry);
    if (!this._hasFactors) {
      return null;
    }

    basalTargetBody.push([
      {text: this.msgBasalProfile, fontSize: this.fs(8), color: '#606060', alignment: 'center'},
      {text: this.msgTarget(GLOBALS.getGlucInfo().unit), fontSize: this.fs(8), color: '#606060', alignment: 'center'}
    ]);

    this._fontSize = 9;

    icrIsfBody.push([
      {text: this.msgICR, fontSize: this.fs(8), color: '#606060', alignment: 'center'},
      {text: this.msgISF(GLOBALS.getGlucInfo().unit), fontSize: this.fs(8), color: '#606060', alignment: 'center'}
    ]);

    let tmp: any[] = [];
    if (bodyICR.length > 0) {
      tmp.push({
        margin: [this.cm(1.0), this.cm(0)],
        layout: 'noBorders',
        table: {
          headerRows: 0,
          widths: [this.cm(3.8), this.cm(1.0)],
          body: bodyICR
        }
      });
    }

    if (bodyISF.length > 0) {
      tmp.push({
        margin: [this.cm(1.0), this.cm(0)],
        layout: 'noBorders',
        table: {
          headerRows: 0,
          widths: [this.cm(3.9), this.cm(1.2)],
          body: bodyISF
        }
      });
    }

    icrIsfBody.push(tmp);
    tmp = [];
    if (bodyBasal.length > 0) {
      tmp.push({
        margin: [this.cm(1.0), this.cm(0)],
        layout: 'noBorders',
        table: {
          headerRows: 0,
          widths: [this.cm(3.7), this.cm(1.1)],
          body: bodyBasal
        }
      });
    }
    if (bodyTarget.length > 0) {
      tmp.push({
        margin: [this.cm(0.5), this.cm(0)],
        layout: 'noBorders',
        table: {
          headerRows: 0,
          widths: [this.cm(3.7), this.cm(2.1)],
          body: bodyTarget
        }
      });
    }
    basalTargetBody.push(tmp);

    const colWidth = (this.width - 4.4) / 4;
    const ret = [
      this.headerFooter(),
      {
        margin: [this.cm(1.6), this.cm(this.yorg - 0.5), this.cm(0), this.cm(0)],
        layout: 'noBorders',
        table: {headerRows: 0, widths: tableWidths, body: tableBody}
      },
      {
        margin: [this.cm(1.6), this.cm(0.2), this.cm(0), this.cm(0)],
        layout: 'noBorders',
        table: {
          headerRows: 0,
          widths: [this.cm(2 * colWidth), this.cm(2 * colWidth)],
          body: [
            [
              {
                margin: [this.cm(0), this.cm(0), this.cm(0), this.cm(0)],
                layout: 'noBorders',
                table: {
                  headerRows: 1,
                  widths: [this.cm(colWidth), this.cm(colWidth)],
                  body: icrIsfBody
                }
              },
              {
                margin: [this.cm(0), this.cm(0), this.cm(0), this.cm(0)],
                layout: 'noBorders',
                table: {
                  headerRows: 1,
                  widths: [this.cm(colWidth), this.cm(colWidth)],
                  body: basalTargetBody
                }
              }
            ]
          ]
        }
      }
    ];
    return new PageData(this.isPortrait, ret);
  }
}
