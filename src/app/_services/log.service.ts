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
  private static _timer: number;

  static get mayDebug(): boolean {
    return LogService.instance?.mayDebug ?? false;
  }

  static get showTodo(): boolean {
    return LogService.instance?.showTodo ?? false;
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
        todo: [],
        collect: []
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
      text.reverse().forEach((line, idx) => {
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
      list.splice(0, 0, {
        time: Utils.nowTime(),
        line: line
      });
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

  static collect(id: string, obj: any): void {
    LogService.instance.msg['collect'].push({id: id, data: obj});
  }

  static devError(ex: any, ...text: any[]) {
    if (Log.showTodo) {
      Log.error(...text);
    }
    if (GLOBALS.isDebug) {
      console.error(ex, text);
    }
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

  static startTimer(msg = 'timer started'): void {
    Log._timer = new Date().getTime();
    Log.debug(`icons[hourglass_top]${msg}`);
  }

  static showTimer(msg = 'timer', icon = 'hourglass_empty'): void {
    const time = new Date().getTime();
    const t = time - (Log._timer ?? 0);
    let h = Math.floor(t / 60000 / 60);
    let m = Math.floor((t - h * 60 * 60000) / 60000);
    let s = Math.floor((t - h * 60 * 60000 - m * 60000) / 1000);
    const text = h > 0
      ? `${h} Stunden ${m} Minuten ${s} Sekunden`
      : m > 0
        ? `${m} Minuten ${s} Sekunden`
        : `${s} Sekunden`;
    Log.debug(`icons[${icon}]${msg}`, text);
  }

  static stopTimer(msg = 'timer stopped'): void {
    this.showTimer(msg, 'hourglass_bottom');
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
