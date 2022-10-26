import {Utils} from '@/classes/utils';
import {DatepickerPeriod} from '@/_model/datepicker-period';

export class DatepickerEntry {

  constructor(public key: string, public title: string,
              public _fill: (data: DatepickerPeriod) => void,
              public _shift: (date: Date, shift: number) => Date) {
  }

  fill(data: DatepickerPeriod) {
    data.entryKey = this.key;
    this._fill(data);
  }

  shift(date: Date, shift: number): Date {
    return Utils.addDateMonths(date, -shift);
  }
}
