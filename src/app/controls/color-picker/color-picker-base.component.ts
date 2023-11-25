import {AfterViewInit, Component, EventEmitter, Input, Output} from '@angular/core';
import {ColorDialogData} from '@/controls/color-picker/color-picker.component';
import {ColorData} from '@/_model/color-data';

@Component({
  template: ``
})
export class ColorPickerBaseComponent implements AfterViewInit {
  @Input()
  data: ColorDialogData;
  @Output()
  colorChange = new EventEmitter<ColorData>();
  @Output()
  colorSaveClick = new EventEmitter<ColorData>();
  // If this method is available it will be called.
  @Input()
  parentClick: EventEmitter<string>;

  constructor() {
  }

  // Can be used to redirect actions from the parent component
  // to this component. When parentClick is received the
  // component looks for a method named parentFiredXXX, where
  // XXX has to be the same as the paramter received in parentClick.

  _color: ColorData;

  get color(): ColorData {
    return this._color;
  }

  @Input()
  set color(value: ColorData) {
    this._color = value;
  }

  ngAfterViewInit(): void {
    this.parentClick?.subscribe(cmd => {
      (this as any)[`parentFired${cmd}`]?.();
    });
  }
}
