import {ChangeDetectorRef, Injectable} from '@angular/core';

export class Log {
  static get mayDebug(): boolean {
    return LogService.instance.mayDebug;
  }

  static get msg(): { [key: string]: any[] } {
    return LogService.instance.msg;
  }

  static clear(type: string): void {
    LogService.instance.msg[type] = [];
    LogService.refreshUI();
  }

  static info(text: any): void {
    LogService.instance.msg['info']?.push(text);
    LogService.refreshUI();
  }

  static debug(text: any): void {
    LogService.instance.msg['debug']?.push(text);
    LogService.refreshUI();
  }

  static error(text: any): void {
    LogService.instance.msg['error']?.push(text);
    LogService.refreshUI();
  }
}

@Injectable({
  providedIn: 'root'
})
export class LogService {
  public static instance: LogService;
  public static cr: ChangeDetectorRef;
  msg: { [key: string]: string[] } = {
    info: [],
    debug: [],
    error: []
  };

  constructor(public mayDebug: boolean) {
  }

  public static refreshUI(): void {
    LogService.cr?.detectChanges();
  }

  static create(mayDebug: boolean): void {
    LogService.instance = new LogService(mayDebug);
  }
}
