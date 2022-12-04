import {Component, EventEmitter, Inject} from '@angular/core';
import {ColorData} from '@/_model/color-data';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {DialogResultButton} from '@/_model/dialog-data';
import {Utils} from '@/classes/utils';
import {ColorDialogData} from '@/controls/color-picker/color-picker.component';

@Component({
  templateUrl: './color-picker-dialog.html',
  styleUrls: ['./color-picker-dialog.scss']
})
export class ColorPickerDialog {
  static modeList = ['mixer', 'image', 'rgb'];
  isActive = false;

  fire = new EventEmitter<string>();

  constructor(public dialogRef: MatDialogRef<ColorPickerDialog>,
              @Inject(MAT_DIALOG_DATA) public data: ColorDialogData) {
    if (data.savedColors.length < 1) {
      this.savedColors.push(new ColorData([0, 0, 0]));
    }
    this.currColorIdx = data.savedColors.length - 1;
  }

  get currentColor(): ColorData {
    return this.savedColors[this._currColorIdx];
  }

  set currentColor(value: ColorData) {
    this.savedColors[this._currColorIdx] = value;
  }

  get modeIcon(): string {
    const iconList: { [key: string]: string } = {mixer: 'blender', image: 'image', rgb: 'palette'};
    if (iconList[this.data.mode] == null) {
      this.data.mode = ColorPickerDialog.modeList[0];
      this.fireMode();
    }
    return iconList[this.data.mode];
  }

  get savedColors(): ColorData[] {
    if (this.data.savedColors == null) {
      this.data.savedColors = [];
    }
    if (this.data.savedColors.length < 0) {
      this.data.savedColors.push(new ColorData([0, 0, 0]));
    }
    return this.data.savedColors;
  }

  set savedColors(value: ColorData[]) {
    this.data.savedColors = value;
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
      value = this.data.savedColors.length;
      if (this._currColorIdx < this.data.savedColors.length) {
        this.data.savedColors.push(this.data.savedColors[this._currColorIdx]);
      } else {
        this.data.savedColors.push(new ColorData([0, 0, 0]))
      }
    }
    this._currColorIdx = value;
  }

  currentColorClick(value: ColorData) {
    const idx = this.savedColors.findIndex((c, i) => {
      return c.equals(value) && i !== this.currColorIdx;
    });
    if (idx >= 0) {
      if (this.currColorIdx < this.savedColors.length) {
        this.data.savedColors.splice(this.currColorIdx, 1);
      }
      this.currColorIdx = idx;
    } else {
      this.currColorIdx = this.data.savedColors.length;
    }
    while (this.data.savedColors.length > 10) {
      this.data.savedColors.splice(0, 1);
    }
    if (this._currColorIdx >= this.data.savedColors.length) {
      this._currColorIdx = this.data.savedColors.length - 1;
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

  colorClick(event: MouseEvent, color: ColorData) {
    event.stopPropagation();
    this.isActive = false;
    this.data.colorChange?.emit(color);
    this.dialogRef.close();
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

  clickMode() {
    this.data.mode = Utils.nextListItem(this.data.mode, ColorPickerDialog.modeList);
    this.fireMode();
    this.data.onDataChanged?.emit(this.data);
  }
}
