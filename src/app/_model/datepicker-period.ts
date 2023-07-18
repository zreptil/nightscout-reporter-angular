import {Utils} from '@/classes/utils';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {DatepickerEntry} from './datepicker-entry';

export class DatepickerPeriod {
  static monthNames = $localize`Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember`.split('|');
  static monthShortNames = $localize`Jan|Feb|Mär|Apr|Mai|Jun|Jul|Aug|Sep|Okt|Nov|Dez`.split('|');
  static dowNames = $localize`Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag`.split('|');
  static dowShortNames = $localize`Mo|Di|Mi|Do|Fr|Sa|So`.split('|');
  static shiftNames = $localize`Bis heute|Bis gestern|Bis Wochenende`.split('|');
  emptyReason: string;
  firstDayOfWeek = 7;
  end: Date;
  entryKey: string;
  minDate: Date;
  maxDate: Date;
  _dowActive = [true, true, true, true, true, true, true];
  list: DatepickerEntry[] = [];
  start: Date;

  constructor(src: string = '') {
    this.reset(src);
  }

  _shiftDate = 0;

  get shiftDate(): number {
    return this._shiftDate;
  }

  set shiftDate(value: number) {
    if (isNaN(value) || value < 0) {
      value = 0;
    }
    if (value >= DatepickerPeriod.shiftNames.length) {
      value = DatepickerPeriod.shiftNames.length - 1;
    }
    this._shiftDate = value;
  }

  get baseDate(): Date {
    switch (this.shiftDate) {
      case 0:
      default:
        return GlobalsData.now;
      case 1:
        return Utils.addDateDays(GlobalsData.now, -1);
      case 2:
        let diff = -(GlobalsData.now.getDay() - this.firstDayOfWeek);
        while (diff > 0) {
          diff -= 7;
        }
        return Utils.addDateDays(GlobalsData.now, diff);
    }
  }

  _dowActiveText: string;

  get dowActiveText(): string {
    if (this.isEmpty) {
      return '';
    }
    if (this._dowActiveText == null) {
      const ret: string[] = [];
      let cnt = 0;
      for (let i = 0; i < DatepickerPeriod.dowShortNames.length; i++) {
        let idx = i + this.firstDayOfWeek - 1;
        if (idx >= DatepickerPeriod.dowShortNames.length) {
          idx -= DatepickerPeriod.dowShortNames.length;
        }
        if (this.isDowActive(idx)) {
          ret.push(DatepickerPeriod.dowShortNames[idx]);
          cnt++;
        }
      }
      this._dowActiveText = cnt < DatepickerPeriod.dowShortNames.length ? ret.join(', ') : '';
    }
    return this._dowActiveText;
  }

  get dayCount(): number {
    let ret = 0;
    if (this.start != null && this.end != null) {
      ret = Utils.differenceInDays(new Date(this.end.getFullYear(), this.end.getMonth(), this.end.getDate()),
        new Date(this.start.getFullYear(), this.start.getMonth(), this.start.getDate())) + 1;
    }
    return ret;
  }

  get msgPeriodEmpty(): string {
    return $localize`Zeitraum festlegen`;
  }

  get display(): string {
    let ret = `${GLOBALS.fmtDate(this.start)} - ${GLOBALS.fmtDate(this.end)}`;
    if (this.entryKey != null) {
      ret = this.entryTitle;
    }
    if (this.isEmpty) {//this.start == null || this.end == null) {
      ret = this.msgPeriodEmpty;
    }
    if (Utils.isSameDay(this.start, this.end)) {
      ret = GLOBALS.fmtDate(this.start);
    }
    if ((GLOBALS.currPeriodShift?.months ?? 0) !== 0) {
      ret = `${ret} - ${GLOBALS.currPeriodShift.title}`;
    }
    if (Utils.isEmpty(ret)) {
      ret = this.msgPeriodEmpty;
    }
    return ret;
  }

  get isEmpty(): boolean {
    this.emptyReason = '';
    if ((this.entryKey == null || Utils.isEmpty(this.entryKey)) && this.start == null) {
      return true;
    }

    let beg = this.start;
    if (this.start == null || (this.start.getFullYear() === 1970 && this.start.getMonth() === 0 && this.start.getDate() === 1)) {
      return true;
    }
    while (beg != null && this.end != null && Utils.isOnOrBefore(beg, this.end)) {
      if (this.isDowActive(Utils.getDow(beg))) {
        return false;
      }
      beg = Utils.addDateDays(beg, 1);
    }

    this.emptyReason = $localize`Der Zeitraum enthält keine auswertbaren Tage`;

    return true;
  }

  get entryTitle(): string {
    if (this.list != null) {
      for (const entry of this.list) {
        if (entry.key === this.entryKey) {
          if (this.entryKey !== 'today' && this.shiftDate > 0) {
            return `${entry.title} (${DatepickerPeriod.shiftNames[this.shiftDate]})`;
          }
          return entry.title;
        }
      }
    }
    return '';
  }

  get entry(): DatepickerEntry {
    if (this.list != null) {
      for (const entry of this.list) {
        if (entry.key === this.entryKey) {
          return entry;
        }
      }
    }
    return null;
  }

  static monthName(date: Date): string {
    return date != null ? DatepickerPeriod.monthNames[date.getMonth()] : '';
  }

  static monthShortName(date: Date): string {
    return date != null ? DatepickerPeriod.monthShortNames[date.getMonth()] : '';
  }

  static dowName(date: Date): string {
    return date != null ? DatepickerPeriod.dowNames[Utils.getDow(date)] : '';
  }

  static dowShortName(date: Date): string {
    return date != null ? DatepickerPeriod.dowShortNames[Utils.getDow(date)] : '';
  }

  _shiftBy(ret: Date, months: number): Date {
    return new Date(ret.getFullYear(), ret.getMonth() - months, ret.getDate());
  }

  shiftStartBy(months: number): Date {
    if (this.entryKey != null && this.entry != null) {
      return this.entry.shift(this.start, months);
    }
    return this._shiftBy(this.start, months);
  }

  shiftEndBy(months: number): Date {
    if (this.entryKey != null && this.entry != null) {
      return this.entry.shift(this.end, months);
    }
    return this._shiftBy(this.end, months);
  }

  isDowActive(idx: number): boolean {
    return idx >= 0 && idx < this._dowActive.length ? this._dowActive[idx] : false;
  }

  activateDow(idx: number, isActive: boolean): void {
    if (idx < 0 || idx >= this._dowActive.length) {
      return;
    }
    this._dowActive[idx] = isActive;
    this._dowActiveText = null;
  }

  parse(date: string): Date {
    let ret: Date = null;
    if (date != null && date.length === 8) {
      const y = +(date.substring(0, 4) ?? '0');
      const m = +(date.substring(4, 6) ?? '1');
      const d = +(date.substring(6, 8) ?? '1');
      ret = new Date(y, m, d);
    }

    return ret;
  }

  refresh(): void {
    const item = this.list.find((element) => element.key === this.entryKey);
    if (item != null) {
      item.fill(this);
    }
  }

  reset(src: string): void {
    try {
      const parts = (src ?? '').split('|');
      this.start = null;
      this.end = null;
      this.entryKey = null;
      this.firstDayOfWeek = 7;
      if (parts.length >= 4) {
        this.start = Utils.parseDate(parts[0]);
        this.end = Utils.parseDate(parts[1]);
        this.entryKey = parts[2] === '' || parts[2] === 'null' ? null : parts[2];
        this.firstDayOfWeek = parseInt(parts[3]) ?? 7;
      }
      for (let i = 0; i < 7; i++) {
        this.activateDow(i, true);
        if (parts.length >= 5 && i < parts[4].length) {
          this.activateDow(i, parts[4][i] === '+');
        }
      }
      if (parts.length >= 5) {
        this.shiftDate = parseInt(parts[5]) ?? 0;
      }
    } catch (ex) {
    }
  }

  toString(): string {
    const ret: string[] = [];
    ret.push(this.start == null ? '' : Utils.fmtDate(this.start, 'yyyyMMdd'));
    ret.push(this.end == null ? '' : Utils.fmtDate(this.end, 'yyyyMMdd'));
    ret.push(this.entryKey ?? '');
    ret.push(`${this.firstDayOfWeek}`);
    let dow = '';
    for (const active of this._dowActive) {
      dow = `${dow}${active ? '+' : '-'}`;
    }
    ret.push(dow);
    ret.push(`${this.shiftDate}`);
    return Utils.join(ret, '|');
  }
}
