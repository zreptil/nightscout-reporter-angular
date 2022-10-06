export class Utils {
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
    if (date == null) {

    }
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
}
