import {Component, EventEmitter, Inject} from '@angular/core';
import {ColorData} from '@/_model/color-data';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {DialogResultButton} from '@/_model/dialog-data';
import {Utils} from '@/classes/utils';
import {ColorDialogData} from '@/controls/color-picker/color-picker.component';
import {ColorUtils} from '@/controls/color-picker/color-utils';

@Component({
  templateUrl: './color-picker-dialog.html',
  styleUrls: ['./color-picker-dialog.scss']
})
export class ColorPickerDialog {
  static modeList: ('hsl' | 'mixer' | 'image' | 'slider')[] = ['hsl', 'mixer', 'image', 'slider'];
  static iconList: { [key: string]: string } =
    {
      hsl: 'palette', mixer: 'blender', image: 'image', slider: 'toggle_on'
    };
  isActive = false;

  fire = new EventEmitter<string>();

  constructor(public dialogRef: MatDialogRef<ColorPickerDialog>,
              @Inject(MAT_DIALOG_DATA) public data: ColorDialogData) {
    if (ColorPickerDialog._savedColors.length < 1) {
      this.savedColors.push(new ColorData([0, 0, 0]));
    }
    this.currColorIdx = ColorPickerDialog._savedColors.length - 1;
    this.currentColor = data.color;
  }

  get currentColor(): ColorData {
    return this.savedColors[this._currColorIdx];
  }

  set currentColor(value: ColorData) {
    this.savedColors[this._currColorIdx] = value;
  }

  get modeIcon(): string {
    if (ColorPickerDialog.iconList[this.data.mode] == null) {
      this.data.mode = ColorPickerDialog.modeList[0];
      this.fireMode();
    }
    return ColorPickerDialog.iconList[this.data.mode];
  }

  static _savedColors: ColorData[] = [];

  get savedColors(): ColorData[] {
    if (ColorPickerDialog._savedColors == null) {
      ColorPickerDialog._savedColors = [];
    }
    if (ColorPickerDialog._savedColors.length < 0) {
      ColorPickerDialog._savedColors.push(new ColorData([0, 0, 0]));
    }
    return ColorPickerDialog._savedColors;
  }

  set savedColors(value: ColorData[]) {
    ColorPickerDialog._savedColors = value;
    if (this.savedColors.length < this.currColorIdx) {
      this.currColorIdx = this.savedColors.length - 1;
    }
  }

  _currColorIdx: number = 0;

  get currColorIdx(): number {
    return this._currColorIdx;
  }

  set currColorIdx(value: number) {
    if (value < 0) {
      value = 0;
    }
    if (value >= this.savedColors.length) {
      value = ColorPickerDialog._savedColors.length;
      if (this._currColorIdx < ColorPickerDialog._savedColors.length) {
        ColorPickerDialog._savedColors.push(ColorPickerDialog._savedColors[this._currColorIdx]);
      } else {
        ColorPickerDialog._savedColors.push(new ColorData([0, 0, 0]))
      }
    }
    this._currColorIdx = value;
  }

  get styleForSaveIcon(): any {
    return {
      color: ColorUtils.fontColor(this.currentColor.value)
    };
  }

  colorSaveClick(value: ColorData) {
    const idx = this.savedColors.findIndex((c, i) => {
      return c.equals(value) && i !== this.currColorIdx;
    });
    if (idx >= 0) {
      if (this.currColorIdx < this.savedColors.length) {
        ColorPickerDialog._savedColors.splice(this.currColorIdx, 1);
      }
      this.currColorIdx = idx;
    } else {
      this.currColorIdx = ColorPickerDialog._savedColors.length;
    }
    while (ColorPickerDialog._savedColors.length > 10) {
      ColorPickerDialog._savedColors.splice(0, 1);
    }
    if (this._currColorIdx >= ColorPickerDialog._savedColors.length) {
      this._currColorIdx = ColorPickerDialog._savedColors.length - 1;
    }
    this.savedColors[this._currColorIdx] = value;
  }

  classForCurrColor(idx: number): string[] {
    const ret = ['color'];
    if (this.currColorIdx === idx) {
      ret.push('current');
    }
    return ret;
  }

  colorClick(event: MouseEvent, color: ColorData, idx?: number) {
    event.stopPropagation();
    if (idx == null) {
      this.currentColor = color;
    } else if (this.currColorIdx !== idx) {
      this.isActive = false;
      this.data.colorChange?.emit(color);
      this.dialogRef.close();
    } else {
      this.colorSaveClick(color);
    }
  }

  clickClose() {
    this.dialogRef.close({
      btn: DialogResultButton.cancel
    });
  }

  fireMode(): void {
    this.data.action = `mode-${this.data.mode}`;
    this.data.onDialogEvent?.emit(this.data);
  }

  fireChange(evt: any): void {
    this.data.action = 'colorChange';
    this.data.onDialogEvent?.emit({...this.data, color: evt});
  }

  clickMode() {
    this.data.mode = Utils.nextListItem(this.data.mode, this.data.modeList) as any;
    this.fireMode();
    this.data.onDataChanged?.emit(this.data);
  }
}
