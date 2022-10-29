export class Utils {
  static pushAll<T>(dst: T[], src: T[]): void {
    for (const entry of src ?? []) {
      dst.push(entry);
    }
  }

  static addTimeSeconds(date: Date, seconds: number): Date {
    const ret = new Date();
    ret.setTime(date.getTime() + seconds * 1000);
    return ret;
  }

  static addTimeMinutes(date: Date, minutes: number): Date {
    const ret = new Date();
    ret.setTime(date.getTime() + minutes * 1000 * 60);
    return ret;
  }

  static addTimeHours(date: Date, hours: number): Date {
    const ret = new Date();
    ret.setTime(date.getTime() + hours * 1000 * 60 * 60);
    return ret;
  }

  static addDateDays(date: Date, days: number): Date {
    const ret = new Date();
    ret.setTime(date.getTime());
    ret.setDate(ret.getDate() + days);
    return ret;
  }

  static addDateMonths(date: Date, months: number): Date {
    const ret = new Date();
    ret.setTime(date.getTime());
    ret.setMonth(ret.getMonth() + months);
    return ret;
  }

  static show(msg: any): void {
    console.log(msg);
  }

  static showDebug(msg: any): void {
    console.error(msg);
  }

  static pad(text: string | number, length = 2, padchar = '0'): string {
    let ret = `${text}`;
    while (ret.length < length) {
      ret = `${padchar}${ret}`;
    }
    return ret;
  }

  static fmtDuration(minutes: number): string {
    const isPast = minutes < 0;
    const hours = Math.floor(Math.abs(minutes) / 60);
    if (hours != 0) {
      if (isPast) {
        return $localize`vor ${hours}\:${Utils.pad(-minutes % 60)} Std`;
      } else {
        return $localize`in ${hours}\:${Utils.pad(minutes % 60)} Std`;
      }
    }
    return isPast ? $localize`vor ${-minutes} Min` : $localize`in ${minutes} Min`;
  }

  static sortTime(list: any[], map: (m: any) => { time: number } = m => m): any[] {
    return list?.sort((a, b) => {
      if (map(a).time < map(b).time) {
        return -1;
      }
      if (map(a).time > map(b).time) {
        return 1;
      }
      return 0;
    })
  }

  static fmtTime(time: number): string {
    if (isNaN(time)) {
      time = 0;
    }
    const hour = Math.floor(time / 60);
    const minute = time % 60;
    return Utils.fmtDate(new Date(0, 0, 0, hour, minute), 'hh:mm Uhr');
  }

  static fmtDate(date: Date, fmt: string = null): string {
    if (fmt === null) {
      fmt = $localize`dd.MM.yyyy, hh:mm`;
    }
    let ret = fmt;
    ret = ret.replace('dd', Utils.pad(date?.getDate() ?? '--'));
    if (date == null) {
      ret = ret.replace('MM', '--');
    } else {
      ret = ret.replace('MM', Utils.pad(date?.getMonth() + 1));
    }
    ret = ret.replace('yyyy', Utils.pad(date?.getFullYear() ?? '----', 4));
    ret = ret.replace('hh', Utils.pad(date?.getHours() ?? '--'));
    ret = ret.replace('mm', Utils.pad(date?.getMinutes() ?? '--'));
    ret = ret.replace('ss', Utils.pad(date?.getSeconds() ?? '--'));
    ret = ret.replace('sss', Utils.pad(date?.getMilliseconds() ?? '---'));
    return ret;
  }

  static isToday(date: Date) {
    const today = new Date();
    return date?.getFullYear() === today.getFullYear()
      && date?.getMonth() === today.getMonth()
      && date?.getDate() === today.getDate();
  }

  static isTodayOrBefore(date: Date) {
    if (date == null) {
      return true;
    }
    const today = new Date();
    return date?.getFullYear() <= today.getFullYear()
      && date?.getMonth() <= today.getMonth()
      && date?.getDate() <= today.getDate();
  }

  static getTime(date: Date = null) {
    if (date == null) {
      date = new Date();
    }
    return date.getHours() * 60 + date.getMinutes();
  }

  static nextListItem(item: string, list: string[]): string {
    if (list == null || list.length === 0) {
      return null;
    }
    const idx = list.findIndex(s => s === item);
    if (idx < 0 || idx === list.length - 1) {
      return list[0];
    }
    return list[idx + 1]
  }

  static isEmpty(text: any): boolean {
    if (text == null) {
      return true;
    }
    if (typeof text === 'string') {
      return text.trim() === '';
    }
    if (Array.isArray(text)) {
      return text.length === 0;
    }
    return false;
  }

  static compare(a: any, b: any): number {
    if (a === b) {
      return 0;
    }
    return (a < b) ? -1 : 1;
  }

  static compareDate(a: Date, b: Date): number {
    return Utils.compare(a?.getTime(), b?.getTime());
  }

  static join(dst: string[], separator: string) {
    return dst.join(separator);
  }

  static decimalPlaces(value: number): number {
    let v = `${value}`;
    while (v.endsWith('0')) {
      v = v.substring(0, v.length - 1);
    }
    var ret = Math.max(v.length - v.lastIndexOf('.') - 1, 0);
    return Math.min(ret, 3);
  }

  static isAfter(date1: Date, date2: Date): boolean {
    return date1?.getTime() > date2?.getTime();
  }

  static isBefore(date1: Date, date2: Date): boolean {
    return date1?.getTime() < date2?.getTime();
  }

  static isSameDay(date1: Date, date2: Date) {
    return date1.getFullYear() === date2.getFullYear()
      && date1.getMonth() === date2.getMonth()
      && date1.getDate() === date2.getDate();
  }

  static isSameMoment(date1: Date, date2: Date) {
    return date1.getTime() === date2.getTime();
  }

  static isOnOrBefore(date1: Date, date2: Date) {
    return this.isBefore(date1, date2) || this.isSameDay(date1, date2);
  }

  static isOnOrAfter(date1: Date, date2: Date) {
    return this.isAfter(date1, date2) || this.isSameDay(date1, date2);
  }

  static differenceInDays(date1: Date, date2: Date): number {
    const ret = date1?.getTime() - date2?.getTime();
    return Math.floor(ret / 1000 / 60 / 60 / 24);
  }

  static differenceInSeconds(date1: Date, date2: Date): number {
    const ret = date1?.getTime() - date2?.getTime();
    return Math.floor(ret / 1000);
  }

  static differenceInMinutes(date1: Date, date2: Date): number {
    const ret = date1?.getTime() - date2?.getTime();
    return Math.floor(ret / 1000 / 60);
  }

  static differenceInMilliseconds(date1: Date, date2: Date): number {
    return date1?.getTime() - date2?.getTime();
  }

  static findLast<T>(list: T[], method: (e: T) => boolean) {
    const temp = list.filter(method);
    if (temp != null && temp.length > 0) {
      return temp[temp.length - 1];
    }
    return null;
  }

  static plural(value: number, options: any): string {
    return options[value] ?? options.other;
  }

  static jsonize(data: any) {
    return JSON.parse(JSON.stringify(data));
  }

  static rnd(max: number): number {
    return Math.floor(Math.random() * max);
  }
}
