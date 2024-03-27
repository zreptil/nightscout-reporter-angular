import {Log} from '@/_services/log.service';
import {EntryData} from '@/_model/nightscout/entry-data';
import {lastValueFrom, Observable} from 'rxjs';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';

/**
 * A collection of utility functions.
 */
export class Utils {
  static replace(text: string, src: string | string[], dst: string | string[]): string {
    if (!Array.isArray(src) && !Array.isArray(dst)) {
      src = [src];
      dst = [dst];
    }
    if (src.length !== dst.length) {
      console.error('Utils.replace: src and dst must have the same length', text, src, dst);
      return text;
    }
    for (let i = 0; i < src.length; i++) {
      text = text.replace(src[i], dst[i]);
    }
    return text;
  }

  static last<T>(list: T[]): T {
    return list?.[list.length - 1] ?? null;
  }

  static first<T>(list: T[]): T {
    return list?.[0] ?? null;
  }

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

  static getDow(date: Date): number {
    let ret = date.getDay() - 1;
    if (ret < 0) {
      ret += 7;
    }
    return ret;
  }

  static addDateMonths(date: Date, months: number): Date {
    const ret = new Date();
    ret.setTime(date?.getTime() ?? GlobalsData.now.getTime());
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

  static parseDate(value: string): Date {
    let ret = null;
    if (value.length === 8) {
      const y = parseInt(value.substring(0, 4));
      const m = parseInt(value.substring(4, 6)) - 1;
      const d = parseInt(value.substring(6, 8));
      ret = new Date(y, m, d);
    }

    return ret;
  }

  static nowTime(): string {
    const now = new Date();
    return this.fmtTime(now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds());
  }

  static fmtTime(time: number): string {
    if (isNaN(time)) {
      time = 0;
    }
    let fmt = GLOBALS.language.timeFormat;
    if (time < 1440) {
      fmt = GLOBALS.language.timeShortFormat;
      time *= 60;
    }
    const hour = Math.floor(time / 3600) % 24;
    const minute = Math.floor(time % 3600 / 60);
    const second = time % 60;
    return Utils.fmtDate(new Date(0, 0, 0, hour, minute, second), fmt);
  }

  static fmtDateTime(date: Date): string {
    const fmt = GLOBALS.language.dateFormat + ', ' + GLOBALS.language.timeFormat;
    return Utils.fmtDate(date, fmt);
  }

  static fmtDate(date: Date, fmt: string = null): string {
    if (fmt == null) {
      fmt = GLOBALS.language.dateFormat;
    }
    let ret = fmt;
    ret = ret.replace(/dd/g, Utils.pad(date?.getDate() ?? '--'));
    ret = ret.replace(/yyyy/g, Utils.pad(date?.getFullYear() ?? '----', 4));
    ret = ret.replace(/hh/g, Utils.pad(date?.getHours() ?? '--'));
    ret = ret.replace(/mm/g, Utils.pad(date?.getMinutes() ?? '--'));
    ret = ret.replace(/ss/g, Utils.pad(date?.getSeconds() ?? '--'));
    ret = ret.replace(/sss/g, Utils.pad(date?.getMilliseconds() ?? '---'));
    if (date == null) {
      ret = ret.replace(/MM/g, '--');
      ret = ret.replace(/HH/g, '--');
      ret = ret.replace(/ap/g, '--');
      ret = ret.replace(/AP/g, '--');
    } else {
      ret = ret.replace(/MM/g, Utils.pad(date.getMonth() + 1));
      const h = date.getHours() % 12;
      ret = ret.replace(/HH/g, Utils.pad(h));
      ret = ret.replace(/ap/g, date.getHours() >= 12 ? 'pm' : 'am');
      ret = ret.replace(/AP/g, date.getHours() >= 12 ? 'PM' : 'AM');
    }
    return ret;
  }

  static isToday(date: Date) {
    return Utils.isSameDay(date, new Date());
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

  /**
   * compare two values
   * @param a first value
   * @param b second value
   * @returns
   * 0 if a === b
   * -1 if a < b
   * 1 if a > b
   */
  static compare(a: any, b: any): number {
    if (a === b) {
      return 0;
    }
    return (a < b) ? -1 : 1;
  }

  /**
   * compare two dates
   * @param a first date
   * @param b second date
   * @returns
   * 0 if a === b
   * -1 if a < b
   * 1 if a > b
   */
  static compareDate(a: Date, b: Date): number {
    return Utils.compare(a?.getTime(), b?.getTime());
  }

  static join(dst: string[], separator: string, convert?: (text: string) => string) {
    if (convert != null) {
      const cvt = [];
      for (const text of dst) {
        cvt.push(convert(text));
      }
      dst = cvt;
    }
    return dst.join(separator);
  }

  static decimalPlaces(value: number): number {
    let v = `${value}`;
    while (v.endsWith('0')) {
      v = v.substring(0, v.length - 1);
    }
    const ret = Math.max(v.length - v.lastIndexOf('.') - 1, 0);
    return Math.min(ret, 3);
  }

  static isAfter(later: Date, earlier: Date): boolean {
    return later?.getTime() > earlier?.getTime();
  }

  static isBefore(earlier: Date, later: Date): boolean {
    return earlier?.getTime() < later?.getTime();
  }

  static dateAsNumber(date: Date): number {
    return date?.getFullYear() * 10000 + date?.getMonth() * 100 + date?.getDate();
  }

  static timeAsNumber(date: Date): number {
    return date?.getFullYear() * 10000000000
      + date?.getMonth() * 100000000
      + date?.getDate() * 1000000
      + date?.getHours() * 10000
      + date?.getMinutes() * 100
      + date?.getSeconds();
  }

  static isSameDay(date1: Date, date2: Date) {
    return Utils.dateAsNumber(date1) === Utils.dateAsNumber(date2);
  }

  static isSameMoment(date1: Date, date2: Date) {
    return date1?.getTime() === date2?.getTime();
  }

  static isOnOrBefore(earlier: Date, later: Date) {
    return this.isBefore(earlier, later) || this.isSameDay(later, earlier);
  }

  static isOnOrAfter(later: Date, earlier: Date) {
    return this.isAfter(later, earlier) || this.isSameDay(later, earlier);
  }

  static differenceInDays(later: Date, earlier: Date): number {
    const ret = later?.getTime() - earlier?.getTime();
    return Math.floor(ret / 1000 / 60 / 60 / 24);
  }

  static differenceInSeconds(later: Date, earlier: Date): number {
    const ret = later?.getTime() - earlier?.getTime();
    return Math.floor(ret / 1000);
  }

  static differenceInMinutes(later: Date, earlier: Date): number {
    const ret = later?.getTime() - earlier?.getTime();
    return Math.floor(ret / 1000 / 60);
  }

  static differenceInHours(later: Date, earlier: Date): number {
    const ret = later?.getTime() - earlier?.getTime();
    return Math.floor(ret / 1000 / 60 / 60);
  }

  static differenceInMilliseconds(later: Date, earlier: Date): number {
    return later?.getTime() - earlier?.getTime();
  }

  static findLast<T>(list: T[], method: (e: T) => boolean) {
    const temp = list.filter(method);
    if (temp != null && temp.length > 0) {
      return Utils.last(temp);
    }
    return null;
  }

  static plural(value: number, options: any): string {
    return (options[value] ?? options.other).replace(/@count@/g, value);
  }

  static jsonize(data: any) {
    return JSON.parse(JSON.stringify(data));
  }

  static rnd(max: number): number {
    return Math.floor(Math.random() * max);
  }

  static encodeBase64(src: string, failRet: string = null): string {
    let ret;
    // btoa allein reicht an dieser Stelle nicht, weil dadurch Umlaute nicht korrekt
    // konvertiert werden.
    try {
      const encoder = new TextEncoder();
      const bytes = new Uint8Array(encoder.encode(src));
      ret = btoa(bytes.reduce((data, byte) => data + String.fromCharCode(byte), ''));
    } catch (ex) {
      Log.devError(ex, 'Fehler in Utils.encodeBase64');
      ret = failRet;
    }
    return ret;
  }

  static cvtMultilineText(text: string): string {
    if (text != null) {
      text = text.replace(/\n/g, 'µ') ?? '';
      text = text.replace(/µµ/g, '<br><br>');
      text = text.replace(/µ/g, ' ');
    }
    return text;
  }

  static decodeBase64(src: string, failRet: string = null): string {
    let ret;
    // atob alleine reicht an dieser Stelle nicht, weil dadurch Umlaute nicht korrekt
    // konvertiert werden.
    try {
      src = atob(src);
      const decoder = new TextDecoder();
      const buf = new ArrayBuffer(src.length);
      const bufView = new Uint8Array(buf);
      for (let i = 0; i < src.length; i++) {
        bufView[i] = src.charCodeAt(i);
      }
      ret = decoder.decode(bufView);
    } catch (ex) {
      Log.devError(ex, ['Fehler in Utils.decodeBase64', src]);
      ret = failRet;
    }
    return ret;
  }

  static parseNumber(value: string, def?: number) {
    let ret = Number(value);
    if (isNaN(ret)) {
      ret = def ?? 0;
    }
    return ret;
  }

  static pushArgs(src: any, dst: any) {
    if (src != null) {
      for (const key of Object.keys(src)) {
        if (src[key] != null) {
          dst[key] = src[key];
        }
      }
    }
  }

  static durationText(from: Date, to: Date): string {
    const duration = (to.getTime() - from.getTime()) / 1000;
    if (duration < 60) {
      return $localize`Gerade eben`;
    }
    const minutes = duration / 60;
    if (minutes < 60) {
      return Utils.plural(Math.floor(minutes), {
        1: $localize`${Math.floor(minutes)} Minute`,
        other: $localize`${Math.floor(minutes)} Minuten`
      });
    }
    let hours = minutes / 60;
    if (hours < 24) {
      return Utils.plural(Math.floor(hours), {
        1: $localize`${Math.floor(hours)} Stunde`,
        other: $localize`${Math.floor(hours)} Stunden`
      });
    }
    const days = hours / 24;
    hours = hours % 24;
    return Utils.join(
      [Utils.plural(Math.floor(days), {
        1: $localize`${Math.floor(days)} Tag`,
        other: $localize`${Math.floor(days)} Tage`
      }), Utils.plural(Math.floor(hours), {
        0: '',
        1: $localize` ${Math.floor(hours)} Stunde`,
        other: $localize` ${Math.floor(hours)} Stunden`
      })], ' ');
  }

  static async sha1(src: string) {
    const encoder = new TextEncoder();
    let bytes = encoder.encode(src);
    const digest = await window.crypto.subtle.digest('SHA-1', bytes);
    const decoded = String.fromCharCode(...new Uint8Array(digest));
    bytes = Uint8Array.from([...decoded].map(ch => ch.charCodeAt(0)));
    let ret = '';
    for (const byte of bytes) {
      let c = byte.toString(16);
      if (c.length < 2) {
        c = `0${c}`;
      }
      ret += c;
    }
    return ret;
  }

  static utcDateFromString(timestamp: string): Date {
    const utcDate = new Date(timestamp);
    utcDate.setTime(utcDate.getTime() - utcDate.getTimezoneOffset() * 60 * 1000);
    return utcDate;
  }

  static deviceEntries(entries: EntryData[], key: string): EntryData[] {
    if (key === 'all') {
      return entries ?? [];
    }
    return entries.filter(e => Utils.isValidDevice(e, key)) ?? [];
  }

  static containsDevice(list: string[], entry: EntryData) {
    return entry.type === 'mbg' || entry.device == null || list.indexOf(entry.device) >= 0;
  }

  static isValidDevice(entry: EntryData, deviceKey: string): boolean {
    return deviceKey === 'all' || entry.type === 'mbg' || entry.device == null || entry.device === deviceKey;
  }

  /**
   * method to give the ui time to show changes
   * usage: await Utils.refreshUI();
   * can only be run within async methods.
   */
  static async refreshUI() {
    await lastValueFrom(new Observable<any>(sub => {
      setTimeout(() => {
        sub.next();
        sub.complete();
        sub.unsubscribe();
      });
    }));
  }

  static wordify(text: string, maxchars: number): string[] {
    let handleLinks = false;
    if (text.startsWith('@<>@')) {
      handleLinks = true;
      text = text.substring(4);
    }
    const ret: string[] = [];
    text = Utils.cvtMultilineText(text);
    const wordSrc = text.split(' ');
    const wordDst: string[] = [];
    for (const word of wordSrc) {
      const lines = word.split('<br>');
      for (let idx = 0; idx < lines.length; idx++) {
        if (!Utils.isEmpty(lines[idx])) {
          wordDst.push(lines[idx]);
        }
        if (idx < lines.length - 1) {
          wordDst.push('<br>');
        }
      }
    }
    const words: string[] = [];
    if (handleLinks) {
      let link: string = null;
      for (let idx = 0; idx < wordDst.length; idx++) {
        if (wordDst[idx].startsWith('<a')) {
          link = wordDst[idx];
          wordDst[idx] = null;
        } else if (link != null) {
          const pos = wordDst[idx].indexOf('</a>');
          if (pos >= 0) {
            link += ' ' + wordDst[idx].substring(0, pos + 4);
            wordDst[idx] = wordDst[idx].substring(pos + 4);
            if (!wordDst[idx].startsWith(' ')) {
              link += wordDst[idx];
              wordDst[idx] = null;
            }
            words.push(link);
            link = null;
          } else {
            link += ' ' + wordDst[idx];
            wordDst[idx] = null;
          }
        }
        if (!Utils.isEmpty(wordDst[idx])) {
          words.push(wordDst[idx]);
        }
      }
    } else {
      words.push(...wordDst);
    }
    let line = '';
    let diff = '';
    let len = 0;
    for (const word of words) {
      if (word === '<br>') {
        ret.push(line);
        len = 0;
        line = ' ';
        diff = '';
      } else {
        let check = word.length;
        if (handleLinks && word.startsWith('<a')) {
          const pos1 = word.indexOf('>');
          let pos2 = word.lastIndexOf('<');
          check = pos2 - pos1;
          pos2 = word.lastIndexOf('>');
          check += word.length - pos2;
        }
        if (len + check > maxchars) {
          ret.push(line.trim());
          line = word;
          len = line.trim().length;
          diff = ' ';
        } else {
          line += diff + word;
          len += diff.length + word.length;
          diff = ' ';
        }
      }
    }
    ret.push(line.trim());
    console.log(text);
    return ret;
  }

  static limit(value: number, min: number, max: number): number {
    while (value < min) {
      value += (max - min);
    }
    while (value > max) {
      value -= (max - min);
    }
    return value;
  }
}
