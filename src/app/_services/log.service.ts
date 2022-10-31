import {ChangeDetectorRef, Injectable} from '@angular/core';

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

  static addText(id: string, text: any): void {
    if (LogService.instance.msg[id].indexOf(text) < 0) {
      LogService.instance.msg[id]?.push(text);
      LogService.refreshUI();
    }
  }

  static info(text: any): void {
    Log.addText('info', text);
  }

  static warn(text: any): void {
    Log.addText('warn', text);
  }

  static debug(text: any): void {
    Log.addText('debug', text);
  }

  static error(text: any): void {
    Log.addText('error', text);
  }

  static devError(ex: any, text: any) {
    if (Log.showTodo) {
      Log.error(text);
    }
    console.error(ex);
  }

  static todo(text: any) {
    Log.addText('todo', text);
  }

  static displayLink(title: string, url: string, params?: { clear?: boolean, type?: string, btnClass?: string, icon?: string, data?: any }): void {
    params ??= {};
    params.clear ??= false;
    params.btnClass ??= '';
    if (!this.mayDebug && params.type === 'debug') {
      return;
    }

    if (params.clear) {
      LogService.instance.links = [];
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
  msg: { [key: string]: string[] };

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
