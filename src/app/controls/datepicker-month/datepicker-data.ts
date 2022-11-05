import {DatepickerPeriod} from '@/_model/datepicker-period';
import {Utils} from '@/classes/utils';

export class _Day {
  date: Date;

  constructor(public _period: DatepickerPeriod, d: Date, public _forMonth: number) {
    this.date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  get name(): string {
    return DatepickerPeriod.dowName(this.date);
  }

  get shortName(): string {
    return DatepickerPeriod.dowShortName(this.date);
  }

//  DatepickerPeriod get myPeriod => _period;

  get day(): number {
    return this.date.getDate();
  }

  get isRaised(): boolean {

    return this._period.start != null && this._period.end != null
      && Utils.isOnOrAfter(this.date, this._period.start)
      && Utils.isOnOrBefore(this.date, this._period.end);
  }

  get isEnabled(): boolean {
    if (this.date.getMonth() != this._forMonth) {
      return false;
    }
    if (this._period.maxDate != null && Utils.isAfter(this.date, this._period.maxDate)) {
      return false;
    }
    if (this._period.minDate != null && Utils.isBefore(this.date, this._period.minDate)) {
      return false;
    }
    // noinspection RedundantIfStatementJS
    if (!this._period.isDowActive(Utils.getDow(this.date))) {
      return false;
    }
    return true;
  }
}

export class _Week {
  days: _Day[] = [];

  constructor(public _period: DatepickerPeriod, public _date: Date, public _forMonth: number) {
    let d = new Date(_date.getFullYear(), _date.getMonth(), _date.getDate());
    for (let i = 0; i < 7; i++) {
      this.days.push(new _Day(_period, d, _forMonth));
      d = Utils.addDateDays(d, 1);
    }
  }
}

export class _Month {
  weeks: _Week[] = [];

  constructor(public _period: DatepickerPeriod, date: Date) {
    date = new Date(date.getFullYear(), date.getMonth(), 1);
    let d = new Date(date.getFullYear(), date.getMonth(), 1);
    const diff = _period.firstDayOfWeek - Utils.getDow(d);
    d = Utils.addDateDays(d, diff <= 0 ? diff : diff - 7);
    do {
      this.weeks.push(new _Week(_period, d, date.getMonth()));
      d = Utils.addDateDays(d, 7);
    }
    while (d.getMonth() == date.getMonth());
  }
}
