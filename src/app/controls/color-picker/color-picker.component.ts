import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ColorData} from '@/_model/color-data';
import {MatDialog} from '@angular/material/dialog';
import {ColorPickerDialog} from '@/controls/color-picker/color-picker-dialog';
import {ColorMix} from '@/_model/color-mix-data';

export interface ColorDialogData {
  imageDataUrl: string;
  mode: 'hsl' | 'image' | 'mixer' | 'slider';
  modeList: string[];
  onDataChanged: EventEmitter<ColorDialogData>;
  onDialogEvent: EventEmitter<ColorDialogData>;
  color: ColorData;
  colorChange: EventEmitter<ColorData>;
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
  colorChange = new EventEmitter<ColorData>();
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
    }
    let back = value.find(c => c.icon === 'palette');
    let fore = value.find(c => c.icon === 'text_fields');
    if (back != null && fore != null) {
      back.btnBackColor = back.display;
      back.btnForeColor = fore.display;
      fore.btnBackColor = back.display;
      fore.btnForeColor = fore.display;
    }
    this._colors = value;
  }

  clickActivate(color: ColorData) {
    const data: ColorDialogData = {
      imageDataUrl: this.imageDataUrl,
      onDataChanged: this.onDataChanged,
      onDialogEvent: this.onDialogEvent,
      color: color ?? new ColorData([255, 255, 255]),
      colorChange: this.colorChange,
      maxFilesize: this.maxFilesize,
      mixColors: this.mixColors,
      modeList: ColorPickerDialog.modeList,
      mode: this.mode,
      action: 'open'
    };
    if (this.modeList != null) {
      data.modeList = this.modeList.split(',') as any;
    }
    if (data.modeList.indexOf(data.mode) < 0) {
      data.mode = (data.modeList[0] as any) ?? 'hsl';
    }
    this.onDialogEvent?.emit(data);
    this.updateDialogData?.(data);
    const dlgRef = this.dialog.open(ColorPickerDialog, {
      data: data,
      panelClass: ['dialog-box', 'settings']
    });
    dlgRef.componentInstance.fireMode();
    dlgRef.afterClosed().subscribe(response => {
      if (response == null) {
        response = {};
      }
      response.action = 'close';
      response.color = data.color;
      this.onDialogEvent?.emit(response);
    });
  }
}
