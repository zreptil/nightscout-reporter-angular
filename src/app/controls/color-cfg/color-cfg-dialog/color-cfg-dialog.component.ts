import {AfterViewInit, Component, Inject} from '@angular/core';
import {ColorDialogData} from '@/controls/color-picker/color-picker.component';
import {Utils} from '@/classes/utils';
import {ColorUtils} from '@/controls/color-picker/color-utils';
import {ColorData} from '@/_model/color-data';
import {ThemeService} from '@/_services/theme.service';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MessageService} from '@/_services/message.service';
import {DialogParams, DialogResultButton} from '@/_model/dialog-data';
import {CloseButtonData} from '@/controls/close-button/close-button-data';
import {map, Observable, of} from 'rxjs';
import {Log} from '@/_services/log.service';
import {CdkDragEnd} from '@angular/cdk/drag-drop';
import {Point} from 'pdfmake/interfaces';

@Component({
  selector: 'app-color-cfg-dialog',
  templateUrl: './color-cfg-dialog.component.html',
  styleUrls: ['./color-cfg-dialog.component.scss']
})
export class ColorCfgDialogComponent implements AfterViewInit {
  value: string;
  valueFore: string;
  lastValue: string;
  orgTheme: any;
  availableColormodes = 'hsl,mixer';
  // mapping for several strings
  mapping: any = {
    owl: {title: $localize`Eule`},
    datepicker: {title: $localize`Datumsauswahl`},
    gluc: {title: $localize`Glukosewerte`},
    google: {title: $localize`Google`},
    info: {title: $localize`Info`},
    help: {title: $localize`Hilfe`},
    legal: {title: $localize`Gesetzliches`},
    whatsnew: {title: $localize`Was bisher geschah...`},
    shortcut: {title: $localize`Shortcut`},
    settings: {title: $localize`Einstellungen`},
    log: {title: $localize`Log`, debugOnly: true},
    local: {title: $localize`Lokal`, debugOnly: true},
    beta: {title: $localize`Beta`, debugOnly: true},
    debug: {title: $localize`Debug`, debugOnly: true},
    outputparams: {title: $localize`Ausgabe Parameter`},
    main: {title: $localize`Hauptseite`},
    user: {title: $localize`Benutzer`},
  }

  colorList: any = {};
  allColors: ColorData[] = [];
  dragPos: Point;

  constructor(private ts: ThemeService,
              private ms: MessageService,
              @Inject(MAT_DIALOG_DATA)
              public dlgData: { colorKey: string },
              public dlgRef: MatDialogRef<ColorCfgDialogComponent>
  ) {
  }

  get dialogTitle(): string {
    const ret = this.mapEntry(this.dlgData?.colorKey, true)?.title;
    return ret == null ? $localize`Farbanpassungen` : $localize`Farben für ` + ret;
  }

  _listThemeKeys: string[];

  closeData: CloseButtonData = {
    closeAction: (): Observable<boolean> => {
      let hasChanges = false;
      for (const key of Object.keys(this.orgTheme)) {
        const c1 = ColorData.fromString(this.ts.currTheme[key]);
        const c2 = ColorData.fromString(this.orgTheme[key]);
        if (c1.display !== c2.display) {
          hasChanges = true;
        }
      }
      if (!hasChanges) {
        return of(true);
      }
      return this.ms.confirm($localize`Sollen die Farbänderungen verworfen werden?`,
        new DialogParams({noClose: true}))
        .pipe(map(
          result => {
            switch (result?.btn) {
              case DialogResultButton.yes:
                for (const key of Object.keys(this.orgTheme)) {
                  this.ts.currTheme[key] = this.orgTheme[key];
                }
                this.ts.assignStyle(document.body.style, this.ts.currTheme);
                this._listThemeKeys = null;
                return true;
              default:
                return false;
            }
          }
        ));
    }
  }

  get listThemeKeys(): string[] {
    if (this._listThemeKeys != null) {
      return this._listThemeKeys;
    }
    const ret: string[] = [];
    const skip = ['panelBack', 'panelFore', 'bufferColor'];
    const additionalKeys: any = {
      outputparams: ['settingsLoopMarked', 'datepickerBtnEmpty'],
      main: ['userPinFore', 'local', 'beta', 'log'],
      settings: ['userPinFore']
    };
    // if a color-button needs a special class, it is defined here
    const classes: any = {
      logDebug: 'is-debug'
    }
    const src = {...this.ts.currTheme};
    let keyList = Object.keys(src).sort();
    this.colorList = {};
    this.allColors = [];
    if (!Utils.isEmpty(this.dlgData.colorKey)) {
      keyList = keyList.filter(k => {
        if (k.startsWith(this.dlgData.colorKey)) {
          return true;
        }
        for (const check of additionalKeys[this.dlgData.colorKey] ?? []) {
          if (k.startsWith(check)) {
            return true;
          }
        }
        return false;
      });
    }
    const specialKeys: any = {
      Fore: {icon: ThemeService.icons.fore, title: $localize`Text`},
      Data: {icon: ThemeService.icons.data, title: $localize`Daten`},
      Link: {icon: ThemeService.icons.link, title: $localize`Link`}
    };
    const specialGroups: any = {
      Back: {keys: specialKeys, title: $localize`Hintergrund`},
      RGB: {keys: specialKeys, title: $localize`Hintergrund`},
      Frame: {keys: specialKeys, title: $localize`Rahmen`},
    };
    for (const key of keyList) {
      if (skip.indexOf(key) >= 0) {
        continue;
      }
      let add = true;
      let type: 'standard' | 'rgb' = 'standard';
      // noinspection JSMismatchedCollectionQueryUpdate
      let colorList: ColorData[] = [];
      for (const groupKey of Object.keys(specialGroups)) {
        if (key.endsWith(groupKey)) {
          const group = specialGroups[groupKey];
          const subKey = key.substring(0, key.length - groupKey.length);
          let hasSpec = false;
          for (const specKey of Object.keys(specialGroups[groupKey].keys)) {
            const fullKey = subKey + specKey;
            const idx = keyList.indexOf(fullKey);
            if (idx >= 0 && this.mayUseMapping(subKey)) {
              skip.push(fullKey);
              hasSpec = true;
              const spec = specialGroups[groupKey].keys[specKey];
              const color = ColorData.fromString(this.ts.currTheme[fullKey]);
              color.btnClass = classes[subKey];
              color.icon = spec.icon;
              color.isBackColor = false;
              color.themeKey = fullKey;
              color.title = this.nameForColor(subKey);
              color.subtitle = spec.title;
              colorList.push(color);
              this.allColors.push(color);
              // if the fullKey is already in the return list, then it has to
              // be removed. Happens, when the special key is alphabetically
              // lower than the group key
              const check = ret.findIndex(r => r === fullKey);
              if (check >= 0) {
                ret.splice(check, 1);
              }
            }
          }
          if (add && hasSpec) {
            add = false;
            const back = ColorData.fromString(this.ts.currTheme[key]);
            if (key.endsWith('RGB')) {
              back.type = 'rgb';
            }
            back.btnClass = classes[subKey];
            back.icon = ThemeService.icons.back;
            back.themeKey = key;
            back.title = this.nameForColor(subKey);
            back.subtitle = group.title;
            this.colorList[subKey] = {
              title: this.nameForColor(subKey),
              colors: [back]
            };
            this.colorList[subKey].colors.push(...colorList);
            this.allColors.push(back);
            ret.push(subKey);
          }
        }
      }

      if (add && this.mayUseMapping(key)) {
        if (key.endsWith('RGB')) {
          type = 'rgb';
        }
        const color = ColorData.fromString(this.ts.currTheme[key]);
        color.type = type;
        color.icon = key.endsWith('Fore') ? ThemeService.icons.fore : ThemeService.icons.back;
        color.themeKey = key;
        color.title = this.nameForColor(key);
        color.subtitle = '';
        this.colorList[key] = {
          title: this.nameForColor(key),
          colors: [color]
        };
        this.allColors.push(color);
        ret.push(key);
      }
    }
    this._listThemeKeys = ret;
    return ret;
  }

  get globals(): GlobalsData {
    return GLOBALS;
  }

  nameForColor(key: string): string {
    let ret = this.ts.colorNames[key] ?? `(${key})`;
    const check = new RegExp(/([a-z]*)([A-Z].*)/).exec(key)?.[1];
    if (check != null && this.mapping[check]?.title != null) {
      if (Utils.isEmpty(this.dlgData.colorKey)) {
        ret = `${this.mapping[check]?.title} - ${ret}`;
      }
    }
    return ret;
  }

  ngAfterViewInit(): void {
    this.orgTheme = Utils.jsonize(this.ts.currTheme);
  }

  colorChange(data: ColorDialogData) {
    this.ts.currTheme[data.colorList[data.colorIdx].themeKey] = this.value;
    this.ts.assignStyle(document.body.style, this.ts.currTheme);
    // if (this.color.endsWith('Back')) {
    //   this.ts.currTheme[`${this.color.replace(/Back/, 'Fore')}`] =
    //     this.valueFore;
    // }
    // if (this.color.indexOf('Head') >= 0) {
    //   const hsl = ColorUtils.rgb2hsl(ColorData.fromString(this.value).value);
    //   const h = hsl[0] / 124.48 * 122.57;
    //   const s = hsl[1] / 55.37 * 38.46;
    //   const l = hsl[2] / 23.73 * 64.31;
    //   this.ts.currTheme[`${this.color.replace(/Head/, 'Body')}`] =
    //     new ColorData(ColorUtils.hsl2rgb([Math.min(360, h),
    //       Math.min(100, s),
    //       Math.min(100, l)])).display;
    // }
  }

  onColorPicker(data: ColorDialogData) {
    const color = data.colorList[data.colorIdx];
    this.allColors = data.colorList;
    switch (data.action) {
      case 'open':
        this.dlgRef.addPanelClass('hidden');
        this.valueFore = ColorUtils.fontColor(color.value);
        this.value = color.display;
        this.colorChange(data);
        break;
      case 'colorChange':
        this.valueFore = ColorUtils.fontColor(color.value);
        this.value = color.display;
        this.colorChange(data);
        break;
      case 'close':
        for (const key of Object.keys(this.orgTheme)) {
          this.ts.currTheme[key] = this.orgTheme[key];
        }
        if (color.themeKey != null) {
          this.value = this.orgTheme[color.themeKey];
          this.colorChange(data);
        }
        this.dlgRef.removePanelClass('hidden');
        break;
      case 'closeOk':
        // resets internal list, so that the colors are read again
        this._listThemeKeys = null;
        this.ts.changed = true;
        this.dlgRef.removePanelClass('hidden');
        break;
      default:
        break;
    }
  }

  mayUseMapping(key: string): boolean {
    const check = new RegExp(/([a-z]*)([A-Z].*)/).exec(key)?.[1];
    if (check != null && this.mapping[check] != null) {
      return !(this.mapping[check]?.debugOnly ?? false) || Log.mayDebug;
    }
    return true;
  }

  colors(key: string): ColorData[] {
    const ret: ColorData[] = [];
    if (this.mapping[key]?.colors != null) {
      for (const c of this.mapping[key].colors) {
        const color = ColorData.fromString(this.ts.currTheme[`${this.dlgData.colorKey}${c.key}`]);
        color.icon = c.icon;
        ret.push(color);
      }
    } else {
      const subKey = key.substring(this.dlgData.colorKey.length);
      if (this.mapping[subKey] != null) {
        ret.push(ColorData.fromString(this.ts.currTheme[subKey]));
      } else {
        const c = ColorData.fromString(this.ts.currTheme[key]);
        if (key.endsWith('Back')) {
          c.icon = 'palette';
        } else if (key.endsWith('Fore') || key.endsWith('Data')) {
          c.icon = 'text_fields';
        }
        ret.push(c);
      }
    }
    return ret;
  }

  mapEntry(key: string, mayBeNull = false): any {
    return this.mapping[key] ?? (mayBeNull ? null : this.mapping.unknown);
  }

  colorName(key: string): string {
    // const ret = this.mapEntry(key, true)?.title;
    const ret = this.colorList[key]?.title;
    return ret ?? `(${key}) ${this.colorList[key].colors[0]?.themeKey}`;
  }

  styleForName(key: string): string[] {
    const ret: string[] = [];
    const check = new RegExp(/([a-z]*)([A-Z].*)*/).exec(key)?.[1];
    if (this.mapping[check]?.debugOnly ?? false) {
      ret.push('is-debug');
    }
    return ret;
  }

  storeTheme() {
    this.ts.storeTheme();
    this.ts.assignStyle(document.body.style, this.ts.currTheme);
    // const list = Object.keys(this.ts.currTheme);
    // list.sort();
    // let output: any = {};
    // for (const key of list) {
    //   if (this.ts.currTheme[key] != null) {
    //     output[key] = this.ts.currTheme[key];
    //   }
    // }
    // output = JSON.stringify(output);
    // const zip = new JSZip();
    // zip.file('t', output);
    // zip.generateAsync({type: 'blob', compression: 'DEFLATE'}).then(content => {
    //   content.arrayBuffer().then(c => {
    //     const t = encode(c);
    //     zip.loadAsync(t, {base64: true}).then(co => {
    //       co.file('t').async('string').then(ex => {
    //         console.log(JSON.parse(ex));
    //       });
    //     });
    //   });
    //   // saveAs(content, 'colors.zip');
    // });
  }

  clickSave() {
    this.dlgRef.close();
  }

  dragEnded(evt: CdkDragEnd) {
    GLOBALS.dragPos.colorCfg = evt.source.getFreeDragPosition();
  }
}
