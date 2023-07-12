import {Component, Input} from '@angular/core';
import {DataService} from '@/_services/data.service';
import {ThemeService} from '@/_services/theme.service';
import {SessionService} from '@/_services/session.service';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {WatchElement} from '@/_model/watch-element';
import {Settings} from '@/_model/settings';
import {WatchService} from '@/_services/watch.service';

@Component({
  selector: 'app-watch-group',
  templateUrl: './watch-group.component.html',
  styleUrls: ['./watch-group.component.scss']
})
export class WatchGroupComponent {
  @Input()
  groupId: string;

  constructor(public ds: DataService,
              public ts: ThemeService,
              public ss: SessionService,
              public ws: WatchService) {
  }

  get globals(): GlobalsData {
    return GLOBALS;
  }

  get maxGluc(): number {
    return Math.max(
      Settings.stdHigh ?? 0,
      GLOBALS.targetTop ?? 0,
      GLOBALS.currentGlucValue ?? 0,
      (GLOBALS.lastGlucValue ?? 0) + 5
    );
  }

  get styleTargetLow(): any {
    return {width: `calc(100%*${GLOBALS.targetBottom}/${this.maxGluc})`};
  }

  get styleTargetNorm(): any {
    return {width: `calc(100%*${GLOBALS.targetTop - GLOBALS.targetBottom}/${this.maxGluc})`};
  }

  get styleTargetHigh(): any {
    return {width: `calc(100%*${this.maxGluc - GLOBALS.targetTop}/${this.maxGluc})`};
  }

  get styleCurrentGluc(): any {
    return {left: `calc(100%*${GLOBALS.currentGlucValue ?? 0}/${this.maxGluc})`};
  }

  get styleLastGluc(): any {
    return {left: `calc(100%*${GLOBALS.lastGlucValue ?? 0}/${this.maxGluc})`};
  }

  get styleArrowTip(): any {
    if ((GLOBALS.currentGlucValue ?? 0) === (GLOBALS.lastGlucValue ?? 0)) {
      return {display: 'none'};
    }
    const x = (GLOBALS.currentGlucValue ?? 0) / this.maxGluc;
    if ((GLOBALS.currentGlucValue ?? 0) < (GLOBALS.lastGlucValue ?? 0)) {
      return {transform: 'rotate(135deg)', left: `calc(100%*${x} + 2px)`};
    }
    return {transform: 'rotate(-45deg)', left: `calc(100%*${x} - 12px)`};
  }

  get styleArrowTrack(): any {
    const len = (GLOBALS.currentGlucValue ?? 0) - (GLOBALS.lastGlucValue ?? 0);
    if ((GLOBALS.currentGlucValue ?? 0) < (GLOBALS.lastGlucValue ?? 0)) {
      return {left: `calc(100%*${GLOBALS.currentGlucValue ?? 0}/${this.maxGluc})`, width: `calc(100%*${-len}/${this.maxGluc})`};
    }
    return {left: `calc(100%*${GLOBALS.lastGlucValue ?? 0}/${this.maxGluc})`, width: `calc(100%*${len}/${this.maxGluc})`};
  }

  get classForRoot(): string [] {
    const ret = ['groupRoot', this.groupId];
    if (this.groupId === 'center') {
      ret.push(...this.classForGroup);
    }
    return ret;
  }

  get classForGroup(): string[] {
    const ret = [];
    const prefix = GLOBALS.isWatchColor ? 'color-' : 'dark-';
    ret.push(`${prefix}${this.colForGluc(GLOBALS.currentGlucValue)}`);
    return ret;
  }

  colForGluc(gluc: number): string {
    if (gluc == null) {
      return 'unknown';
    }
    if (gluc < GLOBALS.targetBottom) {
      return 'low';
    } else if (gluc > GLOBALS.targetTop) {
      return 'high';
    }
    return 'norm';
  }

  onClick(element: WatchElement) {
    const value = !element.selected;
    for (const entry of GLOBALS.watchList) {
      entry.selected = false;
    }
    element.selected = value;
  }

  changeImage(entry: WatchElement): string {
    const id = entry.type?.substring(7);
    return `assets/img/${GLOBALS.currentChanges?.[id]?.type ?? 'empty'}.print.png`;
  }

  changeClass(entry: WatchElement): string[] {
    const id = entry.type.substring(7);
    return ['alarm', `alarm${GLOBALS.currentChanges?.[id]?.alarm}`];
  }

  changeInfo(entry: WatchElement): string {
    const id = entry.type.substring(7);
    return GLOBALS.currentChanges?.[id]?.lasttime;
  }

  showEntry(entry: WatchElement, type: string) {
    if (entry.type !== type) {
      return false;
    }
    if (this.ws.isEditMode) {
      return true;
    }
    switch (type) {
      case 'unit':
      case 'target':
      case 'arrow':
        return GLOBALS.currentGlucSrc != null;
    }
    return false;
  }
}
