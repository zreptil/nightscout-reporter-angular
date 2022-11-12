import {BasePrint} from '@/forms/base-print';
import {PageData} from '@/_model/page-data';
import {ParamInfo} from '@/_model/param-info';
import {PdfService} from '@/_services/pdf.service';
import {GLOBALS} from '@/_model/globals-data';
import {DayData} from '@/_model/nightscout/day-data';
import {ProfileGlucData} from '@/_model/nightscout/profile-gluc-data';
import {ProfileStoreData} from '@/_model/nightscout/profile-store-data';
import {Utils} from '@/classes/utils';

export class PrintDailyHours extends BasePrint {
  override help = $localize`:help for dayhours@@help-dayhours:Dieses Formular zeigt eine Übersicht über die
Stunden der Tage des ausgewählten Zeitraums an. Die angezeigten Werte sind die
Mittelwerte der innerhalb der entsprechenden Stunde gemessenen Werte. Sie
werden anhand des ausgewählten Zielbereichs eingefärbt. In den Formularoptionen
kann man die Startstunde festlegen. Die Datumsspalte befindet sich immer links
von 0 Uhr und zeigt an, wo ein neuer Tag beginnt.`;
  override baseId = 'dayhours';
  override baseIdx = '13';
  isFormParam1: boolean;
  override params = [
    new ParamInfo(0, this.msgStartHour, {
      list: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23']
    })];

  startHour = 0;

  constructor(ps: PdfService, suffix: string = null) {
    super(ps);
    this.init(suffix);
  }

  static get msgParam1(): string {
    return $localize`Parameter für PrintDailyHours`;
  }

  override get isPortrait(): boolean {
    return false;
  }

  get msgStartHour(): string {
    return $localize`Startstunde`;
  }

  override get footerText(): any {
    return this.footerTextDayTimes;
  }

  override get title(): string {
    return $localize`Tagesstunden`;
  }

  override get estimatePageCount(): any {
    let count = GLOBALS.period?.dayCount ?? 0;
    count = Math.ceil(count / 30);
    return {count: count, isEstimated: false};
  }

  override extractParams(): void {
    this.startHour = this.params[0].intValue;
  }

  fillRow(row: any, f: number, firstCol: string, day: DayData, style: string): void {
    const wid = this.cm((this.width - 4.4 - 2.1) / 24 - 0.33);
    let hour = this.startHour ?? 0;
    const orgDay = day;
    if (hour !== 0 && day.prevDay != null) {
      day = day.prevDay;
    }

    for (let i = 0; i < 24; i++) {
      const time = new Date(0, 1, 1, hour, 0);
      let gluc = 0.0;
      let count = 0;

      if (hour === 0) {
        // erste Spalte
        this.addTableRow(true, this.cm(2.0), row,
          {text: this.msgDate, style: 'total', alignment: 'center'},
          {text: firstCol, style: 'total', alignment: 'center'});
        day = orgDay;
      }

      for (const entry of day.entries) {
        if (entry.gluc > 0 && entry.time.getHours() === hour) {
          count++;
          gluc += entry.gluc;
        }
      }
      if (count > 0) {
        gluc = gluc / count;
      }

      if (gluc === 0) {
        gluc = null;
      }
      /*
            EntryData entry = day.findNearest(day.entries, null, check, maxMinuteDiff: 15);
            number gluc = entry?.gluc ?? null;
      */
      // Stundenspalte
      this.addTableRow(true, wid, row, {
        text: this.fmtTime(time),
        style: this.styleForTime(time),
        alignment: 'center'
      }, {
        text: `${GLOBALS.glucFromData(gluc)}`,
        style: style,
        alignment: 'right',
        fillColor: this.colForGlucBack(day, gluc)
      });
      hour++;
      if (hour === 24) {
        hour = 0;
      }
    }
    this.tableHeadFilled = true;
  }

  percentileFor(value: number): string {
    if (value === -1) {
      return '';
    }
    return GLOBALS.glucFromData(value, 1);
  }

  override getTable(widths: any, body: any): any {
    return {
      columns: [
        {
          margin: [this.cm(2.2), this.cmy(this.yorg - 0.5), this.cm(2.2), this.cmy(0.0)],
          width: this.cm(this.width),
          fontSize: this.fs(7),
          table: {widths: widths, body: body},
        }
      ],
      pageBreak: ''
    };
  }

  override fillPages(pages: PageData[]): void {
    const oldLength = pages.length;
    this._fillPages(pages);
    if (GLOBALS.showBothUnits) {
      GLOBALS.glucMGDLIdx = 1;
      this._fillPages(pages);
      GLOBALS.glucMGDLIdx = 2;
    }
    if (this.repData.isForThumbs && pages.length - oldLength > 1) {
      pages.splice(oldLength + 1, pages.length);
    }
  }

  _fillPages(pages: PageData[]): void {
    this.tableHeadFilled = false;
    this.tableHeadLine = [];
    this.tableWidths = [];
    this.titleInfo = this.titleInfoBegEnd();
    let f = 3.3;
    let body: any[] = [];
    f /= 100;

    let prevProfile: ProfileGlucData = null;
    let lineCount = 0;
    let page: any[] = [];
    const totalDay = new DayData(null, new ProfileGlucData(new ProfileStoreData('Intern')));
    totalDay.basalData.targetHigh = 0;
    totalDay.basalData.targetLow = 1000;
    // ignore: unused_local_variable
    let totalDays = 0;
    for (const day of this.repData.data.days) {
      day.init();
      if (day.entryCountValid == 0) {
        continue;
      }
      totalDays++;
      Utils.pushAll(totalDay.entries, day.entries);
      Utils.pushAll(totalDay.bloody, day.bloody);
      Utils.pushAll(totalDay.treatments, day.treatments);
      totalDay.basalData.targetHigh =
        Math.max(totalDay.basalData.targetHigh, day.basalData.targetHigh);
      totalDay.basalData.targetLow =
        Math.min(totalDay.basalData.targetLow, day.basalData.targetLow);
      const row: any[] = [];
      this.fillRow(row, f, this.fmtDate(day.date, {withShortWeekday: true}), day, 'row');
      const profile = this.repData.profile(new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate()));
      if (prevProfile == null ||
        profile.targetLow != prevProfile.targetLow ||
        profile.targetHigh != prevProfile.targetHigh) {
        body.push(this.tableHeadLine);
        lineCount += 2;
      }
      prevProfile = profile;

      body.push(row);
      lineCount++;
      if (lineCount == 33) {
        page.push(this.headerFooter());
        page.push(this.getTable(this.tableWidths, body));
        lineCount = 0;
        pages.push(new PageData(this.isPortrait, page));
        page = [];
        body = [];
        prevProfile = null;
      }
    }

    /*
        const row = [];
        totalDay.init();
        fillRow(row, f, msgDaySum(totalDays), totalDay, 'total');
        body.add(row);
    */
    if (prevProfile != null) {
      page.push(this.headerFooter());
      page.push(this.getTable(this.tableWidths, body));
      pages.push(new PageData(this.isPortrait, page));
    } else {
      const test = Utils.last(Utils.last(pages).content);
      if (!Utils.isEmpty(body)) {
        (Utils.last(test.columns) as any).table.body.push(Utils.last(body));
      }
    }
  }
}
