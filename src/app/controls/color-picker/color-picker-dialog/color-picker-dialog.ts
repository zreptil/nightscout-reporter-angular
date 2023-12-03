import {AfterViewInit, Component, EventEmitter, Inject} from '@angular/core';
import {ColorData} from '@/_model/color-data';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {DialogResultButton} from '@/_model/dialog-data';
import {Utils} from '@/classes/utils';
import {ColorDialogData} from '@/controls/color-picker/color-picker.component';
import {ColorUtils} from '@/controls/color-picker/color-utils';
import {CloseButtonData} from '@/controls/close-button/close-button-data';
import {of} from 'rxjs';

@Component({
  templateUrl: './color-picker-dialog.html',
  styleUrls: ['./color-picker-dialog.scss']
})
export class ColorPickerDialog implements AfterViewInit {
  static modeList: ('hsl' | 'mixer' | 'image' | 'slider')[] = ['hsl', 'mixer', 'image', 'slider'];
  static iconList: { [key: string]: string } =
    {
      hsl: 'palette', mixer: 'blender', image: 'image', slider: 'toggle_on'
    };
  static _maxSavedColors = 12;
  fire = new EventEmitter<string>();
  defColor: ColorData;
  triggerValue: number[];
  closeData: CloseButtonData = {
    closeAction: () => {
      this.clickClose.bind(this);
      return of(true);
    }
  };

  constructor(public dialogRef: MatDialogRef<ColorPickerDialog>,
              @Inject(MAT_DIALOG_DATA) public data: ColorDialogData) {
    if (this.savedColors.length < 1) {
      this.savedColors.push(new ColorData([0, 0, 0]));
    }
    while (this.savedColors.length > ColorPickerDialog._maxSavedColors) {
      this.savedColors.splice(0, 1);
    }
    this.currColorIdx = ColorPickerDialog._savedColors.length - 1;
  }

  get currentColor(): ColorData {
    return this.savedColors[this._currColorIdx];
  }

  set currentColor(value: ColorData) {
    this.savedColors[this._currColorIdx] = value;
  }

  get modeIcon(): string {
    if (this.data.modeIcon != null) {
      this.fireMode();
      return this.data.modeIcon;
    }
    if (ColorPickerDialog.iconList[this.data.mode] == null) {
      this.data.mode = ColorPickerDialog.modeList[0];
      this.fireMode();
    }
    return ColorPickerDialog.iconList[this.data.mode];
  }

  static _savedColors: ColorData[] = [
    new ColorData([255, 0, 0]),
    new ColorData([255, 255, 0]),
    new ColorData([0, 255, 0]),
    new ColorData([0, 255, 255]),
    new ColorData([0, 0, 255]),
    new ColorData([255, 0, 255]),
    new ColorData([255, 0, 0]),
    new ColorData([0, 0, 0]),
    new ColorData([255, 255, 255]),
    new ColorData([0xff, 0x77, 0x77]),
    new ColorData([0x4d, 0, 0]),
    new ColorData([0xa0, 0xa0, 0xa0]),
    new ColorData([0, 0, 0]),
  ];

  get savedColors(): ColorData[] {
    if (ColorPickerDialog._savedColors == null) {
      ColorPickerDialog._savedColors = [];
    }
    ColorPickerDialog._savedColors.splice(ColorPickerDialog._maxSavedColors);
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

  iconForSave(color: ColorData): string {
    const idx = this.savedColors.findIndex(c => c.equals(color));
    if (idx >= 0 && idx < ColorPickerDialog._savedColors.length - 1) {
      return 'delete';
    }
    return 'add';
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.defColor = ColorData.fromString(this.data.color.display);
    });
    this.currentColor = this.data.color;
  }

  colorAddClick(value: ColorData) {
    const idx = this.savedColors.findIndex((c, i) => {
      return c.equals(value) && i !== this.currColorIdx;
    });
    if (idx >= 0) {
      if (this.currColorIdx < this.savedColors.length) {
        ColorPickerDialog._savedColors.splice(idx, 1);
        this.currColorIdx = ColorPickerDialog._savedColors.length - 1;
        return;
      }
    }
    this.currColorIdx = ColorPickerDialog._savedColors.length;
    while (ColorPickerDialog._savedColors.length > ColorPickerDialog._maxSavedColors) {
      ColorPickerDialog._savedColors.splice(0, 1);
    }
    if (this._currColorIdx >= ColorPickerDialog._savedColors.length) {
      this._currColorIdx = ColorPickerDialog._savedColors.length - 1;
    }
    this.savedColors[this._currColorIdx] = new ColorData(value.value, value.opacity);
  }

  classForCurrColor(idx: number): string[] {
    const ret = ['color'];
    if (this.currColorIdx === idx) {
      ret.push('current');
    }
    return ret;
  }

  resetClick(event: MouseEvent) {
    event?.stopPropagation();
    this.triggerValue = [...this.defColor.value, this.defColor.opacity];
    this.data.colorChange?.emit(this.currentColor);
  }

  colorClick(event: MouseEvent, color: ColorData, idx: number) {
    event.stopPropagation();
    if (this.currColorIdx !== idx) {
      this.triggerValue = [...color.value, color.opacity];
      this.data.colorChange?.emit(color);
    } else {
      this.colorAddClick(color);
    }
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

  clickClose() {
    this.resetClick(null);
    this.dialogRef.close({
      btn: DialogResultButton.cancel
    });
  }

  saveClick() {
    this.dialogRef.close({
      btn: DialogResultButton.ok
    });
  }
}
