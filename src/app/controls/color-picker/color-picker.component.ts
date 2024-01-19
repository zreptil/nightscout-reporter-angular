import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ColorData} from '@/_model/color-data';
import {MatDialog} from '@angular/material/dialog';
import {ColorPickerDialog} from '@/controls/color-picker/color-picker-dialog/color-picker-dialog';
import {ColorMix} from '@/_model/color-mix-data';
import {DialogResultButton} from '@/_model/dialog-data';
import {ThemeData} from '@/_model/theme-data';

export interface ColorDialogData {
  imageDataUrl: string;
  mode: 'hsl' | 'image' | 'mixer' | 'slider';
  modeList: string[];
  modeIcon?: string,
  onDataChanged: EventEmitter<ColorDialogData>;
  onDialogEvent: EventEmitter<ColorDialogData>;
  colorIdx: number;
  colorChange: EventEmitter<ColorDialogData>;
  colorList: ColorData[];
  maxFilesize: number;
  mixColors: ColorMix;
  action: string;
}

@Component({
  selector: 'app-color-picker',
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.scss']
})
export class ColorPickerComponent {
  @Output()
  onDataChanged = new EventEmitter<ColorDialogData>();
  @Input()
  imageDataUrl: string;
  @Input()
  mode: 'hsl' | 'mixer' | 'image' | 'slider';
  @Input()
  modeList: string;
  @Output()
  colorChange = new EventEmitter<ColorDialogData>();
  @Input()
  maxFilesize = 1000000;
  @Input()
  savedColors: ColorData[];
  @Input()
  mixColors: ColorMix;
  @Output()
  onDialogEvent = new EventEmitter<ColorDialogData>();
  @Input()
  updateDialogData: (data: any) => void;
  @Input() allColors: ColorData[];

  constructor(public dialog: MatDialog) {
    this.mixColors = ColorMix.fromJson({})
  }

  _colors: ColorData[];

  get colors(): ColorData[] {
    return this._colors;
  }

  @Input()
  set colors(value: ColorData[]) {
    for (const c of value) {
      c.btnBackColor = c.display;
      c.btnForeColor = c.fontDisplay;
      if (!c.isBackColor) {
        c.btnBackColor = value.find(c => c.icon === ThemeData.icons.back).display;
        c.btnForeColor = c.display;
      }
    }
    // let back = value.find(c => c.icon === ThemeService.icons.back);
    // let fore = value.find(c => c.icon === ThemeService.icons.fore);
    // let link = value.find(c => c.icon === ThemeService.icons.link);
    // if (back != null && fore != null) {
    //   back.btnBackColor = back.display;
    //   back.btnForeColor = fore.display;
    //   fore.btnBackColor = back.display;
    //   fore.btnForeColor = fore.display;
    //   if (link != null) {
    //     link.btnBackColor = back.display;
    //     link.btnForeColor = link.display;
    //   }
    // }
    this._colors = value;
  }

  clickActivate(idx: number) {
    const data: ColorDialogData = {
      imageDataUrl: this.imageDataUrl,
      onDataChanged: this.onDataChanged,
      onDialogEvent: this.onDialogEvent,
      colorIdx: idx,
      colorChange: this.colorChange,
      maxFilesize: this.maxFilesize,
      mixColors: this.mixColors,
      modeList: ColorPickerDialog.modeList,
      mode: this.mode,
      action: 'open',
      colorList: this.colors
    };
    if (this.allColors != null) {
      data.colorList = this.allColors;
      data.colorIdx = this.allColors.findIndex(c => c.themeKey === this.colors[idx].themeKey) ?? 0;
    }
    if (this.modeList != null) {
      data.modeList = this.modeList.split(',') as any;
    }
    if (data.modeList.indexOf(data.mode) < 0) {
      data.mode = (data.modeList[0] as any) ?? 'hsl';
    }
    this.onDialogEvent?.emit(data);
    this.updateDialogData?.(data);
    data.modeIcon = data.colorList[idx]?.icon;
    const dlgRef = this.dialog.open(ColorPickerDialog, {
      data: data,
      panelClass: ['dialog-box', 'settings'],
      disableClose: true
    });
    dlgRef.componentInstance.fireMode();
    dlgRef.afterClosed().subscribe(response => {
      if (response?.btn === DialogResultButton.ok) {
        data.action = 'closeOk';
      } else {
        data.action = 'close';
      }
      this.onDialogEvent?.emit(data);
    });
  }
}
