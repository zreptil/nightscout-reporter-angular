import {AfterViewInit, Component, EventEmitter, Inject} from '@angular/core';
import {ColorData} from '@/_model/color-data';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {DialogResultButton} from '@/_model/dialog-data';
import {Utils} from '@/classes/utils';
import {ColorDialogData} from '@/controls/color-picker/color-picker.component';
import {ColorUtils} from '@/controls/color-picker/color-utils';
import {CloseButtonData} from '@/controls/close-button/close-button-data';
import {of} from 'rxjs';
import {ThemeService} from '@/_services/theme.service';
import {CdkDragEnd} from '@angular/cdk/drag-drop';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';

@Component({
  templateUrl: './color-picker-dialog.html',
  styleUrls: ['./color-picker-dialog.scss'],
  standalone: false
})
export class ColorPickerDialog implements AfterViewInit {
  static modeList: ('hsl' | 'mixer' | 'image' | 'slider')[] = ['hsl', 'mixer', 'image', 'slider'];
  static iconList: { [key: string]: string } =
    {
      hsl: 'palette', mixer: 'blender', image: 'image', slider: 'toggle_on'
    };
  static _maxSavedColors = 12;
  fire = new EventEmitter<string>();
  _stdColor: ColorData;
  triggerValue: number[];
  closeData: CloseButtonData = {
    closeAction: () => {
      this.clickClose.bind(this);
      return of(true);
    }
  };
  title = {main: '', sub: ''};

  constructor(public dialogRef: MatDialogRef<ColorPickerDialog>,
              public ts: ThemeService,
              @Inject(MAT_DIALOG_DATA) public data: ColorDialogData) {
    if (this.savedColors.length < 1) {
      this.savedColors.push(new ColorData([0, 0, 0]));
    }
    while (this.savedColors.length > ColorPickerDialog._maxSavedColors) {
      this.savedColors.splice(0, 1);
    }
    this.currSavedIdx = ColorPickerDialog._savedColors.length - 1;
    this.updateTitle();
  }

  _defColor: ColorData;

  get defColor(): ColorData {
    if (this._defColor?.equals(this.currentColor) && this.currentColor.themeKey != null) {
      const c = this.ts.stdTheme[this.currentColor.themeKey];
      return ColorData.fromString(c);
    }
    return this._defColor;
  }

  set defColor(value: ColorData) {
    this._defColor = value;
  }

  get currentColor(): ColorData {
    return this.savedColors[this._currSavedIdx];
  }

  set currentColor(value: ColorData) {
    this.savedColors[this._currSavedIdx] = value;
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
    new ColorData([0, 0, 0]),
    new ColorData([255, 255, 255]),
    new ColorData([0x87, 0x07, 0x07]),
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
    if (this.savedColors.length < this.currSavedIdx) {
      this.currSavedIdx = this.savedColors.length - 1;
    }
  }

  _currSavedIdx: number = 0;

  get currSavedIdx(): number {
    return this._currSavedIdx;
  }

  set currSavedIdx(value: number) {
    if (value < 0) {
      value = 0;
    }
    if (value >= this.savedColors.length) {
      value = ColorPickerDialog._savedColors.length;
      if (this._currSavedIdx < ColorPickerDialog._savedColors.length) {
        ColorPickerDialog._savedColors.push(ColorPickerDialog._savedColors[this._currSavedIdx]);
      } else {
        ColorPickerDialog._savedColors.push(new ColorData([0, 0, 0]))
      }
    }
    this._currSavedIdx = value;
  }

  get styleForSaveIcon(): any {
    return {
      color: ColorUtils.fontColor(this.currentColor.value)
    };
  }

  get globals(): GlobalsData {
    return GLOBALS;
  }

  updateTitle(): void {
    setTimeout(() => {
      const color = this.data.colorList[this.data.colorIdx];
      this.title.main = color?.title ?? color?.themeKey ?? $localize`Farbauswahl`;
      this.title.sub = color?.subtitle ?? '';
    });
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
      this.updateDefColor();
    });
    this.currentColor = this.data.colorList[this.data.colorIdx];
  }

  updateDefColor(): void {
    this.defColor = ColorData.fromString(this.data.colorList[this.data.colorIdx].display);
  }

  colorAddClick(value: ColorData) {
    const idx = this.savedColors.findIndex((c, i) => {
      return c.equals(value) && i !== this.currSavedIdx;
    });
    if (idx >= 0) {
      if (this.currSavedIdx < this.savedColors.length) {
        ColorPickerDialog._savedColors.splice(idx, 1);
        this.currSavedIdx = ColorPickerDialog._savedColors.length - 1;
        return;
      }
    }
    this.currSavedIdx = ColorPickerDialog._savedColors.length;
    while (ColorPickerDialog._savedColors.length > ColorPickerDialog._maxSavedColors) {
      ColorPickerDialog._savedColors.splice(0, 1);
    }
    if (this._currSavedIdx >= ColorPickerDialog._savedColors.length) {
      this._currSavedIdx = ColorPickerDialog._savedColors.length - 1;
    }
    this.savedColors[this._currSavedIdx] = new ColorData(value.value, value.opacity);
  }

  classForSavedColor(idx: number): string[] {
    const ret = ['color'];
    if (this.currSavedIdx === idx) {
      ret.push('current');
    }
    return ret;
  }

  resetClick(event: MouseEvent) {
    event?.stopPropagation();
    this.triggerValue = [...this.defColor.value, this.defColor.opacity];
    this.data.colorChange?.emit(this.data);
  }

  colorClick(event: MouseEvent, color: ColorData, idx: number) {
    event.stopPropagation();
    if (this.currSavedIdx !== idx) {
      this.data.colorList[this.data.colorIdx].update(color.value, color.opacity);
      this.triggerValue = [...color.value, color.opacity];
      this.data.colorChange?.emit(this.data);
    } else {
      this.colorAddClick(color);
    }
  }

  fireMode(): void {
    this.data.action = `mode-${this.data.mode}`;
    this.data.onDialogEvent?.emit(this.data);
  }

  fireChange(evt: any): void {
    // don't fire for a color that is not in the data
    if (this.data.colorList[this.data.colorIdx].themeKey === evt.themeKey) {
      this.data.action = 'colorChange';
      this.data.colorList[this.data.colorIdx] = evt;
      this.data.onDialogEvent?.emit(this.data);
    }
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

  clickNextColor(diff: number) {
    let idx = this.data.colorIdx + diff;
    if (idx < 0) {
      idx = this.data.colorList.length - 1;
    }
    if (idx >= this.data.colorList.length) {
      idx = 0;
    }
    this.data.colorIdx = idx;
    this.updateDefColor();
    this.updateTitle();
    this.currentColor = this.data.colorList[this.data.colorIdx];
    this.fireChange(this.currentColor);
  }

  dragEnded(evt: CdkDragEnd) {
    GLOBALS.dragPos.colorPicker = evt.source.getFreeDragPosition();
  }
}
