import {Component, Input} from '@angular/core';
import {DataService} from '@/_services/data.service';
import {ThemeService} from '@/_services/theme.service';
import {SessionService} from '@/_services/session.service';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {WatchElement} from '@/_model/watch-element';
import {Settings} from '@/_model/settings';
import {WatchService} from '@/_services/watch.service';
import {LibreLinkUpService} from '@/_services/libre-link-up.service';

@Component({
  selector: 'app-watch-group',
  templateUrl: './watch-group.component.html',
  styleUrls: ['./watch-group.component.scss'],
  standalone: false
})
export class WatchGroupComponent {
  @Input()
  groupId: string;

  constructor(public ds: DataService,
              public ts: ThemeService,
              public ss: SessionService,
              public ws: WatchService,
              public lls: LibreLinkUpService) {
  }

  get classForLLU(): string[] {
    const ret: string[] = ['libre_linkup'];
    if (this.lls.isRunning) {
      ret.push('running');
    }
    return ret;
  }

  get globals(): GlobalsData {
    return GLOBALS;
  }

  get maxGluc(): number {
    return Math.max(
      GLOBALS.glucValueFromData(Settings.stdHigh ?? 0),
      GLOBALS.glucValueFromData(GLOBALS.targetTop ?? 0),
      this.currentGluc,
      this.lastGluc + GLOBALS.glucValueFromData(5)
    );
  }

  get styleTargetLow(): any {
    return {width: `calc(100%*${GLOBALS.glucValueFromData(GLOBALS.targetBottom)}/${this.maxGluc})`};
  }

  get styleTargetNorm(): any {
    return {width: `calc(100%*${GLOBALS.glucValueFromData(GLOBALS.targetTop - GLOBALS.targetBottom)}/${this.maxGluc})`};
  }

  get styleTargetHigh(): any {
    return {width: `calc(100%*${this.maxGluc - GLOBALS.glucValueFromData(GLOBALS.targetTop)}/${this.maxGluc})`};
  }

  get styleCurrentGluc(): any {
    return {left: `calc(100%*${this.currentGluc}/${this.maxGluc})`};
  }

  get styleLastGluc(): any {
    return {left: `calc(100%*${this.lastGluc}/${this.maxGluc})`};
  }

  get styleArrowTip(): any {
    if (this.currentGluc === this.lastGluc) {
      return {display: 'none'};
    }
    const x = this.currentGluc / this.maxGluc;
    if (this.currentGluc < this.lastGluc) {
      return {transform: 'rotate(135deg)', left: `calc(100%*${x} + 2px)`};
    }
    return {transform: 'rotate(-45deg)', left: `calc(100%*${x} - 12px)`};
  }

  get styleArrowTrack(): any {
    const len = this.currentGluc - this.lastGluc;
    if (this.currentGluc < this.lastGluc) {
      return {left: `calc(100%*${this.currentGluc}/${this.maxGluc})`, width: `calc(100%*${-len}/${this.maxGluc})`};
    }
    return {left: `calc(100%*${this.lastGluc}/${this.maxGluc})`, width: `calc(100%*${len}/${this.maxGluc})`};
  }

  get classForRoot(): string [] {
    const ret = ['groupRoot', this.groupId];
    if (this.groupId === 'center') {
      ret.push(...this.classForGroup);
    }
    return ret;
  }

  get currentGluc(): number {
    return GLOBALS.currentGlucValue ?? 0;
  }

  get lastGluc(): number {
    return GLOBALS.lastGlucValue ?? 0;
  }

  get classForGroup(): string[] {
    const ret = [];
    const prefix = GLOBALS.isWatchColor ? 'color-' : 'dark-';
    ret.push(`${prefix}${this.colForGluc(this.currentGluc)}`);
    return ret;
  }

  colForGluc(gluc: number): string {
    if (gluc == null || !GLOBALS.currentGlucValid) {
      return 'unknown';
    }
    if (gluc < GLOBALS.glucValueFromData(GLOBALS.targetBottom)) {
      return 'low';
    } else if (gluc > GLOBALS.glucValueFromData(GLOBALS.targetTop)) {
      return 'high';
    }
    return 'norm';
  }

  configureLLU(): void {
    GLOBALS.nwCurrPage = 'users';
    this.ss.showSettings();
  }

  onClick(element: WatchElement) {
    const value = !element.selected;
    if (element.type === 'llu_schedule' && !this.ws.isEditMode) {
      if (GLOBALS.isLLUPossible) {
        this.lls.isRunning = !this.lls.isRunning;
      } else {
        this.configureLLU();
      }
      return;
    }
    if (element.type === 'llu_autoexec' && !this.ws.isEditMode) {
      if (GLOBALS.isLLUPossible) {
        GLOBALS.lluAutoExec = !GLOBALS.lluAutoExec;
        this.ds.saveDeviceData();
      } else {
        this.configureLLU();
      }
      return;
    }
    this.lls.isRunning = false;
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
        return GLOBALS.currentGlucSrc != null;
      case 'arrow':
        return GLOBALS.currentGlucValid;
    }
    return false;
  }
}
