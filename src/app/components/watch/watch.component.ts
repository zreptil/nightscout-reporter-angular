import {Component, OnInit} from '@angular/core';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {Settings} from '@/_model/settings';
import {WatchElement} from '@/_model/watch-element';
import {Utils} from '@/classes/utils';
import {DataService} from '@/_services/data.service';
import {ThemeService} from '@/_services/theme.service';
import {SessionService} from '@/_services/session.service';
import {WatchService} from '@/_services/watch.service';

@Component({
  selector: 'app-watch',
  templateUrl: './watch.component.html',
  styleUrls: ['./watch.component.scss']
})
export class WatchComponent implements OnInit {
  currPage = '';

  constructor(public ds: DataService,
              public ts: ThemeService,
              public ss: SessionService,
              public ws: WatchService) {
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

  get msgChangeSensor(): string {
    return $localize`Sensor-Wechsel`;
  }

  get msgChangeKatheter(): string {
    return $localize`Katheter-Wechsel`;
  }

  get msgChangeAmpulle(): string {
    return $localize`Ampullen-Wechsel`;
  }

  get msgChangeBattery(): string {
    return $localize`Batterie-Wechsel`;
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
      space: this.msgSPACE,
      change_sensor: this.msgChangeSensor,
      change_katheter: this.msgChangeKatheter,
      change_ampulle: this.msgChangeAmpulle,
      change_battery: this.msgChangeBattery
    };
  }

  get temp(): number {
    return Settings.adjustFactor;
  }

  get _verticalIcon(): string[] {
    return ['vertical_align_top', 'vertical_align_center', 'vertical_align_bottom'];
  }

  get verticalIcon(): string {
    return this._verticalIcon[this.ws.selected?.vertical ?? 1];
  }

  get msgTitle(): string {
    return $localize`:title for nightscout reporter watch window|:Night-Watch`;
  }

  get smallerDisabled(): boolean {
    let ret = this.ws.selected == null;
    if (this.ws.selected != null) {
      ret ||= this.ws.selected.size <= 1;
    }
    return ret;
  }

  get biggerDisabled(): boolean {
    let ret = this.ws.selected == null;
    if (this.ws.selected != null) {
      ret ||= this.ws.selected.size >= WatchElement.maxSize;
    }
    return ret;
  }

  get leftDisabled(): boolean {
    let ret = this.ws.selected == null;
    if (this.ws.selected != null) {
      ret ||= this.ws.selectedIndex === 0;
    }
    return ret;
  }

  get rightDisabled(): boolean {
    let ret = this.ws.selected == null;
    if (this.ws.selected != null) {
      ret ||= this.ws.selectedIndex >= GLOBALS.watchList.length - 1;
    }
    return ret;
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
    this.ss.showSettings.bind(this.ss)(this.showSettings);
  }

  clickSmaller(evt: MouseEvent) {
    evt.stopPropagation();
    if (!this.smallerDisabled) {
      this.ws.selected.size--;
    }
  }

  clickBigger(evt: MouseEvent) {
    evt.stopPropagation();
    if (!this.biggerDisabled) {
      this.ws.selected.size++;
    }
  }

  clickBold(evt: MouseEvent) {
    evt.stopPropagation();
    if (this.ws.selected != null) {
      this.ws.selected.bold = !this.ws.selected.bold;
    }
  }

  clickItalic(evt: MouseEvent) {
    evt.stopPropagation();
    if (this.ws.selected != null) {
      this.ws.selected.italic = !this.ws.selected.italic;
    }
  }

  clickLeft(evt: MouseEvent) {
    evt.stopPropagation();
    if (!this.leftDisabled) {
      const idx = this.ws.selectedIndex;
      const elem = this.ws.selected;
      GLOBALS.watchList.splice(idx, 1);
      GLOBALS.watchList.splice(idx - 1, 0, elem);
    }
  }

  clickAdd(evt: MouseEvent) {
    evt.stopPropagation();
    let idx = this.ws.selectedIndex;
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
    if (this.ws.selected != null) {
      let useKey = true;
      const check = this.ws.selected.type;
      this.ws.selected.type = null;
      for (const key of Object.keys(this.types)) {
        if (key === check) {
          useKey = false;
        }
        if (useKey) {
          this.ws.selected.type = key;
        }
      }
      this.ws.selected.type ??= Object.keys(this.types)[Object.keys(this.types).length - 1];
    }
  }

  clickTypeAdd(evt: MouseEvent) {
    evt.stopPropagation();
    if (this.ws.selected != null) {
      let useKey = false;
      for (const key of Object.keys(this.types)) {
        if (useKey) {
          this.ws.selected.type = key;
          useKey = false;
        } else if (key === this.ws.selected.type) {
          useKey = true;
        }
      }
      if (useKey) {
        this.ws.selected.type = Object.keys(this.types)[0];
      }
    }
  }

  clickRight(evt: MouseEvent) {
    evt.stopPropagation();
    if (!this.rightDisabled) {
      const idx = this.ws.selectedIndex;
      const elem = this.ws.selected;
      GLOBALS.watchList.splice(idx, 1);
      GLOBALS.watchList.splice(idx + 1, 0, elem);
    }
  }

  clickVertical(evt: MouseEvent) {
    evt.stopPropagation();
    if (this.ws.selected != null) {
      let value = this.ws.selected.vertical;
      value++;
      if (value > 2) {
        value = 0;
      }
      this.ws.selected.vertical = value;
    }
  }

  clickDelete(evt: MouseEvent) {
    evt.stopPropagation();
    let idx = this.ws.selectedIndex;
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

  clickBackground() {
    if (!this.ws.isEditMode) {
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

  clickWatchSettings(evt: MouseEvent) {
    evt.stopPropagation();
    this.ss.showPopup('watchsettings');
    // GLOBALS.isWatchColor = !GLOBALS.isWatchColor;
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
  clickGroup(evt: MouseEvent) {
    evt.stopPropagation();
    const ids: any = {
      center: 'tl',
      tl: 'tr',
      tr: 'bl',
      bl: 'br',
      br: 'center'
    };
    this.ws.selected.groupId = ids[this.ws.selected.groupId] ?? 'tl';
  }
}
