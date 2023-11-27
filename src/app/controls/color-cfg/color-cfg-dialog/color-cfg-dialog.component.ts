import {AfterViewInit, Component, Inject} from '@angular/core';
import {ColorDialogData} from '@/controls/color-picker/color-picker.component';
import {Utils} from '@/classes/utils';
import {ColorUtils} from '@/controls/color-picker/color-utils';
import {ColorData} from '@/_model/color-data';
import {ThemeService} from '@/_services/theme.service';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {MessageService} from '@/_services/message.service';
import {DialogResultButton} from '@/_model/dialog-data';
import {saveAs} from 'file-saver';

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
  currColorKey: string;
  // mapping for several strings
  mapping: any = {
    main: {title: $localize`Hauptseite`},
    unknown: {title: $localize`Unbekannt`, colors: [{key: ''}]},
    Head: {
      title: $localize`Titelbereich`, colors: [
        {key: 'HeadBack', icon: 'palette'},
        {key: 'HeadFore', icon: 'text_fields'},
      ]
    },
    Body: {
      title: $localize`Inhaltsbereich`, colors: [
        {key: 'BodyBack', icon: 'palette'},
        {key: 'BodyFore', icon: 'text_fields'},
      ]
    },
    ScrollThumb: {title: $localize`Scrollthumb`, colors: [{key: 'ScrollThumb'}]},
    Error: {title: $localize`Fehler`, colors: [{key: 'Error'}]},
  }

  colorList: any = {};

  constructor(private ts: ThemeService,
              private ms: MessageService,
              @Inject(MAT_DIALOG_DATA)
              public dlgData: { colorKey: string },
  ) {
  }

  get dialogTitle(): string {
    const ret = this.mapEntry(this.dlgData?.colorKey, true)?.title;
    return ret == null ? $localize`Farbanpassungen` : $localize`Farben für ` + ret;
  }

  _listThemeKeys: string[];

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
        let titleKey = subKey.replace(/Head/, '');
        titleKey = titleKey.replace(/Body/, '');
        const foreKey = subKey + 'Fore';
        const idx = keyList.indexOf(foreKey);
        if (idx >= 0) {
          add = false;
          keyList.splice(idx, 1);
          const back = ColorData.fromString(this.ts.currTheme[key]);
          back.icon = 'palette';
          const fore = ColorData.fromString(this.ts.currTheme[foreKey]);
          fore.icon = 'text_fields';
          this.colorList[subKey] = {
            title: titleKey,
            colors: [back, fore]
          };
          ret.push(subKey);
        }
      }
      if (add) {
        const color = ColorData.fromString(this.ts.currTheme[key]);
        color.icon = 'palette';
        this.colorList[key] = {
          title: key,
          colors: [color]
        };
        ret.push(key);
      }
      // if (!Utils.isEmpty(this.dlgData.colorKey) && key.startsWith(this.dlgData.colorKey)) {
      //   if (key.endsWith('HeadBack')) {
      //     ret.push('Head');
      //   } else if (key.endsWith('BodyBack')) {
      //     ret.push('Body');
      //   } else if (key.endsWith('HeadFore') || key.endsWith('BodyFore')) {
      //     // HeadFore and BodyFore will be processed with according Back
      //   } else {
      //     // ret.push(key);
      //   }
      // } else {
      // }
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

  colorChange(_evt: any) {
    this.ts.currTheme[this.currColorKey] = this.value;
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
    this.ts.assignStyle(document.body.style, this.ts.currTheme);
  }

  onColorPicker(data: ColorDialogData) {
    console.log(data);
    switch (data.action) {
      case 'open':
      case 'colorChange':
        this.valueFore = ColorUtils.fontColor(data.color.value);
        this.value = `#${ColorUtils.rgb2string(data.color.value)}`;
        this.colorChange(null);
        break;
      case 'close':
        console.log(data);
        break;
      default:
        break;
    }
  }

  updateDialogData(data: any): void {
    data.color = this.color(this.currColorKey);
  }

  resetTheme() {
    this.ms.confirm($localize`Hiermit werden alle Farben auf den Standard gesetzt. Soll das durchgeführt werden?`)
      .subscribe(result => {
        switch (result?.btn) {
          case DialogResultButton.yes:
            for (const key of Object.keys(this.orgTheme)) {
              this.ts.currTheme[key] = this.orgTheme[key];
            }
            this.ts.assignStyle(document.body.style, this.ts.currTheme);
            break;
        }
      });
  }

  color(key: string) {
    return ColorData.fromString(this.ts.currTheme[key]);
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
    return ret == null ? `(${key})` : `${ret} (${key})`;
  }

  saveTheme() {
    const list = Object.keys(this.ts.currTheme);
    list.sort();
    const output: any = {};
    for (const key of list) {
      if (this.ts.currTheme[key] != null) {
        output[key] = this.ts.currTheme[key];
      }
    }
    // this.ms.info(JSON.stringify(output));
    saveAs(new Blob([JSON.stringify(output)]), 'colors.json');
    this.ts.assignStyle(document.body.style, this.ts.currTheme);
  }
}
