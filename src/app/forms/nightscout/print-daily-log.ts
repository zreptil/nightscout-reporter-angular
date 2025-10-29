import {BasePrint} from '@/forms/base-print';
import {PageData} from '@/_model/page-data';
import {ParamInfo} from '@/_model/param-info';
import {PdfService} from '@/_services/pdf.service';
import {GLOBALS} from '@/_model/globals-data';
import {TreatmentData} from '@/_model/nightscout/treatment-data';
import {DayData} from '@/_model/nightscout/day-data';
import {Utils} from '@/classes/utils';
import {EntryData} from '@/_model/nightscout/entry-data';
import {ReportData} from '@/_model/report-data';
import {ProfileEntryData} from '@/_model/nightscout/profile-entry-data';
import {JsonData} from '@/_model/json-data';
import {ProfileGlucData} from '@/_model/nightscout/profile-gluc-data';
import {BaseProfile, CalcData} from '@/forms/nightscout/base-profile';

class Flags {
  hasKatheter = false;
  hasSensor = false;
  hasAmpulle = false;
  hasBattery = false;
}

export class PrintDailyLog extends BaseProfile {
  override help = $localize`:help for daylog@@help-daylog:Dieses Formular zeigt die Daten in tabellarischer Form an. Es kann abhängig von den
ausgewählten Optionen sehr viele Seiten umfassen. Es ist vor allem dafür sinnvoll, um bestimmte Daten aufzufinden.
Zum Beispiel kann man damit ermitteln, wann Katheterwechsel vorgenommen wurden, wieviele Datensätze als doppelt
erkannt wurden oder wo Notizen erfasst wurden.`;
  override baseId = 'daylog';
  override baseIdx = '07';
  isFormParam1: boolean;
  override params = [
    new ParamInfo(2, PrintDailyLog.msgParam1, {boolValue: true}),
    new ParamInfo(3, PrintDailyLog.msgParam2, {boolValue: true}),
    new ParamInfo(4, PrintDailyLog.msgParam3, {boolValue: true, subParams: [new ParamInfo(0, PrintDailyLog.msgParam7, {boolValue: true})]}),
    new ParamInfo(11, PrintDailyLog.msgParam4, {
      boolValue: true, isLoopValue: true, subParams: [
        new ParamInfo(0, PrintDailyLog.msgParam15, {boolValue: false, isLoopValue: true})]
    }),
    new ParamInfo(10, PrintDailyLog.msgParam5, {boolValue: true, isLoopValue: true}),
    new ParamInfo(5, PrintDailyLog.msgParam6, {boolValue: true, subParams: [new ParamInfo(0, PrintDailyLog.msgParam14, {boolValue: true})]}),
    new ParamInfo(8, PrintDailyLog.msgParam8, {boolValue: true, isLoopValue: true}),
    new ParamInfo(0, PrintDailyLog.msgParam9, {
      list: [
        $localize`Keine`,
        $localize`1 Minute`,
        $localize`5 Minuten`,
        $localize`15 Minuten`,
        $localize`30 Minuten`,
        $localize`1 Stunde`
      ]
    }),
    new ParamInfo(1, PrintDailyLog.msgParam10, {boolValue: true, subParams: [new ParamInfo(0, PrintDailyLog.msgParam18, {boolValue: false})]}),
    new ParamInfo(6, PrintDailyLog.msgParam11, {boolValue: true, subParams: [new ParamInfo(0, PrintDailyLog.msgParam12, {boolValue: true})]}),
    new ParamInfo(7, PrintDailyLog.msgParam13, {boolValue: true}),
    new ParamInfo(12, PrintDailyLog.msgParam16, {boolValue: false, stateForAll: false, subParams: [new ParamInfo(0, PrintDailyLog.msgParam17, {boolValue: false, stateForAll: false})]}),
    new ParamInfo(9, BasePrint.msgOverrides, {boolValue: true, isLoopValue: true}),
  ];

  showNotes: boolean;
  showCarbs: boolean;
  showIE: boolean;
  showSMB: boolean;
  showTempBasal: boolean;
  showProfileSwitch: boolean;
  showIESource: boolean;
  showTempTargets: boolean;
  showGluc: boolean;
  showGlucSource: boolean;
  showChanges: boolean;
  showChangesColumn: boolean;
  showCalibration: boolean;
  showProfileSwitchDetails: boolean;
  showTempDigit: boolean;
  showDupes: boolean;
  showOnlyDupes: boolean;
  showTempOverrides: boolean;
  groupMinutes = 0;
  lineWidth: number;
  _isFirstLine = true;
  _hasData = false;
  override tableHeadFilled = false;
  override tableHeadLine: any[] = [];
  override tableWidths: any[] = [];
  _body: any[] = [];
  _page: any[] = [];
  _y: number;
  _bloodValue: number;
//  number _lineHeight = 0.34;
  _lineHeight = 0.4;
  _cellSpace = 0.12; //((23.59 / 70) - 0.3) / 2;
  _maxY: number;

  constructor(ps: PdfService, suffix: string = null) {
    super(ps);
    this.init(suffix);
  }

  static get msgParam1(): string {
    return $localize`Notizen`;
  }

  static get msgParam2(): string {
    return $localize`Kohlenhydrate`;
  }

  static get msgParam3(): string {
    return $localize`Insulin`;
  }

  static get msgParam4(): string {
    return $localize`Temporäre Basalraten`;
  }

  static get msgParam5(): string {
    return $localize`SMB`;
  }

  static get msgParam6(): string {
    return $localize`Profilwechsel`;
  }

  static get msgParam7(): string {
    return $localize`Insulin-Quelle`;
  }

  static get msgParam8(): string {
    return $localize`Temporäre Ziele`;
  }

  static get msgParam9(): string {
    return $localize`Gruppierung der Zeiten`;
  }

  static get msgParam10(): string {
    return $localize`Glukosewert`;
  }

  static get msgParam11(): string {
    return $localize`Wechsel (Katheter etc.)`;
  }

  static get msgParam12(): string {
    return $localize`Zusätzliche Spalte anzeigen`;
  }

  static get msgParam13(): string {
    return $localize`Kalibrierung und blutige Messungen`;
  }

  static get msgParam14(): string {
    return $localize`Details des Profilwechsels`;
  }

  static get msgParam15(): string {
    return $localize`Dauer mit Minutenbruchteil`;
  }

  static get msgParam16(): string {
    return $localize`Mehrfache Datensätze kennzeichnen`;
  }

  static get msgParam17(): string {
    return $localize`Nur mehrfache Datensätze anzeigen`;
  }

  static get msgParam18(): string {
    return $localize`Quelle des Wertes`;
  }

  static get msgMultipleNotFound(): string {
    return $localize`Es gibt keine mehrfachen Datensätze.`;
  }

  override get title(): string {
    return $localize`Protokoll`;
  }

  override get estimatePageCount(): any {
    return {count: 0, isEstimated: true};
  }

  override get isBetaOrLocal(): boolean {
    return false;
  }

  override get imgList(): string[] {
    return [
      'nightscout',
      'katheter.print',
      'sensor.print',
      'ampulle.print',
      'battery.print'
    ];
  }

  override get isPortrait(): boolean {
    return true;
  }

  override get footerText(): any {
    return this.footerTextDayTimes;
  }

//  number _cellSpace = 0.11;

  get msgLogTempTargetReset(): string {
    return $localize`Aufhebung von temp. Ziel`;
  }

  get msgChangeSite(): string {
//    const ret = 'זה טקסט מבחן שאמור להגיד בעברית שזה פשוט טקסט חסר משמעות לחלוטין שפשוט אמור להיות ארוך כדי שתוכלו לראות איך הוא מתנהג בתדפיס.';
//    return ret;
    return $localize`Katheterwechsel`;
  }

  get msgChangeSensor(): string {
    return $localize`Sensorwechsel`;
  }

  get msgChangeInsulin(): string {
    return $localize`Ampullenwechsel`;
  }

  get msgChangeBattery(): string {
    return $localize`Batteriewechsel`;
  }

  override extractParams(): void {
    this.showNotes = this.params[0].boolValue;
    this.showCarbs = this.params[1].boolValue;
    this.showIE = this.params[2].boolValue;
    this.showIESource = this.params[2].subParams[0].boolValue;
    this.showTempBasal = this.params[3].boolValue;
    this.showTempDigit = this.params[3].subParams[0].boolValue;
    this.showSMB = this.params[4].boolValue;
    this.showProfileSwitch = this.params[5].boolValue;
    this.showProfileSwitchDetails = this.params[5].subParams[0].boolValue;
    this.showTempTargets = this.params[6].boolValue;

    switch (this.params[7].intValue) {
      case 1:
        this.groupMinutes = 1;
        break;
      case 2:
        this.groupMinutes = 5;
        break;
      case 3:
        this.groupMinutes = 15;
        break;
      case 4:
        this.groupMinutes = 30;
        break;
      case 5:
        this.groupMinutes = 60;
        break;
      default:
        this.groupMinutes = 0;
        break;
    }

    this.showGluc = this.params[8].boolValue;
    this.showGlucSource = this.params[8].subParams[0].boolValue;
    this.showChanges = this.params[9].boolValue;
    this.showChangesColumn = this.params[9].subParams[0].boolValue;
    this.showCalibration = this.params[10].boolValue;
    this.showDupes = this.params[11].boolValue;
    this.showOnlyDupes = this.params[11].subParams[0].boolValue;
    this.showTempOverrides = this.params[12].boolValue;
  }

  override async fillPages(pages: PageData[]) {
    /* ---------------------------
    this.showNotes = true;
    this.showCarbs = true;
    this.showIE = true;
    this.showSMB = true;
    this.showTempBasal = true;
    this.showProfileSwitch = true;
    this.showIESource = true;
    this.showTempTargets = true;
    this.showGluc = true;
    this.showChanges = true;
    this.showChangesColumn = true;
    this.showCalibration = true;
    this.showProfileSwitchDetails = true;
    this.showTempDigit = true;
    this.showDupes = false;
    this.showOnlyDupes = false;
    this.showTempOverrides = true;
    this.groupMinutes = 5;
    // --------------------------- */
    this.fillPagesInternal(pages);
    if (GLOBALS.showBothUnits) {
      GLOBALS.glucMGDLIdx = 1;
      this.fillPagesInternal(pages);
      GLOBALS.glucMGDLIdx = 2;
    }
  }

  fillPagesInternal(pages: PageData[]): void {
    const data = this.repData.data;
    this.titleInfo = this.titleInfoBegEnd();

    this.lineWidth = this.cm(0.03);
    this._y = this.yorg - 0.3;
    this._body = [];
    this._page = [];
    this.tableWidths = [];
    this._hasData = false;

    const oldLength = pages.length;
    for (let i = 0; i < data.days.length; i++) {
      const day = data.days[i];
      this.fillTable(day, pages);
      if (this.repData.isForThumbs) {
        i = data.days.length;
      }
    }

    if (this._hasData) {
      this._page.push(this.headerFooter());
      this._page.push(this.getTable(this.tableWidths, this._body));
      pages.push(new PageData(this.isPortrait, this._page));
    } else {
      this._page.push(this.headerFooter());
      if (this.showDupes && this.showOnlyDupes) {
        this._page.push({
          relativePosition: {x: this.cm(2.2), y: this.cm(this.yorg)},
          text: PrintDailyLog.msgMultipleNotFound
        });
      }
      pages.push(new PageData(this.isPortrait, this._page));
    }
    if (this.repData.isForThumbs && pages.length - oldLength > 1) {
      pages.splice(oldLength + 1, pages.length);
    }
  }

  lineHeight(lineCount: number): number {
    return 2 * this._cellSpace + lineCount * (this._lineHeight + this._cellSpace);
  }

  fillTable(day: DayData, pages: PageData[]): void {
    this._maxY = this.height - 2.8;
    this.tableHeadFilled = false;
    this.tableHeadLine = [];
    this._isFirstLine = true;

    //    number groupMinutes = GLOBALS.isLocal ? 60 : 0;
    let nextTime = new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate(), 0, this.groupMinutes);

    let list: any[] = [];
    let flags = new Flags();
    const treatments: TreatmentData[] = [];

    for (const t of day.treatments) {
      treatments.push(t);
    }

    for (const e of day.bloody) {
      const t = new TreatmentData();
      t.createdAt = e.time;
      t.eventType = `nr-${e.type}`;
      t.glucoseType = 'finger';
      t.glucose = e.bloodGluc;
      t.notes = this.msgMBG(GLOBALS.glucFromData(e.bloodGluc), GLOBALS.getGlucInfo().unit);
      treatments.push(t);
    }

    for (const e of day.entries) {
      if (e.type === 'cal') {
        const t = new TreatmentData();
        t.createdAt = e.time;
        t.eventType = `nr-${e.type}`;
        t.notes =
          `${BasePrint.msgCalibration(GLOBALS.fmtNumber(e.scale, 2), GLOBALS.fmtNumber(e.intercept, 0), GLOBALS.fmtNumber(e.slope, 2))}`;
        treatments.push(t);
      }
    }
    treatments.sort((t1, t2) => Utils.compareDate(t1.createdAt, t2.createdAt));

    for (let i = 0; i < treatments.length; i++) {
      const t = treatments[i];
      let row: any[] = [];

      let wasAdded = false;
      if (this.groupMinutes === 0 || Utils.isBefore(t.createdAt, nextTime)) {
        wasAdded = true;
        this.fillList(this.groupMinutes !== 0, this.repData, day, t, list, flags);
      }

      if (this.groupMinutes === 0 || !Utils.isBefore(t.createdAt, nextTime)) {
        let time = t.createdAt;
        if (this.groupMinutes !== 0) {
          time = Utils.addTimeMinutes(nextTime, -this.groupMinutes);
        }
        while (!Utils.isEmpty(list)) {
          this._hasData = true;
          if (this._isFirstLine) {
            this._body.push(this.tableHeadLine);
            this._y += this.lineHeight(1);
            this._isFirstLine = false;
          }
          list = this.fillRow(time, this.repData, day, row,
            day.findNearest(day.entries, null, time), list, flags, 'row');
          row = [];
          if (!Utils.isEmpty(list) || this._y + this._lineHeight >= this._maxY) {
            this._page.push(this.headerFooter());
            this._page.push(this.getTable(this.tableWidths, this._body));
            pages.push(new PageData(this.isPortrait, this._page));
            this._page = [];
            this._body = [this.tableHeadLine];
            this._y = this.yorg - 0.3 + this.lineHeight(2);
            this._isFirstLine = false;
          } else {
            flags = new Flags();
          }
        }
        nextTime = Utils.addTimeMinutes(nextTime, this.groupMinutes);
      }

      if (!wasAdded) {
        i--;
      }
    }
  }

  fillRow(time: Date, src: ReportData, day: DayData, row: any,
          glucEntry: EntryData, list: any[], flags: Flags, style: string): string[] {
    if (glucEntry != null && this.showGlucSource) {
      list.splice(0, 0, `Quelle: ${glucEntry.device}`);
    }
    if (!Utils.isEmpty(list)) {
      const oldY = this._y;
      const size = this.fs(10);
      let wid = this.width - 1.8 - 5.1;
      if (this.showGluc) {
        wid -= 1.6;
      }
      if (this.showChanges && this.showChangesColumn) {
        wid -= 1.7;
      }
      let text = list[0];
      let y = this._y;
      let idx = 0;
      // the list can contain items with font defined as {font: ..., text: ...}
      // so the calculation of the length of the lines  needs to be done differently
      let calcText = text;
      if (calcText?.text != null) {
        calcText = calcText.text;
        text = JSON.stringify(text);
      } else {
        text = JSON.stringify({text: text});
      }
      for (let i = 1; i < list.length; i++) {
        let line = list[i];
        let calcLine = line;
        if (calcLine?.text != null) {
          calcLine = calcLine.text;
          line = JSON.stringify(line);
        } else {
          line = JSON.stringify({text: line});
        }
        if (calcText.endsWith(']')) {
          text = `${text} ${line}`;
          calcText = `${calcText} ${calcLine}`;
        } else if (calcText.endsWith('@')) {
          text = `${text.substring(0, text.length - 1)} ${line}`;
          calcText = `${calcText.substring(0, calcText.length - 1)} ${calcLine}`;
        } else {
          text = `${text}, ${line}`;
          calcText = `${calcText}, ${calcLine}`;
        }
      }
      const lines = text.split('\n');
      const calcLines = calcText.split('\n');
      if (lines.length > 1) {
        y += 2 * this._cellSpace;
      }
      const output: any[] = [];
      const charsPerLine = Math.floor(wid / 0.165);
      while (idx < lines.length &&
      y + this._lineHeight * (Math.floor(calcLines[idx].length / charsPerLine) + 1) < this._maxY) {
        y += this._lineHeight * (Math.floor(calcLines[idx].length / charsPerLine) + 1);
        output.push(...JSON.parse(`[${this.getText(y, lines[idx])}]`));
        idx++;
      }
      this._y = y;
      text = output.join('\n');
      console.log('output', output);
      if (text !== '') {
        this._y += 2 * this._cellSpace;
        this.addRow(true, this.cm(1.8), row, {
          text: this.msgTime,
          style: 'total',
          fontSize: size,
          alignment: 'center'
        }, {
          text: this.fmtTime(time),
          style: this.styleForTime(time),
          fontSize: size,
          alignment: 'center'
        });
        if (this.showGluc) {
          const gluc = glucEntry?.gluc;
          if (this._bloodValue == null) {
            this.addRow(true, this.cm(1.3), row, {
              text: GLOBALS.getGlucInfo().unit,
              style: 'total',
              fontSize: size,
              alignment: 'center'
            }, {
              text: GLOBALS.glucFromData(gluc),
              style: style,
              fontSize: size,
              alignment: 'center',
              fillColor: this.colForGlucBack(day, gluc)
            });
          } else {
            this.addRow(true, this.cm(1.3), row, {
              text: GLOBALS.getGlucInfo().unit,
              style: 'total',
              fontSize: size,
              alignment: 'center'
            }, {
              stack: [
                {
                  text: GLOBALS.glucFromData(gluc),
                  style: style,
                  fontSize: size,
                  alignment: 'center'
                },
                {
                  text: GLOBALS.glucFromData(this._bloodValue),
                  style: style,
                  fontSize: size,
                  alignment: 'center',
                  color: this.colBloodValues
                },
              ],
              fillColor: this.colForGlucBack(day, gluc)
            });
            this._y += this._lineHeight;
          }
        }
        if (this.showChanges && this.showChangesColumn) {
          const stack: any[] = [];
          let x = -0.5;
          if (flags.hasKatheter) {
            stack.push({
              relativePosition: {x: this.cm(x += 0.5), y: this.cm(0.1)},
              image: 'katheter.print',
              width: this.cm(0.4)
            });
          }
          if (flags.hasSensor) {
            stack.push({
              relativePosition: {x: this.cm(x += 0.5), y: this.cm(0)},
              image: 'sensor.print',
              width: this.cm(0.4)
            });
          }
          if (flags.hasAmpulle) {
            stack.push({
              relativePosition: {x: this.cm(x += 0.5), y: this.cm(0.1)},
              image: 'ampulle.print',
              width: this.cm(0.4)
            });
          }
          if (flags.hasBattery) {
            // noinspection JSUnusedAssignment
            stack.push({
              relativePosition: {x: this.cm(x += 0.5), y: this.cm(0.1)},
              image: 'battery.print',
              width: this.cm(0.4)
            });
          }
          this.addRow(true, this.cm(1.4), row, {
            text: BasePrint.msgChange,
            style: 'total',
            fontSize: size,
            alignment: 'center'
          }, {
            stack: stack
          });
        }
        this.addRow(true, this.cm(wid), row, {
          text: this.getText(oldY, `${this.fmtDate(time, {withShortWeekday: false, withLongWeekday: true})}`),
          style: 'total',
          fontSize: size,
          alignment: 'left'
        }, {
          text: output,
          style: style,
          fontSize: size,
          alignment: 'left'
        });
        this._body.push(row);
        this.tableHeadFilled = true;
      }
      lines.splice(0, idx);
      if (!Utils.isEmpty(lines) && lines[0] !== '') {
        list = lines.join('\n').split(', ');
      } else {
        list = [];
      }
    }
    this._bloodValue = null;
    return list;
  }

  getText(y: number, text: any): string {
    // if (GLOBALS.isLocal) {
    //   return `${GLOBALS.fmtNumber(y, 1)} - ${text}`;
    // }
    console.log('getText', y, text);
    return text;
  }

  basalFor(day: DayData, time: Date): ProfileEntryData {
    let ret: ProfileEntryData;
    for (let i = 0; i < day.profile.length; i++) {
      ret = day.profile[i];
      const check = ret.time(day.date, true);
      if ((check.getHours() === time.getHours() &&
          time.getMinutes() === check.getMinutes() &&
          time.getSeconds() === check.getSeconds()) ||
        (Utils.isBefore(check, time) &&
          Utils.isBefore(Utils.addTimeSeconds(time, ret.duration), check))) {
        return ret;
      }
    }

    return null;
  }

  msgLogTempTarget(target: string, duration: number, reason: string): string {
    return $localize`:@@msgLogTempTarget:temp. Ziel ${target} für ${duration} min, Grund: ${reason}`;
  }

  msgLogTempBasal(percent: string, duration: string): string {
    return $localize`:@@msgLogTempBasal:temp. Basal ${percent}% / ${duration} min`;
  }

  msgLogTempBasalAbsolute(value: string, duration: string): string {
    return $localize`:@@msgLogTempBasalAbsolute:temp. Basal ${value} / ${duration} min`;
  }

  msgLogSMB(insulin: number, unit: string): string {
    return $localize`:@@msgLogSMB:SMB ${insulin} ${unit}`;
  }

  msgLogMicroBolus(insulin: string, unit: string): string {
    return $localize`:@@msgLogMicroBolus:Microbolus ${insulin} ${unit}`;
  }

  msgMBG(gluc: string, unit: number): string {
    return $localize`:@@msgMBG:Blutige Messung ${gluc} ${unit}`;
  }

  msgLogOverride(range: string, duration: number, reason: string, scale: number): string {
    return $localize`:@@msgLogOverride:temp. Override für ${duration} min, Grund: ${reason}, Zielbereich: ${range}, Anpassung: ${scale}%`;
  }

  //{"_id":"2D5C42BE-CBE7-4139-BF03-95751ABE2C3C","correctionRange":[95,100],"reason":"😰 120%",
  // "timestamp": "2020-08-23T19:56:14Z",
  // "created_at":"2020-08-23T19:56:14.000Z","eventType":"Temporary Override","insulinNeedsScaleFactor":1.2,
  // "duration":0.022495784362157187,"enteredBy":"Loop","utcOffset":0,"carbs":null,"insulin":null}
  fillList(showTime: boolean, src: ReportData, day: DayData, t: TreatmentData, list: any[], flags: Flags): void {
    let lastIdx = list.length;
    if (this.showDupes && this.showOnlyDupes && t.duplicates < 2) {
      return;
    }

    const type = t.eventType.toLowerCase();
    if (this.showNotes &&
      t.notes != null &&
      !Utils.isEmpty(t.notes) &&
      !type.startsWith('nr-')) {
//      list.push(`${t.notes.replace(/<br>/g, '\n')}`);
      const textList = this.ps.getTextWithEmojiObjects(t.notes.replace(/<br>/g, '\n'));
      //const listig = this.ps.getTextWithEmojiObjects('Das sind zwei Emojis');
      for (const entry of textList) {
        list.push(entry);
      }
      //list.push('Es ist unglaublich, wie viel man an völligem Schwachsinn in so einen Text reinschreiben kann, ohne einen Zeilenumbruch drin zu haben und damit den Text so lang zu gestaltetn, dass er sicher über mehrere Zeilen aufgeteilt werden muss, egal, was passiert und wie breit auch immer das Blatt sein mag.')
      //list.push([...this.ps.getTextWithEmojiObjects('Hier sind keine Emojis')]);
      //console.log(list);
    }
    if (this.showCarbs && t.carbs != null && t.carbs != 0) {
      list.push(`${this.msgCarbs(t.carbs.toString())}`);
    }
    if (this.showIE && t.insulin != null && t.insulin != 0 && !t.isSMB) {
      if (this.showIESource) {
        let text = t.eventType;
        if (t.isMealBolus) {
          text = this.msgMealBolus;
        } else if (t.isBolusWizard) {
          text = this.msgBolusWizard;
        } else {
          if (!Utils.isEmpty(t.insulinInjections)) {
            text = null;
            for (const entry of t.insulinInjections) {
              list.push(`${entry.insulin} ${entry.units} ${this.msgInsulinUnit}`);
            }
          } else if (t.hasNoType) {
            text = this.msgInsulin;
          }
        }
        if (text != null) {
          list.push(`${text} ${t.insulin} ${this.msgInsulinUnit}`);
        }
      } else {
        list.push(`${t.insulin} ${this.msgInsulinUnit}`);
      }
    }
    if (this.showSMB) {
      if (t.insulin != null && t.insulin != 0 && t.isSMB) {
        list.push(this.msgLogSMB(t.insulin, this.msgInsulinUnit));
      } else if (t.microbolus != null && t.microbolus > 0) {
        list.push(this.msgLogMicroBolus(GLOBALS.fmtNumber(t.microbolus, GLOBALS.basalPrecision), this.msgInsulinUnit));
      }
    }
    if (this.showTempBasal && t.isTempBasal) {
      let entry = this.basalFor(day, t.createdAt);
      if (entry != null && entry.tempAdjusted > 0) {
        list.push(this.msgLogTempBasal(
          GLOBALS.fmtNumber(entry.tempAdjusted * 100, 0, 0, 'null', false, true),
          GLOBALS.fmtNumber(entry.duration / 60, this.showTempDigit ? 1 : 0)));
      } else {
        entry = ProfileEntryData.fromTreatment(null, t);
        if (entry != null) {
          list.push(this.msgLogTempBasalAbsolute(
            GLOBALS.fmtNumber(t.absoluteTempBasal, GLOBALS.basalPrecision, 0, '0', false),
            GLOBALS.fmtNumber(t.duration / 60, this.showTempDigit ? 1 : 0)));
        }
      }
    }
    if (this.showProfileSwitch && t.isProfileSwitch) {
      list.push(this.getProfileSwitch(src, day, t, this.showProfileSwitchDetails));
    }

    if (this.showTempTargets && t.isTempTarget) {
      let target: string;
      if (t.targetBottom === t.targetTop) {
        target = `${GLOBALS.glucFromStatusMGDL(t.targetBottom)} ${GLOBALS.getGlucInfo().unit}`;
      } else {
        target = `${GLOBALS.glucFromStatusMGDL(t.targetBottom)} - ${GLOBALS.glucFromStatusMGDL(t.targetTop)} ${GLOBALS.getGlucInfo().unit}`;
      }
      if (t.duration === 0 && t.targetBottom === 0) {
        list.push(this.msgLogTempTargetReset);
      } else {
        list.push(this.msgLogTempTarget(target, t.duration / 60, t.reason));
      }
    }
    if (this.showChanges) {
      if (t.isSiteChange) {
        list.push(this.msgChangeSite);
        flags.hasKatheter = true;
      }
      if (t.isSensorChange) {
        list.push(this.msgChangeSensor);
        flags.hasSensor = true;
      }
      if (t.isInsulinChange) {
        list.push(this.msgChangeInsulin);
        flags.hasAmpulle = true;
      }
      if (t.isPumpBatteryChange) {
        list.push(this.msgChangeBattery);
        flags.hasBattery = true;
      }
    }

    if (type.startsWith('nr-')) {
      if (this.showCalibration) {
        if (type === 'nr-cal' || type === 'nr-mbg') {
          list.push(`${t.notes}`);
        }
      }
    }

    if (t.isBloody) {
      this._bloodValue = t.glucose;
    }

    if (this.showTempOverrides && type === 'temporary override') {
      list.push(this.msgLogOverride(
        JsonData.toText(t.raw.correctionRange),
        t.duration / 60,
        t.reason,
        JsonData.toNumber(t.raw.insulinNeedsScaleFactor) * 100));
    }

    if (list.length != lastIdx) {
      if (this.showDupes && t.duplicates > 1) {
        list.splice(lastIdx, 0, `${t.duplicates} x @`);
      }
      if (list.length != lastIdx && showTime && this.groupMinutes > 1) {
        const time = `[${this.fmtTime(t.createdAt)}]`;
        if (lastIdx < 2 || list[lastIdx - 2] != time) {
          list.splice(lastIdx, 0, time);
        }
      }
    }
  }

  addRow(
    check: boolean, width: any, dst: any[], head: any, content: any) {
    if (!check) {
      return;
    }
    if (!this.tableHeadFilled) {
      this.tableHeadLine.push(head);
      this.tableWidths.push(width);
    }
    dst.push(content);
  }

  override getTable(widths: any[], body: any[], fontsize?: number): any {
    return {
      columns: [
        {
          margin: [this.cm(2.2), this.cmy(this.yorg - 0.3), this.cm(2.2), this.cmy(0.0)],
          width: this.cm(this.width),
          table: {widths: widths, body: body}
        }
      ],
      pageBreak: ''
    };
  }

  override getPage(page: number, profile: ProfileGlucData, calc: CalcData): PageData {
    return null;
  }
}
