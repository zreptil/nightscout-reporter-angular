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
    LogService.create(localStorage.getItem('debug') === 'true',
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
      if (ret == 'null' || ret == null) {
        ret = '';
      }
      if (asJson) {
        ret = JSON.parse(ret);
      }
    } catch (ex) {
      Log.devError(ex, `Fehler bei StorageService.read(${key}) => ${ret}`);
    }
    return ret;
  }

  write(key: string, data: any): void {
    const value = JSON.stringify(data);
    if (GLOBALS.isBeta) {
      key = `${Settings.betaPrefix}${key}`;
    }
    if (Utils.isEmpty(value)) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  }
}
