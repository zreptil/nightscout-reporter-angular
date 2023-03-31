import {ChangeDetectorRef, Injectable} from '@angular/core';
import {GLOBALS} from '@/_model/globals-data';
import {Utils} from '@/classes/utils';

export class LinkDef {
  constructor(public url: string,
              public title: string,
              public btnClass: string,
              public icon: string,
              public data: any) {
  }
}

export class Log {
  static get mayDebug(): boolean {
    return LogService.instance.mayDebug;
  }

  static get showTodo(): boolean {
    return LogService.instance.showTodo;
  }

  static get msg(): { [key: string]: any[] } {
    return LogService.instance.msg;
  }

  static get links(): LinkDef[] {
    return LogService.instance.links;
  }

  static clear(type?: string): void {
    if (type == null) {
      LogService.instance.msg = {
        info: [],
        warn: [],
        debug: [],
        error: [],
        todo: []
      };
      LogService.instance.links = [];
    } else if (type === 'links') {
      LogService.instance.links = [];
    } else {
      LogService.instance.msg[type] = [];
    }
    LogService.refreshUI();
  }

  static addText(id: string, ...text: any[]): void {
    if (text != null && text.length > 1) {
      text.forEach((line, idx) => {
        // entries that have the format {_: ...} are treated by log.component
        // so that it will remove the line between the current entry and
        // the next entry
        Log.addLine(id, idx < text.length - 1 ? {_: Log.cvtText(line)} : Log.cvtText(line));
      });
    } else {
      Log.addLine(id, Log.cvtText(text[0]));
    }
  }

  static cvtText(text: string): string {
    const time = new Date();
    if (typeof text === 'string') {
      text = text.replace(/{time}/g, Utils.fmtTime(time.getHours() * 3600 + time.getMinutes() * 60 + time.getSeconds()));
    }
    return text;
  }

  static isInList(check: any, list: any[]): boolean {
    check = JSON.stringify(check);
    // if (check._ != null)
    //   check = check._;
    for (const line of list) {
      if (check === JSON.stringify(line)) {
        return true;
      }
    }
    return false;
  }

  static addLine(id: string, line: any): void {
    const list = LogService.instance.msg[id];
    if (list != null && (id === 'debug' || !Log.isInList(line, list))) {
      list.splice(0, 0, line);
      // if not in debug mode, then limit the length of the log entries per list
      // to GLOBALS.maxLogEntries so that the app will not suffer from running
      // for a long time without cleaning the log (could be the case, when using
      // NightWatch as a permanent display)
      if (!GLOBALS.isDebug) {
        while (list.length > GLOBALS.maxLogEntries) {
          list.splice(0, 1);
        }
      }
      LogService.refreshUI();
    }
  }

  static info(...text: any[]): void {
    Log.addText('info', ...text);
  }

  static warn(...text: any[]): void {
    Log.addText('warn', ...text);
  }

  static debug(...text: any[]): void {
    if (GLOBALS.isDebug) {
      Log.addText('debug', ...text);
    }
  }

  static error(...text: any[]): void {
    Log.addText('error', ...text);
  }

  static devError(ex: any, ...text: any[]) {
    if (Log.showTodo) {
      Log.error(...text);
    }
    console.error(ex);
  }

  static todo(...text: any[]) {
    Log.addText('todo', ...text);
  }

  static displayLink(title: string, url: string, params?: { count?: number, clear?: boolean, type?: string, btnClass?: string, icon?: string, data?: any }): void {
    if (!GLOBALS.isDebug) {
      return;
    }
    params ??= {};
    params.count ??= -1;
    params.clear ??= false;
    params.btnClass ??= '';
    if (!this.mayDebug && params.type === 'debug') {
      return;
    }

    if (params.clear) {
      LogService.instance.links = [];
    }

    if (params.count === 0) {
      params.btnClass += ' count0';
    }

    Log.links.push(new LinkDef(url, title, params.btnClass, params.icon == null ? 'code' : params.icon, params.data));
    // if (params.type != null) this.msg.type = type;
  }
}

@Injectable({
  providedIn: 'root'
})
export class LogService {
  public static cr: ChangeDetectorRef;
  public static instance: LogService;
  msg: { [key: string]: any[] };

  links: LinkDef[] = [];

  private constructor(public mayDebug: boolean, public showTodo: boolean) {
  }

  public static refreshUI(): void {
    LogService.cr?.detectChanges();
  }

  static create(mayDebug: boolean, showTodo: boolean, wasWellConsidered = false): void {
    LogService.instance = new LogService(mayDebug, showTodo);
    Log.clear();
    if (!wasWellConsidered) {
      Log.error(`Die Erzeugung des Log-Services sollte nur einmal in der Anwendung erfolgen.
      Er wird zentral im StorageService erzeugt. Sollte sie an der neuen Stelle korrekt sein,
      dann bitte im StorageService deaktivieren und mit wasWellConsidered=true aufrufen.`);
      console.error('War es nötig, den LogService hier zu erzeugen?');
    }
  }
}
