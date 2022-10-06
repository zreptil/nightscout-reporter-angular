import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ColorData} from '@/_model/color-data';
import {MatDialog} from '@angular/material/dialog';
import {ColorPickerDialog} from '@/controls/color-picker/color-picker-dialog';
import {ColorMix} from '@/_model/color-mix-data';

export interface ColorDialogData {
  imageDataUrl: string;
  mode: string;
  onDataChanged: EventEmitter<ColorDialogData>;
  onDialogEvent: EventEmitter<ColorDialogData>;
  color: ColorData;
  colorChange: EventEmitter<ColorData>;
  maxFilesize: number;
  mixColors: ColorMix;
  savedColors: ColorData[];
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
  mode: string;

  @Input()
  color: ColorData;

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

  constructor(public dialog: MatDialog) {
  }

  clickActivate(_: MouseEvent) {
    const data = {
      imageDataUrl: this.imageDataUrl,
      onDataChanged: this.onDataChanged,
      onDialogEvent: this.onDialogEvent,
      color: this.color ?? new ColorData([255, 255, 255]),
      colorChange: this.colorChange,
      maxFilesize: this.maxFilesize,
      mixColors: this.mixColors,
      savedColors: this.savedColors ?? [],
      mode: this.mode,
      action: 'open'
    };
    this.onDialogEvent?.emit(data);
    const dlgRef = this.dialog.open(ColorPickerDialog, {
      data: data
    });
    dlgRef.componentInstance.fireMode();
    dlgRef.afterClosed().subscribe(data => {
      if (data == null) {
        data = {};
      }
      data.action = 'close';
      this.onDialogEvent?.emit(data);
    });
  }
}
