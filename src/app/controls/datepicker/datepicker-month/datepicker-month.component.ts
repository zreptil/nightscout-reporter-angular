import {Component, Input, OnInit, output} from '@angular/core';
import {DayData, MonthData} from '@/controls/datepicker/datepicker-month/datepicker-data';
import {DatepickerPeriod} from '@/_model/datepicker-period';
import {Utils} from '@/classes/utils';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';

@Component({
  selector: 'app-datepicker-month',
  templateUrl: './datepicker-month.component.html',
  styleUrls: ['./datepicker-month.component.scss'],
  standalone: false
})
export class DatepickerMonthComponent implements OnInit {
  month: MonthData = null;
  readonly dateChanged = output<Date>();
  protected readonly DatepickerPeriod = DatepickerPeriod;

  constructor() {
  }

  get globals(): GlobalsData {
    return GLOBALS;
  }

  _period: DatepickerPeriod = null;

  get period(): DatepickerPeriod {
    return this._period;
  }

  @Input()
  set period(value: DatepickerPeriod) {
    this._period = value;
    if (this._period != null && this._date != null) {
      this.month = new MonthData(this._period, this._date);
    }
  }

  _date: Date;

  get date(): Date {
    if (this._date == null) {
      this.date = GlobalsData.now;
    }
    return this._date;
  }

  @Input()
  set date(value: Date) {
    this._date = value;
    if (this._period != null && this._date != null) {
      this.month = new MonthData(this._period, this._date);
    }
  }

  get firstDayOfWeek(): number {
    return this.period.firstDayOfWeek;
  }

  set firstDayOfWeek(value: number) {
    while (value > 7) {
      value -= 7;
    }
    while (value < 1) {
      value += 7;
    }
    this.period.firstDayOfWeek = value;
    if (this._period != null && this._date != null) {
      this.month = new MonthData(this._period, this._date);
    }
  }

  get yearList(): number[] {
    const year = this._date.getFullYear();
    const ret: number[] = [];
    for (let i = -10; i < 10; i++) {
      ret.push(year + i);
    }
    return ret;
  }

  ngOnInit(): void {
  }

  nameForMonth(month: number): string {
    return DatepickerPeriod.monthNames[month];
  }

  monthName(date: Date): string {
    return DatepickerPeriod.monthName(date);
  }

  dowmark(idx: number): string {
    return this.period.isDowActive(idx) ? 'dow-active' : 'dow-inactive';
  }

  dayclass(day: DayData): string[] {
    const ret = [];
    if (this.period.entryKey != null) {
      ret.push('key');
    }
    if (day.isRaised) {
      ret.push('raised');
    }
    return ret;
  }

  weekdayClicked(day: DayData) {
    this.firstDayOfWeek = Utils.getDow(day.date);
    this.period.refresh();
  }

  monthClicked(month: number) {
    this._date = new Date(this._date.getFullYear(), month, this._date.getDate());
    this.month = new MonthData(this._period, this._date);
    this.dateChanged.emit(this._date);
    GLOBALS.dpEditMode = 'day';
  }

  monthclass(month: number): string {
    const beg = +Utils.fmtDate(this._period.start, 'yyyyMM');
    const end = +Utils.fmtDate(this._period.end, 'yyyyMM');
    const check = +Utils.fmtDate(new Date(this.date.getFullYear(), month, 1), 'yyyyMM');
    if (check >= beg && check <= end) {
      return 'active';
    }
    return '';
  }

  yearClicked(year: number) {
    this._date = new Date(year, this._date.getMonth(), this._date.getDate());
    this.month = new MonthData(this._period, this._date);
    this.dateChanged.emit(this._date);
    GLOBALS.dpEditMode = 'month';
  }

  yearclass(year: number): string[] {
    const ret: string[] = [];
    if (year >= this.period.start.getFullYear() && year <= this.period.end.getFullYear()) {
      ret.push('active');
    }
    return ret;
  }

  dayClicked(day: DayData) {
    if (this.period.start != null && Utils.isBefore(day.date, this.period.start)) {
      this.period.start = day.date;
      this.period.entryKey = null;
    } else if (this.period.end != null && Utils.isAfter(day.date, this.period.end)) {
      this.period.end = day.date;
      this.period.entryKey = null;
    } else {
      this.period.start = day.date;
      this.period.end = day.date;
      this.period.entryKey = null;
    }
  }

  weekday(date: Date) {
    return Utils.getDow(date);
  }

  createStyle(beg: number, end: number): any {
    const gradient: string[] = [];
    const ret: any = {};
    let bgColor = 'var(--datepickerBtnRaisedBack)';
    ret.color = 'var(--datepickerBtnRaisedFore)';
    if (this.period.entryKey != null) {
      bgColor = 'var(--datepickerBtnRaisedKeyBack)';
      ret.color = 'var(--datepickerBtnKeyFore)';
    }
    if (beg > 0) {
      gradient.push(`transparent 0%`);
      if (beg < 1) {
        gradient.push(`transparent ${Math.floor(beg * 100)}%`);
        gradient.push(`${bgColor} ${Math.floor(beg * 100)}%`);
      } else {
        gradient.push(`transparent 100%`);
      }
    } else {
      gradient.push(`${bgColor}  0%`);
    }
    if (end < 1) {
      gradient.push(`${bgColor}  ${Math.floor(end * 100)}%`);
      gradient.push(`transparent ${Math.floor(end * 100)}%`);
      gradient.push(`transparent 100%`);
    } else {
      gradient.push(`${bgColor} 100%`);
    }
    ret.background = `linear-gradient(to right,${Utils.join(gradient, ',')})`;
    return ret;
  }

  protected setEditMode(mode: 'month' | 'year' | 'day') {
    GLOBALS.dpEditMode = mode;
  }

  protected styleForMonth(month: number) {
    const by = this._period.start.getFullYear();
    const ey = this._period.end.getFullYear();
    const bm = this._period.start.getMonth();
    const em = this._period.end.getMonth();
    const cy = this._date.getFullYear();
    if (by > cy || (by === cy && bm > month)) {
      return {};
    }
    if (ey < cy || (ey === cy && em < month)) {
      return {};
    }
    let beg = 0;
    let end = 1;
    if (by === cy && bm === month) {
      beg = this._period.start.getDate() / DatepickerPeriod.daysInMonth(this._period.start);
    }
    if (ey === cy && em === month) {
      end = this._period.end.getDate() / DatepickerPeriod.daysInMonth(this._period.end);
    }
    if (beg === end) {
      beg -= 0.01;
      end += 0.01;
    }
    return this.createStyle(beg, end);
  }

  protected styleForYear(year: number) {
    const by = this._period.start.getFullYear();
    const bd = DatepickerPeriod.dayOfYear(this._period.start);
    const ey = this._period.end.getFullYear();
    const ed = DatepickerPeriod.dayOfYear(this._period.end);
    if (by > year) {
      return {};
    }
    if (ey < year) {
      return {};
    }
    let beg = 0;
    let end = 1;
    if (by === year) {
      beg = bd / 365;
    }
    if (ey === year) {
      end = ed / 365;
    }
    if (beg === end) {
      beg -= 0.01;
      end += 0.01;
    }
    return this.createStyle(beg, end);
  }

  protected yearDisabled(year: number) {
    const check = new Date(year, 0, 1);
    if (this._period.maxDate != null && Utils.compareDate(check, this._period.maxDate) > 0) {
      return true;
    }
    return this._period.minDate != null && Utils.compareDate(this._period.minDate, check) < 0;
  }

  protected monthDisabled(month: number) {
    const check = new Date(this._date.getFullYear(), month, 1);
    if (this._period.maxDate != null && Utils.compareDate(check, this._period.maxDate) > 0) {
      return true;
    }
    return this._period.minDate != null && Utils.compareDate(this._period.minDate, check) < 0;
  }
}
