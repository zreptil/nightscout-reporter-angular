import {BasePrint} from '@/forms/base-print';
import {PageData} from '@/_model/page-data';
import {ParamInfo} from '@/_model/param-info';
import {PdfService} from '@/_services/pdf.service';
import {GLOBALS} from '@/_model/globals-data';
import {DayData} from '@/_model/nightscout/day-data';
import {Utils} from '@/classes/utils';
import {Log} from '@/_services/log.service';

export class PrintDailyProfile extends BasePrint {
  override help = $localize`:help for dayprofile@@help-dayprofile:Dieses Formular zeigt die tatsächliche Basalrate, die während des Tages gelaufen ist unter
Berücksichtigung aller temporären Basalratenanpassungen. Zusätzlich kann noch die im Profil hinterlegte
Basalrate angezeigt werden. Die Basalrate kann als Wert, als prozentuale Änderung in Bezug auf die Profilbasalrate
oder mit beidem angezeigt werden. Die Summenspalte zeigt die bis zur entsprechenden Uhrzeit abgegebene Basalrate
an. Es ist auch möglich, die Uhrzeit mit Sekunden anzeigen zu lassen. Damit kann man die angezeigten Werte
rechnerisch überprüfen.

Wenn die Basalrate aus dem Profil angezeigt wird, wird das Maximum für die Darstellung der Balken anhand des
maximalen Wertes der Profilbasalrate ermittelt. Dadurch werden bei Werten über 100% des Maximalwerts der
Profilbasalrate die Balken über die Spalte hinaus verlängert. Es gibt aber eine Option, um diese Balken abzuschneiden
und als Pfeile darstellen zu lassen.`;
  override baseId = 'dayprofile';
  override baseIdx = '11';
  isFormParam1: boolean;
  override params = [
    new ParamInfo(2, this.msgParam1, {boolValue: false}),
    new ParamInfo(3, this.msgParam2, {
      boolValue: true, subParams: [new ParamInfo(0, this.msgParam4, {
        boolValue: true
      })]
    }),
    new ParamInfo(1, this.msgParam3, {list: [$localize`Prozent`, $localize`Wert`, $localize`Wert & Prozent`]})
  ];
  showSeconds: boolean;
  showBasalLine: boolean;
  showValPrz: number;
  showMaxArrows: boolean;

  constructor(ps: PdfService, suffix: string = null) {
    super(ps);
    this.init(suffix);
  }

  static get msgParam1(): string {
    return $localize`Parameter für PrintDailyProfile`;
  }

  get msgParam1(): string {
    return $localize`Sekunden anzeigen`;
  }

  get msgParam2(): string {
    return $localize`Basal aus Profil anzeigen`;
  }

  get msgParam3(): string {
    return $localize`IE-Anzeige`;
  }

  get msgParam4(): string {
    return $localize`Werte über dem Maximum als Pfeile darstellen`;
  }

  override get title(): string {
    return $localize`Tagesprofil`;
  }

  override get estimatePageCount(): any {
    const count = GLOBALS.period?.dayCount ?? 0;
    return {count: count, isEstimated: true};
  }

  override extractParams(): void {
    this.showSeconds = this.params[0].boolValue;
    this.showBasalLine = this.params[1].boolValue;
    this.showMaxArrows = this.params[1].subParams[0].boolValue;
    this.showValPrz = this.params[2].intValue;
  }

  override fillPages(pages: PageData[]): void {
    const data = this.repData.data;
    const oldLength = pages.length;
    Log.info('Anzahl Tage', data.days.length);
    for (const day of data.days) {
      this.getPage(day, pages);
      if (this.repData.isForThumbs) {
        break;
      }
    }
    if (this.repData.isForThumbs && pages.length - oldLength > 1) {
      pages.splice(oldLength + 1, pages.length);
    }
  }

  getPage(day: DayData, pages: PageData[]): void {
    this.titleInfo = this.fmtDate(day.date, {withShortWeekday: false, withLongWeekday: true});

    const tables: any[][] = [];

    const space = 0.4;
    const count = day.profile.length;
    let columns = Math.floor(count / 37) + 1;
    columns = Math.min(columns, 3);

    let wid = (this.width - 2 * this.xframe) / columns;
    wid -= space * (columns - 1) / columns;
    const widths = [
      this.cm(wid / (columns === 3 ? 3 : 2) - 0.34),
      this.cm(wid / (columns === 3 ? 3 : 4) - 0.34),
      this.cm(wid / (columns === 3 ? 3 : 4) - 0.34)
    ];

    let sum = 0.0;
    let idx = 0;
    let lines = 0;
    let max = 0.0;
    for (const entry of day.profile) {
      max = Math.max(entry.value, max);
    }
    if (this.showBasalLine) {
      max = 0.0;
      for (const entry of day.profile) {
        max = Math.max(entry.orgValue, max);
      }
    }

    for (const entry of day.profile) {
      if (idx >= tables.length) {
        tables.push([
          [
            {text: this.msgTime, style: 'total', alignment: 'center'},
            {text: this.msgIEHr, style: 'total', alignment: 'center'},
            {text: this.msgSum, style: 'total', alignment: 'center'}
          ]
        ]);
      }

      sum += entry.value * entry.duration / 3600;
      const w = entry.value * (widths[1] + this.cm(0.1)) / max;
      let text = `${this.fmtTime(entry.time(day.date), {withSeconds: this.showSeconds, withUnit: !this.showSeconds && columns < 3})}`;
      if (columns < 3) {
        const time = Utils.addTimeSeconds(entry.time(day.date), entry.duration);
        text = `${text} - ${this.fmtTime(time, {withSeconds: this.showSeconds, withUnit: !this.showSeconds && columns < 3})}`;
      }
      const canvas = [];
      if (w > 0) {
        if (entry.value > max && this.showMaxArrows) {
          canvas.push({
            type: 'polyline',
            closePath: true,
            color: this.colBasalDay,
            points: [
              {x: this.cm(0), y: this.cm(0.05)},
              {x: widths[1] - this.cm(0.1), y: this.cm(0.05)},
              {x: widths[1] - this.cm(0.1), y: this.cm(-0.05)},
              {x: widths[1] + this.cm(0.1), y: this.cm(0.2)},
              {x: widths[1] - this.cm(0.1), y: this.cm(0.45)},
              {x: widths[1] - this.cm(0.1), y: this.cm(0.35)},
              {x: this.cm(0), y: this.cm(0.35)}
            ]
          });
        } else {
          canvas.push({
            type: 'rect',
            x: this.cm(0),
            y: this.cm(this.showBasalLine ? 0.05 : 0),
            w: w,
            h: this.cm(this.showBasalLine ? 0.3 : 0.4),
            color: this.colBasalDay
          });
        }
      }

      const prz = entry.orgValue != 0 ? `${GLOBALS.fmtNumber(entry.value / entry.orgValue * 100, 0)}%` : '';
      const val = GLOBALS.fmtNumber(entry.value, GLOBALS.basalPrecision);
      const colValue = [
        {
          width: widths[1] / (this.showValPrz === 2 ? 2 : 1) + this.cm(0.1),
          text: this.showValPrz === 0 ? prz : val,
          alignment: 'left',
          fontSize: this.fs(this.showValPrz === 2 ? 8 : 10)
        }
      ];

      if (this.showBasalLine && max > 0) {
        const w = entry.orgValue * (widths[1] + this.cm(0.1)) / max;
        // canvas.add({
        //   type: 'line',
        //   x1: w,
        //   y1: this.cm(-0.05),
        //   x2: w,
        //   y2: this.cm(0.45),
        //   lineColor: colBasalProfile,
        //   lineWidth: this.cm(this.lw)
        // });
        canvas.push({
          type: 'rect',
          x: this.cm(0),
          y: this.cm(-0.05),
          w: w,
          h: this.cm(0.5),
          color: this.colBasalProfile,
          fillOpacity: 0.25
        });
      }

      if (this.showValPrz === 2) {
        colValue.push({width: widths[1] / 2, text: prz, alignment: 'right', fontSize: this.fs(8)});
      }
      tables[idx].push([
        {text: text, alignment: 'center'},
        {
          stack: [
            {
              relativePosition: {x: this.cm(-0.05), y: this.cm(0)},
              canvas: canvas
            },
            {columns: colValue}
          ]
        },
        {text: GLOBALS.fmtNumber(sum, GLOBALS.basalPrecision), alignment: 'right'}
      ]);

      lines++;
      if (lines > 37) {
        lines = 0;
        idx++;
      }
    }

    let ret = [this.headerFooter()];
    let x = this.xframe;
    let doAdd = false;
    idx = 0;
    for (const table of tables) {
      ret.push({
        'absolutePosition': {x: this.cm(x), y: this.cm(this.yorg)},
        margin: [this.cm(0), this.cm(0), this.cm(0), this.cm(wid)],
        fontSize: this.fs(10),
        table: {headerRows: 0, widths: widths, body: table}
      });

      doAdd = true;
      idx++;
      if (idx < columns) {
        x += wid + space;
      } else {
        x = this.xframe;
        idx = 0;
        pages.push(new PageData(this.isPortrait, ret));
        ret = [this.headerFooter()];
        doAdd = false;
      }
    }

    if (doAdd) {
      pages.push(new PageData(this.isPortrait, ret));
    }
  }
}
