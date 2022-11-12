import {BasePrint} from '@/forms/base-print';
import {ParamInfo} from '@/_model/param-info';
import {PdfService} from '@/_services/pdf.service';
import {GLOBALS} from '@/_model/globals-data';
import {PageData} from '@/_model/page-data';
import {DayData} from '@/_model/nightscout/day-data';
import {Utils} from '@/classes/utils';

export class PrintDailyGluc extends BasePrint {
  override help = $localize`:help for daygluc@@help-daygluc:Dieses Formular zeigt den Trend der Glukosewerte über den Tag hinweg
an. Dabei wird in der Spalte Trend immer angezeigt, um wieviel Prozent sich
der Wert von einer vollen Stunde zur nächsten verändert hat. Dieser Trend ist
ganz hilfreich, wenn man bei einem Basalratentest erkennen will, wie sich der
Glukosewert nur anhand der Basalrate entwickelt. Es kann auch eine Spalte für
die Boluswerte und die Kohlenhydrate angezeigt werden. Diese sollten aber bei
einem Basalratentest natürlich leer sein. Ebenso muss ein eventuell
vorhandener Loop im Zeitraum des Tests abgeschaltet sein. Es geht dabei nur
um den Diabetiker und seine Basalrate.\\nEs wird auch eine Spalte mit der
Basalrate angezeigt, wenn die Option 'Alle Werte für einen Tag anzeigen'
nicht markiert wurde. Wenn die Option markiert wurde, dann fehlt der Platz
(und auch der Sinn), diese darzustellen.`;
  override baseId = 'daygluc';
  override baseIdx = '12';
  isFormParam1: boolean;
  override params = [
    new ParamInfo(1, this.msgParam1, {boolValue: false}),
    new ParamInfo(2, this.msgParam2, {boolValue: false})
  ];
  showAllValues: boolean;
  showBolus: boolean;

  constructor(ps: PdfService, suffix: string = null) {
    super(ps);
    this.init(suffix);
  }

  override get title(): string {
    return $localize`Tagestrend`;
  }

  override get estimatePageCount(): any {
    const count = GLOBALS?.period?.dayCount * (this.showAllValues ? 3 : 1);
    return {count: count, isEstimated: false};
  }

  get msgParam1(): string {
    return $localize`Alle Werte für den Tag anzeigen`;
  }

  get msgParam2(): string {
    return $localize`Bolusspalte anzeigen`;
  };

  override get isPortrait(): boolean {
    return true;
  }

  override get footerText(): any {
    return this.footerTextDayTimes;
  }

  override get backsuffix(): string {
    return this.showAllValues ? '' : 'full';
  }

  override extractParams(): void {
    this.showAllValues = this.params[0].boolValue;
    this.showBolus = this.params[1].boolValue;
  }

  msgBasalInfo(time: string): string {
    return $localize`:The informational text on the page Daytrend for the basalrate@@msgBasalInfo:Die angezeigte Basalrate ist seit ${time}  gültig und beinhaltet keine temporären Änderungen.`;
  }

  override fillPages(pages: PageData[]): void {
    const data = this.repData.data;
    const oldLength = pages.length;
    for (const day of data.days) {
      if (this.repData.isForThumbs) {
        const savSave = this.showAllValues;
        const sbSave = this.showBolus;
        this.showAllValues = false;
        this.showBolus = true;
        this.getPage(day, pages);
        pages.splice(oldLength + 1, pages.length);
        this.showAllValues = true;
        this.showBolus = true;
        this.getPage(day, pages);
        this.showAllValues = savSave;
        this.showBolus = sbSave;
        if (pages.length - oldLength > 2) {
          pages.splice(oldLength + 2, pages.length);
        }
      } else {
        this.getPage(day, pages);
        if (GLOBALS.showBothUnits) {
          GLOBALS.glucMGDLIdx = 1;
          this.getPage(day, pages);
          GLOBALS.glucMGDLIdx = 2;
        }
      }
      if (this.repData.isForThumbs) {
        break;
      }
    }
  }

  getPage(day: DayData, pages: PageData[]): void {
    this.titleInfo = this.fmtDate(day.date, {withShortWeekday: false, withLongWeekday: true});

    const tables: any[] = [];

    const space = 0.4;
    const count = this.showAllValues ? day.entries.length : 24;
    let columns = Math.floor(count / 37) + 1;
    columns = Math.min(columns, 2);

    let wid = (this.width - 2 * this.xframe) / columns;
    wid -= space * (columns - 1) / columns;
    const fw = 3.5;
    let colCount = this.showAllValues ? 3 : 4;
    if (this.showBolus) {
      colCount++;
    }
    const sw = colCount / (1 - 1 / fw);
    const widths = columns == 1
      ? [
        this.cm(wid / fw - 0.34),
        this.cm(wid / sw - 0.34),
        this.cm(wid / sw - 0.34),
        this.cm(wid / sw - 0.34),
        this.cm(wid / sw - 0.34)
      ]
      : [
        this.cm(wid / fw - 0.34),
        this.cm(wid / sw - 0.34),
        this.cm(wid / sw - 0.34),
        this.cm(wid / sw - 0.34)
      ];

    if (this.showBolus) {
      widths.push(this.cm(wid / sw - 0.34));
    }

    let idx = 0;
    let lines = 0;
    let trendGluc = 0;
    if (day.prevDay != null) {
      const temp = day.prevDay.entries.find(
        (e) => e.time.getHours() === 23 && e.time.getMinutes() === 0);
      if (temp != null) {
        trendGluc = temp.gluc;
      }
    }
    const profile = this.repData.profile(
      new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate()), null, false);
    if (profile.store.listBasal.length === 0) {
      return null;
    }

    let basalMax = 0.1;
    for (const entry of profile.store.listBasal) {
      basalMax = Math.max(entry.value, basalMax);
    }

    for (const entry of day.entries) {
      if (idx >= tables.length) {
        if (this.showAllValues) {
          tables.push([
            [
              {text: this.msgTime, style: 'total', alignment: 'center'},
              {
                text: GLOBALS.getGlucInfo().unit,
                style: 'total',
                alignment: 'center'
              },
              {text: this.msgTrend, style: 'total', alignment: 'center'},
              {text: this.msgKHTitle, style: 'total', alignment: 'center'}
            ]
          ]);
        } else {
          tables.push([
            [
              {text: this.msgTime, style: 'total', alignment: 'center'},
              {
                text: GLOBALS.getGlucInfo().unit,
                style: 'total',
                alignment: 'center'
              },
              {text: this.msgTrend, style: 'total', alignment: 'center'},
              {text: this.msgBasal, style: 'total', alignment: 'center'},
              {text: this.msgKHTitle, style: 'total', alignment: 'center'}
            ]
          ]);
        }
        if (this.showBolus) {
          Utils.last(Utils.last(tables) as any[]).push({text: this.msgBolus, style: 'total', alignment: 'center'});
        }
      }

      if (!this.showAllValues && entry.time.getMinutes() != 0) {
        continue;
      }

      const startTime = GLOBALS.timeForCalc(entry.time);
      const endTime = GLOBALS.timeForCalc(entry.time) + (this.showAllValues ? 5 : 60) * 60;
      let bolusSum = 0.0;
      let carbs = 0.0;
      const list = day.treatments.filter((t) =>
        t.carbs >= 0 &&
        t.timeForCalc >= startTime &&
        t.timeForCalc < endTime);
      for (const t of list) {
        carbs += t.carbs;
        bolusSum += t.bolusInsulin ?? 0;
      }

      if (bolusSum == 0) {
        bolusSum = null;
      }

      let text = `${this.fmtTime(entry.time, {withUnit: columns < 3})}`;
      let trend = '';
      let trendColor = '';
      let gluc = `${GLOBALS.glucFromData(entry.gluc)}`;
      if (entry.time.getMinutes() === 0 && trendGluc > 0) {
        const trendValue = (entry.gluc - trendGluc) / trendGluc * 100;
        trend = `${GLOBALS.fmtNumber(trendValue, 0)}%`;
        if (entry.gluc >= 0) {
          trendGluc = entry.gluc;
        }
        if (Math.abs(trendValue) >= 15) {
          trendColor = this.colTrendCrit;
        } else if (Math.abs(trendValue) >= 10) {
          trendColor = this.colTrendWarn;
        } else {
          trendColor = this.colTrendNorm;
        }
      }
      if (entry.gluc <= 0) {
        gluc = '';
        trend = '';
        trendColor = '';
      }
      if (this.showAllValues) {
        tables[idx].push([
          {
            text: text,
            alignment: 'center',
            style: this.styleForTime(entry.time)
          },
          {
            text: gluc,
            alignment: 'center',
            fillColor: this.colForGlucBack(day, entry.gluc)
          },
          {text: trend, alignment: 'right', fillColor: trendColor},
          {text: carbs > 0 ? this.msgKH(carbs) : '', alignment: 'center'}
        ]);
      } else {
        const d = profile.store.listBasal.reverse().find(
          (e) => Utils.isBefore(e.time(day.date), Utils.addTimeSeconds(entry.time, 1))
        );
        const basal = d == null ? '' : GLOBALS.fmtBasal(d.value);
//        basal = '${basal} - ${d.isCalculated?'true':'false'}';
        const w = (d?.value ?? 0) * (widths[3] + this.cm(0.1)) / basalMax;
        tables[idx].push([
          {
            text: text,
            alignment: 'center',
            style: this.styleForTime(entry.time)
          },
          {
            text: gluc,
            alignment: 'center',
            fillColor: this.colForGlucBack(day, entry.gluc)
          },
          {text: trend, alignment: 'right', fillColor: trendColor},
          {
            stack: [
              {
                relativePosition: {x: this.cm(-0.05), y: this.cm(0)},
                canvas: [
                  {
                    type: 'rect',
                    x: this.cm(0),
                    y: this.cm(0),
                    w: w,
                    h: this.cm(0.4),
                    color: this.colBasalDay
                  }
                ]
              },
              {text: basal, alignment: 'center'},
            ]
          },
          {text: carbs > 0 ? this.msgKH(carbs) : '', alignment: 'center'},
        ]);
      }

      if (this.showBolus) {
        text = bolusSum == null
          ? null
          : `${GLOBALS.fmtNumber(bolusSum, 1)} ${this.msgInsulinUnit}`;
        Utils.last(tables[idx] as any[]).push({text: text, alignment: 'center'});
      }

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
    let y = this.yorg;

    if (!this.showAllValues) {
      ret.push({
        absolutePosition: {x: this.cm(x), y: this.cm(this.yorg)},
        columns: [
          {
            width: this.cm(wid),
            text: this.msgBasalInfo(this.fmtDateTime(profile.store.startDate)),
            fontSize: this.fs(10)
          }
        ]
      });
      y += 1.5;
    }

    for (const table of tables) {
      ret.push({
        absolutePosition: {x: this.cm(x), y: this.cm(y)},
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
