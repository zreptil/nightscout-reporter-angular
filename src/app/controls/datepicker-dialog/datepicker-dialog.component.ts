import {Component, Inject, OnInit} from '@angular/core';
import {DatepickerPeriod} from '@/_model/datepicker-period';
import {Utils} from '@/classes/utils';
import {DatepickerEntry} from '@/_model/datepicker-entry';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {DatepickerData} from '@/controls/datepicker/datepicker-data';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';

@Component({
  selector: 'app-datepicker-dialog',
  templateUrl: './datepicker-dialog.component.html',
  styleUrls: ['./datepicker-dialog.component.scss']
})
export class DatepickerDialogComponent implements OnInit {

  loadedPeriod: string = null;
  isStartValid = true;
  isEndValid = true;

  constructor(@Inject(MAT_DIALOG_DATA) public data: DatepickerData) {
  }

  get globals(): GlobalsData {
    return GLOBALS;
  }

  get isMaxMonth(): boolean {
    return this.data.period != null &&
      this.data.period.maxDate != null &&
      this.data.month != null &&
      (this.data.month.getFullYear() > this.data.period.maxDate.getFullYear() ||
        (this.data.month.getFullYear() == this.data.period.maxDate.getFullYear() &&
          this.data.month.getMonth() >= this.data.period.maxDate.getMonth()));
  }

  get isMinMonth(): boolean {
    return this.data.period != null &&
      this.data.period.minDate != null &&
      this.data.month != null &&
      (this.data.month.getFullYear() < this.data.period.minDate.getFullYear() ||
        (this.data.month.getFullYear() == this.data.period.minDate.getFullYear() &&
          this.data.month.getMonth() <= this.data.period.minDate.getMonth()));
  }

  get msgStartIncorrect(): string {
    return $localize`Das Startdatum ist nicht korrekt`;
  }

  // set startDate(value: string) {
  //   var saveDate = this.period.start;
  //   try {
  //     this.period.start = Date.parse(value, period.dateFormat);
  //     this.period.entryKey = null;
  //     this.isStartValid = true;
  //   } catch (ex) {
  //     this.period.start = saveDate;
  //     this.isStartValid = false;
  //   }
  // }

  get msgEndIncorrect(): string {
    return $localize`Das Enddatum ist nicht korrekt`;
  }

  get startDate(): string {
    return Utils.fmtDate(this.data.period.start);
  }

//   set endDate(value: string) {
//   try {
//   this.period.end = Date.parse(value, period.dateFormat);
//     this.period.entryKey = null;
//     this.isEndValid = true;
// } catch (ex) {
//     this.isEndValid = false;
// }
// }
  get showShift(): boolean {
    return this.data.period.entryKey != null && this.data.period.entryKey !== 'today'
  }

  get endDate(): string {
    return Utils.fmtDate(this.data.period.end);
  }

  get shiftName(): string {
    return DatepickerPeriod.shiftNames[this.data.period.shiftDate ?? 0];
  }

  get classForTitle(): string[] {
    const ret = [];
    if (this.data.period.isEmpty) {
      ret.push('empty');
    }
    return ret;
  }

  ngOnInit(): void {
  }

  revertData() {
    this.data.period.reset(this.loadedPeriod);
  }

  setMonth(value: Date) {
    if (value != null) {
      this.data.month = value;
    }
  }

  onShortcutClick(item: DatepickerEntry) {
    item.fill(this.data.period);
    this.data.month = this.data.period.end;
  }

  onShiftClick() {
    let value = this.data.period.shiftDate + 1;
    if (value < 0) {
      value = 0;
    }
    if (value >= DatepickerPeriod.shiftNames.length) {
      value = 0;
    }
    this.data.period.shiftDate = value;
    this.data.period.refresh();
  }

  addMonths(value: number) {
    this.data.month = Utils.addDateMonths(this.data.month, value);
  }
}
