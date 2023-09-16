import {Injectable} from '@angular/core';
import {Utils} from '@/classes/utils';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {WatchElement} from '@/_model/watch-element';

@Injectable({
  providedIn: 'root'
})
export class WatchService {

  constructor() {
  }

  get now(): Date {
    return GlobalsData.now;
  }

  get isEditMode(): boolean {
    return this.selected != null || (Utils.isEmpty(GLOBALS.watchList) ?? true);
  }

  get selected(): WatchElement {
    return GLOBALS.watchList?.find((e) => e.selected);
  }

  get selectedIndex(): number {
    return GLOBALS.watchList?.findIndex((e) => e.selected) ?? -1;
  }

  clearSelected(): void {
    GLOBALS.watchList.forEach(e => {
      e.selected = false;
    });
  }
}
