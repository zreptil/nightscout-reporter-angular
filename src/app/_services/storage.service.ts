import {Injectable} from '@angular/core';
import {BaseData} from '@/_model/base-data';
import {LogService} from '@/_services/log.service';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor() {
    LogService.create(localStorage.getItem('debug') === 'true');
  }

  read(key: string): any {
    return localStorage.getItem(key);
  }

  write(key: string, data: BaseData): void {
    localStorage.setItem(key, data.asString);
  }
}
