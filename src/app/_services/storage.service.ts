import {Injectable} from '@angular/core';
import {Log, LogService} from '@/_services/log.service';
import {Settings} from '@/_model/settings';
import {GLOBALS} from '@/_model/globals-data';
import {Utils} from '@/classes/utils';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor() {
    LogService.create(localStorage.getItem(Settings.DebugFlag) === Settings.DebugActive,
      localStorage.getItem('iamdev') === 'true',
      true);
  }

  read(key: string, asJson = true): any {
    let ret = null;
    try {
      if (GLOBALS.isBeta) {
        key = `${Settings.betaPrefix}${key}`;
      }
      ret = localStorage.getItem(key);
      if (ret === 'null' || ret == null) {
        ret = asJson ? '{}' : '';
      }
      if (asJson) {
        ret = JSON.parse(ret);
      }
    } catch (ex) {
      Log.devError(ex, `Fehler bei StorageService.read(${key}) => ${ret}`);
    }
    return ret;
  }

  write(key: string, data: any, cvt = true): void {
    let value = data;
    if (cvt) {
      value = JSON.stringify(data);
      if (value.startsWith('"')) {
        value = value.substring(1);
      }
      if (value.endsWith('"')) {
        value = value.substring(0, value.length - 1);
      }
    }
    if (GLOBALS.isBeta) {
      key = `${Settings.betaPrefix}${key}`;
    }
    if (Utils.isEmpty(value)) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  }

  clearStorage(): void {
    if (Settings.skipStorageClear) {
      return;
    }
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      let doKill = false;
      doKill = key.startsWith(Settings.betaPrefix);
      if (!GLOBALS.isBeta) {
        doKill = !doKill;
      }
      if (key.endsWith(Settings.WebData) || key.endsWith(Settings.DebugFlag)) {
        doKill = false;
      }
      if (key.startsWith('thumbs')) {
        doKill = false;
      }
      if (doKill) {
        window.localStorage.removeItem(key);
      }
    }
  }

  writeCrypt(key: string, src: string) {
    const dst = Settings.doit(src);
    this.write(key, dst, dst !== src);
  }
}
