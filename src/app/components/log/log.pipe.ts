import {Pipe, PipeTransform} from '@angular/core';
import {Utils} from '@/classes/utils';

@Pipe({
  standalone: true,
  name: 'log'
})
export class LogPipe implements PipeTransform {
  format(time: string, line: string): string {
    return time != null ? `${time} ${line}` : line;
  }

  transform(src: unknown, ...args: unknown[]): unknown {
    const time = (src as any).time;
    let value = (src as any).line;
    if (typeof value === 'string') {
      if (value?.startsWith('icons[')) {
        const parts = value.split(']');
        value = parts[1];
      }
      return this.format(time, value);
    }
    if (value instanceof Date) {
      return Utils.fmtDate(value);
    } else if (value instanceof File) {
      return this.format(time, JSON.stringify({filename: value.name, size: value.size, type: value.type, lastmodified: value.lastModified}));
    } else if (value instanceof SyntaxError) {
      return this.format(time, JSON.stringify({name: value.name, message: value.message, stack: value.stack}));
    } else if ((value as any)._ != null) {
      return this.transform({line: (value as any)._}, args);
    }
    let ret = JSON.stringify(value);
    if (ret === '{}') {
      ret = this.format(time, `${typeof value}: ${ret}`);
      console.error('Log Objekt:', value);
    }
    return ret;
  }

}
