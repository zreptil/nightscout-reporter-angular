import {Component, OnInit} from '@angular/core';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {Settings} from '@/_model/settings';
import {WatchElement} from '@/_model/watch-element';
import {Utils} from '@/classes/utils';
import {DataService} from '@/_services/data.service';
import {ThemeService} from '@/_services/theme.service';
import {SessionService} from '@/_services/session.service';

@Component({
  selector: 'app-watch',
  templateUrl: './watch.component.html',
  styleUrls: ['./watch.component.scss']
})
export class WatchComponent implements OnInit {
  currPage = '';

  constructor(public ds: DataService,
              public ts: ThemeService,
              public ss: SessionService) {
  }

  get globals(): GlobalsData {
    return GLOBALS;
  }

  get msgNL(): string {
    return $localize`Umbruch`;
  }

  get msgGLUC(): string {
    return $localize`Glukose`;
  }

  get msgFACTOR(): string {
    return $localize`Faktor`;
  }

  get msgGLUCORG(): string {
    return $localize`Glukose (aus NS)`;
  }

  get msgTIME(): string {
    return $localize`Uhrzeit`;
  }

  get msgLASTTIME(): string {
    return $localize`Zeit`;
  }

  get msgARROW(): string {
    return $localize`Trendpfeil`;
  }

  get msgUSER(): string {
    return $localize`Benutzer`;
  }

  get msgDate(): string {
    return $localize`Datum`;
  }

  get msgUNIT(): string {
    return $localize`Einheit`;
  }

  get msgSPACE(): string {
    return $localize`Leer`;
  }

  get msgTARGET(): string {
    return $localize`Skala`;
  }

  get types(): any {
    return {
      nl: this.msgNL,
      gluc: this.msgGLUC,
      unit: this.msgUNIT,
      time: this.msgTIME,
      date: this.msgDate,
      lasttime: this.msgLASTTIME,
      arrow: this.msgARROW,
      user: this.msgUSER,
      target: this.msgTARGET,
      factor: this.msgFACTOR,
      glucorg: this.msgGLUCORG,
      space: this.msgSPACE
    };
  }

  get temp(): number {
    return Settings.adjustFactor;
  }

  get _verticalIcon(): string[] {
    return ['vertical_align_top', 'vertical_align_center', 'vertical_align_bottom'];
  }

  get verticalIcon(): string {
    return this._verticalIcon[this.selected?.vertical ?? 1];
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
    if ((GLOBALS.currentGlucValue ?? 0) == (GLOBALS.lastGlucValue ?? 0)) {
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

  get classForWatch(): string {
    const ret = ['root'];
    let prefix = 'dark-';
    if (GLOBALS.isWatchColor) {
      prefix = 'color-';
    }
    ret.push(`${prefix}${this.colForGluc(GLOBALS.currentGlucValue)}`);
    return ret.join(' ');
  }

  get msgTitle(): string {
    return $localize`:title for nightscout reporter watch window|:Night-Watch`;
  }

  get smallerDisabled(): boolean {
    let ret = this.selected == null;
    if (this.selected != null) {
      ret ||= this.selected.size <= 1;
    }
    return ret;
  }

  get biggerDisabled(): boolean {
    let ret = this.selected == null;
    if (this.selected != null) {
      ret ||= this.selected.size >= WatchElement.maxSize;
    }
    return ret;
  }

  get leftDisabled(): boolean {
    let ret = this.selected == null;
    if (this.selected != null) {
      ret ||= this.selectedIndex == 0;
    }
    return ret;
  }

  get rightDisabled(): boolean {
    let ret = this.selected == null;
    if (this.selected != null) {
      ret ||= this.selectedIndex >= GLOBALS.watchList.length - 1;
    }
    return ret;
  }

  get now(): Date {
    return GlobalsData.now;
  }

  async ngOnInit() {
    document.querySelector('head>title').innerHTML = this.msgTitle;
    document
      .querySelector('head>link[rel=manifest]')
      .setAttribute('href', 'assets/manifest.watch.json');
    this.ds.loadWebData();
    await this.ts.setTheme(GLOBALS.theme);
    await this.ds.loadSettingsJson().then((_) => {
      if (GLOBALS.isConfigured) {
        this.ds.getCurrentGluc({force: true, timeout: 30});
      } else {
        this.showSettings();
      }
    });
  }

  clickSettings(evt: MouseEvent) {
    evt.stopPropagation();
    this.showSettings();
  }

  async showSettings() {
    this.ss.showPopup('settings').subscribe(_ => {
      // noinspection BadExpressionStatementJS
      if (!GLOBALS.isConfigured) {
        this.showSettings();
      }
    });
  }

  colForGluc(gluc: number): string {
    if (gluc == null) {
      return 'norm';
    }
    if (gluc < GLOBALS.targetBottom) {
      return 'low';
    } else if (gluc > GLOBALS.targetTop) {
      return 'high';
    }
    return 'norm';
  }

  clickSmaller(evt: MouseEvent) {
    evt.stopPropagation();
    if (!this.smallerDisabled) {
      this.selected.size--;
    }
  }

  clickBigger(evt: MouseEvent) {
    evt.stopPropagation();
    if (!this.biggerDisabled) {
      this.selected.size++;
    }
  }

  clickBold(evt: MouseEvent) {
    evt.stopPropagation();
    if (this.selected != null) {
      this.selected.bold = !this.selected.bold;
    }
  }

  clickItalic(evt: MouseEvent) {
    evt.stopPropagation();
    if (this.selected != null) {
      this.selected.italic = !this.selected.italic;
    }
  }

  clickLeft(evt: MouseEvent) {
    evt.stopPropagation();
    if (!this.leftDisabled) {
      const idx = this.selectedIndex;
      const elem = this.selected;
      GLOBALS.watchList.splice(idx, 1);
      GLOBALS.watchList.splice(idx - 1, 0, elem);
    }
  }

  clickAdd(evt: MouseEvent) {
    evt.stopPropagation();
    let idx = this.selectedIndex;
    if (idx < 0) {
      idx = GLOBALS.watchList.length - 1;
    } else {
      idx++;
    }
    for (const entry of GLOBALS.watchList) {
      entry.selected = false;
    }
    const elem = WatchElement.fromJson({type: 'space', selected: true});
    GLOBALS.watchList.splice(idx, 0, elem);
  }

  clickTypeSub(evt: MouseEvent) {
    evt.stopPropagation();
    if (this.selected != null) {
      let useKey = true;
      const check = this.selected.type;
      this.selected.type = null;
      for (const key of Object.keys(this.types)) {
        if (key === check) {
          useKey = false;
        }
        if (useKey) {
          this.selected.type = key;
        }
      }
      this.selected.type ??= Object.keys(this.types)[Object.keys(this.types).length - 1];
    }
  }

  clickTypeAdd(evt: MouseEvent) {
    evt.stopPropagation();
    if (this.selected != null) {
      let useKey = false;
      for (const key of Object.keys(this.types)) {
        if (useKey) {
          this.selected.type = key;
          useKey = false;
        } else if (key == this.selected.type) {
          useKey = true;
        }
      }
      if (useKey) {
        this.selected.type = Object.keys(this.types)[0];
      }
    }
  }

  clickRight(evt: MouseEvent) {
    evt.stopPropagation();
    if (!this.rightDisabled) {
      const idx = this.selectedIndex;
      const elem = this.selected;
      GLOBALS.watchList.splice(idx, 1);
      GLOBALS.watchList.splice(idx + 1, 0, elem);
    }
  }

  clickVertical(evt: MouseEvent) {
    evt.stopPropagation();
    if (this.selected != null) {
      let value = this.selected.vertical;
      value++;
      if (value > 2) {
        value = 0;
      }
      this.selected.vertical = value;
    }
  }

  clickDelete(evt: MouseEvent) {
    evt.stopPropagation();
    let idx = this.selectedIndex;
    if (idx >= 0) {
      GLOBALS.watchList.splice(idx, 1);
    }
    if (idx >= GLOBALS.watchList.length) {
      idx = GLOBALS.watchList.length - 1;
    }
    if (idx < GLOBALS.watchList.length) {
      GLOBALS.watchList[idx].selected = true;
    }
  }

  onClick(element: WatchElement) {
    const value = !element.selected;
    for (const entry of GLOBALS.watchList) {
      entry.selected = false;
    }
    element.selected = value;
  }

  clickBackground() {
    if (!this.isEditMode) {
      if (Utils.isEmpty(GLOBALS.watchList)) {
        GLOBALS.watchList.push(WatchElement.fromJson({type: 'gluc', selected: true}));
      }
      GLOBALS.watchList[0].selected = true;
    }
  }

  clickSave(evt: MouseEvent) {
    evt.stopPropagation();
    for (const entry of GLOBALS.watchList) {
      entry.selected = false;
    }
    this.ds.save({skipReload: true});
  }

  clickColor(evt: MouseEvent) {
    evt.stopPropagation();
    GLOBALS.isWatchColor = !GLOBALS.isWatchColor;
    this.ds.save({skipReload: true});
  }

  // settingsResult(evt: any) {
  //   switch (evt.type) {
  //     case 'ok':
  //       GLOBALS.save(skipReload: true);
  //       if (!g.isConfigured) {
  //         GLOBALS.clearStorage();
  //       } else {
  //         GLOBALS.loadSettings().then((_) {
  //           GLOBALS.getCurrentGluc(force: true, timeout: 30);
  //           currPage = 'watch';
  //         });
  //       }
  //       break;
  //     default:
  //       GLOBALS.loadSettings(skipSyncGoogle: true);
  //       if (g.isConfigured) currPage = 'watch';
  //       break;
  //   }
  // }
}
