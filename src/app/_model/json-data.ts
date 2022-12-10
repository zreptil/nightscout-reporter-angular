import {Utils} from '@/classes/utils';

export enum Uploader { Unknown, XDrip, Tidepool, Minimed600, OpenAPS, AndroidAPS, Spike }

export class JsonData {
  static hourDiff: number = 0;

  constructor() {
  }

  static parseDate(value: string): Date {
    let ret = null;
    if (value != null && value.length === 8) {
      ret = new Date(+value.substring(0, 4), +value.substring(4, 6) - 1, +value.substring(6, 8));
    }
    return ret;
  }

  static fromDate(date: Date, def: string = null): string {
    if (date == null) {
      return def;
    }
    const ret: string[] = [];
    ret.push(`${date.getFullYear()}`.padStart(4, '0'));
    ret.push(`${date.getMonth() + 1}`.padStart(2, '0'));
    ret.push(`${date.getDate()}`.padStart(2, '0'));
    return Utils.join(ret, '');
  }

  static ensureJson(json: any): any {
    if (typeof json === 'string') {
      json = JSON.parse(json);
    }
    return json;
  }

  // here are the methods to check against low and high limits
  static isLow(value: number, low: number): boolean {
    return value < low;
  }

  static isHigh(value: number, high: number): boolean {
    return value >= high;
  }

  // To calculate the limits in the same way throughout the whole program,

  static isNorm(value: number, low: number, high: number): boolean {
    return !JsonData.isLow(value, low) && !JsonData.isHigh(value, high);
  }

  static toTime(value: string): Date {
    if (value == null) {
      return new Date(0, 1, 1);
    }
    let hour = 0;
    let minute = 0;
    let second = 0;
    let parts = value.split(':');
    if (!Utils.isEmpty(parts)) {
      hour = +parts[0] ?? 0;
    }
    if (parts.length >= 2) {
      minute = +parts[1] ?? 0;
    }
    if (parts.length >= 3) {
      second = +parts[2] ?? 0;
    }
    return new Date(0, 1, 1, hour, minute, second);
  }

  static toDate(value: any): Date {
    const ret = new Date();
    if (value == null) {
      return new Date(0, 1, 1);
    }
    if (typeof value === 'number') {
      ret.setTime(value);
      return ret;
    }
    ret.setTime(Date.parse(value));
    return JsonData.toLocal(ret) ?? new Date(0, 1, 1);
  }

  static toLocal(value: Date): Date {
    // const ret = Utils.addTimeHours(value, JsonData.hourDiff);
    return value; // Utils.addTimeMinutes(value, value.getTimezoneOffset());
  }

  static toText(value: any, def = ''): string {
    if (value == null) {
      return def;
    }
    if (typeof value === 'string') {
      return value;
    }
    return `${value}`;
  }

  static toBool(value: any, ifEmpty = false): boolean {
    if (value == null) {
      return ifEmpty;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      if (ifEmpty !== null && value === '') {
        return ifEmpty;
      }
      return (value === 'true' || value === 'yes');
    }
    return false;
  }

  static toNumber(value: any, def = 0): number {
    if (value == null || isNaN(value)) {
      return def;
    }
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      return Utils.parseNumber(value) ?? def;
    }
    if (typeof value === 'boolean') {
      return value ? def : 1 - def;
    }
    return def;
  }

  static copyList(list: any[]): any[] {
    const ret = [];
    for (const entry of list) {
      ret.push(entry.copy);
    }
    return ret;
  }

  keys(o: {}): string[] {
    return Object.keys(o ?? {});
  }

  fillFrom(src: any): void {
    for (const key of Object.keys(src)) {
      const v = src[key];
      if (v instanceof Date) {
        (this as any)[key] = new Date();
        (this as any)[key].setTime(v.getTime());
      } else {
        (this as any)[key] = src[key];
      }
    }
  }
}
