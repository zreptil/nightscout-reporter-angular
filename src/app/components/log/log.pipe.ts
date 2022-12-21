import {Pipe, PipeTransform} from '@angular/core';
import {Utils} from '@/classes/utils';

@Pipe({
  standalone: true,
  name: 'log'
})
export class LogPipe implements PipeTransform {
  transform(value: unknown, ...args: unknown[]): unknown {
    if (typeof value === 'string') {
      return value;
    }
    if (value instanceof Date) {
      return Utils.fmtDate(value);
    } else if (value instanceof File) {
      return JSON.stringify({filename: value.name, size: value.size, type: value.type, lastmodified: value.lastModified});
    } else if (value instanceof SyntaxError) {
      return JSON.stringify({name: value.name, message: value.message, stack: value.stack});
    } else if ((value as any)._ != null) {
      return this.transform((value as any)._, args);
    }
    let ret = JSON.stringify(value);
    if (ret === '{}') {
      ret = `${typeof value}: ${ret}`;
      console.error('Log Objekt:', value);
    }
    return ret;
  }

}
