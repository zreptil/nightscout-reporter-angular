import {Utils} from '@/classes/utils';

export enum Uploader { Unknown, XDrip, Tidepool, Minimed600, OpenAPS, AndroidAPS, Spike }

export class JsonData {
  static hourDiff: number = 0;

  constructor() {
  }

  static ensureJson(json: any): any {
    if (typeof json === 'string') {
      json = JSON.parse(json);
    }
    return json;
  }

  // To calculate the limits in the same way throughout the whole program,
  // here are the methods to check against low and high limits
  static isLow(value: number, low: number): boolean {
    return value < low;
  }

  static isHigh(value: number, high: number): boolean {
    return value >= high;
  }

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
    if (Utils.isEmpty(parts)) {
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
    if (value == null) {
      return new Date(0, 1, 1);
    }
    if (typeof value === 'number') {
      return new Date(value);
    }
    return JsonData.toLocal(Date.parse(value)) ?? new Date(0, 1, 1);
  }

  static toLocal(value: any): Date {
    var ret = value?.toLocal();
    if (ret != null) {
      ret = ret.setTime(ret.getTime() + JsonData.hourDiff);
    }
    return ret;
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
    if (value == null || value === 'NaN') {
      return def;
    }
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      return +value ?? def;
    }
    if (typeof value === 'boolean') {
      return value ? def : 1 - def;
    }
    return def;
  }
}
