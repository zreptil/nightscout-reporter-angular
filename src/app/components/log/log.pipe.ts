import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'log'
})
export class LogPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    if (typeof value === 'string') {
      return value;
    }
    if (value instanceof File) {
      return JSON.stringify({filename: value.name, size: value.size, type: value.type, lastmodified: value.lastModified});
    } else if (value instanceof SyntaxError) {
      return JSON.stringify({name: value.name, message: value.message, stack: value.stack});
    }
    let ret = JSON.stringify(value);
    if (ret === '{}') {
      ret = `${typeof value}: ${ret}`;
      console.error('Log Objekt:', value);
    }
    return ret;
  }

}
