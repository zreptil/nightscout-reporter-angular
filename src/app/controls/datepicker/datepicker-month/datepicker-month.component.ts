import {Component, EventEmitter, Input, OnInit} from '@angular/core';
import {DayData, MonthData} from '@/controls/datepicker/datepicker-month/datepicker-data';
import {DatepickerPeriod} from '@/_model/datepicker-period';
import {Utils} from '@/classes/utils';
import {GlobalsData} from '@/_model/globals-data';

@Component({
  selector: 'app-datepicker-month',
  templateUrl: './datepicker-month.component.html',
  styleUrls: ['./datepicker-month.component.scss']
})
export class DatepickerMonthComponent implements OnInit {

  month: MonthData = null;
  trigger = new EventEmitter<UIEvent>();

  constructor() {
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

  ngOnInit(): void {
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
}
