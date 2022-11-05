import {DatepickerPeriod} from '@/_model/datepicker-period';

export class DatepickerData {
  loadedPeriod: string = null;
  month: Date = null;
  period: DatepickerPeriod = null;

  constructor() {
    this.period = new DatepickerPeriod()
  }
}
