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
    // main: {title: $localize`Hauptseite`},
    // unknown: {title: $localize`Unbekannt`, colors: [{key: ''}]},
    // Head: {
    //   title: $localize`Titelbereich`, colors: [
    //     {key: 'HeadBack', icon: 'palette'},
    //     {key: 'HeadFore', icon: 'text_fields'},
    //   ]
    // },
    // Body: {
    //   title: $localize`Inhaltsbereich`, colors: [
    //     {key: 'BodyBack', icon: 'palette'},
    //     {key: 'BodyFore', icon: 'text_fields'},
    //   ]
    // },
    // ScrollThumb: {title: $localize`Scrollthumb`, colors: [{key: 'ScrollThumb'}]},
    // Error: {title: $localize`Fehler`, colors: [{key: 'Error'}]},
  }

  colorList: any = {};

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
        if (this.ts.currTheme[key] !== this.orgTheme[key]) {
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
    const src = {...this.ts.currTheme};
    let keyList = Object.keys(src).sort();
    this.colorList = {};
    if (!Utils.isEmpty(this.dlgData.colorKey)) {
      keyList = keyList.filter(k => k.startsWith(this.dlgData.colorKey));
    }
    for (const key of keyList) {
      if (skip.indexOf(key) >= 0) {
        continue;
      }
      let add = true;
      if (key.endsWith('Back')) {
        const subKey = key.substring(0, key.length - 4);
        let titleKey = subKey; // subKey.replace(/Head/, '');
        // titleKey = titleKey.replace(/Body/, '');
        const foreKey = subKey + 'Fore';
        const idx = keyList.indexOf(foreKey);
        if (idx >= 0) {
          add = false;
          keyList.splice(idx, 1);
          const back = ColorData.fromString(this.ts.currTheme[key]);
          back.icon = 'palette';
          back.themeKey = key;
          const fore = ColorData.fromString(this.ts.currTheme[foreKey]);
          fore.icon = 'text_fields';
          fore.themeKey = foreKey;
          this.colorList[subKey] = {
            title: this.ts.colorNames[titleKey] ?? `(${titleKey})`,
            colors: [back, fore]
          };
          ret.push(subKey);
        }
      }
      if (add) {
        const color = ColorData.fromString(this.ts.currTheme[key]);
//        console.log(key, this.ts.currTheme[key], color);
        color.icon = 'palette';
        color.themeKey = key;
        this.colorList[key] = {
          title: this.ts.colorNames[key] ?? `(${key})`,
          colors: [color]
        };
        ret.push(key);
      }
    }
    this._listThemeKeys = ret;
    return ret;
  }

  get globals(): GlobalsData {
    return GLOBALS;
  }

  ngAfterViewInit(): void {
    this.orgTheme = Utils.jsonize(this.ts.currTheme);
  }

  colorChange(data: ColorDialogData) {
    this.ts.currTheme[data.color.themeKey] = this.value;
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
    switch (data.action) {
      case 'open':
        this.dlgRef.addPanelClass('hidden');
        this.valueFore = ColorUtils.fontColor(data.color.value);
        this.value = data.color.display;
        this.colorChange(data);
        break;
      case 'colorChange':
        this.valueFore = ColorUtils.fontColor(data.color.value);
        this.value = data.color.display;
        this.colorChange(data);
        break;
      case 'close':
        if ((data as any).btn === DialogResultButton.ok) {
          console.log('habs', data, this.colorList);
          this._listThemeKeys = null;
        }
        this.dlgRef.removePanelClass('hidden');
        break;
      default:
        break;
    }
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
        } else if (key.endsWith('Fore')) {
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

  downloadTheme() {
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
}